import type { CSSProperties } from "react";
import type { SectionBackground, ThemeTokens } from "@/types/invitation";

export const DEFAULT_THEME: ThemeTokens = {
  layout: "editorial",
  ornamentMediaId: null,
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
  const layouts = ["editorial", "classic", "cinematic", "card", "nusantara", "deco", "arch", "bento"];
  return {
    ...DEFAULT_THEME,
    ...src,
    layout: layouts.includes(String(src.layout)) ? (src.layout as ThemeTokens["layout"]) : "editorial",
    ornamentMediaId: src.ornamentMediaId ?? null,
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

/** Warna teks dasar di atas primary: latar (tema terang) atau teks (tema gelap), mana yang lebih kontras. */
function baseOnPrimary(c: ThemeTokens["colors"]) {
  return contrastRatio(c.background, c.primary) >= contrastRatio(c.text, c.primary) ? c.background : c.text;
}

/** Warna teks yang terbaca untuk setiap pilihan latar section. */
export function toneFor(theme: ThemeTokens, bg: SectionBackground): ToneSet {
  const c = theme.colors;
  const bgHex = bg === "primary" ? c.primary : bg === "secondary" ? c.secondary : bg === "surface" ? c.surface : c.background;
  const ink = bg === "primary" ? ensureContrast(baseOnPrimary(c), bgHex, 7) : ensureContrast(c.text, bgHex, 7);
  const muted = ensureContrast(toHex(mix(hexToRgb(ink), hexToRgb(bgHex), 0.3)), bgHex, 4.6, ink);
  const accentInk = ensureContrast(c.accent, bgHex, 4.5, bg === "primary" ? "#FFFFFF" : c.text);
  return { bg: bgHex, ink, muted, accentInk, rule: c.accent };
}

export function themeStyle(theme: ThemeTokens): CSSProperties {
  const c = theme.colors;
  const onPrimary = ensureContrast(baseOnPrimary(c), c.primary, 4.5);
  // Aksen lembut di atas primary (ampersand sampul): secondary bila cukup kontras, selain itu aksen.
  const softOnPrimary = contrastRatio(c.secondary, c.primary) >= 3 ? c.secondary : ensureContrast(c.accent, c.primary, 3);
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
    "--c-soft-on-primary": rgbVar(softOnPrimary),
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

/** Latar kanvas Bento: latar utama digeser sedikit ke warna teks agar tiap ubin terlihat. */
export function bentoCanvas(theme: ThemeTokens) {
  const c = theme.colors;
  return toHex(mix(hexToRgb(c.background), hexToRgb(c.text), 0.07));
}

/** Warna tombol solid yang tetap terlihat di latar mana pun, termasuk tema gelap. */
export function buttonColors(theme: ThemeTokens, bgHex: string, onPrimarySection: boolean) {
  const c = theme.colors;
  // Di tema gelap, tombol emas/aksen lebih terbaca dan terasa mewah.
  let bg = luminance(hexToRgb(c.background)) < 0.2 ? c.accent : onPrimarySection ? c.background : c.primary;
  if (contrastRatio(bg, bgHex) < 1.8) bg = c.accent;
  if (contrastRatio(bg, bgHex) < 1.8) bg = luminance(hexToRgb(bgHex)) > 0.4 ? c.text : "#FFFFFF";
  const preferred = onPrimarySection ? c.primary : toneFor(theme, "primary").ink;
  const fg = contrastRatio(preferred, bg) >= 4.5 ? preferred : ensureContrast(luminance(hexToRgb(bg)) > 0.4 ? c.text : c.background, bg, 4.5);
  return { bg, fg };
}

export function isDarkTheme(theme: ThemeTokens) {
  return luminance(hexToRgb(theme.colors.background)) < 0.2;
}

export function contrastWarnings(theme: ThemeTokens) {
  const c = theme.colors;
  const onPrimary = Math.max(contrastRatio(c.background, c.primary), contrastRatio(c.text, c.primary));
  const checks: { label: string; ratio: number; min: number }[] = [
    { label: "Teks di atas latar", ratio: contrastRatio(c.text, c.background), min: 4.5 },
    { label: "Teks di atas surface", ratio: contrastRatio(c.text, c.surface), min: 4.5 },
    { label: "Teks di atas secondary", ratio: contrastRatio(c.text, c.secondary), min: 4.5 },
    { label: "Teks di atas primary", ratio: onPrimary, min: 4.5 },
  ];
  return checks.map((x) => ({ ...x, ok: x.ratio >= x.min }));
}
