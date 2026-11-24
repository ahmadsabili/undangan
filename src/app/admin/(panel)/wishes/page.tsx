"use client";

import { Check, EyeOff, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, ErrorState, Input, LoadingBlock, PageHeader, Select, Switch, useConfirm, useToast } from "@/components/ui";
import { db } from "@/services/admin";

type Wish = { id: string; name: string; message: string; status: "pending" | "approved" | "hidden"; created_at: string };
const LABEL = { pending: "Menunggu", approved: "Tampil", hidden: "Disembunyikan" } as const;
const TONE = { pending: "warn", approved: "ok", hidden: "neutral" } as const;

export default function WishesPage() {
  const [rows, setRows] = useState<Wish[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"manual" | "auto" | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const toast = useToast();
  const confirm = useConfirm();

  const load = useCallback(async () => {
    setError(null);
    const [w, s] = await Promise.all([db().from("wedding_wishes").select("*").order("created_at", { ascending: false }), db().from("wedding_settings").select("wishes_moderation").eq("id", 1).single()]);
    if (w.error) return setError(w.error.message);
    setRows(w.data as Wish[]);
    setMode(s.data?.wishes_moderation ?? "manual");
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (rows ?? []).filter((w) => (!status || w.status === status) && (!t || w.name.toLowerCase().includes(t) || w.message.toLowerCase().includes(t)));
  }, [rows, q, status]);
  const pending = rows?.filter((w) => w.status === "pending").length ?? 0;

  async function setWish(w: Wish, s: Wish["status"]) {
    setRows((l) => l!.map((x) => (x.id === w.id ? { ...x, status: s } : x)));
    const { error } = await db().from("wedding_wishes").update({ status: s }).eq("id", w.id);
    if (error) {
      toast("error", error.message);
      void load();
    }
  }

  async function remove(w: Wish) {
    if (!(await confirm({ title: "Hapus ucapan ini?", body: `"${w.message.slice(0, 120)}" dari ${w.name} akan dihapus permanen.`, confirmLabel: "Hapus", danger: true }))) return;
    const { error } = await db().from("wedding_wishes").delete().eq("id", w.id);
    if (error) return toast("error", error.message);
    setRows((l) => l!.filter((x) => x.id !== w.id));
  }

  async function changeMode(auto: boolean) {
    const next = auto ? "auto" : "manual";
    const { error } = await db().from("wedding_settings").update({ wishes_moderation: next }).eq("id", 1);
    if (error) return toast("error", error.message);
    setMode(next);
    toast("ok", auto ? "Ucapan baru langsung tampil (kecuali yang terdeteksi spam)." : "Ucapan baru menunggu persetujuan.");
  }

  async function approveAll() {
    const ids = (rows ?? []).filter((w) => w.status === "pending").map((w) => w.id);
    if (!ids.length) return;
    const { error } = await db().from("wedding_wishes").update({ status: "approved" }).in("id", ids);
    if (error) return toast("error", error.message);
    setRows((l) => l!.map((x) => (ids.includes(x.id) ? { ...x, status: "approved" } : x)));
    toast("ok", `${ids.length} ucapan disetujui.`);
  }

  return (
    <>
      <PageHeader title="Ucapan & Doa" description="Perubahan status berlaku langsung di undangan publik." actions={pending > 0 ? <Button onClick={approveAll}>Setujui semua yang menunggu ({pending})</Button> : undefined} />
      <Card className="mb-6">
        {mode && <Switch label="Moderasi otomatis" description="Aktif: ucapan langsung tampil. Nonaktif: ucapan menunggu persetujuan Anda. Ucapan dengan tautan atau kata terlarang selalu menunggu." checked={mode === "auto"} onChange={changeMode} />}
      </Card>
      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" aria-hidden="true" />
            <Input aria-label="Cari ucapan" placeholder="Cari nama atau isi ucapan" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select aria-label="Filter status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Semua status</option>
            <option value="pending">Menunggu</option>
            <option value="approved">Tampil</option>
            <option value="hidden">Disembunyikan</option>
          </Select>
        </div>
        {error && <ErrorState message={error} onRetry={load} />}
        {!rows && !error && <LoadingBlock rows={4} />}
        {rows && rows.length === 0 && <EmptyState title="Belum ada ucapan" />}
        {rows && rows.length > 0 && filtered.length === 0 && <EmptyState title="Tidak ada yang cocok" />}
        <ul className="divide-y divide-admin-line">
          {filtered.map((w) => (
            <li key={w.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-medium">{w.name}</span> <Badge tone={TONE[w.status]}>{LABEL[w.status]}</Badge>
                </p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{w.message}</p>
                <p className="mt-1 text-xs text-admin-muted">{new Date(w.created_at).toLocaleString("id-ID")}</p>
              </div>
              <div className="flex gap-1">
                {w.status !== "approved" && (
                  <Button size="sm" onClick={() => setWish(w, "approved")}>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Tampilkan
                  </Button>
                )}
                {w.status !== "hidden" && (
                  <Button size="sm" variant="ghost" onClick={() => setWish(w, "hidden")}>
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                    Sembunyikan
                  </Button>
                )}
                <Button size="icon" variant="dangerGhost" aria-label={`Hapus ucapan dari ${w.name}`} onClick={() => remove(w)}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
