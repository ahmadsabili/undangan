"use client";

import { getMedia } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { Section } from "@/types/invitation";
import { useInvitation } from "../context";
import { Reveal } from "../Reveal";
import { SectionFrame } from "../SectionFrame";
import { SmartImage } from "../SmartImage";

// Timeline vertikal: garis rambut di tengah (desktop) atau kiri (ponsel),
// tahapan bergantian sisi agar cerita terbaca seperti halaman majalah.
export function Story({ section, folio }: { section: Section; folio: number }) {
  const { data } = useInvitation();
  if (!data.stories.length) return null;
  return (
    <SectionFrame section={section} folio={folio}>
      <ol className="relative mx-auto max-w-4xl">
        <span aria-hidden="true" className="absolute bottom-0 left-[7px] top-0 w-px md:left-1/2" style={{ background: "rgb(var(--c-accent) / 0.55)" }} />
        {data.stories.map((st, i) => {
          const photo = getMedia(data, st.media_id);
          const right = i % 2 === 1;
          return (
            <li key={st.id} className="relative pb-16 pl-10 last:pb-0 md:grid md:grid-cols-2 md:gap-16 md:pl-0">
              <span aria-hidden="true" className="absolute left-0 top-2 h-[15px] w-[15px] rotate-45 border md:left-1/2 md:-translate-x-1/2" style={{ borderColor: "rgb(var(--c-accent))", background: "rgb(var(--tone-ink) / 0.06)" }} />
              <Reveal className={cn("md:text-right", right && "md:col-start-2 md:text-left")}>
                <p className="font-body text-xs font-medium tracking-[0.18em]" style={{ color: "rgb(var(--tone-accent))" }}>
                  {st.date_label}
                </p>
                <h3 className="mt-2 font-heading text-3xl leading-tight sm:text-4xl">{st.title}</h3>
                {st.description && (
                  <p className={cn("mt-3 max-w-md font-body leading-relaxed", !right && "md:ml-auto")} style={{ color: "rgb(var(--tone-muted))" }}>
                    {st.description}
                  </p>
                )}
                {photo && (
                  <div className={cn("relative mt-6 aspect-[4/3] w-full max-w-sm overflow-hidden", !right && "md:ml-auto")} style={{ borderRadius: "var(--radius)" }}>
                    <SmartImage media={photo} sizes="(min-width: 768px) 384px, 80vw" />
                  </div>
                )}
              </Reveal>
            </li>
          );
        })}
      </ol>
    </SectionFrame>
  );
}
