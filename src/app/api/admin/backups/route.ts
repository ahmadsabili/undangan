import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";
import { createBackup, listBackups, readBackup } from "@/services/auto-backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function adminDb() {
  const supabase = await getServerSupabase();
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) return null;
  return getServiceSupabase();
}

const denied = () => NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
const fail = (e: unknown) => NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });

// GET: daftar backup otomatis, atau ?file=NAMA untuk mengunduh satu file.
export async function GET(req: Request) {
  const db = await adminDb();
  if (!db) return denied();
  const file = new URL(req.url).searchParams.get("file");
  try {
    if (file) {
      const text = await readBackup(db, file);
      return new NextResponse(text, {
        headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="undangan-${file}"`, "Cache-Control": "no-store" },
      });
    }
    return NextResponse.json({ files: await listBackups(db) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return fail(e);
  }
}

// POST: buat backup sekarang.
export async function POST() {
  const db = await adminDb();
  if (!db) return denied();
  try {
    return NextResponse.json({ file: await createBackup(db) });
  } catch (e) {
    return fail(e);
  }
}
