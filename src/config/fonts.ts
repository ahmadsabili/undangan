// Font yang bisa dipilih di Theme Editor. Semua tersedia di Google Fonts.
// Heading: serif bernuansa editorial. Body: sans yang tenang untuk teks panjang di ponsel.
// Accent: skrip tipis, dipakai hemat (ampersand, tanda tangan).

export interface FontOption {
  family: string;
  axes: string; // segmen query css2 setelah ":"
  category: "heading" | "body" | "accent";
}

export const FONT_OPTIONS: FontOption[] = [
  { family: "Cormorant Garamond", axes: "ital,wght@0,400;0,500;0,600;1,400;1,500", category: "heading" },
  { family: "Playfair Display", axes: "ital,wght@0,400;0,500;0,600;1,400", category: "heading" },
  { family: "EB Garamond", axes: "ital,wght@0,400;0,500;0,600;1,400", category: "heading" },
  { family: "Bodoni Moda", axes: "ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400", category: "heading" },
  { family: "Libre Caslon Text", axes: "ital,wght@0,400;0,700;1,400", category: "heading" },
  { family: "Marcellus", axes: "", category: "heading" },
  { family: "DM Sans", axes: "wght@400;500;600", category: "body" },
  { family: "Inter", axes: "wght@400;500;600", category: "body" },
  { family: "Manrope", axes: "wght@400;500;600", category: "body" },
  { family: "Jost", axes: "wght@400;500;600", category: "body" },
  { family: "Lato", axes: "wght@400;700", category: "body" },
  { family: "Pinyon Script", axes: "", category: "accent" },
  { family: "Great Vibes", axes: "", category: "accent" },
  { family: "Parisienne", axes: "", category: "accent" },
  { family: "Allura", axes: "", category: "accent" },
];

export function googleFontsHref(families: string[], extra: string[] = []) {
  const uniq = Array.from(new Set([...families, ...extra].filter(Boolean)));
  const parts = uniq.map((f) => {
    const opt = FONT_OPTIONS.find((o) => o.family === f);
    const name = f.trim().replace(/\s+/g, "+");
    if (f === "Amiri") return "family=Amiri:wght@400;700";
    return opt?.axes ? `family=${name}:${opt.axes}` : `family=${name}`;
  });
  return `https://fonts.googleapis.com/css2?${parts.join("&")}&display=swap`;
}
