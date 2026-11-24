"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { formatLongDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { rsvpSchema } from "@/validation/public";
import type { Attendance, Section } from "@/types/invitation";
import { useInvitation } from "../context";
import { InvButton } from "../InvButton";
import { Reveal } from "../Reveal";
import { SectionFrame } from "../SectionFrame";

type Content = { success_message?: string; closed_message?: string };
type In = z.input<typeof rsvpSchema>;
type Out = z.output<typeof rsvpSchema>;
type Saved = { attendance: Attendance; pax: number; message: string; name: string };

const STORAGE_KEY = "rsvp-submitted";

export function Rsvp({ section, folio }: { section: Section<Content>; folio: number }) {
  const { data, guest, t, mode } = useInvitation();
  const s = data.settings;
  const cover = data.sections.find((x) => x.key === "cover")?.content as { default_guest?: string } | undefined;
  const isDefaultName = !guest.code && guest.name === (cover?.default_guest || "Tamu Undangan");
  const maxPax = Math.max(1, guest.code ? guest.maxPax : s.rsvp_max_pax);
  const closed = Boolean(s.rsvp_deadline && Date.now() > new Date(s.rsvp_deadline).getTime());
  const [saved, setSaved] = useState<Saved | null>(guest.rsvp ? { ...guest.rsvp, name: guest.name } : null);
  const [editing, setEditing] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (guest.code || saved) return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY);
      if (raw) setSaved(JSON.parse(raw));
    } catch {
      /* storage tidak tersedia */
    }
  }, [guest.code, saved]);

  const form = useForm<In, unknown, Out>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      name: isDefaultName ? "" : guest.name,
      attendance: saved?.attendance ?? undefined,
      pax: saved?.pax ?? 1,
      message: saved?.message ?? "",
      website: "",
    },
  });
  const { register, handleSubmit, watch, formState } = form;
  const attendance = watch("attendance");

  async function onSubmit(values: Out) {
    if (mode === "preview") return;
    setServerError(null);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, pax: values.attendance === "tidak_hadir" ? 0 : values.pax, guestCode: guest.code, startedAt: startedAt.current }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Konfirmasi gagal dikirim. Silakan coba lagi.");
      const next: Saved = { ...body.rsvp, name: values.name };
      setSaved(next);
      setEditing(false);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* abaikan */
      }
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Konfirmasi gagal dikirim.");
    }
  }

  const label = { hadir: t.attend, tidak_hadir: t.notAttend, ragu: t.unsure };

  return (
    <SectionFrame section={section} folio={folio}>
      <div className="mx-auto max-w-xl">
        {s.rsvp_deadline && !closed && (
          <Reveal>
            <p className="mb-10 text-center font-body text-sm" style={{ color: "rgb(var(--tone-muted))" }}>
              {t.rsvpDeadline} <span className="font-medium" style={{ color: "rgb(var(--tone-ink))" }}>{formatLongDate(s.rsvp_deadline, s.timezone, s.language)}</span>
            </p>
          </Reveal>
        )}

        {closed ? (
          <p className="text-center font-heading text-2xl italic leading-snug">{section.content.closed_message}</p>
        ) : saved && !editing ? (
          <div role="status" className="border p-8 text-center" style={{ borderColor: "rgb(var(--c-accent) / 0.55)", borderRadius: "var(--radius)" }}>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border" style={{ borderColor: "rgb(var(--c-accent))" }}>
              <Check className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-5 font-heading text-2xl">{section.content.success_message || t.yourRsvp}</p>
            <p className="mt-3 font-body text-sm" style={{ color: "rgb(var(--tone-muted))" }}>
              {saved.name} · {label[saved.attendance]}
              {saved.attendance !== "tidak_hadir" ? ` · ${saved.pax} ${t.people}` : ""}
            </p>
            <InvButton variant="underline" className="mt-6" onClick={() => setEditing(true)}>
              {t.update}
            </InvButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-7">
            <div>
              <label htmlFor="rsvp-name" className="mb-2 block font-body text-sm font-medium">
                {t.name}
              </label>
              <input
                id="rsvp-name"
                autoComplete="name"
                className="inv-field"
                readOnly={Boolean(guest.code)}
                aria-invalid={Boolean(formState.errors.name)}
                aria-describedby={formState.errors.name ? "rsvp-name-err" : undefined}
                {...register("name")}
              />
              {formState.errors.name && (
                <p id="rsvp-name-err" className="mt-2 font-body text-sm text-[#b3261e]">
                  {formState.errors.name.message}
                </p>
              )}
            </div>

            <fieldset>
              <legend className="mb-3 block font-body text-sm font-medium">{t.attendance}</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {(["hadir", "tidak_hadir", "ragu"] as const).map((v) => (
                  <label
                    key={v}
                    className={cn(
                      "flex min-h-[48px] items-center justify-center gap-2 border px-3 text-center font-body text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2",
                    )}
                    style={{
                      borderRadius: "var(--radius)",
                      borderColor: attendance === v ? "rgb(var(--tone-ink))" : "rgb(var(--tone-ink) / 0.28)",
                      background: attendance === v ? "rgb(var(--tone-ink) / 0.07)" : "transparent",
                    }}
                  >
                    <input type="radio" value={v} className="sr-only" {...register("attendance")} />
                    {attendance === v && <Check className="h-4 w-4" aria-hidden="true" />}
                    {label[v]}
                  </label>
                ))}
              </div>
              {formState.errors.attendance && <p className="mt-2 font-body text-sm text-[#b3261e]">{formState.errors.attendance.message}</p>}
            </fieldset>

            {attendance !== "tidak_hadir" && (
              <div>
                <label htmlFor="rsvp-pax" className="mb-2 block font-body text-sm font-medium">
                  {t.pax}{" "}
                  <span className="font-normal" style={{ color: "rgb(var(--tone-muted))" }}>
                    ({t.maxPaxNote} {maxPax} {t.people})
                  </span>
                </label>
                <select id="rsvp-pax" className="inv-field" {...register("pax")}>
                  {Array.from({ length: maxPax }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {t.people}
                    </option>
                  ))}
                </select>
                {formState.errors.pax && <p className="mt-2 font-body text-sm text-[#b3261e]">{formState.errors.pax.message}</p>}
              </div>
            )}

            <div>
              <label htmlFor="rsvp-message" className="mb-2 block font-body text-sm font-medium">
                {t.message}
              </label>
              <textarea id="rsvp-message" rows={3} maxLength={500} className="inv-field resize-y" {...register("message")} />
            </div>

            {/* honeypot: tersembunyi dari pengguna, hanya diisi bot */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="rsvp-website">Website</label>
              <input id="rsvp-website" tabIndex={-1} autoComplete="off" {...register("website")} />
            </div>

            {serverError && (
              <p role="alert" className="font-body text-sm text-[#b3261e]">
                {serverError}
              </p>
            )}
            {mode === "preview" && <p className="font-body text-sm" style={{ color: "rgb(var(--tone-muted))" }}>{t.previewNote}</p>}

            <InvButton type="submit" variant="solid" className="w-full" disabled={formState.isSubmitting || mode === "preview"}>
              {formState.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {t.sending}
                </>
              ) : saved ? (
                t.update
              ) : (
                t.send
              )}
            </InvButton>
          </form>
        )}
      </div>
    </SectionFrame>
  );
}
