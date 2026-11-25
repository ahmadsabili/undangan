import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccessMode } from "@/types/invitation";

/** Mode akses untuk route API (memakai klien service role yang sudah ada). */
export async function accessModeFor(db: SupabaseClient): Promise<AccessMode> {
  const { data, error } = await db.rpc("invitation_access");
  if (error) return "open";
  return data === "link" || data === "code" ? data : "open";
}

/** Di mode "code", kiriman publik wajib membawa kode tamu yang terdaftar. */
export async function validGuestCode(db: SupabaseClient, code: string | null | undefined) {
  const c = (code ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6,16}$/.test(c)) return false;
  const { data } = await db.from("guests").select("id").eq("code", c).maybeSingle();
  return Boolean(data);
}
