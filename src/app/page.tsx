import type { Metadata, Viewport } from "next";
import { Invitation } from "@/components/invitation/Invitation";
import { StatusScreen } from "@/components/invitation/StatusScreen";
import { ThemeAssets } from "@/components/invitation/ThemeAssets";
import { getGuestContext, getPublishedInvitation } from "@/services/invitation";
import { invitationMetadata, invitationViewport } from "@/services/metadata";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ to?: string | string[]; guest?: string | string[] }> };

export async function generateMetadata(): Promise<Metadata> {
  const res = await getPublishedInvitation();
  if (res.status !== "ok") return { title: "Undangan Pernikahan", robots: { index: false, follow: false } };
  return invitationMetadata(res.data);
}

export async function generateViewport(): Promise<Viewport> {
  const res = await getPublishedInvitation();
  return invitationViewport(res.status === "ok" ? res.data : null);
}

export default async function Page({ searchParams }: Props) {
  const res = await getPublishedInvitation();
  if (res.status !== "ok") return <StatusScreen kind={res.status} message={res.status === "error" ? res.message : undefined} />;
  const data = res.data;
  const cover = data.sections.find((x) => x.key === "cover")?.content as { default_guest?: string } | undefined;
  const guest = await getGuestContext(await searchParams, cover?.default_guest || "Tamu Undangan", data.settings.rsvp_max_pax);
  return (
    <>
      <ThemeAssets data={data} />
      <Invitation data={data} guest={guest} />
    </>
  );
}
