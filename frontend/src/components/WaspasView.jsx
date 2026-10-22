import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Calculator, 
  Download, 
  CheckCircle2, 
  Clock, 
  Search, 
  Layers, 
  ChevronDown, 
  ChevronUp,
  RotateCw
} from 'lucide-react';

export default function WaspasView({ 
  calculation, 
  period, 
  criteria, 
  onRunWASPAS, 
  onUpdatePeriod, 
  onExportExcel 
}) {
  const [quota, setQuota] = useState(period ? period.target_quota : 50);
  const [lambda, setLambda] = useState(period ? period.lambda : 0.5);
  const [isCalculating, setIsCalculating] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Toggle for academic / skripsi formulas
  const [showMathDetails, setShowMathDetails] = useState(false);
  const [mathSubTab, setMathSubTab] = useState('normMatrix');

  const handleRun = async () => {
    setIsCalculating(true);
    try {
      await onRunWASPAS(parseInt(quota, 10), parseFloat(lambda));
    } catch (err) {
      alert('Gagal mengeksekusi perhitungan: ' + err.message);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleQuotaChange = async (newQ) => {
    const qVal = parseInt(newQ, 10) || 1;
    setQuota(qVal);
    if (period) {
      await onUpdatePeriod({ target_quota: qVal });
    }
  };

  const handlePresetQuota = async (presetVal) => {
    setQuota(presetVal);
    if (period) {
      await onUpdatePeriod({ target_quota: presetVal });
    }
  };

  const filteredRankings = useMemo(() => {
    if (!calculation || !calculation.rankings) return [];
    let list = calculation.rankings;

    if (statusFilter === 'passed') {
      list = list.filter(r => r.quotaStatus === 'passed_quota');
    } else if (statusFilter === 'backup') {
      list = list.filter(r => r.quotaStatus === 'backup_priority');
    }

    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      list = list.filter(r => 
        r.nama_lengkap.toLowerCase().includes(t) ||
        r.nisn.toLowerCase().includes(t) ||
        r.kelas.toLowerCase().includes(t)
      );
    }

    return list;
  }, [calculation, statusFilter, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Header: Bersih & Minimalis */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'hsl(var(--foreground))', margin: 0 }}>
            Hasil Perangkingan PIP
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: '2px 0 0 0' }}>
            Urutan prioritas penerima bantuan berdasarkan kalkulasi WASPAS
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={onExportExcel} 
            disabled={!calculation} 
            className="btn btn-outline btn-sm"
          >
            <Download size={14} />
            <span>Export Excel</span>
          </button>
          <button 
            onClick={handleRun} 
            disabled={isCalculating} 
            className="btn btn-primary btn-sm"
          >
            {isCalculating ? <RotateCw size={14} className="animate-spin" /> : <Calculator size={14} />}
            <span>{isCalculating ? 'Menghitung...' : 'Hitung Ulang'}</span>
          </button>
        </div>
      </div>

      {/* Kontrol Kuota Ringkas */}
      <div className="card" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Kuota Penerima:</span>
            <input 
              type="number"
              min="1"
              value={quota}
              onChange={(e) => handleQuotaChange(e.target.value)}
              className="form-input"
              style={{ width: '85px', padding: '3px 6px', textAlign: 'center', fontWeight: 700 }}
            />
            <div style={{ display: 'flex', gap: '4px' }}>
              {[25, 50, 75, 100].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handlePresetQuota(val)}
                  className={`btn btn-sm ${quota === val ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '2px 8px', fontSize: '0.6875rem', height: '24px' }}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {calculation && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8125rem' }}>
              <div>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Lolos: </span>
                <strong style={{ color: 'hsl(var(--success))' }}>{calculation.passedCount} Siswa</strong>
              </div>
              <div style={{ width: '1px', height: '14px', background: 'hsl(var(--border))' }}></div>
              <div>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Cadangan: </span>
                <strong style={{ color: 'hsl(var(--warning))' }}>{calculation.backupCount} Siswa</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabel Data Hasil Perangkingan */}
      <div className="card">
        {/* Toolbar Pencarian & Filter Status */}
        <div className="card-header" style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', background: 'hsl(var(--muted))', borderRadius: 'var(--radius)', padding: '2px' }}>
              <button 
                onClick={() => setStatusFilter('all')}
                style={{ 
                  padding: '3px 10px', 
                  borderRadius: 'calc(var(--radius) - 2px)', 
                  border: 'none', 
                  fontSize: '0.75rem', 
                  fontWeight: statusFilter === 'all' ? 600 : 500,
                  background: statusFilter === 'all' ? 'hsl(var(--card))' : 'transparent',
                  color: statusFilter === 'all' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                  cursor: 'pointer'
                }}
              >
                Semua ({calculation ? calculation.rankings.length : 0})
              </button>
              <button 
                onClick={() => setStatusFilter('passed')}
                style={{ 
                  padding: '3px 10px', 
                  borderRadius: 'calc(var(--radius) - 2px)', 
                  border: 'none', 
                  fontSize: '0.75rem', 
                  fontWeight: statusFilter === 'passed' ? 600 : 500,
                  background: statusFilter === 'passed' ? 'hsl(var(--card))' : 'transparent',
                  color: statusFilter === 'passed' ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))',
                  cursor: 'pointer'
                }}
              >
                Lolos ({calculation ? calculation.passedCount : 0})
              </button>
              <button 
                onClick={() => setStatusFilter('backup')}
                style={{ 
                  padding: '3px 10px', 
                  borderRadius: 'calc(var(--radius) - 2px)', 
                  border: 'none', 
                  fontSize: '0.75rem', 
                  fontWeight: statusFilter === 'backup' ? 600 : 500,
                  background: statusFilter === 'backup' ? 'hsl(var(--card))' : 'transparent',
                  color: statusFilter === 'backup' ? 'hsl(var(--warning))' : 'hsl(var(--muted-foreground))',
                  cursor: 'pointer'
                }}
              >
                Cadangan ({calculation ? calculation.backupCount : 0})
              </button>
            </div>

            <div style={{ position: 'relative', width: '220px' }}>
              <Search 
                size={14} 
                color="hsl(var(--muted-foreground))" 
                style={{ 
                  position: 'absolute', 
                  left: '10px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }} 
              />
              <input 
                type="text" 
                placeholder="Cari nama / NISN..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ 
                  padding: '5px 12px 5px 32px', 
                  fontSize: '0.75rem',
                  width: '100%'
                }}
              />
            </div>
          </div>

          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
            Total: {filteredRankings.length} siswa
          </span>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '55px', textAlign: 'center' }}>Rank</th>
                <th style={{ width: '110px' }}>NISN</th>
                <th style={{ minWidth: '160px' }}>Nama Lengkap</th>
                <th style={{ width: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>Kelas</th>
                <th style={{ minWidth: '130px' }}>Nama Wali</th>
                <th style={{ textAlign: 'right', width: '110px', whiteSpace: 'nowrap' }}>Skor WASPAS</th>
                <th style={{ width: '140px', textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {!calculation || filteredRankings.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'hsl(var(--muted-foreground))' }}>
                    Belum ada data perhitungan atau data tidak ditemukan.
                  </td>
                </tr>
              ) : (
                filteredRankings.map((r) => {
                  const isPassed = r.quotaStatus === 'passed_quota';
                  const isCutOffRow = isPassed && r.rank === calculation.quota;

                  return (
                    <React.Fragment key={r.id}>
                      <tr className={isPassed ? 'row-passed' : 'row-backup'}>
                        <td style={{ textAlign: 'center' }}>
                          <strong style={{ fontSize: '0.875rem', color: isPassed ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))' }}>
                            #{r.rank}
                          </strong>
                        </td>
                        <td className="code-num">{r.nisn}</td>
                        <td style={{ fontWeight: 600 }}>{r.nama_lengkap}</td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{r.kelas}</td>
                        <td style={{ color: 'hsl(var(--muted-foreground))' }}>{r.nama_wali || '-'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'hsl(var(--primary))', whiteSpace: 'nowrap' }}>
                          {(r.waspasScore * 100).toFixed(1)}%
                        </td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span className={`badge ${isPassed ? 'badge-passed' : 'badge-neutral'}`} style={{ whiteSpace: 'nowrap' }}>
                            {isPassed ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                            <span style={{ whiteSpace: 'nowrap' }}>{isPassed ? 'Lolos Kuota' : 'Cadangan'}</span>
                          </span>
                        </td>
                      </tr>

                      {/* Batas Visual Kuota */}
                      {isCutOffRow && statusFilter === 'all' && (
                        <tr>
                          <td colSpan={7} style={{ background: 'hsl(var(--muted) / 0.5)', color: 'hsl(var(--muted-foreground))', textAlign: 'center', padding: '6px 12px', fontWeight: 600, fontSize: '0.75rem', borderTop: '2px dashed hsl(var(--border))', borderBottom: '2px dashed hsl(var(--border))' }}>
                            --- BATAS KUOTA PENERIMA ({calculation.quota} SISWA) ---
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bagian Akademik: Rincian Rumus (Bisa Dibuka/Tutup untuk Uji Skripsi) */}
      <div className="card">
        <button 
          onClick={() => setShowMathDetails(!showMathDetails)}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={14} color="hsl(var(--primary))" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
              Detail Matriks Perhitungan (BWM & WASPAS)
            </span>
          </div>
          {showMathDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showMathDetails && calculation && (
          <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid hsl(var(--border))' }}>
            <div style={{ display: 'flex', gap: '4px', padding: '8px 0', borderBottom: '1px solid hsl(var(--border))' }}>
              <button 
                onClick={() => setMathSubTab('normMatrix')} 
                className={`btn btn-sm ${mathSubTab === 'normMatrix' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.6875rem', height: '24px' }}
              >
                1. Matriks Normalisasi (R)
              </button>
              <button 
                onClick={() => setMathSubTab('rawMatrix')} 
                className={`btn btn-sm ${mathSubTab === 'rawMatrix' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.6875rem', height: '24px' }}
              >
                2. Data Asli (X)
              </button>
              <button 
                onClick={() => setMathSubTab('scoreDetail')} 
                className={`btn btn-sm ${mathSubTab === 'scoreDetail' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.6875rem', height: '24px' }}
              >
                3. Nilai WSM & WPM
              </button>
            </div>

            {/* Matriks Normalisasi R */}
            {mathSubTab === 'normMatrix' && (
              <div className="table-container" style={{ border: 'none', marginTop: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '100px' }}>NISN</th>
                      <th>Nama Siswa</th>
                      {criteria.map(c => (
                        <th key={c.code} style={{ textAlign: 'right' }}>
                          {c.code} ({c.type.toUpperCase()})
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {calculation.normalizedMatrix.map(m => (
                      <tr key={m.id}>
                        <td className="code-num">{m.nisn}</td>
                        <td style={{ fontWeight: 600 }}>{m.nama_lengkap}</td>
                        {criteria.map(c => (
                          <td key={c.code} style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                            {(m.values[c.code] || 0).toFixed(4)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Matriks Asli X */}
            {mathSubTab === 'rawMatrix' && (
              <div className="table-container" style={{ border: 'none', marginTop: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '100px' }}>NISN</th>
                      <th>Nama Siswa</th>
                      {criteria.map(c => (
                        <th key={c.code} style={{ textAlign: 'right' }}>
                          {c.code}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {calculation.rawMatrix.map(m => (
                      <tr key={m.id}>
                        <td className="code-num">{m.nisn}</td>
                        <td style={{ fontWeight: 600 }}>{m.nama_lengkap}</td>
                        {criteria.map(c => (
                          <td key={c.code} style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                            {c.code === 'C1' ? `Rp ${(m.values[c.code] || 0).toLocaleString('id-ID')}` : m.values[c.code]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Rincian Skor WSM & WPM */}
            {mathSubTab === 'scoreDetail' && (
              <div className="table-container" style={{ border: 'none', marginTop: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>Rank</th>
                      <th style={{ width: '100px' }}>NISN</th>
                      <th>Nama Siswa</th>
                      <th style={{ textAlign: 'right' }}>WSM (Q1)</th>
                      <th style={{ textAlign: 'right' }}>WPM (Q2)</th>
                      <th style={{ textAlign: 'right' }}>Total (Q)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculation.rankings.map(r => (
                      <tr key={r.id}>
                        <td><strong>#{r.rank}</strong></td>
                        <td className="code-num">{r.nisn}</td>
                        <td style={{ fontWeight: 600 }}>{r.nama_lengkap}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{r.wsmScore.toFixed(4)}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{r.wpmScore.toFixed(4)}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'hsl(var(--primary))' }}>
                          {r.waspasScore.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
