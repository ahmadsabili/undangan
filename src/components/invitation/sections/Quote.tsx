"use client";

import type { Section } from "@/types/invitation";
import { Reveal } from "../Reveal";
import { SectionFrame } from "../SectionFrame";

type QuoteContent = { type?: string; arabic?: string; text?: string; source?: string };

export function Quote({ section, folio }: { section: Section<QuoteContent>; folio: number }) {
  const c = section.content;
  const s = { ...section, title: "", subtitle: "" }; // kutipan tidak butuh judul besar
  return (
    <SectionFrame section={s} folio={folio}>
      <figure className="mx-auto max-w-2xl text-center">
        <Reveal>
          <p className="folio justify-center" style={{ color: "rgb(var(--tone-accent))" }}>
            <span>No. {String(folio).padStart(2, "0")}</span>
          </p>
        </Reveal>
        {c.type === "quran" && c.arabic && (
          <Reveal delay={0.1}>
            <p lang="ar" dir="rtl" className="mt-10 text-[1.6rem] leading-[2.1] sm:text-[2rem]" style={{ fontFamily: "Amiri, serif" }}>
              {c.arabic}
            </p>
          </Reveal>
        )}
        {c.text && (
          <Reveal delay={0.2}>
            <blockquote className="mt-8 font-heading text-[1.35rem] italic leading-[1.55] sm:text-[1.6rem]">
              <p>{c.text}</p>
            </blockquote>
          </Reveal>
        )}
        {c.source && (
          <Reveal delay={0.3}>
            <figcaption className="mt-8 font-body text-xs font-medium tracking-[0.2em]" style={{ color: "rgb(var(--tone-accent))" }}>
              {c.source}
            </figcaption>
          </Reveal>
        )}
      </figure>
    </SectionFrame>
  );
}
