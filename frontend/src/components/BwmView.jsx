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
  Info,
  Star,
  Target
} from 'lucide-react';
import { api } from '../services/api';

const SCALE_LABELS = {
  1: '1 - Sama penting',
  2: '2 - Sedikit lebih penting',
  3: '3 - Cukup lebih penting',
  4: '4 - Antara cukup & jelas penting',
  5: '5 - Jelas lebih penting',
  6: '6 - Antara jelas & sangat penting',
  7: '7 - Sangat lebih penting',
  8: '8 - Mendekati mutlak',
  9: '9 - Mutlak paling penting'
};

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
          <div className="modal-content" style={{ maxWidth: '840px', width: '96%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Modal Header */}
            <div className="modal-header" style={{ flexShrink: 0, padding: '16px 22px', borderBottom: '1px solid hsl(var(--border) / 0.7)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '10px', 
                  background: 'hsl(215 85% 92%)', 
                  color: 'hsl(215 75% 40%)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1rem',
                  flexShrink: 0
                }}>
                  {selectedDM.name.charAt(0)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0, color: 'hsl(var(--foreground))' }}>
                      Penilaian Kriteria: {selectedDM.name}
                    </h3>
                    <span className="badge badge-neutral" style={{ fontSize: '0.6875rem', fontWeight: 600 }}>
                      {selectedDM.title}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
                    Best-Worst Method (BWM) · Penentuan Bobot Preferensi Skala 1 s/d 9
                  </span>
                </div>
              </div>
              <button onClick={() => setIsWizardOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: '6px', borderRadius: '8px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitBWM} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* Banner Edukatif Cara Kerja BWM */}
                <div className="bwm-guide-box">
                  <Info size={17} style={{ color: 'hsl(var(--muted-foreground))', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
                    <strong style={{ color: 'hsl(var(--foreground))' }}>Panduan Alur Penilaian BWM (Jafar Rezaei):</strong>
                    <div style={{ color: 'hsl(var(--muted-foreground))', marginTop: '3px' }}>
                      <strong>1. Kriteria Acuan:</strong> Tentukan kriteria paling penting (Best — B) dan paling kurang penting (Worst — W).<br />
                      <strong>2. Vektor A_B:</strong> Bandingkan seberapa jauh Kriteria Terbaik (B) lebih penting dibanding kriteria lainnya.<br />
                      <strong>3. Vektor A_W:</strong> Bandingkan seberapa jauh kriteria lainnya lebih penting dibanding Kriteria Terburuk (W).
                    </div>
                  </div>
                </div>

                {/* Langkah 1: Kriteria Acuan (Terbaik & Terburuk) */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span className="bwm-step-circle circle-1">1</span>
                    <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                      Tentukan Kriteria Acuan (Terbaik & Terburuk)
                    </h4>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                    {/* Card Best */}
                    <div className="bwm-card-selector best-card">
                      <label className="form-label" style={{ fontWeight: 700, color: 'hsl(215 70% 45%)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.8125rem' }}>
                        <Star size={15} fill="currentColor" style={{ color: 'hsl(215 75% 50%)' }} />
                        <span>Kriteria Terbaik (Best — B)</span>
                      </label>
                      <select 
                        value={bestCode} 
                        onChange={(e) => handleBestChange(e.target.value)}
                        className="form-select"
                        style={{ fontWeight: 600, fontSize: '0.875rem', height: '38px' }}
                      >
                        {criteria.map(c => (
                          <option key={c.code} value={c.code} disabled={c.code === worstCode}>
                            {c.code} - {c.name} {c.code === worstCode ? '(Terpilih sebagai Terburuk)' : ''}
                          </option>
                        ))}
                      </select>
                      <span style={{ fontSize: '0.71875rem', color: 'hsl(var(--muted-foreground))', marginTop: '6px', display: 'block' }}>
                        Kriteria dengan prioritas kepentingan paling tinggi
                      </span>
                    </div>

                    {/* Card Worst */}
                    <div className="bwm-card-selector worst-card">
                      <label className="form-label" style={{ fontWeight: 700, color: 'hsl(30 75% 42%)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.8125rem' }}>
                        <Target size={15} style={{ color: 'hsl(30 75% 46%)' }} />
                        <span>Kriteria Terburuk (Worst — W)</span>
                      </label>
                      <select 
                        value={worstCode} 
                        onChange={(e) => handleWorstChange(e.target.value)}
                        className="form-select"
                        style={{ fontWeight: 600, fontSize: '0.875rem', height: '38px' }}
                      >
                        {criteria.map(c => (
                          <option key={c.code} value={c.code} disabled={c.code === bestCode}>
                            {c.code} - {c.name} {c.code === bestCode ? '(Terpilih sebagai Terbaik)' : ''}
                          </option>
                        ))}
                      </select>
                      <span style={{ fontSize: '0.71875rem', color: 'hsl(var(--muted-foreground))', marginTop: '6px', display: 'block' }}>
                        Kriteria dengan prioritas kepentingan paling rendah
                      </span>
                    </div>
                  </div>
                </div>

                {/* Langkah 2: Vektor A_B (Best-to-Others) */}
                <div>
                  <div className="bwm-section-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="bwm-step-circle circle-2">2</span>
                      <span className="bwm-vector-badge badge-ab">
                        VEKTOR A_B (Best-to-Others)
                      </span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                        Bandingkan [{bestCode} - {bestCrit.name}] Terhadap Kriteria Lainnya:
                      </span>
                    </div>
                    <span style={{ fontSize: '0.71875rem', color: 'hsl(var(--muted-foreground))' }}>
                      Skala 1 (Sama) s/d 9 (Mutlak)
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {criteria.filter(c => c.code !== bestCode).map(c => {
                      const isWorst = c.code === worstCode;
                      const currentVal = bestToOthers[c.code] || 1;

                      return (
                        <div 
                          key={c.code} 
                          className={`bwm-row-card ${isWorst ? 'highlight-sync' : ''}`}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="code-num" style={{ fontWeight: 700, fontSize: '0.75rem', background: 'hsl(var(--muted) / 0.6)', padding: '2px 8px', borderRadius: '4px', border: '1px solid hsl(var(--border) / 0.7)' }}>
                                {bestCode} vs {c.code}
                              </span>
                              <span style={{ fontSize: '0.84375rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                                {c.name}
                              </span>
                              {isWorst && (
                                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'hsl(215 70% 40%)', background: 'hsl(215 85% 94% / 0.8)', padding: '2px 8px', borderRadius: '4px', border: '1px solid hsl(215 70% 84% / 0.8)' }}>
                                  Pasangan Acuan (Best vs Worst) · Otomatis Tersinkron
                                </span>
                              )}
                            </div>

                            {/* Label Deskriptor Nilai Terpilih */}
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(215 70% 45%)' }}>
                              {SCALE_LABELS[currentVal]}
                            </span>
                          </div>

                          {/* Segmented Interactive Rating Pills 1..9 */}
                          <div className="bwm-scale-pills">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => handleBestToOthersChange(c.code, num)}
                                className={`bwm-scale-pill-btn ${currentVal === num ? 'active-ab' : ''}`}
                                title={`${num} - ${SCALE_LABELS[num]}`}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Langkah 3: Vektor A_W (Others-to-Worst) */}
                <div>
                  <div className="bwm-section-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="bwm-step-circle circle-3">3</span>
                      <span className="bwm-vector-badge badge-aw">
                        VEKTOR A_W (Others-to-Worst)
                      </span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                        Bandingkan Kriteria Lainnya Terhadap [{worstCode} - {worstCrit.name}]:
                      </span>
                    </div>
                    <span style={{ fontSize: '0.71875rem', color: 'hsl(var(--muted-foreground))' }}>
                      Skala 1 (Sama) s/d 9 (Mutlak)
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {criteria.filter(c => c.code !== worstCode).map(c => {
                      const isBest = c.code === bestCode;
                      const currentVal = othersToWorst[c.code] || 1;

                      return (
                        <div 
                          key={c.code} 
                          className={`bwm-row-card ${isBest ? 'highlight-sync' : ''}`}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="code-num" style={{ fontWeight: 700, fontSize: '0.75rem', background: 'hsl(var(--muted) / 0.6)', padding: '2px 8px', borderRadius: '4px', border: '1px solid hsl(var(--border) / 0.7)' }}>
                                {c.code} vs {worstCode}
                              </span>
                              <span style={{ fontSize: '0.84375rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                                {c.name}
                              </span>
                              {isBest && (
                                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'hsl(30 70% 38%)', background: 'hsl(35 85% 93% / 0.8)', padding: '2px 8px', borderRadius: '4px', border: '1px solid hsl(35 70% 82% / 0.8)' }}>
                                  Pasangan Acuan (Best vs Worst) · Otomatis Tersinkron
                                </span>
                              )}
                            </div>

                            {/* Label Deskriptor Nilai Terpilih */}
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(30 70% 42%)' }}>
                              {SCALE_LABELS[currentVal]}
                            </span>
                          </div>

                          {/* Segmented Interactive Rating Pills 1..9 */}
                          <div className="bwm-scale-pills">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => handleOthersToWorstChange(c.code, num)}
                                className={`bwm-scale-pill-btn ${currentVal === num ? 'active-aw' : ''}`}
                                title={`${num} - ${SCALE_LABELS[num]}`}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Status Konsistensi BWM */}
                <div style={{
                  padding: '13px 16px',
                  borderRadius: '10px',
                  background: previewResult?.isConsistent 
                    ? 'hsl(145 45% 96% / 0.7)' 
                    : 'hsl(38 70% 96% / 0.75)',
                  border: `1px solid ${previewResult?.isConsistent 
                    ? 'hsl(145 40% 80% / 0.7)' 
                    : 'hsl(38 55% 80% / 0.7)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isPreviewLoading ? (
                        <RotateCw size={17} className="animate-spin text-primary" />
                      ) : previewResult?.isConsistent ? (
                        <CheckCircle2 size={19} style={{ color: 'hsl(145 55% 40%)' }} />
                      ) : (
                        <AlertTriangle size={19} style={{ color: 'hsl(35 75% 45%)' }} />
                      )}
                      <div>
                        <div style={{ 
                          fontSize: '0.84375rem', 
                          fontWeight: 700, 
                          color: previewResult?.isConsistent ? 'hsl(145 55% 30%)' : 'hsl(32 75% 34%)' 
                        }}>
                          {previewResult?.isConsistent 
                            ? 'Status BWM: KONSISTEN (Memenuhi Standar Ilmiah)' 
                            : 'Status BWM: PERLU PENYESUAIAN NILAI (Rasio CR ≥ 0.10)'}
                        </div>
                        <span style={{ fontSize: '0.71875rem', color: 'hsl(var(--muted-foreground))' }}>
                          {previewResult?.isConsistent 
                            ? 'Nilai perbandingan konsisten secara matematis (CR ≤ 0.10) sesuai kaidah Jafar Rezaei.' 
                            : 'Nilai perbandingan memiliki deviasi preferensi yang cukup tinggi. Disarankan disesuaikan.'}
                        </span>
                      </div>
                    </div>

                    {previewResult && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <div className="bwm-metric-pill">
                          <span style={{ color: 'hsl(var(--muted-foreground))' }}>CR:</span>
                          <strong style={{ color: previewResult.isConsistent ? 'hsl(145 60% 35%)' : 'hsl(32 80% 40%)' }}>
                            {previewResult.consistencyRatio.toFixed(3)}
                          </strong>
                        </div>
                        <div className="bwm-metric-pill">
                          <span style={{ color: 'hsl(var(--muted-foreground))' }}>ξ*:</span>
                          <strong>{previewResult.xi.toFixed(4)}</strong>
                        </div>
                        <div className="bwm-metric-pill">
                          <span style={{ color: 'hsl(var(--muted-foreground))' }}>a_BW:</span>
                          <strong>{previewResult.aBW}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {previewResult?.warnings && previewResult.warnings.length > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '6px', 
                      background: 'hsl(var(--card))', 
                      padding: '11px 14px', 
                      borderRadius: '8px', 
                      border: '1px solid hsl(38 50% 84% / 0.8)' 
                    }}>
                      <div style={{ fontSize: '0.71875rem', fontWeight: 700, color: 'hsl(32 75% 38%)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Info size={14} />
                        <span>Panduan Penyesuaian Nilai Agar Konsisten:</span>
                      </div>
                      {previewResult.warnings.map((warn, wIdx) => (
                        <div key={wIdx} style={{ fontSize: '0.71875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, paddingLeft: '4px' }}>
                          • {warn}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="modal-footer" style={{ flexShrink: 0, padding: '14px 22px', borderTop: '1px solid hsl(var(--border) / 0.7)', background: 'hsl(var(--card))', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsWizardOpen(false)} className="btn btn-outline btn-sm">
                  Batal
                </button>
                <button type="submit" disabled={isEvaluating} className="btn btn-primary btn-sm" style={{ background: 'hsl(217 75% 52%)', borderColor: 'hsl(217 75% 52%)' }}>
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
