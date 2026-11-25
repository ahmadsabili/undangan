// Tipe data inti undangan. Bentuk ini sama untuk snapshot terpublikasi,
// draft (preview) dan file backup, sehingga satu renderer melayani ketiganya.

export type SectionKey =
  | "cover"
  | "hero"
  | "quote"
  | "couple"
  | "countdown"
  | "events"
  | "location"
  | "story"
  | "gallery"
  | "rsvp"
  | "wishes"
  | "gift"
  | "livestream"
  | "hashtag"
  | "closing";

export type SectionBackground = "background" | "surface" | "secondary" | "primary";

export interface MediaAsset {
  id: string;
  url: string;
  storage_path: string | null;
  kind: "image" | "audio" | "video" | "document";
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  alt: string;
  focal_x: number;
  focal_y: number;
  created_at?: string;
}

export interface Person {
  full_name: string;
  nickname: string;
  parent_label: string; // contoh: "Putra dari" / "Putri dari"
  parents: string;
  bio: string;
  instagram: string;
  photo_id: string | null;
}

export interface Couple {
  first: Person;
  second: Person;
  order: "first_second" | "second_first";
}

export type LayoutKey = "editorial" | "classic" | "cinematic" | "card" | "nusantara";

export interface ThemeTokens {
  layout: LayoutKey; // template tata letak
  ornamentMediaId: string | null; // motif custom untuk template Nusantara
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
  fonts: { heading: string; body: string; accent: string };
  fontScale: number;
  radius: number;
  buttonStyle: "solid" | "outline" | "underline";
  navStyle: "floating" | "bar";
  animation: "none" | "subtle" | "normal" | "expressive";
  overlay: number; // 0 - 0.85
}

export interface WeddingSettings {
  site_name: string;
  site_title: string;
  meta_description: string;
  language: "id" | "en";
  timezone: string;
  wedding_date: string; // ISO timestamptz
  couple: Couple;
  monogram_text: string;
  logo_media_id: string | null;
  favicon_media_id: string | null;
  og_media_id: string | null;
  music_enabled: boolean;
  music_media_id: string | null;
  music_volume: number;
  rsvp_deadline: string | null;
  rsvp_max_pax: number;
  wishes_moderation: "manual" | "auto";
  noindex: boolean;
  theme: ThemeTokens;
  theme_slug: string | null;
}

export interface Section<C = Record<string, unknown>> {
  id: string;
  key: SectionKey;
  title: string;
  subtitle: string;
  enabled: boolean;
  sort_order: number;
  background: SectionBackground;
  background_media_id: string | null;
  content: C;
}

export interface WeddingEvent {
  id: string;
  capacity?: number | null;
  title: string;
  event_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string | null;
  time_note: string;
  venue_name: string;
  address: string;
  maps_url: string;
  dress_code: string;
  notes: string;
  sort_order: number;
}

export interface LoveStory {
  id: string;
  title: string;
  date_label: string;
  description: string;
  media_id: string | null;
  sort_order: number;
}

export interface GalleryImage {
  id: string;
  media_id: string;
  caption: string;
  layout: "auto" | "tall" | "wide";
  sort_order: number;
}

export interface WeddingGift {
  id: string;
  type: "bank" | "ewallet" | "address" | "qris";
  provider: string;
  account_number: string;
  account_holder: string;
  address: string;
  logo_media_id: string | null;
  qris_media_id: string | null;
  note: string;
  enabled: boolean;
  sort_order: number;
}

export interface InvitationData {
  version: number;
  settings: WeddingSettings;
  sections: Section[];
  events: WeddingEvent[];
  stories: LoveStory[];
  gallery: GalleryImage[];
  gifts: WeddingGift[];
  media: Record<string, MediaAsset>;
  published_at?: string | null;
}

export interface GuestContext {
  name: string;
  code: string | null;
  maxPax: number;
  rsvp: { attendance: Attendance; pax: number; message: string } | null;
  /** Acara yang boleh dilihat tamu ini (fitur sesi). null = semua acara. */
  eventIds: string[] | null;
}

export type Attendance = "hadir" | "tidak_hadir" | "ragu";

export interface FeatureFlags {
  sessions: boolean;
  open_tracking: boolean;
  checkin: boolean;
}

export const DEFAULT_FEATURES: FeatureFlags = { sessions: false, open_tracking: false, checkin: false };
