"use client";

import { MapPin } from "lucide-react";
import { formatPlainDate, formatTime, tzAbbreviation } from "@/lib/date";
import { mapsSearchUrl } from "@/lib/calendar";
import type { Section } from "@/types/invitation";
import { useInvitation } from "../context";
import { InvLink } from "../InvButton";
import { Reveal } from "../Reveal";
import { SectionFrame } from "../SectionFrame";
import { MotifCorners, useLayout } from "../layout";
import { cn } from "@/lib/utils";

type Content = { dress_code?: string; guest_rules?: string; notes?: string };

// Ditata seperti susunan acara cetak (programme), bukan deretan kartu identik:
// jam besar sebagai jangkar baca, detail di sebelahnya, dipisah garis rambut.
export function Events({ section, folio }: { section: Section<Content>; folio: number }) {
  const { data, t } = useInvitation();
  const s = data.settings;
  const tz = tzAbbreviation(s.timezone);
  const c = section.content;
  const { layout } = useLayout();
  const card = layout === "card";
  const extras = [
    [t.dressCode, c.dress_code],
    [t.guestRules, c.guest_rules],
    [t.notes, c.notes],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <SectionFrame section={section} folio={folio} align="left">
      <div className="mx-auto max-w-5xl">
        {data.events.length === 0 ? (
          <p style={{ color: "rgb(var(--tone-muted))" }}>Detail acara akan segera diumumkan.</p>
        ) : layout === "editorial" ? (
          <ol className="border-t" style={{ borderColor: "rgb(var(--c-accent) / 0.45)" }}>
            {data.events.map((e, i) => {
              const maps = e.maps_url || mapsSearchUrl([e.venue_name, e.address].filter(Boolean).join(", "));
              return (
                <Reveal as="li" key={e.id} delay={i * 0.08} className="grid gap-6 border-b py-10 md:grid-cols-12 md:gap-8 md:py-14" style={{ borderColor: "rgb(var(--c-accent) / 0.45)" }}>
                  <div className="md:col-span-4">
                    <p className="font-heading text-6xl leading-none [font-variant-numeric:lining-nums_tabular-nums] sm:text-7xl">{formatTime(e.start_time)}</p>
                    <p className="mt-3 font-body text-sm" style={{ color: "rgb(var(--tone-muted))" }}>
                      {e.end_time ? `${formatTime(e.start_time)} - ${formatTime(e.end_time)} ${tz}` : `${formatTime(e.start_time)} ${tz} - ${e.time_note || t.until}`}
                    </p>
                  </div>
                  <div className="md:col-span-8">
                    <h3 className="font-heading text-[2.1rem] leading-tight sm:text-5xl">{e.title}</h3>
                    <p className="mt-2 font-body text-[0.95rem] tracking-[0.04em]" style={{ color: "rgb(var(--tone-accent))" }}>
                      {formatPlainDate(e.event_date, s.language)}
                    </p>
                    {(e.venue_name || e.address) && (
                      <div className="mt-6 font-body leading-relaxed">
                        {e.venue_name && <p className="font-medium">{e.venue_name}</p>}
                        {e.address && <p style={{ color: "rgb(var(--tone-muted))" }}>{e.address}</p>}
                      </div>
                    )}
                    {(e.dress_code || e.notes) && (
                      <p className="mt-4 font-body text-sm" style={{ color: "rgb(var(--tone-muted))" }}>
                        {[e.dress_code && `${t.dressCode}: ${e.dress_code}`, e.notes].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {(e.venue_name || e.address || e.maps_url) && (
                      <InvLink href={maps} external variant="outline" className="mt-7">
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        {t.maps}
                      </InvLink>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </ol>
        ) : (
          // Klasik, Sinematik, Nusantara: blok simetris rata tengah. Kartu: kartu ringkas bertumpuk.
          <ol className={cn("grid gap-6", !card && data.events.length > 1 && "md:grid-cols-2")}>
            {data.events.map((e, i) => {
              const maps = e.maps_url || mapsSearchUrl([e.venue_name, e.address].filter(Boolean).join(", "));
              const time = e.end_time ? `${formatTime(e.start_time)} - ${formatTime(e.end_time)} ${tz}` : `${formatTime(e.start_time)} ${tz} - ${e.time_note || t.until}`;
              return (
                <Reveal
                  as="li"
                  key={e.id}
                  delay={i * 0.08}
                  className={cn("relative border px-6 text-center", card ? "py-8 text-left" : "py-10 sm:px-10")}
                  style={{ borderColor: "rgb(var(--c-accent) / 0.55)", borderRadius: "var(--radius)", background: layout === "cinematic" ? "rgb(var(--c-primary) / 0.35)" : undefined }}
                >
                  {layout === "nusantara" && <MotifCorners inset={6} size={30} />}
                  <h3 className={cn("font-heading leading-tight", card ? "text-[1.9rem]" : "text-[2.2rem] sm:text-5xl")}>{e.title}</h3>
                  <p className="mt-3 font-body text-[0.95rem]" style={{ color: "rgb(var(--tone-accent))" }}>
                    {formatPlainDate(e.event_date, s.language)}
                  </p>
                  <p className="mt-1 font-body text-[0.95rem] tabular-nums">{time}</p>
                  {(e.venue_name || e.address) && (
                    <div className={cn("mt-5 font-body leading-relaxed", !card && "mx-auto max-w-sm")}>
                      {e.venue_name && <p className="font-medium">{e.venue_name}</p>}
                      {e.address && <p style={{ color: "rgb(var(--tone-muted))" }}>{e.address}</p>}
                    </div>
                  )}
                  {(e.dress_code || e.notes) && (
                    <p className="mt-3 font-body text-sm" style={{ color: "rgb(var(--tone-muted))" }}>
                      {[e.dress_code && `${t.dressCode}: ${e.dress_code}`, e.notes].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {(e.venue_name || e.address || e.maps_url) && (
                    <InvLink href={maps} external variant="outline" className={cn("mt-6", card && "w-full")}>
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                      {t.maps}
                    </InvLink>
                  )}
                </Reveal>
              );
            })}
          </ol>
        )}

        {extras.length > 0 && (
          <Reveal>
            <dl className={cn("mt-12 grid gap-6 p-7", !card && "sm:grid-cols-2 md:p-10", layout !== "editorial" && "text-center")} style={{ background: layout === "cinematic" ? "rgb(var(--c-surface))" : "rgb(var(--c-secondary) / 0.55)", borderRadius: "var(--radius)", color: "rgb(var(--c-text))" }}>
              {extras.map(([k, v]) => (
                <div key={k}>
                  <dt className="font-body text-xs font-medium tracking-[0.16em]">{k}</dt>
                  <dd className="mt-2 whitespace-pre-line font-heading text-xl leading-snug">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        )}
      </div>
    </SectionFrame>
  );
}
