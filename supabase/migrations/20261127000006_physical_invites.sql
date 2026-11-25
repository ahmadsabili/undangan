-- =============================================================
-- Undangan fisik: jenis undangan per tamu + sakelar fitur.
-- Tautan pendek (/u/KODE) dan RSVP manual oleh admin tidak butuh
-- perubahan database. Aman dijalankan ulang.
-- =============================================================

alter table public.guests
  add column if not exists invite_type text not null default 'digital';

do $$ begin
  alter table public.guests add constraint guests_invite_type_check check (invite_type in ('digital', 'fisik', 'keduanya'));
exception when duplicate_object then null; end $$;

create index if not exists guests_invite_type_idx on public.guests (invite_type);

-- Sakelar baru, bawaan nonaktif.
alter table public.wedding_settings
  alter column features set default '{"sessions": false, "open_tracking": false, "checkin": false, "physical": false}'::jsonb;
update public.wedding_settings
   set features = features || '{"physical": false}'::jsonb
 where not (features ? 'physical');

-- Pemindai check-in mengenali tautan pendek /u/KODE di QR kartu cetak.
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
  -- QR berisi tautan ".../?guest=KODE" atau tautan pendek ".../u/KODE"; ambil kodenya.
  v_code := upper(coalesce(substring(q from '(?:[?&]guest=|/u/)([A-Za-z0-9]{6,16})'), q));
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

revoke execute on function public.checkin_lookup(text) from public, anon;
grant execute on function public.checkin_lookup(text) to authenticated;
