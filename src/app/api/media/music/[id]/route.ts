import { getPublishedInvitation } from "@/services/invitation";

export const runtime = "nodejs";

// Musik latar disajikan lewat CDN Vercel, bukan langsung dari Supabase Storage,
// agar kuota egress Supabase (5 GB/bulan di paket gratis) tidak habis oleh
// pemutaran berulang. Supabase hanya dihubungi saat cache CDN kosong.
// Selalu 200 dengan isi utuh (tanpa Range) supaya aman di-cache; pemutar di
// browser mengunduhnya sebagai blob. Respons di atas 10 MB tidak di-cache CDN.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const res = await getPublishedInvitation();
  if (res.status !== "ok") return new Response("Tidak tersedia.", { status: 404 });
  const s = res.data.settings;
  const media = s.music_enabled && s.music_media_id === id ? res.data.media[id] : undefined;
  if (!media || !/^https?:\/\//.test(media.url)) return new Response("Tidak ditemukan.", { status: 404 });

  const upstream = await fetch(media.url, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) return new Response("Gagal memuat musik.", { status: 502 });
  const headers = new Headers({
    "Content-Type": upstream.headers.get("content-type") || media.mime_type || "audio/mpeg",
    "Cache-Control": "public, max-age=604800",
    // Id media berganti bila file diganti, jadi aman disimpan lama di CDN.
    "Vercel-CDN-Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });
  const len = upstream.headers.get("content-length");
  if (len) headers.set("Content-Length", len);
  return new Response(upstream.body, { status: 200, headers });
}
