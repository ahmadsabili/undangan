# Panduan Admin (tanpa coding)

Panduan ini untuk pemilik undangan yang mengelola konten lewat dashboard. Tidak perlu membuka kode sama sekali.

## Konsep penting: Draft dan Publish

Semua yang Anda ubah di dashboard tersimpan sebagai **draft**. Tamu belum melihatnya. Setelah puas, tekan tombol **Publish** di bar atas. Barulah undangan publik berubah.

Di bar atas ada dua penanda:

- **Situs online / offline**: apakah tautan undangan bisa dibuka tamu.
- **Ada perubahan belum dipublish**: draft berbeda dengan yang sedang tayang. Tombol Publish hanya aktif bila ada perubahan.

Ingin membatalkan semua perubahan draft? Buka **Backup & Restore**, tekan **Buang draft**.

## 1. Masuk

Buka `domain-anda.com/admin`, masukkan email dan password admin. Bila lupa password, minta pengelola teknis menjalankan ulang skrip `create-admin` dengan email lain, atau reset password dari dashboard Supabase.

## 2. Mengganti konten (menu Konten)

1. Di kolom kiri ada daftar section. Klik nama section untuk mengeditnya.
2. Ubah teks atau foto di sebelah kanan.
3. Tekan **Simpan draft**. Tombol **Reset** mengembalikan isian ke kondisi terakhir disimpan.

Tips per section:

| Section | Yang bisa diatur |
| --- | --- |
| Opening Cover | Foto latar, teks sapaan, nama tamu bawaan, label tombol |
| Hero | Foto utama, tagline, label tombol Simpan Tanggal |
| Kutipan | Jenis (ayat, religius, romantis, custom), teks Arab, terjemahan, sumber |
| Mempelai | Foto, nama lengkap, panggilan, orang tua, keterangan, Instagram, tombol **Tukar urutan** |
| Save the Date | Pesan setelah acara lewat, judul di kalender |
| Rangkaian Acara | Tambah/hapus/urutkan acara, dress code, ketentuan tamu |
| Lokasi | Nama venue, alamat, tautan Maps, peta, parkir, akses |
| Love Story | Tambah/hapus/urutkan tahapan, foto opsional |
| Galeri | Tambah foto, ukuran tampil (normal/tinggi/lebar), video YouTube atau upload |
| Wedding Gift | Rekening, e-wallet, QRIS, alamat. Aktif/nonaktif per item |
| Siaran Langsung | Platform, tautan, jadwal (nonaktif secara bawaan) |

**Mengurutkan section**: seret ikon titik-titik di kiri nama section. Dengan keyboard: fokus ke ikon, tekan Spasi, panah atas/bawah, lalu Spasi lagi.

**Menyembunyikan section**: matikan sakelar di kanan nama section. Menu navigasi bawah ikut menyesuaikan.

**Nama mempelai & tanggal** yang tampil di cover diambil dari section Mempelai (nama panggilan) dan menu **Pengaturan** (tanggal).

## 3. Foto, musik, dan video (menu Media)

- Seret file ke kotak unggah atau tekan **Pilih file**. Foto otomatis diperkecil dan dikompres agar cepat dibuka.
- Klik sebuah media untuk:
  - mengisi **alt text** (deskripsi singkat untuk tamu yang memakai pembaca layar),
  - mengatur **titik fokus**: klik bagian penting foto (misalnya wajah) supaya tidak terpotong,
  - **Ganti file**: semua section yang memakai media itu ikut berganti,
  - **Hapus**: ditolak bila media masih dipakai. Pesan akan menyebut di mana media dipakai.
- Batas ukuran: gambar 15 MB, audio 15 MB, video 50 MB.
- Untuk musik, gunakan lagu yang Anda punya izin pakainya.

## 4. Tampilan (menu Tema)

**Template tata letak** mengubah susunan seluruh undangan. Pilih salah satu, lalu Simpan draft dan cek di Preview:

| Template | Cocok untuk |
| --- | --- |
| Editorial | Gaya majalah modern, asimetris |
| Klasik Simetris | Kesan kartu undangan cetak yang formal |
| Sinematik Foto Penuh | Punya banyak foto prewedding bagus. Atur foto latar tiap section di menu Konten |
| Kartu Minimal | Ringkas dan rapi, tampil seperti kartu di desktop |
| Tradisional Nusantara | Nuansa adat. Motif kawung bawaan bisa diganti gambar ornamen sendiri |
| Art Deco Mewah | Kesan glamor dan formal. Paling bagus dengan tema gelap seperti Noir Deco atau Emerald Royale |
| Lengkung Modern | Gaya kekinian dengan foto berbentuk lengkung. Cocok dengan palet pastel |
| Bento Modern | Tampilan ubin seperti aplikasi modern, rapi di ponsel maupun desktop |

