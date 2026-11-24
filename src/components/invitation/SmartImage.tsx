import Image from "next/image";
import type { MediaAsset } from "@/types/invitation";
import { cn } from "@/lib/utils";

// next/image dengan posisi fokus dari media library.
// Placeholder SVG lokal tidak dioptimasi (tidak perlu), foto Supabase dioptimasi ke AVIF/WebP.
export function SmartImage({
  media,
  sizes,
  priority = false,
  className,
  fill = true,
  alt,
}: {
  media: MediaAsset;
  sizes: string;
  priority?: boolean;
  className?: string;
  fill?: boolean;
  alt?: string;
}) {
  const isSvg = media.mime_type === "image/svg+xml" || media.url.endsWith(".svg");
  const style = { objectPosition: `${media.focal_x}% ${media.focal_y}%` };
  const text = alt ?? media.alt ?? "";
  const common = {
    src: media.url,
    sizes,
    priority,
    unoptimized: isSvg,
    className: cn("object-cover", className),
    style,
    ...(priority ? { fetchPriority: "high" as const } : {}),
  };
  if (fill) return <Image {...common} alt={text} fill />;
  return <Image {...common} alt={text} width={media.width ?? 1200} height={media.height ?? 800} />;
}
