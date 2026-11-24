"use client";

import { AtSign as Instagram } from "lucide-react";
import { getMedia } from "@/lib/media";
import { cn } from "@/lib/utils";
import { orderedCouple } from "@/services/normalize";
import type { Person, Section } from "@/types/invitation";
import { useInvitation } from "../context";
import { Reveal } from "../Reveal";
import { SectionFrame } from "../SectionFrame";
import { SmartImage } from "../SmartImage";

function Profile({ person, offset }: { person: Person; offset?: boolean }) {
  const { data, t } = useInvitation();
  const photo = getMedia(data, person.photo_id);
  const ig = person.instagram.replace(/^@/, "").trim();
  return (
    <div className={cn("text-center", offset && "md:mt-28")}>
      {photo && (
        <Reveal variant="image">
          <div className="relative mx-auto aspect-[3/4] w-[68%] max-w-[300px] overflow-hidden rounded-t-full border" style={{ borderColor: "rgb(var(--c-accent) / 0.5)" }}>
            <SmartImage media={photo} sizes="(min-width: 768px) 300px, 68vw" alt={photo.alt || person.full_name} />
          </div>
        </Reveal>
      )}
      <Reveal delay={0.1}>
        <h3 className="mt-8 font-heading text-[2rem] leading-tight sm:text-4xl">{person.full_name}</h3>
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
  return (
    <SectionFrame section={section} folio={folio}>
      <div className="mx-auto grid max-w-5xl items-start gap-10 md:grid-cols-[1fr_auto_1fr] md:gap-6">
        <Profile person={p1} />
        <Reveal variant="fade" className="flex justify-center md:pt-48">
          <span aria-hidden="true" className="font-heading text-8xl italic leading-none sm:text-9xl" style={{ color: "rgb(var(--tone-accent))" }}>
            {section.content.connector || "&"}
          </span>
        </Reveal>
        <Profile person={p2} offset />
      </div>
    </SectionFrame>
  );
}
