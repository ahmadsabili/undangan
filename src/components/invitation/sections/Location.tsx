"use client";

import { Navigation } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { mapsEmbedUrl, mapsSearchUrl } from "@/lib/calendar";
import { getMedia } from "@/lib/media";
import type { Section } from "@/types/invitation";
import { useInvitation } from "../context";
import { InvLink } from "../InvButton";
import { Reveal } from "../Reveal";
import { SectionFrame } from "../SectionFrame";
import { SmartImage } from "../SmartImage";

type Content = {
  venue_name?: string;
  address?: string;
  maps_url?: string;
  show_map?: boolean;
  parking?: string;
  access?: string;
  media_id?: string;
};

function LazyMap({ query, title }: { query: string; title: string }) {
  const { t } = useInvitation();
  const ref = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="relative mt-12 aspect-[4/3] w-full overflow-hidden sm:aspect-[16/7]" style={{ borderRadius: "var(--radius)", background: "rgb(var(--c-secondary) / 0.5)" }}>
      {load ? (
        <iframe
          title={title}
          src={mapsEmbedUrl(query)}
          width="1200"
          height="525"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full border-0 grayscale-[35%]"
        />
      ) : (
        <p className="absolute inset-0 grid place-items-center font-body text-sm" style={{ color: "rgb(var(--c-text))" }}>
          {t.showMap}
        </p>
      )}
    </div>
  );
}

export function Location({ section, folio }: { section: Section<Content>; folio: number }) {
  const { data, t } = useInvitation();
  const c = section.content;
  const photo = getMedia(data, c.media_id);
  const query = [c.venue_name, c.address].filter(Boolean).join(", ");
  const href = c.maps_url || mapsSearchUrl(query);
  const details = [
    [t.parking, c.parking],
    [t.access, c.access],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <SectionFrame section={section} folio={folio}>
      <div className="mx-auto max-w-5xl">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          {photo && (
            <Reveal variant="image">
              <div className="relative aspect-[4/3] overflow-hidden" style={{ borderRadius: "var(--radius)" }}>
                <SmartImage media={photo} sizes="(min-width: 768px) 480px, 100vw" />
              </div>
            </Reveal>
          )}
          <div className={photo ? "text-left" : "mx-auto max-w-xl text-center md:col-span-2"}>
            <Reveal>
              <h3 className="font-heading text-4xl leading-tight sm:text-5xl">{c.venue_name}</h3>
            </Reveal>
            {c.address && (
              <Reveal delay={0.08}>
                <p className="mt-5 whitespace-pre-line font-body leading-relaxed" style={{ color: "rgb(var(--tone-muted))" }}>
                  {c.address}
                </p>
              </Reveal>
            )}
            {query && (
              <Reveal delay={0.14}>
                <InvLink href={href} external className="mt-8">
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                  {t.directions}
                </InvLink>
              </Reveal>
            )}
            {details.length > 0 && (
              <dl className="mt-10 space-y-5 border-t pt-8" style={{ borderColor: "rgb(var(--c-accent) / 0.45)" }}>
                {details.map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-body text-xs font-medium tracking-[0.16em]" style={{ color: "rgb(var(--tone-accent))" }}>
                      {k}
                    </dt>
                    <dd className="mt-1 whitespace-pre-line font-body text-[0.95rem] leading-relaxed">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
        {c.show_map && query && <LazyMap query={query} title={`Peta ${c.venue_name ?? ""}`} />}
      </div>
    </SectionFrame>
  );
}
