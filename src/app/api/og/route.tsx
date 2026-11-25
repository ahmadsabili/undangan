import { ImageResponse } from "next/og";
import { getPublishedInvitation } from "@/services/invitation";
import { customOgJpeg, OG_H, OG_W, renderOgCard } from "@/services/og-card";

export const runtime = "nodejs";

// Gambar preview tautan bila admin tidak mengunggah gambar share sendiri.
// Mengikuti template, warna, font, dan foto undangan yang sudah dipublish.
// Disajikan sebagai JPEG agar ringan (WhatsApp sering mengabaikan gambar besar).
export async function GET() {
  const res = await getPublishedInvitation();
  const data = res.status === "ok" ? res.data : null;
  const headers = { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" };
  // Gambar share yang diunggah admin diutamakan, tetap disajikan sebagai JPEG 1200 x 630.
  const custom = data ? await customOgJpeg(data) : null;
  if (custom) return new Response(new Uint8Array(custom), { headers: { ...headers, "Content-Type": "image/jpeg" } });
  let image: ImageResponse;
  if (data) {
    const { node, fonts } = await renderOgCard(data);
    image = new ImageResponse(<>{node}</>, { width: OG_W, height: OG_H, fonts: fonts.length ? fonts : undefined });
  } else {
    image = new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#454B40", color: "#FAF8F3", fontSize: 48 }}>Undangan Pernikahan</div>, { width: OG_W, height: OG_H });
  }
  const png = Buffer.from(await image.arrayBuffer());
  try {
    const sharp = (await import("sharp")).default;
    const jpg = await sharp(png).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
    return new Response(new Uint8Array(jpg), { headers: { ...headers, "Content-Type": "image/jpeg" } });
  } catch {
    return new Response(new Uint8Array(png), { headers: { ...headers, "Content-Type": "image/png" } });
  }
}
