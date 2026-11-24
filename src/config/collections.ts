import type { FieldDef } from "./sections";

export const EVENT_FIELDS: FieldDef[] = [
  { name: "title", label: "Nama acara", type: "text", placeholder: "Akad Nikah" },
  { name: "event_date", label: "Tanggal", type: "date" },
  { name: "start_time", label: "Jam mulai", type: "time" },
  { name: "end_time", label: "Jam selesai", type: "time", help: "Kosongkan bila acara sampai selesai." },
  { name: "time_note", label: "Keterangan bila jam selesai kosong", type: "text", placeholder: "Selesai" },
  { name: "venue_name", label: "Nama venue", type: "text" },
  { name: "address", label: "Alamat lengkap", type: "textarea", rows: 2 },
  { name: "maps_url", label: "Tautan Google Maps", type: "url", help: "Kosongkan untuk mencari otomatis dari alamat." },
  { name: "dress_code", label: "Dress code acara ini", type: "text" },
  { name: "notes", label: "Catatan", type: "textarea", rows: 2 },
];

export const STORY_FIELDS: FieldDef[] = [
  { name: "title", label: "Judul tahapan", type: "text", placeholder: "First Meet" },
  { name: "date_label", label: "Tanggal atau tahun", type: "text", placeholder: "2019" },
  { name: "description", label: "Deskripsi singkat", type: "textarea", rows: 3 },
  { name: "media_id", label: "Foto (opsional)", type: "media", mediaKind: "image" },
];

export const GIFT_FIELDS: FieldDef[] = [
  {
    name: "type",
    label: "Metode",
    type: "select",
    options: [
      { value: "bank", label: "Transfer bank" },
      { value: "ewallet", label: "E-wallet" },
      { value: "qris", label: "QRIS" },
      { value: "address", label: "Alamat kirim hadiah" },
    ],
  },
  { name: "provider", label: "Nama bank / e-wallet / judul", type: "text" },
  { name: "account_number", label: "Nomor rekening / nomor e-wallet", type: "text", showIf: { field: "type", equals: ["bank", "ewallet"] }, help: "Hanya nomor tujuan transfer. Jangan pernah memasukkan PIN, OTP, atau password." },
  { name: "account_holder", label: "Nama pemilik / penerima", type: "text" },
  { name: "address", label: "Alamat pengiriman", type: "textarea", rows: 3, showIf: { field: "type", equals: ["address"] } },
  { name: "logo_media_id", label: "Logo bank / e-wallet (opsional)", type: "media", mediaKind: "image", showIf: { field: "type", equals: ["bank", "ewallet"] } },
  { name: "qris_media_id", label: "Gambar QRIS", type: "media", mediaKind: "image", showIf: { field: "type", equals: ["qris"] } },
  { name: "note", label: "Catatan (opsional)", type: "text" },
  { name: "enabled", label: "Tampilkan", type: "switch" },
];
