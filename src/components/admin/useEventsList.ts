"use client";

import { useEffect, useState } from "react";
import { formatPlainDate, formatTime, tzAbbreviation } from "@/lib/date";
import { db } from "@/services/admin";

export interface EventLite {
  id: string;
  title: string;
  event_date: string;
  start_time: string;
  end_time: string | null;
  venue_name: string;
  capacity: number | null;
}

/** Daftar acara + teks ringkas untuk pesan WhatsApp ({acara_tamu}). */
export function useEventsList() {
  const [events, setEvents] = useState<EventLite[]>([]);
  const [tz, setTz] = useState("Asia/Jakarta");
  useEffect(() => {
    void (async () => {
      const [e, s] = await Promise.all([
        db().from("wedding_events").select("id, title, event_date, start_time, end_time, venue_name, capacity").order("sort_order"),
        db().from("wedding_settings").select("timezone").eq("id", 1).single(),
      ]);
      if (e.data) setEvents(e.data as EventLite[]);
      if (s.data) setTz(s.data.timezone);
    })();
  }, []);

  const forGuest = (eventIds: string[] | null | undefined) => (eventIds?.length ? events.filter((e) => eventIds.includes(e.id)) : events);

  const describe = (eventIds: string[] | null | undefined) =>
    forGuest(eventIds)
      .map((e) => `${e.title}: ${formatPlainDate(e.event_date)}, pukul ${formatTime(e.start_time)}${e.end_time ? `-${formatTime(e.end_time)}` : ""} ${tzAbbreviation(tz)}${e.venue_name ? `, ${e.venue_name}` : ""}`)
      .join("\n");

  const titles = (eventIds: string[] | null | undefined) => (eventIds?.length ? forGuest(eventIds).map((e) => e.title) : []);

  return { events, forGuest, describe, titles };
}
