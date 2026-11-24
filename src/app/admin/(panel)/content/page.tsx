"use client";

import { Lock } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CollectionEditor } from "@/components/admin/CollectionEditor";
import { CoupleEditor } from "@/components/admin/CoupleEditor";
import { DynamicFields } from "@/components/admin/DynamicFields";
import { GalleryEditor } from "@/components/admin/GalleryEditor";
import { SortableList } from "@/components/admin/Sortable";
import { Badge, Button, Card, ErrorState, Field, Input, LoadingBlock, PageHeader, Select, Textarea, useToast } from "@/components/ui";
import { EVENT_FIELDS, GIFT_FIELDS, STORY_FIELDS } from "@/config/collections";
import { BACKGROUND_OPTIONS, SECTION_META } from "@/config/sections";
import { cn } from "@/lib/utils";
import { db, emitDraftChanged } from "@/services/admin";
import { normalizeCouple } from "@/services/normalize";
import type { Couple, Section } from "@/types/invitation";

export default function ContentPage() {
  const [sections, setSections] = useState<Section[] | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setError(null);
    const [s, st] = await Promise.all([
      db().from("wedding_sections").select("*").order("sort_order"),
      db().from("wedding_settings").select("couple, timezone").eq("id", 1).single(),
    ]);
    if (s.error || st.error) return setError((s.error ?? st.error)!.message);
    setSections(s.data as Section[]);
    setCouple(normalizeCouple(st.data.couple));
    setTimezone(st.data.timezone);
    setSelected((cur) => cur ?? (s.data as Section[]).find((x) => x.key === "hero")?.id ?? null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function reorder(next: Section[]) {
    // cover selalu di urutan pertama
    const cover = next.find((x) => x.key === "cover");
    const rest = next.filter((x) => x.key !== "cover");
    const ordered = [...(cover ? [cover] : []), ...rest].map((s, i) => ({ ...s, sort_order: i }));
    setSections(ordered);
    const res = await Promise.all(ordered.map((s) => db().from("wedding_sections").update({ sort_order: s.sort_order }).eq("id", s.id)));
    if (res.some((r) => r.error)) {
      toast("error", "Urutan gagal disimpan.");
      void load();
    } else {
      toast("ok", "Urutan section disimpan sebagai draft.");
      emitDraftChanged();
    }
  }

  async function toggle(s: Section, enabled: boolean) {
    setSections((list) => list!.map((x) => (x.id === s.id ? { ...x, enabled } : x)));
    const { error } = await db().from("wedding_sections").update({ enabled }).eq("id", s.id);
    if (error) {
      toast("error", error.message);
      void load();
    } else emitDraftChanged();
  }

  const current = useMemo(() => sections?.find((x) => x.id === selected) ?? null, [sections, selected]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!sections || !couple) return <LoadingBlock rows={6} />;
  const coverId = sections.find((x) => x.key === "cover")?.id;

  return (
    <>
      <PageHeader title="Konten" description="Semua perubahan tersimpan sebagai draft dan baru tampil di undangan publik setelah Anda menekan Publish." />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card title="Susunan section" description="Seret untuk mengurutkan, aktifkan atau nonaktifkan.">
          <SortableList
            items={sections}
            onReorder={reorder}
            disabledIds={coverId ? [coverId] : []}
            className="-mx-2 space-y-1"
            render={(s, handle) => {
              const meta = SECTION_META[s.key];
              const active = s.id === selected;
              return (
                <div className={cn("flex items-center gap-1 rounded-md pr-2", active ? "bg-[#EEF0EA]" : "hover:bg-black/[0.03]")}>
                  {handle}
                  <button type="button" onClick={() => setSelected(s.id)} aria-current={active ? "true" : undefined} className="min-h-[44px] flex-1 py-1 text-left">
                    <span className={cn("block text-sm", active && "font-semibold", !s.enabled && "text-admin-muted line-through")}>{meta?.label ?? s.key}</span>
                  </button>
                  {meta?.locked ? (
                    <Lock className="h-4 w-4 text-admin-muted" aria-label="Section tetap" />
                  ) : (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={s.enabled}
                      aria-label={`${s.enabled ? "Nonaktifkan" : "Aktifkan"} ${meta?.label}`}
                      onClick={() => toggle(s, !s.enabled)}
                      className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors", s.enabled ? "bg-admin-brand" : "bg-[#CFCBC0]")}
                    >
                      <span className={cn("inline-block h-4 w-4 rounded-full bg-white shadow transition-transform", s.enabled ? "translate-x-[18px]" : "translate-x-0.5")} />
                    </button>
                  )}
                </div>
              );
            }}
          />
        </Card>

        {current && <SectionEditor key={current.id} section={current} couple={couple} timezone={timezone} onSaved={(s, c) => { setSections((list) => list!.map((x) => (x.id === s.id ? s : x))); if (c) setCouple(c); }} />}
      </div>
    </>
  );
}

function SectionEditor({ section, couple, timezone, onSaved }: { section: Section; couple: Couple; timezone: string; onSaved: (s: Section, c?: Couple) => void }) {
  const meta = SECTION_META[section.key];
  const [draft, setDraft] = useState(section);
  const [coupleDraft, setCoupleDraft] = useState(couple);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const dirty = JSON.stringify(draft) !== JSON.stringify(section) || (meta.couple && JSON.stringify(coupleDraft) !== JSON.stringify(couple));

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function save() {
    setSaving(true);
    const { data, error } = await db()
      .from("wedding_sections")
      .update({ title: draft.title, subtitle: draft.subtitle, background: draft.background, background_media_id: draft.background_media_id, content: draft.content })
      .eq("id", section.id)
      .select("*")
      .single();
    let coupleError = null;
    if (!error && meta.couple) {
      coupleError = (await db().from("wedding_settings").update({ couple: coupleDraft }).eq("id", 1)).error;
    }
    setSaving(false);
    if (error || coupleError) return toast("error", `Gagal menyimpan: ${(error ?? coupleError)!.message}`);
    onSaved(data as Section, meta.couple ? coupleDraft : undefined);
    toast("ok", "Tersimpan sebagai draft.");
    emitDraftChanged();
  }

  return (
    <div className="min-w-0 space-y-6">
      <Card
        title={meta.label}
        description={meta.description}
        actions={
          <>
            {dirty && <Badge tone="warn">Belum disimpan</Badge>}
            <Button disabled={!dirty} onClick={() => { setDraft(section); setCoupleDraft(couple); }}>
              Reset
            </Button>
            <Button variant="primary" disabled={!dirty} loading={saving} onClick={save}>
              Simpan draft
            </Button>
          </>
        }
      >
        <div className="grid gap-5">
          {!["cover", "hero"].includes(section.key) && (
            <>
              <Field label="Judul section" htmlFor="sec-title">
                <Input id="sec-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </Field>
              <Field label="Subjudul / pengantar" htmlFor="sec-sub">
                <Textarea id="sec-sub" rows={2} value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} />
              </Field>
            </>
          )}
          {!["cover", "closing"].includes(section.key) && (
            <Field label="Latar section" htmlFor="sec-bg" help="Warna mengikuti tema aktif. Teks otomatis disesuaikan agar tetap terbaca.">
              <Select id="sec-bg" value={draft.background} onChange={(e) => setDraft({ ...draft, background: e.target.value as Section["background"] })}>
                {BACKGROUND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {meta.fields.length > 0 && <DynamicFields fields={meta.fields} values={draft.content} timezone={timezone} prefix={section.key} onChange={(content) => setDraft({ ...draft, content })} />}
          {section.key === "cover" && (
            <p className="rounded-md bg-[#F3F2EE] px-4 py-3 text-sm text-admin-muted">
              Nama tamu diambil dari tautan undangan. Overlay foto diatur di menu Tema. Monogram diatur di Pengaturan.
            </p>
          )}
        </div>
        {meta.couple && (
          <div className="mt-6">
            <CoupleEditor couple={coupleDraft} onChange={setCoupleDraft} />
          </div>
        )}
      </Card>

      {meta.collection === "events" && (
        <Card title="Daftar acara" description="Tambah, ubah, hapus, dan urutkan acara.">
          <CollectionEditor
            table="wedding_events"
            fields={EVENT_FIELDS}
            timezone={timezone}
            addLabel="Tambah acara"
            titleOf={(r) => String(r.title ?? "")}
            newItem={() => ({ title: "Acara baru", event_date: new Date().toISOString().slice(0, 10), start_time: "10:00" })}
            validate={(r) => (!r.title ? "Nama acara wajib diisi." : !r.event_date || !r.start_time ? "Tanggal dan jam mulai wajib diisi." : null)}
          />
        </Card>
      )}
      {meta.collection === "stories" && (
        <Card title="Tahapan cerita" description="Urutan di sini sama dengan urutan di timeline.">
          <CollectionEditor table="love_stories" fields={STORY_FIELDS} timezone={timezone} addLabel="Tambah tahapan" titleOf={(r) => `${r.title ?? ""}${r.date_label ? ` · ${r.date_label}` : ""}`} newItem={() => ({ title: "Tahapan baru" })} validate={(r) => (!r.title ? "Judul wajib diisi." : null)} />
        </Card>
      )}
      {meta.collection === "gifts" && (
        <Card title="Metode hadiah" description="Hanya tampilkan informasi tujuan. Jangan simpan PIN, OTP, atau data sensitif lain.">
          <CollectionEditor table="wedding_gifts" fields={GIFT_FIELDS} timezone={timezone} addLabel="Tambah metode" titleOf={(r) => `${r.provider || "Tanpa nama"}${r.account_holder ? ` · ${r.account_holder}` : ""}`} newItem={() => ({ type: "bank", provider: "Nama bank" })} />
        </Card>
      )}
      {meta.collection === "gallery" && (
        <Card title="Foto galeri">
          <GalleryEditor />
        </Card>
      )}
    </div>
  );
}
