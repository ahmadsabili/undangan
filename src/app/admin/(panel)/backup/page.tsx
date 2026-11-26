"use client";

import { Download, History, RotateCcw, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, PageHeader, useConfirm, useToast } from "@/components/ui";
import { downloadText } from "@/lib/utils";
import { db, emitDraftChanged, errMessage, toCsv } from "@/services/admin";
import { backupSchema } from "@/validation/admin";

const stamp = () => new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");

export default function BackupPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState<{ file: string; data: unknown; summary: string; full?: { guests: unknown[]; rsvps: unknown[]; wishes: unknown[] } } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const confirm = useConfirm();

  async function exportConfig() {
    setBusy("config");
    const { data, error } = await db().rpc("export_config");
    setBusy(null);
    if (error) return toast("error", error.message);
    downloadText(`undangan-konfigurasi-${stamp()}.json`, JSON.stringify(data, null, 2), "application/json");
  }

  async function exportGuests() {
    setBusy("guests");
    const { data, error } = await db().from("guests").select("name, category, whatsapp, max_pax, code, invitation_status, notes, created_at").order("created_at");
    setBusy(null);
    if (error) return toast("error", error.message);
    downloadText(
      `tamu-${stamp()}.csv`,
      toCsv(data ?? [], ["name", "category", "whatsapp", "max_pax", "code", "invitation_status", "notes", "created_at"].map((k) => ({ key: k, label: k }))),
      "text/csv",
    );
  }

  async function exportRsvp() {
    setBusy("rsvp");
    const { data, error } = await db().from("rsvps").select("name, attendance, pax, message, source, created_at, updated_at").order("created_at");
    setBusy(null);
    if (error) return toast("error", error.message);
    downloadText(`rsvp-${stamp()}.csv`, toCsv(data ?? [], ["name", "attendance", "pax", "message", "source", "created_at", "updated_at"].map((k) => ({ key: k, label: k }))), "text/csv");
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return toast("error", "File terlalu besar (maks 20 MB).");
    try {
      const raw = JSON.parse(await file.text());
      // File backup otomatis membungkus konfigurasi di "config" plus data tamu, RSVP, dan ucapan.
      const auto = raw && raw.kind === "auto-backup" ? raw : null;
      const json = auto ? auto.config : raw;
      const parsed = backupSchema.safeParse(json);
      if (!parsed.success) return toast("error", `File tidak valid: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message}`);
      const p = parsed.data;
      setPending({
        file: file.name,
        data: p,
        summary:
          `${p.sections.length} section, ${p.events?.length ?? 0} acara, ${p.stories?.length ?? 0} love story, ${p.gallery?.length ?? 0} foto galeri, ${p.gifts?.length ?? 0} metode hadiah, ${Object.keys(p.media ?? {}).length} media` +
          (auto ? `. Backup otomatis: ${auto.guests?.length ?? 0} tamu, ${auto.rsvps?.length ?? 0} RSVP, ${auto.wishes?.length ?? 0} ucapan.` : ""),
        full: auto ? { guests: auto.guests ?? [], rsvps: auto.rsvps ?? [], wishes: auto.wishes ?? [] } : undefined,
      });
    } catch {
      toast("error", "File bukan JSON yang valid.");
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  async function restore() {
    if (!pending) return;
    const ok = await confirm({
      title: "Pulihkan konfigurasi?",
      body: (
        <>
          Konten draft saat ini (pengaturan, section, acara, love story, galeri, hadiah, template) akan diganti isi <strong>{pending.file}</strong>. Data tamu, RSVP, dan ucapan tidak berubah. Versi publik baru berubah setelah Publish. Disarankan export konfigurasi saat ini terlebih dahulu.
        </>
      ),
      confirmLabel: "Pulihkan",
      danger: true,
    });
    if (!ok) return;
    setBusy("restore");
    const { error } = await db().rpc("restore_config", { p: pending.data });
    setBusy(null);
    if (error) return toast("error", `Restore gagal, tidak ada yang berubah: ${errMessage(error)}`);
    setPending(null);
    toast("ok", "Konfigurasi dipulihkan ke draft. Periksa di Preview lalu Publish.");
    emitDraftChanged();
  }

  async function restoreRecords() {
    if (!pending?.full) return;
    const ok = await confirm({
      title: "Kembalikan tamu, RSVP, dan ucapan yang terhapus?",
      body: "Hanya data yang tidak ada lagi di database yang ditambahkan kembali. Data yang masih ada, termasuk yang sudah diubah setelah backup, tidak disentuh.",
      confirmLabel: "Kembalikan",
    });
    if (!ok) return;
    setBusy("records");
    const { data, error } = await db().rpc("restore_deleted_records", { p: { kind: "auto-backup", ...pending.full } });
    setBusy(null);
    if (error) return toast("error", `Gagal, tidak ada yang berubah: ${errMessage(error)}`);
    const n = data as { guests: number; rsvps: number; wishes: number };
    toast("ok", `Dikembalikan: ${n.guests} tamu, ${n.rsvps} RSVP, ${n.wishes} ucapan.`);
  }

  async function discard() {
    const ok = await confirm({ title: "Buang semua perubahan draft?", body: "Draft akan dikembalikan sama persis dengan versi yang sedang tayang. Perubahan yang belum dipublikasikan akan hilang.", confirmLabel: "Buang draft", danger: true });
    if (!ok) return;
    setBusy("discard");
    const { error } = await db().rpc("discard_draft");
    setBusy(null);
    if (error) return toast("error", errMessage(error));
    toast("ok", "Draft dikembalikan ke versi tayang.");
    emitDraftChanged();
  }

  return (
    <>
      <PageHeader title="Backup & Restore" description="Simpan salinan konfigurasi secara berkala, terutama sebelum perubahan besar." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Export" description="Unduh salinan data.">
          <div className="grid gap-3">
            <Button onClick={exportConfig} loading={busy === "config"} className="justify-start">
              <Download className="h-4 w-4" aria-hidden="true" />
              Konfigurasi website (JSON)
            </Button>
            <Button onClick={exportGuests} loading={busy === "guests"} className="justify-start">
              <Download className="h-4 w-4" aria-hidden="true" />
              Data tamu (CSV)
            </Button>
            <Button onClick={exportRsvp} loading={busy === "rsvp"} className="justify-start">
              <Download className="h-4 w-4" aria-hidden="true" />
              Data RSVP (CSV)
            </Button>
            <p className="text-xs text-admin-muted">File JSON berisi metadata dan URL media. File foto/musik tetap tersimpan di Supabase Storage.</p>
          </div>
        </Card>
        <Card title="Restore konfigurasi" description="Divalidasi dulu, lalu diterapkan dalam satu transaksi.">
          <input ref={input} type="file" accept="application/json,.json" className="sr-only" id="restore-file" onChange={(e) => readFile(e.target.files?.[0])} />
          <Button onClick={() => input.current?.click()}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            Pilih file JSON
          </Button>
          {pending && (
            <div className="mt-4 rounded-md border border-admin-line bg-[#FAF9F6] p-4 text-sm">
              <p className="font-medium">{pending.file}</p>
              <p className="mt-1 text-admin-muted">{pending.summary}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => setPending(null)}>
                  Batal
                </Button>
                <Button size="sm" variant="danger" loading={busy === "restore"} onClick={restore}>
                  Pulihkan konfigurasi ke draft
                </Button>
              </div>
              {pending.full && (
                <Button size="sm" className="mt-2" loading={busy === "records"} onClick={restoreRecords}>
                  Kembalikan tamu, RSVP, dan ucapan yang terhapus
                </Button>
              )}
            </div>
          )}
        </Card>
        <AutoBackups />
        <Card title="Buang perubahan draft" description="Kembalikan draft ke versi yang sedang tayang di publik." className="lg:col-span-2">
          <Button variant="dangerGhost" onClick={discard} loading={busy === "discard"}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Buang draft
          </Button>
        </Card>
      </div>
    </>
  );
}

