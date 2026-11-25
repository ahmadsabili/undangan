// Uji unit logika murni (tanpa jaringan). Jalankan: npm run test:lib
import assert from "node:assert/strict";
import { zonedToUtc, utcToZonedInput, zonedInputToIso, formatPlainDate, formatTime } from "../src/lib/date.ts";
import { buildIcs, googleCalendarUrl } from "../src/lib/calendar.ts";
import { cleanText, spamReason, sanitizeSvg } from "../src/lib/sanitize.ts";
import { contrastRatio, ensureContrast, toneFor, DEFAULT_THEME, contrastWarnings, buttonColors } from "../src/lib/theme.ts";
import { PALETTES, BUILTIN_PRESETS } from "../src/config/palettes.ts";
import { FONT_OPTIONS } from "../src/config/fonts.ts";

let n = 0;
const t = (name: string, fn: () => void) => {
  fn();
  n++;
  console.log("  ok  " + name);
};

t("08:00 WIB = 01:00 UTC", () => assert.equal(zonedToUtc("2027-06-12", "08:00", "Asia/Jakarta").toISOString(), "2027-06-12T01:00:00.000Z"));
t("08:00 WITA = 00:00 UTC", () => assert.equal(zonedToUtc("2027-06-12", "08:00", "Asia/Makassar").toISOString(), "2027-06-12T00:00:00.000Z"));
t("DST London Juni = UTC+1", () => assert.equal(zonedToUtc("2027-06-12", "10:00", "Europe/London").toISOString(), "2027-06-12T09:00:00.000Z"));
t("round-trip input datetime-local", () => {
  const iso = zonedInputToIso("2027-06-12T08:00", "Asia/Jakarta")!;
  assert.equal(utcToZonedInput(iso, "Asia/Jakarta"), "2027-06-12T08:00");
});
t("format tanggal acara", () => assert.equal(formatPlainDate("2027-06-12"), "Sabtu, 12 Juni 2027"));
t("format jam", () => assert.equal(formatTime("08:00:00"), "08.00"));

t("ICS valid & escape", () => {
  const ics = buildIcs([{ uid: "a@b", title: "Akad, Nikah; A&B", description: "baris1\nbaris2", location: "Jl. X, No. 1", start: new Date("2027-06-12T01:00:00Z"), end: new Date("2027-06-12T03:00:00Z") }]);
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART:20270612T010000Z/);
  assert.match(ics, /SUMMARY:Akad\\, Nikah\; A&B/);
  assert.match(ics, /DESCRIPTION:baris1\\nbaris2/);
  assert.ok(ics.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75));
});
t("Google Calendar URL", () => {
  const u = new URL(googleCalendarUrl({ uid: "x", title: "T", description: "", location: "", start: new Date("2027-06-12T01:00:00Z"), end: new Date("2027-06-12T03:00:00Z") }));
  assert.equal(u.searchParams.get("dates"), "20270612T010000Z/20270612T030000Z");
});

t("cleanText membuang tag & karakter kontrol", () => assert.equal(cleanText("<b>Selamat</b>\u0000 ya <script>x</script>", 100), "Selamat ya x"));
t("spam: tautan ganda", () => assert.equal(spamReason("cek http://a.com dan http://b.com"), "terlalu banyak tautan"));
t("spam: kiriman terlalu cepat", () => assert.equal(spamReason("Selamat", Date.now()), "terlalu cepat"));
t("spam: ucapan normal lolos", () => assert.equal(spamReason("Barakallahu lakuma", Date.now() - 10000), null));
t("SVG: script & handler dibuang", () => {
  const out = sanitizeSvg('<svg onload="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)"><rect/></a></svg>');
  assert.ok(!/script|onload|javascript:/i.test(out), out);
});

t("palet awal lolos kontras teks", () => assert.ok(contrastRatio(DEFAULT_THEME.colors.text, DEFAULT_THEME.colors.background) >= 4.5));
t("ensureContrast menggelapkan aksen emas", () => {
  const c = ensureContrast("#B49A73", "#FAF8F3", 4.5);
  assert.ok(contrastRatio(c, "#FAF8F3") >= 4.5, c);
});
t("tone semua latar section terbaca", () => {
  for (const bg of ["background", "surface", "secondary", "primary"] as const) {
    const tone = toneFor(DEFAULT_THEME, bg);
    assert.ok(contrastRatio(tone.ink, tone.bg) >= 7, `${bg} ink`);
    assert.ok(contrastRatio(tone.muted, tone.bg) >= 4.5, `${bg} muted`);
    assert.ok(contrastRatio(tone.accentInk, tone.bg) >= 4.5, `${bg} accent`);
  }
});

t("semua palet warna lolos cek kontras dan tombol terlihat", () => {
  for (const p of PALETTES) {
    const theme = { ...DEFAULT_THEME, colors: p.colors };
    for (const w of contrastWarnings(theme)) assert.ok(w.ok, `${p.slug}: ${w.label} ${w.ratio.toFixed(2)}`);
    for (const bg of ["background", "secondary", "surface", "primary"] as const) {
      const tone = toneFor(theme, bg);
      const b = buttonColors(theme, tone.bg, bg === "primary");
      assert.ok(contrastRatio(b.bg, tone.bg) >= 1.8, `${p.slug}/${bg}: tombol menyatu dengan latar`);
      assert.ok(contrastRatio(b.fg, b.bg) >= 4.5, `${p.slug}/${bg}: teks tombol kurang kontras`);
    }
  }
});

t("preset bawaan memakai font yang tersedia", () => {
  for (const b of BUILTIN_PRESETS) {
    for (const k of ["heading", "body", "accent"] as const) assert.ok(FONT_OPTIONS.some((f) => f.family === b.tokens.fonts[k] && f.category === k), `${b.slug}: ${b.tokens.fonts[k]}`);
  }
});

console.log(`\n${n} pemeriksaan lolos.`);
