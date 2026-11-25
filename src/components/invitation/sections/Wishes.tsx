"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { relativeTime } from "@/lib/date";
import type { Section } from "@/types/invitation";
import { useInvitation } from "../context";
import { InvButton } from "../InvButton";
import { Reveal } from "../Reveal";
import { SectionFrame } from "../SectionFrame";
import { ReadablePanel, useLayout } from "../layout";
import { cn } from "@/lib/utils";

type Content = { page_size?: number; pending_message?: string };
type Wish = { id: string; name: string; message: string; created_at: string };

export function Wishes({ section, folio }: { section: Section<Content>; folio: number }) {
  const { data, guest, t, mode } = useInvitation();
  const { layout } = useLayout();
  const lang = data.settings.language;
  const pageSize = Math.min(Math.max(Number(section.content.page_size) || 6, 3), 30);
  const [items, setItems] = useState<Wish[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [honey, setHoney] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    const cover = data.sections.find((x) => x.key === "cover")?.content as { default_guest?: string } | undefined;
    if (guest.name && guest.name !== (cover?.default_guest || "Tamu Undangan")) setName(guest.name);
  }, [guest.name, data.sections]);

  const load = useCallback(
    async (offset: number) => {
      const res = await fetch(`/api/wishes?limit=${pageSize}&offset=${offset}${guest.code ? `&guest=${encodeURIComponent(guest.code)}` : ""}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      return (await res.json()) as { items: Wish[]; total: number };
    },
    [pageSize, guest.code],
  );

  const initial = useCallback(() => {
    setState("loading");
    load(0)
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [load]);

  useEffect(initial, [initial]);

  async function more() {
    setLoadingMore(true);
    try {
      const r = await load(items.length);
      setItems((prev) => [...prev, ...r.items.filter((x) => !prev.some((p) => p.id === x.id))]);
      setTotal(r.total);
    } catch {
      setFeedback({ kind: "error", text: t.loadError });
    } finally {
      setLoadingMore(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "preview" || sending) return;
    setFeedback(null);
    if (name.trim().length < 2 || message.trim().length < 2) {
      setFeedback({ kind: "error", text: "Isi nama dan ucapan terlebih dahulu." });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message, guestCode: guest.code, website: honey, startedAt: startedAt.current }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Ucapan gagal dikirim.");
      setMessage("");
      if (body.status === "approved" && body.item) {
        setItems((prev) => [body.item, ...prev]);
        setTotal((n) => n + 1);
        setFeedback({ kind: "ok", text: "Terima kasih atas ucapan dan doanya." });
      } else {
        setFeedback({ kind: "ok", text: section.content.pending_message || "Terima kasih. Ucapan Anda akan tampil setelah ditinjau." });
      }
    } catch (err) {
      setFeedback({ kind: "error", text: err instanceof Error ? err.message : "Ucapan gagal dikirim." });
    } finally {
      setSending(false);
    }
  }

  return (
    <SectionFrame section={section} folio={folio} align="left">
      <ReadablePanel className="mx-auto max-w-5xl">
      <div className={cn("mx-auto grid gap-14", (layout === "editorial" || layout === "bento") ? "max-w-5xl md:grid-cols-12" : "max-w-2xl")}>
        <form onSubmit={submit} noValidate className={cn("space-y-5 text-left", (layout === "editorial" || layout === "bento") && "md:col-span-5")}>
          <div>
            <label htmlFor="wish-name" className="mb-2 block font-body text-sm font-medium">
              {t.wishName}
            </label>
            <input id="wish-name" className="inv-field" value={name} maxLength={80} autoComplete="name" onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="wish-message" className="mb-2 block font-body text-sm font-medium">
              {t.wishMessage}
            </label>
            <textarea id="wish-message" rows={5} className="inv-field resize-y" value={message} maxLength={600} onChange={(e) => setMessage(e.target.value)} />
            <p className="mt-1 text-right font-body text-xs tabular-nums" style={{ color: "rgb(var(--tone-muted))" }}>
              {message.length}/600
            </p>
          </div>
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="wish-website">Website</label>
            <input id="wish-website" tabIndex={-1} autoComplete="off" value={honey} onChange={(e) => setHoney(e.target.value)} />
          </div>
          {feedback && (
            <p role={feedback.kind === "error" ? "alert" : "status"} className="font-body text-sm" style={{ color: feedback.kind === "error" ? "#b3261e" : "rgb(var(--tone-ink))" }}>
              {feedback.text}
            </p>
          )}
          {mode === "preview" && <p className="font-body text-sm" style={{ color: "rgb(var(--tone-muted))" }}>{t.previewNote}</p>}
          <InvButton type="submit" variant="solid" disabled={sending || mode === "preview"} className="w-full">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {sending ? t.sending : t.sendWish}
          </InvButton>
        </form>

        <div className={cn("text-left", (layout === "editorial" || layout === "bento") && "md:col-span-7")} aria-live="polite">
          {state === "loading" && (
            <ul className="space-y-6" aria-label="Memuat ucapan">
              {[0, 1, 2].map((i) => (
                <li key={i} className="animate-pulse space-y-2 border-b pb-6" style={{ borderColor: "rgb(var(--c-accent) / 0.3)" }}>
                  <div className="h-4 w-32" style={{ background: "rgb(var(--tone-ink) / 0.1)" }} />
                  <div className="h-3 w-full" style={{ background: "rgb(var(--tone-ink) / 0.07)" }} />
                  <div className="h-3 w-2/3" style={{ background: "rgb(var(--tone-ink) / 0.07)" }} />
                </li>
              ))}
            </ul>
          )}
          {state === "error" && (
            <div role="alert" className="font-body text-sm">
              <p>{t.loadError}</p>
              <InvButton variant="underline" className="mt-3" onClick={initial}>
                {t.retry}
              </InvButton>
            </div>
          )}
          {state === "ready" && items.length === 0 && (
            <p className="font-heading text-2xl italic leading-snug" style={{ color: "rgb(var(--tone-muted))" }}>
              {t.noWishes}
            </p>
          )}
          {state === "ready" && items.length > 0 && (
            <>
              <ul className="max-h-[38rem] space-y-0 overflow-y-auto pr-2">
                {items.map((w, i) => (
                  <Reveal as="li" key={w.id} variant="fade" delay={Math.min(i, 5) * 0.04} className="border-b py-6 first:pt-0" style={{ borderColor: "rgb(var(--c-accent) / 0.35)" }}>
                    <p className="whitespace-pre-line font-heading text-[1.3rem] leading-snug">&ldquo;{w.message}&rdquo;</p>
                    <p className="mt-3 font-body text-sm">
                      <span className="font-medium">{w.name}</span>
                      <span style={{ color: "rgb(var(--tone-muted))" }}>
                        {" "}
                        · <time dateTime={w.created_at}>{relativeTime(w.created_at, lang)}</time>
                      </span>
                    </p>
                  </Reveal>
                ))}
              </ul>
              {items.length < total && (
                <InvButton variant="outline" className="mt-8" onClick={more} disabled={loadingMore}>
                  {loadingMore && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {t.loadMore}
                </InvButton>
              )}
            </>
          )}
        </div>
      </div>
      </ReadablePanel>
    </SectionFrame>
  );
}
