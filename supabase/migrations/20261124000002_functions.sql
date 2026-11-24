-- =============================================================
-- Fungsi: peran, snapshot draft/publish, akses publik terbatas,
-- rate limit, statistik, backup & restore.
-- =============================================================

-- ---------- peran ----------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'viewer')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public._require_admin()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: hanya admin.' using errcode = '42501';
  end if;
end;
$$;

-- ---------- snapshot ----------
-- Membangun dokumen undangan lengkap dari tabel (versi draft).
-- Media yang ikut hanya yang direferensikan oleh konten (p_all_media = false).
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
      -- wishes_moderation berlaku langsung (bukan konten), jadi tidak ikut snapshot
      select to_jsonb(ws) - 'id' - 'is_published' - 'published_snapshot' - 'published_at' - 'created_at' - 'updated_at' - 'wishes_moderation'
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

-- Draft untuk halaman preview admin.
create or replace function public.get_draft_invitation()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public._require_admin();
  return public._build_snapshot(false);
end;
$$;

-- Publikasikan draft: snapshot disalin ke kolom published_snapshot.
create or replace function public.publish_invitation()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare ts timestamptz := now();
begin
  perform public._require_admin();
  update public.wedding_settings
     set published_snapshot = public._build_snapshot(false),
         published_at = ts
   where id = 1;
  return ts;
end;
$$;

-- Satu-satunya jalur baca konten untuk pengunjung: snapshot terpublikasi.
create or replace function public.get_published_invitation()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case
    when ws.is_published and ws.published_snapshot is not null
      then ws.published_snapshot || jsonb_build_object('published_at', ws.published_at)
    else null
  end
  from public.wedding_settings ws where ws.id = 1;
$$;

-- Status publikasi (tanpa konten) untuk halaman "belum dipublikasikan".
create or replace function public.get_publication_status()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object('is_published', ws.is_published, 'has_snapshot', ws.published_snapshot is not null)
  from public.wedding_settings ws where ws.id = 1;
$$;

-- ---------- tamu (publik, lewat kode rahasia) ----------
-- Mengembalikan nama, batas jumlah orang, dan RSVP milik tamu itu sendiri.
-- Tidak pernah mengembalikan nomor WhatsApp, kategori, atau catatan internal.
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
    'rsvp', (select jsonb_build_object('attendance', r.attendance, 'pax', r.pax, 'message', r.message)
             from public.rsvps r where r.guest_id = g.id)
  ) into result
  from public.guests g
  where g.code = upper(p_code);
  return result;
end;
$$;

-- ---------- ucapan publik ----------
create or replace function public.get_public_wishes(p_limit int default 10, p_offset int default 0)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'total', (select count(*) from public.wedding_wishes where status = 'approved'),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('id', w.id, 'name', w.name, 'message', w.message, 'created_at', w.created_at)
                       order by w.created_at desc)
      from (
        select * from public.wedding_wishes
        where status = 'approved'
        order by created_at desc
        limit least(greatest(coalesce(p_limit, 10), 1), 50)
        offset greatest(coalesce(p_offset, 0), 0)
      ) w), '[]'::jsonb)
  );
$$;

