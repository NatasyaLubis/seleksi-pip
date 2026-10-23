const XLSX = require('xlsx');
const { ValidationError } = require('../utils/errors');

/**
 * Generates official Excel template for student data importation
 * @param {Array<Object>} criteria 
 * @returns {Buffer}
 */
function generateTemplate(criteria) {
  const wb = XLSX.utils.book_new();

  // 1. Data Sheet Header
  const headers = ['NISN', 'Nama Siswa', 'Kelas', 'Asal Sekolah', 'Alamat'];
  criteria.forEach(c => {
    headers.push(`${c.code}_${c.name.replace(/[^a-zA-Z0-9]/g, '_')}`);
  });

  // Sample row
  const sampleRow = ['3084120001', 'Ahmad Pratama', 'X-TKJ', 'SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG', 'Siborongborong'];
  criteria.forEach(c => {
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
  const guideRows = criteria.map(c => {
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

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Parses and validates uploaded Excel buffer for student data
 * @param {Buffer} fileBuffer 
 * @param {Array<Object>} criteria 
 * @param {Array<Object>} existingStudents 
 * @returns {Object}
 */
function parseAndValidateExcel(fileBuffer, criteria, existingStudents = []) {
  if (!fileBuffer) {
    throw new ValidationError('File Excel (.xlsx/.xls) atau .csv belum dipilih.');
  }

  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new ValidationError('File kosong atau tidak memiliki baris data.');
  }

  const firstRowKeys = Object.keys(rawRows[0]);
  const critKeyMap = {};

  criteria.forEach(c => {
    const match = firstRowKeys.find(k => {
      const cleanK = k.toUpperCase().trim();
      return cleanK === c.code || cleanK.startsWith(`${c.code}_`) || cleanK.startsWith(`${c.code} `) || cleanK.includes(c.name.toUpperCase());
    });
    if (match) {
      critKeyMap[c.code] = match;
    }
  });

  const missingCriteria = criteria.filter(c => !critKeyMap[c.code]);
  if (missingCriteria.length > 0) {
    throw new ValidationError(`Kolom kriteria berikut tidak ditemukan dalam file: ${missingCriteria.map(c => `${c.code} (${c.name})`).join(', ')}. Silakan gunakan template yang disediakan.`);
  }

  const nisnCol = firstRowKeys.find(k => k.toUpperCase().includes('NISN')) || 'NISN';
  const nameCol = firstRowKeys.find(k => k.toUpperCase().includes('NAMA')) || 'Nama Siswa';
  const classCol = firstRowKeys.find(k => k.toUpperCase().includes('KELAS')) || 'Kelas';
  const schoolCol = firstRowKeys.find(k => k.toUpperCase().includes('SEKOLAH'));
  const addressCol = firstRowKeys.find(k => k.toUpperCase().includes('ALAMAT'));

  const validRows = [];
  const errors = [];
  const seenNisns = new Set();
  const existingNisnMap = new Map((existingStudents || []).map(s => [s.nisn, s.nama_lengkap]));

  rawRows.forEach((row, idx) => {
    const rowNumber = idx + 2;
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
        alamat: addressCol && row[addressCol] ? String(row[addressCol]).trim() : '-',
        values: parsedValues,
        alreadyInDb: existingNisnMap.has(nisnVal)
      });
    }
  });

  return {
    totalRows: rawRows.length,
    validCount: validRows.length,
    errorCount: errors.length,
    validRows,
    errors
  };
}

module.exports = {
  generateTemplate,
  parseAndValidateExcel
};
