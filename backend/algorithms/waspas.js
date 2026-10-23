const { ValidationError } = require('../utils/errors');

/**
 * WASPAS Algorithm Engine
 * Weighted Aggregated Sum Product Assessment
 * 
 * References:
 * 1. Zavadskas, E. K., Turskis, Z., Antucheviciene, J., & Zakarevicius, A. (2012). 
 *    "Optimization of Weighted Aggregated Sum Product Assessment." 
 *    Elektronika ir Elektrotechnika, 122(6), 3-6.
 * 2. Proposal Skripsi Bab 3:
 *    - Matrix Normalization (R):
 *        Benefit: r_ij = x_ij / max(x_j)
 *        Cost:    r_ij = min(x_j) / x_ij
 *    - WSM (Q1): Q1_i = sum(w_j * r_ij)
 *    - WPM (Q2): Q2_i = prod((max(r_ij, EPSILON)) ^ w_j)
 *    - Joint Score (Q): Q_i = lambda * Q1_i + (1 - lambda) * Q2_i
 *    - Tie-breaker: jika skor Q sama, bandingkan nilai kriteria berbobot tertinggi.
 */

// Epsilon constant for handling zero or non-positive normalized values in WPM
const EPSILON = 1e-4;

/**
 * Assigns ranking and quota allocation status
 * @param {Array<Object>} rankings - Sorted list of evaluated alternatives
 * @param {number} quota - Quota target for PIP recipients (e.g. 50)
 * @returns {Array<Object>} Updated rankings
 */
function applyQuota(rankings, quota = 50) {
  const targetQuota = Math.max(0, parseInt(quota, 10) || 50);
  rankings.forEach((alt, index) => {
    const rank = index + 1;
    alt.rank = rank;

    if (rank <= targetQuota) {
      alt.quotaStatus = 'passed_quota';
      alt.statusLabel = 'Lolos Kuota (Prioritas Utama)';
      alt.priorityOrder = rank;
    } else {
      const backupNum = rank - targetQuota;
      alt.quotaStatus = 'backup_priority';
      alt.statusLabel = `Cadangan Prioritas #${backupNum}`;
      alt.priorityOrder = backupNum;
    }
  });
  return rankings;
}

/**
 * Perform WASPAS calculation on alternatives against criteria
 * @param {Array<Object>} alternatives - List of student alternatives with criteria values
 * @param {Array<Object>} criteria - List of criteria with { code, name, type: 'benefit'|'cost', final_weight }
 * @param {number} lambda - Trade-off parameter (default 0.5)
 * @param {number} quota - Quota target for PIP recipients (e.g. 50)
 * @returns {Object} Comprehensive calculation result with step-by-step transparency
 */
