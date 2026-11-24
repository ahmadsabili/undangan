"use client";

import { MapPin } from "lucide-react";
import { formatPlainDate, formatTime, tzAbbreviation } from "@/lib/date";
import { mapsSearchUrl } from "@/lib/calendar";
import type { Section } from "@/types/invitation";
import { useInvitation } from "../context";
import { InvLink } from "../InvButton";
import { Reveal } from "../Reveal";
import { SectionFrame } from "../SectionFrame";

type Content = { dress_code?: string; guest_rules?: string; notes?: string };

// Ditata seperti susunan acara cetak (programme), bukan deretan kartu identik:
// jam besar sebagai jangkar baca, detail di sebelahnya, dipisah garis rambut.
export function Events({ section, folio }: { section: Section<Content>; folio: number }) {
  const { data, t } = useInvitation();
  const s = data.settings;
  const tz = tzAbbreviation(s.timezone);
  const c = section.content;
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
        ) : (
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
        )}

        {extras.length > 0 && (
          <Reveal>
            <dl className="mt-12 grid gap-6 p-7 sm:grid-cols-2 md:p-10" style={{ background: "rgb(var(--c-secondary) / 0.55)", borderRadius: "var(--radius)", color: "rgb(var(--c-text))" }}>
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
