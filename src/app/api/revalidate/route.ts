import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { INVITATION_TAG } from "@/services/invitation";

// Dipanggil dashboard setelah Publish / ubah status publikasi agar cache halaman publik segar.
export async function POST() {
  const supabase = await getServerSupabase();
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  revalidateTag(INVITATION_TAG);
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
