"use client";

import { Plus, Star, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CopyInline } from "@/components/admin/ShareDialogs";
import { siteOrigin, type Template } from "@/components/admin/useInviteContext";
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, LoadingBlock, PageHeader, Textarea, useConfirm, useToast } from "@/components/ui";
import { cn, fillTemplate, nameLink } from "@/lib/utils";
import { db, errMessage } from "@/services/admin";
import { normalizeCouple, orderedCouple } from "@/services/normalize";

const VARS = ["{nama_tamu}", "{nama_mempelai_1}", "{nama_mempelai_2}", "{link_undangan}"];

export default function TemplatesPage() {
  const [list, setList] = useState<Template[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<Template | null>(null);
  const [names, setNames] = useState<[string, string]>(["", ""]);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const load = useCallback(async () => {
    setError(null);
    const [t, s] = await Promise.all([db().from("invitation_templates").select("*").order("created_at"), db().from("wedding_settings").select("couple").eq("id", 1).single()]);
    if (t.error) return setError(t.error.message);
    setList(t.data as Template[]);
    setCurrent((c) => c ?? (t.data as Template[])[0] ?? null);
    if (s.data) {
      const [a, b] = orderedCouple(normalizeCouple(s.data.couple));
      setNames([a.nickname, b.nickname]);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const saved = list?.find((t) => t.id === current?.id);
  const dirty = current && saved && (current.name !== saved.name || current.body !== saved.body);

  async function save() {
    if (!current) return;
    if (!current.body.includes("{link_undangan}") && !(await confirm({ title: "Template tanpa tautan?", body: "Template ini tidak memuat {link_undangan}, sehingga tamu tidak mendapat tautan undangan. Tetap simpan?", confirmLabel: "Tetap simpan" }))) return;
    setBusy(true);
    const { error } = await db().from("invitation_templates").update({ name: current.name, body: current.body }).eq("id", current.id);
    setBusy(false);
    if (error) return toast("error", errMessage(error));
    setList((l) => l!.map((t) => (t.id === current.id ? current : t)));
    toast("ok", "Template disimpan.");
  }

  async function add() {
    const { data, error } = await db().from("invitation_templates").insert({ name: "Template baru", body: "Halo {nama_tamu},\n\nKami mengundang Anda ke pernikahan {nama_mempelai_1} & {nama_mempelai_2}.\n\n{link_undangan}", is_default: false }).select("*").single();
    if (error) return toast("error", errMessage(error));
    setList((l) => [...l!, data as Template]);
    setCurrent(data as Template);
  }

  async function makeDefault(t: Template) {
    const a = await db().from("invitation_templates").update({ is_default: false }).eq("is_default", true);
    const b = a.error ? a : await db().from("invitation_templates").update({ is_default: true }).eq("id", t.id);
    if (b.error) return toast("error", errMessage(b.error));
    setList((l) => l!.map((x) => ({ ...x, is_default: x.id === t.id })));
    toast("ok", `"${t.name}" menjadi template default.`);
  }

  async function remove(t: Template) {
    if (list!.length <= 1) return toast("error", "Minimal harus ada satu template.");
    if (!(await confirm({ title: `Hapus "${t.name}"?`, confirmLabel: "Hapus", danger: true }))) return;
    const { error } = await db().from("invitation_templates").delete().eq("id", t.id);
    if (error) return toast("error", errMessage(error));
    const rest = list!.filter((x) => x.id !== t.id);
    setList(rest);
    setCurrent(rest[0]);
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!list) return <LoadingBlock rows={4} />;
  const sample = current ? fillTemplate(current.body, { nama_tamu: "Bapak Budi Santoso", nama_mempelai_1: names[0], nama_mempelai_2: names[1], link_undangan: nameLink(siteOrigin(), "Bapak Budi Santoso") }) : "";

  return (
    <>
      <PageHeader title="Template WhatsApp" description="Dipakai saat mengirim undangan dari Daftar Tamu. Pesan tidak pernah terkirim otomatis." actions={<Button onClick={add}><Plus className="h-4 w-4" aria-hidden="true" />Template baru</Button>} />
      {list.length === 0 ? (
        <EmptyState title="Belum ada template" action={<Button onClick={add}>Buat template</Button>} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <Card>
            <ul className="-mx-2 space-y-1">
              {list.map((t) => (
                <li key={t.id}>
                  <button type="button" onClick={() => setCurrent(t)} className={cn("flex min-h-[44px] w-full items-center justify-between rounded-md px-3 text-left text-sm", current?.id === t.id ? "bg-[#EEF0EA] font-semibold" : "hover:bg-black/[0.03]")}>
                    <span className="truncate">{t.name}</span>
                    {t.is_default && <Badge tone="ok">Default</Badge>}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          {current && (
            <div className="grid gap-6 xl:grid-cols-2">
              <Card
                title="Edit"
                actions={
                  <>
                    {!current.is_default && (
                      <Button size="sm" onClick={() => makeDefault(current)}>
                        <Star className="h-4 w-4" aria-hidden="true" />
                        Jadikan default
                      </Button>
                    )}
                    <Button size="sm" variant="dangerGhost" onClick={() => remove(current)} aria-label="Hapus template">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </>
                }
              >
                <div className="space-y-4">
                  <Field label="Nama template" htmlFor="t-name">
                    <Input id="t-name" value={current.name} onChange={(e) => setCurrent({ ...current, name: e.target.value })} />
                  </Field>
                  <Field label="Isi pesan" htmlFor="t-body">
                    <Textarea id="t-body" rows={16} value={current.body} onChange={(e) => setCurrent({ ...current, body: e.target.value })} />
                  </Field>
                  <div>
                    <p className="text-xs text-admin-muted">Variabel (klik untuk menyisipkan di akhir):</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {VARS.map((v) => (
                        <button key={v} type="button" onClick={() => setCurrent({ ...current, body: current.body + v })} className="rounded border border-admin-line bg-white px-2 py-1 font-mono text-xs hover:bg-[#F0EEE8]">
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button disabled={!dirty} onClick={() => saved && setCurrent(saved)}>
                      Reset
                    </Button>
                    <Button variant="primary" disabled={!dirty} loading={busy} onClick={save}>
                      Simpan
                    </Button>
                  </div>
                </div>
              </Card>
              <Card title="Contoh hasil" actions={<CopyInline text={sample} label="Salin contoh" />}>
                <pre className="whitespace-pre-wrap rounded-md bg-[#E7F2E4] p-4 font-admin text-sm leading-relaxed text-[#1f2b1d]">{sample}</pre>
              </Card>
            </div>
          )}
        </div>
      )}
    </>
  );
}