- Pilih salah satu preset (warna + font + gaya). Konten tidak berubah sama sekali.
- Di kartu **Warna**, klik salah satu **palet cepat** untuk mengganti warna saja tanpa mengubah font. Ada palet netral, pastel, dan gelap mewah. Semua palet sudah dicek kontrasnya.
- Atur warna, font, ukuran huruf, sudut, gaya tombol, navigasi, animasi, dan kegelapan overlay foto.
- Daftar **cek kontras** memberi peringatan bila kombinasi warna sulit dibaca.
- **Simpan ke daftar preset** menyimpan kombinasi Anda sebagai tema custom.

## 5. Daftar tamu & mengirim undangan

1. Menu **Daftar Tamu** > **Tambah tamu**, atau **Import CSV** (unduh contoh file dulu).
2. Setiap tamu mendapat kode unik. Tautannya berbentuk `domain-anda.com/?guest=KODE`. Nama tamu tampil otomatis di cover dan di form RSVP.
3. Ikon di setiap baris:
   - **Rantai**: salin tautan.
   - **QR**: tampilkan dan unduh QR code (untuk undangan cetak).
   - **Pesan**: buka pesan WhatsApp yang sudah terisi. Anda masih bisa mengedit pesan, lalu tekan **Buka WhatsApp** dan kirim sendiri dari aplikasi WhatsApp. Tekan **Tandai terkirim** untuk mencatat.
4. Untuk tamu yang tidak dicatat, pakai kotak **Tautan cepat dengan nama** di atas tabel (format `?to=Nama`).

Isi pesan diatur di menu **Template WhatsApp**. Variabel yang tersedia: `{nama_tamu}`, `{nama_mempelai_1}`, `{nama_mempelai_2}`, `{link_undangan}`.

## 6. RSVP dan ucapan

- **RSVP**: lihat, cari, filter, edit, hapus, dan export CSV. Rekap jumlah orang di bagian atas.
- **Batas waktu RSVP** dan **maksimum orang** diatur di **Pengaturan**. Batas per tamu terdaftar diatur di Daftar Tamu.
- **Ucapan**: setujui, sembunyikan, atau hapus. Sakelar **Moderasi otomatis** menentukan apakah ucapan baru langsung tampil. Ucapan yang mengandung tautan atau kata terlarang selalu menunggu persetujuan.

## 6b. Fitur tambahan (opsional)

Buka **Pengaturan > Fitur tambahan**. Ketiganya bawaan nonaktif dan berlaku langsung tanpa Publish.

**Undangan per acara / sesi.** Untuk acara yang tidak terbuka bagi semua tamu, misalnya akad hanya keluarga atau resepsi dua sesi.
1. Buat acaranya di **Konten > Rangkaian Acara**. Isi **Kapasitas** bila ingin dipantau.
2. Di **Daftar Tamu**, klik **Atur acara per kategori**, atau centang acara di form Edit tamu. Tamu tanpa centang melihat semua acara.
3. Saat import CSV, tambahkan kolom `acara` berisi judul acara dipisah titik koma, misalnya `Akad Nikah; Resepsi Sesi 1`.
4. Pakai `{acara_tamu}` di template WhatsApp agar pesan menyebut acara, jam, dan tempat milik tamu itu.
5. **Ringkasan** menampilkan jumlah diundang dan hadir per acara.

**Status "sudah dibuka".** Kolom **Dibuka** muncul di Daftar Tamu. Filter **Terkirim, belum dibuka** untuk mengirim pengingat. Hanya tautan berkode yang tercatat.

**Undangan fisik.**
1. Aktifkan sakelar **Undangan fisik**. Di Daftar Tamu muncul kolom **Jenis**. Isi lewat Edit tamu, atau kolom `jenis` (digital / fisik / keduanya) saat import CSV.
2. Klik **Ekspor untuk cetak**, pilih tamu (jenis Fisik & Keduanya, atau sesuai filter), lalu formatnya:
    - **PDF kartu**: 10 kartu per A4 berisi nama, QR, dan tautan pendek.
    - **PDF stiker QR**: 24 stiker per A4 untuk ditempel di kartu undangan yang sudah jadi.
    - **ZIP untuk percetakan**: gambar QR per tamu + `daftar-cetak.csv` untuk mail merge, agar nama dan QR langsung dicetak di kartu.
