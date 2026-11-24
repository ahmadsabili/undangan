import { zonedToUtc } from "@/lib/date";
import type { CalendarEvent } from "@/lib/calendar";
import type { InvitationData } from "@/types/invitation";

/** Event kalender dari rangkaian acara, atau dari tanggal pernikahan bila acara kosong. */
export function calendarEventsFrom(data: InvitationData): CalendarEvent[] {
  const s = data.settings;
  const cd = (data.sections.find((x) => x.key === "countdown")?.content ?? {}) as {
    calendar_title?: string;
    calendar_description?: string;
    duration_hours?: number;
  };
  const baseTitle = cd.calendar_title || s.site_title;
  const description = cd.calendar_description || s.meta_description;
  if (data.events.length) {
    return data.events.map((e) => {
      const start = zonedToUtc(e.event_date, e.start_time, s.timezone);
      const end = e.end_time ? zonedToUtc(e.event_date, e.end_time, s.timezone) : new Date(start.getTime() + 2 * 3600e3);
      return {
        uid: `${e.id}@undangan`,
        title: `${e.title}: ${baseTitle}`,
        description,
        location: [e.venue_name, e.address].filter(Boolean).join(", "),
        start,
        end: end > start ? end : new Date(start.getTime() + 2 * 3600e3),
      };
    });
  }
  const start = new Date(s.wedding_date);
  const hours = Number(cd.duration_hours) > 0 ? Number(cd.duration_hours) : 4;
  return [{ uid: "wedding@undangan", title: baseTitle, description, location: "", start, end: new Date(start.getTime() + hours * 3600e3) }];
}
