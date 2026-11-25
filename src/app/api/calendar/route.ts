import { buildIcs } from "@/lib/calendar";
import { calendarEventsFrom } from "@/lib/calendar-events";
import { getAccessMode, getGuestContext, getPublishedInvitation } from "@/services/invitation";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const res = await getPublishedInvitation();
  if (res.status !== "ok") return new Response("Undangan belum tersedia.", { status: 404 });
  let data = res.data;
  // Fitur sesi: file kalender hanya berisi acara milik tamu berkode.
  const code = new URL(req.url).searchParams.get("guest") ?? undefined;
  const access = await getAccessMode();
  const guest = code ? await getGuestContext({ guest: code }, "", data.settings.rsvp_max_pax) : null;
  if (access === "code" && !guest?.code) return new Response("Undangan ini bersifat pribadi.", { status: 403 });
  if (guest) {
    if (guest.eventIds?.length) {
      const events = data.events.filter((e) => guest.eventIds!.includes(e.id));
      if (events.length) data = { ...data, events };
    }
  }
  const ics = buildIcs(calendarEventsFrom(data));
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="undangan-pernikahan.ics"',
      "Cache-Control": code ? "private, no-store" : "public, max-age=300",
    },
  });
}
