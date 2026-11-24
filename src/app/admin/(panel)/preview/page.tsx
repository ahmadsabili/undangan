"use client";

import { ExternalLink, Monitor, RefreshCw, Smartphone, Tablet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Card, Field, Input, PageHeader, Switch } from "@/components/ui";
import { cn } from "@/lib/utils";

const DEVICES = [
  { key: "mobile", label: "Mobile", width: 390, height: 780, icon: Smartphone },
  { key: "tablet", label: "Tablet", width: 820, height: 1080, icon: Tablet },
  { key: "desktop", label: "Desktop", width: 1280, height: 800, icon: Monitor },
] as const;

export default function PreviewPage() {
  const [device, setDevice] = useState<(typeof DEVICES)[number]["key"]>("mobile");
  const [guest, setGuest] = useState("Tamu Undangan");
  const [skipCover, setSkipCover] = useState(false);
  const [nonce, setNonce] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(1000);
  const d = DEVICES.find((x) => x.key === device)!;

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAvail(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Muat ulang otomatis saat draft berubah di tab lain dari dashboard.
  useEffect(() => {
    const onChange = () => setNonce((n) => n + 1);
    window.addEventListener("draft:changed", onChange);
    return () => window.removeEventListener("draft:changed", onChange);
  }, []);

  const scale = Math.min(1, (avail - 2) / d.width);
  const src = `/preview?to=${encodeURIComponent(guest)}${skipCover ? "&open=1" : ""}&v=${nonce}`;

  return (
    <>
      <PageHeader title="Preview draft" description="Menampilkan versi draft, termasuk perubahan yang belum dipublikasikan. Formulir RSVP dan ucapan tidak menyimpan data di mode ini." />
      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div role="group" aria-label="Pilih perangkat" className="flex rounded-md border border-admin-line bg-white p-1">
            {DEVICES.map((x) => (
              <button
                key={x.key}
                type="button"
                aria-pressed={device === x.key}
                onClick={() => setDevice(x.key)}
                className={cn("flex min-h-[36px] items-center gap-2 rounded px-3 text-sm", device === x.key ? "bg-admin-brand text-white" : "hover:bg-black/5")}
              >
                <x.icon className="h-4 w-4" aria-hidden="true" />
                {x.label}
              </button>
            ))}
          </div>
          <Field label="Nama tamu contoh" htmlFor="pv-guest" className="min-w-[200px] flex-1">
            <Input id="pv-guest" value={guest} onChange={(e) => setGuest(e.target.value)} />
          </Field>
          <div className="min-w-[200px]">
            <Switch label="Lewati cover" checked={skipCover} onChange={setSkipCover} />
          </div>
          <Button onClick={() => setNonce((n) => n + 1)}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Muat ulang
          </Button>
          <a href={src} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[40px] items-center gap-2 rounded-md border border-admin-line bg-white px-4 text-sm font-medium hover:bg-[#F0EEE8]">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Tab baru
          </a>
        </div>
      </Card>
      <div ref={wrap} className="flex justify-center">
        <div style={{ width: d.width * scale, height: d.height * scale }} className="overflow-hidden rounded-xl border-[6px] border-[#2a2a2a] bg-white shadow-lg">
          <iframe key={src} title={`Preview ${d.label}`} src={src} width={d.width} height={d.height} style={{ transform: `scale(${scale})`, transformOrigin: "0 0" }} className="block border-0" />
        </div>
      </div>
    </>
  );
}
