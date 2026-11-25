// Uji migration + seed + kebijakan akses di Postgres lokal (PGlite, tanpa Docker).
// Skema auth & storage Supabase di-stub seminimal mungkin.
// Jalankan: npm run test:sql
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const db = new PGlite({ extensions: { pgcrypto } });

const stub = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
grant usage on schema public to anon, authenticated, service_role;
create schema auth; create schema storage;
grant usage on schema auth, storage to anon, authenticated, service_role;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant execute on function auth.uid() to anon, authenticated, service_role;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
`;

let passed = 0;
async function check(name, fn) {
  try {
    await fn();
    passed++;
    console.log("  ok  " + name);
  } catch (e) {
    console.error("  FAIL " + name + "\n       " + (e.message || e));
    process.exitCode = 1;
  }
}

async function as(role, uid, fn) {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${uid ?? ""}', false);`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role;`);
  }
}

await db.exec("create extension if not exists pgcrypto;");
await db.exec(stub);
for (const f of readdirSync(join(root, "supabase/migrations")).sort()) {
  await db.exec(readFileSync(join(root, "supabase/migrations", f), "utf8"));
  console.log("migrated " + f);
}
await db.exec("grant all on all tables in schema public to authenticated, service_role;");

// Di Supabase, objek dimiliki role "postgres" yang bukan superuser. Tiru kondisi itu:
// pindahkan kepemilikan ke role biasa agar fungsi SECURITY DEFINER diuji tanpa hak superuser.
await db.exec(`
  create role app_owner nologin;
  grant usage, create on schema public to app_owner;
  grant usage on schema auth to app_owner;
  grant select, references on auth.users to app_owner;
  grant execute on function gen_random_bytes(int) to app_owner;
  do $$ declare r record; begin
    for r in select tablename from pg_tables where schemaname = 'public' loop
      execute format('alter table public.%I owner to app_owner', r.tablename);
    end loop;
    for r in select p.oid::regprocedure as f from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname not in (select proname from pg_proc where pronamespace = 'public'::regnamespace and probin is not null) loop
      begin execute format('alter function %s owner to app_owner', r.f); exception when others then null; end;
    end loop;
  end $$;
