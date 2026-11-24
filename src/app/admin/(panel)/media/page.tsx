"use client";

import { Crosshair, RefreshCw, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { MediaThumb, useMediaList } from "@/components/admin/MediaPicker";
import { Badge, Button, Card, Dialog, EmptyState, ErrorState, Field, Input, LoadingBlock, PageHeader, Select, useConfirm, useToast } from "@/components/ui";
import { MEDIA_BUCKET } from "@/lib/env";
import { cn, formatBytes } from "@/lib/utils";
import { db, emitDraftChanged, errMessage } from "@/services/admin";
import { replaceMedia, uploadMedia, validateFile, type MediaKind } from "@/services/media-upload";
import type { MediaAsset } from "@/types/invitation";

export default function MediaPage() {
  const [kind, setKind] = useState<MediaKind | "">("");
  const { items, error, reload, setItems } = useMediaList(kind || undefined);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [drag, setDrag] = useState(false);
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();

  async function onFiles(files: FileList | File[] | null) {
    const list = Array.from(files ?? []);
    if (!list.length) return;
    setUploading({ done: 0, total: list.length });
    let ok = 0;
    for (const f of list) {
      const err = validateFile(f);
      if (err) toast("error", err);
      else {
        try {
          const m = await uploadMedia(f);
          setItems((prev) => [m, ...(prev ?? [])]);
          ok++;
        } catch (e) {
          toast("error", `${f.name}: ${errMessage(e)}`);
        }
      }
      setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
    }
    setUploading(null);
    if (input.current) input.current.value = "";
    if (ok) toast("ok", `${ok} file berhasil diunggah.`);
  }

  return (
    <>
      <PageHeader title="Media" description="Foto otomatis dikompres ke WebP (maks 2400 px). Batas: gambar 15 MB, audio 15 MB, video 50 MB." />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void onFiles(e.dataTransfer.files);
        }}
        className={cn("mb-6 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors", drag ? "border-admin-brand bg-[#EEF0EA]" : "border-admin-line bg-white")}
      >
        <Upload className="mx-auto h-6 w-6 text-admin-muted" aria-hidden="true" />
        <p className="mt-2 text-sm">Seret file ke sini, atau</p>
        <input ref={input} id="media-upload" type="file" multiple accept="image/*,audio/*,video/mp4,video/webm" className="sr-only" onChange={(e) => onFiles(e.target.files)} />
        <Button className="mt-3" variant="primary" onClick={() => input.current?.click()} loading={Boolean(uploading)}>
          {uploading ? `Mengunggah ${uploading.done}/${uploading.total}` : "Pilih file"}
        </Button>
      </div>

      <Card
        title="Media library"
        actions={
          <Select aria-label="Filter jenis media" value={kind} onChange={(e) => setKind(e.target.value as MediaKind | "")} className="w-40">
            <option value="">Semua jenis</option>
            <option value="image">Gambar</option>
            <option value="audio">Audio</option>
            <option value="video">Video</option>
          </Select>
        }
      >
        {error && <ErrorState message={error} onRetry={reload} />}
        {!items && !error && <LoadingBlock rows={3} />}
        {items && items.length === 0 && <EmptyState title="Belum ada media" body="Unggah foto pasangan, galeri, musik, atau video di atas." />}
        {items && items.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {items.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => setSelected(m)} className="block w-full overflow-hidden rounded-md border border-admin-line bg-white text-left hover:border-admin-brand">
                  <div className="aspect-square">
                    <MediaThumb m={m} />
                  </div>
                  <div className="px-2 py-1.5">
                    <p className="truncate text-xs">{m.alt || <span className="text-admin-danger">Tanpa alt text</span>}</p>
                    <p className="text-[0.7rem] text-admin-muted">
                      {m.kind} · {formatBytes(m.size_bytes)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {selected && (
        <MediaDetail
          key={selected.id}
          asset={selected}
          onClose={() => setSelected(null)}
          onChange={(m) => {
            setItems((list) => list?.map((x) => (x.id === m.id ? m : x)) ?? null);
            setSelected(m);
          }}
          onDeleted={(id) => {
            setItems((list) => list?.filter((x) => x.id !== id) ?? null);
            setSelected(null);
          }}
        />
      )}
    </>
  );
}

function MediaDetail({ asset, onClose, onChange, onDeleted }: { asset: MediaAsset; onClose: () => void; onChange: (m: MediaAsset) => void; onDeleted: (id: string) => void }) {
  const [alt, setAlt] = useState(asset.alt);
  const [focal, setFocal] = useState({ x: Number(asset.focal_x), y: Number(asset.focal_y) });
  const [busy, setBusy] = useState<string | null>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const confirm = useConfirm();
  const dirty = alt !== asset.alt || focal.x !== Number(asset.focal_x) || focal.y !== Number(asset.focal_y);

  async function save() {
    setBusy("save");
    const { data, error } = await db().from("media_assets").update({ alt, focal_x: focal.x, focal_y: focal.y }).eq("id", asset.id).select("*").single();
    setBusy(null);
    if (error) return toast("error", error.message);
    onChange(data as MediaAsset);
    toast("ok", "Media diperbarui. Publish agar tampil di undangan.");
    emitDraftChanged();
  }

  async function replace(file: File | undefined) {
    if (!file) return;
    setBusy("replace");
    try {
      const m = await replaceMedia(asset, file);
      onChange(m);
      toast("ok", "File diganti. Semua section yang memakai media ini ikut berubah setelah Publish.");
      emitDraftChanged();
    } catch (e) {
      toast("error", errMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setBusy("delete");
    const { data: usage, error } = await db().rpc("media_usage", { p_id: asset.id });
    if (error) {
      setBusy(null);
      return toast("error", error.message);
    }
    if (Array.isArray(usage) && usage.length) {
      setBusy(null);
      return toast("error", `Tidak bisa dihapus, masih dipakai di: ${usage.join(", ")}. Lepaskan dulu dari section tersebut${usage.includes("Versi terpublikasi") ? " lalu Publish" : ""}.`);
    }
    const ok = await confirm({ title: "Hapus media ini?", body: "File akan dihapus permanen dari penyimpanan dan tidak bisa dikembalikan.", confirmLabel: "Hapus permanen", danger: true });
    if (!ok) return setBusy(null);
    const del = await db().from("media_assets").delete().eq("id", asset.id);
    if (del.error) {
      setBusy(null);
      return toast("error", del.error.message);
    }
    if (asset.storage_path) await db().storage.from(MEDIA_BUCKET).remove([asset.storage_path]);
    setBusy(null);
    toast("ok", "Media dihapus.");
    onDeleted(asset.id);
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Detail media"
      footer={
        <>
          <Button variant="dangerGhost" onClick={remove} loading={busy === "delete"}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Hapus
          </Button>
          <input ref={replaceInput} type="file" className="sr-only" accept={asset.kind === "image" ? "image/*" : asset.kind === "audio" ? "audio/*" : "video/mp4,video/webm"} onChange={(e) => replace(e.target.files?.[0])} />
          <Button onClick={() => replaceInput.current?.click()} loading={busy === "replace"}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Ganti file
          </Button>
          <Button variant="primary" disabled={!dirty} loading={busy === "save"} onClick={save}>
            Simpan
          </Button>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-[1fr_220px]">
        <div>
          {asset.kind === "image" ? (
            <>
              <p className="mb-2 flex items-center gap-1.5 text-xs text-admin-muted">
                <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
                Klik gambar untuk menentukan titik fokus saat gambar dipotong.
              </p>
              <button
                type="button"
                className="relative block w-full overflow-hidden rounded-md bg-[#eee]"
                aria-label="Tentukan titik fokus"
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setFocal({ x: Math.round(((e.clientX - r.left) / r.width) * 100), y: Math.round(((e.clientY - r.top) / r.height) * 100) });
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.url} alt={alt} width={asset.width ?? 800} height={asset.height ?? 600} className="h-auto w-full" />
                <span className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.5)]" style={{ left: `${focal.x}%`, top: `${focal.y}%` }} />
              </button>
            </>
          ) : asset.kind === "audio" ? (
            <audio controls src={asset.url} className="w-full" preload="none" />
          ) : (
            <video controls src={asset.url} className="w-full rounded-md" preload="none" />
          )}
        </div>
        <div className="space-y-4">
          <Field label="Alt text" htmlFor="alt" help="Deskripsi singkat untuk pembaca layar.">
            <Input id="alt" value={alt} onChange={(e) => setAlt(e.target.value)} />
          </Field>
          {asset.kind === "image" && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Pratinjau potongan</p>
              <div className="flex gap-2">
                {["aspect-square", "aspect-[3/4]", "aspect-[16/9]"].map((a) => (
                  <div key={a} className={cn("w-1/3 overflow-hidden rounded bg-[#eee]", a)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset.url} alt="" className="h-full w-full object-cover" style={{ objectPosition: `${focal.x}% ${focal.y}%` }} />
                  </div>
                ))}
              </div>
            </div>
          )}
          <dl className="space-y-1 text-xs text-admin-muted">
            <div>
              <dt className="inline">Jenis: </dt>
              <dd className="inline">
                <Badge>{asset.mime_type}</Badge>
              </dd>
            </div>
            <div>
              <dt className="inline">Ukuran: </dt>
              <dd className="inline">
                {formatBytes(asset.size_bytes)}
                {asset.width ? ` · ${asset.width} x ${asset.height}` : ""}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </Dialog>
  );
}
