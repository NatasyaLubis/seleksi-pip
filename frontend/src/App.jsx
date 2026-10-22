import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import CriteriaView from './components/CriteriaView';
import BwmView from './components/BwmView';
import StudentsView from './components/StudentsView';
import WaspasView from './components/WaspasView';
import ReportView from './components/ReportView';
import UsersView from './components/UsersView';
import LoginModal from './components/LoginModal';
import LandingPage from './components/LandingPage';
import { api, authStorage, modeStorage } from './services/api';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Menu,
  Lock,
  SunMedium,
  Moon,
  Sparkles,
  RotateCcw,
  Database
} from 'lucide-react';

const VALID_TABS = ['dashboard', 'criteria', 'bwm', 'students', 'waspas', 'report', 'users'];

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    // 1. Check URL hash (e.g. #students, #report)
    const hash = window.location.hash.replace(/^#\/?/, '').trim();
    if (hash && VALID_TABS.includes(hash)) {
      return hash;
    }
    // 2. Check localStorage
    const saved = localStorage.getItem('pip_spk_active_tab');
    if (saved && VALID_TABS.includes(saved)) {
      return saved;
    }
    return 'dashboard';
  });

  const [period, setPeriod] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [aggregatedWeights, setAggregatedWeights] = useState({});
  const [decisionMakers, setDecisionMakers] = useState([]);
  const [students, setStudents] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [lastCalculation, setLastCalculation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Responsive & Mobile Sidebar
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Theme Mode: Light or Dark (tanpa mode otomatis)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('pip_spk_theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return false;
  });

  // User Auth State & System Mode
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [systemMode, setSystemMode] = useState(() => modeStorage.getMode());
  const isDemoMode = systemMode === 'demo';
  const [activeDemoDataset, setActiveDemoDataset] = useState('default_6crit');

  // Sync activeTab to localStorage & URL hash so refresh always stays on the current page
  useEffect(() => {
    if (VALID_TABS.includes(activeTab)) {
      localStorage.setItem('pip_spk_active_tab', activeTab);
      if (window.location.hash.replace(/^#\/?/, '') !== activeTab) {
        window.history.replaceState(null, '', `#${activeTab}`);
      }
    }
  }, [activeTab]);

  // Listen to browser Back / Forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (hash && VALID_TABS.includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('change', handleHashChange);
  }, []);

  // Sync Dark/Light class on <html> & persist to localStorage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('pip_spk_theme', darkMode ? 'dark' : 'light');
    localStorage.removeItem('pip_spk_theme_mode');
  }, [darkMode]);

  // Direct toggle between Mode Terang and Mode Gelap
  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      showToast(`Mode tampilan diubah: ${next ? 'Mode Gelap' : 'Mode Terang'}`);
      return next;
    });
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Check auth and verify session token
  const initAuth = async () => {
    try {
      const token = authStorage.getToken();
      if (token) {
        const meRes = await api.getMe();
        if (meRes.success && meRes.user) {
          setCurrentUser(meRes.user);
          return;
        } else {
          authStorage.removeToken();
        }
      }
    } catch (err) {
      authStorage.removeToken();
      console.warn('Auth init note:', err.message);
    }
  };

  const handleLoginSubmit = async (username, password, mode = 'live') => {
    modeStorage.setMode(mode);
    setSystemMode(mode);
    const res = await api.login(username, password, mode);
    if (res.success) {
      setCurrentUser(res.user);
      showToast(`Selamat datang, ${res.user.full_name}! ${mode === 'demo' ? '(Mode Demo)' : '(Mode Data Mandiri)'}`);
      await loadAllData();
    }
    return res;
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    showToast('Anda telah keluar dari sesi sistem.');
  };

  const loadUsers = async () => {
    try {
      const res = await api.getUsers();
      if (res.success && Array.isArray(res.data)) {
        setUsersList(res.data);
      }
    } catch (err) {
      console.warn('Could not load users:', err.message);
    }
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [statusRes, critRes, dmRes, stdRes] = await Promise.all([
        api.getCalculationStatus(),
        api.getCriteria(),
        api.getDecisionMakers(),
        api.getStudents()
      ]);

      if (statusRes.success) {
        setPeriod(statusRes.period);
        setLastCalculation(statusRes.lastCalculation);
        if (statusRes.activeDemoDataset) {
          setActiveDemoDataset(statusRes.activeDemoDataset);
        }
      }

      if (critRes.success) {
        setCriteria(critRes.data);
        setAggregatedWeights(critRes.aggregatedWeights || {});
      }

      if (dmRes.success) {
        setDecisionMakers(dmRes.data);
      }

      if (stdRes.success) {
        setStudents(stdRes.data);
      }

      // Also load user list
      await loadUsers();
    } catch (err) {
      console.error('Failed to load initial data:', err);
      showToast('Gagal terhubung ke server backend: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchDemoDataset = async (datasetType) => {
    setIsLoading(true);
    try {
      const res = await api.switchDemoDataset(datasetType);
      if (res.success) {
        setActiveDemoDataset(datasetType);
        showToast(res.message);
        await loadAllData();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth().then(() => loadAllData());
  }, []);

  // Criteria Handlers
  const handleAddCriterion = async (payload) => {
    try {
      const res = await api.createCriterion(payload);
      if (res.success) {
        showToast(res.message);
        await loadAllData();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateCriterion = async (id, payload) => {
    try {
      const res = await api.updateCriterion(id, payload);
      if (res.success) {
        showToast(res.message);
        await loadAllData();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteCriterion = async (id, code, name) => {
    if (!window.confirm(`Yakin ingin menghapus kriteria ${code} (${name})?`)) return;
    try {
      const res = await api.deleteCriterion(id);
      if (res.success) {
        showToast(res.message);
        await loadAllData();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Decision Maker & BWM Handlers
  const handleAddDM = async (payload) => {
    try {
      const res = await api.createDecisionMaker(payload);
      if (res.success) {
        showToast(res.message);
        await loadAllData();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateDM = async (id, payload) => {
    try {
      const res = await api.updateDecisionMaker(id, payload);
      if (res.success) {
        showToast(res.message);
        await loadAllData();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteDM = async (id, name) => {
    if (!window.confirm(`Yakin ingin menghapus penilai ${name}?`)) return;
    try {
      const res = await api.deleteDecisionMaker(id);
      if (res.success) {
        showToast(res.message);
        await loadAllData();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSubmitBWMEvaluation = async (id, evalData) => {
    try {
      const res = await api.submitBWMEvaluation(id, evalData);
      if (res.success) {
        showToast(res.message, res.data.isConsistent ? 'success' : 'error');
        await loadAllData();
        return res;
      } else {
        showToast(res.message, 'error');
        return res;
      }
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleAggregateWeights = async () => {
    try {
      const res = await api.aggregateWeights();
      if (res.success) {
        showToast(res.message);
        await loadAllData();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Student Handlers
  const handleAddStudent = async (payload) => {
    try {
      const res = await api.createStudent(payload);
      if (res.success) {
        showToast(res.message);
        await loadAllData();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateStudent = async (id, payload) => {
    try {
      const res = await api.updateStudent(id, payload);
      if (res.success) {
        showToast(res.message);
        await loadAllData();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Yakin ingin menghapus siswa ${name}?`)) return;
    try {
      const res = await api.deleteStudent(id);
      if (res.success) {
        showToast(res.message);
        await loadAllData();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleClearAllStudents = async () => {
    if (!window.confirm('PERINGATAN: Yakin ingin mengosongkan SELURUH data alternatif siswa? Tindakan ini tidak dapat dibatalkan.')) return;
    try {
      const res = await api.clearAllStudents();
      if (res.success) {
        showToast(res.message);
        await loadAllData();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleGenerateSamples = async (count = 120) => {
    try {
      const res = await api.generateSamples(count);
      if (res.success) {
        showToast(res.message);
        await loadAllData();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDownloadTemplate = () => {
    window.open(api.getTemplateUrl(), '_blank');
  };

  const handlePreviewImport = async (file) => {
    return api.previewImport(file);
  };

  const handleCommitImport = async (studentsList, mode) => {
    const res = await api.commitImport(studentsList, mode);
    if (res.success) {
      showToast(res.message);
      await loadAllData();
    } else {
      showToast(res.message, 'error');
    }
    return res;
  };

  // Calculation Handlers
  const handleRunWASPAS = async (quota, lambda) => {
    try {
      const res = await api.runWASPAS(quota, lambda);
      if (res.success) {
        setLastCalculation(res.data);
        showToast(res.message);
        await loadAllData();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdatePeriod = async (payload) => {
    try {
      const res = await api.updatePeriod(payload);
      if (res.success) {
        setPeriod(res.data);
        if (res.calculation) {
          setLastCalculation(res.calculation);
        }
        showToast(res.message);
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // User Management Handlers (Managed by Operator & Superadmin)
  const handleAddUser = async (payload) => {
    try {
      const res = await api.createUser(payload);
      if (res.success) {
        showToast(res.message);
        await loadUsers();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateUser = async (id, payload) => {
    try {
      const res = await api.updateUser(id, payload);
      if (res.success) {
        showToast(res.message);
        await loadUsers();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`Yakin ingin menghapus akun pengguna "${username}"?`)) return;
    try {
      const res = await api.deleteUser(id);
      if (res.success) {
        showToast(res.message);
        await loadUsers();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleExportExcel = () => {
    window.open(api.getExportExcelUrl(), '_blank');
  };

  const handleResetDefault = async () => {
    if (!window.confirm('Reset database ke data simulasi bawaan (6 kriteria, 3 penilai terverifikasi, 120 siswa)?')) return;
    try {
      const res = await api.resetToDefault();
      if (res.success) {
        showToast(res.message);
        await loadAllData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // If unauthenticated, show the educational Landing Page with the SPK Workflow
  if (!currentUser) {
    return (
      <>
        {/* Toast Notification (Diletakkan di bagian bawah agar tidak menutupi navbar) */}
        {toast && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderRadius: '10px',
            background: toast.type === 'error' ? 'hsl(var(--destructive))' : 'hsl(var(--success))',
            color: toast.type === 'error' ? 'hsl(var(--destructive-foreground))' : 'hsl(var(--success-foreground))',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
            fontSize: '0.875rem',
            fontWeight: 600,
            maxWidth: 'calc(100vw - 48px)',
            animation: 'toastInBottom 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{toast.message}</span>
          </div>
        )}
        <LandingPage
          onLogin={handleLoginSubmit}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />
      </>
    );
  }

  return (
    <div className="app-container">
      {/* Toast Notification (Diletakkan di bagian bawah) */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 18px',
          borderRadius: '10px',
          background: toast.type === 'error' ? 'hsl(var(--destructive))' : 'hsl(var(--success))',
          color: toast.type === 'error' ? 'hsl(var(--destructive-foreground))' : 'hsl(var(--success-foreground))',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
          fontSize: '0.875rem',
          fontWeight: 600,
          maxWidth: 'calc(100vw - 48px)',
          animation: 'toastInBottom 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay ${isOpenMobile ? 'active' : ''}`}
        onClick={() => setIsOpenMobile(false)}
      />

      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        period={period}
        totalStudents={students.length}
        lastCalculation={lastCalculation}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        currentUser={currentUser}
        isDemoMode={isDemoMode}
        activeDemoDataset={activeDemoDataset}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onResetDefault={handleResetDefault}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
      />

      {/* Main Content View */}
      <div className="app-main">
        {/* Mobile Topbar */}
        <header className="mobile-topbar no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setIsOpenMobile(true)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '6px' }}
            >
              <Menu size={20} />
            </button>
            <img
              src="https://pip.kemendikdasmen.go.id/v1/img/home/logo-kemdikbud.png"
              alt="Logo Kemendikdasmen"
              style={{ width: '28px', height: '28px', objectFit: 'contain' }}
            />
            <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>SPK PIP</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={toggleDarkMode}
              className="btn btn-ghost btn-sm"
              style={{ padding: '6px' }}
              title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              aria-label={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            >
              {darkMode ? (
                <SunMedium size={18} strokeWidth={2.4} color="#f8fafc" />
              ) : (
                <Moon size={18} strokeWidth={2.2} color="#6366f1" />
              )}
            </button>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="btn btn-outline btn-sm"
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            >
              <Lock size={12} />
              <span>{currentUser ? currentUser.username : 'Login'}</span>
            </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="app-content-body">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'hsl(var(--muted-foreground))' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Memuat data sistem seleksi PIP...</span>
            </div>
          ) : (
            <>
              {/* Demo Mode Dataset Switcher Banner */}
              {isDemoMode && (
                <div style={{
                  marginBottom: '20px',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: activeDemoDataset === 'bab3_9crit' 
                    ? 'linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--card)))' 
                    : 'hsl(var(--card))',
                  border: '1px solid ' + (activeDemoDataset === 'bab3_9crit' ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '9px',
                      background: 'hsl(var(--primary) / 0.15)',
                      color: 'hsl(var(--primary))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Database size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                          {activeDemoDataset === 'bab3_9crit' 
                            ? 'Dataset Aktif: Proposal Bab 3 (9 Kriteria, 15 Siswa)' 
                            : 'Dataset Aktif: Bawaan Sistem (6 Kriteria, 120 Siswa)'}
                        </span>
                        <span className="badge badge-primary" style={{ fontSize: '0.6875rem', padding: '2px 7px' }}>
                          Mode Demo
                        </span>
                      </div>
                      <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                        {activeDemoDataset === 'bab3_9crit'
                          ? 'Kriteria C1–C9, 3 Penilai (Kepsek, Wakepsek, Kesiswaan), 15 Alternatif Siswa sesuai berkas Proposal Bab 3.'
                          : 'Simulasi riset bawaan sistem dengan 120 sampel siswa dan 6 kriteria umum.'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {activeDemoDataset === 'bab3_9crit' ? (
                      <button
                        onClick={() => handleSwitchDemoDataset('default_6crit')}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <RotateCcw size={13} />
                        <span>Kembali ke Data 120 Siswa (6 Kriteria)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSwitchDemoDataset('bab3_9crit')}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Sparkles size={13} />
                        <span>Gunakan Data Proposal Bab 3 (9 Kriteria)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'dashboard' && (
                <DashboardView
                  period={period}
                  totalStudents={students.length}
                  criteria={criteria}
                  decisionMakers={decisionMakers}
                  lastCalculation={lastCalculation}
                  setActiveTab={setActiveTab}
                  onUpdateQuota={(q) => handleUpdatePeriod({ target_quota: q })}
                  onUpdatePeriod={handleUpdatePeriod}
                  onRunWASPAS={handleRunWASPAS}
                  onExportExcel={handleExportExcel}
                />
              )}

              {activeTab === 'criteria' && (
                <CriteriaView
                  criteria={criteria}
                  onAddCriterion={handleAddCriterion}
                  onUpdateCriterion={handleUpdateCriterion}
                  onDeleteCriterion={handleDeleteCriterion}
                />
              )}

              {activeTab === 'bwm' && (
                <BwmView
                  decisionMakers={decisionMakers}
                  criteria={criteria}
                  aggregatedWeights={aggregatedWeights}
                  onAddDM={handleAddDM}
                  onUpdateDM={handleUpdateDM}
                  onDeleteDM={handleDeleteDM}
                  onSubmitEvaluation={handleSubmitBWMEvaluation}
                  onAggregate={handleAggregateWeights}
                />
              )}

              {activeTab === 'students' && (
                <StudentsView
                  students={students}
                  criteria={criteria}
                  isDemoMode={isDemoMode}
                  onAddStudent={handleAddStudent}
                  onUpdateStudent={handleUpdateStudent}
                  onDeleteStudent={handleDeleteStudent}
                  onClearAll={handleClearAllStudents}
                  onGenerateSamples={handleGenerateSamples}
                  onDownloadTemplate={handleDownloadTemplate}
                  onPreviewImport={handlePreviewImport}
                  onCommitImport={handleCommitImport}
                />
              )}

              {activeTab === 'waspas' && (
                <WaspasView
                  calculation={lastCalculation}
                  period={period}
                  criteria={criteria}
                  onRunWASPAS={handleRunWASPAS}
                  onUpdatePeriod={handleUpdatePeriod}
                  onExportExcel={handleExportExcel}
                />
              )}

              {activeTab === 'report' && (
                <ReportView
                  calculation={lastCalculation}
                  period={period}
                  decisionMakers={decisionMakers}
                  criteria={criteria}
                  onExportExcel={handleExportExcel}
                />
              )}

              {activeTab === 'users' && !isDemoMode && (
                <UsersView
                  users={usersList}
                  currentUser={currentUser}
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                  onRefreshUsers={loadUsers}
                />
              )}
            </>
          )}
        </main>

        {/* Minimal Footer */}
        <footer className="no-print" style={{ borderTop: '1px solid hsl(var(--border))', padding: '14px 28px', background: 'transparent', textAlign: 'center', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: 'auto' }}>
          Sistem Pendukung Keputusan Seleksi Bantuan PIP
        </footer>
      </div>

      {/* Security & Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(u, p) => handleLoginSubmit(u, p, systemMode)}
        currentUser={currentUser}
      />
    </div>
  );
}
