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
import { Reveal } from "../Reveal";
import { SmartImage } from "../SmartImage";
import { ArchWindow, ClassicDivider, DecoCorners, DecoDivider, DecoSunburst, DecoWindow, DoubleFrame, MotifBand, MotifCorners, MotifDivider, useLayout } from "../layout";
import { Monogram } from "../Monogram";
import { cn } from "@/lib/utils";

type HeroContent = { tagline?: string; button_label?: string; media_id?: string };

// Komposisi editorial: nama besar bertumpuk di kiri, foto potret tinggi dengan
// bingkai garis yang digeser. Parallax tipis pada foto memberi kedalaman.
function HeroEditorial({ section, saveTheDateHref }: { section: Section<HeroContent>; saveTheDateHref: string }) {
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

export function Hero(props: { section: Section<HeroContent>; saveTheDateHref: string }) {
  const { layout } = useLayout();
  if (layout === "classic" || layout === "nusantara") return <HeroCentered {...props} />;
  if (layout === "cinematic") return <HeroCinematic {...props} />;
  if (layout === "card") return <HeroCard {...props} />;
  if (layout === "deco") return <HeroDeco {...props} />;
  if (layout === "arch") return <HeroArch {...props} />;
  if (layout === "bento") return <HeroBento {...props} />;
  return <HeroEditorial {...props} />;
}

function useHeroData(section: Section<HeroContent>) {
  const { data } = useInvitation();
  const s = data.settings;
  const [p1, p2] = orderedCouple(s.couple);
  return { s, p1, p2, photo: getMedia(data, section.content.media_id), date: formatLongDate(s.wedding_date, s.timezone, s.language) };
}

// Klasik & Nusantara: komposisi simetris, monogram di atas, foto berbingkai oval/lengkung di bawah.
function HeroCentered({ section, saveTheDateHref }: { section: Section<HeroContent>; saveTheDateHref: string }) {
  const { layout } = useLayout();
  const { p1, p2, photo, date } = useHeroData(section);
  const style = useTone(section.background);
  const nusantara = layout === "nusantara";
  const inner = (
    <div className="text-center">
      <Reveal className="flex justify-center">
        <Monogram size={72} />
      </Reveal>
      <Reveal delay={0.05}>
        <p className="mt-8 font-body text-[0.72rem] font-medium tracking-[0.22em]" style={{ color: "rgb(var(--tone-accent))" }}>
          The Wedding of
        </p>
      </Reveal>
      <Reveal delay={0.1}>
        <h1 id="hero-names" className="mt-4 font-heading text-[3.4rem] font-normal leading-[1] sm:text-7xl">
          {p1.nickname}
          <span className="mx-3 block text-[0.6em] italic leading-[1.3] sm:inline" style={{ color: "rgb(var(--tone-accent))" }}>
            &amp;
          </span>
          {p2.nickname}
        </h1>
      </Reveal>
      <Reveal delay={0.15}>
        {nusantara ? <MotifDivider className="mt-7" /> : <ClassicDivider className="mt-7" />}
        <p className="mt-5 font-body text-sm tracking-[0.1em]">{date}</p>
      </Reveal>
      {photo && (
        <Reveal variant="image" className="mx-auto mt-10 w-[78%] max-w-[360px]">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[50%] border-[3px] border-double" style={{ borderColor: "rgb(var(--c-accent))" }}>
            <SmartImage media={photo} sizes="360px" priority />
          </div>
        </Reveal>
      )}
      {section.content.tagline && (
        <Reveal delay={0.1}>
          <p className="mx-auto mt-9 max-w-sm font-heading text-2xl italic leading-snug" style={{ color: "rgb(var(--tone-muted))" }}>
            {section.content.tagline}
          </p>
        </Reveal>
      )}
      <div className="mt-9">
        <InvLink href={saveTheDateHref}>{section.content.button_label || "Simpan Tanggal"}</InvLink>
      </div>
    </div>
  );
  return (
    <section id="hero" aria-labelledby="hero-names" className="relative overflow-hidden px-5 pb-20 pt-12 sm:px-10 md:pb-28 md:pt-20" style={style}>
      {nusantara ? (
        <>
          <MotifBand className="absolute inset-x-0 top-0" />
          <div className="relative mx-auto max-w-2xl px-6 py-12">
            <MotifCorners inset={0} size={52} />
            {inner}
          </div>
        </>
      ) : (
        <DoubleFrame className="mx-auto max-w-2xl">{inner}</DoubleFrame>
      )}
    </section>
  );
}

// Sinematik: foto layar penuh, nama besar di kiri bawah seperti kredit film.
function HeroCinematic({ section, saveTheDateHref }: { section: Section<HeroContent>; saveTheDateHref: string }) {
  const { p1, p2, photo, date } = useHeroData(section);
  const style = useTone("primary");
  return (
    <section id="hero" aria-labelledby="hero-names" className="relative isolate flex min-h-[100svh] items-end overflow-hidden px-6 pb-32 pt-24 sm:px-12" style={style}>
      {photo && <SmartImage media={photo} sizes="100vw" priority className="-z-10" />}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-primary" style={{ opacity: "calc(var(--overlay) * 0.7)" }} />
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "linear-gradient(180deg, transparent 30%, rgb(var(--c-primary) / 0.92) 100%)" }} />
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <p className="folio" style={{ color: "rgb(var(--tone-accent))" }}>
            <span>The Wedding</span>
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 id="hero-names" className="mt-5 font-heading text-[3.8rem] font-normal leading-[0.92] tracking-[-0.02em] sm:text-8xl md:text-9xl">
            {p1.nickname}
            <span className="italic" style={{ color: "rgb(var(--tone-accent))" }}> &amp; </span>
            {p2.nickname}
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-body text-sm tracking-[0.12em]">{date}</p>
              {section.content.tagline && <p className="mt-2 max-w-md font-heading text-xl italic" style={{ color: "rgb(var(--tone-muted))" }}>{section.content.tagline}</p>}
            </div>
            <div>
              <InvLink href={saveTheDateHref}>{section.content.button_label || "Simpan Tanggal"}</InvLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// Kartu Minimal: foto di atas kartu, nama dan tanggal ringkas di bawahnya.
function HeroCard({ section, saveTheDateHref }: { section: Section<HeroContent>; saveTheDateHref: string }) {
  const { p1, p2, photo, date } = useHeroData(section);
  const style = useTone(section.background);
  return (
    <section id="hero" aria-labelledby="hero-names" className="relative overflow-hidden" style={style}>
      {photo && (
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          <SmartImage media={photo} sizes="460px" priority />
        </div>
      )}
      <div className="px-6 pb-14 pt-10">
        <p className="folio" style={{ color: "rgb(var(--tone-accent))" }}>
          <span>The Wedding</span>
        </p>
        <h1 id="hero-names" className="mt-4 font-heading text-[2.9rem] font-normal leading-[1]">
          {p1.nickname} <span className="italic" style={{ color: "rgb(var(--tone-accent))" }}>&amp;</span> {p2.nickname}
        </h1>
        <p className="mt-4 font-body text-sm">{date}</p>
        {section.content.tagline && <p className="mt-4 font-heading text-xl italic leading-snug" style={{ color: "rgb(var(--tone-muted))" }}>{section.content.tagline}</p>}
        <InvLink href={saveTheDateHref} className="mt-7 w-full">
          {section.content.button_label || "Simpan Tanggal"}
        </InvLink>
      </div>
    </section>
  );
}

const buttonLabel = (section: Section<HeroContent>) => section.content.button_label || "Simpan Tanggal";

// Art Deco Mewah: sinar kipas di belakang monogram, nama kapital berjarak lebar,
// foto dalam jendela berpuncak bertingkat. Seluruhnya di dalam bingkai sudut bertingkat.
function HeroDeco({ section, saveTheDateHref }: { section: Section<HeroContent>; saveTheDateHref: string }) {
  const { p1, p2, photo, date } = useHeroData(section);
  const style = useTone(section.background);
  return (
    <section id="hero" aria-labelledby="hero-names" className="relative overflow-hidden px-4 pb-16 pt-6 sm:px-10 md:pb-24 md:pt-12" style={style}>
      <div className="relative mx-auto max-w-3xl border px-5 pb-14 pt-12 text-center sm:px-14" style={{ borderColor: "rgb(var(--c-accent) / 0.4)" }}>
        <DecoCorners inset={-1} size={58} />
        <div className="relative mx-auto flex h-[140px] w-[280px] items-end justify-center sm:h-[170px] sm:w-[340px]">
          <DecoSunburst className="absolute inset-x-0 bottom-0 w-full" />
          <Reveal className="relative pb-3">
            <Monogram size={68} />
          </Reveal>
        </div>
        <Reveal delay={0.05}>
          <p className="mt-10 font-body text-[0.7rem] font-medium uppercase tracking-[0.42em]" style={{ color: "rgb(var(--tone-accent))" }}>
            The Wedding of
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 id="hero-names" className="mt-6 font-heading text-[2.5rem] font-normal uppercase leading-[1.05] tracking-[0.1em] sm:text-6xl">
            <span className="block">{p1.nickname}</span>
            <span className="my-2 block font-heading text-[0.75em] italic normal-case tracking-normal" style={{ color: "rgb(var(--tone-accent))" }}>
              &amp;
            </span>
            <span className="block">{p2.nickname}</span>
          </h1>
        </Reveal>
        <Reveal delay={0.15}>
          <DecoDivider className="mt-8" />
          <p className="mt-5 font-body text-[0.78rem] uppercase tracking-[0.3em]">{date}</p>
        </Reveal>
        {photo && (
          <Reveal variant="image" className="mx-auto mt-12 w-[74%] max-w-[340px]">
            <DecoWindow className="aspect-[3/4]">
              <SmartImage media={photo} sizes="340px" priority />
            </DecoWindow>
          </Reveal>
        )}
        {section.content.tagline && (
          <Reveal delay={0.1}>
            <p className="mx-auto mt-10 max-w-sm font-heading text-xl leading-snug" style={{ color: "rgb(var(--tone-muted))" }}>
              {section.content.tagline}
            </p>
          </Reveal>
        )}
        <div className="mt-9">
          <InvLink href={saveTheDateHref}>{buttonLabel(section)}</InvLink>
        </div>
      </div>
    </section>
  );
}

// Lengkung Modern: foto besar berbentuk jendela lengkung, nama ditumpuk di bawahnya
// dengan ampersand skrip, tanggal dalam kapsul.
function HeroArch({ section, saveTheDateHref }: { section: Section<HeroContent>; saveTheDateHref: string }) {
  const { p1, p2, photo, date } = useHeroData(section);
  const style = useTone(section.background);
  return (
    <section id="hero" aria-labelledby="hero-names" className="relative overflow-hidden px-6 pb-20 pt-14 text-center sm:px-10 md:pb-28 md:pt-20" style={style}>
      <Reveal>
        <p className="font-body text-[0.72rem] font-medium tracking-[0.3em]" style={{ color: "rgb(var(--tone-accent))" }}>
          THE WEDDING OF
        </p>
      </Reveal>
      {photo && (
        <Reveal variant="image" className="mx-auto mt-9 w-[80%] max-w-[400px]">
          <ArchWindow className="aspect-[3/4.2]">
            <SmartImage media={photo} sizes="400px" priority />
          </ArchWindow>
        </Reveal>
      )}
      <Reveal delay={0.1}>
        <h1 id="hero-names" className="relative mt-10 font-heading text-[3.4rem] font-normal leading-[0.95] tracking-[-0.01em] sm:text-7xl md:text-8xl">
          <span className="block">{p1.nickname}</span>
          <span className="block font-heading text-[0.62em] italic leading-[1.3]" style={{ color: "rgb(var(--tone-accent))" }}>
            &amp;
          </span>
          <span className="block">{p2.nickname}</span>
        </h1>
      </Reveal>
      <Reveal delay={0.15}>
        <p className="mt-7 inline-flex items-center rounded-full border px-5 py-2 font-body text-sm tracking-[0.06em]" style={{ borderColor: "rgb(var(--tone-ink) / 0.25)" }}>
          {date}
        </p>
      </Reveal>
      {section.content.tagline && (
        <Reveal delay={0.1}>
          <p className="mx-auto mt-7 max-w-sm font-heading text-2xl italic leading-snug" style={{ color: "rgb(var(--tone-muted))" }}>
            {section.content.tagline}
          </p>
        </Reveal>
      )}
      <div className="mt-9">
        <InvLink href={saveTheDateHref}>{buttonLabel(section)}</InvLink>
      </div>
    </section>
  );
}

// Bento Modern: ubin-ubin membulat. Foto besar, ubin nama berwarna primary,
// ubin tanggal dan monogram kecil di bawahnya.
function HeroBento({ section, saveTheDateHref }: { section: Section<HeroContent>; saveTheDateHref: string }) {
  const { p1, p2, photo, date } = useHeroData(section);
  const base = useTone(section.background);
  const dark = useTone("primary");
  const soft = useTone("secondary");
  const tile = "rounded-[calc(var(--radius)+18px)] border";
  const line = { borderColor: "rgb(var(--c-text) / 0.07)" };
  return (
    <section id="hero" aria-labelledby="hero-names" className="grid gap-3 sm:gap-4 md:grid-cols-5 md:grid-rows-[1fr_auto]">
      {photo && (
        <div className={cn(tile, "relative aspect-[4/5] overflow-hidden md:col-span-3 md:row-span-2 md:aspect-auto md:min-h-[640px]")} style={line}>
          <SmartImage media={photo} sizes="(min-width: 768px) 60vw, 100vw" priority />
        </div>
      )}
      <div className={cn(tile, "flex flex-col justify-between p-7 sm:p-10", photo ? "md:col-span-2" : "md:col-span-5")} style={{ ...dark, ...line }}>
        <p className="folio" style={{ color: "rgb(var(--tone-accent))" }}>
          <span>The Wedding</span>
        </p>
        <Reveal delay={0.05}>
          <h1 id="hero-names" className="mt-10 font-heading text-[3.3rem] font-normal leading-[0.92] tracking-[-0.025em] sm:text-7xl">
            {p1.nickname}
            <span className="block font-heading text-[0.62em] italic leading-[1.25]" style={{ color: "rgb(var(--tone-accent))" }}>
              &amp;
            </span>
            {p2.nickname}
          </h1>
        </Reveal>
        <div className="mt-10">
          {section.content.tagline && (
            <p className="mb-6 max-w-sm font-body text-[0.95rem] leading-relaxed" style={{ color: "rgb(var(--tone-muted))" }}>
              {section.content.tagline}
            </p>
          )}
          <InvLink href={saveTheDateHref}>{buttonLabel(section)}</InvLink>
        </div>
      </div>
      <div className={cn("grid grid-cols-[1fr_auto] gap-3 sm:gap-4", photo ? "md:col-span-2" : "md:col-span-5")}>
        <div className={cn(tile, "p-6")} style={{ ...soft, ...line }}>
          <p className="font-body text-[0.7rem] font-medium tracking-[0.18em]" style={{ color: "rgb(var(--tone-accent))" }}>
            SAVE THE DATE
          </p>
          <p className="mt-3 font-heading text-[1.45rem] leading-tight">{date}</p>
        </div>
        <div className={cn(tile, "grid place-items-center px-6")} style={{ ...base, ...line }}>
          <Monogram size={58} />
        </div>
      </div>
    </section>
  );
}
