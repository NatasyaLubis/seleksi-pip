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

## 2. Fitur Utama Sistem

*Dirancang khusus untuk mendukung operasional sekolah dalam menentukan penerima bantuan PIP secara cepat, transparan, dan dapat dipertanggungjawabkan.*

### A. 7 Menu Navigasi Utama Sistem

1. **Dashboard Sistem (`DashboardView`)**
   - Ringkasan metrik kuota beasiswa sekolah secara *real-time* (total kuota, siswa terpilih, persentase pemenuhan kuota, dan sisa kuota).
   - Panduan alur kerja SPK interaktif 5 langkah terpadu (Kriteria $\rightarrow$ Pembobotan BWM $\rightarrow$ Input Siswa $\rightarrow$ Hitung WASPAS $\rightarrow$ Cetak Laporan).
   - Grafik distribusi capaian nilai preferensi dan pemenuhan kuota.

2. **Kelola Kriteria & Subkriteria (`CriteriaView`)**
   - Kelola kriteria, subkriteria, tipe orientasi (**Benefit** / **Cost**), dan skala penilaian ekonomi siswa sesuai regulasi terbaru.
   - Penanganan nilai numerik riil (Rupiah, VA, Orang) maupun nilai kualitatif yang otomatis dikonversi ke skala angka terstandarisasi.
   - Proteksi matematis pencegahan pembagian dengan nol (*division by zero safe*) pada kriteria *Cost*.

3. **Pembobotan BWM Multi-Pakar (`BwmView`)**
   - Tentukan bobot kriteria menggunakan metode **Best-Worst Method (BWM)** secara konsisten dengan perbandingan *pairwise* yang jauh lebih efisien (*Best-to-Others* dan *Others-to-Worst*).
   - Penyelesaian model optimasi pemrograman linear (*minimax*) otomatis untuk mendapatkan bobot optimal ($w_j^*$) dan mengukur rasio konsistensi ($CR \le 0.10$).
   - Agregasi konsensus multi-penilai kelompok (*Group Decision Making*) menggunakan **Rata-rata Geometrik (*Geometric Mean*)**.

4. **Kelola Data Siswa (`StudentsView`)**
   - Input, edit, dan kelola data calon penerima PIP secara mudah dan terstruktur dalam tabel interaktif dengan pencarian instan dan paginasi.
   - **Mesin Impor & Ekspor Excel Massal:** Dilengkapi unduh template dinamis, validasi data otomatis (*pre-import validation*), serta proteksi deteksi NISN ganda sebelum data disimpan ke database.

5. **Perhitungan WASPAS (`WaspasView`)**
   - Lakukan perankingan secara otomatis mengombinasikan model penjumlahan terbobot (**WSM** / $Q_1$) dan model perkalian terbobot (**WPM** / $Q_2$).
   - Dilengkapi aturan *Tie-breaker* objektif berdasarkan nilai kriteria berbobot tertinggi jika terjadi kesamaan nilai preferensi akhir.
   - Tab transparansi komputasi lengkap: Matriks Data Awal ($X$), Matriks Ternormalisasi ($R$), serta Rincian Skor $Q_1$, $Q_2$, dan $Q$.

6. **Analisis Sensitivitas & Simulasi Kuota (`WaspasView`)**
   - Uji stabilitas dan ketahanan (*robustness*) hasil perankingan dengan berbagai skenario variasi parameter koefisien penyeimbang lambda ($\lambda \in [0, 1]$ dengan interval 0,1).
   - Simulasi batas kuota penerima secara instan yang otomatis membagi siswa menjadi **Prioritas Utama (Lolos Kuota)** dan **Cadangan Prioritas**.

7. **Laporan & Cetak Berita Acara Resmi (`ReportView`)**
   - Cetak dokumen resmi Berita Acara penetapan usulan penerima PIP siap tanda tangan sesuai standar tata naskah dinas (Kop Sekolah, nomor surat, tanggal sidang, daftar siswa lolos, dan kolom pengesahan 3 pejabat).
   - Ekspor tabel nominasi dan lembar kerja perankingan ke format file Excel (`.xlsx`) resmi dinas.

