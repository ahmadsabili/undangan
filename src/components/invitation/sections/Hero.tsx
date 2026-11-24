"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { formatLongDate } from "@/lib/date";
import { getMedia } from "@/lib/media";
import { orderedCouple } from "@/services/normalize";
import type { Section } from "@/types/invitation";
import { useInvitation } from "../context";
import { useReducedMotionSafe } from "../useReducedMotionSafe";
import { InvLink } from "../InvButton";
import { useTone } from "../SectionFrame";
import { SmartImage } from "../SmartImage";

type HeroContent = { tagline?: string; button_label?: string; media_id?: string };

// Komposisi editorial: nama besar bertumpuk di kiri, foto potret tinggi dengan
// bingkai garis yang digeser. Parallax tipis pada foto memberi kedalaman.
export function Hero({ section, saveTheDateHref }: { section: Section<HeroContent>; saveTheDateHref: string }) {
  const { data, motion: m } = useInvitation();
  const reduce = useReducedMotionSafe() || !m.enabled;
  const s = data.settings;
  const [p1, p2] = orderedCouple(s.couple);
  const photo = getMedia(data, section.content.media_id);
  const style = useTone(section.background);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-6%", "6%"]);

  const line = (i: number) => ({
    initial: m.enabled ? { y: "105%" } : (false as const),
    animate: { y: "0%" },
    transition: { duration: reduce ? 0 : m.duration * 1.2, delay: reduce ? 0 : 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section id="hero" aria-labelledby="hero-names" className="relative overflow-hidden px-6 pb-20 pt-16 sm:px-10 md:pb-28 md:pt-24" style={style}>
      <div className="mx-auto grid max-w-6xl items-end gap-12 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-5 md:pb-10">
          <p className="folio" style={{ color: "rgb(var(--tone-accent))" }}>
            <span>The Wedding</span>
          </p>
          <h1 id="hero-names" className="mt-6 font-heading text-[4.1rem] font-normal leading-[0.92] tracking-[-0.02em] sm:text-8xl">
            <span className="block overflow-hidden pb-1">
              <motion.span className="block" {...line(0)}>
                {p1.nickname}
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-1">
              <motion.span className="block pl-[0.9em] font-heading italic text-[0.7em] leading-[1.05]" style={{ color: "rgb(var(--tone-accent))" }} {...line(1)}>
                &amp;
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-1">
              <motion.span className="block" {...line(2)}>
                {p2.nickname}
              </motion.span>
            </span>
          </h1>
          <div className="mt-8 flex items-center gap-4">
            <span className="hairline w-10" />
            <p className="font-body text-sm tracking-[0.08em]">{formatLongDate(s.wedding_date, s.timezone, s.language)}</p>
          </div>
          {section.content.tagline && (
            <p className="mt-6 max-w-sm font-heading text-2xl italic leading-snug" style={{ color: "rgb(var(--tone-muted))" }}>
              {section.content.tagline}
            </p>
          )}
          <div className="mt-9">
            <InvLink href={saveTheDateHref}>{section.content.button_label || "Simpan Tanggal"}</InvLink>
          </div>
        </div>

        {photo && (
          <div ref={ref} className="relative md:col-span-7">
            <div aria-hidden="true" className="absolute -right-3 -top-3 bottom-3 left-3 border md:-right-5 md:-top-5" style={{ borderColor: "rgb(var(--c-accent) / 0.6)", borderRadius: "var(--radius)" }} />
            <div className="relative aspect-[4/5] overflow-hidden md:aspect-[5/6]" style={{ borderRadius: "var(--radius)" }}>
              <motion.div className="absolute inset-[-7%_0]" style={{ y }}>
                <SmartImage media={photo} sizes="(min-width: 768px) 58vw, 100vw" priority />
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
