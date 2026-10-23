const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { calculateWASPAS, applyQuota, EPSILON } = require('../algorithms/waspas');
const { ValidationError } = require('../utils/errors');

describe('WASPAS Algorithm Tests', () => {
  const bab3Path = path.join(__dirname, '..', 'data', 'database_demo_9crit.json');
  let bab3Data = null;
  if (fs.existsSync(bab3Path)) {
    bab3Data = JSON.parse(fs.readFileSync(bab3Path, 'utf-8'));
  }

  it('should correctly solve Bab 3 dataset (15 students, 9 criteria) with Rank 1 = A12 and Q = 0.5600', () => {
    assert.ok(bab3Data, 'Bab 3 dataset must exist');
    const { students, criteria } = bab3Data;

    const result = calculateWASPAS(students, criteria, 0.5, 6);

    assert.strictEqual(result.totalStudents, 15);
    assert.strictEqual(result.passedCount, 6);
    assert.strictEqual(result.backupCount, 9);

    // Rank 1 verification
    const rank1 = result.rankings[0];
    assert.strictEqual(rank1.id, 'std-bab3-12', 'Rank 1 must be A12 (Intan Permata Aritonang)');
    assert.ok(rank1.nama_lengkap.includes('A12'), 'Rank 1 name must contain A12');
    
    // Q score verification: Q ~ 0.5600
    assert.ok(
      Math.abs(rank1.waspasScore - 0.5600) < 0.001,
      `Rank 1 WASPAS score should be ~0.5600, got ${rank1.waspasScore}`
    );

    assert.strictEqual(rank1.quotaStatus, 'passed_quota');
    assert.strictEqual(rank1.rank, 1);

    // Rank 6 vs Rank 7 (Quota Boundary Check)
    const rank6 = result.rankings[5];
    const rank7 = result.rankings[6];
    assert.strictEqual(rank6.quotaStatus, 'passed_quota', 'Rank 6 should pass quota');
    assert.strictEqual(rank7.quotaStatus, 'backup_priority', 'Rank 7 should be backup priority');
    assert.strictEqual(rank7.statusLabel, 'Cadangan Prioritas #1');
  });

  it('should correctly apply quota allocation with applyQuota()', () => {
    const mockRankings = [
      { id: '1', waspasScore: 0.9 },
      { id: '2', waspasScore: 0.8 },
      { id: '3', waspasScore: 0.7 }
    ];

    applyQuota(mockRankings, 2);
    assert.strictEqual(mockRankings[0].rank, 1);
    assert.strictEqual(mockRankings[0].quotaStatus, 'passed_quota');
    assert.strictEqual(mockRankings[1].rank, 2);
    assert.strictEqual(mockRankings[1].quotaStatus, 'passed_quota');
    assert.strictEqual(mockRankings[2].rank, 3);
    assert.strictEqual(mockRankings[2].quotaStatus, 'backup_priority');
    assert.strictEqual(mockRankings[2].statusLabel, 'Cadangan Prioritas #1');
  });

  it('should throw ValidationError on empty alternatives', () => {
    assert.throws(() => {
      calculateWASPAS([], [{ code: 'C1', type: 'benefit', final_weight: 0.5 }, { code: 'C2', type: 'cost', final_weight: 0.5 }]);
    }, ValidationError);
  });

  it('should throw ValidationError on criteria < 2', () => {
    assert.throws(() => {
      calculateWASPAS([{ id: '1', values: { C1: 10 } }], [{ code: 'C1', type: 'benefit', final_weight: 1 }]);
    }, ValidationError);
  });

  it('should throw ValidationError when cost criterion has min value <= 0', () => {
    const invalidStudents = [
      { id: '1', nisn: '001', nama_lengkap: 'Siswa A', values: { C1: 0, C2: 50 } },
      { id: '2', nisn: '002', nama_lengkap: 'Siswa B', values: { C1: 10, C2: 60 } }
    ];
    const criteria = [
      { code: 'C1', name: 'Penghasilan', type: 'cost', final_weight: 0.5 },
      { code: 'C2', name: 'Nilai', type: 'benefit', final_weight: 0.5 }
    ];

    assert.throws(() => {
      calculateWASPAS(invalidStudents, criteria);
    }, ValidationError);
  });
});
