const solver = require('javascript-lp-solver');
const { ValidationError } = require('../utils/errors');

/**
 * Best-Worst Method (BWM) Engine
 * 
 * References:
 * 1. Rezaei, J. (2015). "Best-worst multi-criteria decision-making method." 
 *    Omega, 53, 49-57. https://doi.org/10.1016/j.omega.2015.01.006
 *    (Defines Consistency Index / CI table for pairwise comparisons on scale 1-9)
 * 2. Rezaei, J. (2016). "Best-worst multi-criteria decision-making method: Some properties and a linear model."
 *    Omega, 64, 126-130. https://doi.org/10.1016/j.omega.2015.12.001
 *    (Defines the Linear Programming minimax model: min xi^L)
 * 3. Liang, F., Brunelli, M., & Rezaei, J. (2020). "Consistency issues in the Best Worst Method: 
 *    Measurements and thresholds." Omega, 96, 102251.
 * 
 * In this implementation (aligned with Skripsi Proposal Bab 3):
 * - Linear formulation:
 *     min xi
 *     s.t.
 *       |w_B - a_Bj * w_j| <= xi, for all j
 *       |w_j - a_jW * w_W| <= xi, for all j
 *       sum(w_j) = 1
 *       w_j >= 0, for all j
 * - Consistency Ratio: CR = xi / CI(a_BW)
 * - Consistency Threshold: CR <= 0.10 (indicates consistent evaluations)
 */

// Epsilon constant for handling zero weights in multiplicative operations
const EPSILON = 1e-4;

// Consistency Index Table (Rezaei, 2015 / 2016) for a_BW: 1 to 9
const CONSISTENCY_INDEX = {
  1: 0.00,
  2: 0.44,
  3: 1.00,
  4: 1.63,
  5: 2.30,
  6: 3.00,
  7: 3.73,
  8: 4.47,
  9: 5.23
};

/**
 * Validates a single BWM comparison score
 * @param {any} value 
 * @param {string} code 
 * @param {string} vectorName 
 * @returns {number}
 */
function validateComparisonValue(value, code, vectorName) {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`Nilai perbandingan ${vectorName} untuk kriteria ${code} belum diisi.`);
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1 || num > 9) {
    throw new ValidationError(`Nilai perbandingan ${vectorName} untuk kriteria ${code} (${value}) tidak valid. Harus bilangan bulat skala 1 sampai 9.`);
  }
  return num;
}

/**
 * Solve BWM for a single Decision Maker using Linear Formulation
 * @param {Array<string>} criteriaCodes - e.g. ['C1', 'C2', 'C3', 'C4', 'C5', 'C6']
 * @param {string} bestCode - e.g. 'C1'
 * @param {string} worstCode - e.g. 'C6'
 * @param {Object} bestToOthers - e.g. { C1: 1, C2: 3, C3: 2, ... }
 * @param {Object} othersToWorst - e.g. { C1: 8, C2: 3, C3: 4, ... }
 * @returns {Object} { weights, xi, aBW, ci, consistencyRatio, isConsistent }
 */