3. Cetak satu lembar uji dan pindai QR-nya dengan kamera ponsel sebelum mencetak semuanya. Pastikan `NEXT_PUBLIC_SITE_URL` sudah berisi domain final, karena tautan di kartu tidak bisa diubah setelah dicetak.
4. Tamu yang tidak bisa memindai QR cukup mengetik tautan pendek seperti `domain-anda/u/K7QW2MNP4X`.
5. Tandai **Terkirim** setelah kartu diantar.

**RSVP manual.** Tamu yang konfirmasi lewat telepon atau titip pesan: buka **RSVP** > **Catat RSVP manual**, atau klik ikon centang-papan di baris tamu pada Daftar Tamu. RSVP ini masuk ke rekap yang sama dan ditandai *dicatat admin*.

**Backup otomatis.** Seminggu sekali sistem menyimpan salinan konfigurasi, tamu, RSVP, dan ucapan. Lihat di menu **Backup & Restore** > **Backup otomatis**: unduh file, atau klik **Buat backup sekarang** sebelum perubahan besar. Untuk memulihkan, pilih file yang diunduh di kartu **Restore**: konfigurasi dipulihkan ke draft, dan tombol **Kembalikan tamu, RSVP, dan ucapan yang terhapus** menambahkan kembali data yang sempat terhapus tanpa mengubah data yang masih ada. Sesekali simpan salinannya di luar Supabase, misalnya Google Drive.

**Undangan pribadi.** Di Pengaturan > Fitur tambahan, atur **Siapa yang bisa membuka undangan**:
- *Semua orang yang punya alamat undangan* (bawaan).
- *Hanya lewat tautan tamu*: alamat utama tanpa `?guest=` atau `?to=` menampilkan pesan "Undangan ini bersifat pribadi".
- *Hanya tamu terdaftar*: hanya tautan berkode dari Daftar Tamu. Tautan cepat `?to=Nama` ikut ditolak, begitu juga RSVP dan ucapan tanpa kode. Pratinjau admin tetap berjalan.

**Check-in hari H.**
1. Aktifkan fiturnya beberapa hari sebelum acara.
2. Buat akun untuk tiap penerima tamu: `npm run create-admin -- petugas1@email.com "password" checkin`. Akun petugas hanya bisa membuka halaman check-in.
3. Di hari H, petugas membuka `domain-anda/admin/login` di ponselnya, login, dan otomatis masuk ke halaman **Check-in**.
4. Tekan **Buka kamera** lalu arahkan ke QR undangan tamu (dari WhatsApp atau undangan cetak). Bila tamu tidak membawa QR, cari namanya.
5. Sesuaikan jumlah orang, tekan **Check-in sekarang**. Salah catat? Tekan **Batalkan check-in**.
6. Tamu yang tidak ada di daftar: **Tamu tanpa undangan terdaftar**.
7. Uji sekali sebelum hari H dengan satu tamu contoh, termasuk izin kamera di ponsel petugas. Siapkan koneksi internet yang stabil di meja penerima tamu.

## 7. Preview

Menu **Preview** menampilkan draft dalam bingkai ponsel, tablet, atau desktop. Isi **Nama tamu contoh** untuk melihat cover dengan nama tertentu. Formulir di mode preview tidak menyimpan data.

## 8. Online / offline

Di **Pengaturan > Status publikasi** Anda bisa membuat undangan offline sementara (misalnya sebelum siap dibagikan). Berlaku langsung tanpa Publish.

## Checklist sebelum dibagikan

- [ ] Semua teks dalam `[kurung siku]` sudah diganti.
- [ ] Foto placeholder sudah diganti dengan foto asli, alt text terisi.
- [ ] Tanggal, jam, dan zona waktu di Pengaturan benar. Countdown menghitung ke waktu yang tepat.
- [ ] Tombol Google Maps di tiap acara membuka lokasi yang benar.
- [ ] Tombol Google Calendar dan file .ics berisi jam yang benar.
- [ ] Kirim RSVP percobaan dari ponsel, cek muncul di menu RSVP, lalu hapus.
- [ ] Kirim ucapan percobaan, setujui, cek tampil, lalu hapus.
- [ ] Salin nomor rekening di Wedding Gift berfungsi.
- [ ] Musik bisa diputar dan dijeda (bila aktif).
- [ ] Buka tautan `?guest=KODE` milik satu tamu, nama tampil benar.
- [ ] Kirim tautan ke diri sendiri di WhatsApp, preview menampilkan foto, nama, dan tanggal.
- [ ] Export konfigurasi JSON sebagai cadangan.
- [ ] Publish.
