"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Download, FileUp, Link2, MessageCircle, Pencil, Plus, QrCode, Search, Trash2 } from "lucide-react";
import Papa from "papaparse";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { CopyInline, QrDialog, WhatsappDialog } from "@/components/admin/ShareDialogs";
import { siteOrigin, useInviteContext } from "@/components/admin/useInviteContext";
import { Badge, Button, Card, Dialog, EmptyState, ErrorState, Field, Input, LoadingBlock, PageHeader, Select, Textarea, useConfirm, useToast } from "@/components/ui";
import { copyText, downloadText, guestLink, nameLink } from "@/lib/utils";
import { db, errMessage, toCsv } from "@/services/admin";
import { guestSchema } from "@/validation/admin";

type Guest = {
  id: string;
  name: string;
  category: string;
  whatsapp: string | null;
  max_pax: number;
  code: string;
  invitation_status: "belum_dikirim" | "terkirim";
  sent_at: string | null;
  notes: string;
  created_at: string;
  rsvps: { attendance: "hadir" | "tidak_hadir" | "ragu"; pax: number } | null;
};

const RSVP_LABEL = { hadir: "Hadir", tidak_hadir: "Tidak hadir", ragu: "Ragu" } as const;
const PAGE = 25;

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Guest | "new" | null>(null);
  const [qr, setQr] = useState<Guest | null>(null);
  const [wa, setWa] = useState<Guest | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [quickName, setQuickName] = useState("");
  const { names, templates } = useInviteContext();
  const toast = useToast();
  const confirm = useConfirm();
  const origin = siteOrigin();

  const load = useCallback(async () => {
    setError(null);
    const { data, error } = await db().from("guests").select("*, rsvps(attendance, pax)").order("created_at", { ascending: false });
    if (error) return setError(error.message);
    setGuests(data as Guest[]);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo(() => Array.from(new Set((guests ?? []).map((g) => g.category))).sort(), [guests]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (guests ?? []).filter(
      (g) =>
        (!term || g.name.toLowerCase().includes(term) || g.code.toLowerCase().includes(term)) &&
        (!cat || g.category === cat) &&
        (!status ||
          (status === "terkirim" && g.invitation_status === "terkirim") ||
          (status === "belum_dikirim" && g.invitation_status === "belum_dikirim") ||
          (status === "belum_rsvp" && !g.rsvps) ||
          (status === "sudah_rsvp" && g.rsvps)),
    );
  }, [guests, q, cat, status]);
  useEffect(() => setPage(0), [q, cat, status]);
  const pageItems = filtered.slice(page * PAGE, (page + 1) * PAGE);

  async function remove(g: Guest) {
    if (!(await confirm({ title: `Hapus ${g.name}?`, body: "Tautan undangan tamu ini tidak akan berlaku lagi. Data RSVP-nya tetap tersimpan tanpa tautan ke tamu.", confirmLabel: "Hapus", danger: true }))) return;
    const { error } = await db().from("guests").delete().eq("id", g.id);
    if (error) return toast("error", error.message);
    setGuests((list) => list!.filter((x) => x.id !== g.id));
    toast("ok", "Tamu dihapus.");
  }

  async function markSent(g: Guest) {
    const { error } = await db().from("guests").update({ invitation_status: "terkirim", sent_at: new Date().toISOString() }).eq("id", g.id);
    if (error) return toast("error", error.message);
    setGuests((list) => list!.map((x) => (x.id === g.id ? { ...x, invitation_status: "terkirim" } : x)));
  }

  function exportCsv() {
    const rows = filtered.map((g) => ({
      ...g,
      link: guestLink(origin, g.code),
      rsvp: g.rsvps ? RSVP_LABEL[g.rsvps.attendance] : "Belum",
      rsvp_pax: g.rsvps?.pax ?? "",
    }));
    downloadText(
      `daftar-tamu-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(rows, [
        { key: "name", label: "nama" },
        { key: "category", label: "kategori" },
        { key: "whatsapp", label: "whatsapp" },
        { key: "max_pax", label: "maks_orang" },
        { key: "code", label: "kode" },
        { key: "link", label: "tautan" },
        { key: "invitation_status", label: "status_undangan" },
        { key: "rsvp", label: "rsvp" },
        { key: "rsvp_pax", label: "jumlah_hadir" },
        { key: "notes", label: "catatan" },
      ]),
      "text/csv",
    );
  }

  return (
    <>
      <PageHeader
        title="Daftar Tamu"
        description="Setiap tamu mendapat tautan berkode unik. Nomor WhatsApp tidak pernah dimasukkan ke tautan."
        actions={
          <>
            <Button onClick={() => setImportOpen(true)}>
              <FileUp className="h-4 w-4" aria-hidden="true" />
              Import CSV
            </Button>
            <Button onClick={exportCsv} disabled={!filtered.length}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </Button>
            <Button variant="primary" onClick={() => setEditing("new")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Tambah tamu
            </Button>
          </>
        }
      />

      <Card title="Tautan cepat dengan nama" description="Untuk tamu yang tidak dicatat di daftar. Format: ?to=Nama" className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Nama tamu" htmlFor="quick" className="flex-1">
            <Input id="quick" value={quickName} onChange={(e) => setQuickName(e.target.value)} placeholder="Contoh: Keluarga Bapak Ahmad" />
          </Field>
          {quickName.trim() && (
            <div className="flex flex-wrap gap-2">
              <CopyInline text={nameLink(origin, quickName.trim())} label="Salin tautan" />
              <Button size="sm" onClick={() => setWa({ id: "quick", name: quickName.trim(), category: "", whatsapp: null, max_pax: 1, code: "", invitation_status: "belum_dikirim", sent_at: null, notes: "", created_at: "", rsvps: null })}>
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Pesan WA
              </Button>
            </div>
          )}
        </div>
        {quickName.trim() && <p className="mt-2 break-all text-xs text-admin-muted">{nameLink(origin, quickName.trim())}</p>}
      </Card>

      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" aria-hidden="true" />
            <Input aria-label="Cari nama atau kode" placeholder="Cari nama atau kode" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select aria-label="Filter kategori" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">Semua kategori</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select aria-label="Filter status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Semua status</option>
            <option value="belum_dikirim">Undangan belum dikirim</option>
            <option value="terkirim">Undangan terkirim</option>
            <option value="belum_rsvp">Belum RSVP</option>
            <option value="sudah_rsvp">Sudah RSVP</option>
          </Select>
        </div>

        {error && <ErrorState message={error} onRetry={load} />}
        {!guests && !error && <LoadingBlock rows={5} />}
        {guests && guests.length === 0 && <EmptyState title="Belum ada tamu" body="Tambahkan tamu satu per satu atau import dari CSV." action={<Button variant="primary" onClick={() => setEditing("new")}>Tambah tamu</Button>} />}
        {guests && guests.length > 0 && filtered.length === 0 && <EmptyState title="Tidak ada yang cocok" body="Ubah kata kunci atau filter." />}

        {pageItems.length > 0 && (
          <>
            <p className="mb-2 text-xs text-admin-muted">
              {filtered.length} tamu{filtered.length !== guests!.length ? ` dari ${guests!.length}` : ""}
            </p>
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-y border-admin-line bg-[#FAF9F6] text-left text-xs text-admin-muted">
                    <th scope="col" className="px-5 py-2 font-medium">Nama</th>
                    <th scope="col" className="px-3 py-2 font-medium">Kategori</th>
                    <th scope="col" className="px-3 py-2 font-medium">Maks</th>
                    <th scope="col" className="px-3 py-2 font-medium">Undangan</th>
                    <th scope="col" className="px-3 py-2 font-medium">RSVP</th>
                    <th scope="col" className="px-5 py-2 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((g) => (
                    <tr key={g.id} className="border-b border-admin-line last:border-0">
                      <td className="px-5 py-2.5">
                        <p className="font-medium">{g.name}</p>
                        <p className="font-mono text-xs text-admin-muted">{g.code}</p>
                      </td>
                      <td className="px-3 py-2.5">{g.category}</td>
                      <td className="px-3 py-2.5 tabular-nums">{g.max_pax}</td>
                      <td className="px-3 py-2.5">{g.invitation_status === "terkirim" ? <Badge tone="ok">Terkirim</Badge> : <Badge>Belum</Badge>}</td>
                      <td className="px-3 py-2.5">
                        {g.rsvps ? <Badge tone={g.rsvps.attendance === "hadir" ? "ok" : g.rsvps.attendance === "ragu" ? "warn" : "danger"}>{RSVP_LABEL[g.rsvps.attendance]}{g.rsvps.attendance !== "tidak_hadir" ? ` · ${g.rsvps.pax}` : ""}</Badge> : <span className="text-xs text-admin-muted">Belum</span>}
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex justify-end gap-1">
                          <CopyIcon text={guestLink(origin, g.code)} />
                          <Button size="icon" variant="ghost" aria-label={`QR code ${g.name}`} onClick={() => setQr(g)}>
                            <QrCode className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button size="icon" variant="ghost" aria-label={`Kirim WhatsApp ke ${g.name}`} onClick={() => setWa(g)}>
                            <MessageCircle className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button size="icon" variant="ghost" aria-label={`Edit ${g.name}`} onClick={() => setEditing(g)}>
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button size="icon" variant="dangerGhost" aria-label={`Hapus ${g.name}`} onClick={() => remove(g)}>
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length > PAGE && (
              <div className="mt-4 flex items-center justify-between text-sm">
                <Button size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Sebelumnya
                </Button>
                <span className="text-admin-muted">
                  Halaman {page + 1} dari {Math.ceil(filtered.length / PAGE)}
                </span>
                <Button size="sm" disabled={(page + 1) * PAGE >= filtered.length} onClick={() => setPage((p) => p + 1)}>
                  Berikutnya
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {editing && (
        <GuestForm
          guest={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={(g) => {
            setGuests((list) => (list!.some((x) => x.id === g.id) ? list!.map((x) => (x.id === g.id ? { ...x, ...g } : x)) : [g, ...list!]));
            setEditing(null);
          }}
        />
      )}
      {qr && <QrDialog open onClose={() => setQr(null)} link={guestLink(origin, qr.code)} name={qr.name} />}
      {wa && (
        <WhatsappDialog
          open
          onClose={() => setWa(null)}
          guestName={wa.name}
          phone={wa.whatsapp}
          link={wa.code ? guestLink(origin, wa.code) : nameLink(origin, wa.name)}
          names={names}
          templates={templates}
          onMarkSent={wa.code ? () => markSent(wa) : undefined}
        />
      )}
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} onDone={load} />
    </>
  );
}

function CopyIcon({ text }: { text: string }) {
  const toast = useToast();
  return (
    <Button
      size="icon"
      variant="ghost"
      aria-label="Salin tautan undangan"
      onClick={async () => {
        if (await copyText(text)) toast("ok", "Tautan disalin.");
        else toast("error", "Gagal menyalin. Salin manual dari Export CSV.");
      }}
    >
      <Link2 className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}

function GuestForm({ guest, categories, onClose, onSaved }: { guest: Guest | null; categories: string[]; onClose: () => void; onSaved: (g: Guest) => void }) {
  type In = z.input<typeof guestSchema>;
  type Out = z.output<typeof guestSchema>;
  const toast = useToast();
  const { register, handleSubmit, formState } = useForm<In, unknown, Out>({
    resolver: zodResolver(guestSchema),
    defaultValues: guest
      ? { name: guest.name, category: guest.category, whatsapp: guest.whatsapp ?? "", max_pax: guest.max_pax, notes: guest.notes, invitation_status: guest.invitation_status }
      : { name: "", category: "Umum", whatsapp: "", max_pax: 2, notes: "", invitation_status: "belum_dikirim" },
  });

  async function onSubmit(v: Out) {
    const payload = { ...v, whatsapp: v.whatsapp || null, category: v.category || "Umum" };
    const q = guest ? db().from("guests").update(payload).eq("id", guest.id) : db().from("guests").insert(payload);
    const { data, error } = await q.select("*, rsvps(attendance, pax)").single();
    if (error) return toast("error", errMessage(error));
    toast("ok", guest ? "Data tamu diperbarui." : "Tamu ditambahkan.");
    onSaved(data as Guest);
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={guest ? "Edit tamu" : "Tambah tamu"}
      footer={
        <>
          <Button onClick={onClose}>Batal</Button>
          <Button variant="primary" loading={formState.isSubmitting} onClick={handleSubmit(onSubmit)}>
            Simpan
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama" htmlFor="g-name" error={formState.errors.name?.message} className="sm:col-span-2">
          <Input id="g-name" aria-invalid={Boolean(formState.errors.name)} {...register("name")} />
        </Field>
        <Field label="Kategori / kelompok" htmlFor="g-cat">
          <Input id="g-cat" list="g-cat-list" {...register("category")} />
          <datalist id="g-cat-list">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Maksimum orang" htmlFor="g-max" error={formState.errors.max_pax?.message}>
          <Input id="g-max" type="number" min={1} max={20} {...register("max_pax")} />
        </Field>
        <Field label="Nomor WhatsApp (opsional)" htmlFor="g-wa" error={formState.errors.whatsapp?.message} help="Contoh: 081234567890">
          <Input id="g-wa" inputMode="tel" {...register("whatsapp")} />
        </Field>
        <Field label="Status undangan" htmlFor="g-status">
          <Select id="g-status" {...register("invitation_status")}>
            <option value="belum_dikirim">Belum dikirim</option>
            <option value="terkirim">Terkirim</option>
          </Select>
        </Field>
        <Field label="Catatan internal" htmlFor="g-notes" className="sm:col-span-2" help="Hanya terlihat di dashboard.">
          <Textarea id="g-notes" rows={2} {...register("notes")} />
        </Field>
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Dialog>
  );
}

const pick = (row: Record<string, string>, keys: string[]) => {
  for (const k of Object.keys(row)) if (keys.includes(k.trim().toLowerCase())) return (row[k] ?? "").trim();
  return "";
};

function ImportDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [rows, setRows] = useState<{ name: string; category: string; whatsapp: string | null; max_pax: number; notes: string }[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();

  function reset() {
    setRows([]);
    setProblems([]);
    if (input.current) input.current.value = "";
  }

  function parse(file: File | undefined) {
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const ok: typeof rows = [];
        const bad: string[] = [];
        res.data.forEach((r, i) => {
          const parsed = guestSchema.safeParse({
            name: pick(r, ["nama", "name"]),
            category: pick(r, ["kategori", "category", "kelompok"]) || "Umum",
            whatsapp: pick(r, ["whatsapp", "wa", "phone", "telepon", "no_wa"]),
            max_pax: pick(r, ["maks_orang", "max_pax", "maks", "jumlah"]) || "2",
            notes: pick(r, ["catatan", "notes"]),
          });
          if (parsed.success) ok.push({ ...parsed.data, whatsapp: parsed.data.whatsapp || null });
          else bad.push(`Baris ${i + 2}: ${parsed.error.issues[0]?.message}`);
        });
        setRows(ok);
        setProblems(bad);
      },
      error: (e) => setProblems([e.message]),
    });
  }

  async function run() {
    setBusy(true);
    try {
      for (let i = 0; i < rows.length; i += 200) {
        const { error } = await db().from("guests").insert(rows.slice(i, i + 200));
        if (error) throw error;
      }
      toast("ok", `${rows.length} tamu diimport.`);
      reset();
      onClose();
      onDone();
    } catch (e) {
      toast("error", `Import berhenti: ${errMessage(e)}. Tamu yang sudah masuk tetap tersimpan.`);
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Import tamu dari CSV"
      description="Kolom yang dikenali: nama, kategori, whatsapp, maks_orang, catatan. Baris pertama harus judul kolom."
      footer={
        <>
          <Button
            onClick={() =>
              downloadText("contoh-daftar-tamu.csv", "﻿nama,kategori,whatsapp,maks_orang,catatan\nBudi Santoso,Keluarga,081234567890,2,\nSari Wulandari,Teman Kantor,,1,Meja VIP\n", "text/csv")
            }
          >
            Unduh contoh
          </Button>
          <Button variant="primary" disabled={!rows.length} loading={busy} onClick={run}>
            Import {rows.length || ""} tamu
          </Button>
        </>
      }
    >
      <input ref={input} type="file" accept=".csv,text/csv" onChange={(e) => parse(e.target.files?.[0])} className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-admin-line file:bg-white file:px-3 file:py-2" aria-label="Pilih file CSV" />
      {rows.length > 0 && <p className="mt-4 text-sm text-admin-ok">{rows.length} baris siap diimport.</p>}
      {problems.length > 0 && (
        <div className="mt-4 rounded-md bg-[#FBF1EF] p-3 text-sm text-[#7E2A1D]">
          <p className="font-medium">{problems.length} baris dilewati:</p>
          <ul className="mt-1 list-disc pl-5">
            {problems.slice(0, 8).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </Dialog>
  );
}
