const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { readDatabase, writeDatabase, generateRealisticStudents } = require('../models/storage');
const { generateTemplate, parseAndValidateExcel } = require('../services/studentImport');
const { ValidationError } = require('../utils/errors');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// GET all students (alternatives)
router.get('/', (req, res) => {
  try {
    const db = readDatabase();
    res.json({
      success: true,
      total: db.students.length,
      data: db.students,
      criteria: db.criteria
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create single student
router.post('/', (req, res) => {
  try {
    const { nisn, nama_lengkap, kelas, asal_sekolah, alamat, values } = req.body;
    if (!nisn || !nama_lengkap || !kelas || !values) {
      return res.status(400).json({ success: false, message: 'NISN, Nama Siswa, Kelas, dan Nilai Kriteria wajib diisi.' });
    }

    const db = readDatabase();
    const cleanNisn = nisn.toString().trim();

    // Check duplicate NISN
    if (db.students.some(s => s.nisn === cleanNisn)) {
      return res.status(400).json({ success: false, message: `Siswa dengan NISN ${cleanNisn} sudah ada dalam sistem.` });
    }

    // Validate criteria values
    for (const c of db.criteria) {
      const v = parseFloat(values[c.code]);
      if (isNaN(v)) {
        return res.status(400).json({ success: false, message: `Nilai kriteria ${c.name} (${c.code}) belum diisi atau tidak valid.` });
      }
      if (c.type === 'cost' && v <= 0) {
        return res.status(400).json({ success: false, message: `Nilai kriteria Cost ${c.name} (${c.code}) harus lebih besar dari 0.` });
      }
      if (c.value_type === 'discrete_scale' && (v < 1 || v > 5)) {
        return res.status(400).json({ success: false, message: `Nilai kriteria ${c.name} (${c.code}) harus berada dalam skala 1 s/d 5.` });
      }
    }

    const newStudent = {
      id: `std-${uuidv4().substring(0, 8)}`,
      nisn: cleanNisn,
      nama_lengkap: nama_lengkap.trim(),
      kelas: kelas.trim(),
      asal_sekolah: asal_sekolah ? asal_sekolah.trim() : 'SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG',
      alamat: alamat ? alamat.trim() : '-',
      values: {}
    };

    db.criteria.forEach(c => {
      newStudent.values[c.code] = parseFloat(values[c.code]);
    });

    db.students.push(newStudent);
    db.last_calculation = null; // Invalidate previous calculation
    writeDatabase(db);

    res.json({
      success: true,
      message: `Siswa ${newStudent.nama_lengkap} berhasil ditambahkan.`,
      data: newStudent
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update single student
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { nisn, nama_lengkap, kelas, asal_sekolah, alamat, values } = req.body;

    const db = readDatabase();
    const student = db.students.find(s => s.id === id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan.' });
    }

    if (nisn) {
      const cleanNisn = nisn.toString().trim();
      const duplicate = db.students.find(s => s.nisn === cleanNisn && s.id !== id);
      if (duplicate) {
        return res.status(400).json({ success: false, message: `NISN ${cleanNisn} sudah digunakan oleh siswa ${duplicate.nama_lengkap}.` });
      }
      student.nisn = cleanNisn;
    }

    if (nama_lengkap) student.nama_lengkap = nama_lengkap.trim();
    if (kelas) student.kelas = kelas.trim();
    if (asal_sekolah) student.asal_sekolah = asal_sekolah.trim();
    if (alamat) student.alamat = alamat.trim();

    if (values) {
      for (const c of db.criteria) {
        if (values[c.code] !== undefined) {
          const v = parseFloat(values[c.code]);
          if (isNaN(v)) {
            return res.status(400).json({ success: false, message: `Nilai kriteria ${c.name} (${c.code}) tidak valid.` });
          }
          if (c.type === 'cost' && v <= 0) {
            return res.status(400).json({ success: false, message: `Nilai kriteria Cost ${c.name} (${c.code}) harus lebih besar dari 0.` });
          }
          if (c.value_type === 'discrete_scale' && (v < 1 || v > 5)) {
            return res.status(400).json({ success: false, message: `Nilai kriteria ${c.name} (${c.code}) harus skala 1 s/d 5.` });
          }
          student.values[c.code] = v;
        }
      }
    }

    db.last_calculation = null;
    writeDatabase(db);

    res.json({
      success: true,
      message: `Data siswa ${student.nama_lengkap} berhasil diperbarui.`,
      data: student
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE single student
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDatabase();
    const index = db.students.findIndex(s => s.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan.' });
    }

    const removed = db.students.splice(index, 1)[0];
    db.last_calculation = null;
    writeDatabase(db);

    res.json({
      success: true,
      message: `Siswa ${removed.nama_lengkap} (${removed.nisn}) berhasil dihapus.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE all students
router.delete('/', (req, res) => {
  try {
    const db = readDatabase();
    const count = db.students.length;
    db.students = [];
    db.last_calculation = null;
    writeDatabase(db);
    res.json({ success: true, message: `Seluruh data alternatif siswa (${count} data) berhasil dikosongkan.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST generate sample students (e.g. 120 students)
router.post('/generate-samples', (req, res) => {
  try {
    const count = parseInt(req.body.count, 10) || 120;
    const db = readDatabase();
    const generated = generateRealisticStudents(count);
    db.students = generated;
    db.last_calculation = null;
    writeDatabase(db);

    res.json({
      success: true,
      message: `Berhasil menggenerasi ${generated.length} data sampel siswa realistis untuk uji coba SPK PIP.`,
      total: generated.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET download Excel template
router.get('/download-template', (req, res) => {
  try {
    const db = readDatabase();
    const buffer = generateTemplate(db.criteria);

    res.setHeader('Content-Disposition', 'attachment; filename="Template_Import_Siswa_PIP.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST preview & validate uploaded Excel/CSV file
router.post('/import-preview', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File Excel (.xlsx/.xls) atau .csv belum dipilih.' });
    }

    const db = readDatabase();
    const result = parseAndValidateExcel(req.file.buffer, db.criteria, db.students);

    res.json({
      success: true,
      summary: {
        totalRowsParsed: result.totalRows,
        validCount: result.validCount,
        errorCount: result.errorCount,
        canCommit: result.validCount > 0
      },
      validRowsPreview: result.validRows.slice(0, 10),
      validRowsPayload: result.validRows,
      errors: result.errors
    });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, message: err.message || 'Gagal memproses file.' });
  }
});

// POST commit imported students to database
router.post('/import-commit', (req, res) => {
  try {
    const { students, mode } = req.body;
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada data siswa valid untuk disimpan.' });
    }

    const db = readDatabase();
    const preparedStudents = students.map(s => ({
      id: `std-${uuidv4().substring(0, 8)}`,
      nisn: s.nisn,
      nama_lengkap: s.nama_lengkap,
      kelas: s.kelas,
      asal_sekolah: s.asal_sekolah || 'SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG',
      alamat: s.alamat || '-',
      values: s.values
    }));

    if (mode === 'replace') {
      db.students = preparedStudents;
    } else {
      const existingNisns = new Set(db.students.map(s => s.nisn));
      const newlyAdded = [];
      preparedStudents.forEach(p => {
        if (!existingNisns.has(p.nisn)) {
          newlyAdded.push(p);
          existingNisns.add(p.nisn);
        }
      });
      db.students = [...db.students, ...newlyAdded];
    }

    db.last_calculation = null;
    writeDatabase(db);

    res.json({
      success: true,
      message: `Berhasil mengimpor ${preparedStudents.length} data siswa ke dalam sistem (${mode === 'replace' ? 'Mode Timpa' : 'Mode Tambah'}).`,
      totalStudentsNow: db.students.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
