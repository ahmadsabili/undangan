import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { clientKey } from "@/lib/ip";
import { cleanText, spamReason } from "@/lib/sanitize";
import { getPublicSupabase, getServerSupabase } from "@/lib/supabase/server";
import { jsonError, prepare, rateLimited, readJson, sameOrigin } from "@/services/public-submit";
import { wishSchema } from "@/validation/public";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { accessModeFor, validGuestCode } from "@/services/access";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) return jsonError("Supabase belum dikonfigurasi.", 503);
  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 6, 1), 30);
  const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);
  const svc = getServiceSupabase();
  if (svc && (await accessModeFor(svc)) === "code" && !(await validGuestCode(svc, url.searchParams.get("guest")))) {
    // Pratinjau admin tetap bisa memuat ucapan.
    const { data: auth } = await (await getServerSupabase()).auth.getUser();
    if (!auth.user) return jsonError("Undangan ini hanya untuk tamu yang menerima tautan pribadi.", 403);
  }
  const { data, error } = await getPublicSupabase().rpc("get_public_wishes", { p_limit: limit, p_offset: offset });
  if (error) return jsonError("Ucapan gagal dimuat.", 500);
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Permintaan ditolak.", 403);
  const body = await readJson(req);
  if (!body) return jsonError("Data tidak valid.", 400);
  const parsed = wishSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Data tidak valid.", 400);
  const v = parsed.data;
  if (v.website) return jsonError("Permintaan ditolak.", 400);

  const reason = spamReason(`${v.name} ${v.message}`, v.startedAt);
  if (reason === "terlalu cepat") return jsonError("Mohon tunggu sebentar lalu kirim ulang.", 400);

  const ctx = await prepare();
  if (!ctx.ok) return ctx.response;
  const { db, published, live } = ctx;
  if ((await accessModeFor(db)) === "code" && !(await validGuestCode(db, v.guestCode))) return jsonError("Undangan ini hanya untuk tamu yang menerima tautan pribadi.", 403);
  if (!published.sections.some((x) => x.key === "wishes" && x.enabled)) return jsonError("Fitur ucapan sedang tidak aktif.", 403);
  if (await rateLimited(db, clientKey(req.headers, "wish"), 5, 600)) return jsonError("Terlalu banyak ucapan dalam waktu singkat. Coba lagi nanti.", 429);

  const name = cleanText(v.name, 80);
  const message = cleanText(v.message, 600);
  if (message.length < 2) return jsonError("Ucapan terlalu pendek.", 400);

  const since = new Date(Date.now() - 3600e3).toISOString();
  const { count } = await db.from("wedding_wishes").select("id", { count: "exact", head: true }).eq("name", name).eq("message", message).gte("created_at", since);
  if (count && count > 0) return jsonError("Ucapan yang sama sudah terkirim.", 409);

  let guestId: string | null = null;
  if (v.guestCode && /^[A-Z0-9]{6,16}$/i.test(v.guestCode)) {
    const { data: g } = await db.from("guests").select("id").eq("code", v.guestCode.toUpperCase()).maybeSingle();
    guestId = g?.id ?? null;
  }

  // Konten mencurigakan selalu masuk antrean moderasi, apa pun mode moderasinya.
  const status = live.wishes_moderation === "auto" && !reason ? "approved" : "pending";
  const { data, error } = await db
    .from("wedding_wishes")
    .insert({ name, message, status, guest_id: guestId })
    .select("id, name, message, created_at, status")
    .single();
  if (error) return jsonError("Ucapan gagal disimpan. Silakan coba lagi.", 500);
  const { status: saved, ...item } = data;
  return NextResponse.json({ ok: true, status: saved, item: saved === "approved" ? item : null }, { headers: { "Cache-Control": "no-store" } });
}
