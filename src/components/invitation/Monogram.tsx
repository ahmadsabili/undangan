"use client";

import { initialsFrom, cn } from "@/lib/utils";
import { getMedia } from "@/lib/media";
import { useInvitation } from "./context";

// Monogram: inisial dalam bingkai garis rambut ganda. Bisa diganti logo PNG/SVG dari dashboard.
export function Monogram({ size = 92, className, tone = "currentColor" }: { size?: number; className?: string; tone?: string }) {
  const { data } = useInvitation();
  const s = data.settings;
  const logo = getMedia(data, s.logo_media_id);
  const text = s.monogram_text?.trim() || initialsFrom(s.couple.first.nickname, s.couple.second.nickname);

  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo.url}
        alt={logo.alt || `Monogram ${text}`}
        width={size}
        height={size}
        className={cn("object-contain", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  const [a, b] = text.split(/\s*&\s*/);
  const long = text.length > 7;
  return (
    <div
      role="img"
      aria-label={`Monogram ${text}`}
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, height: size, color: tone }}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <rect x="6" y="6" width="88" height="88" transform="rotate(45 50 50)" fill="none" stroke="currentColor" strokeOpacity="0.55" strokeWidth="0.6" />
        <rect x="11" y="11" width="78" height="78" transform="rotate(45 50 50)" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.4" />
      </svg>
      {long || !b ? (
        <span className="relative px-3 text-center font-heading leading-none" style={{ fontSize: size * (long ? 0.14 : 0.3) }}>
          {text}
        </span>
      ) : (
        <span className="relative flex items-baseline font-heading leading-none" style={{ fontSize: size * 0.32 }}>
          <span>{a}</span>
          <span className="mx-[0.1em] italic" style={{ fontSize: "0.7em", opacity: 0.85 }}>&amp;</span>
          <span>{b}</span>
        </span>
      )}
    </div>
  );
}
