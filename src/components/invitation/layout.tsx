"use client";

import type { CSSProperties, ReactNode } from "react";
import { getMedia } from "@/lib/media";
import { bandPattern, kawungPattern } from "@/lib/motif";
import { cn } from "@/lib/utils";
import { useInvitation } from "./context";
import { useTone } from "./SectionFrame";

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
    /** Klasik, Sinematik, Nusantara: komposisi rata tengah. */
    centered: layout === "classic" || layout === "cinematic" || layout === "nusantara",
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
  return (
    <p className={cn("folio", center && "justify-center")} style={{ color: "rgb(var(--tone-accent))" }}>
      <span>No. {String(folio).padStart(2, "0")}</span>
    </p>
  );
}
