// Ekspor untuk undangan fisik: PDF kartu/stiker QR dan ZIP (gambar QR + CSV untuk mail merge).
// Tanpa alias import agar bisa diuji langsung dengan Node.
import QRCode from "qrcode";

export interface PrintGuest {
  name: string;
  code: string;
  category: string;
}

export type PrintLayout = "card" | "sticker";

export function shortLink(origin: string, code: string) {
  return `${origin.replace(/\/$/, "")}/u/${code}`;
}

/** Tampilan tautan tanpa https:// agar ringkas di kertas. */
export function displayLink(url: string) {
  return url.replace(/^https?:\/\//, "");
}

function qrDataUrl(text: string, px = 512) {
  return QRCode.toDataURL(text, { width: px, margin: 1, errorCorrectionLevel: "M", color: { dark: "#1E1E1E", light: "#FFFFFF" } });
}

// Font standar PDF (Helvetica) hanya memuat huruf Latin; karakter lain diganti agar tidak rusak.
function latin(s: string) {
  return s.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^\x20-\x7E -ÿ]/g, "?");
}

const LAYOUTS = {
  // 10 kartu per A4 (85 x 50 mm), muat di kartu undangan atau diselipkan.
  card: { cols: 2, rows: 5, w: 90, h: 52, gapX: 6, gapY: 4 },
  // 24 stiker per A4 (45 x 45 mm), ditempel di kartu undangan cetak.
  sticker: { cols: 4, rows: 6, w: 45, h: 45, gapX: 3, gapY: 2 },
} as const;

export async function buildPrintPdf(
  guests: PrintGuest[],
  opts: { layout: PrintLayout; origin: string; onProgress?: (done: number) => void },
): Promise<ArrayBuffer> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const L = LAYOUTS[opts.layout];
  const perPage = L.cols * L.rows;
  const x0 = (210 - (L.cols * L.w + (L.cols - 1) * L.gapX)) / 2;
  const y0 = (297 - (L.rows * L.h + (L.rows - 1) * L.gapY)) / 2;

  for (let i = 0; i < guests.length; i++) {
    const g = guests[i];
    if (i > 0 && i % perPage === 0) doc.addPage();
    const slot = i % perPage;
    const x = x0 + (slot % L.cols) * (L.w + L.gapX);
    const y = y0 + Math.floor(slot / L.cols) * (L.h + L.gapY);
    const link = shortLink(opts.origin, g.code);
    const qr = await qrDataUrl(link);

    // garis potong tipis
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, L.w, L.h, 2, 2);
    doc.setTextColor(30, 30, 30);

    if (opts.layout === "card") {
      const q = 36;
      doc.addImage(qr, "PNG", x + L.w - q - 5, y + (L.h - q) / 2 - 2, q, q);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(110, 110, 110);
      doc.text("Kepada Yth.", x + 5, y + 9);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      const nameLines = doc.splitTextToSize(latin(g.name), L.w - q - 14).slice(0, 3);
      doc.text(nameLines, x + 5, y + 15);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(110, 110, 110);
      if (g.category) doc.text(doc.splitTextToSize(latin(g.category), L.w - q - 14).slice(0, 1), x + 5, y + 15 + nameLines.length * 4.6 + 1);
      // Tautan dipecah di "/u/" agar kode tidak terpotong saat diketik tamu.
      doc.text("Pindai QR atau buka:", x + 5, y + L.h - 13);
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(7);
      doc.text(doc.splitTextToSize(displayLink(opts.origin), L.w - q - 12)[0] ?? "", x + 5, y + L.h - 9);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(`/u/${g.code}`, x + 5, y + L.h - 5);
    } else {
      const q = 31;
      doc.addImage(qr, "PNG", x + (L.w - q) / 2, y + 2.5, q, q);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      const name = doc.splitTextToSize(latin(g.name), L.w - 4)[0] ?? "";
      doc.text(name, x + L.w / 2, y + q + 6, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.8);
      doc.setTextColor(90, 90, 90);
      doc.text(doc.splitTextToSize(displayLink(opts.origin), L.w - 3)[0] ?? "", x + L.w / 2, y + q + 9, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(30, 30, 30);
      doc.text(`/u/${g.code}`, x + L.w / 2, y + q + 11.6, { align: "center" });
    }
    opts.onProgress?.(i + 1);
  }
  return doc.output("arraybuffer");
}

function csvCell(v: string) {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[",\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function fileSafe(s: string) {
  return (
    s
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "tamu"
  );
}

/** ZIP berisi qr/KODE-nama.png + daftar-cetak.csv (untuk mail merge di percetakan). */
export async function buildQrZip(guests: PrintGuest[], opts: { origin: string; onProgress?: (done: number) => void }): Promise<Uint8Array> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const folder = zip.folder("qr")!;
  const rows = [["nama", "kategori", "kode", "tautan_pendek", "file_qr"].join(",")];
  for (let i = 0; i < guests.length; i++) {
    const g = guests[i];
    const link = shortLink(opts.origin, g.code);
    const file = `${g.code}-${fileSafe(g.name)}.png`;
    const dataUrl = await qrDataUrl(link, 1024);
    folder.file(file, dataUrl.split(",")[1], { base64: true });
    rows.push([g.name, g.category, g.code, link, `qr/${file}`].map(csvCell).join(","));
    opts.onProgress?.(i + 1);
  }
  zip.file("daftar-cetak.csv", "﻿" + rows.join("\n"));
  zip.file(
    "BACA-SAYA.txt",
    [
      "Isi paket cetak undangan",
      "",
      "- daftar-cetak.csv: satu baris per tamu (nama, kategori, kode, tautan pendek, nama file QR).",
      "- folder qr/: gambar QR 1024 x 1024 piksel. Setiap QR membuka undangan pribadi tamu tersebut.",
      "",
      "Untuk percetakan: gunakan mail merge (Word, InDesign, CorelDRAW) dengan kolom nama dan file_qr.",
      "Cetak QR minimal 2 x 2 cm agar mudah dipindai. Uji pindai satu kartu sebelum mencetak semuanya.",
    ].join("\r\n"),
  );
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
