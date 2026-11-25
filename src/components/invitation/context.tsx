"use client";

import { createContext, useContext } from "react";
import type { GuestContext, InvitationData, MediaAsset } from "@/types/invitation";
import type { Dict } from "./i18n";

export interface InvitationCtx {
  data: InvitationData;
  guest: GuestContext;
  mode: "public" | "preview";
  t: Dict;
  motion: { distance: number; duration: number; enabled: boolean };
  /** Foto latar per section untuk template Sinematik (id section -> media). */
  photos: Record<string, MediaAsset | null>;
}

export const InvitationContext = createContext<InvitationCtx | null>(null);

export function useInvitation() {
  const ctx = useContext(InvitationContext);
  if (!ctx) throw new Error("useInvitation harus di dalam InvitationContext");
  return ctx;
}