type AutoFile = { name: string; created_at: string; size: number };

/** Backup otomatis mingguan yang dibuat cron harian (lihat /api/cron/daily). */
function AutoBackups() {
  const [files, setFiles] = useState<AutoFile[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/admin/backups", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal memuat.");
      setFiles(json.files);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setFiles([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createNow() {
    setBusy(true);
    const res = await fetch("/api/admin/backups", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast("error", json.error ?? "Gagal membuat backup.");
    toast("ok", "Backup dibuat.");
    void load();
  }

  const fmt = (iso: string) => (iso ? new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-");
  const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

  return (
    <Card title="Backup otomatis" description="Dibuat seminggu sekali, berisi konfigurasi, tamu, RSVP, dan ucapan. 8 file terakhir disimpan." className="lg:col-span-2">
      {err ? (
        <p className="text-sm text-admin-danger">
          {/bucket|not found/i.test(err) ? "Belum aktif: jalankan migration 20261129000008_auto_backup.sql di Supabase." : err}
        </p>
      ) : files === null ? (
        <p className="text-sm text-admin-muted">Memuat...</p>
      ) : files.length === 0 ? (
        <p className="text-sm text-admin-muted">Belum ada backup otomatis. Yang pertama dibuat pada jadwal harian berikutnya, atau buat sekarang.</p>
      ) : (
        <ul className="divide-y divide-admin-line rounded-md border border-admin-line">
          {files.map((f) => (
            <li key={f.name} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
              <span className="min-w-0">
                <span className="block truncate font-medium">{fmt(f.created_at)}</span>
                <span className="text-xs text-admin-muted">{kb(f.size)}</span>
              </span>
              <a className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-admin-line px-3 py-1.5 text-sm hover:bg-[#FAF9F6]" href={`/api/admin/backups?file=${encodeURIComponent(f.name)}`}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Unduh
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={createNow} loading={busy}>
          <History className="h-4 w-4" aria-hidden="true" />
          Buat backup sekarang
        </Button>
        <p className="text-xs text-admin-muted">Untuk memulihkan, unduh file lalu pilih di kartu Restore. Simpan sesekali salinannya di luar Supabase (misalnya Google Drive).</p>
      </div>
    </Card>
  );
}