---

### B. Fitur Tambahan Sistem

1. **Kelola Pengguna & Hak Akses (`UsersView`)**
   - Pengaturan akun multi-peran dengan hak akses proporsional: **Operator PIP** (kelola data & teknis) dan **Kepala Sekolah / Tim Ahli** (pembobotan BWM & pengesahan Berita Acara).
   - Keamanan kata sandi terenkripsi Bcrypt (10 *salt rounds*) dan autentikasi token JWT.

2. **Arsitektur Dual-Mode (Mode Live vs Mode Demo)**
   - **Mode Live (Input Manual Mandiri):** Basis data bersih permanen ([`database_live.json`](backend/data/database_live.json)) tanpa data simulasi awal, di mana setiap data yang diinput pengguna tersimpan aman di disk selamanya dan bebas dari tombol reset demo.
   - **Mode Demo (Lihat Demo Operator):** Akses instan ke data simulasi lengkap untuk demonstrasi sidang, uji coba, dan evaluasi.

3. **Pengalih Ganda Dataset Demo (*Dual-Dataset Switcher*)**
   - Fitur sekali klik di Mode Demo untuk beralih antara:
     - **Dataset Proposal Bab 3:** 9 Kriteria (C1–C9), 3 Penilai (Sarmawaty/Juan/Lastri), 15 Siswa Alternatif (A1–A15), $CR = 0,0118$, Juara 1 Alternatif A12 ($Q = 0,5600$).
     - **Dataset Bawaan Riset:** 6 Kriteria dengan 120 sampel data siswa.

4. **Landing Page Edukatif Interaktif (`LandingPage`)**
   - Halaman depan beranda edukatif dengan mini-simulator kuota langsung, infografis alur PIP, pratinjau antarmuka sistem, dan formulir konsultasi.

5. **Mode Tampilan Gelap & Terang (Dark / Light Theme)**
   - Sakelar tema visual dinamis dengan palet warna HSL modern yang tersimpan otomatis di penyimpanan lokal browser.

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
│   └── server.js                    # Entry point server Express (Port 5001)
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
├── run.py                           # Runner otomatis cross-platform (Mac, Windows, Linux)
├── start_sistem_pip.bat             # Skrip batch peluncur sistem (Windows)
└── README.md
```

---

## 5. Cara Menjalankan Aplikasi

### Opsi A: Satu Perintah Otomatis via Python (Sangat Direkomendasikan: Mac, Windows, Linux)
Cukup jalankan satu perintah di root direktori proyek:
```bash
python run.py
```
*Atau di macOS / Linux:*
```bash
python3 run.py
```

**Kelebihan skrip `run.py`:**
1. **Pemeriksaan Lingkungan Otomatis:** Mengecek ketersediaan `node` dan `npm`.
2. **Auto-Install Dependencies:** Otomatis menjalankan `npm install` jika `node_modules` belum ada di backend maupun frontend.
3. **Health-Check Terintegrasi:** Menunggu dan memverifikasi backend (`/api/health`) dan frontend sampai benar-benar siap menerima koneksi sebelum membuka browser.
4. **Auto-Launch Browser:** Otomatis meluncurkan browser default ke alamat frontend yang aktif.
5. **Penghentian Bersih (*Clean Process Termination*):** Tekan `Ctrl + C` di terminal, seluruh *process tree* (backend dan frontend) akan dimatikan secara bersih tanpa meninggalkan *orphan process* yang mengunci port di Windows maupun Mac.

---

### Opsi B: Jalankan Sekali Klik via Batch (Khusus Windows)
Cukup klik dua kali file:
```cmd
start_sistem_pip.bat
```
Skrip batch ini akan membuka jendela terminal untuk server backend (Port 5001) dan antarmuka frontend (Port 5174/3000) serta membuka browser secara otomatis.

---

### Opsi C: Menjalankan Secara Manual lewat Terminal Terpisah

#### 1. Menjalankan Backend
Buka terminal baru di folder proyek:
```bash
cd backend
npm install
node server.js
```
*Server backend akan aktif di `http://localhost:5001`.*

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
