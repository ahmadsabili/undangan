"use client";

import { useCallback, useEffect, useState } from "react";
import { MediaField } from "@/components/admin/MediaPicker";
import { Badge, Button, Card, ErrorState, Field, Input, LoadingBlock, PageHeader, Select, Switch, Textarea, useConfirm, useToast } from "@/components/ui";
import { TIMEZONES, utcToZonedInput, zonedInputToIso } from "@/lib/date";
import { db, emitDraftChanged, errMessage, setPublished } from "@/services/admin";
import { useFeatures } from "@/components/admin/useFeatures";
import type { AccessMode, FeatureToggleKey } from "@/types/invitation";

type Row = {
  site_name: string;
  site_title: string;
  meta_description: string;
  language: "id" | "en";
  timezone: string;
  wedding_date: string;
  monogram_text: string;
  logo_media_id: string | null;
  favicon_media_id: string | null;
  og_media_id: string | null;
  music_enabled: boolean;
  music_media_id: string | null;
  music_volume: number;
  rsvp_deadline: string | null;
  rsvp_max_pax: number;
  wishes_moderation: "manual" | "auto";
  noindex: boolean;
  is_published: boolean;
};

type Form = Omit<Row, "wedding_date" | "rsvp_deadline" | "is_published"> & { wedding_local: string; deadline_local: string };

const COLS =
  "site_name, site_title, meta_description, language, timezone, wedding_date, monogram_text, logo_media_id, favicon_media_id, og_media_id, music_enabled, music_media_id, music_volume, rsvp_deadline, rsvp_max_pax, wishes_moderation, noindex, is_published";

function toForm(r: Row): Form {
  const { wedding_date, rsvp_deadline, is_published: _p, ...rest } = r;
  void _p;
  return { ...rest, music_volume: Number(rest.music_volume), wedding_local: utcToZonedInput(wedding_date, r.timezone), deadline_local: utcToZonedInput(rsvp_deadline, r.timezone) };
}

