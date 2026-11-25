"use client";

import type { CSSProperties, ReactNode } from "react";
import { getMedia } from "@/lib/media";
import { bandPattern, kawungPattern } from "@/lib/motif";
import { cn } from "@/lib/utils";
import { useInvitation } from "./context";
import { useTone } from "./SectionFrame";

export const CENTERED = ["classic", "cinematic", "nusantara", "deco", "arch"];

/** Template tata letak aktif + helper kelas responsif. */
export function useLayout() {
  const { data } = useInvitation();
  const layout = data.settings.theme.layout;
  const compact = layout === "card";
  return {
    layout,
    is: (...keys: string[]) => keys.includes(layout),
    /** Kelas responsif (sm:/md:) dibuang di Kartu Minimal: kolomnya selalu ramping, di layar apa pun. */
    wide: (cls: string) => (compact ? "" : cls),
    /** Klasik, Sinematik, Nusantara, Art Deco, Lengkung: komposisi rata tengah. */
    centered: CENTERED.includes(layout),
  };
}

/** Pemisah klasik: garis, belah ketupat, garis. */
export function ClassicDivider({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 12" className={cn("mx-auto h-3 w-28", className)}>
      <line x1="0" y1="6" x2="50" y2="6" stroke="rgb(var(--c-accent))" strokeWidth="0.8" />
      <rect x="55.5" y="1.5" width="9" height="9" transform="rotate(45 60 6)" fill="none" stroke="rgb(var(--c-accent))" strokeWidth="0.8" />
      <circle cx="60" cy="6" r="1.2" fill="rgb(var(--c-accent))" />
      <line x1="70" y1="6" x2="120" y2="6" stroke="rgb(var(--c-accent))" strokeWidth="0.8" />
    </svg>
  );
}

/** Bingkai garis ganda ala kartu undangan cetak. */
export function DoubleFrame({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={cn("border p-[5px]", className)} style={{ borderColor: "rgb(var(--c-accent) / 0.55)", borderRadius: "var(--radius)", ...style }}>
      <div className="h-full border px-5 py-10 sm:px-10 sm:py-14" style={{ borderColor: "rgb(var(--c-accent) / 0.35)", borderRadius: "var(--radius)" }}>
        {children}
      </div>
    </div>
  );
}

function useMotif() {
  const { data } = useInvitation();
  const t = data.settings.theme;
  const custom = getMedia(data, t.ornamentMediaId);
  return { accent: t.colors.accent, custom };
}

/** Pita motif horizontal. Memakai gambar ornamen custom bila diunggah admin. */
export function MotifBand({ className }: { className?: string }) {
  const { accent, custom } = useMotif();
  return (
    <div
      aria-hidden="true"
      className={cn("h-[14px] w-full", className)}
      style={{
        backgroundImage: custom ? `url("${custom.url}")` : bandPattern(accent),
        backgroundRepeat: "repeat-x",
        backgroundSize: custom ? "auto 100%" : "28px 14px",
        backgroundPosition: "center",
      }}
    />
  );
}

/** Pemisah motif untuk judul section. */
export function MotifDivider({ className }: { className?: string }) {
  const { accent, custom } = useMotif();
  return (
    <div aria-hidden="true" className={cn("mx-auto flex items-center justify-center gap-3", className)}>
      <span className="h-px w-12" style={{ background: "rgb(var(--c-accent) / 0.7)" }} />
      <span
        className="h-8 w-8"
        style={{ backgroundImage: custom ? `url("${custom.url}")` : kawungPattern(accent), backgroundSize: custom ? "contain" : "32px 32px", backgroundRepeat: "no-repeat", backgroundPosition: "center" }}
      />
      <span className="h-px w-12" style={{ background: "rgb(var(--c-accent) / 0.7)" }} />
    </div>
  );
}

