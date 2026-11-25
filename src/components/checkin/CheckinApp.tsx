"use client";

import jsQR from "jsqr";
import { Camera, CameraOff, Check, LayoutDashboard, Minus, Plus, Search, Undo2, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { Badge, Button, Dialog, ErrorState, Field, Input, Textarea, useToast } from "@/components/ui";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  category: string;
  code: string;
  max_pax: number;
  notes: string;
  events: string[] | null;
  checked_in_at: string | null;
  checked_in_pax: number | null;
  rsvp: { attendance: "hadir" | "tidak_hadir" | "ragu"; pax: number } | null;
};
type Summary = { guests_checked_in: number; pax_checked_in: number; pax_expected: number; recent: { id: string; name: string; pax: number; at: string; category: string }[] };

const RSVP = { hadir: "Konfirmasi hadir", tidak_hadir: "Konfirmasi tidak hadir", ragu: "Masih ragu" } as const;
const time = (iso: string) => new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const errText = (e: { message?: string } | null) => e?.message?.replace(/^.*?: /, "") ?? "Terjadi kesalahan.";

export function CheckinApp({ isAdmin, email }: { isAdmin: boolean; email: string }) {
  const db = getBrowserSupabase();
  const toast = useToast();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Row[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);
  const [pax, setPax] = useState(1);
  const [busy, setBusy] = useState(false);
  const [walkin, setWalkin] = useState(false);

  const loadSummary = useCallback(async () => {
    const { data, error } = await db.rpc("checkin_summary");
    if (error) setFatal(errText(error));
    else {
      setFatal(null);
      setSummary(data as Summary);
    }
  }, [db]);

  useEffect(() => {
    void loadSummary();
    const id = setInterval(loadSummary, 20000);
    return () => clearInterval(id);
  }, [loadSummary]);

  const choose = useCallback((r: Row) => {
    setSelected(r);
    setPax(r.checked_in_pax ?? (r.rsvp?.attendance === "hadir" ? Math.max(r.rsvp.pax, 1) : 1));
  }, []);

  const lookup = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) return;
      setSearching(true);
      const { data, error } = await db.rpc("checkin_lookup", { p_query: q });
      setSearching(false);
      if (error) return toast("error", errText(error));
      const rows = (data as Row[]) ?? [];
      setResults(rows);
      if (rows.length === 1) choose(rows[0]);
      if (!rows.length) toast("error", "Tamu tidak ditemukan. Cek ejaan atau catat sebagai tamu tanpa undangan.");
    },
    [db, toast, choose],
  );

  async function mark() {
    if (!selected) return;
    setBusy(true);
    const { data, error } = await db.rpc("checkin_mark", { p_guest: selected.id, p_pax: pax });
    setBusy(false);
    if (error) return toast("error", errText(error));
    navigator.vibrate?.(80);
    toast("ok", `${selected.name} tercatat hadir, ${pax} orang.`);
    setSelected(data as Row);
    setResults(null);
    setQuery("");
    void loadSummary();
  }

  async function undo() {
    if (!selected) return;
    setBusy(true);
    const { data, error } = await db.rpc("checkin_undo", { p_guest: selected.id });
    setBusy(false);
    if (error) return toast("error", errText(error));
    toast("info", `Check-in ${selected.name} dibatalkan.`);
    setSelected(data as Row);
    void loadSummary();
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-16 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between gap-2 py-2">
        <div>
          <h1 className="text-2xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Check-in Tamu
          </h1>
          <p className="truncate text-xs text-admin-muted">{email}</p>
        </div>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Link href="/admin" className="grid h-10 w-10 place-items-center rounded-md hover:bg-black/5" aria-label="Kembali ke dashboard">
              <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
            </Link>
          )}
          <SignOutButton compact />
        </div>
      </header>

      {fatal ? (
        <div className="mt-6">
          <ErrorState message={fatal} onRetry={loadSummary} />
          {isAdmin && /diaktifkan/.test(fatal) && (
            <p className="mt-3 text-sm text-admin-muted">
              Aktifkan di <Link href="/admin/settings" className="underline">Pengaturan &gt; Fitur tambahan</Link>.
            </p>
          )}
        </div>
      ) : (
        <>
          <section aria-label="Rekap kehadiran" className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-admin-line bg-white p-4">
              <p className="text-xs text-admin-muted">Orang hadir</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{summary?.pax_checked_in ?? "-"}</p>
              <p className="text-xs text-admin-muted">dari estimasi {summary?.pax_expected ?? "-"}</p>
            </div>
            <div className="rounded-lg border border-admin-line bg-white p-4">
              <p className="text-xs text-admin-muted">Undangan check-in</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{summary?.guests_checked_in ?? "-"}</p>
            </div>
          </section>

          <Scanner onCode={(text) => void lookup(text)} />

          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void lookup(query);
            }}
          >
            <label htmlFor="ci-q" className="sr-only">
              Cari nama atau kode tamu
            </label>
            <Input id="ci-q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama atau kode tamu" autoComplete="off" />
            <Button type="submit" variant="primary" loading={searching} aria-label="Cari tamu">
              <Search className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>

          {results && results.length > 1 && (
            <ul className="mt-3 divide-y divide-admin-line rounded-lg border border-admin-line bg-white" aria-label="Hasil pencarian">
              {results.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => choose(r)} className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-black/[0.03]">
                    <span>
                      <span className="block text-sm font-medium">{r.name}</span>
                      <span className="text-xs text-admin-muted">{r.category}</span>
                    </span>
                    {r.checked_in_at ? <Badge tone="ok">Sudah {time(r.checked_in_at)}</Badge> : <Badge>Belum</Badge>}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selected && (
            <section aria-live="polite" className={cn("mt-4 rounded-lg border-2 bg-white p-5", selected.checked_in_at ? "border-admin-ok" : "border-admin-brand")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-admin-muted">{selected.category}</p>
                  <h2 className="mt-0.5 break-words text-2xl font-semibold leading-tight">{selected.name}</h2>
                </div>
                <Button size="icon" variant="ghost" aria-label="Tutup" onClick={() => setSelected(null)}>
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selected.rsvp ? <Badge tone={selected.rsvp.attendance === "hadir" ? "ok" : "warn"}>{RSVP[selected.rsvp.attendance]}{selected.rsvp.attendance === "hadir" ? `, ${selected.rsvp.pax} orang` : ""}</Badge> : <Badge>Belum RSVP</Badge>}
                <Badge>Maks {selected.max_pax} orang</Badge>
                {selected.events?.map((t) => (
                  <Badge key={t} tone="info">
                    {t}
                  </Badge>
                ))}
              </div>
              {selected.notes && <p className="mt-3 rounded-md bg-[#F6EBD5] px-3 py-2 text-sm text-[#6B4A12]">Catatan: {selected.notes}</p>}
              {selected.checked_in_at && (
                <p className="mt-3 flex items-center gap-2 text-sm font-medium text-admin-ok">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Sudah check-in pukul {time(selected.checked_in_at)}, {selected.checked_in_pax} orang
                </p>
              )}

              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="text-sm font-medium" id="pax-label">
                  Jumlah orang datang
                </span>
                <div className="flex items-center gap-2" role="group" aria-labelledby="pax-label">
                  <Button size="icon" onClick={() => setPax((p) => Math.max(1, p - 1))} aria-label="Kurangi jumlah">
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <span className="w-10 text-center text-2xl font-semibold tabular-nums" aria-live="polite">
                    {pax}
                  </span>
                  <Button size="icon" onClick={() => setPax((p) => Math.min(50, p + 1))} aria-label="Tambah jumlah">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
              {pax > selected.max_pax && <p className="mt-2 text-xs text-[#8a5a00]">Melebihi batas undangan ({selected.max_pax} orang). Tetap bisa dicatat.</p>}

              <div className="mt-5 grid gap-2">
                <Button variant="primary" className="min-h-[52px] text-base" loading={busy} onClick={mark}>
                  <Check className="h-5 w-5" aria-hidden="true" />
                  {selected.checked_in_at ? "Simpan jumlah orang" : "Check-in sekarang"}
                </Button>
                {selected.checked_in_at && (
                  <Button variant="dangerGhost" onClick={undo} disabled={busy}>
                    <Undo2 className="h-4 w-4" aria-hidden="true" />
                    Batalkan check-in
                  </Button>
                )}
              </div>
            </section>
          )}

          <Button className="mt-4 w-full" onClick={() => setWalkin(true)}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Tamu tanpa undangan terdaftar
          </Button>

          <section className="mt-6" aria-label="Check-in terakhir">
            <h2 className="text-sm font-semibold">Check-in terakhir</h2>
            {!summary ? (
              <p className="mt-2 text-sm text-admin-muted">Memuat...</p>
            ) : summary.recent.length === 0 ? (
              <p className="mt-2 text-sm text-admin-muted">Belum ada tamu yang check-in.</p>
            ) : (
              <ul className="mt-2 divide-y divide-admin-line rounded-lg border border-admin-line bg-white">
                {summary.recent.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <span className="min-w-0 truncate">
                      {r.name} <span className="text-xs text-admin-muted">· {r.category}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-admin-muted">
                      {r.pax} org · {time(r.at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <WalkinDialog
        open={walkin}
        onClose={() => setWalkin(false)}
        onDone={(r) => {
          choose(r);
          void loadSummary();
        }}
      />
    </div>
  );
}

// Pemindai QR: kamera belakang + jsQR (berjalan juga di Safari iPhone).
function Scanner({ onCode }: { onCode: (text: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const raf = useRef<number>(0);
  const last = useRef<{ text: string; at: number }>({ text: "", at: 0 });
  const [on, setOn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setOn(false);
  }, []);

  useEffect(() => stop, [stop]);

  async function start() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) return setError("Browser ini tidak mendukung kamera. Gunakan pencarian nama di bawah.");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      stream.current = s;
      const v = video.current!;
      v.srcObject = s;
      await v.play();
      setOn(true);
      let tick = 0;
      const loop = () => {
        raf.current = requestAnimationFrame(loop);
        if (++tick % 6 !== 0 || v.readyState < 2) return; // sekitar 10x per detik
        const c = canvas.current!;
        const w = 480;
        const h = Math.round((v.videoHeight / v.videoWidth) * w) || 360;
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(v, 0, 0, w, h);
        const img = ctx.getImageData(0, 0, w, h);
        const qr = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
        if (qr?.data) {
          const now = Date.now();
          // abaikan QR yang sama dalam 4 detik agar tidak tercatat berulang
          if (qr.data !== last.current.text || now - last.current.at > 4000) {
            last.current = { text: qr.data, at: now };
            navigator.vibrate?.(40);
            onCode(qr.data);
          }
        }
      };
      loop();
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      setError(name === "NotAllowedError" ? "Izin kamera ditolak. Izinkan kamera di pengaturan browser, lalu coba lagi." : "Kamera tidak dapat dibuka. Gunakan pencarian nama di bawah.");
      stop();
    }
  }

  return (
    <section className="mt-4 overflow-hidden rounded-lg border border-admin-line bg-white" aria-label="Pemindai QR">
      <div className={cn("relative aspect-[4/3] bg-[#1c1c1a]", !on && "hidden")}>
        <video ref={video} playsInline muted className="h-full w-full object-cover" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-[18%] rounded-lg border-2 border-white/80" />
      </div>
      <canvas ref={canvas} className="hidden" />
      <div className="flex items-center justify-between gap-3 p-3">
        <p className="text-sm text-admin-muted">{on ? "Arahkan ke QR di undangan tamu." : "Pindai QR undangan tamu dengan kamera."}</p>
        {on ? (
          <Button onClick={stop}>
            <CameraOff className="h-4 w-4" aria-hidden="true" />
            Matikan
          </Button>
        ) : (
          <Button variant="primary" onClick={start}>
            <Camera className="h-4 w-4" aria-hidden="true" />
            Buka kamera
          </Button>
        )}
      </div>
      {error && <p role="alert" className="px-3 pb-3 text-sm text-admin-danger">{error}</p>}
    </section>
  );
}

function WalkinDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (r: Row) => void }) {
  const db = getBrowserSupabase();
  const toast = useToast();
  const [name, setName] = useState("");
  const [pax, setPax] = useState(1);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    const { data, error } = await db.rpc("checkin_walkin", { p_name: name, p_pax: pax, p_note: note });
    setBusy(false);
    if (error) return toast("error", errText(error));
    toast("ok", `${name} dicatat dan check-in.`);
    setName("");
    setPax(1);
    setNote("");
    onClose();
    onDone(data as Row);
  }
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Tamu tanpa undangan terdaftar"
      description="Dicatat sebagai tamu baru berkategori Walk-in dan langsung check-in."
      footer={
        <>
          <Button onClick={onClose}>Batal</Button>
          <Button variant="primary" loading={busy} disabled={name.trim().length < 2} onClick={save}>
            Catat & check-in
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Nama" htmlFor="wi-name">
          <Input id="wi-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        </Field>
        <Field label="Jumlah orang" htmlFor="wi-pax">
          <Input id="wi-pax" type="number" inputMode="numeric" min={1} max={50} value={pax} onChange={(e) => setPax(Math.min(50, Math.max(1, Number(e.target.value) || 1)))} />
        </Field>
        <Field label="Catatan (opsional)" htmlFor="wi-note" help="Misalnya: rekan kerja Bapak, datang bersama keluarga X.">
          <Textarea id="wi-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}
