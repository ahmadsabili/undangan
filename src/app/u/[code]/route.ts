import { NextResponse } from "next/server";

// Tautan pendek untuk kartu undangan cetak: /u/KODE -> /?guest=KODE.
// Selalu aktif agar kartu yang sudah tercetak tetap berfungsi.
export function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  return params.then(({ code }) => {
    const c = code.trim().toUpperCase();
    const target = new URL(/^[A-Z0-9]{6,16}$/.test(c) ? `/?guest=${c}` : "/", req.url);
    return NextResponse.redirect(target, 307);
  });
}
