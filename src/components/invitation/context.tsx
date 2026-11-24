"use client";

import { createContext, useContext } from "react";
import type { GuestContext, InvitationData } from "@/types/invitation";
import type { Dict } from "./i18n";

export interface InvitationCtx {
  data: InvitationData;
  guest: GuestContext;
  mode: "public" | "preview";
  t: Dict;
  motion: { distance: number; duration: number; enabled: boolean };
}

export const InvitationContext = createContext<InvitationCtx | null>(null);

export function useInvitation() {
  const ctx = useContext(InvitationContext);
  if (!ctx) throw new Error("useInvitation harus di dalam InvitationContext");
  return ctx;
}
