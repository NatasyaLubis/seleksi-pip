import React from 'react';
import { 
  Award, 
  BarChart3, 
  Users, 
  Sliders, 
  FileSpreadsheet, 
  Printer, 
  RotateCcw,
  ShieldCheck
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, period, onResetDefault, totalStudents, lastCalculation }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard Kuota', icon: BarChart3 },
    { id: 'criteria', label: 'Kriteria & Skala', icon: Sliders },
    { id: 'bwm', label: 'Pembobotan BWM (Pakar)', icon: ShieldCheck },
    { id: 'students', label: `Data Siswa (${totalStudents})`, icon: Users },
    { id: 'waspas', label: 'Perangkingan WASPAS', icon: Award },
    { id: 'report', label: 'Berita Acara & Cetak', icon: Printer }
  ];

  return (
    <header className="no-print" style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', color: 'white' }}>
      {/* Top Branding Bar */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(79, 70, 229, 0.35)'
          }}>
            <Award size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                SPK SELEKSI BANTUAN PIP
              </h1>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#312e81', color: '#c7d2fe' }}>
                BWM + WASPAS
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '2px' }}>
              {period ? period.name : 'Sistem Penunjang Keputusan Prioritas Penerima Bantuan'}
            </p>
          </div>
        </div>

        {/* Action badges & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {period && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e293b', padding: '6px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Target Kuota:</span>
              <strong style={{ fontSize: '0.875rem', color: '#38bdf8' }}>{period.target_quota} Siswa</strong>
            </div>
          )}

          {lastCalculation && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#064e3b', padding: '6px 14px', borderRadius: '8px', border: '1px solid #047857' }}>
              <span style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>Terpenuhi:</span>
              <strong style={{ fontSize: '0.875rem', color: '#34d399' }}>{lastCalculation.passedCount} / {lastCalculation.quota} ({lastCalculation.quotaFulfillmentPercentage}%)</strong>
            </div>
          )}

          <button 
            onClick={onResetDefault}
            className="btn btn-secondary btn-sm"
            title="Reset ke data awal simulasi (6 kriteria, 3 penilai, 120 siswa)"
            style={{ background: '#1e293b', color: '#cbd5e1', borderColor: '#475569', fontSize: '0.75rem', padding: '6px 10px' }}
          >
            <RotateCcw size={14} />
            <span>Reset Data Uji</span>
          </button>
        </div>
      </div>

      {/* Navigation Stepper / Tabs */}
      <div style={{ background: '#1e293b', borderTop: '1px solid #334155' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 24px', display: 'flex', overflowX: 'auto', gap: '4px' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 18px',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#ffffff' : '#94a3b8',
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? '3px solid #6366f1' : '3px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} color={isActive ? '#818cf8' : '#64748b'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
