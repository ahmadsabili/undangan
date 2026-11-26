-- Backup otomatis mingguan + "detak" harian agar proyek Supabase gratis tidak dijeda.
-- Dipanggil oleh cron Vercel (/api/cron/daily) dengan service role.

-- Isi export_config dipisah agar bisa dipakai service role tanpa sesi admin.
create or replace function public._export_config_body()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select public._build_snapshot(true) || jsonb_build_object(
    'exported_at', now(),
    'themes', coalesce((select jsonb_agg(to_jsonb(t) - 'id' - 'created_at' - 'updated_at' order by t.sort_order)
                        from public.wedding_themes t where not t.is_preset), '[]'::jsonb),
    'templates', coalesce((select jsonb_agg(to_jsonb(t) - 'created_at' - 'updated_at')
                           from public.invitation_templates t), '[]'::jsonb)
  );
$$;

create or replace function public.export_config()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public._require_admin();
  return public._export_config_body();
end;
$$;

-- Salinan lengkap: konfigurasi + tamu + RSVP + ucapan.
create or replace function public.backup_snapshot()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'kind', 'auto-backup',
    'version', 1,
    'created_at', now(),
    'config', public._export_config_body(),
    'guests', coalesce((select jsonb_agg(to_jsonb(g) order by g.created_at) from public.guests g), '[]'::jsonb),
    'rsvps', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at) from public.rsvps r), '[]'::jsonb),
    'wishes', coalesce((select jsonb_agg(to_jsonb(w) order by w.created_at) from public.wedding_wishes w), '[]'::jsonb)
  );
$$;

-- Mengembalikan tamu, RSVP, dan ucapan yang terhapus dari file backup otomatis.
-- Hanya menambah baris yang belum ada (berdasarkan id/kode); data yang ada tidak diubah.
create or replace function public.restore_deleted_records(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  n_guests int := 0;
  n_rsvps int := 0;
  n_wishes int := 0;
begin
  perform public._require_admin();
  if p is null or p->>'kind' <> 'auto-backup' then
    raise exception 'Bukan file backup otomatis.';
  end if;
  if jsonb_typeof(p->'guests') = 'array' then
    insert into public.guests select * from jsonb_populate_recordset(null::public.guests, p->'guests') on conflict do nothing;
    get diagnostics n_guests = row_count;
  end if;
  if jsonb_typeof(p->'rsvps') = 'array' then
    insert into public.rsvps
      select r.* from jsonb_populate_recordset(null::public.rsvps, p->'rsvps') r
      where r.guest_id is null or exists (select 1 from public.guests g where g.id = r.guest_id)
    on conflict do nothing;
    get diagnostics n_rsvps = row_count;
  end if;
  if jsonb_typeof(p->'wishes') = 'array' then
    insert into public.wedding_wishes
      select w.* from jsonb_populate_recordset(null::public.wedding_wishes, p->'wishes') w
      where w.guest_id is null or exists (select 1 from public.guests g where g.id = w.guest_id)
    on conflict do nothing;
    get diagnostics n_wishes = row_count;
  end if;
  return jsonb_build_object('guests', n_guests, 'rsvps', n_rsvps, 'wishes', n_wishes);
end;
$$;

revoke execute on function public._export_config_body() from public, anon, authenticated;
grant execute on function public._export_config_body() to service_role;
revoke execute on function public.backup_snapshot() from public, anon, authenticated;
grant execute on function public.backup_snapshot() to service_role;
revoke execute on function public.restore_deleted_records(jsonb) from public, anon;
grant execute on function public.restore_deleted_records(jsonb) to authenticated;
grant execute on function public.export_config() to authenticated;

-- Bucket privat untuk file backup. Tanpa policy: hanya service role (server) yang bisa membaca.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('backups', 'backups', false, 20971520, array['application/json'])
on conflict (id) do update set public = false;
