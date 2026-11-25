-- =============================================================
-- Template tata letak (Klasik, Sinematik, Kartu, Nusantara).
-- Pilihan template & ornamen disimpan di wedding_settings.theme (jsonb),
-- jadi tidak ada tabel baru. Migration ini hanya memperbarui media_usage()
-- agar gambar ornamen yang dipakai tema tidak bisa terhapus.
-- Aman dijalankan ulang.
-- =============================================================

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
  if exists (select 1 from public.wedding_settings where position(idtxt in theme::text) > 0) then used := array_append(used, 'Ornamen tema'); end if;
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

revoke execute on function public.media_usage(uuid) from public, anon;
grant execute on function public.media_usage(uuid) to authenticated;
