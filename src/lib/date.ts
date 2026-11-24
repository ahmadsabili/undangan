// Utilitas zona waktu tanpa dependensi: memakai Intl.

function offsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** "2027-06-12" + "08:00" di zona tertentu -> Date (UTC). */
export function zonedToUtc(date: string, time: string, timeZone: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "00:00").split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let utc = guess - offsetMs(new Date(guess), timeZone);
  const second = offsetMs(new Date(utc), timeZone);
  utc = guess - second;
  return new Date(utc);
}

/** ISO -> "YYYY-MM-DDTHH:mm" pada zona tertentu (untuk input datetime-local). */
export function utcToZonedInput(iso: string | null | undefined, timeZone: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Nilai datetime-local (zona tertentu) -> ISO UTC. */
export function zonedInputToIso(value: string, timeZone: string) {
  if (!value) return null;
  const [date, time] = value.split("T");
  return zonedToUtc(date, time, timeZone).toISOString();
}

const locale = (lang: string) => (lang === "en" ? "en-GB" : "id-ID");

export function formatLongDate(iso: string | Date, timeZone: string, lang = "id") {
  return new Intl.DateTimeFormat(locale(lang), {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatShortDate(iso: string | Date, timeZone: string, lang = "id") {
  return new Intl.DateTimeFormat(locale(lang), { timeZone, day: "2-digit", month: "2-digit", year: "numeric" })
    .format(new Date(iso))
    .replace(/\//g, " . ");
}

/** Tanggal acara (YYYY-MM-DD, tanpa zona) -> "Sabtu, 12 Juni 2027". */
export function formatPlainDate(date: string, lang = "id") {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(locale(lang), {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatTime(t: string | null | undefined) {
  return t ? t.slice(0, 5).replace(":", ".") : "";
}

export function tzAbbreviation(timeZone: string) {
  const map: Record<string, string> = { "Asia/Jakarta": "WIB", "Asia/Pontianak": "WIB", "Asia/Makassar": "WITA", "Asia/Jayapura": "WIT" };
  if (map[timeZone]) return map[timeZone];
  const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" })
    .formatToParts(new Date())
    .find((p) => p.type === "timeZoneName");
  return part?.value ?? timeZone;
}

export function relativeTime(iso: string, lang = "id") {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale(lang), { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return new Intl.DateTimeFormat(locale(lang), { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export const TIMEZONES = [
  { value: "Asia/Jakarta", label: "WIB (Asia/Jakarta)" },
  { value: "Asia/Makassar", label: "WITA (Asia/Makassar)" },
  { value: "Asia/Jayapura", label: "WIT (Asia/Jayapura)" },
  { value: "Asia/Singapore", label: "Asia/Singapore" },
  { value: "Asia/Kuala_Lumpur", label: "Asia/Kuala_Lumpur" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "Europe/Amsterdam", label: "Europe/Amsterdam" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "Australia/Sydney", label: "Australia/Sydney" },
];
