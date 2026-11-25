-- =============================================================
-- Fitur tamu opsional (masing-masing bisa diaktifkan/nonaktifkan):
--   1. Undangan per acara/sesi  (features.sessions)
--   2. Status "sudah dibuka"    (features.open_tracking)
--   3. Check-in hari H via QR   (features.checkin)
-- Semua bawaan NONAKTIF. Aman dijalankan ulang.
-- =============================================================

-- ---------- kolom baru ----------
alter table public.wedding_settings
  add column if not exists features jsonb not null
  default '{"sessions": false, "open_tracking": false, "checkin": false}'::jsonb;

alter table public.guests
  add column if not exists event_ids uuid[],                -- null/kosong = semua acara
  add column if not exists opened_at timestamptz,           -- pertama kali dibuka
  add column if not exists last_opened_at timestamptz,
  add column if not exists open_count int not null default 0,
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_in_pax int,
  add column if not exists checked_in_by uuid references public.profiles (id) on delete set null;

do $$ begin
  alter table public.guests add constraint guests_checked_in_pax_check check (checked_in_pax is null or checked_in_pax between 0 and 50);
exception when duplicate_object then null; end $$;

alter table public.wedding_events
  add column if not exists capacity int;
do $$ begin
  alter table public.wedding_events add constraint wedding_events_capacity_check check (capacity is null or capacity > 0);
exception when duplicate_object then null; end $$;

create index if not exists guests_checked_in_idx on public.guests (checked_in_at desc) where checked_in_at is not null;
create index if not exists guests_opened_idx on public.guests (opened_at) ;

-- ---------- peran petugas check-in ----------
-- Peran "checkin" hanya bisa memakai halaman /checkin lewat fungsi di bawah.
-- Tidak punya akses tabel apa pun (RLS tetap admin saja).
do $$
declare c text;
begin
  for c in select conname from pg_constraint
           where conrelid = 'public.profiles'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint %I', c);
  end loop;
  alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'viewer', 'checkin'));
end $$;

create or replace function public.is_checkin_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'checkin'));
$$;

create or replace function public.feature_enabled(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select (features ->> p_name)::boolean from public.wedding_settings where id = 1), false);
$$;

-- ---------- snapshot: fitur berlaku langsung, tidak ikut draft ----------
create or replace function public._build_snapshot(p_all_media boolean default false)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  body jsonb;
  media jsonb;
begin
  select jsonb_build_object(
    'version', 1,
    'settings', (
      select to_jsonb(ws) - 'id' - 'is_published' - 'published_snapshot' - 'published_at' - 'created_at' - 'updated_at'
             - 'wishes_moderation' - 'features'
      from public.wedding_settings ws where ws.id = 1
    ),
    'sections', coalesce((
      select jsonb_agg(to_jsonb(x) - 'created_at' - 'updated_at' order by x.sort_order, x.key)
      from public.wedding_sections x), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(to_jsonb(x) - 'created_at' - 'updated_at' order by x.sort_order, x.event_date, x.start_time)
      from public.wedding_events x), '[]'::jsonb),
    'stories', coalesce((
      select jsonb_agg(to_jsonb(x) - 'created_at' - 'updated_at' order by x.sort_order)
      from public.love_stories x), '[]'::jsonb),
    'gallery', coalesce((
      select jsonb_agg(to_jsonb(x) - 'created_at' - 'updated_at' order by x.sort_order)
      from public.gallery_images x), '[]'::jsonb),
    'gifts', coalesce((
      select jsonb_agg(to_jsonb(x) - 'created_at' - 'updated_at' order by x.sort_order)
      from public.wedding_gifts x), '[]'::jsonb)
  ) into body;

  select coalesce(jsonb_object_agg(m.id::text, to_jsonb(m) - 'created_by' - 'updated_at'), '{}'::jsonb)
  into media
  from public.media_assets m
  where p_all_media or position(m.id::text in body::text) > 0;

  return body || jsonb_build_object('media', media);
