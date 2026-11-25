"use client";

import type { CSSProperties, ReactNode } from "react";
import type { Section } from "@/types/invitation";
import { hexToRgb, toneFor } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useInvitation } from "./context";
import { ClassicDivider, DoubleFrame, MotifBand, MotifDivider } from "./layout";
import { Reveal } from "./Reveal";
import { SmartImage } from "./SmartImage";

const rgb = (hex: string) => hexToRgb(hex).join(" ");

/** Variabel warna untuk teks, tombol, dan field sesuai latar section. */
export function useTone(bg: Section["background"]): CSSProperties {
  const { data } = useInvitation();
  const theme = data.settings.theme;
  const tone = toneFor(theme, bg);
  const dark = bg === "primary";
  return {
    backgroundColor: tone.bg,
    color: tone.ink,
    ["--tone-ink" as string]: rgb(tone.ink),
    ["--tone-muted" as string]: rgb(tone.muted),
    ["--tone-accent" as string]: rgb(tone.accentInk),
    ["--btn-bg" as string]: dark ? rgb(theme.colors.background) : rgb(theme.colors.primary),
    ["--btn-fg" as string]: dark ? rgb(theme.colors.primary) : rgb(toneFor(theme, "primary").ink),
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
  const centered = layout === "classic" || layout === "cinematic" || layout === "nusantara";
  const a = centered ? "center" : card ? "left" : align;
  const num = String(folio).padStart(2, "0");
  const hasHeader = Boolean(section.title || section.subtitle);
  const photo = cinematic ? photos[section.id] : null;

  const header = hasHeader && (
    <header className={cn("mx-auto max-w-5xl", card ? "mb-10" : "mb-14 md:mb-20", a === "center" ? "text-center" : "text-left")}>
      <Reveal>
        {layout === "classic" ? (
          <ClassicDivider />
        ) : layout === "nusantara" ? (
          <MotifDivider />
        ) : (
          <p className="folio" style={{ color: "rgb(var(--tone-accent))" }}>
            <span>No. {num}</span>
          </p>
        )}
      </Reveal>
      {section.title && (
        <Reveal delay={0.08}>
          <h2
            id={`${section.key}-title`}
            className={cn(
              "mt-4 font-heading font-normal leading-[1.02] tracking-[-0.01em]",
              card ? "text-[2.2rem]" : "text-[2.6rem] sm:text-6xl",
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
        bleed ? "" : card ? "px-6 py-16" : "px-6 py-24 sm:px-10 md:py-32",
        cinematic && "isolate flex min-h-[92svh] flex-col justify-center",
        className,
      )}
      style={style}
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
      ) : (
        <>
          {header}
          {children}
        </>
      )}
    </section>
  );
}
