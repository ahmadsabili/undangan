"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import type { MediaAsset } from "@/types/invitation";
import { useInvitation } from "./context";

export function Lightbox({
  items,
  index,
  onClose,
  onIndex,
}: {
  items: { media: MediaAsset; caption: string }[];
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const { t } = useInvitation();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const open = index !== null;

  const go = useCallback(
    (dir: number) => {
      if (index === null) return;
      onIndex((index + dir + items.length) % items.length);
    },
    [index, items.length, onIndex],
  );

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "Tab" && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>("button");
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prevOverflow;
      prevFocus?.focus();
    };
  }, [open, go, onClose]);

  const current = index !== null ? items[index] : null;

  return (
    <AnimatePresence>
      {open && current && (
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${t.photo} ${index! + 1} / ${items.length}`}
          className="fixed inset-0 z-[70] flex flex-col bg-[#141414]/95 text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
          onTouchEnd={(e) => {
            if (!touch.current) return;
            const dx = e.changedTouches[0].clientX - touch.current.x;
            const dy = e.changedTouches[0].clientY - touch.current.y;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
            if (dy > 120 && Math.abs(dy) > Math.abs(dx)) onClose();
            touch.current = null;
          }}
        >
          <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <p className="font-body text-sm tabular-nums text-white/85">
              {index! + 1} / {items.length}
            </p>
            <button ref={closeRef} type="button" onClick={onClose} aria-label={t.close} className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10 active:bg-white/20">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="relative flex-1">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div key={current.media.id + index} className="absolute inset-0 m-4 md:m-12" initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                <Image
                  src={current.media.url}
                  alt={current.media.alt || current.caption || `${t.photo} ${index! + 1}`}
                  fill
                  sizes="100vw"
                  unoptimized={current.media.url.endsWith(".svg")}
                  className="object-contain"
                />
              </motion.div>
            </AnimatePresence>
          </div>
          {current.caption && <p className="px-6 text-center font-body text-sm text-white/85">{current.caption}</p>}
          <div className="flex justify-center gap-4 pb-safe pt-3">
            <button type="button" onClick={() => go(-1)} aria-label={t.prev} className="grid h-12 w-12 place-items-center rounded-full border border-white/30 hover:bg-white/10 active:bg-white/20">
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label={t.next} className="grid h-12 w-12 place-items-center rounded-full border border-white/30 hover:bg-white/10 active:bg-white/20">
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
