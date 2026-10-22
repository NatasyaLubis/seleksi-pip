import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  Download,
  Calculator,
  RotateCw,
  Pencil,
  Calendar,
  X,
  Save,
  Building
} from 'lucide-react';

export default function DashboardView({
  period,
  totalStudents,
  criteria,
  decisionMakers,
  lastCalculation,
  setActiveTab,
  onUpdateQuota,
  onUpdatePeriod,
  onRunWASPAS,
  onExportExcel
}) {
  const [quotaInput, setQuotaInput] = useState(period ? period.target_quota : 50);
  const [isProcessing, setIsProcessing] = useState(false);

  // Editable Academic Year & Period Modal State
  const [isEditPeriodOpen, setIsEditPeriodOpen] = useState(false);
  const [academicYearInput, setAcademicYearInput] = useState(period?.academic_year || '2026/2027');
  const [periodNameInput, setPeriodNameInput] = useState(period?.name || 'Seleksi Penerimaan Bantuan PIP Tahun 2026');
  const [schoolNameInput, setSchoolNameInput] = useState(period?.school_name || 'SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG');
  const [isSavingPeriod, setIsSavingPeriod] = useState(false);

  useEffect(() => {
    if (period) {
      setQuotaInput(period.target_quota);
      setAcademicYearInput(period.academic_year || '2026/2027');
      setPeriodNameInput(period.name || 'Seleksi Penerimaan Bantuan PIP Tahun 2026');
      setSchoolNameInput(period.school_name || 'SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG');
    }
  }, [period]);

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    setIsProcessing(true);
    try {
      const q = parseInt(quotaInput, 10) || 50;
      if (onRunWASPAS) {
        await onRunWASPAS(q, period ? period.lambda : 0.5);
      } else if (onUpdateQuota) {
        await onUpdateQuota(q);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSavePeriod = async (e) => {
    e.preventDefault();
    if (!onUpdatePeriod) return;
    setIsSavingPeriod(true);
    try {
      await onUpdatePeriod({
        academic_year: academicYearInput.trim(),
        name: periodNameInput.trim(),
        school_name: schoolNameInput.trim()
      });
      setIsEditPeriodOpen(false);
    } finally {
      setIsSavingPeriod(false);
    }
  };

  const quota = period ? period.target_quota : 50;
  const passedCount = lastCalculation ? lastCalculation.passedCount : Math.min(totalStudents, quota);
  const backupCount = lastCalculation ? lastCalculation.backupCount : Math.max(0, totalStudents - quota);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header: Bersih & Minimalis */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'hsl(var(--foreground))', margin: 0 }}>
            Dashboard Seleksi PIP
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
            <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
              Tahun Ajaran <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{period?.academic_year || '2026/2027'}</span>
            </p>
            {onUpdatePeriod && (
              <button
                type="button"
                onClick={() => setIsEditPeriodOpen(true)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '2px 8px', fontSize: '0.6875rem', height: '24px', display: 'flex', alignItems: 'center', gap: '4px', color: 'hsl(var(--primary))' }}
                title="Klik untuk mengubah Tahun Ajaran atau Nama Periode Seleksi"
              >
                <Pencil size={11} />
                <span>Ubah Tahun Ajaran</span>
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="btn btn-outline btn-sm"
            >
              <Download size={14} />
              <span>Export Excel</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('waspas')}
            className="btn btn-primary btn-sm"
          >
            <Award size={14} />
            <span>Lihat Hasil Lengkap</span>
          </button>
        </div>
      </div>

      {/* 4 Kartu KPI Ringkas Ala Shadcn */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>
              Total Calon Siswa
            </span>
            <Users size={16} color="hsl(var(--muted-foreground))" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '6px', color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>
            {totalStudents}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
            Siswa terdaftar
          </span>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>
              Kuota Penerima
            </span>
            <Award size={16} color="hsl(var(--primary))" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '6px', color: 'hsl(var(--primary))', letterSpacing: '-0.02em' }}>
            {quota}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
            Batas kuota bantuan
          </span>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>
              Lolos Kuota
            </span>
            <CheckCircle2 size={16} color="hsl(var(--success))" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '6px', color: 'hsl(var(--success))', letterSpacing: '-0.02em' }}>
            {passedCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
            Peringkat 1 s/d {quota}
          </span>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>
              Cadangan
            </span>
            <Clock size={16} color="hsl(var(--warning))" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '6px', color: 'hsl(var(--warning))', letterSpacing: '-0.02em' }}>
            {backupCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
            Peringkat {quota + 1} ke bawah
          </span>
        </div>

      </div>

      {/* Pengaturan Kuota & Hitung Rangking: Bersih & Terpadu */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <form onSubmit={handleUpdate} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
              Atur Kuota:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="number"
                min="1"
                value={quotaInput}
                onChange={(e) => setQuotaInput(e.target.value)}
                className="form-input"
                style={{ width: '90px', textAlign: 'center', fontWeight: 700, padding: '4px 8px' }}
              />
              <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>Siswa</span>
            </div>

            {/* Quick preset buttons */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {[25, 50, 75, 100].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setQuotaInput(val)}
                  className={`btn btn-sm ${parseInt(quotaInput, 10) === val ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '2px 8px', fontSize: '0.6875rem', height: '26px' }}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="btn btn-primary btn-sm"
          >
            {isProcessing ? <RotateCw size={14} className="animate-spin" /> : <Calculator size={14} />}
            <span>{isProcessing ? 'Menghitung...' : 'Perbarui & Hitung Ranking'}</span>
          </button>
        </form>
      </div>

      {/* Pratinjau 5 Siswa Teratas: Tabel Rapi Tanpa Teks Panjang */}
      {lastCalculation && lastCalculation.rankings ? (
        <div className="card">
          <div className="card-header" style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="card-title" style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                5 Siswa Prioritas Teratas
              </h3>
            </div>
            <button onClick={() => setActiveTab('waspas')} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>
              <span>Lihat Semua ({lastCalculation.rankings.length})</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Rank</th>
                  <th style={{ width: '120px' }}>NISN</th>
                  <th>Nama Lengkap</th>
                  <th style={{ width: '90px' }}>Kelas</th>
                  <th>Nama Wali</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>Skor</th>
                  <th style={{ width: '150px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {lastCalculation.rankings.slice(0, 5).map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong style={{ fontSize: '0.875rem', color: 'hsl(var(--foreground))' }}>
                        #{r.rank}
                      </strong>
                    </td>
                    <td className="code-num">{r.nisn}</td>
                    <td style={{ fontWeight: 600 }}>{r.nama_lengkap}</td>
                    <td>{r.kelas}</td>
                    <td style={{ color: 'hsl(var(--muted-foreground))' }}>{r.nama_wali || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'hsl(var(--primary))' }}>
                      {(r.waspasScore * 100).toFixed(1)}%
                    </td>
                    <td>
                      <span className="badge badge-passed">
                        <CheckCircle2 size={12} />
                        <span>Lolos Kuota</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '36px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', margin: '0 0 12px 0' }}>
            {totalStudents === 0
              ? 'Belum ada data siswa di dalam sistem. Silakan tambahkan data siswa untuk memulai seleksi.'
              : `${totalStudents} siswa terdaftar. Klik tombol "Perbarui & Hitung Ranking" di atas untuk memproses seleksi.`}
          </p>
          {totalStudents === 0 && (
            <button
              onClick={() => setActiveTab('students')}
              className="btn btn-primary btn-sm"
              style={{ margin: '0 auto' }}
            >
              <Users size={14} />
              <span>Buka Menu Data Siswa</span>
            </button>
          )}
        </div>
      )}

      {/* Modal Pengaturan Periode & Tahun Ajaran Seleksi */}
      {isEditPeriodOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                    Ubah Tahun Ajaran & Periode Seleksi
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                    Sesuaikan tahun ajaran aktif dan judul dokumen usulan seleksi PIP
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditPeriodOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePeriod}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* Tahun Ajaran */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Tahun Ajaran <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={academicYearInput}
                    onChange={(e) => setAcademicYearInput(e.target.value)}
                    className="form-input"
                    placeholder="Contoh: 2026/2027"
                    required
                  />
                  {/* Preset Pills */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))' }}>Pilihan Cepat:</span>
                    {['2024/2025', '2025/2026', '2026/2027', '2027/2028'].map(yr => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => {
                          setAcademicYearInput(yr);
                          const startYear = yr.split('/')[0];
                          setPeriodNameInput(`Seleksi Penerimaan Bantuan PIP Tahun ${startYear}`);
                        }}
                        className={`btn btn-sm ${academicYearInput === yr ? 'btn-primary' : 'btn-outline'}`}
                        style={{ padding: '2px 8px', fontSize: '0.6875rem', height: '24px' }}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nama Periode Seleksi */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Nama Periode Seleksi PIP <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={periodNameInput}
                    onChange={(e) => setPeriodNameInput(e.target.value)}
                    className="form-input"
                    placeholder="Contoh: Seleksi Penerimaan Bantuan PIP Tahun 2026"
                    required
                  />
                  <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', marginTop: '4px', display: 'block' }}>
                    Nama ini akan tercantum di judul Berita Acara, laporan usulan, dan file export Excel.
                  </span>
                </div>

                {/* Nama Sekolah */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Nama Asal Sekolah
                  </label>
                  <input
                    type="text"
                    value={schoolNameInput}
                    onChange={(e) => setSchoolNameInput(e.target.value)}
                    className="form-input"
                    placeholder="Nama Sekolah Lengkap"
                  />
                </div>

              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '12px 18px', borderTop: '1px solid hsl(var(--border))' }}>
                <button
                  type="button"
                  onClick={() => setIsEditPeriodOpen(false)}
                  className="btn btn-outline btn-sm"
                  disabled={isSavingPeriod}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSavingPeriod}
                >
                  <Save size={14} />
                  <span>{isSavingPeriod ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