/** Ornamen sudut (empat sudut) untuk bingkai foto atau cover. */
export function MotifCorners({ inset = 10, size = 44 }: { inset?: number; size?: number }) {
  const pos: CSSProperties[] = [
    { top: inset, left: inset },
    { top: inset, right: inset, transform: "scaleX(-1)" },
    { bottom: inset, left: inset, transform: "scaleY(-1)" },
    { bottom: inset, right: inset, transform: "scale(-1,-1)" },
  ];
  return (
    <>
      {pos.map((p, i) => (
        <svg key={i} aria-hidden="true" viewBox="0 0 44 44" width={size} height={size} className="pointer-events-none absolute" style={p}>
          <path d="M2 42 V8 Q2 2 8 2 H42" fill="none" stroke="rgb(var(--c-accent))" strokeWidth="1.2" />
          <path d="M7 42 V12 Q7 7 12 7 H42" fill="none" stroke="rgb(var(--c-accent))" strokeOpacity="0.5" strokeWidth="0.8" />
          <ellipse cx="14" cy="14" rx="4" ry="2.2" transform="rotate(45 14 14)" fill="none" stroke="rgb(var(--c-accent))" strokeWidth="0.9" />
          <ellipse cx="14" cy="14" rx="4" ry="2.2" transform="rotate(-45 14 14)" fill="none" stroke="rgb(var(--c-accent))" strokeWidth="0.9" />
        </svg>
      ))}
    </>
  );
}

/** Di template Sinematik, formulir & daftar diletakkan di panel terang agar mudah dibaca di atas foto. */
export function ReadablePanel({ children, className }: { children: ReactNode; className?: string }) {
  const { is } = useLayout();
  const surface = useTone("surface");
  if (!is("cinematic")) return <>{children}</>;
  return (
    <div className={cn("p-6 sm:p-10", className)} style={{ ...surface, backgroundColor: "rgb(var(--c-surface) / 0.96)", borderRadius: "var(--radius)" }}>
      {children}
    </div>
  );
}

/** Penanda pembuka section sesuai template: nomor folio, pemisah klasik, atau motif. */
export function SectionMark({ folio, center = true }: { folio: number; center?: boolean }) {
  const { layout } = useLayout();
  if (layout === "classic") return <ClassicDivider />;
  if (layout === "nusantara") return <MotifDivider />;
  if (layout === "deco") return <DecoDivider />;
  if (layout === "arch") return <ArchMark />;
  if (layout === "bento")
    return (
      <p className={cn("flex", center && "justify-center")}>
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-body text-[0.7rem] font-medium tracking-[0.16em]" style={{ color: "rgb(var(--tone-accent))", borderColor: "rgb(var(--tone-accent) / 0.45)" }}>
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: "rgb(var(--tone-accent))" }} />
          No. {String(folio).padStart(2, "0")}
        </span>
      </p>
    );
  return (
    <p className={cn("folio", center && "justify-center")} style={{ color: "rgb(var(--tone-accent))" }}>
      <span>No. {String(folio).padStart(2, "0")}</span>
    </p>
  );
}

// ---------- Art Deco Mewah ----------

/** Pemisah Art Deco: kipas sinar di tengah, garis bertingkat di kedua sisi. */
export function DecoDivider({ className, color = "rgb(var(--c-accent))" }: { className?: string; color?: string }) {
  const rays = [-60, -40, -20, 0, 20, 40, 60];
  return (
    <svg aria-hidden="true" viewBox="0 0 160 28" className={cn("mx-auto h-7 w-40", className)}>
      <g stroke={color} fill="none" strokeWidth="0.9">
        <path d="M0 22 H52 M8 26 H56 M20 18 H50" />
        <path d="M160 22 H108 M152 26 H104 M140 18 H110" />
        {rays.map((r) => (
          <line key={r} x1="80" y1="26" x2={80 + Math.sin((r * Math.PI) / 180) * 20} y2={26 - Math.cos((r * Math.PI) / 180) * 20} />
        ))}
        <path d="M62 26 A18 18 0 0 1 98 26" />
      </g>
      <circle cx="80" cy="26" r="2" fill={color} />
    </svg>
  );
}

