"use client";

import { getBrowserSupabase } from "@/lib/supabase/client";

// Semua operasi dashboard memakai sesi admin di browser; RLS di database
// memastikan hanya akun ber-role admin yang bisa membaca/menulis.

export const db = () => getBrowserSupabase();

export function emitDraftChanged() {
  window.dispatchEvent(new CustomEvent("draft:changed"));
}

function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v as object)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v ?? null);
}

export interface PublishState {
  isPublished: boolean;
  publishedAt: string | null;
  hasDraftChanges: boolean;
}

export async function fetchPublishState(): Promise<PublishState> {
  const supabase = db();
  const [draft, row] = await Promise.all([
    supabase.rpc("get_draft_invitation"),
    supabase.from("wedding_settings").select("is_published, published_at, published_snapshot").eq("id", 1).single(),
  ]);
  if (draft.error) throw new Error(draft.error.message);
  if (row.error) throw new Error(row.error.message);
  return {
    isPublished: row.data.is_published,
    publishedAt: row.data.published_at,
    hasDraftChanges: stable(draft.data) !== stable(row.data.published_snapshot),
  };
}

export async function revalidatePublic() {
  await fetch("/api/revalidate", { method: "POST" }).catch(() => undefined);
}

export async function publishNow() {
  const { error } = await db().rpc("publish_invitation");
  if (error) throw new Error(error.message);
  await revalidatePublic();
  emitDraftChanged();
}

export async function setPublished(value: boolean) {
  const { error } = await db().from("wedding_settings").update({ is_published: value }).eq("id", 1);
  if (error) throw new Error(error.message);
  await revalidatePublic();
  emitDraftChanged();
}

export function errMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return "Terjadi kesalahan.";
}

export function toCsv(rows: Record<string, unknown>[], columns: { key: string; label: string }[]) {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    // cegah formula injection di Excel/Sheets
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return /[",\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return "﻿" + [columns.map((c) => esc(c.label)).join(","), ...rows.map((r) => columns.map((c) => esc(r[c.key])).join(","))].join("\n");
}
