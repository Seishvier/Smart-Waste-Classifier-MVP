# Smart Waste Classifier

Aplikasi web mobile-first untuk membantu pengguna mempelajari pemilahan sampah melalui alur foto, panduan kategori, tips persiapan, riwayat lokal, dan koreksi manual.

> **Penting:** Versi MVP ini belum menggunakan model AI atau computer vision. Klasifikasi adalah simulasi lokal berbasis kata pada nama file; untuk foto dari kamera atau file dengan nama yang tidak cocok, hasil bisa berupa kategori residu. Jangan menganggap hasil simulasi sebagai identifikasi objek yang akurat.

## Fitur

- Antarmuka berbahasa Indonesia dan desain responsif.
- Alur kamera (jika browser mendukung dan izin diberikan) serta pemilihan foto dari galeri.
- Hasil simulasi dengan kategori, warna tempat sampah, tingkat keyakinan, tiga tips persiapan, fakta singkat, ide pengurangan/pemanfaatan, dan catatan keselamatan bila diperlukan.
- Koreksi kategori manual.
- Riwayat, filter kategori/warna, dan hapus item.
- Statistik sederhana dan mode gelap.
- Penyimpanan lokal memakai `localStorage`.
- HTML, CSS, dan JavaScript dipisah ke file terstruktur.

## Struktur proyek

```text
smart-waste-classifier/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── camera.js
│   ├── classification.js
│   └── storage.js
├── assets/
└── README.md
```

## Menjalankan secara lokal

1. Unduh atau clone repositori.
2. Buka folder proyek di editor.
3. Jalankan server lokal, misalnya ekstensi Live Server di VS Code, atau gunakan server HTTP lokal lain.
4. Buka alamat localhost yang disediakan.

Kamera umumnya membutuhkan **HTTPS atau localhost**. Membuka `index.html` langsung lewat `file://` dapat membuat akses kamera tidak tersedia. Jika kamera tidak bisa digunakan, pilih foto dari galeri.

## Deploy ke GitHub Pages

1. Buat repositori GitHub dan unggah semua file dengan struktur di atas.
2. Buka **Settings → Pages**.
3. Pada bagian build/deployment, pilih **Deploy from a branch**.
4. Pilih branch utama (biasanya `main`) dan folder `/(root)`, lalu simpan.
5. Tunggu proses deployment, lalu buka URL yang diberikan GitHub Pages.

Pastikan `index.html` berada di root repositori. Semua jalur file menggunakan jalur relatif agar bisa berjalan di GitHub Pages.

## Teknologi

- HTML5
- CSS3 (custom properties, grid, flexbox, dark mode, reduced motion)
- JavaScript vanilla
- `navigator.mediaDevices.getUserMedia`, video, dan canvas untuk kamera
- `localStorage` untuk riwayat dan pengaturan

## Privasi

- Tidak ada backend atau layanan analisis foto yang dipanggil oleh kode ini.
- Foto yang dipilih ditampilkan sementara di browser dan tidak diunggah ke server.
- Hasil hanya disimpan ketika pengguna menekan tombol **Simpan hasil**. Untuk membantu tampilan riwayat, pratinjau foto dapat disimpan sebagai data URL di `localStorage`, yang memakai ruang browser.
- Menghapus riwayat menghapus hasil tersimpan dari `localStorage` browser ini.
- Jangan menyimpan foto pribadi atau sensitif. Penyimpanan lokal tidak terenkripsi dan hanya berlaku untuk browser/perangkat ini.

## Batasan MVP

- Klasifikasi belum memakai AI sungguhan dan tidak menganalisis piksel foto.
- Demo mencoba mencocokkan kata pada nama file (misalnya `battery.jpg`, `cardboard.png`, atau `plastic-bottle.jpg`). Nama file tidak membuktikan material objek.
- Pemetaan warna tempat sampah merupakan panduan umum proyek. Aturan pengumpulan dan warna bisa berbeda di daerah masing-masing.
- Koreksi disimpan untuk catatan lokal dan belum melatih model apa pun.
- Sinkronisasi cloud, model AI, ekspor gambar, dan multibahasa berada di luar lingkup MVP.

## Lisensi

Tambahkan file lisensi sesuai kebutuhan proyek sebelum distribusi publik.
