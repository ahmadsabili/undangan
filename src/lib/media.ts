import type { InvitationData, MediaAsset } from "@/types/invitation";

export function getMedia(data: Pick<InvitationData, "media">, id: unknown): MediaAsset | null {
  if (typeof id !== "string" || !id) return null;
  return data.media[id] ?? null;
}

export function isRaster(m: MediaAsset | null | undefined) {
  return Boolean(m && m.kind === "image" && m.mime_type !== "image/svg+xml" && !m.url.endsWith(".svg"));
}

export function absoluteUrl(url: string, siteUrl: string) {
  if (/^https?:\/\//.test(url)) return url;
  return siteUrl.replace(/\/$/, "") + (url.startsWith("/") ? url : "/" + url);
}

export function youtubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  return m ? m[1] : null;
}
