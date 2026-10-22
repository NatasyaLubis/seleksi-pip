import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Calculator, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Edit3, 
  Trash2, 
  X,
  Check,
  RotateCw,
  Info
} from 'lucide-react';
import { api } from '../services/api';

const SCALE_OPTIONS = [
  { value: 1, label: '1 - Sama penting' },
  { value: 2, label: '2 - Sedikit lebih penting' },
  { value: 3, label: '3 - Cukup lebih penting' },
  { value: 4, label: '4 - Antara cukup & jelas penting' },
  { value: 5, label: '5 - Jelas lebih penting' },
  { value: 6, label: '6 - Antara jelas & sangat penting' },
  { value: 7, label: '7 - Sangat lebih penting' },
  { value: 8, label: '8 - Mendekati mutlak' },
  { value: 9, label: '9 - Mutlak paling penting' }
];

export default function BwmView({ 
  decisionMakers, 
  criteria, 
  aggregatedWeights, 
  onAddDM, 
  onUpdateDM, 
  onDeleteDM, 
  onSubmitEvaluation, 
  onAggregate 
}) {
  const [selectedDM, setSelectedDM] = useState(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isDMModalOpen, setIsDMModalOpen] = useState(false);
  const [editingDM, setEditingDM] = useState(null);

  // DM Form states
  const [dmName, setDmName] = useState('');
  const [dmTitle, setDmTitle] = useState('');

  // BWM Wizard states
  const [bestCode, setBestCode] = useState('');
  const [worstCode, setWorstCode] = useState('');
  const [bestToOthers, setBestToOthers] = useState({});
  const [othersToWorst, setOthersToWorst] = useState({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isAggregating, setIsAggregating] = useState(false);

  // Real-time BWM Logic Preview
  const [previewResult, setPreviewResult] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Open DM Modal
  const openAddDMModal = () => {
    setEditingDM(null);
    setDmName('');
    setDmTitle('');
    setIsDMModalOpen(true);
  };

  const openEditDMModal = (dm) => {
    setEditingDM(dm);
    setDmName(dm.name);
    setDmTitle(dm.title);
    setIsDMModalOpen(true);
  };

  const handleSaveDM = async (e) => {
    e.preventDefault();
    if (!dmName.trim() || !dmTitle.trim()) return alert('Nama dan Jabatan wajib diisi.');

    if (editingDM) {
      await onUpdateDM(editingDM.id, { name: dmName, title: dmTitle, institution: 'SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG' });
    } else {
      await onAddDM({ name: dmName, title: dmTitle, institution: 'SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG' });
    }
    setIsDMModalOpen(false);
  };

  // Open BWM Evaluation Wizard
  const openEvaluationWizard = (dm) => {
    setSelectedDM(dm);
    const codes = criteria.map(c => c.code);
    const existing = dm.evaluation;

    if (existing) {
      setBestCode(existing.bestCode);
      setWorstCode(existing.worstCode);
      setBestToOthers({ ...existing.bestToOthers });
      setOthersToWorst({ ...existing.othersToWorst });
    } else {
      const defaultBest = codes[0] || 'C1';
      const defaultWorst = codes[codes.length - 1] || 'C4';
      setBestCode(defaultBest);
      setWorstCode(defaultWorst);

      const initBO = {};
      const initOW = {};
      codes.forEach(c => {
        initBO[c] = c === defaultBest ? 1 : 2;
        initOW[c] = c === defaultWorst ? 1 : 2;
      });
      setBestToOthers(initBO);
      setOthersToWorst(initOW);
    }

    setIsWizardOpen(true);
  };

  // Helper to find criterion object
  const getCriterion = (code) => criteria.find(c => c.code === code) || { code, name: code };

  const handleBestChange = (newBest) => {
    setBestCode(newBest);
    let updatedWorst = worstCode;
    if (newBest === worstCode) {
      const remaining = criteria.filter(c => c.code !== newBest);
      updatedWorst = remaining.length > 0 ? remaining[0].code : '';
      setWorstCode(updatedWorst);
    }
    const updatedBO = { ...bestToOthers };
    criteria.forEach(c => {
      updatedBO[c.code] = c.code === newBest ? 1 : (updatedBO[c.code] || 2);
    });
    setBestToOthers(updatedBO);

    const updatedOW = { ...othersToWorst };
    if (updatedWorst) {
      updatedOW[newBest] = updatedBO[updatedWorst] || 2;
    }
    setOthersToWorst(updatedOW);
  };

  const handleWorstChange = (newWorst) => {
    setWorstCode(newWorst);
    let updatedBest = bestCode;
    if (newWorst === bestCode) {
      const remaining = criteria.filter(c => c.code !== newWorst);
      updatedBest = remaining.length > 0 ? remaining[0].code : '';
      setBestCode(updatedBest);
    }
    const updatedOW = { ...othersToWorst };
    criteria.forEach(c => {
      updatedOW[c.code] = c.code === newWorst ? 1 : (updatedOW[c.code] || 2);
    });
    setOthersToWorst(updatedOW);

    const updatedBO = { ...bestToOthers };
    if (updatedBest) {
      updatedBO[newWorst] = updatedOW[updatedBest] || 2;
    }
    setBestToOthers(updatedBO);
  };

  // Harmonize a_BW across both vectors in real time
  const handleBestToOthersChange = (code, val) => {
    const updatedBO = { ...bestToOthers, [code]: val };
    setBestToOthers(updatedBO);
    if (code === worstCode) {
      setOthersToWorst(prev => ({ ...prev, [bestCode]: val }));
    }
  };

  const handleOthersToWorstChange = (code, val) => {
    const updatedOW = { ...othersToWorst, [code]: val };
    setOthersToWorst(updatedOW);
    if (code === bestCode) {
      setBestToOthers(prev => ({ ...prev, [worstCode]: val }));
    }
  };

  // Live calculation of BWM Consistency (CR, xi, Status Logika)
  useEffect(() => {
    if (!isWizardOpen || !bestCode || !worstCode || bestCode === worstCode) {
      setPreviewResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsPreviewLoading(true);
        const cleanedBO = { ...bestToOthers, [bestCode]: 1 };
        const cleanedOW = { ...othersToWorst, [worstCode]: 1 };
        const aBW = cleanedBO[worstCode] || cleanedOW[bestCode] || 1;
        cleanedBO[worstCode] = aBW;
        cleanedOW[bestCode] = aBW;

        const res = await api.previewBWM({
          bestCode,
          worstCode,
          bestToOthers: cleanedBO,
          othersToWorst: cleanedOW
        });

        if (res && res.success) {
          setPreviewResult(res.data);
        }
      } catch (err) {
        console.error('Preview BWM calculation error:', err);
      } finally {
        setIsPreviewLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [isWizardOpen, bestCode, worstCode, bestToOthers, othersToWorst]);

  const submitBWM = async (e) => {
    e.preventDefault();
    if (bestCode === worstCode) {
      return alert('Kriteria Terbaik dan Terburuk tidak boleh sama.');
    }

    setIsEvaluating(true);
    try {
      const res = await onSubmitEvaluation(selectedDM.id, {
        bestCode,
        worstCode,
        bestToOthers,
        othersToWorst
      });

      if (res && res.success) {
        setIsWizardOpen(false);
      }
    } catch (err) {
      alert('Gagal menghitung BWM: ' + err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRunAggregate = async () => {
    setIsAggregating(true);
    try {
      await onAggregate();
    } finally {
      setIsAggregating(false);
    }
  };

  const bestCrit = getCriterion(bestCode);
  const worstCrit = getCriterion(worstCode);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'hsl(var(--foreground))', margin: 0 }}>
            Penilaian Tim & Bobot (BWM)
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: '2px 0 0 0' }}>
            Penetapan bobot kriteria oleh tim penilai menggunakan metode Best-Worst Method
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={openAddDMModal} className="btn btn-outline btn-sm">
            <Plus size={14} />
            <span>Tambah Penilai</span>
          </button>
          <button onClick={handleRunAggregate} disabled={isAggregating} className="btn btn-primary btn-sm">
            {isAggregating ? <RotateCw size={14} className="animate-spin" /> : <Calculator size={14} />}
            <span>Hitung Konsensus Bobot</span>
          </button>
        </div>
      </div>

      {/* Tabel 1: Daftar Tim Penilai (Sederhana & Bersih) */}
      <div className="card">
        <div className="card-header" style={{ padding: '12px 18px' }}>
          <h3 className="card-title" style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
            Tim Penilai ({decisionMakers.length} Orang)
          </h3>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>No</th>
                <th>Nama Penilai & Jabatan</th>
                <th style={{ width: '130px' }}>Kriteria Terbaik</th>
                <th style={{ width: '130px' }}>Kriteria Terendah</th>
                <th style={{ width: '150px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Status Logika</span>
                    <span title="Berdasarkan Rasio Konsistensi (CR < 0.10) metode BWM Rezaei" style={{ cursor: 'help', display: 'inline-flex' }}>
                      <Info size={12} color="hsl(var(--muted-foreground))" />
                    </span>
                  </div>
                </th>
                <th style={{ width: '160px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {decisionMakers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px 20px', color: 'hsl(var(--muted-foreground))' }}>
                    Belum ada anggota tim penilai BWM. Silakan klik tombol <strong>"Tambah Penilai"</strong> di atas untuk mendaftarkan pengambil keputusan.
                  </td>
                </tr>
              ) : (
                decisionMakers.map((dm, idx) => {
                const hasEval = dm.evaluation && dm.evaluation.weights;
                const isConsistent = dm.evaluation && dm.evaluation.isConsistent;

                return (
                  <tr key={dm.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{dm.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>{dm.title}</div>
                    </td>
                    <td>
                      {hasEval ? (
                        <span className="code-num" style={{ fontWeight: 700, color: 'hsl(var(--primary))' }}>
                          {dm.evaluation.bestCode}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      {hasEval ? (
                        <span className="code-num" style={{ fontWeight: 700, color: 'hsl(var(--warning))' }}>
                          {dm.evaluation.worstCode}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      {hasEval ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span className={`badge ${isConsistent ? 'badge-passed' : 'badge-backup'}`} style={{ width: 'fit-content' }}>
                            {isConsistent ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                            <span>{isConsistent ? 'Konsisten' : 'Cek Ulang'}</span>
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', fontFamily: 'monospace' }}>
                            CR: {dm.evaluation.consistencyRatio !== undefined ? dm.evaluation.consistencyRatio.toFixed(3) : '0.000'}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Belum diisi</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button 
                          onClick={() => openEvaluationWizard(dm)} 
                          className="btn btn-outline btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.75rem', height: '26px' }}
                        >
                          <ShieldCheck size={13} />
                          <span>{hasEval ? 'Ubah Nilai' : 'Isi Nilai'}</span>
                        </button>
                        <button 
                          onClick={() => openEditDMModal(dm)} 
                          className="btn btn-ghost btn-sm" 
                          style={{ padding: '4px' }} 
                          title="Edit"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button 
                          onClick={() => onDeleteDM(dm.id, dm.name)} 
                          className="btn btn-ghost btn-sm" 
                          style={{ padding: '4px', color: 'hsl(var(--destructive))' }} 
                          title="Hapus"
                          disabled={decisionMakers.length <= 1}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabel 2: Konsensus Bobot Akhir Kriteria (Hasil Agregasi) */}
      <div className="card">
        <div className="card-header" style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title" style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
            Konsensus Bobot Kriteria (Agregasi Geometric Mean)
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
            Digunakan langsung pada perhitungan WASPAS
          </span>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Kode</th>
                <th>Nama Kriteria</th>
                {decisionMakers.map((dm, idx) => (
                  <th key={dm.id} style={{ textAlign: 'right', width: '110px' }}>
                    {dm.name.split(' ')[0]} (P{idx + 1})
                  </th>
                ))}
                <th style={{ textAlign: 'right', width: '130px' }}>Bobot Akhir</th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((c) => {
                const finalW = parseFloat(c.final_weight) || 0;
                return (
                  <tr key={c.id}>
                    <td><span className="code-num" style={{ fontWeight: 700 }}>{c.code}</span></td>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    {decisionMakers.map(dm => {
                      const dmWeight = dm.evaluation && dm.evaluation.weights 
                        ? ((dm.evaluation.weights[c.code] || 0) * 100).toFixed(1) + '%'
                        : '-';
                      return (
                        <td key={dm.id} style={{ textAlign: 'right', fontSize: '0.8125rem' }}>
                          {dmWeight}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '0.875rem', color: 'hsl(var(--primary))' }}>
                        {(finalW * 100).toFixed(1)}%
                      </strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input Penilaian BWM (Jelas, Rapi & Presisi sesuai Aturan Metode) */}
      {isWizardOpen && selectedDM && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '780px', width: '95%' }}>
            <div className="modal-header" style={{ padding: '14px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
              <div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0, color: 'hsl(var(--foreground))' }}>
                  Penilaian Kriteria: {selectedDM.name}
                </h3>
                <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
                  {selectedDM.title} · Penentuan Bobot Preferensi Best-Worst Method (BWM)
                </span>
              </div>
              <button onClick={() => setIsWizardOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitBWM}>
              <div className="modal-body" style={{ maxHeight: '78vh', overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* 1. Pilih Kriteria Terbaik & Terburuk */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0, padding: '12px 14px', borderRadius: '8px', background: 'hsl(var(--primary) / 0.05)', border: '1px solid hsl(var(--primary) / 0.25)' }}>
                    <label className="form-label" style={{ fontWeight: 700, color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.8125rem' }}>
                      <ShieldCheck size={15} />
                      <span>Kriteria Terbaik (Paling Utama / Penting)</span>
                    </label>
                    <select 
                      value={bestCode} 
                      onChange={(e) => handleBestChange(e.target.value)}
                      className="form-select"
                      style={{ fontWeight: 600, fontSize: '0.875rem' }}
                    >
                      {criteria.map(c => (
                        <option key={c.code} value={c.code} disabled={c.code === worstCode}>
                          {c.code} - {c.name} {c.code === worstCode ? '(Kriteria Terburuk)' : ''}
                        </option>
                      ))}
                    </select>
                    <span style={{ fontSize: '0.71875rem', color: 'hsl(var(--muted-foreground))', marginTop: '4px', display: 'block' }}>
                      Kriteria dengan derajat kepentingan paling tinggi
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0, padding: '12px 14px', borderRadius: '8px', background: 'hsl(var(--warning) / 0.06)', border: '1px solid hsl(var(--warning) / 0.3)' }}>
                    <label className="form-label" style={{ fontWeight: 700, color: 'hsl(var(--warning))', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.8125rem' }}>
                      <AlertTriangle size={15} />
                      <span>Kriteria Terburuk (Paling Kurang Penting)</span>
                    </label>
                    <select 
                      value={worstCode} 
                      onChange={(e) => handleWorstChange(e.target.value)}
                      className="form-select"
                      style={{ fontWeight: 600, fontSize: '0.875rem' }}
                    >
                      {criteria.map(c => (
                        <option key={c.code} value={c.code} disabled={c.code === bestCode}>
                          {c.code} - {c.name} {c.code === bestCode ? '(Kriteria Terbaik)' : ''}
                        </option>
                      ))}
                    </select>
                    <span style={{ fontSize: '0.71875rem', color: 'hsl(var(--muted-foreground))', marginTop: '4px', display: 'block' }}>
                      Kriteria dengan derajat kepentingan paling rendah
                    </span>
                  </div>
                </div>

                {/* 2. Section Best-to-Others */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                        VEKTOR A_B
                      </span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                        Bandingkan [{bestCode} - {bestCrit.name}] Terhadap Kriteria Lain:
                      </span>
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))' }}>
                      Skala 1 (Sama) s/d 9 (Mutlak)
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '8px' }}>
                    {criteria.filter(c => c.code !== bestCode).map(c => {
                      const isWorst = c.code === worstCode;
                      return (
                        <div 
                          key={c.code} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            background: isWorst ? 'hsl(var(--warning) / 0.08)' : 'hsl(var(--muted) / 0.35)', 
                            padding: '8px 12px', 
                            borderRadius: '8px', 
                            border: isWorst ? '1.5px solid hsl(var(--warning) / 0.45)' : '1px solid hsl(var(--border))',
                            gap: '10px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span className="code-num" style={{ fontWeight: 800, fontSize: '0.75rem', background: 'hsl(var(--background))', padding: '1px 6px', borderRadius: '4px', border: '1px solid hsl(var(--border))' }}>
                                {bestCode} vs {c.code}
                              </span>
                              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.name}>
                                {c.name}
                              </span>
                              {isWorst && (
                                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'hsl(var(--warning))', background: 'hsl(var(--warning) / 0.15)', padding: '1px 5px', borderRadius: '4px' }}>
                                  Terburuk (a_BW)
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
                              {isWorst 
                                ? `Nilai perbandingan utama a_BW (otomatis tersinkron)` 
                                : `Preferensi ${bestCode} dibanding ${c.code}`}
                            </span>
                          </div>

                          <select 
                            value={bestToOthers[c.code] || 1}
                            onChange={(e) => handleBestToOthersChange(c.code, parseInt(e.target.value, 10))}
                            className="form-select"
                            style={{ 
                              width: '165px', 
                              padding: '3px 8px', 
                              fontSize: '0.75rem', 
                              height: '32px', 
                              fontWeight: 600,
                              borderColor: isWorst ? 'hsl(var(--warning))' : undefined,
                              flexShrink: 0 
                            }}
                          >
                            {SCALE_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Section Others-to-Worst */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'hsl(var(--warning))', background: 'hsl(var(--warning) / 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                        VEKTOR A_W
                      </span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                        Bandingkan Kriteria Lain Terhadap [{worstCode} - {worstCrit.name}]:
                      </span>
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))' }}>
                      Skala 1 (Sama) s/d 9 (Mutlak)
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '8px' }}>
                    {criteria.filter(c => c.code !== worstCode).map(c => {
                      const isBest = c.code === bestCode;
                      return (
                        <div 
                          key={c.code} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            background: isBest ? 'hsl(var(--primary) / 0.08)' : 'hsl(var(--muted) / 0.35)', 
                            padding: '8px 12px', 
                            borderRadius: '8px', 
                            border: isBest ? '1.5px solid hsl(var(--primary) / 0.45)' : '1px solid hsl(var(--border))',
                            gap: '10px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span className="code-num" style={{ fontWeight: 800, fontSize: '0.75rem', background: 'hsl(var(--background))', padding: '1px 6px', borderRadius: '4px', border: '1px solid hsl(var(--border))' }}>
                                {c.code} vs {worstCode}
                              </span>
                              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.name}>
                                {c.name}
                              </span>
                              {isBest && (
                                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.15)', padding: '1px 5px', borderRadius: '4px' }}>
                                  Terbaik (a_BW)
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
                              {isBest 
                                ? `Nilai perbandingan utama a_BW (otomatis tersinkron)` 
                                : `Preferensi ${c.code} dibanding ${worstCode}`}
                            </span>
                          </div>

                          <select 
                            value={othersToWorst[c.code] || 1}
                            onChange={(e) => handleOthersToWorstChange(c.code, parseInt(e.target.value, 10))}
                            className="form-select"
                            style={{ 
                              width: '165px', 
                              padding: '3px 8px', 
                              fontSize: '0.75rem', 
                              height: '32px', 
                              fontWeight: 600,
                              borderColor: isBest ? 'hsl(var(--primary))' : undefined,
                              flexShrink: 0 
                            }}
                          >
                            {SCALE_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Real-time Status Logika Card Sesuai Aturan Metode BWM */}
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: previewResult?.isConsistent 
                    ? 'hsl(var(--success) / 0.08)' 
                    : 'hsl(var(--warning) / 0.1)',
                  border: `1px solid ${previewResult?.isConsistent 
                    ? 'hsl(var(--success) / 0.35)' 
                    : 'hsl(var(--warning) / 0.45)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isPreviewLoading ? (
                        <RotateCw size={16} className="animate-spin" color="hsl(var(--primary))" />
                      ) : previewResult?.isConsistent ? (
                        <CheckCircle2 size={18} color="hsl(var(--success))" />
                      ) : (
                        <AlertTriangle size={18} color="hsl(var(--warning))" />
                      )}
                      <span style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 700, 
                        color: previewResult?.isConsistent ? 'hsl(var(--success))' : 'hsl(var(--warning))' 
                      }}>
                        Status Logika BWM: {previewResult?.isConsistent ? 'KONSISTEN (Memenuhi Kaidah Metode)' : 'PERLU PENYESUAIAN (Rasio CR ≥ 0.10)'}
                      </span>
                    </div>

                    {previewResult && (
                      <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', fontWeight: 700 }}>
                          CR: {previewResult.consistencyRatio.toFixed(3)}
                        </span>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>
                          ξ*: {previewResult.xi.toFixed(4)}
                        </span>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>
                          a_BW: {previewResult.aBW}
                        </span>
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', margin: 0, lineHeight: 1.45 }}>
                    {previewResult?.isConsistent 
                      ? 'Rasio Konsistensi (CR < 0.10) sesuai teori Jafar Rezaei (2015/2016). Perbandingan preferensi logis dan siap disimpan.' 
                      : 'Rasio Konsistensi (CR ≥ 0.10) menunjukkan adanya pertentangan preferensi. Berdasarkan kaidah BWM, hubungan nilai antar kriteria disarankan memenuhi a_Bj × a_jW ≈ a_BW.'}
                  </p>

                  {previewResult?.warnings && previewResult.warnings.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px', background: 'hsl(var(--background) / 0.7)', padding: '8px 10px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'hsl(var(--warning))' }}>
                        Petunjuk Penyesuaian Logika:
                      </span>
                      {previewResult.warnings.map((warn, wIdx) => (
                        <span key={wIdx} style={{ fontSize: '0.6875rem', color: 'hsl(var(--foreground))', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          • {warn}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid hsl(var(--border))' }}>
                <button type="button" onClick={() => setIsWizardOpen(false)} className="btn btn-outline btn-sm">
                  Batal
                </button>
                <button type="submit" disabled={isEvaluating} className="btn btn-primary btn-sm">
                  {isEvaluating ? <RotateCw size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{isEvaluating ? 'Menghitung Solver BWM...' : 'Hitung & Simpan Bobot'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Penilai */}
      {isDMModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                {editingDM ? 'Edit Data Penilai' : 'Tambah Penilai Baru'}
              </h3>
              <button onClick={() => setIsDMModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveDM}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nama Lengkap & Gelar</label>
                  <input 
                    type="text" 
                    value={dmName} 
                    onChange={(e) => setDmName(e.target.value)} 
                    placeholder="Contoh: Dra. Hj. Nurhasanah, M.Pd"
                    className="form-input" 
                    required 
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Jabatan di Sekolah</label>
                  <input 
                    type="text" 
                    value={dmTitle} 
                    onChange={(e) => setDmTitle(e.target.value)} 
                    placeholder="Contoh: Guru BK / Tim PIP"
                    className="form-input" 
                    required 
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '12px 18px' }}>
                <button type="button" onClick={() => setIsDMModalOpen(false)} className="btn btn-outline btn-sm">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  <Check size={14} />
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
