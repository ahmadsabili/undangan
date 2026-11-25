"use client";

import { FileDown } from "lucide-react";
import { useState } from "react";
import { Button, Dialog, useToast } from "@/components/ui";
import { buildPrintPdf, buildQrZip, type PrintGuest, type PrintLayout } from "@/lib/print-export";
import { errMessage } from "@/services/admin";

type Format = PrintLayout | "zip";

const FORMATS: { value: Format; label: string; description: string }[] = [
  { value: "card", label: "PDF kartu (10 per A4)", description: "Kartu 90 x 52 mm berisi nama, QR, dan tautan pendek. Bisa diselipkan di undangan." },
  { value: "sticker", label: "PDF stiker QR (24 per A4)", description: "Stiker 45 x 45 mm untuk ditempel di kartu undangan yang sudah dicetak." },
  { value: "zip", label: "ZIP untuk percetakan", description: "Gambar QR per tamu + daftar CSV untuk mail merge, agar nama dan QR langsung tercetak di kartu." },
];

function save(data: ArrayBuffer | Uint8Array, filename: string, type: string) {
  const blob = new Blob([data as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function PrintExportDialog({ open, onClose, filtered, physicalOnly, origin }: { open: boolean; onClose: () => void; filtered: PrintGuest[]; physicalOnly: PrintGuest[]; origin: string }) {
  const toast = useToast();
  const [scope, setScope] = useState<"physical" | "filtered">("physical");
  const [format, setFormat] = useState<Format>("card");
  const [progress, setProgress] = useState<number | null>(null);
  const list = scope === "physical" ? physicalOnly : filtered;

  async function run() {
    if (!list.length) return toast("error", "Tidak ada tamu untuk diekspor.");
    setProgress(0);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === "zip") save(await buildQrZip(list, { origin, onProgress: setProgress }), `cetak-undangan-${stamp}.zip`, "application/zip");
      else save(await buildPrintPdf(list, { layout: format, origin, onProgress: setProgress }), `${format === "card" ? "kartu" : "stiker"}-qr-${stamp}.pdf`, "application/pdf");
      toast("ok", `${list.length} tamu diekspor. Uji pindai satu QR sebelum mencetak semuanya.`);
      onClose();
    } catch (e) {
      toast("error", `Ekspor gagal: ${errMessage(e)}`);
    } finally {
      setProgress(null);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Ekspor untuk cetak"
      description="Setiap QR membuka undangan pribadi tamu dan dipakai juga untuk check-in di hari H."
      footer={
        <>
          <Button onClick={onClose}>Batal</Button>
          <Button variant="primary" onClick={run} loading={progress !== null} disabled={!list.length}>
            <FileDown className="h-4 w-4" aria-hidden="true" />
            {progress !== null ? `Menyiapkan ${progress}/${list.length}` : `Ekspor ${list.length} tamu`}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <fieldset>
          <legend className="text-sm font-medium">Tamu</legend>
          <div className="mt-2 grid gap-2">
            {(
              [
                ["physical", `Jenis undangan Fisik & Keduanya (${physicalOnly.length})`],
                ["filtered", `Sesuai filter di tabel (${filtered.length})`],
              ] as const
            ).map(([v, l]) => (
              <label key={v} className="flex min-h-[44px] items-center gap-3 rounded-md border border-admin-line px-3 text-sm">
                <input type="radio" name="scope" className="h-4 w-4 accent-[#454B40]" checked={scope === v} onChange={() => setScope(v)} />
                {l}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-medium">Format</legend>
          <div className="mt-2 grid gap-2">
            {FORMATS.map((f) => (
              <label key={f.value} className="flex items-start gap-3 rounded-md border border-admin-line px-3 py-2.5 text-sm">
                <input type="radio" name="format" className="mt-0.5 h-4 w-4 accent-[#454B40]" checked={format === f.value} onChange={() => setFormat(f.value)} />
                <span>
                  <span className="font-medium">{f.label}</span>
                  <span className="mt-0.5 block text-xs text-admin-muted">{f.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        {origin.includes("localhost") && <p className="text-xs text-[#8a5a00]">Tautan memakai alamat {origin}. Isi NEXT_PUBLIC_SITE_URL dengan domain final sebelum mencetak.</p>}
      </div>
    </Dialog>
  );
}
