/**
 * WASPAS Algorithm Engine
 * Weighted Aggregated Sum Product Assessment
 */

/**
 * Perform WASPAS calculation on alternatives against criteria
 * @param {Array<Object>} alternatives - List of student alternatives with criteria values
 * @param {Array<Object>} criteria - List of criteria with { code, name, type: 'benefit'|'cost', final_weight }
 * @param {number} lambda - Trade-off parameter (default 0.5)
 * @param {number} quota - Quota target for PIP recipients (e.g. 50)
 * @returns {Object} Comprehensive calculation result with step-by-step transparency
 */
function calculateWASPAS(alternatives, criteria, lambda = 0.5, quota = 50) {
  if (!alternatives || alternatives.length === 0) {
    throw new Error('Tidak ada data alternatif siswa untuk dihitung.');
  }

  if (!criteria || criteria.length === 0) {
    throw new Error('Kriteria belum dikonfigurasi.');
  }

  // 1. Identify max and min for each criterion
  const stats = {};
  criteria.forEach(c => {
    let maxVal = -Infinity;
    let minVal = Infinity;

    alternatives.forEach(alt => {
      const val = parseFloat(alt.values[c.code]);
      if (isNaN(val)) {
        throw new Error(`Data siswa ${alt.nama_lengkap} (${alt.nisn}) pada kriteria ${c.name} (${c.code}) kosong atau tidak valid.`);
      }
      if (val > maxVal) maxVal = val;
      if (val < minVal) minVal = val;
    });

    // Safeguard for division by zero on cost criteria
    if (c.type === 'cost' && minVal <= 0) {
      throw new Error(`Nilai minimum kriteria Cost ${c.name} (${c.code}) bernilai <= 0. Nilai harus > 0 agar tidak terjadi pembagian dengan nol.`);
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
    if ((parseFloat(c.final_weight) || 0) > maxCritWeight) {
      maxCritWeight = parseFloat(c.final_weight) || 0;
      highestWeightCritCode = c.code;
    }
  });

  // 2. Normalize Decision Matrix (R)
  const normalizedMatrix = [];
  const rawMatrix = [];

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

    criteria.forEach(c => {
      const x = parseFloat(alt.values[c.code]);
      let r = 0;

      if (c.type === 'benefit') {
        r = stats[c.code].max > 0 ? x / stats[c.code].max : 0;
      } else {
        // Cost: min / x
        r = x > 0 ? stats[c.code].min / x : 0;
      }

      normRow.values[c.code] = parseFloat(r.toFixed(6));
    });

    rawMatrix.push(rawRow);
    normalizedMatrix.push(normRow);
  });

  // 3. Compute WSM (Q1), WPM (Q2), and WASPAS Score (Q)
  const evaluatedAlternatives = [];

  normalizedMatrix.forEach((normRow, idx) => {
    const rawAlt = alternatives[idx];
    let wsm = 0;
    let wpm = 1;

    criteria.forEach(c => {
      const r = normRow.values[c.code];
      const w = stats[c.code].weight;

      // WSM: sum of r * w
      wsm += r * w;

      // WPM: product of r ^ w (menggunakan epsilon 0.0001 untuk nilai 0 sesuai metodologi Bab 3)
      wpm *= Math.pow(Math.max(r, 0.0001), w);
    });

    const waspasScore = (lambda * wsm) + ((1 - lambda) * wpm);

    evaluatedAlternatives.push({
      id: rawAlt.id,
      nisn: rawAlt.nisn,
      nama_lengkap: rawAlt.nama_lengkap,
      kelas: rawAlt.kelas,
      asal_sekolah: rawAlt.asal_sekolah || 'SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG',
      nama_wali: rawAlt.nama_wali || '-',
      alamat: rawAlt.alamat || '-',
      rawValues: rawAlt.values,
      normalizedValues: normRow.values,
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
      return a.tieBreakerValue - b.tieBreakerValue; // smaller is better
    }
    return b.tieBreakerValue - a.tieBreakerValue; // higher is better
  });

  // 5. Assign Rank and Quota Status
  const targetQuota = parseInt(quota, 10) || 50;
  evaluatedAlternatives.forEach((alt, index) => {
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
  calculateWASPAS
};
