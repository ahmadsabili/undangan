-- =============================================================
-- Seed demonstrasi. Semua teks dalam [kurung siku] adalah placeholder
-- yang harus diganti melalui dashboard admin (/admin).
-- Aman dijalankan ulang: data konten lama akan diganti.
-- Data tamu, RSVP, dan ucapan TIDAK dihapus.
-- =============================================================

begin;

-- ---------- media placeholder (file ada di /public/placeholders) ----------
insert into public.media_assets (id, storage_path, url, kind, mime_type, width, height, alt, focal_x, focal_y) values
  ('00000000-0000-4000-8000-0000000000a1', null, '/placeholders/cover.svg',   'image', 'image/svg+xml', 1200, 1800, 'Placeholder foto utama pasangan', 50, 40),
  ('00000000-0000-4000-8000-0000000000a2', null, '/placeholders/hero.svg',    'image', 'image/svg+xml', 1600, 2000, 'Placeholder foto pasangan untuk hero', 50, 35),
  ('00000000-0000-4000-8000-0000000000a3', null, '/placeholders/person-1.svg','image', 'image/svg+xml', 900, 1200, 'Placeholder foto mempelai pertama', 50, 30),
  ('00000000-0000-4000-8000-0000000000a4', null, '/placeholders/person-2.svg','image', 'image/svg+xml', 900, 1200, 'Placeholder foto mempelai kedua', 50, 30),
  ('00000000-0000-4000-8000-0000000000a5', null, '/placeholders/venue.svg',   'image', 'image/svg+xml', 1600, 1000, 'Placeholder foto venue', 50, 50),
  ('00000000-0000-4000-8000-0000000000a6', null, '/placeholders/closing.svg', 'image', 'image/svg+xml', 1200, 1600, 'Placeholder foto penutup', 50, 45),
  ('00000000-0000-4000-8000-0000000000b1', null, '/placeholders/gallery-1.svg','image','image/svg+xml', 1000, 1400, 'Placeholder galeri 1', 50, 50),
  ('00000000-0000-4000-8000-0000000000b2', null, '/placeholders/gallery-2.svg','image','image/svg+xml', 1400, 1000, 'Placeholder galeri 2', 50, 50),
  ('00000000-0000-4000-8000-0000000000b3', null, '/placeholders/gallery-3.svg','image','image/svg+xml', 1000, 1000, 'Placeholder galeri 3', 50, 50),
  ('00000000-0000-4000-8000-0000000000b4', null, '/placeholders/gallery-4.svg','image','image/svg+xml', 1000, 1500, 'Placeholder galeri 4', 50, 50),
  ('00000000-0000-4000-8000-0000000000b5', null, '/placeholders/gallery-5.svg','image','image/svg+xml', 1500, 1000, 'Placeholder galeri 5', 50, 50),
  ('00000000-0000-4000-8000-0000000000b6', null, '/placeholders/gallery-6.svg','image','image/svg+xml', 1000, 1300, 'Placeholder galeri 6', 50, 50),
  ('00000000-0000-4000-8000-0000000000b7', null, '/placeholders/gallery-7.svg','image','image/svg+xml', 1000, 1400, 'Placeholder galeri 7', 50, 50),
  ('00000000-0000-4000-8000-0000000000b8', null, '/placeholders/gallery-8.svg','image','image/svg+xml', 1400, 1000, 'Placeholder galeri 8', 50, 50)
on conflict (id) do update set url = excluded.url, width = excluded.width, height = excluded.height, alt = excluded.alt;

-- ---------- preset tema ----------
insert into public.wedding_themes (slug, name, description, is_preset, sort_order, tokens) values
('modern-elegant', 'Modern Elegant', 'Ivory, olive, dan emas redup. Tenang dan editorial.', true, 1,
 '{"colors":{"primary":"#454B40","secondary":"#E7D8C5","accent":"#B49A73","background":"#FAF8F3","surface":"#FFFFFF","text":"#292929"},
   "fonts":{"heading":"Cormorant Garamond","body":"DM Sans","accent":"Pinyon Script"},
   "fontScale":1,"radius":2,"buttonStyle":"solid","navStyle":"floating","animation":"normal","overlay":0.42}'),
