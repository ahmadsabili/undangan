"use client";

import { Check, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, ErrorState, Field, Input, LoadingBlock, PageHeader, Select, useToast } from "@/components/ui";
import { FONT_OPTIONS, googleFontsHref } from "@/config/fonts";
import { BACKGROUND_OPTIONS, SECTION_META } from "@/config/sections";
import { LAYOUTS } from "@/config/layouts";
import { BUILTIN_PRESETS, PALETTE_GROUPS, PALETTES } from "@/config/palettes";
import { LayoutSketch } from "@/components/admin/LayoutSketch";
import { MediaField } from "@/components/admin/MediaPicker";
import { contrastWarnings, normalizeTheme, toneFor } from "@/lib/theme";
import { cn, slugify } from "@/lib/utils";
import { db, emitDraftChanged } from "@/services/admin";
import type { Section, SectionBackground, ThemeTokens } from "@/types/invitation";

type Preset = { id: string; slug: string; name: string; description: string; tokens: ThemeTokens; is_preset: boolean };

const COLOR_LABELS: [keyof ThemeTokens["colors"], string, string][] = [
  ["primary", "Primary", "Tombol, latar gelap, navigasi aktif"],
  ["secondary", "Secondary", "Latar lembut, blok informasi"],
  ["accent", "Accent", "Garis rambut, nomor folio, aksen kecil"],
  ["background", "Background", "Latar utama halaman"],
  ["surface", "Surface", "Latar putih / kartu"],
  ["text", "Text", "Warna teks utama"],
];

function Swatches({ t }: { t: ThemeTokens }) {
  return (
    <div className="flex">
      {(["background", "secondary", "accent", "primary", "text"] as const).map((k) => (
        <span key={k} className="h-6 flex-1 first:rounded-l last:rounded-r" style={{ background: t.colors[k] }} />
      ))}
    </div>
  );
}

