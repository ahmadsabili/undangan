-- =============================================================
-- Undangan Digital: skema inti
-- Jalankan berurutan: 0001_schema, 0002_functions, 0003_security, lalu seed.sql
-- =============================================================

create extension if not exists pgcrypto;

-- ---------- utilitas ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Kode undangan 10 karakter, alfabet tanpa huruf ambigu (tanpa 0/O/1/I/L).
create or replace function public.gen_guest_code()
returns text
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  bytes bytea := gen_random_bytes(10);
  result text := '';
  i int;
begin
  for i in 0..9 loop
    result := result || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
  end loop;
  return result;
end;
$$;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- media ----------
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text unique,
  url text not null,
  kind text not null check (kind in ('image', 'audio', 'video', 'document')),
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  width int,
  height int,
  alt text not null default '',
  focal_x numeric(5, 2) not null default 50 check (focal_x between 0 and 100),
  focal_y numeric(5, 2) not null default 50 check (focal_y between 0 and 100),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index media_assets_kind_idx on public.media_assets (kind, created_at desc);

-- ---------- themes ----------
create table public.wedding_themes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  tokens jsonb not null,
  is_preset boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- settings (satu baris) ----------
create table public.wedding_settings (
  id smallint primary key default 1 check (id = 1),
  site_name text not null default 'Undangan Pernikahan',
  site_title text not null default 'The Wedding',
  meta_description text not null default '',
  language text not null default 'id' check (language in ('id', 'en')),
  timezone text not null default 'Asia/Jakarta',
  wedding_date timestamptz not null default (now() + interval '90 days'),
  couple jsonb not null default '{}'::jsonb,
  monogram_text text not null default '',
  logo_media_id uuid references public.media_assets (id) on delete restrict,
  favicon_media_id uuid references public.media_assets (id) on delete restrict,
  og_media_id uuid references public.media_assets (id) on delete restrict,
  music_enabled boolean not null default false,
  music_media_id uuid references public.media_assets (id) on delete restrict,
  music_volume numeric(3, 2) not null default 0.45 check (music_volume between 0 and 1),
  rsvp_deadline timestamptz,
  rsvp_max_pax int not null default 2 check (rsvp_max_pax between 1 and 20),
  wishes_moderation text not null default 'manual' check (wishes_moderation in ('manual', 'auto')),
  noindex boolean not null default true,
  theme jsonb not null default '{}'::jsonb,
  theme_slug text,
  -- status publikasi berlaku langsung (bukan bagian draft)
  is_published boolean not null default false,
  published_snapshot jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- sections ----------
create table public.wedding_sections (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key in (
    'cover','hero','quote','couple','countdown','events','location','story',
    'gallery','rsvp','wishes','gift','livestream','hashtag','closing')),
  title text not null default '',
  subtitle text not null default '',
  enabled boolean not null default true,
  sort_order int not null default 0,
  background text not null default 'background' check (background in ('background','surface','secondary','primary')),
  background_media_id uuid references public.media_assets (id) on delete restrict,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index wedding_sections_order_idx on public.wedding_sections (sort_order);

-- ---------- events ----------
create table public.wedding_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  start_time time not null,
  end_time time,
  time_note text not null default '',
  venue_name text not null default '',
  address text not null default '',
  maps_url text not null default '',
  dress_code text not null default '',
  notes text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index wedding_events_order_idx on public.wedding_events (sort_order);

-- ---------- love story ----------
create table public.love_stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date_label text not null default '',
  description text not null default '',
  media_id uuid references public.media_assets (id) on delete restrict,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index love_stories_order_idx on public.love_stories (sort_order);

-- ---------- gallery ----------
create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.media_assets (id) on delete restrict,
  caption text not null default '',
  layout text not null default 'auto' check (layout in ('auto', 'tall', 'wide')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index gallery_images_order_idx on public.gallery_images (sort_order);

-- ---------- gifts ----------
-- Hanya informasi publik penerima (nama bank, nomor rekening, nama pemilik).
-- Tidak ada kolom PIN, OTP, CVV, atau kredensial apa pun.
create table public.wedding_gifts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('bank', 'ewallet', 'address', 'qris')),
  provider text not null default '',
  account_number text not null default '',
  account_holder text not null default '',
  address text not null default '',
  logo_media_id uuid references public.media_assets (id) on delete restrict,
  qris_media_id uuid references public.media_assets (id) on delete restrict,
  note text not null default '',
  enabled boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- guests ----------
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  category text not null default 'Umum',
  whatsapp text check (whatsapp is null or whatsapp ~ '^[0-9]{8,16}$'),
  max_pax int not null default 2 check (max_pax between 1 and 20),
  code text not null unique default public.gen_guest_code(),
  invitation_status text not null default 'belum_dikirim' check (invitation_status in ('belum_dikirim', 'terkirim')),
  sent_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index guests_category_idx on public.guests (category);
create index guests_name_idx on public.guests (lower(name));

-- ---------- rsvps ----------
create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid unique references public.guests (id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  attendance text not null check (attendance in ('hadir', 'tidak_hadir', 'ragu')),
  pax int not null default 1 check (pax between 0 and 20),
  message text not null default '' check (char_length(message) <= 500),
  source text not null default 'name' check (source in ('code', 'name', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index rsvps_attendance_idx on public.rsvps (attendance);
create index rsvps_created_idx on public.rsvps (created_at desc);

-- ---------- wishes ----------
create table public.wedding_wishes (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references public.guests (id) on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  message text not null check (char_length(message) between 2 and 600),
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index wedding_wishes_public_idx on public.wedding_wishes (status, created_at desc);

-- ---------- invitation templates ----------
create table public.invitation_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  body text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index invitation_templates_one_default on public.invitation_templates (is_default) where is_default;

-- ---------- rate limit (hanya service role) ----------
create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits int not null default 0
);

-- ---------- triggers updated_at ----------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','media_assets','wedding_themes','wedding_settings','wedding_sections',
    'wedding_events','love_stories','gallery_images','wedding_gifts','guests','rsvps',
    'wedding_wishes','invitation_templates']
  loop
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;
