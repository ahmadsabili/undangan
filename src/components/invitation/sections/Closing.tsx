"use client";

import { formatShortDate } from "@/lib/date";
import { getMedia } from "@/lib/media";
import { orderedCouple } from "@/services/normalize";
import type { Section } from "@/types/invitation";
import { useInvitation } from "../context";
import { Monogram } from "../Monogram";
import { Reveal } from "../Reveal";
import { SmartImage } from "../SmartImage";
import { ArchWindow, DecoCorners, MotifBand, MotifCorners, useLayout } from "../layout";
import { cn } from "@/lib/utils";

// Sengaja menggemakan opening cover: foto penuh, overlay, monogram, nama.
export function Closing({ section }: { section: Section<{ message?: string; signature?: string; media_id?: string }> }) {
  const { data } = useInvitation();
  const { layout } = useLayout();
  const s = data.settings;
  const [p1, p2] = orderedCouple(s.couple);
  const photo = getMedia(data, section.content.media_id);
  const arch = layout === "arch";
  return (
    <section
      id="closing"
      aria-labelledby="closing-title"
      className={cn(
        "relative isolate flex items-end overflow-hidden bg-primary px-6 pb-36 pt-24 text-center",
        layout === "card" ? "min-h-[640px]" : arch ? "min-h-[90svh]" : "min-h-[100svh]",
        layout === "bento" && "rounded-[calc(var(--radius)+18px)]",
      )}
      style={{ color: "rgb(var(--c-on-primary))" }}
    >
      {photo && !arch && (
        <>
          <SmartImage media={photo} sizes="100vw" className="-z-10" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-primary" style={{ opacity: "var(--overlay)" }} />
          <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "linear-gradient(180deg, rgb(var(--c-primary) / 0.1) 0%, rgb(var(--c-primary) / 0.9) 70%)" }} />
        </>
      )}
      {layout === "deco" && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-4 border sm:inset-7" style={{ borderColor: "rgb(var(--c-on-primary) / 0.35)" }}>
          <DecoCorners inset={-1} size={54} color="rgb(var(--c-on-primary) / 0.8)" />
        </div>
      )}
      {layout === "classic" && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-3 border p-[5px] sm:inset-6" style={{ borderColor: "rgb(var(--c-on-primary) / 0.55)" }}>
          <div className="h-full border" style={{ borderColor: "rgb(var(--c-on-primary) / 0.3)" }} />
        </div>
      )}
      {layout === "nusantara" && (
        <>
          <MotifBand className="absolute inset-x-0 top-0" />
          <MotifCorners inset={22} size={52} />
        </>
      )}
      <div className="mx-auto w-full max-w-xl">
        <Reveal className="flex justify-center">
          {arch && photo ? (
            <ArchWindow className="aspect-[3/4] w-[62%] max-w-[300px]" color="rgb(var(--c-on-primary))">
              <SmartImage media={photo} sizes="300px" />
            </ArchWindow>
          ) : (
            <Monogram size={84} />
          )}
        </Reveal>
        {section.title && (
          <Reveal delay={0.08}>
            <h2 id="closing-title" className="mt-8 font-heading text-5xl leading-none sm:text-6xl">
              {section.title}
            </h2>
          </Reveal>
        )}
        {section.content.message && (
          <Reveal delay={0.14}>
            <p className="mx-auto mt-6 max-w-md font-body leading-relaxed opacity-95">{section.content.message}</p>
          </Reveal>
        )}
        <Reveal delay={0.2}>
          {section.content.signature && <p className="mt-10 font-body text-xs tracking-[0.18em]">{section.content.signature}</p>}
          <p className="mt-3 font-heading text-5xl italic leading-tight">
            {p1.nickname} &amp; {p2.nickname}
          </p>
          <p className="mt-4 font-body text-sm tracking-[0.16em] tabular-nums">{formatShortDate(s.wedding_date, s.timezone, s.language)}</p>
        </Reveal>
      </div>
    </section>
  );
}
