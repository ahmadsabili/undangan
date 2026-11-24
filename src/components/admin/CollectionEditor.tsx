"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button, EmptyState, ErrorState, LoadingBlock, useConfirm, useToast } from "@/components/ui";
import type { FieldDef } from "@/config/sections";
import { cn } from "@/lib/utils";
import { db, emitDraftChanged } from "@/services/admin";
import { DynamicFields } from "./DynamicFields";
import { SortableList } from "./Sortable";

type Row = { id: string; sort_order: number } & Record<string, unknown>;

/**
 * Editor daftar berurutan (acara, love story, hadiah). Setiap item disimpan sendiri
 * ke tabel draft. Urutan disimpan otomatis saat diseret.
 */
export function CollectionEditor({
  table,
  fields,
  newItem,
  titleOf,
  timezone,
  addLabel,
  validate,
}: {
  table: "wedding_events" | "love_stories" | "wedding_gifts";
  fields: FieldDef[];
  newItem: () => Record<string, unknown>;
  titleOf: (r: Row) => string;
  timezone: string;
  addLabel: string;
  validate?: (r: Row) => string | null;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [saved, setSaved] = useState<Record<string, Row>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const load = useCallback(async () => {
    setError(null);
    const { data, error } = await db().from(table).select("*").order("sort_order");
    if (error) return setError(error.message);
    setRows(data as Row[]);
    setSaved(Object.fromEntries((data as Row[]).map((r) => [r.id, r])));
  }, [table]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = (r: Row) => JSON.stringify(r) !== JSON.stringify(saved[r.id]);

  async function save(r: Row) {
    const problem = validate?.(r);
    if (problem) return toast("error", problem);
    setBusy(r.id);
    const { id, sort_order, created_at: _c, updated_at: _u, ...rest } = r;
    void _c;
    void _u;
    const { data, error } = await db().from(table).update({ ...rest, sort_order }).eq("id", id).select("*").single();
    setBusy(null);
    if (error) return toast("error", `Gagal menyimpan: ${error.message}`);
    setSaved((s) => ({ ...s, [id]: data as Row }));
    setRows((list) => list!.map((x) => (x.id === id ? (data as Row) : x)));
    toast("ok", "Tersimpan sebagai draft.");
    emitDraftChanged();
  }

  async function add() {
    setBusy("new");
    const sort_order = rows?.length ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 0;
    const { data, error } = await db().from(table).insert({ ...newItem(), sort_order }).select("*").single();
    setBusy(null);
    if (error) return toast("error", `Gagal menambah: ${error.message}`);
    setRows((list) => [...(list ?? []), data as Row]);
    setSaved((s) => ({ ...s, [(data as Row).id]: data as Row }));
    setOpenId((data as Row).id);
    emitDraftChanged();
  }

  async function remove(r: Row) {
    if (!(await confirm({ title: `Hapus "${titleOf(r)}"?`, body: "Item ini akan hilang dari draft. Versi publik tetap sama sampai Anda menekan Publish.", confirmLabel: "Hapus", danger: true }))) return;
    const { error } = await db().from(table).delete().eq("id", r.id);
    if (error) return toast("error", `Gagal menghapus: ${error.message}`);
    setRows((list) => list!.filter((x) => x.id !== r.id));
    emitDraftChanged();
  }

  async function reorder(next: Row[]) {
    const updated = next.map((r, i) => ({ ...r, sort_order: i }));
    setRows(updated);
    const results = await Promise.all(updated.map((r) => db().from(table).update({ sort_order: r.sort_order }).eq("id", r.id)));
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      toast("error", `Urutan gagal disimpan: ${failed.error.message}`);
      void load();
    } else {
      setSaved((s) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, { ...v, sort_order: updated.find((u) => u.id === k)?.sort_order ?? v.sort_order }])));
      emitDraftChanged();
    }
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!rows) return <LoadingBlock />;

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <EmptyState title="Belum ada item" body="Tambahkan item pertama." />
      ) : (
        <SortableList
          items={rows}
          onReorder={reorder}
          className="space-y-2"
          render={(r, handle) => {
            const isOpen = openId === r.id;
            return (
              <div className="rounded-md border border-admin-line bg-white">
                <div className="flex items-center gap-1 pr-2">
                  {handle}
                  <button type="button" onClick={() => setOpenId(isOpen ? null : r.id)} aria-expanded={isOpen} className="flex min-h-[48px] flex-1 items-center justify-between gap-2 py-2 text-left">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{titleOf(r) || "Tanpa judul"}</span>
                      {dirty(r) && <span className="text-xs text-[#8a5a00]">Perubahan belum disimpan</span>}
                      {table === "wedding_gifts" && !r.enabled && <span className="text-xs text-admin-muted">Disembunyikan</span>}
                    </span>
                    <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
                  </button>
                </div>
                {isOpen && (
                  <div className="border-t border-admin-line p-4">
                    <DynamicFields fields={fields} values={r} timezone={timezone} prefix={`${table}-${r.id}`} onChange={(v) => setRows((list) => list!.map((x) => (x.id === r.id ? ({ ...x, ...v } as Row) : x)))} />
                    <div className="mt-5 flex flex-wrap justify-between gap-2">
                      <Button variant="dangerGhost" onClick={() => remove(r)}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Hapus
                      </Button>
                      <div className="flex gap-2">
                        <Button disabled={!dirty(r)} onClick={() => setRows((list) => list!.map((x) => (x.id === r.id ? saved[r.id] : x)))}>
                          Reset
                        </Button>
                        <Button variant="primary" disabled={!dirty(r)} loading={busy === r.id} onClick={() => save(r)}>
                          Simpan draft
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }}
        />
      )}
      <Button onClick={add} loading={busy === "new"}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        {addLabel}
      </Button>
    </div>
  );
}
