"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Gift as GiftIcon, QrCode, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getMedia } from "@/lib/media";
import type { Section, WeddingGift } from "@/types/invitation";
import { useInvitation } from "../context";
import { CopyButton } from "../CopyButton";
import { InvButton } from "../InvButton";
import { Reveal } from "../Reveal";
import { SectionFrame } from "../SectionFrame";

function QrisDialog({ gift, onClose }: { gift: WeddingGift; onClose: () => void }) {
  const { data, t } = useInvitation();
  const img = getMedia(data, gift.qris_media_id);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={`QRIS ${gift.provider}`} className="w-full max-w-sm bg-white p-6 text-[#1d1d1d]" style={{ borderRadius: "var(--radius)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="font-heading text-2xl">{gift.provider || "QRIS"}</p>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={t.close} className="grid h-11 w-11 place-items-center rounded-full hover:bg-black/5">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {img ? (
          <div className="relative mt-4 aspect-square w-full">
            <Image src={img.url} alt={`QRIS ${gift.account_holder}`} fill sizes="320px" className="object-contain" unoptimized={img.url.endsWith(".svg")} />
          </div>
        ) : (
          <p className="mt-4 font-body text-sm">Gambar QRIS belum diunggah.</p>
        )}
        {gift.account_holder && <p className="mt-4 text-center font-body text-sm">a.n. {gift.account_holder}</p>}
      </div>
    </motion.div>
  );
}

function GiftItem({ g, onQris }: { g: WeddingGift; onQris: () => void }) {
  const { data, t } = useInvitation();
  const logo = getMedia(data, g.logo_media_id);
  return (
    <li className="flex flex-col gap-5 border-b py-7 last:border-b-0 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "rgb(var(--c-accent) / 0.4)" }}>
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo.url} alt={logo.alt || g.provider} width={72} height={28} loading="lazy" className="h-7 w-auto max-w-[96px] object-contain" />
          )}
          <p className="font-body text-xs font-medium tracking-[0.16em]" style={{ color: "rgb(var(--tone-accent))" }}>
            {g.provider}
          </p>
        </div>
        {(g.type === "bank" || g.type === "ewallet") && (
          <>
            <p className="mt-3 break-all font-heading text-[1.9rem] leading-none tracking-wide [font-variant-numeric:lining-nums_tabular-nums]">{g.account_number}</p>
            <p className="mt-2 font-body text-sm" style={{ color: "rgb(var(--tone-muted))" }}>
              a.n. {g.account_holder}
            </p>
          </>
        )}
        {g.type === "address" && (
          <>
            <p className="mt-3 font-heading text-2xl">{g.account_holder}</p>
            <p className="mt-1 whitespace-pre-line font-body text-sm leading-relaxed" style={{ color: "rgb(var(--tone-muted))" }}>
              {g.address}
            </p>
          </>
        )}
        {g.type === "qris" && <p className="mt-3 font-body text-sm">a.n. {g.account_holder}</p>}
        {g.note && <p className="mt-2 font-body text-sm">{g.note}</p>}
      </div>
      <div className="shrink-0">
        {(g.type === "bank" || g.type === "ewallet") && g.account_number && <CopyButton value={g.account_number.replace(/\s/g, "")} label={t.copyNumber} copiedLabel={t.copied} />}
        {g.type === "address" && g.address && <CopyButton value={`${g.account_holder}\n${g.address}`} label={t.copyAddress} copiedLabel={t.copied} />}
        {g.type === "qris" && (
          <InvButton variant="outline" onClick={onQris}>
            <QrCode className="h-4 w-4" aria-hidden="true" />
            {t.showQris}
          </InvButton>
        )}
      </div>
    </li>
  );
}

export function Gift({ section, folio }: { section: Section; folio: number }) {
  const { data } = useInvitation();
  const [open, setOpen] = useState(false);
  const [qris, setQris] = useState<WeddingGift | null>(null);
  const panelId = useId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const gifts = data.gifts.filter((g) => g.enabled);
  if (!gifts.length) return null;

  return (
    <SectionFrame section={section} folio={folio}>
      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <InvButton variant="outline" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)}>
            <GiftIcon className="h-4 w-4" aria-hidden="true" />
            {open ? "Sembunyikan" : "Kirim Tanda Kasih"}
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
          </InvButton>
        </Reveal>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id={panelId}
              key="panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden text-left"
            >
              <ul className="mt-10 px-6 sm:px-10" style={{ background: "rgb(var(--c-surface))", color: "rgb(var(--c-text))", borderRadius: "var(--radius)", ["--tone-ink" as string]: "var(--c-text)", ["--btn-ink" as string]: "var(--c-text)", ["--tone-accent" as string]: "var(--c-accent-ink)", ["--tone-muted" as string]: "var(--c-text)" }}>
                {gifts.map((g) => (
                  <GiftItem key={g.id} g={g} onQris={() => setQris(g)} />
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {mounted &&
        createPortal(<AnimatePresence>{qris && <QrisDialog gift={qris} onClose={() => setQris(null)} />}</AnimatePresence>, document.body)}
    </SectionFrame>
  );
}
