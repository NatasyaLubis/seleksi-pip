# Sistem Pendukung Keputusan Seleksi Penerimaan Bantuan PIP
## Integrasi Metode Multi-Expert Best-Worst Method (BWM) & WASPAS
**Studi Kasus:** SMKS Dharma Bhakti Walter Manalu Siborongborong  
**Peneliti:** Natasya Lubis (Program Studi Sistem Informasi / Teknik Informatika)

---

## 1. Deskripsi Proyek

Aplikasi **Sistem Pendukung Keputusan (SPK) Seleksi Bantuan Program Indonesia Pintar (PIP)** adalah sistem berbasis web yang dirancang untuk membantu pihak sekolah menentukan calon penerima bantuan beasiswa PIP secara **ilmiah, objektif, transparan, dan terukur**.

Sistem ini memadukan dua metode pengambilan keputusan multikriteria (*Multi-Criteria Decision Making* / MCDM) mutakhir:
1. **Best-Worst Method (BWM):** Menentukan bobot prioritas kriteria melalui perbandingan berpasangan terpandu (*Best-to-Others* dan *Others-to-Worst*) yang diselesaikan dengan algoritma pemrograman linear (*Linear Programming*), serta dilengkapi verifikasi rasio konsistensi matematis ($CR \le 0.10$). Sistem juga mendukung konsensus kelompok multi-penilai (*Group Decision Making*) menggunakan agregasi **Rata-rata Geometrik (*Geometric Mean*)**.
2. **WASPAS (Weight Aggregated Sum Product Assessment):** Melakukan perankingan alternatif siswa secara komprehensif dengan menggabungkan model penjumlahan terbobot (*Weighted Sum Model* / WSM) dan model perkalian terbobot (*Weighted Product Model* / WPM) menggunakan koefisien penyeimbang $\lambda \in [0, 1]$.

---

## 2. Fitur-Fitur Utama Sistem

### A. Arsitektur Dual-Mode (Mode Live vs Mode Demo)
- **Mode Live (Sistem Riil / Input Manual):**
  - Diakses melalui tombol **Mulai Sekarang** atau **Login Sistem**.
  - Menggunakan basis data terpisah ([`backend/data/database_live.json`](backend/data/database_live.json)) yang **bersih tanpa data bawaan** (0 kriteria, 0 siswa, 0 penilai).
  - Seluruh data yang diinput pengguna **tersimpan permanen di hard disk** dan tidak dapat terhapus kecuali dihapus secara manual oleh pengguna.
  - Tombol simulasi seperti *Reset Data Awal* dan *Isi Otomatis 120 Data Contoh* otomatis disembunyikan.
- **Mode Demo (Lihat Demo Operator):**
  - Diakses langsung dalam satu klik melalui tombol **Lihat Demo (Operator)**.
  - Menggunakan basis data simulasi terpisah ([`backend/data/database_demo.json`](backend/data/database_demo.json)) untuk keperluan presentasi, demonstrasi sidang, dan evaluasi pengujian.

### B. Fitur Ganti Dataset Demo (Dataset Proposal Bab 3 vs Dataset 120 Siswa)
Pengguna dapat beralih dataset secara instan di dalam Mode Demo tanpa menghilangkan data lainnya:
1. **Dataset Proposal Bab 3 (9 Kriteria, 15 Siswa):**
   - **9 Kriteria Seleksi Lengkap:**
     - `C1`: Penghasilan Orang Tua (Cost, Rp, Bobot: 0,2750)
     - `C2`: Status Desil DTKS (Benefit, Skala 1–5, Bobot: 0,1580)
     - `C3`: Pekerjaan Ayah (Cost, Skala 1–5, Bobot: 0,0580)
     - `C4`: Pekerjaan Ibu (Cost, Skala 1–5, Bobot: 0,0550)
     - `C5`: Status Siswa (Benefit, Skala 1–5, Bobot: 0,0980)
     - `C6`: Jumlah Tanggungan Keluarga (Benefit, Orang, Bobot: 0,1150)
     - `C7`: Status Tempat Tinggal (Cost, Skala 1–5, Bobot: 0,0870)
     - `C8`: Kepemilikan KIP/KKS/PKH/SKTM (Benefit, Skor/Jumlah, Bobot: 0,1220)
     - `C9`: Korban Bencana Alam (Benefit, Ya/Tidak, Bobot: 0,0320)
   - **3 Penilai Resmi (Expert Decision Makers):**
     - Sarmawaty Simanjuntak (Kepala Sekolah)
     - Juan Peron Lumbantoruan (Wakil Kepala Sekolah)
     - Lastri Sihombing (Bidang Kesiswaan)
     - Rasio Konsistensi: $CR = 0,0118 \le 0,10$ (**Sangat Konsisten**)
   - **15 Siswa Alternatif (A1–A15):** Hasil kalkulasi WASPAS identik 100% dengan dokumen proposal Bab 3, di mana Alternatif A12 menempati **Peringkat 1 ($Q = 0,5600$)**.
