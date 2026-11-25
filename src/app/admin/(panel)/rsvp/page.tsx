"use client";

import { Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { ManualRsvpDialog } from "@/components/admin/ManualRsvpDialog";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Dialog, EmptyState, ErrorState, Field, Input, LoadingBlock, PageHeader, Select, Textarea, useConfirm, useToast } from "@/components/ui";
import { downloadText } from "@/lib/utils";
import { db, errMessage, toCsv } from "@/services/admin";
import { rsvpAdminSchema } from "@/validation/admin";

type Rsvp = {
  id: string;
  guest_id: string | null;
  name: string;
  attendance: "hadir" | "tidak_hadir" | "ragu";
  pax: number;
  message: string;
  source: string;
  created_at: string;
  updated_at: string;
  guests: { category: string; code: string } | null;
};

const LABEL = { hadir: "Hadir", tidak_hadir: "Tidak hadir", ragu: "Masih ragu" } as const;
const TONE = { hadir: "ok", tidak_hadir: "danger", ragu: "warn" } as const;

export default function RsvpPage() {
  const [rows, setRows] = useState<Rsvp[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [att, setAtt] = useState("");
  const [cat, setCat] = useState("");
  const [edit, setEdit] = useState<Rsvp | null>(null);
  const [manual, setManual] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const load = useCallback(async () => {
    setError(null);
    const [r, s] = await Promise.all([
      db().from("rsvps").select("*, guests(category, code)").order("updated_at", { ascending: false }),
      db().from("wedding_settings").select("rsvp_deadline, timezone").eq("id", 1).single(),
    ]);
    if (r.error) return setError(r.error.message);
    setRows(r.data as Rsvp[]);
    if (s.data?.rsvp_deadline) setDeadline(new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short", timeZone: s.data.timezone }).format(new Date(s.data.rsvp_deadline)));
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo(() => Array.from(new Set((rows ?? []).map((r) => r.guests?.category ?? "Tanpa kategori"))).sort(), [rows]);
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => (!t || r.name.toLowerCase().includes(t)) && (!att || r.attendance === att) && (!cat || (r.guests?.category ?? "Tanpa kategori") === cat));
  }, [rows, q, att, cat]);
  const recap = useMemo(() => {
    const sum = (a: Rsvp["attendance"]) => filtered.filter((r) => r.attendance === a);
    return {
      hadir: sum("hadir").length,
      hadirPax: sum("hadir").reduce((n, r) => n + r.pax, 0),
      ragu: sum("ragu").length,
      raguPax: sum("ragu").reduce((n, r) => n + r.pax, 0),
      tidak: sum("tidak_hadir").length,
    };
  }, [filtered]);

  async function remove(r: Rsvp) {
    if (!(await confirm({ title: `Hapus RSVP ${r.name}?`, body: "Data konfirmasi ini akan dihapus permanen.", confirmLabel: "Hapus", danger: true }))) return;
    const { error } = await db().from("rsvps").delete().eq("id", r.id);
    if (error) return toast("error", error.message);
    setRows((list) => list!.filter((x) => x.id !== r.id));
    toast("ok", "RSVP dihapus.");
  }

  function exportCsv() {
    downloadText(
      `rsvp-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(
        filtered.map((r) => ({ ...r, status: LABEL[r.attendance], category: r.guests?.category ?? "", via: r.source === "admin" ? "Dicatat admin" : r.guest_id ? "Kode tamu" : "Tautan nama", time: new Date(r.updated_at).toLocaleString("id-ID") })),
        [
          { key: "name", label: "nama" },
          { key: "category", label: "kategori" },
          { key: "status", label: "kehadiran" },
          { key: "pax", label: "jumlah_orang" },
          { key: "message", label: "pesan" },
          { key: "via", label: "sumber" },
          { key: "time", label: "waktu" },
        ],
      ),
      "text/csv",
    );
  }

  return (
    <>
      <PageHeader
        title="RSVP"
        description={deadline ? `Batas konfirmasi: ${deadline}.` : "Belum ada batas waktu RSVP."}
        actions={
          <>
            <Link href="/admin/settings" className="inline-flex min-h-[40px] items-center rounded-md border border-admin-line bg-white px-4 text-sm font-medium hover:bg-[#F0EEE8]">
              Atur batas waktu
            </Link>
            <Button variant="primary" onClick={() => setManual(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Catat RSVP manual
            </Button>
            <Button onClick={exportCsv} disabled={!filtered.length}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </Button>
          </>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Hadir", `${recap.hadir} konfirmasi`, `${recap.hadirPax} orang`],
          ["Masih ragu", `${recap.ragu} konfirmasi`, `${recap.raguPax} orang`],
          ["Tidak hadir", `${recap.tidak} konfirmasi`, ""],
          ["Estimasi hadir", `${recap.hadirPax} orang`, recap.raguPax ? `+${recap.raguPax} bila yang ragu datang` : ""],
        ].map(([k, a, b]) => (
          <div key={k} className="rounded-lg border border-admin-line bg-white p-4">
            <p className="text-xs text-admin-muted">{k}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{a}</p>
            {b && <p className="text-xs text-admin-muted">{b}</p>}
          </div>
        ))}
      </div>
      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" aria-hidden="true" />
            <Input aria-label="Cari nama" placeholder="Cari nama" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select aria-label="Filter kehadiran" value={att} onChange={(e) => setAtt(e.target.value)}>
            <option value="">Semua kehadiran</option>
            <option value="hadir">Hadir</option>
            <option value="ragu">Masih ragu</option>
            <option value="tidak_hadir">Tidak hadir</option>
          </Select>
          <Select aria-label="Filter kategori" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">Semua kategori</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </div>
        {error && <ErrorState message={error} onRetry={load} />}
        {!rows && !error && <LoadingBlock rows={5} />}
        {rows && rows.length === 0 && <EmptyState title="Belum ada konfirmasi" body="RSVP dari tamu akan muncul di sini." />}
        {rows && rows.length > 0 && filtered.length === 0 && <EmptyState title="Tidak ada yang cocok" />}
        {filtered.length > 0 && (
          <ul className="divide-y divide-admin-line">
            {filtered.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {r.name} <Badge tone={TONE[r.attendance]}>{LABEL[r.attendance]}</Badge> {r.attendance !== "tidak_hadir" && <span className="text-sm text-admin-muted">{r.pax} orang</span>}
                  </p>
                  {r.message && <p className="mt-1 text-sm text-admin-muted">&ldquo;{r.message}&rdquo;</p>}
                  <p className="mt-1 text-xs text-admin-muted">
                    {r.guests?.category ?? "Tautan nama"} · {new Date(r.updated_at).toLocaleString("id-ID")}
                    {r.source === "admin" && " · dicatat admin"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" aria-label={`Edit RSVP ${r.name}`} onClick={() => setEdit(r)}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button size="icon" variant="dangerGhost" aria-label={`Hapus RSVP ${r.name}`} onClick={() => remove(r)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <ManualRsvpDialog open={manual} onClose={() => setManual(false)} onSaved={load} />
      {edit && <EditRsvp r={edit} onClose={() => setEdit(null)} onSaved={(n) => { setRows((l) => l!.map((x) => (x.id === n.id ? { ...x, ...n } : x))); setEdit(null); }} />}
    </>
  );
}

function EditRsvp({ r, onClose, onSaved }: { r: Rsvp; onClose: () => void; onSaved: (r: Partial<Rsvp> & { id: string }) => void }) {
  const [v, setV] = useState({ name: r.name, attendance: r.attendance, pax: r.pax, message: r.message });
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  async function save() {
    const parsed = rsvpAdminSchema.safeParse(v);
    if (!parsed.success) return toast("error", parsed.error.issues[0].message);
    setBusy(true);
    const data = { ...parsed.data, pax: parsed.data.attendance === "tidak_hadir" ? 0 : Math.max(parsed.data.pax, 1) };
    const { error } = await db().from("rsvps").update(data).eq("id", r.id);
    setBusy(false);
    if (error) return toast("error", errMessage(error));
    toast("ok", "RSVP diperbarui.");
    onSaved({ id: r.id, ...data });
  }
  return (
    <Dialog open onClose={onClose} title="Edit RSVP" footer={<><Button onClick={onClose}>Batal</Button><Button variant="primary" loading={busy} onClick={save}>Simpan</Button></>}>
      <div className="grid gap-4">
        <Field label="Nama" htmlFor="r-name">
          <Input id="r-name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Kehadiran" htmlFor="r-att">
            <Select id="r-att" value={v.attendance} onChange={(e) => setV({ ...v, attendance: e.target.value as Rsvp["attendance"] })}>
              <option value="hadir">Hadir</option>
              <option value="ragu">Masih ragu</option>
              <option value="tidak_hadir">Tidak hadir</option>
            </Select>
          </Field>
          <Field label="Jumlah orang" htmlFor="r-pax">
            <Input id="r-pax" type="number" min={0} max={20} value={v.pax} onChange={(e) => setV({ ...v, pax: Number(e.target.value) })} />
          </Field>
        </div>
        <Field label="Pesan" htmlFor="r-msg">
          <Textarea id="r-msg" rows={3} value={v.message} onChange={(e) => setV({ ...v, message: e.target.value })} />
        </Field>
      </div>
    </Dialog>
  );
}
