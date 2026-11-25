import Link from "next/link";

// Layar status jujur saat undangan belum bisa ditampilkan.
export function StatusScreen({ kind, message }: { kind: "not_configured" | "unpublished" | "error" | "private"; message?: string }) {
  const copy = {
    not_configured: {
      title: "Supabase belum dikonfigurasi",
      body: "Isi NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, dan SUPABASE_SERVICE_ROLE_KEY di file .env.local (atau Environment Variables di Vercel), jalankan migration di folder supabase/, lalu muat ulang halaman ini. Panduan lengkap ada di README.",
    },
    unpublished: {
      title: "Undangan belum dipublikasikan",
      body: "Halaman ini akan tersedia setelah pemilik undangan menekan tombol Publish di dashboard.",
    },
    private: {
      title: "Undangan ini bersifat pribadi",
      body: "Silakan buka undangan melalui tautan yang dikirimkan khusus untuk Anda. Bila tautan Anda tidak berfungsi, hubungi pengirim undangan.",
    },
    error: {
      title: "Undangan sedang tidak dapat dimuat",
      body: "Silakan muat ulang halaman beberapa saat lagi.",
    },
  }[kind];
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#FAF8F3] px-6 text-[#292929]" style={{ fontFamily: "Georgia, serif" }}>
      <div className="max-w-md text-center">
        <div aria-hidden="true" className="mx-auto h-px w-12 bg-[#B49A73]" />
        <h1 className="mt-8 text-4xl leading-tight">{copy.title}</h1>
        <p className="mt-5 font-sans text-[0.95rem] leading-relaxed text-[#4a4a44]">{copy.body}</p>
        {message && kind === "error" && process.env.NODE_ENV !== "production" && (
          <p className="mt-4 break-words font-mono text-xs text-[#8a2f22]">{message}</p>
        )}
        {(kind === "not_configured" || kind === "unpublished") && (
          <Link href="/admin" className="mt-8 inline-flex min-h-[44px] items-center border border-[#454B40] px-5 font-sans text-sm text-[#454B40] hover:bg-[#454B40] hover:text-white">
            Buka dashboard admin
          </Link>
        )}
      </div>
    </main>
  );
}
