"use client";

import type { CSSProperties, ReactNode } from "react";
import type { Section } from "@/types/invitation";
import { buttonColors, hexToRgb, toneFor } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useInvitation } from "./context";
import { CENTERED, DecoFrame, DoubleFrame, MotifBand, SectionMark } from "./layout";
import { Reveal } from "./Reveal";
import { SmartImage } from "./SmartImage";

const rgb = (hex: string) => hexToRgb(hex).join(" ");

/** Variabel warna untuk teks, tombol, dan field sesuai latar section. */
export function useTone(bg: Section["background"]): CSSProperties {
  const { data } = useInvitation();
  const theme = data.settings.theme;
  const tone = toneFor(theme, bg);
  const btn = buttonColors(theme, tone.bg, bg === "primary");
  return {
    backgroundColor: tone.bg,
    color: tone.ink,
    ["--tone-ink" as string]: rgb(tone.ink),
    ["--tone-muted" as string]: rgb(tone.muted),
    ["--tone-accent" as string]: rgb(tone.accentInk),
    ["--btn-bg" as string]: rgb(btn.bg),
    ["--btn-fg" as string]: rgb(btn.fg),
    ["--btn-ink" as string]: rgb(tone.ink),
  };
}

export function SectionFrame({
  section,
  folio,
  align = "center",
  children,
  className,
  bleed = false,
}: {
  section: Section;
  folio: number;
  align?: "center" | "left";
  children: ReactNode;
  className?: string;
  bleed?: boolean;
}) {
  const { data, photos } = useInvitation();
  const layout = data.settings.theme.layout;
  const cinematic = layout === "cinematic";
  // Sinematik: teks selalu terang di atas foto + overlay gelap warna primary.
  const style = useTone(cinematic ? "primary" : section.background);
  const card = layout === "card";
  const centered = CENTERED.includes(layout);
  const a = centered ? "center" : card ? "left" : align;
  const hasHeader = Boolean(section.title || section.subtitle);
  const photo = cinematic ? photos[section.id] : null;

  const header = hasHeader && (
    <header className={cn("mx-auto max-w-5xl", card ? "mb-10" : "mb-14 md:mb-20", a === "center" ? "text-center" : "text-left")}>
      <Reveal>
        <SectionMark folio={folio} center={a === "center"} />
      </Reveal>
      {section.title && (
        <Reveal delay={0.08}>
          <h2
            id={`${section.key}-title`}
            className={cn(
              "mt-4 font-heading font-normal leading-[1.02] tracking-[-0.01em]",
              card ? "text-[2.2rem]" : layout === "deco" ? "text-[1.9rem] uppercase tracking-[0.14em] sm:text-5xl" : layout === "bento" ? "text-[2.4rem] tracking-[-0.025em] sm:text-[3.4rem]" : "text-[2.6rem] sm:text-6xl",
              layout === "classic" && "tracking-normal",
            )}
          >
            {section.title}
          </h2>
        </Reveal>
      )}
      {section.subtitle && (
        <Reveal delay={0.16}>
          <p className={cn("mt-5 max-w-xl font-body text-[0.98rem] leading-relaxed", a === "center" && "mx-auto")} style={{ color: "rgb(var(--tone-muted))" }}>
            {section.subtitle}
          </p>
        </Reveal>
      )}
    </header>
  );

  return (
    <section
      id={section.key}
      aria-labelledby={section.title ? `${section.key}-title` : undefined}
      className={cn(
        "relative scroll-mt-4 overflow-hidden",
        bleed ? "" : card ? "px-6 py-16" : layout === "bento" ? "px-5 py-16 sm:px-10 md:py-24" : "px-6 py-24 sm:px-10 md:py-32",
        layout === "bento" && "rounded-[calc(var(--radius)+18px)] border",
        cinematic && "isolate flex min-h-[92svh] flex-col justify-center",
        className,
      )}
      style={layout === "bento" ? { ...style, borderColor: "rgb(var(--c-text) / 0.07)" } : style}
    >
      {photo && (
        <>
          <SmartImage media={photo} sizes="100vw" className="-z-10" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-primary" style={{ opacity: "max(var(--overlay), 0.66)" }} />
          <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "linear-gradient(180deg, rgb(var(--c-primary) / 0.35), rgb(var(--c-primary) / 0.1) 40%, rgb(var(--c-primary) / 0.5))" }} />
        </>
      )}
      {layout === "nusantara" && !bleed && <MotifBand className="absolute inset-x-0 top-0" />}
      {layout === "classic" && !bleed ? (
        <DoubleFrame className="mx-auto max-w-5xl">
          {header}
          {children}
        </DoubleFrame>
      ) : layout === "deco" && !bleed ? (
        <DecoFrame className="mx-auto max-w-5xl">
          {header}
          {children}
        </DecoFrame>
      ) : (
        <>
          {header}
          {children}
        </>
      )}
    </section>
  );
}
