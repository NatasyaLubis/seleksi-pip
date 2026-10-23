const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const TOKEN_KEY = 'spk_pip_jwt_token';
const SYSTEM_MODE_KEY = 'spk_pip_system_mode';

export const modeStorage = {
  getMode: () => localStorage.getItem(SYSTEM_MODE_KEY) || 'live',
  setMode: (mode) => localStorage.setItem(SYSTEM_MODE_KEY, mode || 'live'),
  isDemo: () => (localStorage.getItem(SYSTEM_MODE_KEY) || 'live') === 'demo'
};

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY)
};

// Helper fetch with Authorization Bearer header and System-Mode header
async function secureFetch(url, options = {}) {
  const token = authStorage.getToken();
  const mode = modeStorage.getMode();
  const headers = { ...options.headers };

  headers['X-System-Mode'] = mode;

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is FormData, don't set Content-Type header (browser sets boundary)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers });
  return res.json();
}

/**
 * Downloads file securely via fetch + Blob with Authorization header
 * @param {string} url 
 * @param {string} defaultFilename 
 */
async function downloadBlob(url, defaultFilename) {
  const token = authStorage.getToken();
  const mode = modeStorage.getMode();
  const headers = {
    'X-System-Mode': mode
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    let msg = 'Gagal mengunduh file dari server.';
    try {
      const errJson = await res.json();
      if (errJson && errJson.message) msg = errJson.message;
    } catch (e) {}
    throw new Error(msg);
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(blobUrl);
}

export const api = {
  // Auth & Security
  login: async (username, password, mode) => {
    const targetMode = mode || modeStorage.getMode();
    modeStorage.setMode(targetMode);
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-System-Mode': targetMode
      },
      body: JSON.stringify({ username, password, mode: targetMode })
    });
    const data = await res.json();
    if (data.success && data.token) {
      authStorage.setToken(data.token);
    }
    return data;
  },

  getMe: async () => {
    return secureFetch(`${API_BASE}/auth/me`);
  },

  changePassword: async (currentPassword, newPassword) => {
    return secureFetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  logout: () => {
    authStorage.removeToken();
  },

  // User Management
  getUsers: async () => {
    return secureFetch(`${API_BASE}/auth/users`);
  },
  createUser: async (data) => {
    return secureFetch(`${API_BASE}/auth/users`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateUser: async (id, data) => {
    return secureFetch(`${API_BASE}/auth/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  deleteUser: async (id) => {
    return secureFetch(`${API_BASE}/auth/users/${id}`, {
      method: 'DELETE'
    });
  },

  // Health
  checkHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Criteria
  getCriteria: async () => {
    return secureFetch(`${API_BASE}/criteria`);
  },
  createCriterion: async (data) => {
    return secureFetch(`${API_BASE}/criteria`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateCriterion: async (id, data) => {
    return secureFetch(`${API_BASE}/criteria/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  deleteCriterion: async (id) => {
    return secureFetch(`${API_BASE}/criteria/${id}`, {
      method: 'DELETE'
    });
  },

  // Decision Makers & BWM
  getDecisionMakers: async () => {
    return secureFetch(`${API_BASE}/decision-makers`);
  },
  createDecisionMaker: async (data) => {
    return secureFetch(`${API_BASE}/decision-makers`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateDecisionMaker: async (id, data) => {
    return secureFetch(`${API_BASE}/decision-makers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  deleteDecisionMaker: async (id) => {
    return secureFetch(`${API_BASE}/decision-makers/${id}`, {
      method: 'DELETE'
    });
  },
  submitBWMEvaluation: async (id, evalData) => {
    return secureFetch(`${API_BASE}/decision-makers/${id}/evaluate`, {
      method: 'POST',
      body: JSON.stringify(evalData)
    });
  },
  previewBWM: async (previewData) => {
    return secureFetch(`${API_BASE}/decision-makers/preview`, {
      method: 'POST',
      body: JSON.stringify(previewData)
    });
  },
  aggregateWeights: async () => {
    return secureFetch(`${API_BASE}/decision-makers/aggregate`, {
      method: 'POST'
    });
  },

  // Students & Excel Import
  getStudents: async () => {
    return secureFetch(`${API_BASE}/students`);
  },
  createStudent: async (data) => {
    return secureFetch(`${API_BASE}/students`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateStudent: async (id, data) => {
    return secureFetch(`${API_BASE}/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  deleteStudent: async (id) => {
    return secureFetch(`${API_BASE}/students/${id}`, {
      method: 'DELETE'
    });
  },
  clearAllStudents: async () => {
    return secureFetch(`${API_BASE}/students`, {
      method: 'DELETE'
    });
  },
  generateSamples: async (count = 120) => {
    return secureFetch(`${API_BASE}/students/generate-samples`, {
      method: 'POST',
      body: JSON.stringify({ count })
    });
  },
  downloadTemplate: async () => {
    return downloadBlob(`${API_BASE}/students/download-template`, 'Template_Import_Siswa_PIP.xlsx');
  },
  getTemplateUrl: () => {
    const token = authStorage.getToken();
    return `${API_BASE}/students/download-template?system_mode=${modeStorage.getMode()}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
  },
  previewImport: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return secureFetch(`${API_BASE}/students/import-preview`, {
      method: 'POST',
      body: formData
    });
  },
  commitImport: async (students, mode = 'replace') => {
    return secureFetch(`${API_BASE}/students/import-commit`, {
      method: 'POST',
      body: JSON.stringify({ students, mode })
    });
  },

  // Calculation & Period
  getCalculationStatus: async () => {
    return secureFetch(`${API_BASE}/calculation/status`);
  },
  runWASPAS: async (quota, lambda) => {
    return secureFetch(`${API_BASE}/calculation/run`, {
      method: 'POST',
      body: JSON.stringify({ quota, lambda })
    });
  },
  updatePeriod: async (data) => {
    return secureFetch(`${API_BASE}/calculation/period`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  downloadExportExcel: async () => {
    return downloadBlob(`${API_BASE}/calculation/export-excel`, 'Hasil_Perankingan_WASPAS_PIP.xlsx');
  },
  getExportExcelUrl: () => {
    const token = authStorage.getToken();
    return `${API_BASE}/calculation/export-excel?system_mode=${modeStorage.getMode()}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
  },
  resetToDefault: async () => {
    return secureFetch(`${API_BASE}/calculation/reset-default`, {
      method: 'POST'
    });
  },
  getDemoDataset: async () => {
    return secureFetch(`${API_BASE}/calculation/demo-dataset`);
  },
  switchDemoDataset: async (datasetType) => {
    return secureFetch(`${API_BASE}/calculation/switch-demo-dataset`, {
      method: 'POST',
      body: JSON.stringify({ datasetType })
    });
  }
};
