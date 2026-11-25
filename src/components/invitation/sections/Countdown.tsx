"use client";

import { CalendarPlus, Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buildIcs, googleCalendarUrl } from "@/lib/calendar";
import { calendarEventsFrom } from "@/lib/calendar-events";
import { formatLongDate, tzAbbreviation } from "@/lib/date";
import { downloadText } from "@/lib/utils";
import type { Section } from "@/types/invitation";
import { useInvitation } from "../context";
import { InvButton, InvLink } from "../InvButton";
import { Reveal } from "../Reveal";
import { SectionFrame } from "../SectionFrame";
import { useLayout } from "../layout";

type Content = { after_message?: string };

function diff(target: number, now: number) {
  const ms = Math.max(0, target - now);
  return {
    done: target - now <= 0,
    days: Math.floor(ms / 86400e3),
    hours: Math.floor((ms / 3600e3) % 24),
    minutes: Math.floor((ms / 60e3) % 60),
    seconds: Math.floor((ms / 1e3) % 60),
  };
}

export function Countdown({ section, folio }: { section: Section<Content>; folio: number }) {
  const { data, t, mode } = useInvitation();
  const { wide } = useLayout();
  const s = data.settings;
  const target = new Date(s.wedding_date).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const events = useMemo(() => calendarEventsFrom(data), [data]);
  const google = googleCalendarUrl({
    ...events[0],
    title: events.length > 1 ? (section.content as { calendar_title?: string }).calendar_title || s.site_title : events[0].title,
    end: events[events.length - 1].end,
  });
  const d = now === null ? null : diff(target, now);
  const units: [string, number | undefined][] = [
    [t.days, d?.days],
    [t.hours, d?.hours],
    [t.minutes, d?.minutes],
    [t.seconds, d?.seconds],
  ];

  return (
    <SectionFrame section={section} folio={folio}>
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <p className="font-body text-sm tracking-[0.1em]">
            {formatLongDate(s.wedding_date, s.timezone, s.language)} ·{" "}
            {new Intl.DateTimeFormat("id-ID", { timeZone: s.timezone, hour: "2-digit", minute: "2-digit" }).format(new Date(s.wedding_date))}{" "}
            {tzAbbreviation(s.timezone)}
          </p>
        </Reveal>

        {d?.done ? (
          <Reveal delay={0.1}>
            <p className="mt-12 font-script text-5xl leading-tight sm:text-6xl" style={{ color: "rgb(var(--tone-accent))" }}>
              {section.content.after_message || "Our Happily Ever After Begins"}
            </p>
          </Reveal>
        ) : (
          <Reveal delay={0.1}>
            <div role="timer" aria-live="off" className="mt-12 grid grid-cols-4">
              {units.map(([label, value], i) => (
                <div key={label} className={i ? "border-l" : ""} style={{ borderColor: "rgb(var(--c-accent) / 0.45)" }}>
                  <span className={`block font-heading leading-none [font-variant-numeric:lining-nums_tabular-nums] ${wide("sm:text-7xl")} text-[2.7rem]`}>
                    {value === undefined ? "--" : String(value).padStart(2, "0")}
                  </span>
                  <span className="mt-3 block font-body text-[0.7rem] tracking-[0.18em]" style={{ color: "rgb(var(--tone-muted))" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        )}

        <Reveal delay={0.2}>
          <div className="mt-14 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <InvLink href={google} external>
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              {t.googleCal}
            </InvLink>
            {mode === "public" ? (
              <InvLink href="/api/calendar" variant="outline" download="undangan.ics">
                <Download className="h-4 w-4" aria-hidden="true" />
                {t.icsCal}
              </InvLink>
            ) : (
              <InvButton variant="outline" onClick={() => downloadText("undangan.ics", buildIcs(events), "text/calendar")}>
                <Download className="h-4 w-4" aria-hidden="true" />
                {t.icsCal}
              </InvButton>
            )}
          </div>
        </Reveal>
      </div>
    </SectionFrame>
  );
}