export default function ThemePage() {
  const [saved, setSaved] = useState<{ theme: ThemeTokens; slug: string | null; bgs: Record<string, SectionBackground> } | null>(null);
  const [theme, setTheme] = useState<ThemeTokens | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [bgs, setBgs] = useState<Record<string, SectionBackground>>({});
  const [presets, setPresets] = useState<Preset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [customName, setCustomName] = useState("");
  const toast = useToast();

  const load = useCallback(async () => {
    setError(null);
    const [s, p, sec] = await Promise.all([
      db().from("wedding_settings").select("theme, theme_slug").eq("id", 1).single(),
      db().from("wedding_themes").select("*").order("sort_order"),
      db().from("wedding_sections").select("*").order("sort_order"),
    ]);
    const err = s.error ?? p.error ?? sec.error;
    if (err) return setError(err.message);
    const st = s.data!;
    const t = normalizeTheme(st.theme);
    const b = Object.fromEntries((sec.data as Section[]).map((x) => [x.id, x.background]));
    setTheme(t);
    setSlug(st.theme_slug);
    setBgs(b);
    setSaved({ theme: t, slug: st.theme_slug, bgs: b });
    // Preset bawaan aplikasi ditambahkan setelah preset database (tanpa duplikat slug).
    const fromDb = p.data as Preset[];
    const builtin = BUILTIN_PRESETS.filter((b) => !fromDb.some((x) => x.slug === b.slug)).map((b) => ({ ...b, id: `builtin-${b.slug}`, is_preset: true }));
    const custom = fromDb.filter((x) => !x.is_preset);
    setPresets([...fromDb.filter((x) => x.is_preset), ...builtin, ...custom]);
    setSections(sec.data as Section[]);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!theme || !saved) return <LoadingBlock rows={6} />;

  const dirty = JSON.stringify({ theme, slug, bgs }) !== JSON.stringify(saved);
  const setColor = (k: keyof ThemeTokens["colors"], v: string) => {
    setTheme({ ...theme, colors: { ...theme.colors, [k]: v } });
    setSlug(null);
  };
  const set = <K extends keyof ThemeTokens>(k: K, v: ThemeTokens[K]) => {
    setTheme({ ...theme, [k]: v });
    setSlug(null);
  };
  const warnings = contrastWarnings(theme);

  async function save() {
    setSaving(true);
    const r1 = await db().from("wedding_settings").update({ theme, theme_slug: slug }).eq("id", 1);
    const changed = sections.filter((s) => bgs[s.id] !== saved!.bgs[s.id]);
    const r2 = await Promise.all(changed.map((s) => db().from("wedding_sections").update({ background: bgs[s.id] }).eq("id", s.id)));
    setSaving(false);
    const err = r1.error ?? r2.find((r) => r.error)?.error;
    if (err) return toast("error", `Gagal menyimpan: ${err.message}`);
    setSaved({ theme: theme!, slug, bgs });
    toast("ok", "Tema tersimpan sebagai draft.");
    emitDraftChanged();
  }

  async function saveCustom() {
    const name = customName.trim();
    if (!name) return toast("error", "Beri nama tema terlebih dahulu.");
    const s = `custom-${slugify(name)}`;
    const { data, error } = await db().from("wedding_themes").upsert({ slug: s, name, tokens: theme!, is_preset: false, sort_order: 100 }, { onConflict: "slug" }).select("*").single();
    if (error) return toast("error", error.message);
    setPresets((p) => [...p.filter((x) => x.slug !== s), data as Preset]);
    setSlug(s);
    setCustomName("");
    toast("ok", `Tema "${name}" disimpan.`);
  }

  const fontHref = googleFontsHref([theme.fonts.heading, theme.fonts.body, theme.fonts.accent]);
  const previewTone = toneFor(theme, "background");

  return (
    <>
      <link rel="stylesheet" href={fontHref} />
      <PageHeader
        title="Tema"
        description="Ubah warna, huruf, dan gaya tanpa menyentuh konten. Menerapkan preset tidak menghapus konten apa pun."
        actions={
          <>
            {dirty && <Badge tone="warn">Belum disimpan</Badge>}
            <Button disabled={!dirty} onClick={() => { setTheme(saved.theme); setSlug(saved.slug); setBgs(saved.bgs); }}>
              Reset
            </Button>
            <Button variant="primary" disabled={!dirty} loading={saving} onClick={save}>
              Simpan draft
            </Button>
          </>
        }
      />

      <div className="grid gap-6">
        <Card title="Template tata letak" description="Mengubah susunan dan komposisi seluruh undangan. Warna, font, dan konten tidak berubah.">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LAYOUTS.map((l) => {
              const active = theme.layout === l.key;
              return (
                <li key={l.key}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTheme({ ...theme, layout: l.key })}
                    className={cn("w-full rounded-lg border p-3 text-left transition-colors", active ? "border-admin-brand ring-2 ring-admin-brand/20" : "border-admin-line hover:border-admin-muted")}
                  >
                    <LayoutSketch layout={l.key} colors={theme.colors} />
                    <span className="mt-3 flex items-center justify-between text-sm font-medium">
                      {l.name}
                      {active && <Check className="h-4 w-4" aria-hidden="true" />}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-admin-muted">{l.description}</span>
                    <span className="mt-1 block text-xs text-admin-muted">Serasi dengan: {l.bestWith}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {theme.layout === "nusantara" && (
            <div className="mt-5 rounded-md bg-[#F3F2EE] p-4">
              <Field label="Gambar ornamen custom (opsional)" help="Kosongkan untuk motif kawung bawaan yang mengikuti warna aksen. Pakai PNG transparan atau SVG motif yang Anda punya hak pakainya, misalnya motif songket atau batik keluarga. Gambar diulang sebagai pita dan ditampilkan di pemisah judul.">
                <MediaField label="ornamen" value={theme.ornamentMediaId} onChange={(v) => setTheme({ ...theme, ornamentMediaId: v })} />
              </Field>
            </div>
          )}
          {theme.layout === "cinematic" && (
            <p className="mt-5 rounded-md bg-[#F3F2EE] p-4 text-sm text-admin-muted">
              Tiap section memakai foto latar. Atur fotonya di menu Konten (kolom &quot;Foto latar&quot;). Bila kosong, foto galeri dipakai bergiliran.
            </p>
          )}
        </Card>

        <Card title="Preset tema">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {presets.map((p) => {
              const active = slug === p.slug;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      // Preset hanya mengganti warna & gaya; template tata letak dan ornamen tetap.
                      setTheme({ ...normalizeTheme(p.tokens), layout: theme.layout, ornamentMediaId: theme.ornamentMediaId });
                      setSlug(p.slug);
                    }}
                    aria-pressed={active}
                    className={cn("w-full rounded-lg border p-3 text-left transition-colors", active ? "border-admin-brand ring-2 ring-admin-brand/20" : "border-admin-line hover:border-admin-muted")}
                  >
                    <Swatches t={normalizeTheme(p.tokens)} />
                    <span className="mt-3 flex items-center justify-between text-sm font-medium">
                      {p.name}
                      {active && <Check className="h-4 w-4" aria-hidden="true" />}
                    </span>
                    <span className="mt-0.5 block text-xs text-admin-muted">{p.is_preset ? p.description : "Tema custom"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="grid gap-6">
            <Card title="Warna" description="Pilih palet siap pakai, lalu sesuaikan tiap warna bila perlu. Palet hanya mengganti warna; font dan gaya tetap.">
              <div className="space-y-4">
                {PALETTE_GROUPS.map((g) => (
                  <div key={g.key}>
                    <p className="text-xs font-medium tracking-wide text-admin-muted">{g.label}</p>
                    <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                      {PALETTES.filter((x) => x.group === g.key).map((pal) => {
                        const active = (Object.keys(pal.colors) as (keyof ThemeTokens["colors"])[]).every((k) => pal.colors[k].toUpperCase() === theme.colors[k].toUpperCase());
                        return (
                          <li key={pal.slug}>
                            <button
                              type="button"
                              aria-pressed={active}
                              onClick={() => {
                                setTheme({ ...theme, colors: { ...pal.colors } });
                                setSlug(null);
                              }}
                              className={cn("w-full rounded-md border p-2 text-left transition-colors", active ? "border-admin-brand ring-2 ring-admin-brand/20" : "border-admin-line hover:border-admin-muted")}
                            >
                              <span className="flex overflow-hidden rounded">
                                {(["background", "secondary", "accent", "primary", "text"] as const).map((k) => (
                                  <span key={k} className="h-5 flex-1" style={{ background: pal.colors[k] }} />
                                ))}
                              </span>
                              <span className="mt-1.5 flex items-center justify-between text-xs font-medium">
                                {pal.name}
                                {active && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="mb-3 mt-6 text-xs font-medium tracking-wide text-admin-muted">Atur manual</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {COLOR_LABELS.map(([k, label, help]) => (
                  <Field key={k} label={label} htmlFor={`c-${k}`} help={help}>
                    <div className="flex gap-2">
                      <input type="color" aria-label={`Pilih warna ${label}`} value={theme.colors[k]} onChange={(e) => setColor(k, e.target.value.toUpperCase())} className="h-10 w-12 shrink-0 rounded-md border border-admin-line bg-white p-1" />
                      <Input id={`c-${k}`} value={theme.colors[k]} maxLength={7} onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && setColor(k, e.target.value.toUpperCase())} className="font-mono" />
                    </div>
                  </Field>
                ))}
              </div>
              <ul className="mt-5 space-y-1.5 text-sm">
                {warnings.map((w) => (
                  <li key={w.label} className={cn("flex items-center gap-2", w.ok ? "text-admin-ok" : "text-admin-danger")}>
                    {w.ok ? <Check className="h-4 w-4" aria-hidden="true" /> : <TriangleAlert className="h-4 w-4" aria-hidden="true" />}
                    {w.label}: kontras {w.ratio.toFixed(1)}:1 {w.ok ? "" : "(di bawah 4.5:1, sulit dibaca)"}
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Tipografi & gaya">
              <div className="grid gap-4 sm:grid-cols-2">
                {(["heading", "body", "accent"] as const).map((k) => (
                  <Field key={k} label={k === "heading" ? "Font heading" : k === "body" ? "Font body" : "Font aksen (skrip)"} htmlFor={`f-${k}`}>
                    <Select id={`f-${k}`} value={theme.fonts[k]} onChange={(e) => set("fonts", { ...theme.fonts, [k]: e.target.value })}>
                      {FONT_OPTIONS.filter((f) => f.category === k).map((f) => (
                        <option key={f.family} value={f.family}>
                          {f.family}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ))}
                <Field label={`Ukuran huruf: ${Math.round(theme.fontScale * 100)}%`} htmlFor="scale">
                  <input id="scale" type="range" min={0.9} max={1.15} step={0.01} value={theme.fontScale} onChange={(e) => set("fontScale", Number(e.target.value))} className="w-full accent-[#454B40]" />
                </Field>
                <Field label={`Sudut (border radius): ${theme.radius}px`} htmlFor="radius">
                  <input id="radius" type="range" min={0} max={24} step={1} value={theme.radius} onChange={(e) => set("radius", Number(e.target.value))} className="w-full accent-[#454B40]" />
                </Field>
                <Field label={`Overlay foto: ${Math.round(theme.overlay * 100)}%`} htmlFor="overlay" help="Kegelapan lapisan di atas foto cover & penutup.">
                  <input id="overlay" type="range" min={0.15} max={0.8} step={0.01} value={theme.overlay} onChange={(e) => set("overlay", Number(e.target.value))} className="w-full accent-[#454B40]" />
                </Field>
                <Field label="Gaya tombol" htmlFor="btn">
                  <Select id="btn" value={theme.buttonStyle} onChange={(e) => set("buttonStyle", e.target.value as ThemeTokens["buttonStyle"])}>
                    <option value="solid">Solid</option>
                    <option value="outline">Outline</option>
                    <option value="underline">Garis bawah</option>
                  </Select>
                </Field>
                <Field label="Gaya navigasi" htmlFor="nav">
                  <Select id="nav" value={theme.navStyle} onChange={(e) => set("navStyle", e.target.value as ThemeTokens["navStyle"])}>
                    <option value="floating">Mengambang (kapsul)</option>
                    <option value="bar">Bar penuh di bawah</option>
                  </Select>
                </Field>
                <Field label="Intensitas animasi" htmlFor="anim" help="Pengunjung dengan pengaturan reduced motion tetap tidak melihat animasi.">
                  <Select id="anim" value={theme.animation} onChange={(e) => set("animation", e.target.value as ThemeTokens["animation"])}>
                    <option value="none">Tanpa animasi</option>
                    <option value="subtle">Halus</option>
                    <option value="normal">Normal</option>
                    <option value="expressive">Ekspresif</option>
                  </Select>
                </Field>
              </div>
            </Card>

            <Card title="Latar tiap section">
              <ul className="divide-y divide-admin-line">
                {sections
                  .filter((s) => !["cover", "closing"].includes(s.key))
                  .map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                      <label htmlFor={`bg-${s.id}`} className="text-sm">
                        {SECTION_META[s.key]?.label}
                      </label>
                      <Select id={`bg-${s.id}`} className="max-w-[200px]" value={bgs[s.id]} onChange={(e) => setBgs({ ...bgs, [s.id]: e.target.value as SectionBackground })}>
                        {BACKGROUND_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </Select>
                    </li>
                  ))}
              </ul>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Contoh tampilan">
              <div className="overflow-hidden rounded-md border border-admin-line" style={{ background: previewTone.bg, color: previewTone.ink, fontFamily: `"${theme.fonts.body}"` }}>
                <div className="p-5">
                  <p className="text-[0.7rem] tracking-[0.18em]" style={{ color: previewTone.accentInk }}>
                    No. 03
                  </p>
                  <p className="mt-2 text-4xl leading-none" style={{ fontFamily: `"${theme.fonts.heading}"` }}>
                    Save the Date
                  </p>
                  <p className="mt-3 text-sm" style={{ color: previewTone.muted }}>
                    Contoh teks body untuk membaca kenyamanan huruf.
                  </p>
                  <span
                    className="mt-4 inline-flex min-h-[40px] items-center px-4 text-sm"
                    style={{
                      borderRadius: theme.radius,
                      background: theme.buttonStyle === "solid" ? theme.colors.primary : "transparent",
                      color: theme.buttonStyle === "solid" ? toneFor(theme, "primary").ink : previewTone.ink,
                      border: theme.buttonStyle === "outline" ? `1px solid ${previewTone.ink}` : undefined,
                      borderBottom: theme.buttonStyle === "underline" ? `1px solid ${previewTone.ink}` : undefined,
                    }}
                  >
                    Simpan Tanggal
                  </span>
                </div>
                <div className="p-5" style={{ background: theme.colors.primary, color: toneFor(theme, "primary").ink }}>
                  <p className="text-3xl italic" style={{ fontFamily: `"${theme.fonts.heading}"` }}>
                    Terima Kasih
                  </p>
                  <p className="mt-1 text-2xl" style={{ fontFamily: `"${theme.fonts.accent}"` }}>
                    dengan cinta
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-admin-muted">Simpan draft lalu buka Preview untuk melihat seluruh undangan.</p>
            </Card>
            <Card title="Simpan sebagai tema custom">
              <Field label="Nama tema" htmlFor="cname">
                <Input id="cname" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Contoh: Sage & Gold" />
              </Field>
              <Button className="mt-3 w-full" onClick={saveCustom}>
                Simpan ke daftar preset
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
