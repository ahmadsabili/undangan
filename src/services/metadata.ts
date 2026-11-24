import type { Metadata, Viewport } from "next";
import { env } from "@/lib/env";
import { formatLongDate } from "@/lib/date";
import { absoluteUrl, getMedia, isRaster } from "@/lib/media";
import { orderedCouple } from "@/services/normalize";
import type { InvitationData } from "@/types/invitation";

// Metadata share WhatsApp: foto pasangan, nama, tanggal. Tidak pernah memuat nama tamu.
export function invitationMetadata(data: InvitationData): Metadata {
  const s = data.settings;
  const [p1, p2] = orderedCouple(s.couple);
  const title = s.site_title || `The Wedding of ${p1.nickname} & ${p2.nickname}`;
  const date = formatLongDate(s.wedding_date, s.timezone, s.language);
  const description = s.meta_description ? `${date}. ${s.meta_description}` : date;
  const cover = data.sections.find((x) => x.key === "cover")?.content as { media_id?: string } | undefined;
  const hero = data.sections.find((x) => x.key === "hero")?.content as { media_id?: string } | undefined;
  const candidates = [getMedia(data, s.og_media_id), getMedia(data, cover?.media_id), getMedia(data, hero?.media_id)];
  const photo = candidates.find(isRaster);
  const image = photo
    ? { url: absoluteUrl(photo.url, env.siteUrl), width: photo.width ?? 1200, height: photo.height ?? 630, alt: title }
    : { url: absoluteUrl("/api/og", env.siteUrl), width: 1200, height: 630, alt: title };
  const favicon = getMedia(data, s.favicon_media_id);

  return {
    metadataBase: new URL(env.siteUrl),
    title,
    description,
    applicationName: s.site_name,
    robots: s.noindex ? { index: false, follow: false, googleBot: { index: false, follow: false } } : { index: true, follow: true },
    openGraph: { type: "website", title, description, siteName: s.site_name, images: [image], locale: s.language === "en" ? "en_US" : "id_ID" },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
    icons: favicon ? { icon: favicon.url, apple: favicon.url } : undefined,
  };
}

export function invitationViewport(data: InvitationData | null): Viewport {
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: data?.settings.theme.colors.primary ?? "#454B40",
  };
}
