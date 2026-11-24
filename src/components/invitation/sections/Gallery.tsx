"use client";

import { Play } from "lucide-react";
import { useState } from "react";
import { getMedia, youtubeId } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { MediaAsset, Section } from "@/types/invitation";
import { useInvitation } from "../context";
import { Lightbox } from "../Lightbox";
import { Reveal } from "../Reveal";
import { SectionFrame } from "../SectionFrame";
import { SmartImage } from "../SmartImage";

type Content = { video_type?: "none" | "youtube" | "upload"; youtube_url?: string; video_media_id?: string; video_poster_id?: string };

function Video({ c }: { c: Content }) {
  const { data, t } = useInvitation();
  const [play, setPlay] = useState(false);
  const poster = getMedia(data, c.video_poster_id);
  if (c.video_type === "upload") {
    const file = getMedia(data, c.video_media_id);
    if (!file) return null;
    return (
      <video controls preload="none" poster={poster?.url} width={file.width ?? 1280} height={file.height ?? 720} className="aspect-video w-full bg-black" style={{ borderRadius: "var(--radius)" }}>
        <source src={file.url} type={file.mime_type ?? "video/mp4"} />
      </video>
    );
  }
  const id = c.video_type === "youtube" && c.youtube_url ? youtubeId(c.youtube_url) : null;
  if (!id) return null;
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black" style={{ borderRadius: "var(--radius)" }}>
      {play ? (
        <iframe
          title="Video prewedding"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          width="1280"
          height="720"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0 grid place-items-center" aria-label={t.playVideo}>
          {poster ? (
            <SmartImage media={poster} sizes="(min-width: 1024px) 960px, 100vw" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" width={480} height={360} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <span className="relative grid h-16 w-16 place-items-center rounded-full bg-white/90 text-[#1d1d1d] transition-transform duration-300 group-hover:scale-105">
            <Play className="ml-1 h-6 w-6" aria-hidden="true" />
          </span>
        </button>
      )}
    </div>
  );
}

export function Gallery({ section, folio }: { section: Section<Content>; folio: number }) {
  const { data, t } = useInvitation();
  const [open, setOpen] = useState<number | null>(null);
  const items = data.gallery
    .map((g) => ({ ...g, media: getMedia(data, g.media_id) }))
    .filter((g): g is typeof g & { media: MediaAsset } => Boolean(g.media));

  return (
    <SectionFrame section={section} folio={folio} align="left">
      <div className="mx-auto max-w-6xl">
        {items.length === 0 ? (
          <p style={{ color: "rgb(var(--tone-muted))" }}>Foto akan segera ditambahkan.</p>
        ) : (
          <ul className="grid grid-flow-dense grid-cols-2 gap-2 [grid-auto-rows:9.5rem] sm:gap-3 md:grid-cols-4 md:[grid-auto-rows:13rem]">
            {items.map((g, i) => (
              <Reveal
                as="li"
                key={g.id}
                variant="fade"
                delay={(i % 4) * 0.06}
                className={cn(g.layout === "tall" && "row-span-2", g.layout === "wide" && "col-span-2", i === 0 && "md:col-span-2 md:row-span-2")}
              >
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  className="group relative block h-full w-full overflow-hidden"
                  style={{ borderRadius: "var(--radius)" }}
                  aria-label={`${t.photo} ${i + 1}${g.caption ? `: ${g.caption}` : ""}`}
                >
                  <SmartImage media={g.media} sizes="(min-width: 768px) 25vw, 50vw" className="transition-transform duration-700 ease-silk group-hover:scale-[1.03]" />
                </button>
              </Reveal>
            ))}
          </ul>
        )}
        {section.content.video_type && section.content.video_type !== "none" && (
          <Reveal className="mt-10">
            <Video c={section.content} />
          </Reveal>
        )}
      </div>
      <Lightbox items={items.map((g) => ({ media: g.media, caption: g.caption }))} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </SectionFrame>
  );
}
