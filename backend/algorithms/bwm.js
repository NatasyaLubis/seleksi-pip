const solver = require('javascript-lp-solver');

// Consistency Index Table (Rezaei, 2015 / 2016)
// Index corresponds to a_BW: 1 to 9
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
 * Solve BWM for a single Decision Maker using Linear Formulation
 * @param {Array<string>} criteriaCodes - e.g. ['C1', 'C2', 'C3', 'C4', 'C5', 'C6']
 * @param {string} bestCode - e.g. 'C1'
 * @param {string} worstCode - e.g. 'C6'
 * @param {Object} bestToOthers - e.g. { C1: 1, C2: 3, C3: 2, ... }
 * @param {Object} othersToWorst - e.g. { C1: 8, C2: 3, C3: 4, ... }
 * @returns {Object} { weights, xi, consistencyRatio, isConsistent }
 */
function solveSingleBWM(criteriaCodes, bestCode, worstCode, bestToOthers, othersToWorst) {
  if (!criteriaCodes || criteriaCodes.length < 2) {
    throw new Error('Minimal harus ada 2 kriteria untuk melakukan BWM.');
  }

  if (!bestCode || !worstCode) {
    throw new Error('Kriteria Terbaik (Best) dan Terburuk (Worst) harus ditentukan.');
  }

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
    const abj = parseFloat(bestToOthers[jCode]) || 1;
    const ajw = parseFloat(othersToWorst[jCode]) || 1;

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
    throw new Error('Model BWM tidak menemukan solusi optimal (infeasible). Periksa kembali konsistensi nilai input.');
  }

  const xi = solution.result || 0;
  const weights = {};
  let totalWeight = 0;

  criteriaCodes.forEach(code => {
    const w = solution[code] || 0;
    weights[code] = w;
    totalWeight += w;
  });

  // Ensure normalized to exact 1
  if (totalWeight > 0) {
    criteriaCodes.forEach(code => {
      weights[code] = parseFloat((weights[code] / totalWeight).toFixed(6));
    });
  }

  // Harmonize a_BW if needed so Best vs Worst is symmetric across both vectors
  const aBW = parseFloat(bestToOthers[worstCode]) || parseFloat(othersToWorst[bestCode]) || 1;
  const ci = CONSISTENCY_INDEX[Math.min(Math.max(Math.round(aBW), 1), 9)] || 0.00;
  
  // Calculate Consistency Ratio (CR)
  let cr = 0;
  if (ci > 0) {
    cr = parseFloat((xi / ci).toFixed(4));
  } else {
    // When a_BW is 1 (all criteria equal), comparisons are only consistent if xi is 0
    cr = xi > 0.01 ? 1.0 : 0.0;
  }
  const isConsistent = cr < 0.10;

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
 * @returns {Object} { geometricWeights, normalizedWeights, dmsSummary }
 */
function aggregateGeometricMean(criteriaCodes, dmEvaluations) {
  if (!dmEvaluations || dmEvaluations.length === 0) {
    throw new Error('Tidak ada data evaluasi pengambil keputusan untuk diagregasikan.');
  }

  const numDMs = dmEvaluations.length;
  const geometricWeights = {};
  let sumGeo = 0;

  criteriaCodes.forEach(code => {
    let product = 1;
    dmEvaluations.forEach(evalData => {
      const w = evalData.weights[code] || 0.0001;
      product *= w;
    });

    const geoMean = Math.pow(product, 1 / numDMs);
    geometricWeights[code] = geoMean;
    sumGeo += geoMean;
  });

  const normalizedWeights = {};
  criteriaCodes.forEach(code => {
    normalizedWeights[code] = parseFloat((geometricWeights[code] / sumGeo).toFixed(6));
  });

  return {
    numDecisionMakers: numDMs,
    geometricWeights,
    normalizedWeights
  };
}

module.exports = {
  CONSISTENCY_INDEX,
  solveSingleBWM,
  aggregateGeometricMean
};