/** Ornamen sudut bertingkat khas Art Deco. */
export function DecoCorners({ inset = 10, size = 46, color = "rgb(var(--c-accent))" }: { inset?: number; size?: number; color?: string }) {
  const pos: CSSProperties[] = [
    { top: inset, left: inset },
    { top: inset, right: inset, transform: "scaleX(-1)" },
    { bottom: inset, left: inset, transform: "scaleY(-1)" },
    { bottom: inset, right: inset, transform: "scale(-1,-1)" },
  ];
  return (
    <>
      {pos.map((p, i) => (
        <svg key={i} aria-hidden="true" viewBox="0 0 46 46" width={size} height={size} className="pointer-events-none absolute" style={p}>
          <g fill="none" stroke={color} strokeWidth="1">
            <path d="M1 45 V1 H45" />
            <path d="M6 45 V14 H14 V6 H45" strokeOpacity="0.7" />
            <path d="M11 45 V20 H20 V11 H45" strokeOpacity="0.45" />
          </g>
          <rect x="1" y="1" width="5" height="5" fill={color} />
        </svg>
      ))}
    </>
  );
}

/** Bingkai Art Deco: garis tipis dengan sudut bertingkat. */
export function DecoFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative border px-6 py-14 sm:px-12 sm:py-16", className)} style={{ borderColor: "rgb(var(--c-accent) / 0.4)" }}>
      <DecoCorners inset={-1} size={50} />
      {children}
    </div>
  );
}

const DECO_CLIP = "polygon(0 14%, 10% 14%, 10% 7%, 22% 7%, 22% 2.5%, 36% 2.5%, 36% 0, 64% 0, 64% 2.5%, 78% 2.5%, 78% 7%, 90% 7%, 90% 14%, 100% 14%, 100% 100%, 0 100%)";
const DECO_PATH = "M0 14 H10 V7 H22 V2.5 H36 V0 H64 V2.5 H78 V7 H90 V14 H100 V100 H0 Z";

/** Jendela foto berpuncak bertingkat (ziggurat) dengan garis luar emas. */
export function DecoWindow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute -inset-[7px] z-10 h-[calc(100%+14px)] w-[calc(100%+14px)] overflow-visible">
        <path d={DECO_PATH} fill="none" stroke="rgb(var(--c-accent))" strokeWidth="1" vectorEffect="non-scaling-stroke" opacity="0.8" />
      </svg>
      <div className="relative h-full w-full overflow-hidden" style={{ clipPath: DECO_CLIP }}>
        {children}
      </div>
    </div>
  );
}

/** Sinar kipas samar di belakang judul atau monogram. */
export function DecoSunburst({ className, color = "rgb(var(--c-accent))" }: { className?: string; color?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 100" className={cn("pointer-events-none", className)}>
      <g stroke={color} strokeWidth="0.6" opacity="0.35">
        {Array.from({ length: 19 }, (_, i) => {
          const a = (-90 + i * 10) * (Math.PI / 180);
          return <line key={i} x1="100" y1="100" x2={100 + Math.sin(a) * 98} y2={100 - Math.cos(a) * 98} />;
        })}
      </g>
      <g fill="none" stroke={color} opacity="0.5">
        <path d="M40 100 A60 60 0 0 1 160 100" strokeWidth="0.7" />
        <path d="M60 100 A40 40 0 0 1 140 100" strokeWidth="0.7" />
      </g>
    </svg>
  );
}

// ---------- Lengkung Modern ----------

/** Penanda section lengkung: ikon jendela melengkung kecil di antara garis. */
export function ArchMark({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("mx-auto flex items-center justify-center gap-3", className)}>
      <span className="h-px w-10" style={{ background: "rgb(var(--tone-accent) / 0.6)" }} />
      <svg viewBox="0 0 20 26" className="h-6 w-5">
        <path d="M2 25 V10 A8 8 0 0 1 18 10 V25 Z" fill="none" stroke="rgb(var(--tone-accent))" strokeWidth="1.2" />
        <circle cx="10" cy="11" r="1.6" fill="rgb(var(--tone-accent))" />
      </svg>
      <span className="h-px w-10" style={{ background: "rgb(var(--tone-accent) / 0.6)" }} />
    </div>
  );
}

/** Foto berbentuk jendela lengkung dengan garis luar yang digeser. */
export function ArchWindow({ children, className, outline = true, color = "rgb(var(--c-accent))" }: { children: ReactNode; className?: string; outline?: boolean; color?: string }) {
  return (
    <div className={cn("relative", className)}>
      {outline && <div aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 rounded-t-full border" style={{ borderColor: color, opacity: 0.7 }} />}
      <div className="relative h-full w-full overflow-hidden rounded-t-full">{children}</div>
    </div>
  );
}
