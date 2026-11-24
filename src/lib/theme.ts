import type { CSSProperties } from "react";
import type { SectionBackground, ThemeTokens } from "@/types/invitation";

export const DEFAULT_THEME: ThemeTokens = {
  colors: {
    primary: "#454B40",
    secondary: "#E7D8C5",
    accent: "#B49A73",
    background: "#FAF8F3",
    surface: "#FFFFFF",
    text: "#292929",
  },
  fonts: { heading: "Cormorant Garamond", body: "DM Sans", accent: "Pinyon Script" },
  fontScale: 1,
  radius: 2,
  buttonStyle: "solid",
  navStyle: "floating",
  animation: "normal",
  overlay: 0.42,
};

export function normalizeTheme(t: Partial<ThemeTokens> | null | undefined): ThemeTokens {
  const src = t ?? {};
  return {
    ...DEFAULT_THEME,
    ...src,
    colors: { ...DEFAULT_THEME.colors, ...(src.colors ?? {}) },
    fonts: { ...DEFAULT_THEME.fonts, ...(src.fonts ?? {}) },
  };
}

// ---------- warna ----------
type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = ([r, g, b]: RGB) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

function luminance([r, g, b]: RGB) {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(a: string, b: string) {
  const la = luminance(hexToRgb(a));
  const lb = luminance(hexToRgb(b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Geser warna menuju `toward` sampai kontras terhadap `against` >= target. */
export function ensureContrast(color: string, against: string, target = 4.5, toward?: string) {
  if (contrastRatio(color, against) >= target) return color;
  const goal = hexToRgb(toward ?? (luminance(hexToRgb(against)) > 0.4 ? "#000000" : "#FFFFFF"));
  const base = hexToRgb(color);
  for (let t = 0.05; t <= 1; t += 0.05) {
    const c = toHex(mix(base, goal, t));
    if (contrastRatio(c, against) >= target) return c;
  }
  return toHex(goal);
}

const rgbVar = (hex: string) => hexToRgb(hex).join(" ");

export interface ToneSet {
  bg: string;
  ink: string;
  muted: string;
  accentInk: string;
  rule: string;
}

/** Warna teks yang terbaca untuk setiap pilihan latar section. */
export function toneFor(theme: ThemeTokens, bg: SectionBackground): ToneSet {
  const c = theme.colors;
  const bgHex = bg === "primary" ? c.primary : bg === "secondary" ? c.secondary : bg === "surface" ? c.surface : c.background;
  const ink = bg === "primary" ? ensureContrast(c.background, bgHex, 7) : ensureContrast(c.text, bgHex, 7);
  const muted = ensureContrast(toHex(mix(hexToRgb(ink), hexToRgb(bgHex), 0.3)), bgHex, 4.6, ink);
  const accentInk = ensureContrast(c.accent, bgHex, 4.5, bg === "primary" ? "#FFFFFF" : c.text);
  return { bg: bgHex, ink, muted, accentInk, rule: c.accent };
}

export function themeStyle(theme: ThemeTokens): CSSProperties {
  const c = theme.colors;
  const onPrimary = ensureContrast(c.background, c.primary, 4.5);
  const accentInk = ensureContrast(c.accent, c.background, 4.5, c.text);
  const vars: Record<string, string> = {
    "--c-primary": rgbVar(c.primary),
    "--c-secondary": rgbVar(c.secondary),
    "--c-accent": rgbVar(c.accent),
    "--c-background": rgbVar(c.background),
    "--c-surface": rgbVar(c.surface),
    "--c-text": rgbVar(c.text),
    "--c-on-primary": rgbVar(onPrimary),
    "--c-accent-ink": rgbVar(accentInk),
    "--font-heading": `"${theme.fonts.heading}"`,
    "--font-body": `"${theme.fonts.body}"`,
    "--font-accent": `"${theme.fonts.accent}"`,
    "--font-scale": String(theme.fontScale || 1),
    "--radius": `${theme.radius ?? 2}px`,
    "--overlay": String(theme.overlay ?? 0.42),
  };
  return vars as CSSProperties;
}

/** Durasi & jarak animasi menurut intensitas tema. */
export function motionScale(level: ThemeTokens["animation"]) {
  switch (level) {
    case "none":
      return { distance: 0, duration: 0, enabled: false };
    case "subtle":
      return { distance: 12, duration: 0.7, enabled: true };
    case "expressive":
      return { distance: 36, duration: 1.2, enabled: true };
    default:
      return { distance: 22, duration: 0.95, enabled: true };
  }
}

export function contrastWarnings(theme: ThemeTokens) {
  const c = theme.colors;
  const checks: { label: string; ratio: number; min: number }[] = [
    { label: "Teks di atas latar", ratio: contrastRatio(c.text, c.background), min: 4.5 },
    { label: "Teks di atas surface", ratio: contrastRatio(c.text, c.surface), min: 4.5 },
    { label: "Teks di atas secondary", ratio: contrastRatio(c.text, c.secondary), min: 4.5 },
    { label: "Latar di atas primary (teks terang)", ratio: contrastRatio(c.background, c.primary), min: 4.5 },
  ];
  return checks.map((x) => ({ ...x, ok: x.ratio >= x.min }));
}
