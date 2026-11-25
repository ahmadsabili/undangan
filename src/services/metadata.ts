import type { Metadata, Viewport } from "next";
import { env } from "@/lib/env";
import { formatLongDate } from "@/lib/date";
import { absoluteUrl, getMedia } from "@/lib/media";
import { orderedCouple } from "@/services/normalize";
import type { InvitationData } from "@/types/invitation";

// Metadata share WhatsApp: foto pasangan, nama, tanggal. Tidak pernah memuat nama tamu.
export function invitationMetadata(data: InvitationData): Metadata {
  const s = data.settings;
  const [p1, p2] = orderedCouple(s.couple);
  const title = s.site_title || `The Wedding of ${p1.nickname} & ${p2.nickname}`;
  const date = formatLongDate(s.wedding_date, s.timezone, s.language);
  const description = s.meta_description ? `${date}. ${s.meta_description}` : date;
  // Gambar share custom dari admin diutamakan. Selain itu kartu otomatis yang mengikuti
  // desain undangan; ?v= berubah tiap Publish supaya WhatsApp mengambil gambar baru.
  // Keduanya disajikan /api/og sebagai JPEG 1200 x 630 (unggahan admin berformat WebP).
  const version = encodeURIComponent((data.published_at ?? "").replace(/\D/g, "").slice(0, 14) || "1");
  const image = { url: absoluteUrl(`/api/og?v=${version}`, env.siteUrl), width: 1200, height: 630, alt: title, type: "image/jpeg" };
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
