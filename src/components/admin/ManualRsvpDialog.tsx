"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Dialog, Field, Input, Select, Textarea, useToast } from "@/components/ui";
import { db, errMessage } from "@/services/admin";
import { rsvpAdminSchema } from "@/validation/admin";

type GuestOpt = { id: string; name: string; category: string; max_pax: number; rsvps: { attendance: string } | null };
export type PresetGuest = { id: string; name: string; max_pax: number };

/**
 * Catat RSVP atas nama tamu (misalnya konfirmasi lewat telepon atau titip pesan).
 * Untuk tamu terdaftar, RSVP lama tamu itu diperbarui (satu RSVP per tamu).
 */
export function ManualRsvpDialog({ open, onClose, onSaved, preset }: { open: boolean; onClose: () => void; onSaved: () => void; preset?: PresetGuest | null }) {
  const toast = useToast();
  const [guests, setGuests] = useState<GuestOpt[] | null>(null);
  const [mode, setMode] = useState<"registered" | "free">("registered");
  const [q, setQ] = useState("");
  const [guestId, setGuestId] = useState<string>("");
  const [name, setName] = useState("");
  const [attendance, setAttendance] = useState<"hadir" | "tidak_hadir" | "ragu">("hadir");
  const [pax, setPax] = useState(1);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode("registered");
    setGuestId(preset?.id ?? "");
    setQ("");
    setName("");
    setAttendance("hadir");
    setPax(1);
    setMessage("Dicatat oleh admin");
    if (preset) return;
    db()
      .from("guests")
      .select("id, name, category, max_pax, rsvps(attendance)")
      .order("name")
      .then(({ data }) => setGuests((data as unknown as GuestOpt[]) ?? []));
  }, [open, preset]);

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (guests ?? []).filter((g) => !t || g.name.toLowerCase().includes(t)).slice(0, 50);
  }, [guests, q]);
  const selected = preset ?? guests?.find((g) => g.id === guestId) ?? null;
  const maxPax = mode === "registered" && selected ? selected.max_pax : 20;

  async function save() {
    const finalName = mode === "registered" ? selected?.name ?? "" : name.trim();
    if (mode === "registered" && !selected) return toast("error", "Pilih tamu terlebih dahulu.");
    const parsed = rsvpAdminSchema.safeParse({ name: finalName, attendance, pax: attendance === "tidak_hadir" ? 0 : pax, message });
    if (!parsed.success) return toast("error", parsed.error.issues[0].message);
    setBusy(true);
    const row = { ...parsed.data, source: "admin" };
    const { error } =
      mode === "registered"
        ? await db().from("rsvps").upsert({ ...row, guest_id: selected!.id }, { onConflict: "guest_id" })
        : await db().from("rsvps").insert(row);
    setBusy(false);
    if (error) return toast("error", errMessage(error));
    toast("ok", `RSVP ${finalName} tersimpan.`);
    onSaved();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={preset ? `Catat RSVP: ${preset.name}` : "Catat RSVP manual"}
      description="Untuk tamu yang mengonfirmasi lewat telepon, pesan, atau langsung. Masuk ke rekap yang sama."
      footer={
        <>
          <Button onClick={onClose}>Batal</Button>
          <Button variant="primary" loading={busy} onClick={save}>
            Simpan RSVP
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {!preset && (
          <div role="radiogroup" aria-label="Jenis tamu" className="grid grid-cols-2 gap-2">
            {(
              [
                ["registered", "Tamu terdaftar"],
                ["free", "Tidak terdaftar"],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={mode === v}
                onClick={() => setMode(v)}
                className={`min-h-[40px] rounded-md border text-sm ${mode === v ? "border-admin-brand bg-[#EEF0EA] font-medium" : "border-admin-line"}`}
              >
                {l}
              </button>
            ))}
          </div>
        )}
        {mode === "registered" && !preset && (
          <div className="space-y-2">
            <Field label="Cari tamu" htmlFor="mr-q">
              <Input id="mr-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ketik nama" autoComplete="off" />
            </Field>
            <ul className="max-h-48 overflow-y-auto rounded-md border border-admin-line" role="listbox" aria-label="Pilih tamu">
              {!guests && <li className="px-3 py-2 text-sm text-admin-muted">Memuat...</li>}
              {guests && matches.length === 0 && <li className="px-3 py-2 text-sm text-admin-muted">Tidak ada yang cocok.</li>}
              {matches.map((g) => (
                <li key={g.id} role="option" aria-selected={guestId === g.id}>
                  <button type="button" onClick={() => setGuestId(g.id)} className={`flex min-h-[40px] w-full items-center justify-between gap-2 px-3 text-left text-sm ${guestId === g.id ? "bg-[#EEF0EA] font-medium" : "hover:bg-black/[0.03]"}`}>
                    <span>
                      {g.name} <span className="text-xs text-admin-muted">· {g.category}</span>
                    </span>
                    {g.rsvps && <span className="text-xs text-admin-muted">sudah RSVP</span>}
                  </button>
                </li>
              ))}
            </ul>
            {selected && guests?.find((g) => g.id === selected.id)?.rsvps && <p className="text-xs text-[#8a5a00]">Tamu ini sudah punya RSVP. Menyimpan akan memperbaruinya.</p>}
          </div>
        )}
        {mode === "free" && (
          <Field label="Nama tamu" htmlFor="mr-name">
            <Input id="mr-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Kehadiran" htmlFor="mr-att">
            <Select id="mr-att" value={attendance} onChange={(e) => setAttendance(e.target.value as typeof attendance)}>
              <option value="hadir">Hadir</option>
              <option value="ragu">Masih ragu</option>
              <option value="tidak_hadir">Tidak hadir</option>
            </Select>
          </Field>
          {attendance !== "tidak_hadir" && (
            <Field label={`Jumlah orang (maks ${maxPax})`} htmlFor="mr-pax">
              <Input id="mr-pax" type="number" min={1} max={maxPax} value={pax} onChange={(e) => setPax(Math.min(maxPax, Math.max(1, Number(e.target.value) || 1)))} />
            </Field>
          )}
        </div>
        <Field label="Catatan" htmlFor="mr-msg">
          <Textarea id="mr-msg" rows={2} value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}
