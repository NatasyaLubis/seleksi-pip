const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const { readDatabase, writeDatabase, generateRealisticStudents } = require('../models/storage');

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
    const { nisn, nama_lengkap, kelas, asal_sekolah, nama_wali, alamat, values } = req.body;
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
      nama_wali: nama_wali ? nama_wali.trim() : '-',
      alamat: alamat ? alamat.trim() : '-',
      values
    };

    db.students.push(newStudent);
    writeDatabase(db);

    res.json({ success: true, message: 'Data siswa berhasil ditambahkan.', data: newStudent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update single student
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { nisn, nama_lengkap, kelas, nama_wali, alamat, values } = req.body;

    const db = readDatabase();
    const std = db.students.find(s => s.id === id);
    if (!std) {
      return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan.' });
    }

    if (nisn) {
      const cleanNisn = nisn.toString().trim();
      const existing = db.students.find(s => s.nisn === cleanNisn && s.id !== id);
      if (existing) {
        return res.status(400).json({ success: false, message: `NISN ${cleanNisn} sudah digunakan oleh siswa lain.` });
      }
      std.nisn = cleanNisn;
    }

    if (nama_lengkap) std.nama_lengkap = nama_lengkap.trim();
    if (kelas) std.kelas = kelas.trim();
    if (nama_wali !== undefined) std.nama_wali = nama_wali.trim();
    if (alamat !== undefined) std.alamat = alamat.trim();
    if (values) {
      for (const c of db.criteria) {
        if (values[c.code] !== undefined) {
          const v = parseFloat(values[c.code]);
          if (c.type === 'cost' && v <= 0) {
            return res.status(400).json({ success: false, message: `Nilai kriteria Cost ${c.name} (${c.code}) harus > 0.` });
          }
          if (c.value_type === 'discrete_scale' && (v < 1 || v > 5)) {
            return res.status(400).json({ success: false, message: `Nilai kriteria ${c.name} (${c.code}) harus 1 s/d 5.` });
          }
          std.values[c.code] = v;
        }
      }
    }

    writeDatabase(db);
    res.json({ success: true, message: 'Data siswa berhasil diperbarui.', data: std });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE single student
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDatabase();
    const idx = db.students.findIndex(s => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan.' });
    }

    const removed = db.students.splice(idx, 1)[0];
    writeDatabase(db);
    res.json({ success: true, message: `Siswa ${removed.nama_lengkap} berhasil dihapus.` });
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
    const wb = XLSX.utils.book_new();

    // 1. Data Sheet Header
    const headers = ['NISN', 'Nama Siswa', 'Kelas', 'Asal Sekolah', 'Nama Wali', 'Alamat'];
    db.criteria.forEach(c => {
      headers.push(`${c.code}_${c.name.replace(/[^a-zA-Z0-9]/g, '_')}`);
    });

    // Sample row
    const sampleRow = ['3084120001', 'Ahmad Pratama', 'X-TKJ', 'SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG', 'Budi Pratama', 'Siborongborong'];
    db.criteria.forEach(c => {
      if (c.code === 'C1') sampleRow.push(750000);
      else if (c.code === 'C2') sampleRow.push(3);
      else if (c.code === 'C3') sampleRow.push(4);
      else if (c.code === 'C4') sampleRow.push(450);
      else if (c.code === 'C5') sampleRow.push(5);
      else if (c.code === 'C6') sampleRow.push(84);
      else sampleRow.push(c.value_type === 'discrete_scale' ? 3 : 100);
    });

    const dataSheet = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    XLSX.utils.book_append_sheet(wb, dataSheet, 'DATA_SISWA');

    // 2. Guide Sheet
    const guideHeaders = ['Kode Kriteria', 'Nama Kriteria', 'Tipe', 'Format Nilai', 'Satuan', 'Keterangan Skala / Panduan'];
    const guideRows = db.criteria.map(c => {
      let scaleGuide = '-';
      if (c.value_type === 'discrete_scale' && c.options) {
        scaleGuide = c.options.map(o => `${o.point}=${o.label}`).join('; ');
      } else if (c.type === 'cost') {
        scaleGuide = 'Wajib angka riil > 0 (Semakin kecil semakin prioritas)';
      } else {
        scaleGuide = 'Wajib angka riil (Semakin besar semakin prioritas)';
      }

      return [
        c.code,
        c.name,
        c.type.toUpperCase(),
        c.value_type === 'discrete_scale' ? 'Skala Angka 1-5' : 'Angka Riil',
        c.unit || '-',
        scaleGuide
      ];
    });

    const guideSheet = XLSX.utils.aoa_to_sheet([guideHeaders, ...guideRows]);
    XLSX.utils.book_append_sheet(wb, guideSheet, 'PETUNJUK_PENGISIAN');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

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

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({ success: false, message: 'File kosong atau tidak memiliki baris data.' });
    }

    const db = readDatabase();
    const criteria = db.criteria;

    // Detect column mapping for criteria
    // Criteria can be matched by column name starting with code, e.g. "C1", "C1_Penghasilan", or matching criterion name
    const firstRowKeys = Object.keys(rawRows[0]);
    const critKeyMap = {}; // { 'C1': 'actual_column_name' }

    criteria.forEach(c => {
      const match = firstRowKeys.find(k => {
        const cleanK = k.toUpperCase().trim();
        return cleanK === c.code || cleanK.startsWith(`${c.code}_`) || cleanK.startsWith(`${c.code} `) || cleanK.includes(c.name.toUpperCase());
      });
      if (match) {
        critKeyMap[c.code] = match;
      }
    });

    // Check missing criteria columns
    const missingCriteria = criteria.filter(c => !critKeyMap[c.code]);
    if (missingCriteria.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Kolom kriteria berikut tidak ditemukan dalam file: ${missingCriteria.map(c => `${c.code} (${c.name})`).join(', ')}. Silakan gunakan template yang disediakan.`
      });
    }

    // Find identity columns
    const nisnCol = firstRowKeys.find(k => k.toUpperCase().includes('NISN')) || 'NISN';
    const nameCol = firstRowKeys.find(k => k.toUpperCase().includes('NAMA')) || 'Nama Siswa';
    const classCol = firstRowKeys.find(k => k.toUpperCase().includes('KELAS')) || 'Kelas';
    const schoolCol = firstRowKeys.find(k => k.toUpperCase().includes('SEKOLAH'));
    const parentCol = firstRowKeys.find(k => k.toUpperCase().includes('WALI') || k.toUpperCase().includes('ORANG TUA'));
    const addressCol = firstRowKeys.find(k => k.toUpperCase().includes('ALAMAT'));

    const validRows = [];
    const errors = [];
    const seenNisns = new Set();

    rawRows.forEach((row, idx) => {
      const rowNumber = idx + 2; // header is row 1
      const nisnVal = String(row[nisnCol] || '').trim();
      const nameVal = String(row[nameCol] || '').trim();
      const classVal = String(row[classCol] || '').trim();

      const rowErrors = [];

      if (!nisnVal) {
        rowErrors.push('NISN tidak boleh kosong');
      } else if (seenNisns.has(nisnVal)) {
        rowErrors.push(`NISN ${nisnVal} duplikat (ganda) dalam file upload`);
      } else {
        seenNisns.add(nisnVal);
      }

      if (!nameVal) {
        rowErrors.push('Nama siswa tidak boleh kosong');
      }

      if (!classVal) {
        rowErrors.push('Kelas tidak boleh kosong');
      }

      // Check criteria values
      const parsedValues = {};
      criteria.forEach(c => {
        const colKey = critKeyMap[c.code];
        const rawVal = row[colKey];
        const numVal = parseFloat(String(rawVal).replace(/[^0-9.-]/g, ''));

        if (rawVal === '' || rawVal === null || isNaN(numVal)) {
          rowErrors.push(`Kolom ${c.name} (${c.code}) kosong atau bukan angka`);
        } else if (c.type === 'cost' && numVal <= 0) {
          rowErrors.push(`Nilai kriteria Cost ${c.name} (${c.code}) bernilai ${numVal} (harus > 0)`);
        } else if (c.value_type === 'discrete_scale' && (numVal < 1 || numVal > 5)) {
          rowErrors.push(`Nilai kriteria skala ${c.name} (${c.code}) bernilai ${numVal} (harus berada pada skala 1-5)`);
        } else {
          parsedValues[c.code] = numVal;
        }
      });

      if (rowErrors.length > 0) {
        errors.push({
          rowNumber,
          nisn: nisnVal || '-',
          nama_lengkap: nameVal || '-',
          errorReasons: rowErrors
        });
      } else {
        validRows.push({
          nisn: nisnVal,
          nama_lengkap: nameVal,
          kelas: classVal,
          asal_sekolah: schoolCol && row[schoolCol] ? String(row[schoolCol]).trim() : 'SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG',
          nama_wali: parentCol && row[parentCol] ? String(row[parentCol]).trim() : '-',
          alamat: addressCol && row[addressCol] ? String(row[addressCol]).trim() : '-',
          values: parsedValues
        });
      }
    });

    res.json({
      success: true,
      summary: {
        totalRowsParsed: rawRows.length,
        validCount: validRows.length,
        errorCount: errors.length,
        canCommit: validRows.length > 0
      },
      validRowsPreview: validRows.slice(0, 10), // sample 10 preview
      validRowsPayload: validRows, // full payload
      errors
    });
  } catch (err) {
    res.status(500).json({ success: false, message: `Gagal memproses file: ${err.message}` });
  }
});

// POST commit imported students to database
router.post('/import-commit', (req, res) => {
  try {
    const { students, mode } = req.body; // mode: 'replace' or 'append'
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada data siswa valid untuk disimpan.' });
    }

    const db = readDatabase();

    const preparedStudents = students.map((s, idx) => ({
      id: `std-${uuidv4().substring(0, 8)}`,
      nisn: s.nisn,
      nama_lengkap: s.nama_lengkap,
      kelas: s.kelas,
      nama_wali: s.nama_wali || '-',
      alamat: s.alamat || '-',
      values: s.values
    }));

    if (mode === 'replace') {
      db.students = preparedStudents;
    } else {
      // Append mode: filter out existing NISNs or overwrite
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

    db.last_calculation = null; // reset calculation
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
