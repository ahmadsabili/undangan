import type { ThemeTokens } from "@/types/invitation";

// Palet warna cepat. Hanya mengganti 6 warna tema; font, gaya, dan template tetap.
// Semua palet lolos pemeriksaan kontras (lihat scripts/test-lib.ts).
export type Palette = { slug: string; name: string; group: "terang" | "pastel" | "gelap"; colors: ThemeTokens["colors"] };

const p = (slug: string, name: string, group: Palette["group"], primary: string, secondary: string, accent: string, background: string, surface: string, text: string): Palette => ({
  slug,
  name,
  group,
  colors: { primary, secondary, accent, background, surface, text },
});

export const PALETTE_GROUPS: { key: Palette["group"]; label: string }[] = [
  { key: "terang", label: "Netral & bumi" },
  { key: "pastel", label: "Pastel kekinian" },
  { key: "gelap", label: "Gelap mewah" },
];

export const PALETTES: Palette[] = [
  p("sage-linen", "Sage Linen", "terang", "#5B6B55", "#E4E8DC", "#A89268", "#F7F7F2", "#FFFFFF", "#26302A"),
  p("mocha-mousse", "Mocha Mousse", "terang", "#6B4F3F", "#EADBCD", "#A47864", "#F8F3EE", "#FFFFFF", "#2E221C"),
  p("terracotta-sun", "Terracotta", "terang", "#A0522D", "#F1DDCB", "#C98B5B", "#FBF5EE", "#FFFFFF", "#3A2418"),
  p("olive-grove", "Olive Grove", "terang", "#5A5A2E", "#E6E3CF", "#9E9558", "#F8F7F0", "#FFFFFF", "#2A2A17"),
  p("burgundy-wine", "Burgundy Wine", "terang", "#6D1F2F", "#F0DFDC", "#B08A5A", "#FAF6F3", "#FFFFFF", "#2B1A1C"),
  p("charcoal-sand", "Charcoal Sand", "terang", "#2E2E2C", "#E8E1D5", "#A08C6C", "#F6F3ED", "#FFFFFF", "#1E1E1C"),
  p("sky-silver", "Sky & Silver", "terang", "#2F4F6F", "#E3E8EC", "#9AA5AE", "#F7F9FA", "#FFFFFF", "#1D2733"),
  p("dusty-rose", "Dusty Rose", "pastel", "#8A5A5E", "#F2DFDD", "#C4918F", "#FCF6F5", "#FFFFFF", "#3B2A2C"),
  p("blush-gold", "Blush & Gold", "pastel", "#7A4E55", "#F5E4E1", "#C2A267", "#FDF8F6", "#FFFFFF", "#36262A"),
  p("dusty-blue", "Dusty Blue", "pastel", "#3F5873", "#DDE5EE", "#8FA6BE", "#F6F8FA", "#FFFFFF", "#1F2A36"),
  p("lavender-haze", "Lavender Haze", "pastel", "#5E4F7A", "#E8E2F1", "#A595C4", "#FAF8FC", "#FFFFFF", "#2B2438"),
  p("butter-cream", "Butter Cream", "pastel", "#6E6235", "#F4ECCB", "#C7A84F", "#FDFBF2", "#FFFFFF", "#2F2A17"),
  p("peach-blossom", "Peach Blossom", "pastel", "#9C5643", "#FBE3D6", "#E5A184", "#FFF8F4", "#FFFFFF", "#3D241C"),
  p("mint-fresh", "Mint Fresh", "pastel", "#2F6B5E", "#DCEFE8", "#7FB8A4", "#F5FBF8", "#FFFFFF", "#1D332D"),
  p("noir-gold", "Noir & Gold", "gelap", "#3A332A", "#26231F", "#C9A45C", "#121110", "#1B1A18", "#F1EBDD"),
  p("emerald-gold", "Emerald & Gold", "gelap", "#1F5444", "#183A30", "#CBA968", "#0D1F1A", "#132A23", "#EEE8D8"),
  p("midnight-navy", "Midnight Navy", "gelap", "#2A4170", "#1C2A47", "#C8A96A", "#0E1626", "#142036", "#ECE7DC"),
  p("bordeaux-night", "Bordeaux Night", "gelap", "#6B2232", "#3A1A20", "#D2A86E", "#1A0E11", "#241418", "#F3E7E0"),
  p("plum-velvet", "Plum Velvet", "gelap", "#5A3360", "#33213A", "#D4A38A", "#170F1A", "#211625", "#F2E8EE"),
  p("onyx-silver", "Onyx & Silver", "gelap", "#3A3A3A", "#222222", "#BDBDBD", "#0F0F0F", "#191919", "#F5F5F5"),
];

