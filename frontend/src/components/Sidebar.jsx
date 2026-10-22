import React from 'react';
import { 
  Award, 
  BarChart3, 
  Users, 
  Sliders, 
  Printer, 
  ShieldCheck, 
  RotateCcw,
  SunMedium,
  Moon,
  LogOut,
  X,
  UserCog
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  totalStudents, 
  lastCalculation, 
  period,
  darkMode,
  toggleDarkMode,
  currentUser,
  onLogout,
  onResetDefault,
  isOpenMobile,
  setIsOpenMobile,
  isDemoMode,
  activeDemoDataset
}) {
  const isOperatorOrAdmin = currentUser && ['operator', 'superadmin', 'admin'].includes(currentUser.role);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'criteria', label: 'Kriteria Seleksi', icon: Sliders },
    { id: 'bwm', label: 'Penilaian Tim (BWM)', icon: ShieldCheck },
    { id: 'students', label: 'Data Siswa', count: totalStudents, icon: Users },
    { id: 'waspas', label: 'Hasil Rangking (WASPAS)', icon: Award },
    { id: 'report', label: 'Cetak Berita Acara', icon: Printer },
    ...((isOperatorOrAdmin && !isDemoMode) ? [{ id: 'users', label: 'Kelola Pengguna', icon: UserCog }] : [])
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (setIsOpenMobile) setIsOpenMobile(false);
  };

  return (
    <aside className={`app-sidebar ${isOpenMobile ? 'sidebar-open' : ''}`}>
      {/* Brand & Logo Header */}
      <div style={{ padding: '18px 16px', borderBottom: '1px solid hsl(var(--sidebar-border))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src="https://pip.kemendikdasmen.go.id/v1/img/home/logo-kemdikbud.png" 
              alt="Logo Kemendikdasmen" 
              style={{ width: '38px', height: '38px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.04em', color: 'hsl(var(--primary))', textTransform: 'uppercase' }}>
                KEMENDIKDASMEN
              </span>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'hsl(var(--sidebar-foreground))', lineHeight: 1.2 }}>
                Seleksi Bantuan PIP
              </h2>
              <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))' }}>
                SMKS Dharma Bhakti
              </span>
            </div>
          </div>

          {isOpenMobile && (
            <button 
              onClick={() => setIsOpenMobile(false)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '4px' }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Target Period & Quota Summary Pill */}
      {period && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid hsl(var(--sidebar-border))', background: 'hsl(var(--muted) / 0.35)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
            <span style={{ color: 'hsl(var(--muted-foreground))' }}>Kuota Bantuan:</span>
            <span style={{ fontWeight: 700, color: 'hsl(var(--primary))' }}>{period.target_quota} Siswa</span>
          </div>
          {lastCalculation && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginTop: '4px' }}>
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>Terpilih:</span>
              <span style={{ fontWeight: 700, color: 'hsl(var(--success))' }}>
                {lastCalculation.passedCount} dari {lastCalculation.quota} ({lastCalculation.quotaFulfillmentPercentage}%)
              </span>
            </div>
          )}
          {isDemoMode && (
            <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed hsl(var(--sidebar-border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6875rem' }}>
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>Dataset:</span>
              <span style={{ fontWeight: 700, color: activeDemoDataset === 'bab3_9crit' ? 'hsl(var(--primary))' : 'hsl(var(--sidebar-foreground))' }}>
                {activeDemoDataset === 'bab3_9crit' ? 'Proposal Bab 3 (9 Kriteria)' : 'Bawaan (6 Kriteria)'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto' }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--muted-foreground))', padding: '0 8px', marginBottom: '4px' }}>
          Menu Pilihan
        </span>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: 'var(--radius)',
                border: 'none',
                background: isActive ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--sidebar-foreground))',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'hsl(var(--accent))';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={17} color={isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && (
                <span style={{ 
                  fontSize: '0.6875rem', 
                  fontWeight: 700, 
                  padding: '1px 6px', 
                  borderRadius: '9999px',
                  background: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                  color: isActive ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))'
                }}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid hsl(var(--sidebar-border))', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Dark/Light Mode Selector: Pure icon toggle without background box */}
        <div
          onClick={toggleDarkMode}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 2px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
          title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          aria-label={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
        >
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
            Tampilan:
          </span>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {darkMode ? (
              <SunMedium size={18} strokeWidth={2.4} color="#f8fafc" />
            ) : (
              <Moon size={18} strokeWidth={2.2} color="#6366f1" />
            )}
          </div>
        </div>

        {/* User Profile & Logout */}
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 'var(--radius)', background: 'hsl(var(--muted) / 0.3)' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--sidebar-foreground))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.full_name || currentUser.username}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))' }}>
                {currentUser.role === 'pengambil_keputusan' ? 'Pengambil Keputusan' : currentUser.role === 'operator' ? 'Operator PIP' : currentUser.title || 'Petugas'}
              </div>
            </div>
            <button 
              onClick={onLogout} 
              className="btn btn-ghost btn-sm" 
              style={{ padding: '4px 6px', color: 'hsl(var(--destructive))', display: 'flex', alignItems: 'center', gap: '3px' }}
              title="Keluar dari akun"
            >
              <LogOut size={13} />
              <span style={{ fontSize: '0.6875rem', fontWeight: 600 }}>Keluar</span>
            </button>
          </div>
        )}

        {/* Reset Default - Hanya tampil di Mode Demo */}
        {isDemoMode && (
          <button 
            onClick={onResetDefault}
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', justifyContent: 'flex-start', padding: '4px 6px' }}
            title="Kembalikan data ke awal (6 kriteria, 3 penilai, 120 siswa)"
          >
            <RotateCcw size={12} />
            <span>Reset Data Awal (Demo)</span>
          </button>
        )}
      </div>
    </aside>
  );
}
