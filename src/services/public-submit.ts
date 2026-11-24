import "server-only";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { normalizeInvitation } from "@/services/normalize";
import type { InvitationData } from "@/types/invitation";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

/** Tolak request lintas situs (lapisan CSRF sederhana untuk form publik). */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === (req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  } catch {
    return false;
  }
}

export async function readJson(req: Request, maxBytes = 8_000): Promise<unknown | null> {
  const text = await req.text();
  if (text.length > maxBytes) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

type Ready = { ok: true; db: SupabaseClient; published: InvitationData; live: { wishes_moderation: string } };
type NotReady = { ok: false; response: NextResponse };

export async function prepare(): Promise<Ready | NotReady> {
  const db = getServiceSupabase();
  if (!db) {
    return { ok: false, response: jsonError("Penyimpanan belum dikonfigurasi di server (SUPABASE_SERVICE_ROLE_KEY). Data tidak tersimpan.", 503) };
  }
  const { data, error } = await db.from("wedding_settings").select("is_published, published_snapshot, wishes_moderation").eq("id", 1).single();
  if (error || !data) return { ok: false, response: jsonError("Server tidak dapat membaca pengaturan undangan.", 500) };
  const published = data.is_published ? normalizeInvitation(data.published_snapshot) : null;
  if (!published) return { ok: false, response: jsonError("Undangan belum dipublikasikan.", 403) };
  return { ok: true, db, published, live: { wishes_moderation: data.wishes_moderation } };
}

export async function rateLimited(db: SupabaseClient, key: string, max: number, windowSeconds: number) {
  const { data, error } = await db.rpc("check_rate_limit", { p_key: key, p_max: max, p_window_seconds: windowSeconds });
  if (error) return false; // jangan blokir tamu bila tabel rate limit bermasalah
  return data === false;
}
