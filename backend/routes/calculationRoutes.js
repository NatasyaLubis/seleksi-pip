const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const { readDatabase, writeDatabase, initializeDatabase, initializeDemoDatabase, switchDemoDataset, getActiveDemoDataset } = require('../models/storage');
const { calculateWASPAS, applyQuota } = require('../algorithms/waspas');

// GET calculation status and period settings
router.get('/status', (req, res) => {
  try {
    const db = readDatabase();
    res.json({
      success: true,
      period: db.period,
      totalStudents: db.students.length,
      criteriaCount: db.criteria.length,
      aggregatedWeights: db.aggregated_weights,
      hasLastCalculation: !!db.last_calculation,
      lastCalculation: db.last_calculation,
      activeDemoDataset: getActiveDemoDataset()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET active demo dataset type
router.get('/demo-dataset', (req, res) => {
  res.json({
    success: true,
    activeDataset: getActiveDemoDataset()
  });
});

// POST switch demo dataset (bab3_9crit vs default_6crit)
router.post('/switch-demo-dataset', (req, res) => {
  try {
    const { datasetType } = req.body;
    if (!['bab3_9crit', 'default_6crit'].includes(datasetType)) {
      return res.status(400).json({ success: false, message: 'Tipe dataset demo tidak valid.' });
    }
    const updatedDb = switchDemoDataset(datasetType);
    res.json({
      success: true,
      message: datasetType === 'bab3_9crit' 
        ? 'Berhasil beralih ke Dataset Proposal Bab 3 (9 Kriteria, 15 Siswa, 3 Penilai BWM & WASPAS).'
        : 'Berhasil kembali ke Dataset Bawaan (6 Kriteria, 120 Siswa Contoh).',
      activeDataset: datasetType,
      data: updatedDb
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST execute WASPAS calculation
router.post('/run', (req, res) => {
  try {
    const { quota, lambda } = req.body;
    const db = readDatabase();

    if (!db.students || db.students.length === 0) {
      return res.status(400).json({ success: false, message: 'Belum ada data siswa untuk dihitung. Silakan tambahkan atau import data siswa terlebih dahulu.' });
    }

    if (!db.criteria || db.criteria.length < 2) {
      return res.status(400).json({ success: false, message: 'Minimal harus ada 2 kriteria aktif untuk proses perhitungan SPK.' });
    }

    // Check if criteria have weights with strict tolerance 0.001
    const totalWeight = db.criteria.reduce((sum, c) => sum + (parseFloat(c.final_weight) || 0), 0);
    if (Math.abs(totalWeight - 1) > 0.001) {
      return res.status(400).json({
        success: false,
        message: `Total bobot kriteria BWM (${totalWeight.toFixed(4)}) belum dinormalisasi atau tidak sama dengan 1.000. Silakan lakukan proses Agregasi Bobot BWM terlebih dahulu.`
      });
    }

    // Exact normalization safeguard
    if (totalWeight > 0 && totalWeight !== 1) {
      db.criteria.forEach(c => {
        c.final_weight = parseFloat(((parseFloat(c.final_weight) || 0) / totalWeight).toFixed(6));
      });
    }

    const targetQuota = parseInt(quota !== undefined ? quota : db.period.target_quota, 10) || 50;
    const lambdaParam = lambda !== undefined ? parseFloat(lambda) : (db.period.lambda || 0.5);

    // Run WASPAS calculation
    const result = calculateWASPAS(db.students, db.criteria, lambdaParam, targetQuota);

    // Save calculation to database
    db.last_calculation = result;
    db.period.target_quota = targetQuota;
    db.period.lambda = lambdaParam;
    db.period.updated_at = new Date().toISOString();
    writeDatabase(db);

    res.json({
      success: true,
      message: `Perhitungan WASPAS berhasil dieksekusi untuk ${result.totalStudents} siswa dengan target kuota ${targetQuota} siswa penerima.`,
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET export calculation results to Excel
router.get('/export-excel', (req, res) => {
  try {
    const db = readDatabase();
    if (!db.last_calculation) {
      return res.status(400).json({ success: false, message: 'Belum ada hasil perhitungan yang dapat diekspor. Jalankan perhitungan terlebih dahulu.' });
    }

    const calc = db.last_calculation;
    const wb = XLSX.utils.book_new();

    // Determine year dynamically from period name or fallback to current year
    const matchYear = (db.period && db.period.name) ? db.period.name.match(/\b(20\d{2})\b/) : null;
    const year = matchYear ? matchYear[1] : (new Date().getFullYear());
    const title = `USULAN NAMA SISWA CALON PENERIMA PIP ${year}`;
    const defaultSchool = (db.period && db.period.school_name) || 'SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG';

    // Filter only passed students (hasil yang lolos)
    const passedList = calc.rankings.filter(r => r.quotaStatus === 'passed_quota');

    // Sheet 1: USULAN_PENERIMA_PIP (Sesuai format resmi permintaan)
    const usulanRows = [
      [title],
      [],
      ['NO', 'NISN', 'NAMA SISWA', 'KELAS', 'ASAL SEKOLAH'],
      ...passedList.map((r, idx) => [
        idx + 1,
        r.nisn,
        r.nama_lengkap,
        r.kelas,
        r.asal_sekolah || defaultSchool
      ])
    ];

    const usulanSheet = XLSX.utils.aoa_to_sheet(usulanRows);
    usulanSheet['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 32 },
      { wch: 12 },
      { wch: 28 }
    ];
    XLSX.utils.book_append_sheet(wb, usulanSheet, 'USULAN_PENERIMA_PIP');

    // Sheet 2: CADANGAN_PRIORITAS
    const backupList = calc.rankings.filter(r => r.quotaStatus === 'backup_priority');
    if (backupList.length > 0) {
      const backupRows = [
        [`DAFTAR SISWA CADANGAN PRIORITAS PIP ${year}`],
        [],
        ['NO', 'NISN', 'NAMA SISWA', 'KELAS', 'ASAL SEKOLAH'],
        ...backupList.map((r, idx) => [
          idx + 1,
          r.nisn,
          r.nama_lengkap,
          r.kelas,
          r.asal_sekolah || defaultSchool
        ])
      ];
      const backupSheet = XLSX.utils.aoa_to_sheet(backupRows);
      backupSheet['!cols'] = [
        { wch: 6 },
        { wch: 18 },
        { wch: 32 },
        { wch: 12 },
        { wch: 28 }
      ];
      XLSX.utils.book_append_sheet(wb, backupSheet, 'CADANGAN_PRIORITAS');
    }

    // Sheet 3: REKAP_LENGKAP_WASPAS (Untuk Arsip & Uji Sidang Skripsi)
    const rankHeaders = ['Peringkat', 'Status Kuota', 'NISN', 'Nama Siswa', 'Kelas', 'Nilai Akhir WASPAS (Q)', 'Nilai WSM (Q1)', 'Nilai WPM (Q2)'];
    const rankRows = calc.rankings.map(r => [
      r.rank,
      r.statusLabel,
      r.nisn,
      r.nama_lengkap,
      r.kelas,
      r.waspasScore,
      r.wsmScore,
      r.wpmScore
    ]);
    const rankSheet = XLSX.utils.aoa_to_sheet([rankHeaders, ...rankRows]);
    XLSX.utils.book_append_sheet(wb, rankSheet, 'REKAP_NILAI_WASPAS');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename="USULAN_NAMA_SISWA_CALON_PENERIMA_PIP_${year}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET period info
router.get('/period', (req, res) => {
  try {
    const db = readDatabase();
    res.json({ success: true, data: db.period });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update period configuration (quota, name, academic_year, lambda, school_name)
router.put('/period', (req, res) => {
  try {
    const { name, academic_year, school_name, target_quota, lambda } = req.body;
    const db = readDatabase();

    if (name) db.period.name = name.trim();
    if (academic_year) db.period.academic_year = academic_year.trim();
    if (school_name) db.period.school_name = school_name.trim();
    if (target_quota !== undefined) {
      const q = parseInt(target_quota, 10);
      if (q > 0) db.period.target_quota = q;
    }
    if (lambda !== undefined) {
      const l = parseFloat(lambda);
      if (l >= 0 && l <= 1) db.period.lambda = l;
    }
    db.period.updated_at = new Date().toISOString();

    // If calculation exists, recalculate quota status dynamically using shared applyQuota
    if (db.last_calculation && db.last_calculation.rankings) {
      const targetQuota = db.period.target_quota;
      db.last_calculation.quota = targetQuota;
      applyQuota(db.last_calculation.rankings, targetQuota);
      db.last_calculation.passedCount = Math.min(db.last_calculation.totalStudents, targetQuota);
      db.last_calculation.backupCount = Math.max(0, db.last_calculation.totalStudents - targetQuota);
      db.last_calculation.quotaFulfillmentPercentage = parseFloat(((db.last_calculation.passedCount / targetQuota) * 100).toFixed(1));
      db.last_calculation.cutOffScore = db.last_calculation.rankings[db.last_calculation.passedCount - 1]?.waspasScore || 0;
    }

    writeDatabase(db);
    res.json({ success: true, message: 'Pengaturan kuota dan periode berhasil diperbarui.', data: db.period, calculation: db.last_calculation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST reset to factory default data (Khusus Mode Demo)
router.post('/reset-default', (req, res) => {
  try {
    const mode = req.systemMode || (req.user && req.user.mode) || 'live';
    if (mode !== 'demo') {
      return res.status(403).json({ success: false, message: 'Fitur Reset Data Awal hanya berlaku di Mode Demo.' });
    }
    const initial = initializeDemoDatabase();
    res.json({ success: true, message: 'Database demo berhasil di-reset ke data awal (6 kriteria, 3 penilai, 120 siswa).', data: initial });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
