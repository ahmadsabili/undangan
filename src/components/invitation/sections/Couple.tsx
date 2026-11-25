"use client";

import { FaInstagram as Instagram } from "react-icons/fa6";
import { getMedia } from "@/lib/media";
import { cn } from "@/lib/utils";
import { orderedCouple } from "@/services/normalize";
import type { Person, Section } from "@/types/invitation";
import { useInvitation } from "../context";
import { Reveal } from "../Reveal";
import { SectionFrame } from "../SectionFrame";
import { SmartImage } from "../SmartImage";
import { ArchWindow, DecoWindow, useLayout } from "../layout";

function Profile({ person, offset }: { person: Person; offset?: boolean }) {
  const { data, t } = useInvitation();
  const { layout } = useLayout();
  const card = layout === "card";
  const photo = getMedia(data, person.photo_id);
  const ig = person.instagram.replace(/^@/, "").trim();
  return (
    <div className={cn("text-center", offset && layout === "editorial" && "md:mt-28")}>
      {photo && (layout === "deco" || layout === "arch") ? (
        <Reveal variant="image">
          {layout === "deco" ? (
            <DecoWindow className="mx-auto aspect-[3/4] w-[62%] max-w-[260px]">
              <SmartImage media={photo} sizes="(min-width: 768px) 260px, 62vw" alt={photo.alt || person.full_name} />
            </DecoWindow>
          ) : (
            <ArchWindow className="mx-auto aspect-[3/4] w-[66%] max-w-[280px]">
              <SmartImage media={photo} sizes="(min-width: 768px) 280px, 66vw" alt={photo.alt || person.full_name} />
            </ArchWindow>
          )}
        </Reveal>
      ) : photo && (
        <Reveal variant="image">
          <div
            className={cn(
              "relative mx-auto overflow-hidden border",
              layout === "editorial" && "aspect-[3/4] w-[68%] max-w-[300px] rounded-t-full",
              (layout === "classic" || layout === "nusantara") && "aspect-[3/4] w-[62%] max-w-[260px] rounded-[50%] border-[3px] border-double",
              layout === "cinematic" && "aspect-square w-[56%] max-w-[240px] rounded-full border-2",
              card && "aspect-square w-[88%] rounded-full",
              layout === "bento" && "aspect-[4/5] w-[78%] max-w-[320px] border-0",
            )}
            style={{ borderColor: "rgb(var(--c-accent) / 0.7)", borderRadius: layout === "bento" ? "calc(var(--radius) + 18px)" : undefined }}
          >
            <SmartImage media={photo} sizes={card ? "200px" : "(min-width: 768px) 300px, 68vw"} alt={photo.alt || person.full_name} />
          </div>
        </Reveal>
      )}
      <Reveal delay={0.1}>
        <h3 className={cn("mt-8 font-heading leading-tight", card ? "mt-5 text-[1.45rem]" : layout === "deco" ? "mt-10 text-[1.55rem] uppercase tracking-[0.1em] sm:text-3xl" : "text-[2rem] sm:text-4xl")}>{person.full_name}</h3>
      </Reveal>
      {(person.parent_label || person.parents) && (
        <Reveal delay={0.16}>
          <p className="mx-auto mt-4 max-w-xs font-body text-[0.95rem] leading-relaxed" style={{ color: "rgb(var(--tone-muted))" }}>
            {person.parent_label && <span className="block text-xs tracking-[0.14em]">{person.parent_label}</span>}
            {person.parents}
          </p>
        </Reveal>
      )}
      {person.bio && (
        <Reveal delay={0.2}>
          <p className="mx-auto mt-4 max-w-xs font-body text-sm leading-relaxed">{person.bio}</p>
        </Reveal>
      )}
      {ig && (
        <Reveal delay={0.24}>
          <a
            href={`https://instagram.com/${encodeURIComponent(ig)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inv-btn mt-4"
            data-variant="ghost"
            aria-label={`${t.instagram} ${person.full_name}`}
          >
            <Instagram className="h-4 w-4" aria-hidden="true" />@{ig}
          </a>
        </Reveal>
      )}
    </div>
  );
}

export function Couple({ section, folio }: { section: Section<{ connector?: string }>; folio: number }) {
  const { data } = useInvitation();
  const [p1, p2] = orderedCouple(data.settings.couple);
  const { layout } = useLayout();
  const card = layout === "card";
  return (
    <SectionFrame section={section} folio={folio}>
      <div
        className={cn(
          "mx-auto grid max-w-5xl items-start",
          card ? "grid-cols-[1fr_auto_1fr] gap-2" : "gap-10 md:grid-cols-[1fr_auto_1fr] md:gap-6",
          ["classic", "nusantara", "deco", "arch"].includes(layout) ? "md:items-center" : "",
        )}
      >
        <Profile person={p1} />
        <Reveal variant="fade" className={cn("flex justify-center", card ? "pt-16" : layout === "editorial" ? "md:pt-48" : "")}>
          <span aria-hidden="true" className={cn("font-heading italic leading-none", card ? "text-5xl" : "text-8xl sm:text-9xl")} style={{ color: "rgb(var(--tone-accent))" }}>
            {section.content.connector || "&"}
          </span>
        </Reveal>
        <Profile person={p2} offset />
      </div>
    </SectionFrame>
  );
}
