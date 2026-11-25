-- Akses undangan pribadi.
-- features.access:
--   'open' : siapa pun yang punya alamat utama bisa membuka (bawaan)
--   'link' : wajib tautan tamu, yaitu kode tamu (?guest= / /u/KODE) atau tautan nama (?to=Nama)
--   'code' : hanya kode tamu terdaftar
-- Konten undangan juga tidak bisa diambil langsung lewat kunci publik (anon) saat mode
-- bukan 'open'. Server Next.js membacanya dengan service role lalu memeriksa tautan tamu.

alter table public.wedding_settings
  alter column features set default '{"sessions": false, "open_tracking": false, "checkin": false, "physical": false, "access": "open"}'::jsonb;

update public.wedding_settings
   set features = coalesce(features, '{}'::jsonb) || '{"access": "open"}'::jsonb
 where id = 1 and not (coalesce(features, '{}'::jsonb) ? 'access');

create or replace function public.invitation_access()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case when ws.features->>'access' in ('link', 'code') then ws.features->>'access' else 'open' end
  from public.wedding_settings ws where ws.id = 1;
$$;

-- Permintaan dari kunci publik (anon), bukan admin login atau service role.
create or replace function public._is_anon_request()
returns boolean
language sql
stable
as $$
  select coalesce(current_setting('role', true), '') = 'anon'
      or coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role', '') = 'anon';
$$;

create or replace function public.get_published_invitation()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case
    when ws.is_published and ws.published_snapshot is not null
         and not (public._is_anon_request() and public.invitation_access() <> 'open')
      then ws.published_snapshot || jsonb_build_object('published_at', ws.published_at)
    else null
  end
  from public.wedding_settings ws where ws.id = 1;
$$;

revoke execute on function public.invitation_access() from public, anon;
grant execute on function public.invitation_access() to authenticated, service_role;
revoke execute on function public._is_anon_request() from public;
grant execute on function public._is_anon_request() to anon, authenticated, service_role;
grant execute on function public.get_published_invitation() to anon, authenticated, service_role;
