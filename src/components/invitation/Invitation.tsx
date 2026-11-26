"use client";

import { AnimatePresence, MotionConfig } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMedia } from "@/lib/media";
import { bentoCanvas, motionScale, themeStyle } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { GuestContext, InvitationData, Section } from "@/types/invitation";
import { BottomNav } from "./BottomNav";
import { InvitationContext } from "./context";
import { DICT } from "./i18n";
import { MusicPlayer, type MusicHandle } from "./MusicPlayer";
import { Closing } from "./sections/Closing";
import { Countdown } from "./sections/Countdown";
import { Couple } from "./sections/Couple";
import { Cover } from "./sections/Cover";
import { Events } from "./sections/Events";
import { Gallery } from "./sections/Gallery";
import { Gift } from "./sections/Gift";
import { Hashtag } from "./sections/Hashtag";
import { Hero } from "./sections/Hero";
import { Livestream } from "./sections/Livestream";
import { Location } from "./sections/Location";
import { Quote } from "./sections/Quote";
import { Rsvp } from "./sections/Rsvp";
import { Story } from "./sections/Story";
import { Wishes } from "./sections/Wishes";

/* eslint-disable @typescript-eslint/no-explicit-any */
function renderSection(section: Section, folio: number, saveTheDateHref: string) {
  const s = section as Section<any>;
  switch (section.key) {
    case "hero":
      return <Hero key={s.id} section={s} saveTheDateHref={saveTheDateHref} />;
    case "quote":
      return <Quote key={s.id} section={s} folio={folio} />;
    case "couple":
      return <Couple key={s.id} section={s} folio={folio} />;
    case "countdown":
      return <Countdown key={s.id} section={s} folio={folio} />;
    case "events":
      return <Events key={s.id} section={s} folio={folio} />;
    case "location":
      return <Location key={s.id} section={s} folio={folio} />;
    case "story":
      return <Story key={s.id} section={s} folio={folio} />;
    case "gallery":
      return <Gallery key={s.id} section={s} folio={folio} />;
    case "rsvp":
      return <Rsvp key={s.id} section={s} folio={folio} />;
    case "wishes":
      return <Wishes key={s.id} section={s} folio={folio} />;
    case "gift":
      return <Gift key={s.id} section={s} folio={folio} />;
    case "livestream":
      return <Livestream key={s.id} section={s} folio={folio} />;
    case "hashtag":
      return <Hashtag key={s.id} section={s} folio={folio} />;
    case "closing":
      return <Closing key={s.id} section={s} />;
    default:
      return null;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function Invitation({
  data,
  guest,
  mode = "public",
  startOpen = false,
}: {
  data: InvitationData;
  guest: GuestContext;
  mode?: "public" | "preview";
  startOpen?: boolean;
}) {
  // Fitur sesi: tamu hanya melihat acara yang ditujukan untuknya.
  const scoped = useMemo(() => {
    if (!guest.eventIds?.length) return data;
    const events = data.events.filter((e) => guest.eventIds!.includes(e.id));
    return events.length ? { ...data, events } : data;
  }, [data, guest.eventIds]);
  const s = data.settings;
  const theme = s.theme;
  const [opened, setOpened] = useState(startOpen);
  const music = useRef<MusicHandle>(null);
  const musicFile = s.music_enabled ? getMedia(data, s.music_media_id) : null;

  const cover = data.sections.find((x) => x.key === "cover" && x.enabled);
  const visible = useMemo(() => data.sections.filter((x) => x.enabled && x.key !== "cover"), [data.sections]);
  const folios = useMemo(() => {
    let n = 0;
    return Object.fromEntries(visible.map((x) => [x.id, x.key === "hero" || x.key === "closing" ? 0 : ++n]));
  }, [visible]);
  const saveTheDateHref = visible.some((x) => x.key === "countdown") ? "#countdown" : visible.some((x) => x.key === "events") ? "#events" : "#hero";

  // Template Sinematik: foto latar tiap section. Pakai foto pilihan admin; bila kosong,
  // bergiliran memakai foto galeri lalu foto hero/cover agar tiap section tetap berfoto.
  const photos = useMemo(() => {
    if (theme.layout !== "cinematic") return {};
    const pool = [
      ...data.gallery.map((g) => getMedia(data, g.media_id)),
      getMedia(data, (data.sections.find((x) => x.key === "hero")?.content as { media_id?: string })?.media_id),
      getMedia(data, (data.sections.find((x) => x.key === "cover")?.content as { media_id?: string })?.media_id),
    ].filter((m): m is NonNullable<typeof m> => Boolean(m && m.kind === "image"));
    let i = 0;
    return Object.fromEntries(
      visible.map((x) => [x.id, getMedia(data, x.background_media_id) ?? (pool.length ? pool[i++ % pool.length] : null)]),
    );
  }, [data, visible, theme.layout]);

  const ctx = useMemo(
    () => ({ data: scoped, guest, mode, t: DICT[s.language] ?? DICT.id, motion: motionScale(theme.animation), photos }),
    [scoped, guest, mode, s.language, theme.animation, photos],
  );
  const card = theme.layout === "card";
  const bento = theme.layout === "bento";

  useEffect(() => {
    document.documentElement.lang = s.language;
  }, [s.language]);

  // Fitur "sudah dibuka": dicatat dari browser (bukan saat render server) supaya
  // pratinjau tautan WhatsApp tidak dihitung sebagai tamu membuka undangan.
  useEffect(() => {
    if (mode !== "public" || !guest.code) return;
    const key = `opened:${guest.code}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* storage tidak tersedia */
    }
    const t = setTimeout(() => {
      fetch("/api/open", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: guest.code }), keepalive: true }).catch(() => undefined);
    }, 1500);
    return () => clearTimeout(t);
  }, [mode, guest.code]);

  // Kunci scroll sampai undangan dibuka.
  useEffect(() => {
    const root = document.documentElement;
    if (!opened && cover) {
      root.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      root.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      root.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [opened, cover]);

  const open = useCallback(() => {
    window.scrollTo({ top: 0 });
    setOpened(true);
    music.current?.start();
  }, []);

  const showContent = opened || !cover;

  return (
    <InvitationContext.Provider value={ctx}>
      <MotionConfig reducedMotion="user">
        <div data-layout={theme.layout} className={card ? "min-h-[100dvh] bg-secondary font-body text-ink md:py-10" : "min-h-[100dvh] bg-bg font-body text-ink"} style={bento ? { ...themeStyle(theme), backgroundColor: bentoCanvas(theme) } : themeStyle(theme)}>
          <AnimatePresence>{!showContent && cover && <Cover key="cover" section={cover} onOpen={open} />}</AnimatePresence>

          <main
            id="main"
            aria-hidden={!showContent}
            inert={!showContent || undefined}
            className={cn(
              card && "mx-auto w-full max-w-[460px] overflow-hidden bg-bg md:rounded-[calc(var(--radius)+14px)] md:shadow-[0_24px_60px_rgb(0_0_0/0.12)]",
              // Bento: tiap section menjadi ubin membulat dengan celah di antaranya.
              bento && "mx-auto grid w-full max-w-[1360px] gap-3 px-3 pt-3 sm:gap-4 sm:px-5 sm:pt-5",
              // Ruang untuk navigasi bawah, kecuali bila section penutup (yang sudah berpadding) ada di akhir.
              visible[visible.length - 1]?.key !== "closing" ? "pb-24" : bento && "pb-3 sm:pb-5",
            )}
          >
            {visible.map((section) => renderSection(section, folios[section.id], saveTheDateHref))}
          </main>

          {showContent && <BottomNav sections={visible} />}
          {musicFile && <MusicPlayer ref={music} src={musicFile.url} cachedSrc={mode === "public" && /^https?:\/\//.test(musicFile.url) ? `/api/media/music/${musicFile.id}` : undefined} volume={s.music_volume} />}
        </div>
      </MotionConfig>
    </InvitationContext.Provider>
  );
}
