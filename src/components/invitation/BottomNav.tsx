"use client";

import { CalendarDays, Home, Images, MailCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { SECTION_META } from "@/config/sections";
import { cn } from "@/lib/utils";
import type { Section } from "@/types/invitation";
import { useInvitation } from "./context";

const ICONS = { home: Home, couple: Users, event: CalendarDays, gallery: Images, rsvp: MailCheck };

export function BottomNav({ sections }: { sections: Section[] }) {
  const { data } = useInvitation();
  const style = data.settings.theme.navStyle;
  const items = sections.filter((s) => SECTION_META[s.key]?.nav);
  const [active, setActive] = useState(items[0]?.key);

  useEffect(() => {
    const els = items.map((s) => document.getElementById(s.key)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id as Section["key"]);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.25, 0.5] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Navigasi undangan"
      className={cn(
        "fixed z-40 font-body",
        style === "bar"
          ? "inset-x-0 bottom-0 border-t pb-[env(safe-area-inset-bottom)]"
          : "bottom-[max(0.9rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 rounded-full border px-1.5 shadow-[0_8px_30px_rgb(0_0_0/0.12)]",
      )}
      style={{
        background: "rgb(var(--c-surface) / 0.94)",
        borderColor: "rgb(var(--c-accent) / 0.35)",
        color: "rgb(var(--c-text))",
        backdropFilter: "saturate(1.2) blur(10px)",
      }}
    >
      <ul className={cn("flex", style === "bar" ? "justify-around" : "gap-0.5")}>
        {items.map((s) => {
          const meta = SECTION_META[s.key].nav!;
          const Icon = ICONS[meta.icon];
          const isActive = active === s.key;
          return (
            <li key={s.key}>
              <a
                href={`#${s.key}`}
                aria-current={isActive ? "true" : undefined}
                className="flex min-h-[52px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-full px-2.5 text-[0.66rem] font-medium transition-colors duration-300 hover:bg-black/[0.04]"
                style={isActive ? { color: "rgb(var(--c-on-primary))", background: "rgb(var(--c-primary))" } : undefined}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden="true" />
                {meta.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
