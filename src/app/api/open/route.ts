import { NextResponse } from "next/server";
import { clientKey } from "@/lib/ip";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { jsonError, rateLimited, readJson, sameOrigin } from "@/services/public-submit";

export const dynamic = "force-dynamic";

// Fitur "sudah dibuka". Fungsi database mengabaikan panggilan bila fitur nonaktif.
export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Permintaan ditolak.", 403);
  const body = (await readJson(req, 500)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!/^[A-Z0-9]{6,16}$/.test(code)) return jsonError("Kode tidak valid.", 400);
  const db = getServiceSupabase();
  if (!db) return new NextResponse(null, { status: 204 });
  if (await rateLimited(db, clientKey(req.headers, "open"), 30, 600)) return jsonError("Terlalu banyak permintaan.", 429);
  await db.rpc("record_guest_open", { p_code: code });
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
