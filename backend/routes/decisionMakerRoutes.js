const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readDatabase, writeDatabase } = require('../models/storage');
const { solveSingleBWM, aggregateGeometricMean } = require('../algorithms/bwm');

// GET all decision makers
router.get('/', (req, res) => {
  try {
    const db = readDatabase();
    res.json({
      success: true,
      data: db.decision_makers,
      aggregatedWeights: db.aggregated_weights,
      criteria: db.criteria.map(c => ({ code: c.code, name: c.name, type: c.type }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST new decision maker
router.post('/', (req, res) => {
  try {
    const { name, title, institution } = req.body;
    if (!name || !title) {
      return res.status(400).json({ success: false, message: 'Nama dan Jabatan pengambil keputusan wajib diisi.' });
    }

    const db = readDatabase();
    const newDM = {
      id: `dm-${uuidv4().substring(0, 8)}`,
      name: name.trim(),
      title: title.trim(),
      institution: institution ? institution.trim() : 'Sekolah',
      evaluation: null
    };

    db.decision_makers.push(newDM);
    writeDatabase(db);

    res.json({ success: true, message: 'Pengambil keputusan baru berhasil ditambahkan.', data: newDM });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update decision maker
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, institution } = req.body;

    const db = readDatabase();
    const dm = db.decision_makers.find(d => d.id === id);
    if (!dm) {
      return res.status(404).json({ success: false, message: 'Pengambil keputusan tidak ditemukan.' });
    }

    if (name) dm.name = name.trim();
    if (title) dm.title = title.trim();
    if (institution !== undefined) dm.institution = institution.trim();

    writeDatabase(db);
    res.json({ success: true, message: 'Data pengambil keputusan berhasil diperbarui.', data: dm });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE decision maker
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDatabase();

    if (db.decision_makers.length <= 1) {
      return res.status(400).json({ success: false, message: 'Minimal harus ada 1 pengambil keputusan dalam sistem.' });
    }

    const idx = db.decision_makers.findIndex(d => d.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Pengambil keputusan tidak ditemukan.' });
    }

    const removed = db.decision_makers.splice(idx, 1)[0];
    writeDatabase(db);

    res.json({ success: true, message: `Pengambil keputusan ${removed.name} berhasil dihapus.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST preview BWM calculation and consistency status in real time
router.post('/preview', (req, res) => {
  try {
    const { bestCode, worstCode, bestToOthers, othersToWorst } = req.body;

    if (!bestCode || !worstCode || !bestToOthers || !othersToWorst) {
      return res.status(400).json({
        success: false,
        message: 'Parameter BWM tidak lengkap.'
      });
    }

    if (bestCode === worstCode) {
      return res.status(400).json({
        success: false,
        message: 'Kriteria Terbaik (Best) dan Terburuk (Worst) tidak boleh sama.'
      });
    }

    const db = readDatabase();
    const criteriaCodes = db.criteria.map(c => c.code);

    // Harmonize self-comparisons and a_BW
    const cleanedBO = { ...bestToOthers, [bestCode]: 1 };
    const cleanedOW = { ...othersToWorst, [worstCode]: 1 };
    
    // a_BW must be consistent across both vectors
    const aBW = cleanedBO[worstCode] || cleanedOW[bestCode] || 1;
    cleanedBO[worstCode] = aBW;
    cleanedOW[bestCode] = aBW;

    const solution = solveSingleBWM(criteriaCodes, bestCode, worstCode, cleanedBO, cleanedOW);

    // Build logic advisory warnings according to BWM rules
    const warnings = [];
    criteriaCodes.forEach(code => {
      if (code !== bestCode && code !== worstCode) {
        const abj = parseFloat(cleanedBO[code]) || 1;
        const ajw = parseFloat(cleanedOW[code]) || 1;
        
        // Ordinal rule: a_Bj <= a_BW and a_jW <= a_BW
        if (abj > aBW) {
          warnings.push(`Perbandingan ${bestCode} vs ${code} (${abj}) melampaui a_BW (${aBW}). Dalam BWM, preferensi kriteria terbaik terhadap kriteria lain tidak boleh melebihi preferensi terhadap kriteria terburuk.`);
        }
        if (ajw > aBW) {
          warnings.push(`Perbandingan ${code} vs ${worstCode} (${ajw}) melampaui a_BW (${aBW}).`);
        }

        // Multiplicative consistency rule: a_Bj * a_jW ≈ a_BW
        const product = abj * ajw;
        if (Math.abs(product - aBW) > 3 && aBW > 1) {
          warnings.push(`Kriteria ${code}: perkalian (${abj} × ${ajw} = ${product}) menyimpang cukup jauh dari a_BW (${aBW}). Nilai ideal ${code} vs ${worstCode} disarankan sekitar ${Math.round(aBW / abj) || 1}.`);
        }
      }
    });

    res.json({
      success: true,
      data: {
        weights: solution.weights,
        xi: solution.xi,
        aBW: solution.aBW,
        ci: solution.ci,
        consistencyRatio: solution.consistencyRatio,
        isConsistent: solution.isConsistent,
        warnings
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST submit BWM evaluation for a specific Decision Maker
router.post('/:id/evaluate', (req, res) => {
  try {
    const { id } = req.params;
    const { bestCode, worstCode, bestToOthers, othersToWorst } = req.body;

    if (!bestCode || !worstCode || !bestToOthers || !othersToWorst) {
      return res.status(400).json({
        success: false,
        message: 'Parameter BWM tidak lengkap. Pastikan Best, Worst, Best-to-Others, dan Others-to-Worst terisi.'
      });
    }

    if (bestCode === worstCode) {
      return res.status(400).json({
        success: false,
        message: 'Kriteria Terbaik (Best) dan Terburuk (Worst) tidak boleh sama.'
      });
    }

    const db = readDatabase();
    const dm = db.decision_makers.find(d => d.id === id);
    if (!dm) {
      return res.status(404).json({ success: false, message: 'Pengambil keputusan tidak ditemukan.' });
    }

    const criteriaCodes = db.criteria.map(c => c.code);

    // Harmonize self-comparisons and a_BW
    const cleanedBO = { ...bestToOthers, [bestCode]: 1 };
    const cleanedOW = { ...othersToWorst, [worstCode]: 1 };
    const aBW = cleanedBO[worstCode] || cleanedOW[bestCode] || 1;
    cleanedBO[worstCode] = aBW;
    cleanedOW[bestCode] = aBW;

    // Solve BWM
    const solution = solveSingleBWM(criteriaCodes, bestCode, worstCode, cleanedBO, cleanedOW);

    // Update DM evaluation
    dm.evaluation = {
      bestCode,
      worstCode,
      bestToOthers: cleanedBO,
      othersToWorst: cleanedOW,
      weights: solution.weights,
      xi: solution.xi,
      aBW: solution.aBW,
      ci: solution.ci,
      consistencyRatio: solution.consistencyRatio,
      isConsistent: solution.isConsistent,
      submittedAt: new Date().toISOString()
    };

    writeDatabase(db);

    res.json({
      success: true,
      message: solution.isConsistent 
        ? 'Evaluasi BWM berhasil diproses dan memenuhi syarat konsistensi (CR < 0.10).'
        : `Evaluasi BWM berhasil dihitung namun nilai CR (${solution.consistencyRatio}) >= 0.10 (kurang konsisten). Disarankan meninjau ulang skala perbandingan.`,
      data: dm.evaluation
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST calculate Geometric Mean Aggregation across all active Decision Makers
router.post('/aggregate', (req, res) => {
  try {
    const db = readDatabase();
    const criteriaCodes = db.criteria.map(c => c.code);

    // Filter DMs that have submitted evaluations
    const validDMs = db.decision_makers.filter(dm => dm.evaluation && dm.evaluation.weights);

    if (validDMs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Belum ada pengambil keputusan yang menyelesaikan pengisian kuesioner BWM.'
      });
    }

    const evaluations = validDMs.map(dm => ({
      dmId: dm.id,
      dmName: dm.name,
      weights: dm.evaluation.weights,
      cr: dm.evaluation.consistencyRatio
    }));

    // Perform geometric mean aggregation
    const aggResult = aggregateGeometricMean(criteriaCodes, evaluations);

    // Apply normalized weights to criteria
    db.aggregated_weights = aggResult.normalizedWeights;
    db.criteria.forEach(c => {
      if (aggResult.normalizedWeights[c.code] !== undefined) {
        c.final_weight = aggResult.normalizedWeights[c.code];
      }
    });

    writeDatabase(db);

    res.json({
      success: true,
      message: `Bobot BWM dari ${validDMs.length} pengambil keputusan berhasil diagregasi menggunakan Geometric Mean.`,
      data: {
        numDecisionMakers: validDMs.length,
        decisionMakersList: validDMs.map(d => ({
          name: d.name,
          title: d.title,
          weights: d.evaluation.weights,
          cr: d.evaluation.consistencyRatio,
          isConsistent: d.evaluation.isConsistent
        })),
        geometricWeights: aggResult.geometricWeights,
        normalizedWeights: aggResult.normalizedWeights
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
