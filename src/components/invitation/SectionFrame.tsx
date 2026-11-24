"use client";

import type { CSSProperties, ReactNode } from "react";
import type { Section } from "@/types/invitation";
import { hexToRgb, toneFor } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useInvitation } from "./context";
import { Reveal } from "./Reveal";

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
  const style = useTone(section.background);
  const num = String(folio).padStart(2, "0");
  const hasHeader = Boolean(section.title || section.subtitle);
  return (
    <section
      id={section.key}
      aria-labelledby={section.title ? `${section.key}-title` : undefined}
      className={cn("relative scroll-mt-4 overflow-hidden", bleed ? "" : "px-6 py-24 sm:px-10 md:py-32", className)}
      style={style}
    >
      {hasHeader && (
        <header className={cn("mx-auto mb-14 max-w-5xl md:mb-20", align === "center" ? "text-center" : "text-left")}>
          <Reveal>
            <p className="folio" style={{ color: "rgb(var(--tone-accent))" }}>
              <span>No. {num}</span>
            </p>
          </Reveal>
          {section.title && (
            <Reveal delay={0.08}>
              <h2
                id={`${section.key}-title`}
                className="mt-4 font-heading text-[2.6rem] font-normal leading-[1.02] tracking-[-0.01em] sm:text-6xl"
              >
                {section.title}
              </h2>
            </Reveal>
          )}
          {section.subtitle && (
            <Reveal delay={0.16}>
              <p
                className={cn("mt-5 max-w-xl font-body text-[0.98rem] leading-relaxed", align === "center" && "mx-auto")}
                style={{ color: "rgb(var(--tone-muted))" }}
              >
                {section.subtitle}
              </p>
            </Reveal>
          )}
        </header>
      )}
      {children}
    </section>
  );
}
