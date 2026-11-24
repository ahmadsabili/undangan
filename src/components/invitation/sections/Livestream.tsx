"use client";

import { Video } from "lucide-react";
import { formatLongDate, tzAbbreviation } from "@/lib/date";
import type { Section } from "@/types/invitation";
import { useInvitation } from "../context";
import { InvLink } from "../InvButton";
import { Reveal } from "../Reveal";
import { SectionFrame } from "../SectionFrame";

type Content = { platform?: "youtube" | "zoom" | "custom"; url?: string; description?: string; schedule?: string; button_label?: string };
const PLATFORM = { youtube: "YouTube Live", zoom: "Zoom", custom: "Siaran daring" };

export function Livestream({ section, folio }: { section: Section<Content>; folio: number }) {
  const { data, t } = useInvitation();
  const s = data.settings;
  const c = section.content;
  const safeUrl = c.url && /^https:\/\//.test(c.url) ? c.url : null;
  return (
    <SectionFrame section={section} folio={folio}>
      <Reveal className="mx-auto max-w-xl text-center">
        <p className="font-body text-xs font-medium tracking-[0.18em]" style={{ color: "rgb(var(--tone-accent))" }}>
          {PLATFORM[c.platform ?? "custom"]}
        </p>
        {c.schedule && (
          <p className="mt-4 font-heading text-3xl">
            {formatLongDate(c.schedule, s.timezone, s.language)}
            <span className="block font-body text-base">
              {new Intl.DateTimeFormat("id-ID", { timeZone: s.timezone, hour: "2-digit", minute: "2-digit" }).format(new Date(c.schedule))} {tzAbbreviation(s.timezone)}
            </span>
          </p>
        )}
        {c.description && <p className="mt-5 font-body leading-relaxed" style={{ color: "rgb(var(--tone-muted))" }}>{c.description}</p>}
        {safeUrl ? (
          <InvLink href={safeUrl} external className="mt-8">
            <Video className="h-4 w-4" aria-hidden="true" />
            {c.button_label || t.watch}
          </InvLink>
        ) : (
          <p className="mt-8 font-body text-sm" style={{ color: "rgb(var(--tone-muted))" }}>
            Tautan siaran akan dibagikan menjelang acara.
          </p>
        )}
      </Reveal>
    </SectionFrame>
  );
}