-- ---------- rate limit ----------
create or replace function public.check_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare current_hits int;
begin
  insert into public.rate_limits as rl (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case when rl.window_start < now() - make_interval(secs => p_window_seconds) then 1 else rl.hits + 1 end,
    window_start = case when rl.window_start < now() - make_interval(secs => p_window_seconds) then now() else rl.window_start end
  returning hits into current_hits;

  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return current_hits <= p_max;
end;
$$;

-- ---------- media ----------
-- Daftar tempat yang masih memakai sebuah media. Dipakai sebelum menghapus.
create or replace function public.media_usage(p_id uuid)
returns text[]
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  used text[] := '{}';
  idtxt text := p_id::text;
begin
  perform public._require_admin();

  if exists (select 1 from public.wedding_settings where logo_media_id = p_id) then used := array_append(used, 'Logo'); end if;
  if exists (select 1 from public.wedding_settings where favicon_media_id = p_id) then used := array_append(used, 'Favicon'); end if;
  if exists (select 1 from public.wedding_settings where og_media_id = p_id) then used := array_append(used, 'Gambar share'); end if;
  if exists (select 1 from public.wedding_settings where music_media_id = p_id) then used := array_append(used, 'Musik latar'); end if;
  if exists (select 1 from public.wedding_settings where position(idtxt in couple::text) > 0) then used := array_append(used, 'Profil mempelai'); end if;
  used := used || coalesce((select array_agg('Section: ' || coalesce(nullif(title, ''), key))
                            from public.wedding_sections
                            where background_media_id = p_id or position(idtxt in content::text) > 0), '{}');
  if exists (select 1 from public.love_stories where media_id = p_id) then used := array_append(used, 'Love story'); end if;
  if exists (select 1 from public.gallery_images where media_id = p_id) then used := array_append(used, 'Galeri'); end if;
  if exists (select 1 from public.wedding_gifts where logo_media_id = p_id or qris_media_id = p_id) then used := array_append(used, 'Wedding gift'); end if;
  if exists (select 1 from public.wedding_settings where position(idtxt in coalesce(published_snapshot::text, '')) > 0) then
    used := array_append(used, 'Versi terpublikasi');
  end if;
  return used;
end;
$$;

-- ---------- statistik dashboard ----------
create or replace function public.dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare result jsonb;
begin
  perform public._require_admin();
  select jsonb_build_object(
    'guests_total', (select count(*) from public.guests),
    'invitations_sent', (select count(*) from public.guests where invitation_status = 'terkirim'),
    'rsvp_total', (select count(*) from public.rsvps),
    'hadir', (select count(*) from public.rsvps where attendance = 'hadir'),
    'tidak_hadir', (select count(*) from public.rsvps where attendance = 'tidak_hadir'),
    'ragu', (select count(*) from public.rsvps where attendance = 'ragu'),
    'belum_konfirmasi', (select count(*) from public.guests g where not exists (select 1 from public.rsvps r where r.guest_id = g.id)),
    'pax_hadir', (select coalesce(sum(pax), 0) from public.rsvps where attendance = 'hadir'),
    'pax_ragu', (select coalesce(sum(pax), 0) from public.rsvps where attendance = 'ragu'),
    'wishes_total', (select count(*) from public.wedding_wishes),
    'wishes_pending', (select count(*) from public.wedding_wishes where status = 'pending'),
    'by_category', coalesce((
      select jsonb_agg(jsonb_build_object('category', c.category, 'guests', c.guests, 'hadir', c.hadir) order by c.guests desc)
      from (
        select g.category, count(*) as guests,
               count(*) filter (where r.attendance = 'hadir') as hadir
        from public.guests g left join public.rsvps r on r.guest_id = g.id
        group by g.category
      ) c), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

-- ---------- backup & restore ----------
create or replace function public.export_config()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public._require_admin();
  return public._build_snapshot(true) || jsonb_build_object(
    'exported_at', now(),
    'themes', coalesce((select jsonb_agg(to_jsonb(t) - 'id' - 'created_at' - 'updated_at' order by t.sort_order)
                        from public.wedding_themes t where not t.is_preset), '[]'::jsonb),
    'templates', coalesce((select jsonb_agg(to_jsonb(t) - 'created_at' - 'updated_at')
                           from public.invitation_templates t), '[]'::jsonb)
  );
end;
$$;

-- Mengganti seluruh konten draft dengan isi dokumen backup/snapshot.
-- Berjalan dalam satu transaksi: gagal di tengah berarti tidak ada yang berubah.
-- Data tamu, RSVP, dan ucapan tidak disentuh.
create or replace function public.restore_config(p jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cur jsonb;
  r public.wedding_settings;
begin
  perform public._require_admin();

  if p is null or jsonb_typeof(p) <> 'object' then
    raise exception 'File konfigurasi tidak valid.';
  end if;
  if coalesce((p->>'version')::int, 0) <> 1 then
    raise exception 'Versi konfigurasi tidak didukung.';
  end if;
  if jsonb_typeof(p->'settings') <> 'object' or jsonb_typeof(p->'sections') <> 'array' then
    raise exception 'Konfigurasi harus berisi settings dan sections.';
  end if;

  -- media (metadata saja; file fisik tetap di storage)
  if jsonb_typeof(p->'media') = 'object' then
    insert into public.media_assets (id, storage_path, url, kind, mime_type, size_bytes, width, height, alt, focal_x, focal_y)
    select m.id, m.storage_path, m.url, m.kind, m.mime_type, m.size_bytes, m.width, m.height,
           coalesce(m.alt, ''), coalesce(m.focal_x, 50), coalesce(m.focal_y, 50)
    from jsonb_each(p->'media') e
    cross join lateral jsonb_populate_record(null::public.media_assets, e.value) m
    where m.id is not null and m.url is not null
    on conflict (id) do update set
      alt = excluded.alt, focal_x = excluded.focal_x, focal_y = excluded.focal_y;
  end if;

  -- settings
  select to_jsonb(ws) into cur from public.wedding_settings ws where id = 1;
  r := jsonb_populate_record(null::public.wedding_settings,
         cur || ((p->'settings') - 'id' - 'is_published' - 'published_snapshot' - 'published_at' - 'created_at' - 'updated_at'));
  update public.wedding_settings set
    site_name = r.site_name, site_title = r.site_title, meta_description = r.meta_description,
    language = r.language, timezone = r.timezone, wedding_date = r.wedding_date, couple = r.couple,
    monogram_text = r.monogram_text, logo_media_id = r.logo_media_id, favicon_media_id = r.favicon_media_id,
    og_media_id = r.og_media_id, music_enabled = r.music_enabled, music_media_id = r.music_media_id,
    music_volume = r.music_volume, rsvp_deadline = r.rsvp_deadline, rsvp_max_pax = r.rsvp_max_pax,
    wishes_moderation = r.wishes_moderation, noindex = r.noindex, theme = r.theme, theme_slug = r.theme_slug
  where id = 1;

  -- konten berurutan
  delete from public.wedding_sections;
  insert into public.wedding_sections (id, key, title, subtitle, enabled, sort_order, background, background_media_id, content)
  select coalesce(x.id, gen_random_uuid()), x.key, coalesce(x.title, ''), coalesce(x.subtitle, ''), coalesce(x.enabled, true),
         coalesce(x.sort_order, 0), coalesce(x.background, 'background'), x.background_media_id, coalesce(x.content, '{}'::jsonb)
  from jsonb_populate_recordset(null::public.wedding_sections, p->'sections') x;

  delete from public.wedding_events;
  insert into public.wedding_events (id, title, event_date, start_time, end_time, time_note, venue_name, address, maps_url, dress_code, notes, sort_order)
  select coalesce(x.id, gen_random_uuid()), x.title, x.event_date, x.start_time, x.end_time, coalesce(x.time_note, ''),
         coalesce(x.venue_name, ''), coalesce(x.address, ''), coalesce(x.maps_url, ''), coalesce(x.dress_code, ''),
         coalesce(x.notes, ''), coalesce(x.sort_order, 0)
  from jsonb_populate_recordset(null::public.wedding_events, coalesce(p->'events', '[]'::jsonb)) x;

  delete from public.love_stories;
  insert into public.love_stories (id, title, date_label, description, media_id, sort_order)
  select coalesce(x.id, gen_random_uuid()), x.title, coalesce(x.date_label, ''), coalesce(x.description, ''), x.media_id, coalesce(x.sort_order, 0)
  from jsonb_populate_recordset(null::public.love_stories, coalesce(p->'stories', '[]'::jsonb)) x;

  delete from public.gallery_images;
  insert into public.gallery_images (id, media_id, caption, layout, sort_order)
  select coalesce(x.id, gen_random_uuid()), x.media_id, coalesce(x.caption, ''), coalesce(x.layout, 'auto'), coalesce(x.sort_order, 0)
  from jsonb_populate_recordset(null::public.gallery_images, coalesce(p->'gallery', '[]'::jsonb)) x;

  delete from public.wedding_gifts;
  insert into public.wedding_gifts (id, type, provider, account_number, account_holder, address, logo_media_id, qris_media_id, note, enabled, sort_order)
  select coalesce(x.id, gen_random_uuid()), x.type, coalesce(x.provider, ''), coalesce(x.account_number, ''),
         coalesce(x.account_holder, ''), coalesce(x.address, ''), x.logo_media_id, x.qris_media_id,
         coalesce(x.note, ''), coalesce(x.enabled, true), coalesce(x.sort_order, 0)
  from jsonb_populate_recordset(null::public.wedding_gifts, coalesce(p->'gifts', '[]'::jsonb)) x;

  if jsonb_typeof(p->'themes') = 'array' then
    insert into public.wedding_themes (slug, name, description, tokens, is_preset, sort_order)
    select x.slug, x.name, coalesce(x.description, ''), x.tokens, false, coalesce(x.sort_order, 100)
    from jsonb_populate_recordset(null::public.wedding_themes, p->'themes') x
    where x.slug is not null and x.tokens is not null
    on conflict (slug) do update set name = excluded.name, tokens = excluded.tokens
      where not public.wedding_themes.is_preset;
  end if;

  if jsonb_typeof(p->'templates') = 'array' and jsonb_array_length(p->'templates') > 0 then
    delete from public.invitation_templates;
    insert into public.invitation_templates (id, name, body, is_default)
    select coalesce(x.id, gen_random_uuid()), x.name, x.body, coalesce(x.is_default, false)
    from jsonb_populate_recordset(null::public.invitation_templates, p->'templates') x;
  end if;
end;
$$;

-- Buang semua perubahan draft: kembalikan isi tabel ke versi yang sedang tayang.
create or replace function public.discard_draft()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare snap jsonb;
begin
  perform public._require_admin();
  select published_snapshot into snap from public.wedding_settings where id = 1;
  if snap is null then
    raise exception 'Belum ada versi terpublikasi.';
  end if;
  perform public.restore_config(snap);
end;
$$;