('classic-luxury', 'Classic Luxury', 'Navy tua dan emas antik dengan serif klasik.', true, 2,
 '{"colors":{"primary":"#1F2A44","secondary":"#E9E1D0","accent":"#A8894F","background":"#F7F4EE","surface":"#FFFFFF","text":"#1E1E1E"},
   "fonts":{"heading":"Playfair Display","body":"Inter","accent":"Great Vibes"},
   "fontScale":1,"radius":0,"buttonStyle":"outline","navStyle":"floating","animation":"subtle","overlay":0.5}'),
('botanical-garden', 'Botanical Garden', 'Hijau daun dan krem untuk resepsi taman.', true, 3,
 '{"colors":{"primary":"#3E5641","secondary":"#DCE3D3","accent":"#9C8455","background":"#F5F6F0","surface":"#FFFFFF","text":"#253026"},
   "fonts":{"heading":"EB Garamond","body":"Manrope","accent":"Parisienne"},
   "fontScale":1,"radius":10,"buttonStyle":"solid","navStyle":"floating","animation":"normal","overlay":0.4}'),
('minimalist-monochrome', 'Minimalist Monochrome', 'Hitam putih, kontras tinggi, tanpa basa-basi.', true, 4,
 '{"colors":{"primary":"#1A1A1A","secondary":"#E6E4E0","accent":"#6B6B6B","background":"#FAFAFA","surface":"#FFFFFF","text":"#161616"},
   "fonts":{"heading":"Bodoni Moda","body":"Inter","accent":"Allura"},
   "fontScale":1,"radius":0,"buttonStyle":"underline","navStyle":"bar","animation":"subtle","overlay":0.5}'),
('romantic-champagne', 'Romantic Champagne', 'Champagne dan mauve yang hangat dan lembut.', true, 5,
 '{"colors":{"primary":"#6E4F4A","secondary":"#F1E2D8","accent":"#C29A7E","background":"#FCF7F3","surface":"#FFFFFF","text":"#3A2C2A"},
   "fonts":{"heading":"Cormorant Garamond","body":"Jost","accent":"Great Vibes"},
   "fontScale":1,"radius":14,"buttonStyle":"solid","navStyle":"floating","animation":"normal","overlay":0.38}'),
('editorial-wedding', 'Editorial Wedding', 'Tata letak majalah dengan aksen terakota.', true, 6,
 '{"colors":{"primary":"#2B2B2B","secondary":"#EDE6DA","accent":"#B0563A","background":"#F4F1EA","surface":"#FFFFFF","text":"#1F1F1F"},
   "fonts":{"heading":"Libre Caslon Text","body":"DM Sans","accent":"Pinyon Script"},
   "fontScale":1.05,"radius":0,"buttonStyle":"outline","navStyle":"bar","animation":"expressive","overlay":0.46}')
on conflict (slug) do update set name = excluded.name, description = excluded.description, tokens = excluded.tokens, sort_order = excluded.sort_order;

-- ---------- settings ----------
insert into public.wedding_settings (
  id, site_name, site_title, meta_description, language, timezone, wedding_date, couple, monogram_text,
  og_media_id, music_enabled, music_volume, rsvp_deadline, rsvp_max_pax, wishes_moderation, noindex,
  theme, theme_slug, is_published
) values (
  1,
  'Undangan Pernikahan',
  'The Wedding of [Nama Mempelai Pertama] & [Nama Mempelai Kedua]',
  'Dengan penuh syukur kami mengundang Anda untuk hadir di hari pernikahan kami.',
  'id',
  'Asia/Jakarta',
  '2027-06-12 08:00:00+07',
  '{
    "order": "first_second",
    "first": {"full_name": "[Nama Mempelai Pertama]", "nickname": "[Pertama]", "parent_label": "Putra dari",
              "parents": "Bapak [Nama Ayah] & Ibu [Nama Ibu]", "bio": "", "instagram": "", "photo_id": "00000000-0000-4000-8000-0000000000a3"},
    "second": {"full_name": "[Nama Mempelai Kedua]", "nickname": "[Kedua]", "parent_label": "Putri dari",
               "parents": "Bapak [Nama Ayah] & Ibu [Nama Ibu]", "bio": "", "instagram": "", "photo_id": "00000000-0000-4000-8000-0000000000a4"}
  }',
  '',
  null,
  false,
  0.45,
  '2027-06-01 23:59:00+07',
  2,
  'manual',
  true,
  (select tokens from public.wedding_themes where slug = 'modern-elegant'),
  'modern-elegant',
  true
)
on conflict (id) do update set
  site_name = excluded.site_name, site_title = excluded.site_title, meta_description = excluded.meta_description,
  wedding_date = excluded.wedding_date, couple = excluded.couple, monogram_text = excluded.monogram_text,
  theme = excluded.theme, theme_slug = excluded.theme_slug, rsvp_deadline = excluded.rsvp_deadline;

