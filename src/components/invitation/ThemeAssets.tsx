import { googleFontsHref } from "@/config/fonts";
import type { InvitationData } from "@/types/invitation";

// Stylesheet font tema + skala ukuran huruf. Di-render dari server component.
export function ThemeAssets({ data }: { data: InvitationData }) {
  const t = data.settings.theme;
  const quote = data.sections.find((x) => x.key === "quote");
  const needsArabic = Boolean(quote?.enabled && (quote.content as { type?: string; arabic?: string }).type === "quran");
  const href = googleFontsHref([t.fonts.heading, t.fonts.body, t.fonts.accent], needsArabic ? ["Amiri"] : []);
  const scale = Math.min(Math.max(Number(t.fontScale) || 1, 0.85), 1.2);
  return (
    <>
      <link rel="stylesheet" href={href} precedence="default" />
      <style precedence="default" href="theme-scale">{`html{font-size:${(scale * 100).toFixed(1)}%}`}</style>
    </>
  );
}