2. **Dataset Riset Bawaan (6 Kriteria, 120 Siswa):**
   - Berisi 120 sampel siswa dengan 6 kriteria untuk simulasi skala besar.

### C. Landing Page Edukatif & Interaktif
- Beranda elegan bergaya modern (*clean educational typography* menggunakan Google Fonts **Instrument Sans** & **Instrument Serif**).
- Dilengkapi **Simulator Kuota Interaktif** langsung di halaman depan.
- Pratinjau jendela antarmuka (*Mockup Browser Window*) sistem riil.
- Infografis panduan alur seleksi bantuan PIP tingkat sekolah.
- Form konsultasi dan pemaparan metodologi BWM–WASPAS.

### D. Manajemen Data Siswa & Mesin Validasi Excel
- Tabel data responsif dengan pagination dan pencarian multi-kolom instan.
- **Import Excel / CSV:** Fitur unduh template dinamis sesuai kriteria aktif, pratinjau data sebelum disimpan, validasi tipe data otomatis, serta deteksi NISN ganda.
- Ekspor seluruh laporan hasil seleksi ke format Microsoft Excel (`.xlsx`).

### E. Cetak Berita Acara Resmi
- Format cetak Berita Acara penetapan penerima PIP sesuai standar tata naskah dinas sekolah.
- Dilengkapi kop surat resmi SMKS Dharma Bhakti Walter Manalu Siborongborong, tanggal sidang, daftar siswa lolos kuota, dan kolom tanda tangan 3 pejabat pengambil keputusan.

### F. Keamanan Tingkat Enterprise
- **Autentikasi JWT Bearer:** Token sesi terenkripsi dengan batas waktu kedaluwarsa.
- **Enkripsi Bcrypt:** Password di-hash menggunakan *salt rounds* (10 rounds).
- **Proteksi Brute-Force Rate Limiting:** Pembatasan frekuensi percobaan login pada endpoint auth.
- **HTTP Security Headers (Helmet):** Proteksi terhadap *Cross-Site Scripting (XSS)*, *MIME sniffing*, dan *clickjacking*.

---

## 3. Tech Stack

| Lapisan / Komponen | Teknologi yang Digunakan | Keterangan / Fungsi |
|---|---|---|
| **Frontend Framework** | React 19 | Library komponen UI reaktif modular |
| **Build Tool / Bundler** | Vite 8 | Kompilasi ultra-cepat dengan Hot Module Replacement (HMR) |
| **Desain & Styling** | Vanilla CSS (CSS Variables) | Sistem desain kustom berkecepatan tinggi, Dark & Light Mode |
| **Ikon UI** | Lucide React | Ikon SVG modern, ringan, dan konsisten |
| **Pengolahan Excel** | SheetJS (`xlsx`) | Parsing file Excel di browser dan backend |
| **Backend Framework** | Node.js & Express 5 | RESTful API server |
| **Solver Optimasi BWM** | `javascript-lp-solver` | Komputasi Linear Programming minimax bobot BWM |
| **Konkurensi Database** | `AsyncLocalStorage` (Node.js) | Isolasi sesi request antara mode Demo dan mode Live |
| **Keamanan Server** | Helmet, Bcrypt.js, JWT, Rate-Limit | Hardening keamanan server dan endpoint API |
| **Penyimpanan Data** | File-based JSON Database | Penyimpanan persisten dengan atomic write safety |

---

## 4. Struktur Direktori

