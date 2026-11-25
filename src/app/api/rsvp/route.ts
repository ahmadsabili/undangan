import { NextResponse } from "next/server";
import { clientKey } from "@/lib/ip";
import { cleanText, spamReason } from "@/lib/sanitize";
import { jsonError, prepare, rateLimited, readJson, sameOrigin } from "@/services/public-submit";
import { rsvpSchema } from "@/validation/public";
import { accessModeFor, validGuestCode } from "@/services/access";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Permintaan ditolak.", 403);
  const body = await readJson(req);
  if (!body) return jsonError("Data tidak valid.", 400);

  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Data tidak valid.", 400);
  const v = parsed.data;
  if (v.website) return jsonError("Permintaan ditolak.", 400);
  const spam = spamReason(v.message, v.startedAt);
  if (spam) return jsonError(spam === "terlalu cepat" ? "Mohon tunggu sebentar lalu kirim ulang." : "Pesan tidak dapat diterima. Hapus tautan atau kata yang tidak pantas.", 400);

  const ctx = await prepare();
  if (!ctx.ok) return ctx.response;
  const { db, published } = ctx;
  const s = published.settings;
  if ((await accessModeFor(db)) === "code" && !(await validGuestCode(db, v.guestCode))) return jsonError("Undangan ini hanya untuk tamu yang menerima tautan pribadi.", 403);

  if (!published.sections.some((x) => x.key === "rsvp" && x.enabled)) return jsonError("Formulir RSVP sedang tidak aktif.", 403);
  if (s.rsvp_deadline && Date.now() > new Date(s.rsvp_deadline).getTime()) return jsonError("Konfirmasi kehadiran sudah ditutup.", 403);
  if (await rateLimited(db, clientKey(req.headers, "rsvp"), 8, 600)) return jsonError("Terlalu banyak percobaan. Silakan coba lagi beberapa menit lagi.", 429);

  const message = cleanText(v.message ?? "", 500);
  const attendance = v.attendance;

  // Tamu terdaftar (kode unik): satu RSVP per tamu, kiriman ulang memperbarui.
  if (v.guestCode) {
    const code = v.guestCode.toUpperCase();
    if (!/^[A-Z0-9]{6,16}$/.test(code)) return jsonError("Kode undangan tidak valid.", 400);
    const { data: guest } = await db.from("guests").select("id, name, max_pax").eq("code", code).maybeSingle();
    if (!guest) return jsonError("Kode undangan tidak ditemukan.", 404);
    const pax = attendance === "tidak_hadir" ? 0 : Math.min(Math.max(v.pax, 1), guest.max_pax);
    const { data, error } = await db
      .from("rsvps")
      .upsert({ guest_id: guest.id, name: guest.name, attendance, pax, message, source: "code" }, { onConflict: "guest_id" })
      .select("attendance, pax, message")
      .single();
    if (error) return jsonError("Konfirmasi gagal disimpan. Silakan coba lagi.", 500);
    return NextResponse.json({ ok: true, rsvp: data }, { headers: { "Cache-Control": "no-store" } });
  }

  // Tamu umum (?to=Nama): cegah duplikat tak sengaja dalam 24 jam untuk nama yang sama.
  const name = cleanText(v.name, 80);
  const pax = attendance === "tidak_hadir" ? 0 : Math.min(Math.max(v.pax, 1), s.rsvp_max_pax);
  const since = new Date(Date.now() - 24 * 3600e3).toISOString();
  const pattern = name.replace(/[\\%_]/g, (c) => "\\" + c);
  const { data: existing } = await db
    .from("rsvps")
    .select("id")
    .is("guest_id", null)
    .ilike("name", pattern)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const query = existing
    ? db.from("rsvps").update({ attendance, pax, message }).eq("id", existing.id)
    : db.from("rsvps").insert({ name, attendance, pax, message, source: "name" });
  const { data, error } = await query.select("attendance, pax, message").single();
  if (error) return jsonError("Konfirmasi gagal disimpan. Silakan coba lagi.", 500);
  return NextResponse.json({ ok: true, rsvp: data }, { headers: { "Cache-Control": "no-store" } });
}
