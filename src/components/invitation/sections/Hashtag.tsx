"use client";

import { AtSign as Instagram } from "lucide-react";
import type { Section } from "@/types/invitation";
import { useInvitation } from "../context";
import { CopyButton } from "../CopyButton";
import { InvLink } from "../InvButton";
import { Reveal } from "../Reveal";
import { SectionFrame } from "../SectionFrame";
import { useLayout } from "../layout";

export function Hashtag({ section, folio }: { section: Section<{ hashtag?: string; instagram_url?: string }>; folio: number }) {
  const { t } = useInvitation();
  const { wide } = useLayout();
  const tag = section.content.hashtag?.trim();
  if (!tag) return null;
  const ig = section.content.instagram_url && /^https:\/\//.test(section.content.instagram_url) ? section.content.instagram_url : null;
  return (
    <SectionFrame section={section} folio={folio}>
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className={`break-words font-heading text-[2.4rem] italic leading-none ${wide("sm:text-7xl")}`}>{tag}</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <CopyButton value={tag} label={t.copyHashtag} copiedLabel={t.copied} variant="solid" />
          {ig && (
            <InvLink href={ig} external variant="outline">
              <Instagram className="h-4 w-4" aria-hidden="true" />
              {t.instagram}
            </InvLink>
          )}
        </div>
      </Reveal>
    </SectionFrame>
  );
}