end;
$$;

-- ---------- tamu lewat kode: + daftar acara bila fitur sesi aktif ----------
create or replace function public.get_guest_by_code(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare result jsonb;
begin
  if p_code is null or upper(p_code) !~ '^[A-Z0-9]{6,16}$' then
    return null;
  end if;
  select jsonb_build_object(
    'name', g.name,
    'code', g.code,
    'max_pax', g.max_pax,
    'event_ids', case when public.feature_enabled('sessions') and cardinality(g.event_ids) > 0 then to_jsonb(g.event_ids) else null end,
    'rsvp', (select jsonb_build_object('attendance', r.attendance, 'pax', r.pax, 'message', r.message)
             from public.rsvps r where r.guest_id = g.id)
  ) into result
  from public.guests g
  where g.code = upper(p_code);
  return result;
end;
$$;

-- ---------- status dibuka (dipanggil server dengan service role) ----------
create or replace function public.record_guest_open(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.feature_enabled('open_tracking') or p_code is null or upper(p_code) !~ '^[A-Z0-9]{6,16}$' then
    return false;
  end if;
  update public.guests
     set opened_at = coalesce(opened_at, now()),
         last_opened_at = now(),
         open_count = open_count + 1
   where code = upper(p_code);
  return found;
end;
$$;

-- ---------- check-in hari H ----------
create or replace function public._require_checkin()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_checkin_staff() then
    raise exception 'Akses ditolak: hanya admin atau petugas check-in.' using errcode = '42501';
  end if;
  if not public.feature_enabled('checkin') then
    raise exception 'Fitur check-in belum diaktifkan di Pengaturan.' using errcode = 'P0001';
  end if;
end;
$$;

create or replace function public._checkin_row(g public.guests)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', g.id, 'name', g.name, 'category', g.category, 'code', g.code, 'max_pax', g.max_pax,
    'notes', g.notes,
    'event_ids', g.event_ids,
    'events', case when public.feature_enabled('sessions') and cardinality(g.event_ids) > 0
              then (select coalesce(jsonb_agg(e.title order by e.sort_order), '[]'::jsonb) from public.wedding_events e where e.id = any (g.event_ids))
              else null end,
    'checked_in_at', g.checked_in_at, 'checked_in_pax', g.checked_in_pax,
    'rsvp', (select jsonb_build_object('attendance', r.attendance, 'pax', r.pax) from public.rsvps r where r.guest_id = g.id)
  );
$$;

-- Cari tamu: kode/QR (persis) atau potongan nama. Nomor WhatsApp tidak pernah dikembalikan.
create or replace function public.checkin_lookup(p_query text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  q text := trim(coalesce(p_query, ''));
  v_code text;
begin
  perform public._require_checkin();
  -- QR berisi tautan ".../?guest=KODE"; ambil kodenya.
  v_code := upper(coalesce(substring(q from '[?&]guest=([A-Za-z0-9]{6,16})'), q));
  if v_code ~ '^[A-Z0-9]{6,16}$' and exists (select 1 from public.guests gg where gg.code = v_code) then
    return (select jsonb_agg(public._checkin_row(g)) from public.guests g where g.code = v_code);
  end if;
  if char_length(q) < 2 then
    return '[]'::jsonb;
  end if;
  return coalesce((
    select jsonb_agg(public._checkin_row(g) order by g.name)
    from public.guests g
    where g.id in (select gg.id from public.guests gg
                   where gg.name ilike '%' || replace(replace(q, '%', '\%'), '_', '\_') || '%'
                   order by gg.name limit 12)), '[]'::jsonb);
end;
$$;

create or replace function public.checkin_mark(p_guest uuid, p_pax int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare g public.guests;
begin
  perform public._require_checkin();
  if p_pax is null or p_pax < 1 or p_pax > 50 then
    raise exception 'Jumlah orang harus 1 sampai 50.';
  end if;
  update public.guests
     set checked_in_at = coalesce(checked_in_at, now()),
         checked_in_pax = p_pax,
         checked_in_by = auth.uid()
   where id = p_guest
  returning * into g;
  if not found then raise exception 'Tamu tidak ditemukan.'; end if;
  return public._checkin_row(g);
end;
$$;

create or replace function public.checkin_undo(p_guest uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare g public.guests;
begin
  perform public._require_checkin();
  update public.guests set checked_in_at = null, checked_in_pax = null, checked_in_by = null
   where id = p_guest returning * into g;
  if not found then raise exception 'Tamu tidak ditemukan.'; end if;
  return public._checkin_row(g);
end;
$$;

-- Tamu datang tanpa undangan terdaftar: dicatat sebagai tamu baru lalu langsung check-in.
create or replace function public.checkin_walkin(p_name text, p_pax int, p_note text default '')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare g public.guests;
begin
  perform public._require_checkin();
  if char_length(trim(coalesce(p_name, ''))) < 2 then raise exception 'Isi nama tamu.'; end if;
  if p_pax is null or p_pax < 1 or p_pax > 50 then raise exception 'Jumlah orang harus 1 sampai 50.'; end if;
  insert into public.guests (name, category, max_pax, notes, invitation_status, checked_in_at, checked_in_pax, checked_in_by)
  values (left(trim(p_name), 120), 'Walk-in', least(greatest(p_pax, 1), 20), left(coalesce(p_note, ''), 500), 'terkirim', now(), p_pax, auth.uid())
  returning * into g;
  return public._checkin_row(g);
end;
$$;

create or replace function public.checkin_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public._require_checkin();
  return jsonb_build_object(
    'guests_checked_in', (select count(*) from public.guests where checked_in_at is not null),
    'pax_checked_in', (select coalesce(sum(checked_in_pax), 0) from public.guests where checked_in_at is not null),
    'pax_expected', (select coalesce(sum(r.pax), 0) from public.rsvps r where r.attendance = 'hadir'),
    'recent', coalesce((
      select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'pax', g.checked_in_pax, 'at', g.checked_in_at, 'category', g.category) order by g.checked_in_at desc)
      from (select * from public.guests where checked_in_at is not null order by checked_in_at desc limit 8) g), '[]'::jsonb)
  );
end;
$$;

-- Peran pengguna saat ini (untuk mengarahkan petugas ke /checkin).
create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------- hak eksekusi ----------
revoke execute on function public.is_checkin_staff() from public, anon;
revoke execute on function public.feature_enabled(text) from public, anon;
revoke execute on function public._require_checkin() from public, anon, authenticated;
revoke execute on function public._checkin_row(public.guests) from public, anon, authenticated;
revoke execute on function public.record_guest_open(text) from public, anon, authenticated;
revoke execute on function public.checkin_lookup(text) from public, anon;
revoke execute on function public.checkin_mark(uuid, int) from public, anon;
revoke execute on function public.checkin_undo(uuid) from public, anon;
revoke execute on function public.checkin_walkin(text, int, text) from public, anon;
revoke execute on function public.checkin_summary() from public, anon;
revoke execute on function public.my_role() from public, anon;
revoke execute on function public._build_snapshot(boolean) from public, anon, authenticated;

grant execute on function public.get_guest_by_code(text) to anon, authenticated;
grant execute on function public.record_guest_open(text) to service_role;
grant execute on function public.is_checkin_staff() to authenticated;
grant execute on function public.feature_enabled(text) to authenticated;
grant execute on function public.checkin_lookup(text) to authenticated;
grant execute on function public.checkin_mark(uuid, int) to authenticated;
grant execute on function public.checkin_undo(uuid) to authenticated;
grant execute on function public.checkin_walkin(text, int, text) to authenticated;
grant execute on function public.checkin_summary() to authenticated;
grant execute on function public.my_role() to authenticated;
