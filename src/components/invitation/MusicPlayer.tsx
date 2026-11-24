"use client";

import { Disc3, Pause } from "lucide-react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useInvitation } from "./context";

export interface MusicHandle {
  start: () => void;
}

const PREF = "music-pref"; // "on" | "off", dipertahankan selama sesi

export const MusicPlayer = forwardRef<MusicHandle, { src: string; volume: number }>(function MusicPlayer({ src, volume }, ref) {
  const { t } = useInvitation();
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  async function play() {
    const a = audio.current;
    if (!a) return;
    a.volume = Math.min(Math.max(volume, 0), 1);
    try {
      await a.play();
      setPlaying(true);
    } catch {
      setPlaying(false); // browser menolak autoplay; tombol tetap bisa dipakai
    }
  }

  useImperativeHandle(ref, () => ({
    start: () => {
      let pref: string | null = null;
      try {
        pref = sessionStorage.getItem(PREF);
      } catch {}
      if (pref !== "off") void play();
    },
  }));

  function toggle() {
    const a = audio.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
      try {
        sessionStorage.setItem(PREF, "off");
      } catch {}
    } else {
      void play();
      try {
        sessionStorage.setItem(PREF, "on");
      } catch {}
    }
  }

  return (
    <>
      <audio ref={audio} src={src} loop preload="none" onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? t.pause : t.play}
        aria-pressed={playing}
        className="fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-40 grid h-12 w-12 place-items-center rounded-full border shadow-[0_6px_20px_rgb(0_0_0/0.12)] transition-transform active:scale-95"
        style={{ background: "rgb(var(--c-surface) / 0.94)", borderColor: "rgb(var(--c-accent) / 0.45)", color: "rgb(var(--c-primary))" }}
      >
        {playing ? (
          <span className="relative grid place-items-center">
            <Disc3 className="h-6 w-6 motion-safe:animate-[spin_4s_linear_infinite]" strokeWidth={1.4} aria-hidden="true" />
          </span>
        ) : (
          <span className="relative grid place-items-center">
            <Disc3 className="h-6 w-6 opacity-60" strokeWidth={1.4} aria-hidden="true" />
            <Pause className="absolute h-3 w-3" aria-hidden="true" />
          </span>
        )}
      </button>
    </>
  );
});
