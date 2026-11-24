"use client";

import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { useInvitation } from "./context";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

// Fade-up halus saat masuk viewport. Tujuannya menuntun mata membaca
// berurutan, bukan dekorasi: jarak & durasi mengikuti intensitas tema.
// Server dan render pertama klien identik. Setelah mount, bila pengunjung memilih
// reduced motion, elemen langsung dipindah ke kondisi akhir dengan durasi 0.
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
  variant = "up",
  style,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "p" | "h2" | "figure";
  variant?: "up" | "fade" | "image";
  style?: CSSProperties;
}) {
  const { motion: m } = useInvitation();
  const reduce = useReducedMotionSafe();
  const Comp = motion[as];
  if (!m.enabled) {
    const Tag = as;
    return (
      <Tag className={className} style={style}>
        {children}
      </Tag>
    );
  }
  const initial =
    variant === "image"
      ? { opacity: 0, clipPath: "inset(8% 0% 8% 0%)", scale: 1.04 }
      : variant === "fade"
        ? { opacity: 0 }
        : { opacity: 0, y: m.distance };
  const animate = variant === "image" ? { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", scale: 1 } : { opacity: 1, y: 0 };
  return (
    <Comp
      className={className}
      style={style}
      initial={initial}
      {...(reduce ? { animate } : { whileInView: animate })}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: reduce ? 0 : m.duration * (variant === "image" ? 1.3 : 1), delay: reduce ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Comp>
  );
}
