"use client";

import { FileAudio, FileVideo, ImageIcon, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Dialog, EmptyState, ErrorState, LoadingBlock, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import { db, errMessage } from "@/services/admin";
import { uploadMedia, validateFile, type MediaKind } from "@/services/media-upload";
import type { MediaAsset } from "@/types/invitation";

export function MediaThumb({ m, className }: { m: MediaAsset; className?: string }) {
  if (m.kind === "image")
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={m.url} alt={m.alt} loading="lazy" width={m.width ?? 200} height={m.height ?? 200} className={cn("h-full w-full object-cover", className)} style={{ objectPosition: `${m.focal_x}% ${m.focal_y}%` }} />;
  const Icon = m.kind === "audio" ? FileAudio : FileVideo;
  return (
    <div className={cn("grid h-full w-full place-items-center bg-[#EEECE6] text-admin-muted", className)}>
      <Icon className="h-7 w-7" aria-hidden="true" />
    </div>
  );
}

export function useMediaList(kind?: MediaKind) {
  const [items, setItems] = useState<MediaAsset[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    let q = db().from("media_assets").select("*").order("created_at", { ascending: false });
    if (kind) q = q.eq("kind", kind);
    const { data, error } = await q;
    if (error) setError(error.message);
    else setItems(data as MediaAsset[]);
  }, [kind]);
  useEffect(() => {
    void load();
  }, [load]);
  return { items, error, reload: load, setItems };
}

export function MediaPicker({ open, onClose, onSelect, kind = "image" }: { open: boolean; onClose: () => void; onSelect: (m: MediaAsset) => void; kind?: MediaKind }) {
  const { items, error, reload, setItems } = useMediaList(kind);
  const [uploading, setUploading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        const err = validateFile(f, kind);
        if (err) {
          toast("error", err);
          continue;
        }
        const m = await uploadMedia(f);
        setItems((prev) => [m, ...(prev ?? [])]);
      }
    } catch (e) {
      toast("error", errMessage(e));
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="xl"
      title={kind === "image" ? "Pilih gambar" : kind === "audio" ? "Pilih audio" : "Pilih video"}
      description="Pilih dari media library atau unggah file baru."
      footer={
        <>
          <input ref={input} type="file" className="sr-only" id="picker-upload" multiple={kind === "image"} accept={kind === "image" ? "image/*" : kind === "audio" ? "audio/*" : "video/mp4,video/webm"} onChange={(e) => onFiles(e.target.files)} />
          <Button onClick={() => input.current?.click()} loading={uploading}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            Unggah baru
          </Button>
          <Button onClick={onClose}>Tutup</Button>
        </>
      }
    >
      {error && <ErrorState message={error} onRetry={reload} />}
      {!items && !error && <LoadingBlock rows={2} />}
      {items && items.length === 0 && <EmptyState title="Belum ada media" body="Unggah file pertama dengan tombol di bawah." />}
      {items && items.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {items.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(m);
                  onClose();
                }}
                className="group block w-full overflow-hidden rounded-md border border-admin-line text-left hover:border-admin-brand"
              >
                <div className="aspect-square">
                  <MediaThumb m={m} />
                </div>
                <p className="truncate px-2 py-1 text-xs text-admin-muted group-hover:text-admin-ink">{m.alt || "Tanpa alt text"}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}

/** Field form untuk memilih satu media. Menyimpan ID media. */
export function MediaField({
  value,
  onChange,
  kind = "image",
  label,
  id,
}: {
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  kind?: MediaKind;
  label: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [asset, setAsset] = useState<MediaAsset | null>(null);
  useEffect(() => {
    if (!value) {
      setAsset(null);
      return;
    }
    db()
      .from("media_assets")
      .select("*")
      .eq("id", value)
      .maybeSingle()
      .then(({ data }) => setAsset((data as MediaAsset) ?? null));
  }, [value]);
  return (
    <div className="flex items-center gap-3" id={id}>
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-admin-line bg-[#F3F2EE]">
        {asset ? <MediaThumb m={asset} /> : <div className="grid h-full place-items-center text-admin-muted"><ImageIcon className="h-5 w-5" aria-hidden="true" /></div>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{asset ? asset.alt || "Tanpa alt text" : value ? "Memuat..." : "Belum dipilih"}</p>
        <div className="mt-1 flex gap-2">
          <Button size="sm" onClick={() => setOpen(true)} aria-label={`Pilih ${label}`}>
            {value ? "Ganti" : "Pilih"}
          </Button>
          {value && (
            <Button size="sm" variant="ghost" onClick={() => onChange(null)} aria-label={`Kosongkan ${label}`}>
              <X className="h-4 w-4" aria-hidden="true" />
              Kosongkan
            </Button>
          )}
        </div>
      </div>
      <MediaPicker open={open} onClose={() => setOpen(false)} kind={kind} onSelect={(m) => onChange(m.id)} />
    </div>
  );
}
