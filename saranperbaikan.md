# Saran Perbaikan — SPK Seleksi PIP (BWM + WASPAS)

Dokumen ini berisi hasil review kode pada commit `bf06424` (setelah `run.py` ditambahkan).
Setiap poin berisi: **masalah**, **lokasi**, **kenapa penting**, dan **saran perbaikan**.
Kerjakan dari atas ke bawah.

| Prioritas | Arti |
|---|---|
| 🔴 Kritis | Risiko keamanan / kehilangan data. Wajib diperbaiki. |
| 🟠 Tinggi | Bug nyata atau berpotensi mengubah hasil perhitungan. |
| 🟡 Sedang | Kebenaran metode / duplikasi logika — konfirmasi dengan dosen pembimbing. |
| ⚪ Rendah | Kerapian & kemudahan perawatan kode. |

---

## 0. Tentang tips "pisahkan BWM & WASPAS dari routes"

**Sudah diterapkan sebagian.** Rumus sudah dipisah di `backend/algorithms/bwm.js` dan
`backend/algorithms/waspas.js`, dan routes hanya memanggil fungsinya. Bagus 👍

Yang **belum**: pengujiannya.

- `npm test` di backend masih `echo "Error: no test specified" && exit 1`.
- `backend/test_bwm.js` **menyalin ulang** solver BWM di dalam file test, bukan meng-`require`
  `algorithms/bwm.js`. Jadi kalau ada bug di `bwm.js`, test ini tetap lolos — test-nya tidak
  menguji kode aplikasi.

**Saran:**
1. Buat folder `backend/tests/` dan gunakan test runner bawaan Node (`node --test`, tanpa install
   library tambahan).
2. Test harus `require('../algorithms/bwm')` dan `require('../algorithms/waspas')` langsung.
3. Isi test dengan **jawaban yang sudah diketahui**:
   - Contoh soal dari paper Rezaei (2015/2016) atau output **solver BWM resmi**
     (bestworstmethod.com) → bandingkan bobot & ξ (toleransi misal `1e-4`).
   - Dataset Bab 3 (9 kriteria, 15 siswa): A12 harus Peringkat 1 dengan Q = 0,5600,
     dan CR = 0,0118.
   - Kasus error: kriteria < 2, best/worst kosong, nilai cost ≤ 0, data siswa kosong.
4. Ubah `backend/package.json`: `"test": "node --test tests/"`.
5. Hapus `backend/test_bwm.js` setelah test baru ada.

Ini yang paling penting untuk sidang: bisa membuktikan bahwa hasil perhitungan sistem **sama**
dengan perhitungan manual / solver resmi.

---

## 🔴 1. Hampir semua API tidak butuh login

**Lokasi:** `backend/routes/criteriaRoutes.js`, `studentRoutes.js`, `decisionMakerRoutes.js`,
`calculationRoutes.js`

**Masalah:** Middleware `authenticateToken` hanya dipakai di sebagian route `/api/auth`.
Route kriteria, siswa, penilai, dan perhitungan **tidak dilindungi**. Siapa pun yang bisa
mengakses server (misal satu jaringan WiFi sekolah) bisa membaca, mengubah, atau menghapus data
siswa dan menjalankan ulang perhitungan tanpa login. Login di frontend hanya "pajangan".

**Saran:** Pasang di `server.js` saat mount routes data:
```js
app.use('/api/criteria', authenticateToken, criteriaRoutes);
app.use('/api/decision-makers', authenticateToken, decisionMakerRoutes);
app.use('/api/students', authenticateToken, studentRoutes);
app.use('/api/calculation', authenticateToken, calculationRoutes);
```
Untuk link download (template & export Excel yang dibuka lewat URL), unduh lewat `fetch` dengan
header token lalu simpan sebagai blob.

**Cara cek:** `curl http://localhost:5000/api/students` tanpa token harus mengembalikan 401.

---

## 🔴 2. Mode Live/Demo ditentukan oleh client tanpa validasi

**Lokasi:** `backend/server.js:38`

**Masalah:** Database yang dipakai (live atau demo) diambil dari header `x-system-mode` atau
query `?system_mode=` yang dikirim browser. Client bebas memilih database mana yang diubah.

**Saran:** Simpan mode di dalam JWT saat login (misal `payload.mode`) dan baca dari
`req.user.mode`, bukan dari header. Jika mode demo memang boleh tanpa login, pastikan request
tanpa token **hanya** bisa mengakses database demo.

