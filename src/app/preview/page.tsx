import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Invitation } from "@/components/invitation/Invitation";
import { StatusScreen } from "@/components/invitation/StatusScreen";
import { ThemeAssets } from "@/components/invitation/ThemeAssets";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";
import { getDraftInvitation } from "@/services/invitation";

export const metadata: Metadata = { title: "Preview draft", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ to?: string; open?: string }> };

// Pratinjau draft (belum dipublikasikan). Hanya untuk admin.
export default async function PreviewPage({ searchParams }: Props) {
  if (isSupabaseConfigured()) {
    const supabase = await getServerSupabase();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) redirect("/admin/login");
  }
  const res = await getDraftInvitation();
  if (res.status !== "ok") return <StatusScreen kind={res.status === "unpublished" ? "error" : res.status} message={"message" in res ? res.message : undefined} />;
  const params = await searchParams;
  const cover = res.data.sections.find((x) => x.key === "cover")?.content as { default_guest?: string } | undefined;
  const name = (params.to ?? "").slice(0, 80) || cover?.default_guest || "Tamu Undangan";
  return (
    <>
      <ThemeAssets data={res.data} />
      <Invitation data={res.data} guest={{ name, code: null, maxPax: res.data.settings.rsvp_max_pax, rsvp: null }} mode="preview" startOpen={params.open === "1"} />
    </>
  );
}
