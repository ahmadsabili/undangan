"use client";

import { MEDIA_BUCKET } from "@/lib/env";
import { sanitizeSvg } from "@/lib/sanitize";
import type { MediaAsset } from "@/types/invitation";
import { db } from "./admin";

export const LIMITS = {
  image: { types: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/svg+xml"], max: 15 * 1024 * 1024 },
  audio: { types: ["audio/mpeg", "audio/mp4", "audio/aac", "audio/ogg", "audio/wav", "audio/webm", "audio/x-m4a"], max: 15 * 1024 * 1024 },
  video: { types: ["video/mp4", "video/webm"], max: 50 * 1024 * 1024 },
} as const;

export type MediaKind = keyof typeof LIMITS;

export function kindOf(file: File): MediaKind | null {
  for (const k of Object.keys(LIMITS) as MediaKind[]) if ((LIMITS[k].types as readonly string[]).includes(file.type)) return k;
  return null;
}

export function validateFile(file: File, want?: MediaKind): string | null {
  const kind = kindOf(file);
  if (!kind) return `${file.name}: tipe file tidak didukung.`;
  if (want && kind !== want) return `${file.name}: harus berupa ${want === "image" ? "gambar" : want === "audio" ? "audio" : "video"}.`;
  if (file.size > LIMITS[kind].max) return `${file.name}: melebihi batas ${Math.round(LIMITS[kind].max / 1024 / 1024)} MB.`;
  return null;
}

async function imageSize(blob: Blob): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function videoSize(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;
    await new Promise((res, rej) => {
      v.onloadedmetadata = res;
      v.onerror = rej;
    });
    return { width: v.videoWidth, height: v.videoHeight };
  } catch {
    return { width: 1280, height: 720 };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Kompres foto ke WebP (sisi terpanjang maks 2400px). SVG dibersihkan, GIF dibiarkan. */
export async function prepareImage(file: File): Promise<{ blob: Blob; type: string; ext: string; width: number; height: number }> {
  if (file.type === "image/svg+xml") {
    const clean = sanitizeSvg(await file.text());
    const blob = new Blob([clean], { type: "image/svg+xml" });
    const size = await imageSize(blob).catch(() => ({ width: 512, height: 512 }));
    return { blob, type: "image/svg+xml", ext: "svg", ...size };
  }
  if (file.type === "image/gif") return { blob: file, type: file.type, ext: "gif", ...(await imageSize(file)) };

  const bitmap = await createImageBitmap(file);
  const max = 2400;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/webp", 0.82));
  if (!blob || (blob.size > file.size && scale === 1)) {
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    return { blob: file, type: file.type, ext, width, height };
  }
  return { blob, type: "image/webp", ext: "webp", width, height };
}

function path(kind: MediaKind, ext: string) {
  const d = new Date();
  return `${kind}/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${ext}`;
}

async function putFile(file: File) {
  const kind = kindOf(file)!;
  let blob: Blob = file;
  let type = file.type;
  let ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  let width: number | null = null;
  let height: number | null = null;
  if (kind === "image") {
    const p = await prepareImage(file);
    ({ blob, type, ext, width, height } = p);
  } else if (kind === "video") {
    ({ width, height } = await videoSize(file));
  }
  const storagePath = path(kind, ext);
  const supabase = db();
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(storagePath, blob, { contentType: type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(`Upload gagal: ${error.message}`);
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);
  return { kind, storagePath, url: data.publicUrl, type, size: blob.size, width, height };
}

export async function uploadMedia(file: File, alt = ""): Promise<MediaAsset> {
  const f = await putFile(file);
  const { data: user } = await db().auth.getUser();
  const { data, error } = await db()
    .from("media_assets")
    .insert({
      storage_path: f.storagePath,
      url: f.url,
      kind: f.kind,
      mime_type: f.type,
      size_bytes: f.size,
      width: f.width,
      height: f.height,
      alt: alt || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
      created_by: user.user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) {
    await db().storage.from(MEDIA_BUCKET).remove([f.storagePath]);
    throw new Error(error.message);
  }
  return data as MediaAsset;
}

/** Ganti file media tanpa mengubah ID-nya, sehingga semua section yang memakainya ikut berubah. */
export async function replaceMedia(asset: MediaAsset, file: File): Promise<MediaAsset> {
  const err = validateFile(file, asset.kind as MediaKind);
  if (err) throw new Error(err);
  const f = await putFile(file);
  const { data, error } = await db()
    .from("media_assets")
    .update({ storage_path: f.storagePath, url: f.url, mime_type: f.type, size_bytes: f.size, width: f.width, height: f.height })
    .eq("id", asset.id)
    .select("*")
    .single();
  if (error) {
    await db().storage.from(MEDIA_BUCKET).remove([f.storagePath]);
    throw new Error(error.message);
  }
  // File lama tetap disimpan bila versi terpublikasi masih memakainya (URL lama ada di snapshot).
  const usage = await db().rpc("media_usage", { p_id: asset.id });
  const usedByPublished = Array.isArray(usage.data) && usage.data.includes("Versi terpublikasi");
  if (asset.storage_path && !usedByPublished) await db().storage.from(MEDIA_BUCKET).remove([asset.storage_path]);
  return data as MediaAsset;
}
