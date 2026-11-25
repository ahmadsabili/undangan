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
    case "deco":
      return (
        <svg {...common} aria-label="Sketsa Art Deco Mewah">
          <rect width="160" height="100" fill={c.background} />
          <rect x="22" y="5" width="116" height="90" fill="none" stroke={c.accent} />
          <path d="M22 17 V5 H34 M26 17 V9 H34 M138 17 V5 H126 M134 17 V9 H126 M22 83 V95 H34 M138 83 V95 H126" fill="none" stroke={c.accent} />
          {[-50, -25, 0, 25, 50].map((r) => (
            <line key={r} x1="80" y1="24" x2={80 + Math.sin((r * Math.PI) / 180) * 12} y2={24 - Math.cos((r * Math.PI) / 180) * 12} stroke={c.accent} />
          ))}
          <rect x="52" y="28" width="56" height="5" rx="1" fill={c.text} opacity="0.85" />
          {line(64, 37, 32, 0.4)}
          <path d="M66 90 V54 H70 V50 H76 V47 H84 V50 H90 V54 H94 V90 Z" fill={c.secondary} stroke={c.accent} />
        </svg>
      );
    case "arch":
      return (
        <svg {...common} aria-label="Sketsa Lengkung Modern">
          <rect width="160" height="100" fill={c.background} />
          <path d="M64 64 V30 A16 16 0 0 1 96 30 V64 Z" fill="none" stroke={c.accent} transform="translate(3 3)" />
          <path d="M64 64 V30 A16 16 0 0 1 96 30 V64 Z" fill={c.secondary} />
          <rect x="56" y="70" width="48" height="7" rx="2" fill={c.text} opacity="0.85" />
          <rect x="62" y="82" width="36" height="8" rx="4" fill="none" stroke={c.text} opacity="0.5" />
          <path d="M12 92 V70 A10 10 0 0 1 32 70 V92 Z M128 92 V70 A10 10 0 0 1 148 70 V92 Z" fill="none" stroke={c.accent} opacity="0.6" />
        </svg>
      );
    case "bento":
      return (
        <svg {...common} aria-label="Sketsa Bento Modern">
          <rect width="160" height="100" fill={c.secondary} />
          <rect x="6" y="6" width="84" height="88" rx="8" fill={c.background} />
          <rect x="6" y="6" width="84" height="88" rx="8" fill={c.primary} opacity="0.22" />
          <rect x="95" y="6" width="59" height="56" rx="8" fill={c.primary} />
          <rect x="101" y="30" width="34" height="6" rx="2" fill={c.background} opacity="0.9" />
          <rect x="101" y="40" width="26" height="6" rx="2" fill={c.background} opacity="0.9" />
          <rect x="95" y="67" width="34" height="27" rx="8" fill={c.background} />
          {line(100, 78, 22, 0.7)}
          <rect x="134" y="67" width="20" height="27" rx="8" fill={c.background} />
          <rect x="140" y="77" width="8" height="8" transform="rotate(45 144 81)" fill="none" stroke={c.accent} />
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
