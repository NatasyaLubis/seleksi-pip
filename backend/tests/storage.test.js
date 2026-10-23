const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { readDatabase, writeDatabase, asyncLocalStorage } = require('../models/storage');

describe('Storage Atomic & Recovery Tests', () => {
  it('should safely write and read back data atomically', () => {
    asyncLocalStorage.run({ mode: 'live' }, () => {
      const db = readDatabase('live');
      assert.ok(db.period, 'Period should exist');
      
      const prevUpdate = db.period.updated_at;
      db.period.test_field = 'atomic_val';
      writeDatabase(db, 'live');

      const reloaded = readDatabase('live');
      assert.strictEqual(reloaded.period.test_field, 'atomic_val');

      // Cleanup test field
      delete reloaded.period.test_field;
      writeDatabase(reloaded, 'live');
    });
  });

  it('should create a .bak backup file after write', () => {
    const liveDbFile = path.join(__dirname, '..', 'data', 'database_live.json');
    const liveBakFile = `${liveDbFile}.bak`;
    assert.ok(fs.existsSync(liveBakFile), 'Backup file database_live.json.bak should exist');
  });
});
