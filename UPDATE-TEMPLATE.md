# Update: 5 template tata letak

Update ini menambah template Klasik Simetris, Sinematik Foto Penuh, Kartu Minimal, dan Tradisional Nusantara.
Konten, tamu, RSVP, dan ucapan yang sudah ada tidak berubah. Undangan tetap memakai template Editorial sampai Anda memilih yang lain.

## Cara memasang

1. Ekstrak zip ini, lalu salin seluruh isi folder `undangan` ke folder proyek Anda dan timpa file lama.
   Jangan hapus folder `.git` dan file `.env.local` milik Anda.
2. Supabase > SQL Editor: jalankan `supabase/migrations/20261125000004_layout_templates.sql` (sekali saja).
3. Kirim ke GitHub:
   ```bash
   git add .
   git commit -m "Tambah 5 template tata letak"
   git push
   ```
   Vercel deploy otomatis bila repository sudah terhubung. Bila deploy lewat CLI: `vercel --prod`.
4. Dashboard > **Tema** > **Template tata letak**: pilih template, **Simpan draft**, cek di **Preview**, lalu **Publish**.

## File yang berubah

Lihat daftar di bawah ini (dibandingkan versi sebelumnya).

```
 README.md                                        |   8 +-
 docs/PANDUAN-ADMIN.md                            |  10 ++
 src/app/admin/(panel)/content/page.tsx           |   6 +
 src/app/admin/(panel)/theme/page.tsx             |  44 ++++++-
 src/components/invitation/Invitation.tsx         |  34 ++++-
 src/components/invitation/Lightbox.tsx           |  12 +-
 src/components/invitation/SectionFrame.tsx       | 104 +++++++++++-----
 src/components/invitation/context.tsx            |   4 +-
 src/components/invitation/sections/Closing.tsx   |  15 ++-
 src/components/invitation/sections/Countdown.tsx |   4 +-
 src/components/invitation/sections/Couple.tsx    |  34 +++--
 src/components/invitation/sections/Cover.tsx     |  24 +++-
 src/components/invitation/sections/Events.tsx    |  49 +++++++-
 src/components/invitation/sections/Gallery.tsx   |  34 ++++-
 src/components/invitation/sections/Gift.tsx      |   6 +-
 src/components/invitation/sections/Hashtag.tsx   |   4 +-
 src/components/invitation/sections/Hero.tsx      | 151 ++++++++++++++++++++++-
 src/components/invitation/sections/Location.tsx  |   7 +-
 src/components/invitation/sections/Quote.tsx     |   5 +-
 src/components/invitation/sections/Rsvp.tsx      |   5 +-
 src/components/invitation/sections/Story.tsx     |  40 ++++++
 src/components/invitation/sections/Wishes.tsx    |  11 +-
 src/lib/theme.ts                                 |   5 +
 src/types/invitation.ts                          |   4 +
 supabase/migrations/20261124000002_functions.sql |   1 +
 25 files changed, 551 insertions(+), 70 deletions(-)
baru: UPDATE-TEMPLATE.md
baru: src/components/admin/LayoutSketch.tsx
baru: src/components/invitation/layout.tsx
baru: src/config/layouts.ts
baru: src/lib/motif.ts
baru: supabase/migrations/20261125000004_layout_templates.sql
```
