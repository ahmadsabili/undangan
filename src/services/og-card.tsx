import "server-only";
/* eslint-disable @next/next/no-img-element -- dirender oleh next/og (satori), bukan di browser */
import type { CSSProperties, ReactNode } from "react";
import { env } from "@/lib/env";
import { formatLongDate } from "@/lib/date";
import { absoluteUrl, getMedia, isRaster } from "@/lib/media";
import { bentoCanvas, toneFor } from "@/lib/theme";
import { orderedCouple } from "@/services/normalize";
import type { InvitationData, MediaAsset, ThemeTokens } from "@/types/invitation";

// Kartu preview tautan (WhatsApp, Telegram, dll.) 1200 x 630 yang mengikuti
// template, warna, dan font undangan. Dirender dengan next/og (satori).

export const OG_W = 1200;
export const OG_H = 630;

type Font = { name: string; data: ArrayBuffer; weight: 400 | 500; style: "normal" };

/** Ambil file font dari Google Fonts (TTF), disubset hanya untuk huruf yang dipakai. */
async function googleFont(family: string, weight: 400 | 500, text: string): Promise<ArrayBuffer | null> {
  const name = family.trim().replace(/\s+/g, "+");
  const queries = weight === 400 ? [`family=${name}`] : [`family=${name}:wght@${weight}`, `family=${name}`];
  for (const q of queries) {
    try {
      const css = await fetch(`https://fonts.googleapis.com/css2?${q}&text=${encodeURIComponent(text)}`, { cache: "force-cache" }).then((r) => (r.ok ? r.text() : ""));
      const url = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:opentype|truetype|woff)'\)/)?.[1];
      if (!url) continue;
      const res = await fetch(url, { cache: "force-cache" });
      if (res.ok) return await res.arrayBuffer();
    } catch {
      /* coba berikutnya */
    }
  }
  return null;
}

