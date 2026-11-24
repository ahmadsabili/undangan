-- =============================================================
-- Row Level Security, hak akses fungsi, dan storage.
-- Prinsip: pengunjung (anon) tidak bisa membaca tabel apa pun secara langsung.
-- Konten publik hanya lewat get_published_invitation(), get_guest_by_code(),
-- dan get_public_wishes(). RSVP & ucapan masuk lewat API server (service role)
-- yang memvalidasi input dan membatasi frekuensi.
-- =============================================================

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','media_assets','wedding_themes','wedding_settings','wedding_sections',
    'wedding_events','love_stories','gallery_images','wedding_gifts','guests','rsvps',
    'wedding_wishes','invitation_templates','rate_limits']
  loop
    -- Tidak memakai FORCE: fungsi SECURITY DEFINER (milik pemilik tabel) memang
    -- perlu membaca tabel untuk menyajikan snapshot publik secara terbatas.
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Lapis tambahan: anon tidak punya hak tabel sama sekali.
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

-- profiles: pengguna melihat profilnya sendiri; admin melihat semua.
create policy profiles_select_self on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_admin_update on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Semua tabel konten & data tamu: hanya admin.
do $$
declare t text;
begin
  foreach t in array array[
    'media_assets','wedding_themes','wedding_settings','wedding_sections','wedding_events',
    'love_stories','gallery_images','wedding_gifts','guests','rsvps','wedding_wishes','invitation_templates']
  loop
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
                   t || '_admin_all', t);
  end loop;
end $$;

-- wedding_settings: baris tunggal tidak boleh dihapus.
revoke delete on public.wedding_settings from authenticated;

-- rate_limits: tanpa policy, hanya service role (bypass RLS) yang bisa mengakses.
revoke all on public.rate_limits from authenticated;

-- ---------- hak eksekusi fungsi ----------
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.get_published_invitation() to anon, authenticated;
grant execute on function public.get_publication_status() to anon, authenticated;
grant execute on function public.get_guest_by_code(text) to anon, authenticated;
grant execute on function public.get_public_wishes(int, int) to anon, authenticated;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.get_draft_invitation() to authenticated;
grant execute on function public.publish_invitation() to authenticated;
grant execute on function public.media_usage(uuid) to authenticated;
grant execute on function public.dashboard_stats() to authenticated;
grant execute on function public.export_config() to authenticated;
grant execute on function public.restore_config(jsonb) to authenticated;
grant execute on function public.discard_draft() to authenticated;
grant execute on function public.gen_guest_code() to authenticated;

-- check_rate_limit sengaja tidak diberikan ke anon/authenticated (service role saja).
grant execute on function public.check_rate_limit(text, int, int) to service_role;

-- Fungsi trigger dan helper internal tetap tertutup.

-- ---------- storage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 52428800,
  array['image/jpeg','image/png','image/webp','image/avif','image/svg+xml','image/gif',
        'audio/mpeg','audio/mp4','audio/aac','audio/ogg','audio/wav','audio/webm',
        'video/mp4','video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy media_admin_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy media_admin_update on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());
create policy media_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());
-- Storage API memerlukan izin select untuk menghapus/mengganti objek.
create policy media_admin_select on storage.objects
  for select to authenticated using (bucket_id = 'media' and public.is_admin());
-- Bucket bersifat public, file dibaca lewat URL publik tanpa policy select.