---

## 🔴 3. File database rusak → diganti database kosong tanpa peringatan

**Lokasi:** `backend/models/storage.js:368-371` (fungsi `readDatabase`)

**Masalah:** Jika `JSON.parse` gagal (misal file terpotong karena laptop mati saat menyimpan),
kode langsung memanggil `initializeDatabase()` dan **menimpa** file dengan data kosong.
Seluruh data siswa riil di Mode Live bisa hilang permanen.

**Saran:**
- Jangan buat ulang otomatis. **Backup** dulu file yang rusak (misal rename ke
  `database_live.corrupt-<timestamp>.json`), lalu lempar error yang jelas.
- Simpan backup (misal `database_live.bak.json`) setiap kali berhasil menulis.

---

## 🔴 4. Penulisan file tidak aman (bisa korup & saling menimpa)

**Lokasi:** `backend/models/storage.js:374-378` (fungsi `writeDatabase`)

**Masalah:**
- `fs.writeFileSync` langsung ke file utama. Jika proses mati di tengah, file jadi setengah →
  korup (lalu memicu masalah no. 3).
- Setiap request membaca seluruh file → ubah → tulis ulang. Dua request bersamaan bisa saling
  menimpa (perubahan salah satu hilang).

**Saran:**
- Tulis atomik: tulis ke `file.tmp` dulu, lalu `fs.renameSync(tmp, file)`.
- Untuk skala skripsi, tulis atomik + backup sudah cukup. Jika ingin lebih kuat, ganti ke
  SQLite (`better-sqlite3`) yang mendukung transaksi.

---

## 🔴 5. Rahasia & data pribadi ter-commit ke Git

**Lokasi:**
- `backend/middleware/auth.js:3` — JWT secret punya nilai default yang tertulis di kode.
- `backend/models/storage.js:223-241` — password default (`pip2026`, `kepsek2026`, `adminpip2026`).
- `run.py` (akhir fungsi `main()`) — mencetak username & password ke terminal.
- `backend/data/*.json` — **semua** database (termasuk `database_live.json`) ikut ter-commit:
  berisi NISN, nama, alamat siswa, dan hash password. Repo ini ada di GitHub.

**Kenapa penting:** Siapa pun yang tahu secret default bisa membuat token JWT palsu dan masuk
sebagai admin. NISN & alamat siswa adalah data pribadi anak di bawah umur.

**Saran:**
1. JWT secret wajib dari environment; server **gagal start** jika tidak ada:
   ```js
   const JWT_SECRET = process.env.JWT_SECRET;
   if (!JWT_SECRET) throw new Error('JWT_SECRET belum di-set. Buat file backend/.env');
   ```
   Sediakan `backend/.env.example` berisi `JWT_SECRET=ganti_dengan_string_acak`
   (gunakan paket `dotenv` atau `node --env-file=.env server.js`).
2. Akun default wajib ganti password saat login pertama, atau buat akun admin lewat script setup
   (bukan hardcode).
3. Tambahkan ke `.gitignore`:
   ```
   backend/data/database.json
   backend/data/database_live.json
   backend/data/database_demo.json
   ```
   (File dataset `database_demo_6crit.json` & `database_demo_9crit.json` boleh tetap di-commit
   **jika** isinya data fiktif.) Lalu hapus dari tracking tanpa menghapus file lokal:
   `git rm --cached backend/data/database_live.json` (dst).
4. Jika `database_live.json` pernah berisi data siswa **asli**, data itu masih ada di riwayat Git.
   Jadikan repo private, atau bersihkan riwayat dengan `git filter-repo`.

---

## 🟠 6. Tombol "Reset Data Awal" (Mode Demo) selalu gagal

**Lokasi:** `backend/routes/calculationRoutes.js:257`

**Masalah:** Kode membaca `req.systemMode`, tetapi `server.js` **tidak pernah** mengisi
`req.systemMode` (mode disimpan di `asyncLocalStorage`). Akibatnya mode selalu dianggap `'live'`
dan endpoint selalu membalas 403 "hanya berlaku di Mode Demo".

**Saran:** Di middleware mode pada `server.js`, tambahkan `req.systemMode = mode;` sebelum
`asyncLocalStorage.run(...)`, atau ambil mode dari `asyncLocalStorage.getStore().mode`.

**Cara cek:** Di Mode Demo, klik Reset Data Awal → harus berhasil.

---

## 🟠 7. Nilai perbandingan BWM yang kosong/invalid diam-diam dianggap 1

