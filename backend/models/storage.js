const fs = require('fs');
const path = require('path');
const { AsyncLocalStorage } = require('async_hooks');
const {
  DEFAULT_CRITERIA,
  DEFAULT_DECISION_MAKERS,
  DEFAULT_USERS,
  generateRealisticStudents
} = require('../data/seed');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const DEMO_DB_FILE = path.join(DATA_DIR, 'database_demo.json');
const DEMO_6CRIT_FILE = path.join(DATA_DIR, 'database_demo_6crit.json');
const DEMO_9CRIT_FILE = path.join(DATA_DIR, 'database_demo_9crit.json');
const LIVE_DB_FILE = path.join(DATA_DIR, 'database_live.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const asyncLocalStorage = new AsyncLocalStorage();

function getCurrentMode() {
  const store = asyncLocalStorage.getStore();
  return (store && store.mode === 'demo') ? 'demo' : 'live';
}

function getDbFile(explicitMode) {
  const mode = explicitMode || getCurrentMode();
  return mode === 'demo' ? DEMO_DB_FILE : LIVE_DB_FILE;
}

function getExistingUsers() {
  try {
    for (const f of [LIVE_DB_FILE, DEMO_DB_FILE, DB_FILE]) {
      if (fs.existsSync(f)) {
        const d = JSON.parse(fs.readFileSync(f, 'utf-8'));
        if (d && Array.isArray(d.users) && d.users.length > 0) {
          return d.users;
        }
      }
    }
  } catch (e) {}
  return DEFAULT_USERS;
}

function initializeLiveDatabase() {
  const liveData = {
    period: {
      id: 'period-2026-live',
      name: 'Seleksi Penerimaan Bantuan PIP Tahun 2026',
      academic_year: '2026/2027',
      school_name: 'SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG',
      target_quota: 50,
      lambda: 0.5,
      is_locked: false,
      updated_at: new Date().toISOString()
    },
    users: getExistingUsers(),
    criteria: [],
    decision_makers: [],
    aggregated_weights: {},
    students: [],
    last_calculation: null
  };
  writeDatabase(liveData, 'live');
  return liveData;
}

function initializeDemoDatabase() {
  // If original rich database.json exists with students, seed demo from it
  if (fs.existsSync(DB_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (existing.students && existing.students.length > 0 && existing.criteria && existing.criteria.length > 0) {
        writeDatabase(existing, 'demo');
        return existing;
      }
    } catch (e) {}
  }

  // Fallback demo seed
  const demoData = {
    period: {
      id: 'period-2026-demo',
      name: 'Seleksi Penerimaan Bantuan PIP Tahun 2026 (Demo)',
      academic_year: '2026/2027',
      school_name: 'SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG',
      target_quota: 50,
      lambda: 0.5,
      is_locked: false,
      updated_at: new Date().toISOString()
    },
    users: getExistingUsers(),
    criteria: DEFAULT_CRITERIA,
    decision_makers: DEFAULT_DECISION_MAKERS,
    aggregated_weights: {
      C1: 0.2845,
      C2: 0.1782,
      C3: 0.1420,
      C4: 0.0890,
      C5: 0.2155,
      C6: 0.0908
    },
    students: generateRealisticStudents(120),
    last_calculation: null
  };
  writeDatabase(demoData, 'demo');
  return demoData;
}

function initializeDatabase(explicitMode) {
  const mode = explicitMode || getCurrentMode();
  return mode === 'demo' ? initializeDemoDatabase() : initializeLiveDatabase();
}

/**
 * Safe Database Reader with Disaster Recovery & Backup Restoration
 */
function readDatabase(explicitMode) {
  const file = getDbFile(explicitMode);
  const backupFile = `${file}.bak`;

  if (!fs.existsSync(file)) {
    // If main file is missing but backup exists, restore from backup
    if (fs.existsSync(backupFile)) {
      try {
        const backupRaw = fs.readFileSync(backupFile, 'utf-8');
        const backupData = JSON.parse(backupRaw);
        console.warn(`[STORAGE RESTORE] File utama ${path.basename(file)} tidak ditemukan, berhasil memulihkan dari backup.`);
        writeDatabase(backupData, explicitMode);
        return backupData;
      } catch (e) {
        console.error('[STORAGE ERROR] File backup rusak:', e.message);
      }
    }
    return initializeDatabase(explicitMode);
  }

  try {
    const raw = fs.readFileSync(file, 'utf-8');
    const data = JSON.parse(raw);
    if (!data.users || data.users.length === 0) {
      data.users = getExistingUsers();
      writeDatabase(data, explicitMode);
    }
    return data;
  } catch (err) {
    console.error(`[CRITICAL STORAGE ERROR] Database file ${path.basename(file)} corrupt:`, err.message);

    // 1. Quarantining corrupted file so data is NEVER permanently lost
    const corruptFile = `${file}.corrupt-${Date.now()}.json`;
    try {
      fs.copyFileSync(file, corruptFile);
      console.warn(`[QUARANTINE] File rusak telah diamankan ke: ${path.basename(corruptFile)}`);
    } catch (e) {
      console.error('[QUARANTINE FAILED]', e.message);
    }

    // 2. Attempt restoration from .bak
    if (fs.existsSync(backupFile)) {
      try {
        const backupRaw = fs.readFileSync(backupFile, 'utf-8');
        const backupData = JSON.parse(backupRaw);
        console.warn(`[RECOVERY SUCCESS] Berhasil memulihkan database dari ${path.basename(backupFile)}`);
        writeDatabase(backupData, explicitMode);
        return backupData;
      } catch (restoreErr) {
        console.error('[RECOVERY FAILED] Backup juga rusak:', restoreErr.message);
      }
    }

    // 3. Fallback: initialize fresh and report
    console.warn('[STORAGE] Menginisialisasi ulang database aman karena tidak ada backup yang valid.');
    return initializeDatabase(explicitMode);
  }
}

/**
 * Atomic Safe Database Writer with Automatic Backup Rotation
 */
function writeDatabase(data, explicitMode) {
  const file = getDbFile(explicitMode);
  const tempFile = `${file}.tmp.${Date.now()}`;
  const backupFile = `${file}.bak`;
  const content = JSON.stringify(data, null, 2);

  try {
    // 1. Write to temporary file first
    fs.writeFileSync(tempFile, content, 'utf-8');

    // 2. Maintain backup of the existing file if it exists and is valid
    if (fs.existsSync(file)) {
      try {
        fs.copyFileSync(file, backupFile);
      } catch (backupErr) {
        // Non-blocking warning if backup copy fails
        console.warn('[STORAGE] Gagal memperbarui backup:', backupErr.message);
      }
    }

    // 3. Atomic rename (replaces target file instantly)
    fs.renameSync(tempFile, file);
  } catch (err) {
    // Clean up temporary file if write or rename failed
    if (fs.existsSync(tempFile)) {
      try { fs.unlinkSync(tempFile); } catch (e) {}
    }
    throw new Error(`Gagal menyimpan database atomik ke disk: ${err.message}`);
  }

  return data;
}

function switchDemoDataset(datasetType) {
  if (datasetType === 'bab3_9crit') {
    if (fs.existsSync(DEMO_9CRIT_FILE)) {
      const data = JSON.parse(fs.readFileSync(DEMO_9CRIT_FILE, 'utf-8'));
      data.active_demo_dataset = 'bab3_9crit';
      writeDatabase(data, 'demo');
      return data;
    }
  } else {
    if (fs.existsSync(DEMO_6CRIT_FILE)) {
      const data = JSON.parse(fs.readFileSync(DEMO_6CRIT_FILE, 'utf-8'));
      data.active_demo_dataset = 'default_6crit';
      writeDatabase(data, 'demo');
      return data;
    }
  }
  return readDatabase('demo');
}

function getActiveDemoDataset() {
  try {
    if (fs.existsSync(DEMO_DB_FILE)) {
      const d = JSON.parse(fs.readFileSync(DEMO_DB_FILE, 'utf-8'));
      if (d.active_demo_dataset) return d.active_demo_dataset;
      if (d.criteria && d.criteria.length === 9) return 'bab3_9crit';
    }
  } catch (e) {}
  return 'default_6crit';
}

module.exports = {
  readDatabase,
  writeDatabase,
  initializeDatabase,
  initializeDemoDatabase,
  initializeLiveDatabase,
  switchDemoDataset,
  getActiveDemoDataset,
  generateRealisticStudents,
  DEFAULT_CRITERIA,
  DEFAULT_DECISION_MAKERS,
  DEFAULT_USERS,
  asyncLocalStorage,
  getCurrentMode
};
