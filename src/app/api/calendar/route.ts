import { buildIcs } from "@/lib/calendar";
import { calendarEventsFrom } from "@/lib/calendar-events";
import { getPublishedInvitation } from "@/services/invitation";

export async function GET() {
  const res = await getPublishedInvitation();
  if (res.status !== "ok") return new Response("Undangan belum tersedia.", { status: 404 });
  const ics = buildIcs(calendarEventsFrom(res.data));
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="undangan-pernikahan.ics"',
      "Cache-Control": "public, max-age=300",
    },
  });
}
