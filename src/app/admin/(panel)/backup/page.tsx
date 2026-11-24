"use client";

import { Download, RotateCcw, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button, Card, PageHeader, useConfirm, useToast } from "@/components/ui";
import { downloadText } from "@/lib/utils";
import { db, emitDraftChanged, errMessage, toCsv } from "@/services/admin";
import { backupSchema } from "@/validation/admin";

const stamp = () => new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");

export default function BackupPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState<{ file: string; data: unknown; summary: string } | null>(null);
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
    if (file.size > 5 * 1024 * 1024) return toast("error", "File terlalu besar (maks 5 MB).");
    try {
      const json = JSON.parse(await file.text());
      const parsed = backupSchema.safeParse(json);
      if (!parsed.success) return toast("error", `File tidak valid: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message}`);
      const p = parsed.data;
      setPending({
        file: file.name,
        data: p,
        summary: `${p.sections.length} section, ${p.events?.length ?? 0} acara, ${p.stories?.length ?? 0} love story, ${p.gallery?.length ?? 0} foto galeri, ${p.gifts?.length ?? 0} metode hadiah, ${Object.keys(p.media ?? {}).length} media`,
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
                  Pulihkan ke draft
                </Button>
              </div>
            </div>
          )}
        </Card>
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
