import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { backupIfDue } from "@/services/auto-backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Dijalankan cron Vercel sekali sehari (lihat vercel.json):
// 1. Query ringan ke database agar proyek Supabase gratis tidak dijeda karena sepi.
// 2. Backup otomatis bila backup terakhir sudah berumur sekitar seminggu.
// Bila CRON_SECRET diisi di Vercel, hanya panggilan cron Vercel yang diterima.
// Tanpa CRON_SECRET pun aman: route ini tidak membuka data dan backup tidak bisa dipicu berulang.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  }
  const db = getServiceSupabase();
  if (!db) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY belum diisi." }, { status: 500 });

  const ping = await db.from("wedding_settings").select("id").eq("id", 1).maybeSingle();
  const result: Record<string, unknown> = { keepalive: ping.error ? `gagal: ${ping.error.message}` : "ok" };
  try {
    const b = await backupIfDue(db);
    result.backup = b.created ? `dibuat: ${b.last}` : `belum perlu (terakhir ${b.last})`;
  } catch (e) {
    result.backup = `gagal: ${e instanceof Error ? e.message : String(e)}`;
  }
  const ok = !String(result.keepalive).startsWith("gagal") && !String(result.backup).startsWith("gagal");
  return NextResponse.json(result, { status: ok ? 200 : 500 });
}