export default function SettingsPage() {
  const [row, setRow] = useState<Row | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pubBusy, setPubBusy] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const load = useCallback(async () => {
    setError(null);
    const { data, error } = await db().from("wedding_settings").select(COLS).eq("id", 1).single();
    if (error) return setError(error.message);
    setRow(data as Row);
    setForm(toForm(data as Row));
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!form || !row) return <LoadingBlock rows={6} />;

  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(row));
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm({ ...form, [k]: v });

  async function save() {
    if (!form) return;
    if (!form.wedding_local) return toast("error", "Tanggal pernikahan wajib diisi.");
    if (form.music_enabled && !form.music_media_id) return toast("error", "Pilih file musik atau matikan fitur musik.");
    setSaving(true);
    const { wedding_local, deadline_local, ...rest } = form;
    const payload = {
      ...rest,
      rsvp_max_pax: Math.min(Math.max(Number(rest.rsvp_max_pax) || 1, 1), 20),
      wedding_date: zonedInputToIso(wedding_local, form.timezone),
      rsvp_deadline: zonedInputToIso(deadline_local, form.timezone),
    };
    const { data, error } = await db().from("wedding_settings").update(payload).eq("id", 1).select(COLS).single();
    setSaving(false);
    if (error) return toast("error", `Gagal menyimpan: ${error.message}`);
    setRow(data as Row);
    setForm(toForm(data as Row));
    toast("ok", "Pengaturan tersimpan sebagai draft.");
    emitDraftChanged();
  }

  async function togglePublished(v: boolean) {
    const ok = await confirm({
      title: v ? "Online-kan undangan?" : "Offline-kan undangan?",
      body: v ? "Undangan publik akan dapat dibuka lagi dengan versi terakhir yang dipublikasikan." : "Pengunjung akan melihat pesan bahwa undangan belum dipublikasikan. Data tidak terhapus.",
      confirmLabel: v ? "Online-kan" : "Offline-kan",
      danger: !v,
    });
    if (!ok) return;
    setPubBusy(true);
    try {
      await setPublished(v);
      setRow((r) => (r ? { ...r, is_published: v } : r));
      toast("ok", v ? "Undangan sekarang online." : "Undangan sekarang offline.");
    } catch (e) {
      toast("error", errMessage(e));
    } finally {
      setPubBusy(false);
    }
  }

  const saveBar = (
    <>
      {dirty && <Badge tone="warn">Belum disimpan</Badge>}
      <Button disabled={!dirty} onClick={() => setForm(toForm(row))}>
        Reset
      </Button>
      <Button variant="primary" disabled={!dirty} loading={saving} onClick={save}>
        Simpan draft
      </Button>
    </>
  );

  return (
    <>
      <PageHeader title="Pengaturan" description="Informasi umum, SEO, musik, dan aturan RSVP. Tersimpan sebagai draft sampai Anda Publish." actions={saveBar} />
      <div className="grid grid-cols-1 gap-6">
        <Card title="Status publikasi" description="Berlaku langsung, tidak perlu Publish.">
          <Switch label={row.is_published ? "Undangan online" : "Undangan offline"} description="Saat offline, tautan undangan menampilkan pesan bahwa undangan belum tersedia." checked={row.is_published} disabled={pubBusy} onChange={togglePublished} />
        </Card>

        <FeatureToggles />

        <Card title="Umum">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nama website" htmlFor="site_name">
              <Input id="site_name" value={form.site_name} onChange={(e) => set("site_name", e.target.value)} />
            </Field>
            <Field label="Judul halaman (title)" htmlFor="site_title" help="Tampil di tab browser dan preview WhatsApp.">
              <Input id="site_title" value={form.site_title} onChange={(e) => set("site_title", e.target.value)} />
            </Field>
            <Field label="Meta description" htmlFor="meta" className="md:col-span-2" help="Kalimat pendek di bawah judul saat tautan dibagikan.">
              <Textarea id="meta" rows={2} maxLength={300} value={form.meta_description} onChange={(e) => set("meta_description", e.target.value)} />
            </Field>
            <Field label="Tanggal & jam pernikahan" htmlFor="wdate" help="Dipakai untuk countdown dan kalender.">
              <Input id="wdate" type="datetime-local" value={form.wedding_local} onChange={(e) => set("wedding_local", e.target.value)} />
            </Field>
            <Field label="Zona waktu" htmlFor="tz">
              <Select id="tz" value={form.timezone} onChange={(e) => set("timezone", e.target.value)}>
                {TIMEZONES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Bahasa antarmuka" htmlFor="lang" help="Mengubah label tombol & format tanggal. Konten tetap sesuai tulisan Anda.">
              <Select id="lang" value={form.language} onChange={(e) => set("language", e.target.value as Form["language"])}>
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </Select>
            </Field>
            <Field label="Teks monogram" htmlFor="mono" help="Kosongkan untuk otomatis dari inisial nama panggilan, contoh: A & R">
              <Input id="mono" value={form.monogram_text} maxLength={12} onChange={(e) => set("monogram_text", e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card title="Identitas visual & SEO">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Logo / monogram custom" help="PNG transparan atau SVG. SVG dibersihkan dari script otomatis saat diunggah.">
              <MediaField label="logo" value={form.logo_media_id} onChange={(v) => set("logo_media_id", v)} />
            </Field>
            <Field label="Favicon" help="Gambar persegi, minimal 192 x 192 px.">
              <MediaField label="favicon" value={form.favicon_media_id} onChange={(v) => set("favicon_media_id", v)} />
            </Field>
            <Field label="Gambar share (Open Graph)" help="Opsional, 1200 x 630. Bila kosong, kartu otomatis dibuat mengikuti template, warna, font, dan foto sampul undangan.">
              <MediaField label="gambar share" value={form.og_media_id} onChange={(v) => set("og_media_id", v)} />
            </Field>
            <div className="self-center">
              <Switch label="Sembunyikan dari mesin pencari (noindex)" description="Disarankan aktif untuk undangan pribadi." checked={form.noindex} onChange={(v) => set("noindex", v)} />
            </div>
          </div>
          <OgPreview />
        </Card>

        <Card title="Musik latar" description="Gunakan file musik yang Anda punya izin untuk memakainya.">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Switch label="Aktifkan musik" description="Musik mulai setelah tamu menekan Buka Undangan dan bisa dimatikan kapan saja." checked={form.music_enabled} onChange={(v) => set("music_enabled", v)} />
            </div>
            <Field label="File musik (MP3/M4A, maks 15 MB)" help="Disarankan di bawah 8 MB (MP3 128 kbps). File di bawah 10 MB diputar lewat cache Vercel sehingga tidak menghabiskan kuota Supabase.">
              <MediaField label="musik" kind="audio" value={form.music_media_id} onChange={(v) => set("music_media_id", v)} />
            </Field>
            <Field label={`Volume awal: ${Math.round(form.music_volume * 100)}%`} htmlFor="vol">
              <input id="vol" type="range" min={0.1} max={1} step={0.05} value={form.music_volume} onChange={(e) => set("music_volume", Number(e.target.value))} className="w-full accent-[#454B40]" />
            </Field>
          </div>
        </Card>

        <Card title="RSVP & ucapan">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Batas waktu RSVP" htmlFor="deadline" help="Kosongkan bila tidak ada batas. Setelah lewat, formulir otomatis ditutup.">
              <Input id="deadline" type="datetime-local" value={form.deadline_local} onChange={(e) => set("deadline_local", e.target.value)} />
            </Field>
            <Field label="Maksimum jumlah tamu (tautan ?to=)" htmlFor="maxpax" help="Tamu terdaftar memakai batas masing-masing di Daftar Tamu.">
              <Input id="maxpax" type="number" min={1} max={20} value={form.rsvp_max_pax} onChange={(e) => set("rsvp_max_pax", Number(e.target.value))} />
            </Field>
            <Field label="Moderasi ucapan" htmlFor="mod" help="Berlaku langsung setelah disimpan. Ucapan yang terdeteksi spam selalu masuk antrean.">
              <Select id="mod" value={form.wishes_moderation} onChange={(e) => set("wishes_moderation", e.target.value as Form["wishes_moderation"])}>
                <option value="manual">Manual: tampil setelah disetujui</option>
                <option value="auto">Otomatis: langsung tampil</option>
              </Select>
            </Field>
          </div>
        </Card>

        <div className="flex justify-end gap-2">{saveBar}</div>
      </div>
    </>
  );
}

const FEATURE_INFO: { key: FeatureToggleKey; label: string; description: string }[] = [
  {
    key: "sessions",
    label: "Undangan per acara / sesi",
    description: "Tentukan acara mana yang dilihat tiap tamu (misalnya akad hanya keluarga, resepsi sesi 1 atau 2). Diatur di Daftar Tamu. Tamu tanpa pengaturan tetap melihat semua acara.",
  },
  {
    key: "open_tracking",
    label: "Status \"sudah dibuka\"",
    description: "Mencatat kapan tamu berkode pertama kali membuka undangannya, agar Anda bisa mengingatkan yang belum membuka. Tidak mencatat data lain.",
  },
  {
    key: "checkin",
    label: "Check-in hari H dengan QR",
    description: "Petugas penerima tamu memindai QR tamu di halaman /checkin untuk mencatat kehadiran. Akun petugas dibuat dengan npm run create-admin -- email password checkin.",
  },
  {
    key: "physical",
    label: "Undangan fisik",
    description: "Menambah kolom jenis undangan (digital, fisik, keduanya) di Daftar Tamu dan tombol Ekspor untuk cetak: PDF kartu atau stiker QR, serta paket ZIP untuk percetakan.",
  },
];

function FeatureToggles() {
  const { features, error, setFeature } = useFeatures();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  return (
    <Card title="Fitur tambahan" description="Aktifkan sesuai kebutuhan. Berlaku langsung, tidak perlu Publish.">
      {error && <p className="mb-4 rounded-md bg-[#FBF1EF] px-4 py-3 text-sm text-[#7E2A1D]">{error}</p>}
      {!features ? (
        <LoadingBlock rows={3} />
      ) : (
        <div className="space-y-5">
          {FEATURE_INFO.map((f) => (
            <Switch
              key={f.key}
              label={f.label}
              description={f.description}
              checked={features[f.key]}
              disabled={busy === f.key || Boolean(error)}
              onChange={async (v) => {
                setBusy(f.key);
                try {
                  await setFeature(f.key, v);
                  toast("ok", `${f.label} ${v ? "diaktifkan" : "dinonaktifkan"}.`);
                } catch (e) {
                  toast("error", errMessage(e));
                } finally {
                  setBusy(null);
                }
              }}
            />
          ))}
          <div className="border-t border-admin-line pt-5">
            <Field label="Siapa yang bisa membuka undangan" htmlFor="access" help={ACCESS_HELP[features.access]}>
              <Select
                id="access"
                value={features.access}
                disabled={busy === "access" || Boolean(error)}
                onChange={async (e) => {
                  const v = e.target.value as AccessMode;
                  setBusy("access");
                  try {
                    await setFeature("access", v);
                    toast("ok", "Akses undangan diperbarui.");
                  } catch (err) {
                    toast("error", errMessage(err));
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                <option value="open">Semua orang (bawaan)</option>
                <option value="link">Wajib tautan tamu</option>
                <option value="code">Hanya tamu terdaftar</option>
              </Select>
            </Field>
          </div>
        </div>
      )}
    </Card>
  );
}

const ACCESS_HELP: Record<AccessMode, string> = {
  open: "Alamat utama tanpa tautan tamu tetap bisa dibuka, dengan sapaan bawaan di sampul.",
  link: "Alamat utama tanpa tautan tamu menampilkan pesan bahwa undangan bersifat pribadi. Tautan berkode dan tautan cepat ?to=Nama tetap bisa dibuka.",
  code: "Hanya tautan berkode (?guest=KODE atau /u/KODE) dari Daftar Tamu yang bisa dibuka. Tautan cepat ?to=Nama dan kode yang salah ditolak, begitu juga RSVP dan ucapan tanpa kode.",
};

/** Pratinjau gambar yang muncul saat tautan dibagikan (dari versi yang sudah dipublish). */
function OgPreview() {
  const [v, setV] = useState(() => Date.now());
  return (
    <div className="mt-6 border-t border-admin-line pt-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Pratinjau di WhatsApp</p>
          <p className="text-xs text-admin-muted">Dari versi yang sudah dipublish. Publish dulu setelah mengubah tema, foto, atau gambar share.</p>
        </div>
        <Button size="sm" onClick={() => setV(Date.now())}>
          Muat ulang
        </Button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- gambar dinamis dari /api/og */}
      <img src={`/api/og?preview=${v}`} alt="Pratinjau gambar share undangan" width={1200} height={630} className="mt-3 h-auto w-full max-w-xl rounded-md border border-admin-line" />
    </div>
  );
}
