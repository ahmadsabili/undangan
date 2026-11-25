# Undangan Digital

Website undangan pernikahan satu halaman dengan dashboard admin. Seluruh konten, foto, warna, font, musik, dan susunan section diatur dari `/admin` tanpa menyentuh kode. Perubahan tersimpan sebagai **draft** dan baru tampil ke tamu setelah tombol **Publish** ditekan.

- Undangan publik: `/` (`/?to=Nama%20Tamu` atau `/?guest=KODEUNIK`)
- Dashboard: `/admin`
- Pratinjau draft (khusus admin): `/preview`

## Daftar isi

1. [Fitur](#fitur)
2. [Teknologi](#teknologi)
3. [Struktur folder](#struktur-folder)
4. [Instalasi lokal](#instalasi-lokal)
5. [Konfigurasi database Supabase](#konfigurasi-database-supabase)
6. [Membuat akun admin](#membuat-akun-admin)
7. [Mengedit konten tanpa coding](#mengedit-konten-tanpa-coding)
8. [Deployment ke Vercel](#deployment-ke-vercel)
9. [Backup dan restore](#backup-dan-restore)
10. [Keamanan dan privasi](#keamanan-dan-privasi)
11. [Pengujian](#pengujian)
12. [Batasan yang diketahui](#batasan-yang-diketahui)

## Fitur

**Undangan publik**

- Opening cover layar penuh dengan nama tamu dinamis. Halaman terkunci sampai tombol Buka Undangan ditekan.
- 14 section yang bisa diurutkan dan dinonaktifkan: Hero, Kutipan (Ar-Rum 21 sebagai contoh), Mempelai, Save the Date & countdown, Rangkaian Acara, Lokasi, Love Story, Galeri (+ video), RSVP, Ucapan & Doa, Wedding Gift, Siaran Langsung, Hashtag, Penutup.
- Countdown real-time berbasis zona waktu, tombol Google Calendar dan file `.ics`.
- Galeri asimetris dengan lightbox (swipe, tombol, keyboard, Escape).
- RSVP tersimpan ke database: validasi, batas jumlah orang, batas waktu, satu RSVP per tamu berkode, pencegahan kirim ganda.
- Guestbook dengan moderasi manual/otomatis, filter spam, rate limit, dan Load More.
- Wedding gift dengan salin nomor rekening, QRIS, dan alamat kirim hadiah.
- Musik latar yang mulai setelah tamu membuka undangan, bisa dijeda kapan saja, preferensi diingat selama sesi.
- Navigasi bawah yang mengikuti section aktif, hanya menampilkan section yang aktif.
- Metadata share WhatsApp (foto, nama mempelai, tanggal), `noindex` secara default.
- Mendukung `prefers-reduced-motion`, keyboard, pembaca layar, dan safe area iOS.

**Dashboard admin**

- Login aman (Supabase Auth), tanpa registrasi publik, ganti password.
- Ringkasan statistik: tamu, RSVP per status, estimasi orang hadir, per kategori, aktivitas terbaru.
- Editor konten berbasis form, drag and drop urutan section, aktif/nonaktif, draft & publish, reset.
- **8 template tata letak**: Editorial, Klasik Simetris, Sinematik Foto Penuh, Kartu Minimal, Tradisional Nusantara (ornamen bisa diganti), Art Deco Mewah, Lengkung Modern, Bento Modern. Dipilih di menu Tema dan bisa dipadukan dengan preset warna mana pun.
- Editor tema: 16 preset (6 dari database + 10 bawaan aplikasi, termasuk tema gelap Noir Deco, Emerald Royale, Bordeaux Luxe, Midnight Glam), 20 palet warna cepat (netral, pastel, gelap mewah), warna, font, ukuran huruf, radius, gaya tombol & navigasi, intensitas animasi, overlay foto, latar per section, cek kontras otomatis.
- Media library: upload banyak file, kompresi WebP, alt text, titik fokus, ganti file tanpa merusak referensi, penghapusan aman.
- Daftar tamu: CRUD, cari, filter, import/export CSV, tautan berkode unik, QR code, pesan WhatsApp siap kirim.
- **Undangan pribadi** (opsional): alamat utama tanpa tautan tamu ditolak. Pilih wajib tautan tamu (kode atau `?to=Nama`) atau hanya kode tamu terdaftar. Konten juga dikunci di database dari kunci publik.
- **Tautan pendek** `/u/KODE` untuk kartu cetak (selalu aktif) dan **RSVP manual oleh admin** untuk konfirmasi lewat telepon.
- **Fitur opsional** (aktif/nonaktif di Pengaturan > Fitur tambahan, bawaan nonaktif):
  - **Undangan per acara/sesi**: tiap tamu hanya melihat acara yang ditujukan untuknya; atur per tamu, per kategori, atau lewat kolom `acara` di CSV. Variabel WhatsApp `{acara_tamu}`.
  - **Status "sudah dibuka"**: mencatat kapan tamu berkode membuka undangan (dicatat dari browser, bukan dari pratinjau tautan WhatsApp).
  - **Undangan fisik**: kolom jenis undangan (digital, fisik, keduanya) dan **Ekspor untuk cetak**: PDF kartu QR (10 per A4), PDF stiker QR (24 per A4), atau ZIP berisi gambar QR + CSV untuk mail merge di percetakan.
  - **Check-in hari H**: halaman `/checkin` untuk penerima tamu, scan QR dengan kamera ponsel, cari nama, catat tamu walk-in, rekap kehadiran langsung. Akun petugas khusus dengan akses terbatas.
- Template pesan WhatsApp yang bisa diedit.
- Manajemen RSVP dan ucapan, export CSV.
- Preview draft untuk mobile, tablet, desktop.
- Backup & restore konfigurasi JSON, buang draft.

## Teknologi

| Bagian | Pilihan |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 3 dengan CSS variables untuk tema |
| Komponen | Komponen bergaya shadcn/ui yang ditulis langsung di `src/components/ui` (tanpa CLI registry) |
| Animasi | Framer Motion |
| Ikon | Lucide |
| Database, Auth, Storage | Supabase (PostgreSQL + RLS, Auth, Storage) |
| Validasi | Zod + React Hook Form |
| Lainnya | dnd-kit (drag and drop), qrcode, papaparse |
| Deployment | Vercel |

## Struktur folder

```
supabase/
  migrations/              Skema, fungsi, RLS & storage (jalankan berurutan)
  seed.sql                 Data demo dengan placeholder [dalam kurung siku]
scripts/
  create-admin.mjs         Membuat / mempromosikan akun admin
  test-sql.mjs             Uji migration, RLS, draft/publish di Postgres lokal (PGlite)
  test-lib.ts              Uji unit zona waktu, kalender, sanitasi, kontras
public/placeholders/       Gambar placeholder berlabel
src/
  app/                     Routing: undangan publik, /preview, /admin, /api
  components/
    invitation/            Komponen undangan publik & section
    admin/                 Komponen dashboard (editor, media picker, dialog)
    ui/                    Komponen dasar (Button, Field, Dialog, Toast)
  config/                  Definisi section & form, font, field koleksi
  lib/                     Utilitas: tanggal, kalender, tema, sanitasi, Supabase client
  services/                Logika bisnis: memuat undangan, metadata, admin, upload
  validation/              Skema Zod
  types/                   Tipe TypeScript
```

## Instalasi lokal

Prasyarat: Node.js 22 atau lebih baru, akun Supabase (gratis cukup).

```bash
npm install
cp .env.example .env.local      # lalu isi nilainya
npm run dev                     # buka http://localhost:3000
```

Isi `.env.local`:

| Variabel | Keterangan |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings > API > anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings > API > service_role key. **Rahasia**, hanya dipakai server. |
| `NEXT_PUBLIC_SITE_URL` | Domain undangan, contoh `https://undangan-kita.vercel.app` |
| `RATE_LIMIT_SALT` | Teks acak panjang untuk hashing IP |

Bila Supabase belum diisi, halaman undangan menampilkan petunjuk konfigurasi, bukan data palsu.

**Pratinjau desain tanpa Supabase (opsional, hanya development).** Jalankan `DUMP_FIXTURE=./supabase/fixture.json npm run test:sql` untuk membuat snapshot seed, lalu isi `DESIGN_PREVIEW_FIXTURE=./supabase/fixture.json` di `.env.local` dan kosongkan variabel Supabase. Undangan tampil dengan data seed. Formulir RSVP dan ucapan akan menampilkan pesan bahwa penyimpanan belum dikonfigurasi. Mode ini mati otomatis di production.

## Konfigurasi database Supabase

1. Buat project baru di [supabase.com](https://supabase.com). Pilih region terdekat (misalnya Singapore).
2. Buka **SQL Editor**, lalu jalankan isi file berikut **berurutan**, satu per satu:
   1. `supabase/migrations/20261124000001_schema.sql`
   2. `supabase/migrations/20261124000002_functions.sql`
   3. `supabase/migrations/20261124000003_security.sql`
   4. `supabase/migrations/20261125000004_layout_templates.sql`
   5. `supabase/migrations/20261126000005_guest_features.sql`
   6. `supabase/migrations/20261127000006_physical_invites.sql`
   7. `supabase/migrations/20261128000007_private_access.sql`
   8. `supabase/seed.sql`
3. Buka **Authentication > Sign In / Providers > Email** dan **matikan "Allow new users to sign up"**. Akun admin dibuat lewat skrip, bukan pendaftaran.
4. Cek **Storage**: bucket `media` (public) sudah dibuat oleh migration ketiga.

Alternatif dengan Supabase CLI: `supabase link --project-ref <ref>` lalu `supabase db push`, kemudian jalankan `seed.sql` di SQL Editor.

**Ringkasan skema**

| Tabel | Isi |
| --- | --- |
| `profiles` | Peran pengguna (`admin` / `viewer`), terhubung ke `auth.users` |
| `wedding_settings` | Satu baris: info umum, mempelai, tema aktif, musik, RSVP, status publikasi, **snapshot terpublikasi** |
| `wedding_sections` | 15 section: judul, urutan, aktif, latar, konten JSON |
| `wedding_events` | Rangkaian acara |
| `wedding_themes` | Preset & tema custom |
| `love_stories` | Timeline cerita |
| `media_assets` | Metadata file di Storage (alt, fokus, ukuran) |
| `gallery_images` | Urutan & tata letak foto galeri |
| `wedding_gifts` | Rekening, e-wallet, QRIS, alamat hadiah |
| `guests` | Daftar tamu & kode undangan unik |
| `rsvps` | Konfirmasi kehadiran (maks satu per tamu berkode) |
| `wedding_wishes` | Ucapan & status moderasi |
| `invitation_templates` | Template pesan WhatsApp |
| `rate_limits` | Penghitung rate limit (service role saja) |

**Cara kerja draft dan publish.** Dashboard selalu menulis ke tabel (draft). Tombol Publish memanggil `publish_invitation()` yang menyalin seluruh konten menjadi satu dokumen JSON di `wedding_settings.published_snapshot`. Pengunjung hanya bisa membaca dokumen itu melalui `get_published_invitation()`. Jadi draft tidak pernah bocor ke publik.

## Membuat akun admin

```bash
npm run create-admin -- email@anda.com "password-minimal-10-karakter"
```

Untuk akun **petugas check-in** (hanya bisa membuka `/checkin`, tidak bisa melihat dashboard atau nomor WhatsApp tamu), tambahkan argumen `checkin`:

```bash
npm run create-admin -- petugas@email.com "password-minimal-10-karakter" checkin
```

Skrip membuat user di Supabase Auth (email langsung terverifikasi) lalu memberi peran `admin`. Bila email sudah terdaftar, skrip hanya mempromosikan peran tanpa mengubah password. Jalankan dari komputer Anda dengan `.env.local` berisi service role key.

## Mengedit konten tanpa coding

Panduan langkah demi langkah untuk pengguna nonteknis ada di **[docs/PANDUAN-ADMIN.md](docs/PANDUAN-ADMIN.md)**. Ringkasnya:

1. Masuk ke `/admin`.
2. **Konten**: pilih section di kiri, ubah isinya di kanan, tekan **Simpan draft**. Seret untuk mengurutkan, gunakan sakelar untuk menonaktifkan.
3. **Media**: unggah foto, isi alt text, klik foto untuk mengatur titik fokus.
4. **Tema**: pilih preset atau atur warna & font.
5. **Preview**: cek tampilan di mobile, tablet, desktop.
6. Tekan **Publish** di bar atas.

## Deployment ke Vercel

1. Push repository ke GitHub (file `.env.local` tidak ikut karena ada di `.gitignore`).
2. Di Vercel: **Add New > Project**, pilih repository. Framework terdeteksi otomatis sebagai Next.js.
3. Isi **Environment Variables** sama seperti `.env.local`. Pastikan `NEXT_PUBLIC_SITE_URL` berisi domain final (tanpa `/` di akhir).
4. Deploy. Variabel `NEXT_PUBLIC_SUPABASE_URL` harus sudah ada saat build karena dipakai untuk mengizinkan optimasi gambar dari Supabase Storage.
5. Bila memakai domain sendiri, tambahkan di **Settings > Domains**, lalu perbarui `NEXT_PUBLIC_SITE_URL` dan redeploy.
6. Di Supabase **Authentication > URL Configuration**, isi Site URL dengan domain yang sama.

Setelah deploy: buka `/admin/login`, masuk, cek Preview, lalu Publish. Uji tautan di WhatsApp dengan mengirim ke diri sendiri. WhatsApp menyimpan cache preview, jadi perubahan foto share bisa butuh waktu untuk terlihat.

## Backup dan restore

Menu **Backup & Restore** di dashboard:

- **Konfigurasi website (JSON)**: pengaturan, section, acara, love story, galeri, hadiah, tema custom, template, dan metadata media. File foto/musik tetap di Supabase Storage.
- **Data tamu (CSV)** dan **Data RSVP (CSV)**.
- **Restore**: file JSON divalidasi di browser, lalu diterapkan oleh fungsi `restore_config()` dalam satu transaksi. Bila gagal di tengah, tidak ada yang berubah. Restore hanya mengganti draft. Data tamu, RSVP, dan ucapan tidak disentuh.
- **Buang draft**: mengembalikan draft ke versi yang sedang tayang.

Saran: export konfigurasi sebelum perubahan besar dan seminggu sekali menjelang hari H. Untuk backup penuh database (termasuk tamu), gunakan juga fitur backup bawaan Supabase.

## Keamanan dan privasi

- **Row Level Security** aktif di semua tabel. Peran `anon` tidak punya hak tabel sama sekali; hanya admin (dicek lewat `is_admin()`) yang bisa membaca dan menulis.
- Pengunjung hanya bisa memanggil empat fungsi baca: snapshot terpublikasi, status publikasi, tamu berdasarkan kode (tanpa nomor WhatsApp, kategori, atau catatan), dan ucapan yang disetujui.
- RSVP dan ucapan masuk lewat API server (`/api/rsvp`, `/api/wishes`) yang memvalidasi dengan Zod, membersihkan teks, memeriksa honeypot, waktu pengisian, pola spam, asal request, dan rate limit (IP di-hash, tidak disimpan).
- Service role key hanya dibaca di server (`src/lib/supabase/admin.ts`, ditandai `server-only`).
- Kode tamu 10 karakter acak dari 31 simbol. Nomor telepon tidak pernah masuk ke URL.
- Upload divalidasi tipe & ukuran. SVG dibersihkan dari script dan event handler.
- Wedding gift hanya menyimpan informasi tujuan transfer. Tidak ada kolom PIN, OTP, atau kredensial.
- Metadata share tidak memuat nama tamu. Halaman `noindex` secara default, dashboard selalu `noindex`.
- Ekspor CSV melindungi dari formula injection.

## Pengujian

```bash
npm run test:lib    # zona waktu, kalender, sanitasi, spam, kontras (16 pemeriksaan)
npm run test:sql    # migration + seed + RLS + draft/publish + backup/restore + fitur tamu di PGlite (36 pemeriksaan)
npm run typecheck
npm run lint
npm run build
```

`test:sql` menjalankan migration asli di Postgres (WASM) dengan stub skema `auth` dan `storage`, lalu memeriksa bahwa pengunjung tidak bisa membaca tabel, draft tidak bocor sebelum publish, kode tamu tidak membocorkan nomor WhatsApp, rate limit bekerja, dan restore bersifat atomik.

Daftar uji manual setelah deploy ada di [docs/PANDUAN-ADMIN.md](docs/PANDUAN-ADMIN.md#checklist-sebelum-dibagikan).

## Batasan yang diketahui

- Integrasi Supabase (Auth, PostgREST, Storage) diuji lewat build dan uji SQL. Alur dashboard terhadap project Supabase sungguhan perlu dicek sekali setelah setup memakai checklist di panduan admin.
- Font dimuat dari Google Fonts agar bisa diganti dari dashboard. Konsekuensinya ada satu permintaan ke `fonts.googleapis.com`.
- Peta memakai embed Google Maps tanpa API key (mode pencarian alamat). Untuk titik yang presisi, isi tautan Google Maps di tiap acara/lokasi.
- Skor Lighthouse belum diukur di lingkungan produksi. Ukur setelah deploy dengan foto asli.
- Foto latar per section hanya dipakai template Sinematik. Template lain memakai warna tema sebagai latar section.