```text
Sistem PIP/
├── backend/
│   ├── algorithms/
│   │   ├── bwm.js                   # Solver Pemrograman Linear BWM & Agregasi Geometrik
│   │   └── waspas.js                # Engine WASPAS (WSM, WPM, Lambda, Tie-breaker)
│   ├── data/
│   │   ├── database_demo.json       # Database aktif untuk Mode Demo
│   │   ├── database_demo_6crit.json # Dataset cadangan demo 6 kriteria (120 siswa)
│   │   ├── database_demo_9crit.json # Dataset cadangan demo 9 kriteria Bab 3 (15 siswa)
│   │   └── database_live.json       # Database mandiri permanen untuk Mode Live
│   ├── middleware/
│   │   └── auth.js                  # Middleware verifikasi JWT Bearer & Role Guard
│   ├── models/
│   │   └── storage.js               # Dual-database controller & dataset switcher
│   ├── routes/
│   │   ├── authRoutes.js            # Login, ubah password, dan registrasi
│   │   ├── criteriaRoutes.js        # CRUD Kriteria & konfigurasi skala penilaian
│   │   ├── decisionMakerRoutes.js   # Pengambil keputusan BWM & pengujian konsistensi
│   │   ├── studentRoutes.js         # CRUD Siswa, import template Excel & validasi
│   │   └── calculationRoutes.js     # Eksekusi WASPAS, ekspor Excel & ganti dataset demo
│   ├── package.json
│   └── server.js                    # Entry point server Express (Port 5000)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingPage.jsx      # Halaman beranda edukatif & alur PIP
│   │   │   ├── Sidebar.jsx          # Navigasi sidebar kiri dengan indikator dataset
│   │   │   ├── DashboardView.jsx    # Ringkasan kuota, metrik, & alur kerja SPK
│   │   │   ├── CriteriaView.jsx     # Manajemen kriteria Cost & Benefit
│   │   │   ├── BwmView.jsx          # Wizard penilaian BWM & pengujian CR
│   │   │   ├── StudentsView.jsx     # Tabel siswa, pencarian, & import Excel
│   │   │   ├── WaspasView.jsx       # Simulasi kuota, ranking prioritas & transparansi
│   │   │   ├── ReportView.jsx       # Cetak Berita Acara resmi penetapan
│   │   │   ├── UsersView.jsx        # Kelola pengguna sistem (Mode Live)
│   │   │   └── LoginModal.jsx       # Modal login keamanan sistem
│   │   ├── services/
│   │   │   └── api.js               # Service client fetch terhubung ke backend
│   │   ├── App.jsx                  # State orchestrator & layout utama
│   │   ├── index.css                # Desain sistem enterprise (Light & Dark theme)
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── kriteria dan data siswa.md        # Dokumen acuan riset proposal Bab 3
├── start_sistem_pip.bat             # Skrip otomatis untuk menjalankan sistem sekali klik
└── README.md
```

---

## 5. Cara Menjalankan Aplikasi

### Opsi A: Jalankan Sekali Klik (Rekomendasi untuk Windows)
Cukup klik dua kali file:
```cmd
start_sistem_pip.bat
```
Skrip ini akan secara otomatis membuka jendela server backend (Port 5000), antarmuka frontend (Port 5174/3000), dan meluncurkan browser.

---

### Opsi B: Menjalankan Secara Manual lewat Terminal

#### 1. Menjalankan Backend
Buka terminal baru di folder proyek:
```bash
cd backend
npm install
node server.js
```
*Server backend akan aktif di `http://localhost:5000`.*

#### 2. Menjalankan Frontend
Buka terminal kedua di folder proyek:
```bash
cd frontend
npm install
npm run dev
```
*Frontend akan aktif di `http://localhost:5174` (atau `http://localhost:3000`). Buka URL tersebut di browser Anda.*

---

## 6. Akun Login Sistem

| Peran (Role) | Username | Password | Deskripsi Akses |
|---|---|---|---|
| **Operator PIP** | `operator` | `pip2026` | Akses penuh: input data kriteria, data siswa, import Excel, jalankan WASPAS, cetak laporan. |
| **Kepala Sekolah** | `kepsek` | `kepsek2026` | Akses pengambil keputusan: evaluasi pembobotan BWM, melihat perankingan, mengesahkan Berita Acara. |
| **Administrator** | `admin` | `admin2026` | Akses manajemen sistem dan pemeliharaan akun pengguna. |

---

## 7. Lisensi & Hak Cipta
Aplikasi ini dikembangkan untuk keperluan akademik dan penelitian skripsi di **SMKS Dharma Bhakti Walter Manalu Siborongborong**. Bebas digunakan dan dikembangkan untuk keperluan pendidikan non-komersial.