**Lokasi:** `backend/algorithms/bwm.js:55-56`

```js
const abj = parseFloat(bestToOthers[jCode]) || 1;
const ajw = parseFloat(othersToWorst[jCode]) || 1;
```

**Masalah:** Jika penilai lupa mengisi satu perbandingan, nilainya otomatis jadi 1 ("sama
penting") tanpa pesan error → bobot berubah tanpa ada yang sadar.

**Saran:** Validasi: setiap nilai harus angka bulat 1–9. Jika tidak, lempar error yang menyebut
kriteria mana yang kosong. Satu-satunya nilai 1 yang otomatis adalah `a_BB` dan `a_WW`.

---

## 🟠 8. Toleransi total bobot terlalu longgar

**Lokasi:** `backend/routes/calculationRoutes.js:72`

**Masalah:** Perhitungan tetap jalan jika total bobot kriteria antara 0,95 dan 1,05.
Bobot yang totalnya 0,96 menghasilkan skor yang berbeda dari seharusnya.

**Saran:** Perketat ke `Math.abs(totalWeight - 1) > 0.001`, atau normalisasi ulang bobot
(dibagi total) sebelum masuk WASPAS dan tampilkan peringatan.

---

## 🟡 9. Rasio Konsistensi (CR): model linear vs tabel nonlinear

**Lokasi:** `backend/algorithms/bwm.js:3-16` dan `:117-129`

**Masalah:** Sistem menyelesaikan **BWM model linear** (Rezaei, 2016), tetapi ξ hasilnya dibagi
**Consistency Index** (0,44; 1,00; 1,63; …) yang dipublikasikan untuk **BWM model nonlinear**
(Rezaei, 2015). ξ model linear tidak sebanding langsung dengan tabel tersebut, sehingga nilai CR
bisa kurang tepat. Ambang `CR < 0.10` juga perlu rujukan yang jelas.

**Saran (konsultasikan dengan dosen pembimbing):** pilih salah satu dan samakan dengan Bab 2/3:
- Pakai model **nonlinear** agar tabel CI berlaku, **atau**
- Tetap model linear, tetapi gunakan ukuran konsistensi yang sesuai, misalnya *input-based CR*
  (Liang, Brunelli & Rezaei, 2020) beserta ambang batasnya.

Cantumkan rujukannya di komentar kode dan di skripsi.

---

## 🟡 10. "Angka penolong" tersembunyi yang memengaruhi hasil

**Lokasi:**
- `backend/algorithms/bwm.js:157` — bobot 0 diganti `0.0001` saat agregasi geometric mean.
- `backend/algorithms/waspas.js` (perhitungan WPM) — nilai normalisasi 0 diganti `0.0001`.
- `backend/algorithms/waspas.js` — nilai normalisasi dibulatkan 6 desimal (`toFixed(6)`)
  **sebelum** dipakai menghitung skor.

**Masalah:** Selisih skor yang kecil bisa mengubah urutan siswa di sekitar batas kuota.

**Saran:**
- Bulatkan **hanya saat menampilkan**, bukan di tengah perhitungan.
- Jadikan epsilon konstanta bernama (misal `const EPSILON = 0.0001`) dan sebutkan di Bab 3.
- Cegah nilai 0 lewat validasi input jika skalanya memang 1–5.

---

## 🟡 11. Logika kuota (lolos/cadangan) ditulis dua kali

**Lokasi:** `backend/algorithms/waspas.js` (langkah 5–6) dan
`backend/routes/calculationRoutes.js` (route `PUT /period`)

**Masalah:** Kode yang sama ada di dua tempat → jika salah satu diubah, hasilnya bisa berbeda.

**Saran:** Buat fungsi `applyQuota(rankings, quota)` di `waspas.js`, export, lalu pakai di kedua
tempat. Fungsi ini juga mudah diuji.

---

## 🟡 12. Masalah pada `run.py` (baru)

Secara umum sudah bagus (cek Node, install dependensi, health-check, buka browser, Ctrl+C rapi).
Beberapa hal perlu diperbaiki:

1. **`stderr=subprocess.PIPE` tapi tidak pernah dibaca.** Buffer pipe OS terbatas (~64 KB).
   Jika backend/Vite banyak menulis log error, proses bisa **macet (hang)** saat buffer penuh, dan
   pesan error-nya tidak pernah terlihat.
   → Ganti ke `stderr=None` (tampil di terminal) atau tulis ke file log (misal `logs/backend.log`).
2. **Backend gagal start tetap dianggap jalan.** Jika port 5000 sudah dipakai atau `server.js`
   crash, script hanya mencetak "Melanjutkan...".
   → Cek `p.poll()`; jika proses sudah berhenti, tampilkan error dan `sys.exit(1)`.
3. **Pesan frontend menyesatkan.** Jika Vite tidak terdeteksi, script tetap mencetak
   "✔ Frontend Aktif & Terverifikasi" dengan URL tebakan `5174`.
   → Tampilkan pesan gagal yang jujur.
4. **Menebak port bisa membuka aplikasi lain.** Script mengecek port 5174/5173/3000 — jika ada
   aplikasi lain di port itu, browser membuka aplikasi yang salah.
   → Tetapkan port di `frontend/vite.config.js`:
   ```js
   server: { port: 5173, strictPort: true }
   ```
   lalu di `run.py` cukup cek port itu saja.
5. **Tidak mendeteksi server yang mati setelah start.** Loop `while True: time.sleep(1)` terus
   berjalan walau backend/frontend sudah crash.
   → Di dalam loop, cek `p.poll()` setiap proses; jika ada yang berhenti, beri tahu lalu cleanup.
6. **Mencetak password default di terminal** (lihat poin 5). Hapus, atau tampilkan hanya untuk demo.
7. **Dependensi tidak diperbarui.** Script hanya mengecek ada/tidaknya folder `node_modules`. Jika
   `package.json` berubah (misal setelah `git pull`), paket baru tidak terpasang.
   → Bandingkan waktu modifikasi `package-lock.json` dengan `node_modules/.package-lock.json`,
   atau sediakan opsi `python run.py --install`.
8. **Dua launcher tidak konsisten.** `start_sistem_pip.bat` memakai port 3000, `run.py` memakai
   port default Vite. Hapus `.bat` (karena `run.py` sudah cross-platform) atau samakan port-nya.
9. **`.gitignore`:** baris `*.sw?` (file swap Vim) ikut terhapus di commit `bf06424` — kembalikan.

---

## ⚪ 13. File terlalu besar & logika bercampur di routes

**Lokasi:** `backend/routes/studentRoutes.js` (421 baris), `backend/models/storage.js`
(423 baris), `frontend/src/App.jsx` (> 850 baris)

**Saran:**
- Pindahkan validasi & parsing Excel dari `studentRoutes.js` ke `backend/services/studentImport.js`.
- Pindahkan data default (kriteria, user, siswa contoh) dari `storage.js` ke file terpisah
  (misal `backend/data/seed.js`).
- Pecah `App.jsx`: pindahkan state & handler login/mode ke custom hook (misal `useAuth`,
  `useSystemMode`).

---

## ⚪ 14. Semua error dibalas status 500 dengan pesan internal

**Lokasi:** Semua blok `catch (err)` di routes, dan error handler di `server.js:84-90`

**Masalah:** Kesalahan input pengguna (misal nilai cost ≤ 0) dibalas 500 (seolah server rusak),
dan pesan error internal bisa bocor ke client.

**Saran:** Buat class `ValidationError` → balas 400 dengan pesan ramah. Error lain → balas 500
dengan pesan umum, dan detailnya hanya di-`console.error` di server.

---

## ⚪ 15. URL backend hardcoded di frontend

**Lokasi:** `frontend/src/services/api.js:1`

**Masalah:** `http://localhost:5000/api` tertulis langsung — aplikasi tidak bisa diakses dari
komputer lain di jaringan sekolah tanpa mengubah kode.

**Saran:** `const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';` lalu tambahkan proxy di
`vite.config.js`:
```js
server: { proxy: { '/api': 'http://localhost:5000' } }
```

---

## Urutan pengerjaan yang disarankan

1. **Test perhitungan** (poin 0) + perbaikan poin 7 & 8 → membuktikan rumus benar.
2. **Diskusi dengan pembimbing** soal poin 9 & 10 (CR dan epsilon).
3. **Keamanan & data:** poin 1, 2, 5, lalu poin 3 & 4.
4. **Bug & launcher:** poin 6, 11, 12.
5. **Kerapian:** poin 13, 14, 15 (jika masih ada waktu).

Setelah selesai, pastikan perintah berikut berjalan tanpa error:
```bash
cd backend && npm test
cd ../frontend && npm run lint && npm run build
cd .. && python run.py
```
