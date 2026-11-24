"use client";

import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useInvitation } from "./context";

type Variant = "auto" | "solid" | "outline" | "underline" | "ghost";

function useVariant(v: Variant) {
  const { data } = useInvitation();
  return v === "auto" ? data.settings.theme.buttonStyle : v;
}

export function InvButton({
  variant = "auto",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) {
  const v = useVariant(variant);
  return (
    <button type="button" data-variant={v} className={cn("inv-btn", className)} {...rest}>
      {children}
    </button>
  );
}

export function InvLink({
  variant = "auto",
  className,
  children,
  external,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; children: ReactNode; external?: boolean }) {
  const v = useVariant(variant);
  return (
    <a
      data-variant={v}
      className={cn("inv-btn", className)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {children}
    </a>
  );
}
