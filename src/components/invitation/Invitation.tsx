"use client";

import { AnimatePresence, MotionConfig } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMedia } from "@/lib/media";
import { motionScale, themeStyle } from "@/lib/theme";
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

  const ctx = useMemo(
    () => ({ data, guest, mode, t: DICT[s.language] ?? DICT.id, motion: motionScale(theme.animation) }),
    [data, guest, mode, s.language, theme.animation],
  );

  useEffect(() => {
    document.documentElement.lang = s.language;
  }, [s.language]);

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
        <div className="min-h-[100dvh] bg-bg font-body text-ink" style={themeStyle(theme)}>
          <AnimatePresence>{!showContent && cover && <Cover key="cover" section={cover} onOpen={open} />}</AnimatePresence>

          <main id="main" aria-hidden={!showContent} inert={!showContent || undefined} className="pb-24">
            {visible.map((section) => renderSection(section, folios[section.id], saveTheDateHref))}
          </main>

          {showContent && <BottomNav sections={visible} />}
          {musicFile && <MusicPlayer ref={music} src={musicFile.url} volume={s.music_volume} />}
        </div>
      </MotionConfig>
    </InvitationContext.Provider>
  );
}
