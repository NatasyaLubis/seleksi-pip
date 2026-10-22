import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Sparkles
} from 'lucide-react';

export default function StudentsView({
  students,
  criteria,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onClearAll,
  onGenerateSamples,
  onDownloadTemplate,
  onPreviewImport,
  onCommitImport,
  isDemoMode
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Single Student Modal State
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [nisn, setNisn] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [kelas, setKelas] = useState('');
  const [asalSekolah, setAsalSekolah] = useState('SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG');
  const [namaWali, setNamaWali] = useState('');
  const [alamat, setAlamat] = useState('');
  const [values, setValues] = useState({});

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [importMode, setImportMode] = useState('replace'); // 'replace' or 'append'

  const [classFilter, setClassFilter] = useState('ALL');

  // Available classes dynamically extracted from loaded students
  const { classOptions, gradeCounts } = useMemo(() => {
    const classMap = {};
    const gradeMap = { X: 0, XI: 0, XII: 0 };

    students.forEach(s => {
      const k = (s.kelas || '').trim();
      if (!k) return;
      classMap[k] = (classMap[k] || 0) + 1;

      const upper = k.toUpperCase();
      if (upper.startsWith('XII') || upper.startsWith('12')) {
        gradeMap.XII += 1;
      } else if (upper.startsWith('XI') || upper.startsWith('11')) {
        gradeMap.XI += 1;
      } else if (upper.startsWith('X') || upper.startsWith('10')) {
        gradeMap.X += 1;
      }
    });

    const uniqueClasses = Object.keys(classMap).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );

    return {
      classOptions: uniqueClasses.map(cls => ({ name: cls, count: classMap[cls] })),
      gradeCounts: gradeMap
    };
  }, [students]);

  // Filter students
  const filteredStudents = useMemo(() => {
    let result = students;
    if (classFilter !== 'ALL') {
      if (classFilter === 'TINGKAT-X') {
        result = result.filter(s => {
          const u = (s.kelas || '').toUpperCase();
          return (u.startsWith('X') && !u.startsWith('XI') && !u.startsWith('XII')) || u.startsWith('10');
        });
      } else if (classFilter === 'TINGKAT-XI') {
        result = result.filter(s => {
          const u = (s.kelas || '').toUpperCase();
          return (u.startsWith('XI') && !u.startsWith('XII')) || u.startsWith('11');
        });
      } else if (classFilter === 'TINGKAT-XII') {
        result = result.filter(s => {
          const u = (s.kelas || '').toUpperCase();
          return u.startsWith('XII') || u.startsWith('12');
        });
      } else {
        result = result.filter(s => (s.kelas || '').trim() === classFilter);
      }
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.nama_lengkap.toLowerCase().includes(term) ||
        s.nisn.toLowerCase().includes(term) ||
        s.kelas.toLowerCase().includes(term) ||
        (s.asal_sekolah && s.asal_sekolah.toLowerCase().includes(term)) ||
        (s.nama_wali && s.nama_wali.toLowerCase().includes(term))
      );
    }
    return result;
  }, [students, searchTerm, classFilter]);

  // Open Add Student Modal
  const openAddStudentModal = () => {
    setEditingStudent(null);
    setNisn('');
    setNamaLengkap('');
    setKelas('X-TKJ');
    setAsalSekolah('SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG');
    setNamaWali('');
    setAlamat('');
    const initVals = {};
    criteria.forEach(c => {
      initVals[c.code] = c.value_type === 'discrete_scale' ? 3 : (c.code === 'C1' ? 800000 : 100);
    });
    setValues(initVals);
    setIsStudentModalOpen(true);
  };

  // Open Edit Student Modal
  const openEditStudentModal = (std) => {
    setEditingStudent(std);
    setNisn(std.nisn);
    setNamaLengkap(std.nama_lengkap);
    setKelas(std.kelas);
    setAsalSekolah(std.asal_sekolah || 'SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG');
    setNamaWali(std.nama_wali || '');
    setAlamat(std.alamat || '');
    setValues({ ...std.values });
    setIsStudentModalOpen(true);
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nisn,
      nama_lengkap: namaLengkap,
      kelas,
      asal_sekolah: asalSekolah || 'SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG',
      nama_wali: namaWali,
      alamat,
      values
    };

    if (editingStudent) {
      await onUpdateStudent(editingStudent.id, payload);
    } else {
      await onAddStudent(payload);
    }
    setIsStudentModalOpen(false);
  };

  // File Upload Handler
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportFile(file);
    setIsParsing(true);
    setImportPreview(null);

    try {
      const res = await onPreviewImport(file);
      if (res && res.success) {
        setImportPreview(res);
      } else {
        alert('Gagal membaca file: ' + (res.message || 'Format tidak sesuai'));
      }
    } catch (err) {
      alert('Error import: ' + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleCommit = async () => {
    if (!importPreview || !importPreview.validRowsPayload || importPreview.validRowsPayload.length === 0) {
      return alert('Tidak ada baris valid yang dapat diimpor.');
    }

    setIsCommitting(true);
    try {
      await onCommitImport(importPreview.validRowsPayload, importMode);
      setIsImportModalOpen(false);
      setImportPreview(null);
      setImportFile(null);
    } catch (err) {
      alert('Gagal menyimpan data impor: ' + err.message);
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'hsl(var(--foreground))', margin: 0 }}>
              Data Calon Siswa Penerima PIP
            </h1>
            <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
              {students.length} Siswa Terdata
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>
            Kelola data siswa yang akan diseleksi. Anda dapat menambah manual atau upload file Excel (bisa lebih dari 100 siswa).
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={onDownloadTemplate} className="btn btn-outline btn-sm" title="Unduh contoh format file Excel untuk pengisian data">
            <Download size={14} />
            <span>Format Excel</span>
          </button>
          <button onClick={() => { setImportPreview(null); setImportFile(null); setIsImportModalOpen(true); }} className="btn btn-outline btn-sm">
            <Upload size={14} />
            <span>Upload File Excel</span>
          </button>
          <button onClick={openAddStudentModal} className="btn btn-primary btn-sm">
            <Plus size={14} />
            <span>Tambah Siswa Manual</span>
          </button>
        </div>
      </div>

      {/* Control & Quick Action Bar */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          {/* Search & Class Filter */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={16} color="var(--slate-400)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Cari nama, NISN, kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '36px' }}
              />
            </div>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="form-select"
              style={{ width: '190px', fontSize: '0.8125rem' }}
            >
              <option value="ALL">Semua Kelas ({students.length})</option>
              {(gradeCounts.X > 0 || gradeCounts.XI > 0 || gradeCounts.XII > 0) && (
                <optgroup label="Filter Tingkat">
                  {gradeCounts.X > 0 && <option value="TINGKAT-X">Tingkat X ({gradeCounts.X} siswa)</option>}
                  {gradeCounts.XI > 0 && <option value="TINGKAT-XI">Tingkat XI ({gradeCounts.XI} siswa)</option>}
                  {gradeCounts.XII > 0 && <option value="TINGKAT-XII">Tingkat XII ({gradeCounts.XII} siswa)</option>}
                </optgroup>
              )}
              {classOptions.length > 0 && (
                <optgroup label="Kelas Terdaftar">
                  {classOptions.map(cls => (
                    <option key={cls.name} value={cls.name}>{cls.name} ({cls.count} siswa)</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Quick Demo Generation & Clear Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isDemoMode && (
              <button
                onClick={() => onGenerateSamples(120)}
                className="btn btn-secondary btn-sm"
                title="Isi otomatis 120 data siswa realistis untuk pengujian sistem"
              >
                <Sparkles size={14} color="#6366f1" />
                <span>Isi Otomatis 120 Data Contoh</span>
              </button>
            )}
            <button
              onClick={onClearAll}
              className="btn btn-danger btn-sm"
              disabled={students.length === 0}
            >
              <Trash2 size={14} />
              <span>Kosongkan Semua Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Daftar Alternatif Siswa ({filteredStudents.length} Data)</h3>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
              Menampilkan seluruh {filteredStudents.length} data siswa terdaftar
            </span>
          </div>
        </div>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '45px', textAlign: 'center' }}>No</th>
                <th style={{ width: '105px' }}>NISN</th>
                <th style={{ minWidth: '150px' }}>Nama Lengkap Siswa</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Kelas</th>
                <th style={{ minWidth: '120px' }}>Nama Wali</th>
                {criteria.map(c => (
                  <th key={c.code} style={{ width: '85px', textAlign: 'right' }} title={`${c.code}: ${c.name} (${c.type.toUpperCase()})`}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span className="code-num" style={{ fontWeight: 700 }}>{c.code}</span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--slate-500)', fontWeight: 500 }}>
                        {c.type.toUpperCase()}
                      </span>
                    </div>
                  </th>
                ))}
                <th style={{ width: '75px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6 + criteria.length} style={{ textAlign: 'center', padding: '36px', color: 'hsl(var(--muted-foreground))' }}>
                    Tidak ada data siswa yang cocok dengan pencarian atau data masih kosong.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const rowNumber = idx + 1;
                  return (
                    <tr key={s.id}>
                      <td style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '0.75rem' }}>{rowNumber}</td>
                      <td className="code-num">{s.nisn}</td>
                      <td style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{s.nama_lengkap}</td>
                      <td style={{ textAlign: 'center' }}>{s.kelas}</td>
                      <td style={{ color: 'hsl(var(--muted-foreground))' }}>{s.nama_wali || '-'}</td>
                      {criteria.map(c => {
                        const val = s.values ? s.values[c.code] : '-';
                        return (
                          <td key={c.code} style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                            {c.code === 'C1' && typeof val === 'number'
                              ? `Rp ${val.toLocaleString('id-ID')}`
                              : val}
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          <button onClick={() => openEditStudentModal(s)} className="btn btn-outline btn-sm" style={{ padding: '4px 6px' }}>
                            <Edit size={12} />
                          </button>
                          <button onClick={() => onDeleteStudent(s.id, s.nama_lengkap)} className="btn btn-danger btn-sm" style={{ padding: '4px 6px' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info: Menampilkan Keseluruhan Data */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--muted) / 0.25)' }}>
          <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
            Menampilkan seluruh <strong>{filteredStudents.length}</strong> data siswa {classFilter !== 'ALL' ? `(Filter: ${classFilter})` : ''}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
            Total Terdaftar: <strong>{students.length}</strong> Siswa
          </span>
        </div>
      </div>

      {/* Modal Add / Edit Single Student */}
      {isStudentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                {editingStudent ? `Edit Data Siswa: ${editingStudent.nama_lengkap}` : 'Tambah Data Siswa Calon Penerima PIP'}
              </h3>
              <button onClick={() => setIsStudentModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleStudentSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">NISN Siswa</label>
                    <input
                      type="text"
                      value={nisn}
                      onChange={(e) => setNisn(e.target.value)}
                      placeholder="Contoh: 3084120001"
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nama Lengkap Siswa</label>
                    <input
                      type="text"
                      value={namaLengkap}
                      onChange={(e) => setNamaLengkap(e.target.value)}
                      placeholder="Nama lengkap sesuai raport"
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Kelas</label>
                    <input
                      type="text"
                      list="smk-classes"
                      value={kelas}
                      onChange={(e) => setKelas(e.target.value)}
                      placeholder="Pilih atau ketik kelas (mis: X-MM)"
                      className="form-input"
                      required
                    />
                    <datalist id="smk-classes">
                      <option value="X-MM">X-MM (Multimedia)</option>
                      <option value="X-AKL">X-AKL (Akuntansi & Keuangan Lembaga)</option>
                      <option value="X-OTKP">X-OTKP (Otomatisasi & Tata Kelola Perkantoran)</option>
                      <option value="X-BDP">X-BDP (Bisnis Daring & Pemasaran)</option>
                      <option value="XI-MM">XI-MM (Multimedia)</option>
                      <option value="XI-AKL">XI-AKL (Akuntansi & Keuangan Lembaga)</option>
                      <option value="XI-OTKP">XI-OTKP (Otomatisasi & Tata Kelola Perkantoran)</option>
                      <option value="XI-BDP">XI-BDP (Bisnis Daring & Pemasaran)</option>
                      <option value="XII-MM">XII-MM (Multimedia)</option>
                      <option value="XII-AKL">XII-AKL (Akuntansi & Keuangan Lembaga)</option>
                      <option value="XII-OTKP">XII-OTKP (Otomatisasi & Tata Kelola Perkantoran)</option>
                      <option value="XII-BDP">XII-BDP (Bisnis Daring & Pemasaran)</option>
                    </datalist>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Asal Sekolah</label>
                  <input
                    type="text"
                    value={asalSekolah}
                    onChange={(e) => setAsalSekolah(e.target.value)}
                    placeholder="SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG"
                    className="form-input"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nama Orang Tua / Wali</label>
                    <input
                      type="text"
                      value={namaWali}
                      onChange={(e) => setNamaWali(e.target.value)}
                      placeholder="Nama ayah/ibu/wali"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Alamat Domisili</label>
                    <input
                      type="text"
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                      placeholder="Jl. Melati No. 12"
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <label className="form-label" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--indigo-600)', marginBottom: '12px' }}>
                    Penilaian Nilai Kriteria Alternatif
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                    {criteria.map(c => {
                      const isScale = c.value_type === 'discrete_scale';
                      return (
                        <div key={c.code} className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{c.code} - {c.name}</span>
                            <span className={`badge ${c.type === 'benefit' ? 'badge-benefit' : 'badge-cost'}`}>
                              {c.type.toUpperCase()}
                            </span>
                          </label>
                          {isScale ? (
                            <select
                              value={values[c.code] || 3}
                              onChange={(e) => setValues({ ...values, [c.code]: parseInt(e.target.value, 10) })}
                              className="form-select"
                            >
                              {c.options && c.options.map(o => (
                                <option key={o.point} value={o.point}>
                                  Poin {o.point}: {o.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="number"
                              step="any"
                              value={values[c.code] !== undefined ? values[c.code] : ''}
                              onChange={(e) => setValues({ ...values, [c.code]: parseFloat(e.target.value) })}
                              placeholder={`Nilai riil (${c.unit || ''})`}
                              className="form-input"
                              required
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsStudentModalOpen(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  <span>{editingStudent ? 'Simpan Perubahan' : 'Tambahkan Siswa'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Bulk Excel/CSV Import & Validation */}
      {isImportModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileSpreadsheet size={22} color="#059669" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                  Import Massal Data Siswa Calon PIP (&gt;100 Alternatif)
                </h3>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Upload Dropzone */}
              <div style={{ border: '2px dashed var(--slate-300)', borderRadius: '10px', padding: '24px', textAlign: 'center', background: 'var(--slate-50)' }}>
                <Upload size={32} color="var(--indigo-600)" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-800)' }}>
                  Pilih Berkas Excel (.xlsx / .xls) atau .csv
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', marginTop: '4px', marginBottom: '16px' }}>
                  Sistem akan memvalidasi kelengkapan kolom kriteria dan mengecek apakah data valid sebelum disimpan.
                </p>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  id="excelFileInput"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="excelFileInput" className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                  <span>Pilih Berkas dari Komputer</span>
                </label>
                {importFile && (
                  <div style={{ marginTop: '12px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-700)' }}>
                    Berkas terpilih: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              {/* Parsing Loading State */}
              {isParsing && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--slate-600)' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <span>Sedang memvalidasi struktur data dan format angka kriteria...</span>
                </div>
              )}

              {/* Validation Summary & Error Report */}
              {importPreview && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Summary Badges */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div style={{ padding: '12px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Baris Terbaca</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                        {importPreview.summary.totalRowsParsed}
                      </div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', background: '#ecfdf5', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#047857' }}>Baris Valid Siap Impor</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
                        {importPreview.summary.validCount}
                      </div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', background: importPreview.summary.errorCount > 0 ? '#fff1f2' : '#f8fafc', border: `1px solid ${importPreview.summary.errorCount > 0 ? '#fecdd3' : '#e2e8f0'}`, textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: importPreview.summary.errorCount > 0 ? '#e11d48' : '#64748b' }}>Baris Ditolak / Error</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: importPreview.summary.errorCount > 0 ? '#e11d48' : '#64748b' }}>
                        {importPreview.summary.errorCount}
                      </div>
                    </div>
                  </div>

                  {/* Errors Report if any */}
                  {importPreview.errors && importPreview.errors.length > 0 && (
                    <div style={{ border: '1px solid #fecdd3', borderRadius: '8px', background: '#fff1f2', padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#be123c', fontWeight: 700, fontSize: '0.875rem', marginBottom: '8px' }}>
                        <AlertCircle size={18} />
                        <span>Daftar Baris Tidak Sesuai ({importPreview.errors.length} Baris):</span>
                      </div>
                      <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {importPreview.errors.map((err, idx) => (
                          <div key={idx} style={{ fontSize: '0.75rem', color: '#9f1239', background: 'white', padding: '6px 10px', borderRadius: '4px', border: '1px solid #fecdd3' }}>
                            <strong>Baris {err.rowNumber} (NISN: {err.nisn}):</strong> {err.errorReasons.join('; ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Import Mode Radio */}
                  <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--slate-50)', border: '1px solid var(--slate-200)' }}>
                    <label className="form-label" style={{ marginBottom: '8px' }}>Pilihan Metode Penyimpanan:</label>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={(e) => setImportMode(e.target.value)}
                        />
                        <span><strong>Timpa Semua Data</strong> (Kosongkan data lama & gunakan data baru ini)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="importMode"
                          value="append"
                          checked={importMode === 'append'}
                          onChange={(e) => setImportMode(e.target.value)}
                        />
                        <span><strong>Tambahkan Data Baru</strong> (Abaikan NISN yang sudah terdaftar)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setIsImportModalOpen(false)} className="btn btn-secondary">
                Batal
              </button>
              <button
                onClick={handleCommit}
                disabled={!importPreview || importPreview.summary.validCount === 0 || isCommitting}
                className="btn btn-primary"
              >
                <CheckCircle2 size={16} />
                <span>{isCommitting ? 'Menyimpan ke Sistem...' : `Simpan ${importPreview ? importPreview.summary.validCount : 0} Data Siswa Valid`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
