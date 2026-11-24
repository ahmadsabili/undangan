"use client";

import { motion } from "framer-motion";
import { MailOpen } from "lucide-react";
import { formatShortDate } from "@/lib/date";
import { getMedia } from "@/lib/media";
import { orderedCouple } from "@/services/normalize";
import type { Section } from "@/types/invitation";
import { useInvitation } from "../context";
import { useReducedMotionSafe } from "../useReducedMotionSafe";
import { Monogram } from "../Monogram";
import { SmartImage } from "../SmartImage";

type CoverContent = { eyebrow?: string; greeting?: string; default_guest?: string; button_label?: string; media_id?: string };

export function Cover({ section, onOpen }: { section: Section<CoverContent>; onOpen: () => void }) {
  const { data, guest, motion: m } = useInvitation();
  const reduce = useReducedMotionSafe() || !m.enabled;
  const s = data.settings;
  const c = section.content;
  const [p1, p2] = orderedCouple(s.couple);
  const photo = getMedia(data, c.media_id);
  const light = "rgb(var(--c-on-primary))";

  const item = (i: number) => ({
    initial: m.enabled ? { opacity: 0, y: 14 } : (false as const),
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduce ? 0 : 1, delay: reduce ? 0 : 0.25 + i * 0.14, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cover-names"
      className="fixed inset-0 z-50 flex h-[100dvh] w-full flex-col overflow-hidden bg-primary"
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: "-6%", transition: { duration: 1.1, ease: [0.65, 0, 0.35, 1] } }}
    >
      {photo && <SmartImage media={photo} sizes="100vw" priority className="scale-[1.02]" />}
      <div aria-hidden="true" className="absolute inset-0 bg-primary" style={{ opacity: "var(--overlay)" }} />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgb(var(--c-primary) / 0.15) 0%, rgb(var(--c-primary) / 0.35) 45%, rgb(var(--c-primary) / 0.86) 100%)" }}
      />

      <div className="relative flex flex-1 flex-col items-center px-6 pb-safe pt-[max(2.5rem,env(safe-area-inset-top))] text-center" style={{ color: light }}>
        <motion.div {...item(0)}>
          <Monogram size={78} />
        </motion.div>

        <div className="mt-auto w-full max-w-md">
          <motion.p {...item(1)} className="font-body text-[0.72rem] font-medium tracking-[0.22em]">
            {c.eyebrow || "The Wedding of"}
          </motion.p>
          <motion.h1 {...item(2)} id="cover-names" className="mt-3 font-heading text-[3.3rem] font-normal leading-[0.95] sm:text-7xl">
            {p1.nickname}
            <span className="mx-3 font-heading italic text-[0.8em] align-middle" style={{ color: "rgb(var(--c-secondary))" }}>
              &amp;
            </span>
            {p2.nickname}
          </motion.h1>
          <motion.p {...item(3)} className="mt-4 font-body text-sm tracking-[0.16em] tabular-nums">
            {formatShortDate(s.wedding_date, s.timezone, s.language)}
          </motion.p>

          <motion.div {...item(4)} className="mx-auto mt-10 max-w-xs">
            <div className="hairline mx-auto w-16" />
            <p className="mt-6 font-body text-[0.8rem] opacity-90">{c.greeting || "Kepada Yth. Bapak/Ibu/Saudara/i"}</p>
            <p className="mt-2 break-words font-heading text-[1.9rem] italic leading-tight">{guest.name}</p>
          </motion.div>

          <motion.div {...item(5)} className="mb-6 mt-9">
            <button
              type="button"
              onClick={onOpen}
              className="inv-btn"
              data-variant="solid"
              style={{ ["--btn-bg" as string]: "var(--c-on-primary)", ["--btn-fg" as string]: "var(--c-primary)" }}
            >
              <MailOpen aria-hidden="true" className="h-4 w-4" />
              {c.button_label || "Buka Undangan"}
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