-- ---------- sections ----------
delete from public.wedding_sections;
insert into public.wedding_sections (key, title, subtitle, enabled, sort_order, background, content) values
('cover', 'Opening Cover', '', true, 0, 'primary',
 '{"eyebrow":"The Wedding of","greeting":"Kepada Yth. Bapak/Ibu/Saudara/i","default_guest":"Tamu Undangan","button_label":"Buka Undangan","media_id":"00000000-0000-4000-8000-0000000000a1"}'),
('hero', 'Hero', '', true, 1, 'background',
 '{"tagline":"Dua perjalanan, satu rumah yang sama.","button_label":"Simpan Tanggal","media_id":"00000000-0000-4000-8000-0000000000a2"}'),
('quote', 'Kutipan', '', true, 2, 'surface',
 '{"type":"quran",
   "arabic":"وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً ۚ إِنَّ فِي ذَٰلِكَ لَآيَاتٍ لِّقَوْمٍ يَتَفَكَّرُونَ",
   "text":"Di antara tanda-tanda (kebesaran)-Nya ialah bahwa Dia menciptakan pasangan-pasangan untukmu dari (jenis) dirimu sendiri agar kamu merasa tenteram kepadanya. Dia menjadikan di antaramu rasa cinta dan kasih sayang. Sesungguhnya pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.",
   "source":"QS. Ar-Rum: 21"}'),
('couple', 'Mempelai', 'Dengan memohon rahmat dan ridha Allah SWT, kami bermaksud menyelenggarakan pernikahan kami.', true, 3, 'background',
 '{"connector":"&"}'),
('countdown', 'Save the Date', 'Menghitung hari menuju hari bahagia.', true, 4, 'primary',
 '{"after_message":"Our Happily Ever After Begins","calendar_title":"Pernikahan [Nama Mempelai Pertama] & [Nama Mempelai Kedua]","calendar_description":"Undangan pernikahan","duration_hours":4}'),
('events', 'Rangkaian Acara', 'Merupakan kehormatan bagi kami atas kehadiran Anda.', true, 5, 'surface',
 '{"dress_code":"[Dress code, misalnya: Earth tone, formal]","guest_rules":"","notes":""}'),
('location', 'Lokasi', '', true, 6, 'background',
 '{"venue_name":"[Nama Venue]","address":"[Alamat Venue]","maps_url":"","show_map":true,"parking":"","access":"","media_id":"00000000-0000-4000-8000-0000000000a5"}'),
('story', 'Our Love Story', 'Perjalanan kecil yang membawa kami ke hari ini.', true, 7, 'secondary', '{}'),
('gallery', 'Galeri', 'Potongan cerita dalam bingkai.', true, 8, 'background',
 '{"video_type":"none","youtube_url":"","video_media_id":null,"video_poster_id":null}'),
('rsvp', 'Konfirmasi Kehadiran', 'Mohon kabari kami sebelum batas waktu konfirmasi.', true, 9, 'surface',
 '{"success_message":"Terima kasih, konfirmasi Anda sudah kami terima.","closed_message":"Konfirmasi kehadiran sudah ditutup. Terima kasih atas perhatian Anda."}'),
('wishes', 'Ucapan & Doa', 'Tuliskan doa dan ucapan untuk kami.', true, 10, 'background',
 '{"page_size":6,"pending_message":"Terima kasih. Ucapan Anda akan tampil setelah ditinjau."}'),
('gift', 'Wedding Gift', 'Doa restu Anda adalah hadiah terindah bagi kami. Namun apabila Anda ingin memberikan tanda kasih, kami menyediakan pilihan berikut.', true, 11, 'secondary', '{}'),
('livestream', 'Siaran Langsung', 'Bagi yang berhalangan hadir, Anda tetap dapat menyaksikan akad kami secara daring.', false, 12, 'surface',
 '{"platform":"youtube","url":"","description":"","schedule":"","button_label":"Tonton Siaran"}'),
