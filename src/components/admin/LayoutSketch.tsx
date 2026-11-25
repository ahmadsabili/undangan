import type { LayoutKey, ThemeTokens } from "@/types/invitation";

// Sketsa wireframe kecil tiap template, memakai warna tema aktif.
export function LayoutSketch({ layout, colors }: { layout: LayoutKey; colors: ThemeTokens["colors"] }) {
  const c = colors;
  const line = (x: number, y: number, w: number, o = 0.5) => <rect x={x} y={y} width={w} height="3" rx="1.5" fill={c.text} opacity={o} />;
  const common = { viewBox: "0 0 160 100", className: "h-auto w-full rounded", role: "img" as const };
  switch (layout) {
    case "classic":
      return (
        <svg {...common} aria-label="Sketsa Klasik Simetris">
          <rect width="160" height="100" fill={c.background} />
          <rect x="28" y="6" width="104" height="88" fill="none" stroke={c.accent} />
          <rect x="31" y="9" width="98" height="82" fill="none" stroke={c.accent} opacity="0.5" />
          <rect x="70" y="14" width="20" height="12" rx="1" fill={c.primary} opacity="0.25" />
          {line(55, 32, 50, 0.8)}
          <ellipse cx="80" cy="60" rx="14" ry="18" fill={c.secondary} stroke={c.accent} />
          {line(62, 84, 36)}
        </svg>
      );
    case "cinematic":
      return (
        <svg {...common} aria-label="Sketsa Sinematik Foto Penuh">
          <rect width="160" height="100" fill={c.primary} />
          <rect width="160" height="100" fill={c.secondary} opacity="0.35" />
          <rect y="55" width="160" height="45" fill={c.primary} opacity="0.7" />
          <rect x="12" y="62" width="96" height="9" rx="2" fill={c.background} opacity="0.9" />
          <rect x="12" y="76" width="40" height="3" rx="1.5" fill={c.background} opacity="0.6" />
          <rect x="118" y="74" width="30" height="9" rx="1" fill={c.background} />
        </svg>
      );
    case "card":
      return (
        <svg {...common} aria-label="Sketsa Kartu Minimal">
          <rect width="160" height="100" fill={c.secondary} />
          <rect x="56" y="6" width="48" height="88" rx="5" fill={c.background} />
          <rect x="56" y="6" width="48" height="36" rx="5" fill={c.primary} opacity="0.3" />
          {line(61, 48, 30, 0.8)}
          {line(61, 55, 22)}
          <rect x="61" y="63" width="38" height="7" rx="1" fill={c.primary} />
          {line(61, 76, 34, 0.3)}
          {line(61, 82, 26, 0.3)}
        </svg>
      );
    case "nusantara":
      return (
        <svg {...common} aria-label="Sketsa Tradisional Nusantara">
          <rect width="160" height="100" fill={c.background} />
          {Array.from({ length: 16 }, (_, i) => (
            <g key={i}>
              <ellipse cx={5 + i * 10} cy="4" rx="3" ry="1.6" fill="none" stroke={c.accent} />
              <ellipse cx={5 + i * 10} cy="96" rx="3" ry="1.6" fill="none" stroke={c.accent} />
            </g>
          ))}
          <path d="M34 26 V16 H44 M126 16 H116 M126 16 V26 M34 74 V84 H44 M126 84 H116 M126 84 V74" fill="none" stroke={c.accent} />
          <circle cx="80" cy="24" r="4" fill="none" stroke={c.accent} />
          {line(58, 34, 44, 0.8)}
          <ellipse cx="80" cy="60" rx="13" ry="16" fill={c.secondary} stroke={c.accent} />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-label="Sketsa Editorial">
          <rect width="160" height="100" fill={c.background} />
          <rect x="10" y="20" width="56" height="10" rx="2" fill={c.text} opacity="0.85" />
          <rect x="18" y="34" width="20" height="8" rx="2" fill={c.accent} />
          <rect x="10" y="46" width="52" height="10" rx="2" fill={c.text} opacity="0.85" />
          {line(10, 64, 40)}
          <rect x="10" y="74" width="30" height="8" rx="1" fill={c.primary} />
          <rect x="86" y="14" width="62" height="76" fill="none" stroke={c.accent} />
          <rect x="82" y="10" width="62" height="76" fill={c.secondary} />
        </svg>
      );
  }
}