/** Gambar share custom dari admin, dipotong 1200 x 630 dan diubah ke JPEG ringan. */
export async function customOgJpeg(data: InvitationData): Promise<Buffer | null> {
  const media = getMedia(data, data.settings.og_media_id);
  if (!isRaster(media)) return null;
  try {
    const res = await fetch(absoluteUrl(media!.url, env.siteUrl), { cache: "no-store" });
    if (!res.ok) return null;
    const sharp = (await import("sharp")).default;
    return await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(OG_W, OG_H, { fit: "cover", position: "attention" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
  } catch {
    return null;
  }
}

/** Foto diubah ke JPEG (satori tidak membaca WebP) dan dipotong pas ukuran bingkai. */
async function photoDataUri(media: MediaAsset, w: number, h: number): Promise<string | null> {
  try {
    const res = await fetch(absoluteUrl(media.url, env.siteUrl), { cache: "no-store" });
    if (!res.ok) return null;
    const input = Buffer.from(await res.arrayBuffer());
    const sharp = (await import("sharp")).default;
    const fx = media.focal_x ?? 50;
    const fy = media.focal_y ?? 50;
    const meta = await sharp(input).metadata();
    const sw = meta.width ?? w;
    const sh = meta.height ?? h;
    // Potong mengikuti titik fokus foto, lalu kecilkan.
    const scale = Math.max(w / sw, h / sh);
    const cw = Math.min(sw, Math.round(w / scale));
    const ch = Math.min(sh, Math.round(h / scale));
    const left = Math.min(Math.max(Math.round((fx / 100) * sw - cw / 2), 0), sw - cw);
    const top = Math.min(Math.max(Math.round((fy / 100) * sh - ch / 2), 0), sh - ch);
    const out = await sharp(input).extract({ left, top, width: cw, height: ch }).resize(w, h, { fit: "cover" }).jpeg({ quality: 82 }).toBuffer();
    return `data:image/jpeg;base64,${out.toString("base64")}`;
  } catch {
    return null;
  }
}

function pickPhoto(data: InvitationData) {
  const content = (key: string) => data.sections.find((x) => x.key === key)?.content as { media_id?: string } | undefined;
  const candidates = [getMedia(data, content("cover")?.media_id), getMedia(data, content("hero")?.media_id), ...data.gallery.map((g) => getMedia(data, g.media_id))];
  return candidates.find(isRaster) ?? null;
}

const row = (s: CSSProperties = {}): CSSProperties => ({ display: "flex", ...s });
const col = (s: CSSProperties = {}): CSSProperties => ({ display: "flex", flexDirection: "column", ...s });

function nameSize(a: string, b: string, max: number) {
  const len = Math.max(a.length, b.length);
  return Math.max(52, Math.min(max, Math.round(max - (len - 7) * 6)));
}

// ---------- ornamen per template ----------
function Divider({ layout, color }: { layout: ThemeTokens["layout"]; color: string }) {
  if (layout === "deco")
    return (
      <svg width="170" height="28" viewBox="0 0 160 28">
        <g stroke={color} fill="none" strokeWidth="1.2">
          <path d="M0 22 H52 M8 26 H56 M160 22 H108 M152 26 H104" />
          {[-60, -30, 0, 30, 60].map((r) => (
            <line key={r} x1="80" y1="26" x2={80 + Math.sin((r * Math.PI) / 180) * 20} y2={26 - Math.cos((r * Math.PI) / 180) * 20} />
          ))}
          <path d="M62 26 A18 18 0 0 1 98 26" />
        </g>
      </svg>
    );
  if (layout === "classic" || layout === "nusantara")
    return (
      <svg width="150" height="14" viewBox="0 0 120 12">
        <line x1="0" y1="6" x2="50" y2="6" stroke={color} strokeWidth="1" />
        <rect x="55.5" y="1.5" width="9" height="9" transform="rotate(45 60 6)" fill="none" stroke={color} strokeWidth="1" />
        <line x1="70" y1="6" x2="120" y2="6" stroke={color} strokeWidth="1" />
      </svg>
    );
  if (layout === "arch")
    return (
      <svg width="120" height="30" viewBox="0 0 80 26">
        <line x1="0" y1="18" x2="26" y2="18" stroke={color} strokeWidth="1" />
        <path d="M32 25 V10 A8 8 0 0 1 48 10 V25 Z" fill="none" stroke={color} strokeWidth="1.3" />
        <line x1="54" y1="18" x2="80" y2="18" stroke={color} strokeWidth="1" />
      </svg>
    );
  return <div style={{ width: 70, height: 2, background: color }} />;
}

/** Ornamen bingkai seluruh kartu sebagai satu SVG penuh (satori paling andal dengan posisi 0,0). */
function FrameOverlay({ layout, color }: { layout: ThemeTokens["layout"]; color: string }) {
  const W = OG_W;
  const H = OG_H;
  const parts: ReactNode[] = [];
  if (layout === "classic") {
    parts.push(<rect key="o" x="18" y="18" width={W - 36} height={H - 36} fill="none" stroke={color} strokeWidth="1.2" />);
    parts.push(<rect key="i" x="26" y="26" width={W - 52} height={H - 52} fill="none" stroke={color} strokeWidth="0.8" />);
  }
  if (layout === "deco") {
    const m = 22;
    parts.push(<rect key="f" x={m} y={m} width={W - 2 * m} height={H - 2 * m} fill="none" stroke={color} strokeOpacity="0.55" strokeWidth="1.2" />);
    // Sudut bertingkat di keempat sudut: (x, y, arah x, arah y).
    const corners: [number, number, number, number][] = [
      [m, m, 1, 1],
      [W - m, m, -1, 1],
      [m, H - m, 1, -1],
      [W - m, H - m, -1, -1],
    ];
    corners.forEach(([x, y, dx, dy], i) => {
      const p = (a: number, b: number) => `${x + dx * a} ${y + dy * b}`;
      parts.push(
        <g key={`c${i}`} fill="none" stroke={color} strokeWidth="1.6">
          <path d={`M${p(0, 60)} L${p(0, 0)} L${p(60, 0)}`} />
          <path d={`M${p(8, 60)} L${p(8, 20)} L${p(20, 20)} L${p(20, 8)} L${p(60, 8)}`} />
          <path d={`M${p(16, 60)} L${p(16, 28)} L${p(28, 28)} L${p(28, 16)} L${p(60, 16)}`} />
        </g>,
      );
    });
  }
  if (layout === "nusantara") {
    for (const y of [20, H - 20])
      for (let i = 0; i * 28 < W; i++)
        parts.push(
          <g key={`${y}-${i}`} fill="none" stroke={color} strokeWidth="1.2">
            <ellipse cx={14 + i * 28} cy={y} rx="6" ry="3.4" />
            <ellipse cx={14 + i * 28} cy={y} rx="3.4" ry="6" />
          </g>,
        );
  }
  if (!parts.length) return null;
  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, display: "flex" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {parts}
      </svg>
    </div>
  );
}

/** Bingkai foto sesuai template. */
function Photo({ layout, src, w, h, accent, bg }: { layout: ThemeTokens["layout"]; src: string; w: number; h: number; accent: string; bg: string }) {
  const img = <img src={src} width={w} height={h} style={{ width: w, height: h, objectFit: "cover" }} alt="" />;
  if (layout === "arch")
    return (
      <div style={row({ position: "relative", width: w + 16, height: h + 16 })}>
        <div style={{ position: "absolute", left: 16, top: 16, width: w, height: h, border: `1.5px solid ${accent}`, borderTopLeftRadius: w / 2, borderTopRightRadius: w / 2 }} />
        <div style={row({ width: w, height: h, overflow: "hidden", borderTopLeftRadius: w / 2, borderTopRightRadius: w / 2 })}>{img}</div>
      </div>
    );
  if (layout === "classic" || layout === "nusantara")
    return (
      <div style={row({ width: w + 20, height: h + 20, padding: 4, border: `1.5px solid ${accent}`, borderRadius: "50%" })}>
        <div style={row({ width: w + 10, height: h + 10, padding: 3, border: `1px solid ${accent}`, borderRadius: "50%" })}>
          <div style={row({ width: w, height: h, borderRadius: "50%", overflow: "hidden" })}>{img}</div>
        </div>
      </div>
    );
  if (layout === "deco") {
    // Puncak bertingkat: sudut atas ditutup blok warna latar, lalu garis luar emas.
    const steps = [
      [0, 0.14, 0.1],
      [0, 0.07, 0.22],
      [0, 0.025, 0.36],
    ];
    return (
      <div style={row({ position: "relative", width: w, height: h })}>
        {img}
        {steps.map(([, hh, ww], i) => (
          <div key={i} style={{ position: "absolute", top: 0, left: 0, width: w, height: h * hh, display: "flex", justifyContent: "space-between" }}>
            <div style={{ width: w * ww, height: "100%", background: bg }} />
            <div style={{ width: w * ww, height: "100%", background: bg }} />
          </div>
        ))}
        <div style={{ position: "absolute", top: 0, left: 0, display: "flex", width: w, height: h }}>
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <path d={`M1 ${h * 0.14} H${w * 0.1} V${h * 0.07} H${w * 0.22} V${h * 0.025} H${w * 0.36} V1 H${w * 0.64} V${h * 0.025} H${w * 0.78} V${h * 0.07} H${w * 0.9} V${h * 0.14} H${w - 1} V${h - 1} H1 Z`} fill="none" stroke={accent} strokeWidth="2" />
          </svg>
        </div>
      </div>
    );
  }
  if (layout === "bento") return <div style={row({ width: w, height: h, borderRadius: 28, overflow: "hidden" })}>{img}</div>;
  // editorial & kartu: potret dengan garis bingkai yang digeser.
  return (
    <div style={row({ position: "relative", width: w + 18, height: h + 18, paddingTop: 18 })}>
      <div style={{ position: "absolute", right: 0, top: 0, width: w, height: h, border: `1.5px solid ${accent}` }} />
      <div style={row({ width: w, height: h, overflow: "hidden" })}>{img}</div>
    </div>
  );
}

export async function renderOgCard(data: InvitationData): Promise<{ node: ReactNode; fonts: Font[] }> {
  const s = data.settings;
  const theme = s.theme;
  const layout = theme.layout;
  const c = theme.colors;
  const [p1, p2] = orderedCouple(s.couple);
  const date = formatLongDate(s.wedding_date, s.timezone, s.language);
  const eyebrow = "THE WEDDING OF";
  const upper = layout === "deco";
  const n1 = upper ? p1.nickname.toUpperCase() : p1.nickname;
  const n2 = upper ? p2.nickname.toUpperCase() : p2.nickname;

  const cinematic = layout === "cinematic";
  const bento = layout === "bento";
  const tone = toneFor(theme, cinematic ? "primary" : "background");
  const ink = tone.ink;
  const accent = tone.accentInk;
  const muted = tone.muted;
  const bg = cinematic ? c.primary : bento ? bentoCanvas(theme) : layout === "card" ? c.secondary : c.background;

  const media = pickPhoto(data);
  const photoBox = cinematic ? { w: OG_W, h: OG_H } : layout === "arch" ? { w: 330, h: 470 } : layout === "classic" || layout === "nusantara" ? { w: 330, h: 440 } : bento ? { w: 520, h: 574 } : layout === "deco" ? { w: 340, h: 460 } : { w: 400, h: 500 };
  const photo = media ? await photoDataUri(media, photoBox.w, photoBox.h) : null;

  const headingText = `${n1}${n2}&`;
  const bodyText = `${eyebrow}${date}0123456789`;
  const [h400, b400, b500] = await Promise.all([googleFont(theme.fonts.heading, 400, headingText), googleFont(theme.fonts.body, 400, bodyText), googleFont(theme.fonts.body, 500, bodyText)]);
  const fonts: Font[] = [];
  if (h400) fonts.push({ name: "Heading", data: h400, weight: 400, style: "normal" });
  if (b400) fonts.push({ name: "Body", data: b400, weight: 400, style: "normal" });
  if (b500) fonts.push({ name: "Body", data: b500, weight: 500, style: "normal" });
  const heading = h400 ? "Heading" : undefined;
  const body = b400 ? "Body" : undefined;

  const size = nameSize(n1, n2, bento ? 92 : photo && !cinematic ? (upper ? 84 : 104) : upper ? 96 : 124);
  const textBlock = (align: "flex-start" | "center", inkColor: string, accentColor: string, mutedColor: string) => (
    <div style={col({ alignItems: align, textAlign: align === "center" ? "center" : "left" })}>
      <div style={{ fontFamily: body, fontWeight: 500, fontSize: 22, letterSpacing: upper ? 10 : 7, color: accentColor }}>{eyebrow}</div>
      <div style={col({ alignItems: align, marginTop: 26, fontFamily: heading, fontSize: size, lineHeight: 1, color: inkColor, letterSpacing: upper ? 6 : -1 })}>
        <div style={{ display: "flex" }}>{n1}</div>
        <div style={{ display: "flex", fontSize: size * 0.62, color: accentColor, margin: "6px 0 2px" }}>&amp;</div>
        <div style={{ display: "flex" }}>{n2}</div>
      </div>
      <div style={row({ marginTop: 30 })}>
        <Divider layout={layout} color={accentColor} />
      </div>
      <div style={{ marginTop: 22, fontFamily: body, fontSize: 26, letterSpacing: upper ? 5 : 2, color: mutedColor }}>{upper ? date.toUpperCase() : date}</div>
    </div>
  );

  let node: ReactNode;
  if (cinematic) {
    node = (
      <div style={row({ position: "relative", width: OG_W, height: OG_H, background: c.primary, alignItems: "flex-end" })}>
        {photo && <img src={photo} width={OG_W} height={OG_H} style={{ position: "absolute", top: 0, left: 0, width: OG_W, height: OG_H, objectFit: "cover" }} alt="" />}
        <div style={{ position: "absolute", top: 0, left: 0, width: OG_W, height: OG_H, backgroundImage: `linear-gradient(90deg, ${c.primary}F2 0%, ${c.primary}B3 42%, ${c.primary}1A 78%)` }} />
        <div style={row({ position: "relative", padding: "0 72px 64px" })}>{textBlock("flex-start", ink, accent, ink)}</div>
      </div>
    );
  } else if (bento) {
    const dark = toneFor(theme, "primary");
    const soft = toneFor(theme, "secondary");
    node = (
      <div style={row({ width: OG_W, height: OG_H, background: bg, padding: 28, gap: 20 })}>
        {photo && <Photo layout={layout} src={photo} w={photoBox.w} h={photoBox.h} accent={c.accent} bg={bg} />}
        <div style={col({ flex: 1, gap: 20 })}>
          <div style={col({ flex: 1, background: c.primary, borderRadius: 28, padding: "0 44px", justifyContent: "center", alignItems: photo ? "flex-start" : "center" })}>{textBlock(photo ? "flex-start" : "center", dark.ink, dark.accentInk, dark.muted)}</div>
          <div style={row({ height: 96, background: c.secondary, borderRadius: 28, padding: "0 36px", alignItems: "center", fontFamily: body, fontSize: 22, letterSpacing: 4, color: soft.accentInk })}>SAVE THE DATE</div>
        </div>
      </div>
    );
  } else {
    const centered = !photo;
    node = (
      <div style={row({ position: "relative", width: OG_W, height: OG_H, background: bg, alignItems: "center", justifyContent: centered ? "center" : "space-between", padding: centered ? 0 : "0 96px 0 104px" })}>
        <FrameOverlay layout={layout} color={c.accent} />
        {textBlock(centered || layout === "arch" || layout === "deco" || layout === "classic" || layout === "nusantara" ? "center" : "flex-start", ink, accent, muted)}
        {photo && <Photo layout={layout} src={photo} w={photoBox.w} h={photoBox.h} accent={c.accent} bg={bg} />}
      </div>
    );
  }
  return { node, fonts };
}
