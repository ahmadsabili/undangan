// Membuat (atau mempromosikan) akun admin. Tidak ada registrasi publik.
// Pemakaian:
//   npm run create-admin -- email@contoh.com "PasswordKuat123"
// Membaca NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY dari .env.local / environment.
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const [email, password] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local terlebih dahulu.");
  process.exit(1);
}
if (!email || !password || password.length < 10) {
  console.error('Pemakaian: npm run create-admin -- email@contoh.com "password minimal 10 karakter"');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

let userId;
const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
if (created.error) {
  if (!/already|registered|exists/i.test(created.error.message)) {
    console.error("Gagal membuat user:", created.error.message);
    process.exit(1);
  }
  // User sudah ada: cari ID-nya lalu promosikan.
  let page = 1;
  while (!userId) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    userId = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
    if (data.users.length < 200) break;
    page++;
  }
  if (!userId) {
    console.error("User sudah terdaftar tetapi tidak ditemukan.");
    process.exit(1);
  }
  console.log("User sudah ada, password tidak diubah. Mempromosikan menjadi admin...");
} else {
  userId = created.data.user.id;
}

const { error } = await supabase.from("profiles").upsert({ id: userId, email, role: "admin" }, { onConflict: "id" });
if (error) {
  console.error("Gagal mengatur role admin:", error.message);
  process.exit(1);
}
console.log(`Selesai. ${email} sekarang admin. Masuk di /admin/login`);