function solveSingleBWM(criteriaCodes, bestCode, worstCode, bestToOthers, othersToWorst) {
  if (!Array.isArray(criteriaCodes) || criteriaCodes.length < 2) {
    throw new ValidationError('Minimal harus ada 2 kriteria untuk melakukan pembobotan BWM.');
  }

  if (!bestCode || !worstCode) {
    throw new ValidationError('Kriteria Terbaik (Best) dan Terburuk (Worst) harus ditentukan.');
  }

  if (!criteriaCodes.includes(bestCode)) {
    throw new ValidationError(`Kriteria Terbaik (${bestCode}) tidak ditemukan dalam daftar kriteria.`);
  }

  if (!criteriaCodes.includes(worstCode)) {
    throw new ValidationError(`Kriteria Terburuk (${worstCode}) tidak ditemukan dalam daftar kriteria.`);
  }

  if (!bestToOthers || typeof bestToOthers !== 'object') {
    throw new ValidationError('Vektor perbandingan Best-to-Others wajib disertakan.');
  }

  if (!othersToWorst || typeof othersToWorst !== 'object') {
    throw new ValidationError('Vektor perbandingan Others-to-Worst wajib disertakan.');
  }

  // Linear Programming problem setup
  const constraints = {
    sum_equal_1_max: { max: 1 },
    sum_equal_1_min: { min: 1 }
  };

  const variables = {
    xi: { obj: 1 }
  };

  // Initialize variables for each criterion weight
  criteriaCodes.forEach(code => {
    variables[code] = {
      obj: 0,
      sum_equal_1_max: 1,
      sum_equal_1_min: 1
    };
  });

  let cIdx = 0;
  criteriaCodes.forEach(jCode => {
    // Self comparisons are automatically 1
    const abj = (jCode === bestCode)
      ? 1
      : validateComparisonValue(bestToOthers[jCode], jCode, 'Best-to-Others');

    const ajw = (jCode === worstCode)
      ? 1
      : validateComparisonValue(othersToWorst[jCode], jCode, 'Others-to-Worst');

    // Constraint 1: w_B - a_Bj * w_j - xi <= 0
    const c1 = `c_${cIdx++}`;
    constraints[c1] = { max: 0 };
    variables.xi[c1] = -1;
    variables[bestCode][c1] = (variables[bestCode][c1] || 0) + 1;
    variables[jCode][c1] = (variables[jCode][c1] || 0) - abj;

    // Constraint 2: -w_B + a_Bj * w_j - xi <= 0
    const c2 = `c_${cIdx++}`;
    constraints[c2] = { max: 0 };
    variables.xi[c2] = -1;
    variables[bestCode][c2] = (variables[bestCode][c2] || 0) - 1;
    variables[jCode][c2] = (variables[jCode][c2] || 0) + abj;

    // Constraint 3: w_j - a_jW * w_W - xi <= 0
    const c3 = `c_${cIdx++}`;
    constraints[c3] = { max: 0 };
    variables.xi[c3] = -1;
    variables[jCode][c3] = (variables[jCode][c3] || 0) + 1;
    variables[worstCode][c3] = (variables[worstCode][c3] || 0) - ajw;

    // Constraint 4: -w_j + a_jW * w_W - xi <= 0
    const c4 = `c_${cIdx++}`;
    constraints[c4] = { max: 0 };
    variables.xi[c4] = -1;
    variables[jCode][c4] = (variables[jCode][c4] || 0) - 1;
    variables[worstCode][c4] = (variables[worstCode][c4] || 0) + ajw;
  });

  const model = {
    optimize: 'xi',
    opType: 'min',
    constraints,
    variables
  };

  const solution = solver.Solve(model);
  if (!solution.feasible) {
    throw new ValidationError('Model optimasi linear BWM tidak menemukan solusi optimal (infeasible). Periksa kembali nilai perbandingan yang diinput.');
  }

  const xi = solution.result || 0;
  const weights = {};
  let totalWeight = 0;

  criteriaCodes.forEach(code => {
    const w = solution[code] || 0;
    weights[code] = w;
    totalWeight += w;
  });

  // Normalize weights to sum to exactly 1.0
  if (totalWeight > 0) {
    criteriaCodes.forEach(code => {
      weights[code] = parseFloat((weights[code] / totalWeight).toFixed(6));
    });
  }

  // Identify a_BW: comparison between Best and Worst criteria
  const aBW = (bestCode === worstCode)
    ? 1
    : (Number(bestToOthers[worstCode]) || Number(othersToWorst[bestCode]) || 1);

  const roundedAbw = Math.min(Math.max(Math.round(aBW), 1), 9);
  const ci = CONSISTENCY_INDEX[roundedAbw] || 0.00;
  
  // Calculate Consistency Ratio (CR) = xi / CI
  let cr = 0;
  if (ci > 0) {
    cr = parseFloat((xi / ci).toFixed(4));
  } else {
    // When a_BW is 1 (all criteria equally important), consistency holds if xi ~ 0
    cr = xi > 0.01 ? 1.0 : 0.0;
  }
  const isConsistent = cr <= 0.10;

  return {
    weights,
    xi: parseFloat(xi.toFixed(6)),
    aBW,
    ci,
    consistencyRatio: cr,
    isConsistent
  };
}

/**
 * Aggregate weights from multiple Decision Makers using Geometric Mean
 * w_j^G = ( \prod_{p=1}^P w_j^{(p)} )^(1/P)
 * \bar{w}_j = w_j^G / \sum w_m^G
 * @param {Array<string>} criteriaCodes
 * @param {Array<Object>} dmEvaluations - Array of evaluations with { weights: { C1: ..., C2: ... } }
 * @returns {Object} { numDecisionMakers, geometricWeights, normalizedWeights }
 */
function aggregateGeometricMean(criteriaCodes, dmEvaluations) {
  if (!Array.isArray(dmEvaluations) || dmEvaluations.length === 0) {
    throw new ValidationError('Tidak ada data evaluasi pengambil keputusan untuk diagregasikan.');
  }

  if (!Array.isArray(criteriaCodes) || criteriaCodes.length < 2) {
    throw new ValidationError('Minimal harus ada 2 kriteria untuk melakukan agregasi bobot.');
  }

  const numDMs = dmEvaluations.length;
  const geometricWeights = {};
  let sumGeo = 0;

  criteriaCodes.forEach(code => {
    let product = 1;
    dmEvaluations.forEach(evalData => {
      const w = (evalData && evalData.weights && evalData.weights[code] > 0)
        ? evalData.weights[code]
        : EPSILON;
      product *= w;
    });

    const geoMean = Math.pow(product, 1 / numDMs);
    geometricWeights[code] = geoMean;
    sumGeo += geoMean;
  });

  const normalizedWeights = {};
  criteriaCodes.forEach(code => {
    normalizedWeights[code] = sumGeo > 0 ? parseFloat((geometricWeights[code] / sumGeo).toFixed(6)) : 0;
  });

  return {
    numDecisionMakers: numDMs,
    geometricWeights,
    normalizedWeights
  };
}

module.exports = {
  EPSILON,
  CONSISTENCY_INDEX,
  solveSingleBWM,
  aggregateGeometricMean
};