`);
{
  const r = await db.query(`select count(*)::int as n from pg_proc p join pg_roles o on o.oid = p.proowner
    where p.pronamespace = 'public'::regnamespace and p.proname in ('get_published_invitation','publish_invitation','restore_config','is_admin') and o.rolname = 'app_owner'`);
  const t = await db.query(`select count(*)::int as n from pg_tables where schemaname = 'public' and tableowner = 'app_owner'`);
  console.log(`kepemilikan dipindah ke role non-superuser: ${t.rows[0].n} tabel, ${r.rows[0].n}/4 fungsi kunci`);
}
await db.exec(readFileSync(join(root, "supabase/seed.sql"), "utf8"));
console.log("seeded");
if (process.env.DUMP_FIXTURE) {
  const { writeFileSync } = await import("node:fs");
  const r = await db.query("select public.get_published_invitation() as s");
  writeFileSync(process.env.DUMP_FIXTURE, JSON.stringify(r.rows[0].s, null, 2));
  console.log("fixture ditulis ke " + process.env.DUMP_FIXTURE);
}

const ADMIN = "11111111-1111-4111-8111-111111111111";
const VIEWER = "22222222-2222-4222-8222-222222222222";
await db.exec(`insert into auth.users (id, email) values ('${ADMIN}', 'admin@example.com'), ('${VIEWER}', 'viewer@example.com');
               update public.profiles set role = 'admin' where id = '${ADMIN}';`);

console.log("\nanon");
await check("membaca snapshot terpublikasi", async () => {
  const r = await as("anon", null, () => db.query("select public.get_published_invitation() as s"));
  const s = r.rows[0].s;
  assert.equal(s.sections.length, 15);
  assert.equal(s.events.length, 2);
  assert.ok(Object.keys(s.media).length >= 10);
  assert.equal(s.settings.published_snapshot, undefined);
});
await check("tidak bisa membaca tabel guests", async () => {
  await assert.rejects(as("anon", null, () => db.query("select * from public.guests")));
});
await check("tidak bisa membaca wedding_settings", async () => {
  await assert.rejects(as("anon", null, () => db.query("select * from public.wedding_settings")));
});
await check("tidak bisa memanggil check_rate_limit", async () => {
  await assert.rejects(as("anon", null, () => db.query("select public.check_rate_limit('x', 1, 60)")));
});
await check("tidak bisa publish", async () => {
  await assert.rejects(as("anon", null, () => db.query("select public.publish_invitation()")));
});

console.log("\nauthenticated non-admin");
await check("RLS menyembunyikan guests", async () => {
  await db.exec(`insert into public.guests (name, category, whatsapp) values ('Budi Santoso', 'Keluarga', '6281234567890')`);
  const r = await as("authenticated", VIEWER, () => db.query("select * from public.guests"));
  assert.equal(r.rows.length, 0);
});
await check("tidak bisa membaca draft", async () => {
  await assert.rejects(as("authenticated", VIEWER, () => db.query("select public.get_draft_invitation()")));
});

console.log("\nadmin");
let code;
await check("membaca & menambah tamu, kode unik otomatis", async () => {
  const r = await as("authenticated", ADMIN, () => db.query("insert into public.guests (name) values ('Sari') returning code"));
  code = r.rows[0].code;
  assert.match(code, /^[A-HJ-KM-NP-Z2-9]{10}$/);
});
await check("tamu lewat kode tidak membocorkan WhatsApp", async () => {
  const r = await as("anon", null, () => db.query("select public.get_guest_by_code($1) as g", [code.toLowerCase()]));
  assert.equal(r.rows[0].g.name, "Sari");
  assert.equal(r.rows[0].g.whatsapp, undefined);
  const bad = await as("anon", null, () => db.query("select public.get_guest_by_code('x'' or 1=1') as g"));
  assert.equal(bad.rows[0].g, null);
});
await check("draft tidak bocor ke publik sebelum publish", async () => {
  await as("authenticated", ADMIN, () => db.query("update public.wedding_sections set title = 'Judul Draft' where key = 'hero'"));
  const pub = await as("anon", null, () => db.query("select public.get_published_invitation() as s"));
  assert.notEqual(pub.rows[0].s.sections.find((x) => x.key === "hero").title, "Judul Draft");
  const draft = await as("authenticated", ADMIN, () => db.query("select public.get_draft_invitation() as s"));
  assert.equal(draft.rows[0].s.sections.find((x) => x.key === "hero").title, "Judul Draft");
});
await check("publish menyalin draft ke publik", async () => {
  await as("authenticated", ADMIN, () => db.query("select public.publish_invitation()"));
  const pub = await as("anon", null, () => db.query("select public.get_published_invitation() as s"));
  assert.equal(pub.rows[0].s.sections.find((x) => x.key === "hero").title, "Judul Draft");
});
await check("discard_draft mengembalikan ke versi terpublikasi", async () => {
  await as("authenticated", ADMIN, () => db.query("update public.wedding_sections set title = 'Belum disimpan' where key = 'hero'"));
  await as("authenticated", ADMIN, () => db.query("select public.discard_draft()"));
  const r = await as("authenticated", ADMIN, () => db.query("select title from public.wedding_sections where key = 'hero'"));
  assert.equal(r.rows[0].title, "Judul Draft");
});
await check("situs offline menyembunyikan snapshot", async () => {
  await db.exec("update public.wedding_settings set is_published = false");
  const r = await as("anon", null, () => db.query("select public.get_published_invitation() as s"));
  assert.equal(r.rows[0].s, null);
  await db.exec("update public.wedding_settings set is_published = true");
});
await check("ucapan pending tidak tampil, approved tampil", async () => {
  await db.exec(`insert into public.wedding_wishes (name, message, status) values ('A', 'Selamat ya', 'pending'), ('B', 'Barakallah', 'approved')`);
  const r = await as("anon", null, () => db.query("select public.get_public_wishes(10, 0) as w"));
  assert.equal(r.rows[0].w.total, 1);
  assert.equal(r.rows[0].w.items[0].name, "B");
});
await check("statistik dashboard", async () => {
  await db.exec(`insert into public.rsvps (guest_id, name, attendance, pax) select id, name, 'hadir', 2 from public.guests where name = 'Sari'`);
  const r = await as("authenticated", ADMIN, () => db.query("select public.dashboard_stats() as s"));
  const s = r.rows[0].s;
  assert.equal(s.guests_total, 2);
  assert.equal(s.hadir, 1);
  assert.equal(s.pax_hadir, 2);
  assert.equal(s.belum_konfirmasi, 1);
});
await check("RSVP ganda untuk tamu yang sama ditolak", async () => {
  await assert.rejects(db.query(`insert into public.rsvps (guest_id, name, attendance, pax) select id, name, 'hadir', 1 from public.guests where name = 'Sari'`));
});
await check("media yang dipakai terdeteksi", async () => {
  const r = await as("authenticated", ADMIN, () => db.query("select public.media_usage('00000000-0000-4000-8000-0000000000a1') as u"));
  assert.ok(r.rows[0].u.length > 0, "harus terpakai");
});
await check("media yang dipakai galeri tidak bisa dihapus (FK restrict)", async () => {
  await assert.rejects(as("authenticated", ADMIN, () => db.query("delete from public.media_assets where id = '00000000-0000-4000-8000-0000000000b1'")));
});
await check("export lalu restore konfigurasi", async () => {
  const ex = await as("authenticated", ADMIN, () => db.query("select public.export_config() as c"));
  const cfg = ex.rows[0].c;
  assert.ok(cfg.templates.length >= 1);
  await as("authenticated", ADMIN, () => db.query("update public.wedding_settings set site_name = 'Berubah'"));
  await as("authenticated", ADMIN, () => db.query("select public.restore_config($1::jsonb)", [JSON.stringify(cfg)]));
  const r = await as("authenticated", ADMIN, () => db.query("select site_name from public.wedding_settings"));
  assert.equal(r.rows[0].site_name, "Undangan Pernikahan");
  const n = await as("authenticated", ADMIN, () => db.query("select count(*)::int as n from public.wedding_sections"));
  assert.equal(n.rows[0].n, 15);
});
await check("restore menolak dokumen tidak valid", async () => {
  await assert.rejects(as("authenticated", ADMIN, () => db.query(`select public.restore_config('{"version":9}'::jsonb)`)));
});


console.log("\nfitur tamu opsional");
const CHECKER = "33333333-3333-4333-8333-333333333333";
await db.exec(`insert into auth.users (id, email) values ('${CHECKER}', 'petugas@example.com');
               update public.profiles set role = 'checkin' where id = '${CHECKER}';`);
await check("semua fitur bawaan nonaktif", async () => {
  const r = await db.query("select features from public.wedding_settings");
  assert.deepEqual(r.rows[0].features, { sessions: false, open_tracking: false, checkin: false, physical: false });
});
await check("fitur tidak ikut snapshot draft", async () => {
  const r = await as("authenticated", ADMIN, () => db.query("select public.get_draft_invitation() as s"));
  assert.equal(r.rows[0].s.settings.features, undefined);
});
let evId;
await check("sesi nonaktif: tamu tidak menerima event_ids", async () => {
  evId = (await db.query("select id from public.wedding_events order by sort_order limit 1")).rows[0].id;
  await db.query("update public.guests set event_ids = array[$1::uuid] where name = 'Sari'", [evId]);
  const r = await as("anon", null, () => db.query("select public.get_guest_by_code($1) as g", [code]));
  assert.equal(r.rows[0].g.event_ids, null);
});
await check("sesi aktif: tamu menerima event_ids miliknya", async () => {
  await as("authenticated", ADMIN, () => db.query(`update public.wedding_settings set features = features || '{"sessions": true}'`));
  const r = await as("anon", null, () => db.query("select public.get_guest_by_code($1) as g", [code]));
  assert.deepEqual(r.rows[0].g.event_ids, [evId]);
});
await check("status dibuka: nonaktif tidak mencatat, aktif mencatat", async () => {
  const off = await as("service_role", null, () => db.query("select public.record_guest_open($1) as ok", [code]));
  assert.equal(off.rows[0].ok, false);
  await db.query(`update public.wedding_settings set features = features || '{"open_tracking": true}'`);
  await as("service_role", null, () => db.query("select public.record_guest_open($1) as ok", [code]));
  await as("service_role", null, () => db.query("select public.record_guest_open($1) as ok", [code]));
  const g = await db.query("select opened_at is not null as opened, open_count from public.guests where code = $1", [code]);
  assert.deepEqual(g.rows[0], { opened: true, open_count: 2 });
});
await check("anon tidak bisa mencatat dibuka langsung", async () => {
  await assert.rejects(as("anon", null, () => db.query("select public.record_guest_open($1)", [code])));
});
await check("check-in ditolak saat fitur nonaktif", async () => {
  await assert.rejects(as("authenticated", CHECKER, () => db.query("select public.checkin_lookup('Sari')")), /belum diaktifkan/);
});
await check("petugas check-in: cari via QR, check-in, undo", async () => {
  await db.query(`update public.wedding_settings set features = features || '{"checkin": true}'`);
  const found = await as("authenticated", CHECKER, () => db.query("select public.checkin_lookup($1) as r", [`https://contoh.com/?guest=${code}`]));
  const g = found.rows[0].r[0];
  assert.equal(g.name, "Sari");
  assert.equal(g.whatsapp, undefined);
  const m = await as("authenticated", CHECKER, () => db.query("select public.checkin_mark($1, 2) as r", [g.id]));
  assert.equal(m.rows[0].r.checked_in_pax, 2);
  const s = await as("authenticated", CHECKER, () => db.query("select public.checkin_summary() as s"));
  assert.equal(s.rows[0].s.pax_checked_in, 2);
  const u = await as("authenticated", CHECKER, () => db.query("select public.checkin_undo($1) as r", [g.id]));
  assert.equal(u.rows[0].r.checked_in_at, null);
});
await check("petugas check-in: cari nama & walk-in", async () => {
  const r = await as("authenticated", CHECKER, () => db.query("select public.checkin_lookup('bud') as r"));
  assert.equal(r.rows[0].r[0].name, "Budi Santoso");
  const w = await as("authenticated", CHECKER, () => db.query("select public.checkin_walkin('Pak Joko', 3) as r"));
  assert.equal(w.rows[0].r.category, "Walk-in");
});
await check("petugas check-in tidak bisa membaca tabel tamu / pengaturan", async () => {
  const g = await as("authenticated", CHECKER, () => db.query("select * from public.guests"));
  assert.equal(g.rows.length, 0);
  await assert.rejects(as("authenticated", CHECKER, () => db.query("select public.get_draft_invitation()")));
});
await check("pengguna biasa tidak bisa check-in", async () => {
  await assert.rejects(as("authenticated", VIEWER, () => db.query("select public.checkin_lookup('Sari')")), /Akses ditolak/);
});

