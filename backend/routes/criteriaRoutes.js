const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readDatabase, writeDatabase } = require('../models/storage');

// GET all criteria
router.get('/', (req, res) => {
  try {
    const db = readDatabase();
    res.json({
      success: true,
      data: db.criteria,
      aggregatedWeights: db.aggregated_weights
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST new criterion
router.post('/', (req, res) => {
  try {
    const { code, name, type, value_type, unit, description, options } = req.body;
    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Nama dan Tipe Kriteria wajib diisi.' });
    }

    const db = readDatabase();
    // Generate code if not provided
    const nextNum = db.criteria.length + 1;
    const finalCode = (code || `C${nextNum}`).toUpperCase().trim();

    // Check duplicate code
    if (db.criteria.some(c => c.code === finalCode)) {
      return res.status(400).json({ success: false, message: `Kode kriteria ${finalCode} sudah digunakan.` });
    }

    const newCriterion = {
      id: `crit-${uuidv4().substring(0, 8)}`,
      code: finalCode,
      name: name.trim(),
      type: type === 'cost' ? 'cost' : 'benefit',
      value_type: value_type === 'discrete_scale' ? 'discrete_scale' : 'real_numeric',
      unit: unit ? unit.trim() : (value_type === 'discrete_scale' ? 'Skala 1-5' : 'Poin'),
      description: description ? description.trim() : '',
      final_weight: 0,
      options: value_type === 'discrete_scale' && Array.isArray(options) ? options : [
        { point: 1, label: 'Sangat Rendah / Minimum' },
        { point: 2, label: 'Rendah / Kurang' },
        { point: 3, label: 'Sedang / Cukup' },
        { point: 4, label: 'Tinggi / Baik' },
        { point: 5, label: 'Sangat Tinggi / Maksimum' }
      ]
    };

    db.criteria.push(newCriterion);
    writeDatabase(db);

    res.json({ success: true, message: 'Kriteria berhasil ditambahkan.', data: newCriterion });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update criterion
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, value_type, unit, description, options, final_weight } = req.body;

    const db = readDatabase();
    const idx = db.criteria.findIndex(c => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Kriteria tidak ditemukan.' });
    }

    const target = db.criteria[idx];
    if (name) target.name = name.trim();
    if (type) target.type = type === 'cost' ? 'cost' : 'benefit';
    if (value_type) target.value_type = value_type === 'discrete_scale' ? 'discrete_scale' : 'real_numeric';
    if (unit !== undefined) target.unit = unit.trim();
    if (description !== undefined) target.description = description.trim();
    if (options && Array.isArray(options)) target.options = options;
    if (final_weight !== undefined) target.final_weight = parseFloat(final_weight) || 0;

    writeDatabase(db);
    res.json({ success: true, message: 'Kriteria berhasil diperbarui.', data: target });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE criterion
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDatabase();

    if (db.criteria.length <= 2) {
      return res.status(400).json({ success: false, message: 'Minimal harus tersisa 2 kriteria untuk SPK.' });
    }

    const idx = db.criteria.findIndex(c => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Kriteria tidak ditemukan.' });
    }

    const removed = db.criteria.splice(idx, 1)[0];

    // Clean up code from students values
    db.students.forEach(std => {
      if (std.values && std.values[removed.code] !== undefined) {
        delete std.values[removed.code];
      }
    });

    writeDatabase(db);
    res.json({ success: true, message: `Kriteria ${removed.code} (${removed.name}) berhasil dihapus.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
