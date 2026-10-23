const { describe, it } = require('node:test');
const assert = require('node:assert');
const { solveSingleBWM, aggregateGeometricMean, CONSISTENCY_INDEX, EPSILON } = require('../algorithms/bwm');
const { ValidationError } = require('../utils/errors');

describe('BWM Algorithm Tests', () => {
  it('should correctly solve single BWM for Bab 3 dataset (DM 1: Sarmawaty Simanjuntak)', () => {
    const criteriaCodes = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9'];
    const bestCode = 'C1';
    const worstCode = 'C9';

    const bestToOthers = {
      C1: 1, C2: 2, C3: 5, C4: 5, C5: 4, C6: 3, C7: 4, C8: 3, C9: 7
    };
    const othersToWorst = {
      C1: 7, C2: 5, C3: 3, C4: 3, C5: 4, C6: 5, C7: 4, C8: 5, C9: 1
    };

    const result = solveSingleBWM(criteriaCodes, bestCode, worstCode, bestToOthers, othersToWorst);

    assert.ok(result.weights, 'Result should have weights');
    assert.strictEqual(result.aBW, 7, 'a_BW should be 7');
    assert.strictEqual(result.ci, CONSISTENCY_INDEX[7], 'CI should match CONSISTENCY_INDEX[7]');
    assert.strictEqual(result.ci, 3.73, 'CI for a_BW=7 is 3.73');
    
    // Consistency Ratio should be very small (CR <= 0.02) and satisfy CR <= 0.10
    assert.ok(result.consistencyRatio <= 0.02, `CR should be <= 0.02, got ${result.consistencyRatio}`);
    assert.strictEqual(result.isConsistent, true, 'Result should be consistent (CR <= 0.10)');

    // Check weights summation
    const totalWeight = Object.values(result.weights).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(totalWeight - 1.0) < 1e-4, 'Total weights should sum to 1.0');

    // Best criterion should have the highest weight
    assert.ok(result.weights.C1 > result.weights.C2, 'Best criterion C1 weight should be greater than C2');
    assert.ok(result.weights.C2 > result.weights.C9, 'C2 weight should be greater than worst C9');
  });

  it('should correctly verify all 3 Bab 3 Decision Makers have average CR ~0.0118', () => {
    const criteriaCodes = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9'];

    // DM 1
    const dm1 = solveSingleBWM(
      criteriaCodes, 'C1', 'C9',
      { C1: 1, C2: 2, C3: 5, C4: 5, C5: 4, C6: 3, C7: 4, C8: 3, C9: 7 },
      { C1: 7, C2: 5, C3: 3, C4: 3, C5: 4, C6: 5, C7: 4, C8: 5, C9: 1 }
    );

    // DM 2
    const dm2 = solveSingleBWM(
      criteriaCodes, 'C1', 'C9',
      { C1: 1, C2: 2, C3: 5, C4: 5, C5: 3, C6: 4, C7: 5, C8: 3, C9: 8 },
      { C1: 8, C2: 5, C3: 3, C4: 3, C5: 5, C6: 4, C7: 3, C8: 5, C9: 1 }
    );

    // DM 3
    const dm3 = solveSingleBWM(
      criteriaCodes, 'C1', 'C9',
      { C1: 1, C2: 2, C3: 6, C4: 6, C5: 4, C6: 2, C7: 4, C8: 2, C9: 7 },
      { C1: 7, C2: 6, C3: 3, C4: 3, C5: 4, C6: 6, C7: 4, C8: 6, C9: 1 }
    );

    assert.ok(dm1.isConsistent);
    assert.ok(dm2.isConsistent);
    assert.ok(dm3.isConsistent);

    const avgCR = (dm1.consistencyRatio + dm2.consistencyRatio + dm3.consistencyRatio) / 3;
    assert.ok(Math.abs(avgCR - 0.0118) < 0.001, `Average CR across 3 DMs should be ~0.0118, got ${avgCR.toFixed(4)}`);

    // Geometric Mean aggregation across 3 DMs
    const agg = aggregateGeometricMean(criteriaCodes, [dm1, dm2, dm3]);
    assert.strictEqual(agg.numDecisionMakers, 3);
    const sumAgg = Object.values(agg.normalizedWeights).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sumAgg - 1.0) < 1e-4);
  });

  it('should correctly solve Rezaei 3-criteria example', () => {
    // 3 criteria: C1 (Best), C3 (Worst)
    // aB = [1, 2, 4], aW = [4, 2, 1]
    const criteria = ['C1', 'C2', 'C3'];
    const res = solveSingleBWM(
      criteria,
      'C1',
      'C3',
      { C1: 1, C2: 2, C3: 4 },
      { C1: 4, C2: 2, C3: 1 }
    );

    assert.ok(res.isConsistent);
    assert.ok(res.weights.C1 > res.weights.C2);
    assert.ok(res.weights.C2 > res.weights.C3);
    const sum = res.weights.C1 + res.weights.C2 + res.weights.C3;
    assert.ok(Math.abs(sum - 1.0) < 1e-4);
  });

  it('should throw ValidationError on criteria < 2', () => {
    assert.throws(() => {
      solveSingleBWM(['C1'], 'C1', 'C1', { C1: 1 }, { C1: 1 });
    }, ValidationError);
  });

  it('should throw ValidationError on missing best or worst criteria', () => {
    assert.throws(() => {
      solveSingleBWM(['C1', 'C2'], '', 'C2', { C1: 1, C2: 2 }, { C1: 2, C2: 1 });
    }, ValidationError);
  });

  it('should throw ValidationError on invalid/empty comparison values', () => {
    assert.throws(() => {
      solveSingleBWM(['C1', 'C2', 'C3'], 'C1', 'C3', { C1: 1, C2: null, C3: 3 }, { C1: 3, C2: 2, C3: 1 });
    }, ValidationError);

    assert.throws(() => {
      solveSingleBWM(['C1', 'C2', 'C3'], 'C1', 'C3', { C1: 1, C2: 12, C3: 3 }, { C1: 3, C2: 2, C3: 1 });
    }, ValidationError);
  });
});