await check("jenis undangan: bawaan digital, nilai tak dikenal ditolak", async () => {
  const r = await db.query("select invite_type from public.guests where name = 'Sari'");
  assert.equal(r.rows[0].invite_type, "digital");
  await as("authenticated", ADMIN, () => db.query("update public.guests set invite_type = 'fisik' where name = 'Sari'"));
  await assert.rejects(db.query("update public.guests set invite_type = 'surat' where name = 'Sari'"));
});
await check("check-in mengenali QR tautan pendek /u/KODE", async () => {
  const r = await as("authenticated", CHECKER, () => db.query("select public.checkin_lookup($1) as r", [`https://contoh.com/u/${code.toLowerCase()}`]));
  assert.equal(r.rows[0].r[0].name, "Sari");
});
await check("admin bisa mencatat RSVP manual untuk tamu", async () => {
  const g = (await db.query("select id, name from public.guests where name = 'Budi Santoso'")).rows[0];
  await as("authenticated", ADMIN, () =>
    db.query("insert into public.rsvps (guest_id, name, attendance, pax, source) values ($1, $2, 'hadir', 2, 'admin') on conflict (guest_id) do update set attendance = excluded.attendance, pax = excluded.pax, source = 'admin'", [g.id, g.name]));
  const r = await db.query("select source, pax from public.rsvps where guest_id = $1", [g.id]);
  assert.deepEqual(r.rows[0], { source: "admin", pax: 2 });
});

console.log("\nservice role");
await check("rate limit menolak setelah batas", async () => {
  const results = [];
  for (let i = 0; i < 4; i++) {
    const r = await as("service_role", null, () => db.query("select public.check_rate_limit('ip:test', 3, 60) as ok"));
    results.push(r.rows[0].ok);
  }
  assert.deepEqual(results, [true, true, true, false]);
});

console.log(`\n${passed} pemeriksaan lolos${process.exitCode ? ", ada yang gagal" : ""}.`);
