"use client";

import { Check, Copy, Download, MessageCircle } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Button, Dialog, Field, Select, Textarea, useToast } from "@/components/ui";
import { copyText, fillTemplate, normalizeWhatsapp } from "@/lib/utils";
import type { Template } from "./useInviteContext";

export function CopyInline({ text, label = "Salin" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="sm"
      onClick={async () => {
        if (await copyText(text)) {
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        }
      }}
    >
      {done ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
      {done ? "Tersalin" : label}
    </Button>
  );
}

export function QrDialog({ open, onClose, link, name, shortUrl }: { open: boolean; onClose: () => void; link: string; name: string; shortUrl?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(link, { width: 640, margin: 2, color: { dark: "#292929", light: "#FFFFFF" }, errorCorrectionLevel: "M" }).then(setSrc);
  }, [open, link]);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title={`QR undangan: ${name}`}
      footer={
        src && (
          <a href={src} download={`qr-undangan-${name.replace(/[^\w]+/g, "-").toLowerCase()}.png`} className="inline-flex min-h-[40px] items-center gap-2 rounded-md bg-admin-brand px-4 text-sm font-medium text-white hover:bg-[#363b32]">
            <Download className="h-4 w-4" aria-hidden="true" />
            Unduh PNG
          </a>
        )
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt={`QR code menuju ${link}`} width={320} height={320} className="mx-auto h-auto w-full max-w-[320px]" /> : <div className="mx-auto aspect-square w-full max-w-[320px] animate-pulse bg-[#eee]" />}
      <p className="mt-3 break-all text-center text-xs text-admin-muted">{link}</p>
      {shortUrl && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <p className="break-all text-center text-sm font-medium">{shortUrl.replace(/^https?:\/\//, "")}</p>
          <CopyInline text={shortUrl} label="Salin tautan pendek" />
        </div>
      )}
    </Dialog>
  );
}

export function WhatsappDialog({
  open,
  onClose,
  guestName,
  phone,
  link,
  names,
  templates,
  onMarkSent,
  extraVars = {},
}: {
  open: boolean;
  onClose: () => void;
  guestName: string;
  phone: string | null;
  link: string;
  names: [string, string];
  templates: Template[];
  onMarkSent?: () => Promise<void>;
  extraVars?: Record<string, string>;
}) {
  const toast = useToast();
  const [tplId, setTplId] = useState<string>("");
  const [text, setText] = useState("");
  const [marking, setMarking] = useState(false);
  useEffect(() => {
    if (!open) return;
    const tpl = templates.find((t) => t.id === tplId) ?? templates[0];
    if (tpl && !tplId) setTplId(tpl.id);
    setText(tpl ? fillTemplate(tpl.body, { nama_tamu: guestName, nama_mempelai_1: names[0], nama_mempelai_2: names[1], link_undangan: link, ...extraVars }) : link);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tplId, templates, guestName, names, link, JSON.stringify(extraVars)]);

  const number = phone ? normalizeWhatsapp(phone) : "";
  const waUrl = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={`Pesan WhatsApp untuk ${guestName}`}
      description={number ? `Akan dibuka ke nomor +${number}. Pesan tidak terkirim otomatis.` : "Tamu ini tidak punya nomor. WhatsApp akan meminta Anda memilih kontak."}
      footer={
        <>
          <CopyInline text={text} label="Salin pesan" />
          {onMarkSent && (
            <Button
              loading={marking}
              onClick={async () => {
                setMarking(true);
                await onMarkSent();
                setMarking(false);
                toast("ok", "Ditandai terkirim.");
              }}
            >
              Tandai terkirim
            </Button>
          )}
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[40px] items-center gap-2 rounded-md bg-admin-brand px-4 text-sm font-medium text-white hover:bg-[#363b32]">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Buka WhatsApp
          </a>
        </>
      }
    >
      <div className="space-y-4">
        {templates.length > 1 && (
          <Field label="Template" htmlFor="wa-tpl">
            <Select id="wa-tpl" value={tplId} onChange={(e) => setTplId(e.target.value)}>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.is_default ? " (default)" : ""}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Isi pesan (bisa diedit sebelum dikirim)" htmlFor="wa-text">
          <Textarea id="wa-text" rows={14} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}
