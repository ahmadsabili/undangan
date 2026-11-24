import type { SectionKey } from "@/types/invitation";

// Definisi form untuk editor konten admin. Setiap section menyimpan isian ini
// di kolom wedding_sections.content (jsonb), sehingga menambah field cukup di sini.

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "url"
  | "select"
  | "switch"
  | "media"
  | "datetime"
  | "date"
  | "time";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  help?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  mediaKind?: "image" | "audio" | "video";
  dir?: "rtl";
  rows?: number;
  showIf?: { field: string; equals: string[] };
}

export interface SectionMeta {
  key: SectionKey;
  label: string;
  description: string;
  locked?: boolean; // tidak bisa dipindah/dinonaktifkan
  nav?: { label: string; icon: "home" | "couple" | "event" | "gallery" | "rsvp" };
  collection?: "events" | "stories" | "gallery" | "gifts";
  couple?: boolean;
  fields: FieldDef[];
}

export const SECTION_META: Record<SectionKey, SectionMeta> = {
  cover: {
    key: "cover",
    label: "Opening Cover",
    description: "Layar pembuka dengan nama tamu dan tombol Buka Undangan.",
    locked: true,
    fields: [
      { name: "media_id", label: "Foto latar", type: "media", mediaKind: "image" },
      { name: "eyebrow", label: "Teks kecil di atas nama", type: "text", placeholder: "The Wedding of" },
      { name: "greeting", label: "Sapaan tamu", type: "text", placeholder: "Kepada Yth. Bapak/Ibu/Saudara/i" },
      { name: "default_guest", label: "Nama tamu bawaan", type: "text", help: "Dipakai bila tautan tidak berisi nama tamu." },
      { name: "button_label", label: "Label tombol", type: "text", placeholder: "Buka Undangan" },
    ],
  },
  hero: {
    key: "hero",
    label: "Hero",
    description: "Foto utama, nama, tanggal, dan tagline.",
    nav: { label: "Home", icon: "home" },
    fields: [
      { name: "media_id", label: "Foto utama", type: "media", mediaKind: "image" },
      { name: "tagline", label: "Tagline", type: "text" },
      { name: "button_label", label: "Label tombol Save the Date", type: "text", placeholder: "Simpan Tanggal" },
    ],
  },
  quote: {
    key: "quote",
    label: "Kutipan",
    description: "Ayat, kutipan religius, romantis, atau custom.",
    fields: [
      {
        name: "type",
        label: "Jenis kutipan",
        type: "select",
        options: [
          { value: "quran", label: "Ayat Al-Qur'an" },
          { value: "religious", label: "Kutipan religius lainnya" },
          { value: "romantic", label: "Kutipan romantis" },
          { value: "custom", label: "Custom" },
        ],
      },
      { name: "arabic", label: "Teks Arab", type: "textarea", dir: "rtl", rows: 3, showIf: { field: "type", equals: ["quran"] } },
      { name: "text", label: "Teks kutipan / terjemahan", type: "textarea", rows: 5 },
      { name: "source", label: "Sumber", type: "text", placeholder: "QS. Ar-Rum: 21" },
    ],
  },
  couple: {
    key: "couple",
    label: "Mempelai",
    description: "Profil kedua mempelai dan urutannya.",
    nav: { label: "Couple", icon: "couple" },
    couple: true,
    fields: [{ name: "connector", label: "Simbol penghubung", type: "text", placeholder: "&" }],
  },
  countdown: {
    key: "countdown",
    label: "Save the Date",
    description: "Hitung mundur dan tombol kalender.",
    fields: [
      { name: "after_message", label: "Pesan setelah acara lewat", type: "text" },
      { name: "calendar_title", label: "Judul acara di kalender", type: "text" },
      { name: "calendar_description", label: "Deskripsi di kalender", type: "textarea", rows: 2 },
      { name: "duration_hours", label: "Durasi (jam) bila acara tidak diisi", type: "number" },
    ],
  },
  events: {
    key: "events",
    label: "Rangkaian Acara",
    description: "Akad, resepsi, dan acara lain.",
    nav: { label: "Event", icon: "event" },
    collection: "events",
    fields: [
      { name: "dress_code", label: "Dress code", type: "text" },
      { name: "guest_rules", label: "Ketentuan tamu", type: "textarea", rows: 3 },
      { name: "notes", label: "Catatan khusus", type: "textarea", rows: 3 },
    ],
  },
  location: {
    key: "location",
    label: "Lokasi",
    description: "Venue, peta, parkir, dan akses.",
    fields: [
      { name: "venue_name", label: "Nama venue", type: "text" },
      { name: "address", label: "Alamat lengkap", type: "textarea", rows: 3 },
      { name: "maps_url", label: "Tautan Google Maps", type: "url", help: "Kosongkan untuk mencari otomatis dari alamat." },
      { name: "show_map", label: "Tampilkan peta tertanam", type: "switch" },
      { name: "media_id", label: "Foto venue (opsional)", type: "media", mediaKind: "image" },
      { name: "parking", label: "Informasi parkir", type: "textarea", rows: 2 },
      { name: "access", label: "Akses menuju lokasi", type: "textarea", rows: 2 },
    ],
  },
  story: {
    key: "story",
    label: "Our Love Story",
    description: "Timeline perjalanan kalian.",
    collection: "stories",
    fields: [],
  },
  gallery: {
    key: "gallery",
    label: "Galeri",
    description: "Foto dan video prewedding.",
    nav: { label: "Gallery", icon: "gallery" },
    collection: "gallery",
    fields: [
      {
        name: "video_type",
        label: "Video prewedding",
        type: "select",
        options: [
          { value: "none", label: "Tidak ada" },
          { value: "youtube", label: "Tautan YouTube" },
          { value: "upload", label: "Video upload" },
        ],
      },
      { name: "youtube_url", label: "URL YouTube", type: "url", showIf: { field: "video_type", equals: ["youtube"] } },
      { name: "video_media_id", label: "File video", type: "media", mediaKind: "video", showIf: { field: "video_type", equals: ["upload"] } },
      { name: "video_poster_id", label: "Gambar sampul video", type: "media", mediaKind: "image", showIf: { field: "video_type", equals: ["upload", "youtube"] } },
    ],
  },
  rsvp: {
    key: "rsvp",
    label: "RSVP",
    description: "Formulir konfirmasi kehadiran. Batas waktu & jumlah tamu diatur di Pengaturan.",
    nav: { label: "RSVP", icon: "rsvp" },
    fields: [
      { name: "success_message", label: "Pesan setelah berhasil", type: "text" },
      { name: "closed_message", label: "Pesan saat RSVP ditutup", type: "text" },
    ],
  },
  wishes: {
    key: "wishes",
    label: "Ucapan & Doa",
    description: "Guestbook. Moderasi diatur di menu Ucapan.",
    fields: [
      { name: "page_size", label: "Jumlah ucapan per muat", type: "number" },
      { name: "pending_message", label: "Pesan saat ucapan menunggu moderasi", type: "text" },
    ],
  },
  gift: {
    key: "gift",
    label: "Wedding Gift",
    description: "Rekening, e-wallet, QRIS, dan alamat hadiah.",
    collection: "gifts",
    fields: [],
  },
  livestream: {
    key: "livestream",
    label: "Siaran Langsung",
    description: "YouTube Live, Zoom, atau tautan lain.",
    fields: [
      {
        name: "platform",
        label: "Platform",
        type: "select",
        options: [
          { value: "youtube", label: "YouTube Live" },
          { value: "zoom", label: "Zoom" },
          { value: "custom", label: "Tautan custom" },
        ],
      },
      { name: "url", label: "Tautan siaran", type: "url" },
      { name: "schedule", label: "Jadwal siaran", type: "datetime" },
      { name: "description", label: "Deskripsi", type: "textarea", rows: 2 },
      { name: "button_label", label: "Label tombol", type: "text" },
    ],
  },
  hashtag: {
    key: "hashtag",
    label: "Hashtag",
    description: "Tagar pernikahan dan tautan Instagram.",
    fields: [
      { name: "hashtag", label: "Hashtag", type: "text" },
      { name: "instagram_url", label: "Tautan Instagram (opsional)", type: "url" },
    ],
  },
  closing: {
    key: "closing",
    label: "Penutup",
    description: "Foto, ucapan terima kasih, dan monogram.",
    fields: [
      { name: "media_id", label: "Foto penutup", type: "media", mediaKind: "image" },
      { name: "message", label: "Ucapan terima kasih", type: "textarea", rows: 4 },
      { name: "signature", label: "Penanda tangan", type: "text" },
    ],
  },
};

export const SECTION_ORDER: SectionKey[] = Object.keys(SECTION_META) as SectionKey[];

export const BACKGROUND_OPTIONS = [
  { value: "background", label: "Latar utama" },
  { value: "surface", label: "Putih / surface" },
  { value: "secondary", label: "Secondary" },
  { value: "primary", label: "Primary (gelap)" },
];