function calculateWASPAS(alternatives, criteria, lambda = 0.5, quota = 50) {
  if (!Array.isArray(alternatives) || alternatives.length === 0) {
    throw new ValidationError('Tidak ada data alternatif siswa untuk dihitung.');
  }

  if (!Array.isArray(criteria) || criteria.length < 2) {
    throw new ValidationError('Minimal harus ada 2 kriteria untuk melakukan perhitungan WASPAS.');
  }

  // 1. Identify max and min for each criterion
  const stats = {};
  criteria.forEach(c => {
    let maxVal = -Infinity;
    let minVal = Infinity;

    alternatives.forEach(alt => {
      if (!alt.values || alt.values[c.code] === undefined || alt.values[c.code] === null || alt.values[c.code] === '') {
        throw new ValidationError(`Data siswa ${alt.nama_lengkap || alt.nisn} pada kriteria ${c.name} (${c.code}) kosong atau tidak lengkap.`);
      }
      const val = parseFloat(alt.values[c.code]);
      if (isNaN(val)) {
        throw new ValidationError(`Data siswa ${alt.nama_lengkap || alt.nisn} pada kriteria ${c.name} (${c.code}) tidak valid (harus angka).`);
      }
      if (val > maxVal) maxVal = val;
      if (val < minVal) minVal = val;
    });

    // Safeguard for division by zero on cost criteria
    if (c.type === 'cost' && minVal <= 0) {
      throw new ValidationError(`Nilai minimum kriteria Cost ${c.name} (${c.code}) bernilai <= 0. Nilai kriteria Cost harus > 0 agar tidak terjadi pembagian dengan nol.`);
    }

    stats[c.code] = {
      max: maxVal,
      min: minVal,
      type: c.type,
      weight: parseFloat(c.final_weight) || 0
    };
  });

  // Identify highest weighted criterion for tie-breaker
  let highestWeightCritCode = criteria[0].code;
  let maxCritWeight = -1;
  criteria.forEach(c => {
    const w = parseFloat(c.final_weight) || 0;
    if (w > maxCritWeight) {
      maxCritWeight = w;
      highestWeightCritCode = c.code;
    }
  });

  // 2. Normalize Decision Matrix (R)
  const normalizedMatrix = [];
  const rawMatrix = [];
  const preciseNormalizedValues = [];

  alternatives.forEach(alt => {
    const normRow = {
      id: alt.id,
      nisn: alt.nisn,
      nama_lengkap: alt.nama_lengkap,
      kelas: alt.kelas,
      values: {}
    };

    const rawRow = {
      id: alt.id,
      nisn: alt.nisn,
      nama_lengkap: alt.nama_lengkap,
      kelas: alt.kelas,
      values: { ...alt.values }
    };

    const preciseRow = {};

    criteria.forEach(c => {
      const x = parseFloat(alt.values[c.code]);
      let r = 0;

      if (c.type === 'benefit') {
        r = stats[c.code].max > 0 ? x / stats[c.code].max : 0;
      } else {
        // Cost: min / x
        r = x > 0 ? stats[c.code].min / x : 0;
      }

      preciseRow[c.code] = r;
      // Round to 6 decimals for formatted matrix presentation
      normRow.values[c.code] = parseFloat(r.toFixed(6));
    });

    rawMatrix.push(rawRow);
    normalizedMatrix.push(normRow);
    preciseNormalizedValues.push(preciseRow);
  });

  // 3. Compute WSM (Q1), WPM (Q2), and WASPAS Score (Q)
  const evaluatedAlternatives = [];

  alternatives.forEach((rawAlt, idx) => {
    const rValues = preciseNormalizedValues[idx];
    let wsm = 0;
    let wpm = 1;

    criteria.forEach(c => {
      const r = rValues[c.code];
      const w = stats[c.code].weight;

      // WSM: sum of (r * w)
      wsm += r * w;

      // WPM: product of (r ^ w) using named EPSILON constant for values <= 0
      const safeR = r > 0 ? r : EPSILON;
      wpm *= Math.pow(safeR, w);
    });

    const waspasScore = (lambda * wsm) + ((1 - lambda) * wpm);

    evaluatedAlternatives.push({
      id: rawAlt.id,
      nisn: rawAlt.nisn,
      nama_lengkap: rawAlt.nama_lengkap,
      kelas: rawAlt.kelas,
      asal_sekolah: rawAlt.asal_sekolah || 'SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG',
      alamat: rawAlt.alamat || '-',
      rawValues: rawAlt.values,
      normalizedValues: normalizedMatrix[idx].values,
      wsmScore: parseFloat(wsm.toFixed(6)),
      wpmScore: parseFloat(wpm.toFixed(6)),
      waspasScore: parseFloat(waspasScore.toFixed(6)),
      tieBreakerValue: parseFloat(rawAlt.values[highestWeightCritCode]) || 0
    });
  });

  // 4. Sort and Rank (with tie-breaker on highest weighted criterion)
  evaluatedAlternatives.sort((a, b) => {
    if (Math.abs(b.waspasScore - a.waspasScore) > 1e-6) {
      return b.waspasScore - a.waspasScore;
    }
    // Tie-breaker: higher value on highest weighted criterion
    const cType = stats[highestWeightCritCode].type;
    if (cType === 'cost') {
      return a.tieBreakerValue - b.tieBreakerValue; // smaller is better for Cost
    }
    return b.tieBreakerValue - a.tieBreakerValue; // higher is better for Benefit
  });

  // 5. Assign Rank and Quota Status via shared applyQuota
  const targetQuota = parseInt(quota, 10) || 50;
  applyQuota(evaluatedAlternatives, targetQuota);

  // 6. Summary metrics
  const totalStudents = evaluatedAlternatives.length;
  const passedStudents = Math.min(totalStudents, targetQuota);
  const backupStudents = Math.max(0, totalStudents - targetQuota);
  const cutOffScore = evaluatedAlternatives[passedStudents - 1] 
    ? evaluatedAlternatives[passedStudents - 1].waspasScore 
    : 0;

  return {
    calculatedAt: new Date().toISOString(),
    totalStudents,
    quota: targetQuota,
    passedCount: passedStudents,
    backupCount: backupStudents,
    quotaFulfillmentPercentage: targetQuota > 0 ? parseFloat(((passedStudents / targetQuota) * 100).toFixed(1)) : 0,
    cutOffScore,
    lambda,
    highestWeightCriterion: {
      code: highestWeightCritCode,
      name: criteria.find(c => c.code === highestWeightCritCode)?.name || highestWeightCritCode,
      weight: maxCritWeight
    },
    criteriaStats: stats,
    rawMatrix,
    normalizedMatrix,
    rankings: evaluatedAlternatives
  };
}

module.exports = {
  EPSILON,
  applyQuota,
  calculateWASPAS
};
