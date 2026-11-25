import "server-only";
import { unstable_cache } from "next/cache";
import { readFile } from "node:fs/promises";
import { isSupabaseConfigured } from "@/lib/env";
import { getPublicSupabase, getServerSupabase } from "@/lib/supabase/server";
import { normalizeInvitation } from "@/services/normalize";
import type { GuestContext, InvitationData } from "@/types/invitation";

export const INVITATION_TAG = "invitation";

export type LoadResult =
  | { status: "ok"; data: InvitationData }
  | { status: "unpublished" }
  | { status: "not_configured" }
  | { status: "error"; message: string };

// Mode pratinjau desain lokal: hanya aktif di development bila Supabase belum diisi
// dan DESIGN_PREVIEW_FIXTURE menunjuk ke file JSON snapshot. Tidak aktif di production.
async function loadFixture(): Promise<InvitationData | null> {
  const path = process.env.DESIGN_PREVIEW_FIXTURE;
  if (process.env.NODE_ENV === "production" || !path) return null;
  try {
    return normalizeInvitation(JSON.parse(await readFile(path, "utf8")));
  } catch {
    return null;
  }
}

export function isFixtureMode() {
  return !isSupabaseConfigured() && process.env.NODE_ENV !== "production" && Boolean(process.env.DESIGN_PREVIEW_FIXTURE);
}

const fetchPublished = unstable_cache(
  async () => {
    const { data, error } = await getPublicSupabase().rpc("get_published_invitation");
    if (error) throw new Error(error.message);
    return data as unknown;
  },
  ["published-invitation"],
  { tags: [INVITATION_TAG], revalidate: 300 },
);

export async function getPublishedInvitation(): Promise<LoadResult> {
  if (!isSupabaseConfigured()) {
    const fixture = await loadFixture();
    return fixture ? { status: "ok", data: fixture } : { status: "not_configured" };
  }
  try {
    const raw = await fetchPublished();
    const data = normalizeInvitation(raw);
    return data ? { status: "ok", data } : { status: "unpublished" };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Gagal memuat undangan." };
  }
}

export async function getDraftInvitation(): Promise<LoadResult> {
  if (!isSupabaseConfigured()) {
    const fixture = await loadFixture();
    return fixture ? { status: "ok", data: fixture } : { status: "not_configured" };
  }
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.rpc("get_draft_invitation");
  if (error) return { status: "error", message: error.message };
  const parsed = normalizeInvitation(data);
  return parsed ? { status: "ok", data: parsed } : { status: "error", message: "Draft kosong." };
}

/** Bangun konteks tamu dari ?guest=KODE (diutamakan) atau ?to=Nama. */
export async function getGuestContext(
  params: { guest?: string | string[]; to?: string | string[] },
  defaultName: string,
  defaultMaxPax: number,
): Promise<GuestContext> {
  const code = typeof params.guest === "string" ? params.guest.trim().toUpperCase() : "";
  if (code && /^[A-Z0-9]{6,16}$/.test(code) && isSupabaseConfigured()) {
    const { data } = await getPublicSupabase().rpc("get_guest_by_code", { p_code: code });
    if (data && typeof data === "object") {
      const g = data as { name: string; code: string; max_pax: number; rsvp: GuestContext["rsvp"]; event_ids?: string[] | null };
      return { name: g.name, code: g.code, maxPax: g.max_pax, rsvp: g.rsvp ?? null, eventIds: g.event_ids?.length ? g.event_ids : null };
    }
  }
  const raw = typeof params.to === "string" ? params.to : "";
  const name = raw.replace(/[<>{}\u0000-\u001F]/g, "").trim().slice(0, 80);
  return { name: name || defaultName, code: null, maxPax: defaultMaxPax, rsvp: null, eventIds: null };
}
