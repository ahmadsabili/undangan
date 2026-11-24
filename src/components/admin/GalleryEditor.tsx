"use client";

import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button, EmptyState, ErrorState, LoadingBlock, Select, useToast } from "@/components/ui";
import { db, emitDraftChanged, errMessage } from "@/services/admin";
import type { MediaAsset } from "@/types/invitation";
import { MediaPicker, MediaThumb } from "./MediaPicker";
import { SortableList } from "./Sortable";

type Row = { id: string; media_id: string; caption: string; layout: "auto" | "tall" | "wide"; sort_order: number; media_assets: MediaAsset | null };

export function GalleryEditor() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setError(null);
    const { data, error } = await db().from("gallery_images").select("*, media_assets(*)").order("sort_order");
    if (error) setError(error.message);
    else setRows(data as Row[]);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function add(m: MediaAsset) {
    const sort_order = rows?.length ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 0;
    const { data, error } = await db().from("gallery_images").insert({ media_id: m.id, sort_order }).select("*, media_assets(*)").single();
    if (error) return toast("error", errMessage(error));
    setRows((r) => [...(r ?? []), data as Row]);
    emitDraftChanged();
  }

  async function patch(id: string, values: Partial<Row>) {
    setRows((r) => r!.map((x) => (x.id === id ? { ...x, ...values } : x)));
    const { error } = await db().from("gallery_images").update(values).eq("id", id);
    if (error) toast("error", errMessage(error));
    else emitDraftChanged();
  }

  async function remove(id: string) {
    const { error } = await db().from("gallery_images").delete().eq("id", id);
    if (error) return toast("error", errMessage(error));
    setRows((r) => r!.filter((x) => x.id !== id));
    toast("info", "Foto dilepas dari galeri. File tetap ada di Media.");
    emitDraftChanged();
  }

  async function reorder(next: Row[]) {
    const updated = next.map((r, i) => ({ ...r, sort_order: i }));
    setRows(updated);
    const res = await Promise.all(updated.map((r) => db().from("gallery_images").update({ sort_order: r.sort_order }).eq("id", r.id)));
    if (res.some((r) => r.error)) {
      toast("error", "Urutan gagal disimpan.");
      void load();
    } else emitDraftChanged();
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!rows) return <LoadingBlock />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-admin-muted">Seret untuk mengurutkan. Foto pertama tampil lebih besar di desktop. Posisi fokus diatur di menu Media.</p>
      {rows.length === 0 ? (
        <EmptyState title="Galeri masih kosong" />
      ) : (
        <SortableList
          grid
          items={rows}
          onReorder={reorder}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
          render={(r, handle) => (
            <div className="overflow-hidden rounded-md border border-admin-line bg-white">
              <div className="relative aspect-[4/3]">
                {r.media_assets ? <MediaThumb m={r.media_assets} /> : <div className="h-full bg-[#eee]" />}
                <div className="absolute left-1 top-1 rounded bg-white/90">{handle}</div>
              </div>
              <div className="space-y-2 p-2">
                <label className="sr-only" htmlFor={`layout-${r.id}`}>
                  Ukuran tampil
                </label>
                <Select id={`layout-${r.id}`} value={r.layout} onChange={(e) => patch(r.id, { layout: e.target.value as Row["layout"] })}>
                  <option value="auto">Normal</option>
                  <option value="tall">Tinggi</option>
                  <option value="wide">Lebar</option>
                </Select>
                <label className="sr-only" htmlFor={`cap-${r.id}`}>
                  Keterangan foto
                </label>
                <input
                  id={`cap-${r.id}`}
                  defaultValue={r.caption}
                  placeholder="Keterangan (opsional)"
                  onBlur={(e) => e.target.value !== r.caption && patch(r.id, { caption: e.target.value })}
                  className="w-full rounded-md border border-admin-line px-2 py-1.5 text-sm"
                />
                <Button size="sm" variant="dangerGhost" className="w-full" onClick={() => remove(r.id)}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Lepas dari galeri
                </Button>
              </div>
            </div>
          )}
        />
      )}
      <Button onClick={() => setPicker(true)}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Tambah foto
      </Button>
      <MediaPicker open={picker} onClose={() => setPicker(false)} kind="image" onSelect={add} />
    </div>
  );
}
