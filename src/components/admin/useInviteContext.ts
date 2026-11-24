"use client";

import { useEffect, useState } from "react";
import { db } from "@/services/admin";
import { normalizeCouple, orderedCouple } from "@/services/normalize";

export interface Template {
  id: string;
  name: string;
  body: string;
  is_default: boolean;
}

export function siteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, "");
}

/** Data pendukung tautan & pesan undangan: nama mempelai dan template WhatsApp. */
export function useInviteContext() {
  const [names, setNames] = useState<[string, string]>(["", ""]);
  const [templates, setTemplates] = useState<Template[]>([]);
  useEffect(() => {
    void (async () => {
      const [s, t] = await Promise.all([db().from("wedding_settings").select("couple").eq("id", 1).single(), db().from("invitation_templates").select("*").order("is_default", { ascending: false })]);
      if (s.data) {
        const [a, b] = orderedCouple(normalizeCouple(s.data.couple));
        setNames([a.nickname || a.full_name, b.nickname || b.full_name]);
      }
      if (t.data) setTemplates(t.data as Template[]);
    })();
  }, []);
  return { names, templates };
}
