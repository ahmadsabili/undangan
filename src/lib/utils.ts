import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Inisial monogram: "[Pertama]" dan "[Kedua]" -> "P & K"
export function initialsFrom(a: string, b: string) {
  const first = (s: string) => (s.replace(/[^\p{L}]/gu, "").charAt(0) || "").toUpperCase();
  return [first(a), first(b)].filter(Boolean).join(" & ");
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

// Normalisasi nomor WhatsApp Indonesia: 0812... / +62 812... -> 62812...
export function normalizeWhatsapp(input: string) {
  let n = input.replace(/[^0-9]/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  if (n.startsWith("8")) n = "62" + n;
  return n;
}

export function guestLink(siteUrl: string, code: string) {
  return `${siteUrl.replace(/\/$/, "")}/?guest=${encodeURIComponent(code)}`;
}

export function nameLink(siteUrl: string, name: string) {
  return `${siteUrl.replace(/\/$/, "")}/?to=${encodeURIComponent(name)}`;
}

export function fillTemplate(body: string, vars: Record<string, string>) {
  return body.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? vars[k] : m));
}

export function downloadText(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export function formatBytes(n: number | null | undefined) {
  if (!n) return "-";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
