# Frontend - SPK Seleksi Penerimaan Bantuan PIP
## Antarmuka Web Interaktif (React 19 + Vite 8)

Modul frontend untuk aplikasi **Sistem Pendukung Keputusan Seleksi Bantuan Program Indonesia Pintar (PIP)** di SMKS Dharma Bhakti Walter Manalu Siborongborong.

---

## 1. Fitur Antarmuka Utama

1. **Halaman Depan Edukatif (`LandingPage.jsx`):**
   - Tampilan beranda modern dengan tipografi **Instrument Sans** dan aksen serif **Instrument Serif**.
   - Dilengkapi simulator kuota interaktif, infografis resmi alur seleksi PIP, penjelasan metode BWM & WASPAS, formulir konsultasi, dan pratinjau antarmuka sistem.
   - Pintu masuk terpisah: **Mulai Sekarang** (Mode Live) dan **Lihat Demo (Operator)** (Mode Demo).
2. **Navigasi Sidebar Responsif (`Sidebar.jsx`):**
   - Terletak di sisi kiri layar dengan indikator jumlah siswa, status kuota, dan indikator dataset aktif (Dataset Bab 3 vs Dataset Bawaan).
   - Dilengkapi *mobile drawer* untuk kenyamanan di perangkat smartphone dan tablet.
3. **Banner Pengalih Dataset Demo (`App.jsx`):**
   - Di Mode Demo, pengguna dapat berpindah antara **Dataset Proposal Bab 3 (9 Kriteria, 15 Siswa)** dan **Dataset Bawaan (6 Kriteria, 120 Siswa)** hanya dengan sekali klik tanpa kehilangan data.
4. **Manajemen Kriteria Seleksi (`CriteriaView.jsx`):**
   - Mendukung tipe kriteria **Cost** (semakin kecil semakin prioritas) dan **Benefit** (semakin besar semakin prioritas).
   - Konfigurasi skala konversi angka (Rupiah, Skala 1–5, Jumlah Jiwa, Ya/Tidak).
5. **Wizard Penilaian Multi-Pakar BWM (`BwmView.jsx`):**
   - Panduan pengisian preferensi berpasangan *Best-to-Others* dan *Others-to-Worst* berskala 1–9.
   - Penilaian otomatis rasio konsistensi ($CR$) dengan indikator warna (Hijau: Konsisten, Oranye: Perlu Cek Ulang).
   - Tabel konsensus bobot akhir hasil agregasi Rata-rata Geometrik (*Geometric Mean*).
6. **Data Siswa & Mesin Validasi Excel (`StudentsView.jsx`):**
   - Tabel interaktif dengan pencarian multi-kolom dan pagination.
   - Fitur unggah file Excel/CSV dengan pratinjau sebelum disimpan, validasi batas nilai kriteria, dan deteksi NISN duplikat.
7. **Perangkingan WASPAS & Simulasi Kuota (`WaspasView.jsx`):**
   - Simulasi kuota penerima secara instan dengan pengelompokan **Lolos Kuota (Prioritas Utama)** dan **Cadangan Prioritas**.
   - Tab transparansi perhitungan: Matriks Keputusan Awal ($X$), Matriks Ternormalisasi ($R$), dan Skor WSM ($Q_1$) serta WPM ($Q_2$).
8. **Format Berita Acara Cetak Resmi (`ReportView.jsx`):**
   - Format Berita Acara siap cetak dengan kop sekolah, nomor surat keputusan, tanggal sidang, dan lembar pengesahan 3 pejabat sekolah.
9. **Dukungan Tema Mode Gelap & Mode Terang:**
   - Tersedia tombol sakelar cepat di navbar dan sidebar dengan penyimpanan otomatis di `localStorage`.

---

## 2. Struktur Komponen Frontend

```text
frontend/
├── src/
│   ├── components/
│   │   ├── LandingPage.jsx      # Halaman pendaratan edukatif & alur PIP
│   │   ├── Sidebar.jsx          # Navigasi sidebar kiri & status kuota
│   │   ├── DashboardView.jsx    # Dashboard metrik & alur kerja terpandu
│   │   ├── CriteriaView.jsx     # CRUD kriteria & opsi skala nilai
│   │   ├── BwmView.jsx          # Wizard penilaian BWM & uji konsistensi CR
│   │   ├── StudentsView.jsx     # Tabel data siswa, pencarian, & import Excel
│   │   ├── WaspasView.jsx       # Perangkingan WASPAS, simulasi kuota & matriks
│   │   ├── ReportView.jsx       # Berita Acara resmi penetapan siap cetak
│   │   ├── UsersView.jsx        # Kelola pengguna sistem (Mode Live)
│   │   └── LoginModal.jsx       # Modal login keamanan sistem (JWT & Bcrypt)
│   ├── services/
│   │   └── api.js               # Service API client (Fetch dengan JWT & mode header)
│   ├── App.jsx                  # Orchestrator state utama & rute tab
│   ├── index.css                # Design system berbasis Vanilla CSS variables
│   └── main.jsx                 # Entry point React DOM
├── index.html
├── package.json
└── vite.config.js
```

---

## 3. Cara Menjalankan Frontend

Pastikan Anda berada di direktori `frontend`:

```bash
cd frontend
```

### Install Dependensi (hanya pertama kali):
```bash
npm install
```

### Menjalankan Development Server:
```bash
npm run dev
```
Setelah server aktif, buka URL yang ditampilkan di terminal (biasanya **`http://localhost:5174`** atau `http://localhost:3000`).

### Membuat Bundle Produksi:
```bash
npm run build
```
Hasil kompilasi file statis akan disimpan di folder `dist/`.

---

## 4. Konfigurasi Lingkungan
- Endpoint default server backend diarahkan ke **`http://localhost:5000/api`**.
- Konfigurasi alamat API dapat diubah di file [`src/services/api.js`](src/services/api.js).