// Preset bawaan aplikasi (tidak perlu migration). Ditampilkan setelah preset dari database.
export type BuiltinPreset = { slug: string; name: string; description: string; tokens: ThemeTokens };

function preset(slug: string, name: string, description: string, palette: string, fonts: ThemeTokens["fonts"], style: Partial<ThemeTokens>): BuiltinPreset {
  const colors = PALETTES.find((x) => x.slug === palette)!.colors;
  return { slug, name, description, tokens: { layout: "editorial", ornamentMediaId: null, fontScale: 1, radius: 2, buttonStyle: "solid", navStyle: "floating", animation: "normal", overlay: 0.42, ...style, colors, fonts } };
}

export const BUILTIN_PRESETS: BuiltinPreset[] = [
  preset("noir-deco", "Noir Deco", "Hitam pekat dan emas dengan huruf bergaya prasasti. Paling serasi dengan Art Deco Mewah.", "noir-gold",
    { heading: "Marcellus", body: "Jost", accent: "Pinyon Script" }, { radius: 0, buttonStyle: "solid", navStyle: "floating", animation: "subtle", overlay: 0.55 }),
  preset("emerald-royale", "Emerald Royale", "Hijau zamrud gelap dengan emas, megah dan formal.", "emerald-gold",
    { heading: "Gilda Display", body: "Manrope", accent: "Great Vibes" }, { radius: 0, buttonStyle: "solid", navStyle: "floating", animation: "subtle", overlay: 0.5 }),
  preset("bordeaux-luxe", "Bordeaux Luxe", "Merah anggur gelap dan emas hangat untuk resepsi malam.", "bordeaux-night",
    { heading: "Gilda Display", body: "Lato", accent: "Great Vibes" }, { radius: 0, buttonStyle: "outline", navStyle: "floating", animation: "normal", overlay: 0.5 }),
  preset("midnight-glam", "Midnight Glam", "Biru malam dan emas dengan huruf ramping.", "midnight-navy",
    { heading: "Bellefair", body: "Outfit", accent: "Pinyon Script" }, { radius: 4, buttonStyle: "solid", navStyle: "floating", animation: "normal", overlay: 0.5 }),
  preset("soft-arch-blush", "Soft Blush", "Merah muda pudar yang lembut, pas untuk Lengkung Modern.", "dusty-rose",
    { heading: "Bellefair", body: "Plus Jakarta Sans", accent: "Ballet" }, { radius: 18, buttonStyle: "solid", navStyle: "floating", animation: "normal", overlay: 0.36 }),
  preset("sage-arch", "Sage Garden", "Hijau sage dan linen, segar dan kekinian.", "sage-linen",
    { heading: "Prata", body: "Figtree", accent: "Mrs Saint Delafield" }, { radius: 20, buttonStyle: "solid", navStyle: "floating", animation: "normal", overlay: 0.38 }),
  preset("lavender-dream", "Lavender Dream", "Ungu lavender pastel yang manis dan tenang.", "lavender-haze",
    { heading: "Cormorant Garamond", body: "Figtree", accent: "Ballet" }, { radius: 16, buttonStyle: "solid", navStyle: "floating", animation: "normal", overlay: 0.36 }),
  preset("mocha-bento", "Mocha Modern", "Cokelat mocha dan krem dengan huruf sans modern, cocok untuk Bento.", "mocha-mousse",
    { heading: "Prata", body: "Outfit", accent: "Allura" }, { radius: 14, buttonStyle: "solid", navStyle: "bar", animation: "normal", overlay: 0.4 }),
  preset("terracotta-modern", "Terracotta Modern", "Terakota hangat ala rustic modern.", "terracotta-sun",
    { heading: "Libre Caslon Text", body: "Plus Jakarta Sans", accent: "Parisienne" }, { radius: 12, buttonStyle: "solid", navStyle: "floating", animation: "expressive", overlay: 0.4 }),
  preset("dusty-blue-classic", "Dusty Blue", "Biru pudar dan perak, bersih dan elegan.", "dusty-blue",
    { heading: "Playfair Display", body: "Manrope", accent: "Great Vibes" }, { radius: 6, buttonStyle: "outline", navStyle: "floating", animation: "normal", overlay: 0.4 }),
];