('hashtag', 'Bagikan Momen', 'Gunakan tagar ini saat membagikan foto di hari bahagia kami.', true, 13, 'background',
 '{"hashtag":"#[TagarPernikahan]","instagram_url":""}'),
('closing', 'Terima Kasih', '', true, 14, 'primary',
 '{"message":"Merupakan suatu kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.","signature":"Kami yang berbahagia","media_id":"00000000-0000-4000-8000-0000000000a6"}');

-- ---------- acara ----------
delete from public.wedding_events;
insert into public.wedding_events (title, event_date, start_time, end_time, time_note, venue_name, address, maps_url, dress_code, notes, sort_order) values
('Akad Nikah', '2027-06-12', '08:00', '10:00', '', '[Nama Venue]', '[Alamat Venue]', '', '', 'Acara akad dihadiri keluarga inti dan kerabat dekat.', 0),
('Resepsi Pernikahan', '2027-06-12', '11:00', '14:00', '', '[Nama Venue]', '[Alamat Venue]', '', '', '', 1);

-- ---------- love story ----------
delete from public.love_stories;
insert into public.love_stories (title, date_label, description, media_id, sort_order) values
('First Meet', '[Tahun]', '[Ceritakan singkat di mana dan bagaimana kalian pertama bertemu.]', '00000000-0000-4000-8000-0000000000b3', 0),
('Getting Closer', '[Tahun]', '[Momen yang membuat kalian mulai dekat.]', null, 1),
('In a Relationship', '[Tahun]', '[Kapan kalian memutuskan untuk bersama.]', null, 2),
('The Proposal', '[Tanggal]', '[Cerita singkat tentang lamaran.]', '00000000-0000-4000-8000-0000000000b5', 3),
('Engagement', '[Tanggal]', '[Acara pertunangan atau lamaran keluarga.]', null, 4),
('Wedding Day', '12 Juni 2027', '[Hari yang kalian nantikan.]', null, 5);

-- ---------- galeri ----------
delete from public.gallery_images;
insert into public.gallery_images (media_id, caption, layout, sort_order) values
('00000000-0000-4000-8000-0000000000b1', '', 'tall', 0),
('00000000-0000-4000-8000-0000000000b2', '', 'wide', 1),
('00000000-0000-4000-8000-0000000000b3', '', 'auto', 2),
('00000000-0000-4000-8000-0000000000b4', '', 'tall', 3),
('00000000-0000-4000-8000-0000000000b5', '', 'wide', 4),
('00000000-0000-4000-8000-0000000000b6', '', 'auto', 5),
('00000000-0000-4000-8000-0000000000b7', '', 'auto', 6),
('00000000-0000-4000-8000-0000000000b8', '', 'wide', 7);

-- ---------- hadiah ----------
delete from public.wedding_gifts;
insert into public.wedding_gifts (type, provider, account_number, account_holder, address, note, enabled, sort_order) values
('bank', '[Nama Bank]', '[Nomor Rekening]', '[Nama Pemilik Rekening]', '', '', true, 0),
('ewallet', '[Nama E-Wallet]', '[Nomor E-Wallet]', '[Nama Pemilik]', '', '', true, 1),
('address', 'Kirim Hadiah', '', '[Nama Penerima]', '[Alamat Pengiriman Hadiah]', '', true, 2);

-- ---------- template WhatsApp ----------
insert into public.invitation_templates (name, is_default, body)
select 'Undangan resmi (Islami)', true,
'Assalamu''alaikum Warahmatullahi Wabarakatuh.

Yth. Bapak/Ibu/Saudara/i {nama_tamu},

Dengan memohon rahmat dan ridha Allah SWT, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami.

{nama_mempelai_1} & {nama_mempelai_2}

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Informasi selengkapnya dapat diakses melalui tautan berikut:

{link_undangan}

Terima kasih atas perhatian dan doa restunya.

Wassalamu''alaikum Warahmatullahi Wabarakatuh.'
where not exists (select 1 from public.invitation_templates);

-- ---------- publikasi awal agar situs langsung bisa dilihat ----------
update public.wedding_settings
   set published_snapshot = public._build_snapshot(false), published_at = now()
 where id = 1;

commit;
