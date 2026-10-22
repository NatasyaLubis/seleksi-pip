import React, { useState, useMemo } from 'react';
import { Printer, Download, CheckCircle2, FileSpreadsheet, Filter } from 'lucide-react';

export default function ReportView({ calculation, period, decisionMakers, criteria, onExportExcel }) {
  const [classFilter, setClassFilter] = useState('ALL');

  const handlePrint = () => {
    window.print();
  };

  const hasCalc = calculation && calculation.rankings;
  const allPassedStudents = hasCalc ? calculation.rankings.filter(r => r.quotaStatus === 'passed_quota') : [];

  // Dynamic class options and grade counts extracted from passed students
  const { classOptions, gradeCounts } = useMemo(() => {
    const classMap = {};
    const gradeMap = { X: 0, XI: 0, XII: 0 };

    allPassedStudents.forEach(s => {
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
  }, [allPassedStudents]);

  // Filtered passed students by class
  const passedStudents = useMemo(() => {
    if (classFilter === 'ALL') return allPassedStudents;
    if (classFilter === 'TINGKAT-X') {
      return allPassedStudents.filter(s => {
        const u = (s.kelas || '').toUpperCase();
        return (u.startsWith('X') && !u.startsWith('XI') && !u.startsWith('XII')) || u.startsWith('10');
      });
    }
    if (classFilter === 'TINGKAT-XI') {
      return allPassedStudents.filter(s => {
        const u = (s.kelas || '').toUpperCase();
        return (u.startsWith('XI') && !u.startsWith('XII')) || u.startsWith('11');
      });
    }
    if (classFilter === 'TINGKAT-XII') {
      return allPassedStudents.filter(s => {
        const u = (s.kelas || '').toUpperCase();
        return u.startsWith('XII') || u.startsWith('12');
      });
    }
    return allPassedStudents.filter(s => (s.kelas || '').trim() === classFilter);
  }, [allPassedStudents, classFilter]);

  // Determine year dynamically from period name
  const matchYear = (period && period.name) ? period.name.match(/\b(20\d{2})\b/) : null;
  const year = matchYear ? matchYear[1] : new Date().getFullYear();
  const documentTitle = classFilter === 'ALL'
    ? `USULAN NAMA SISWA CALON PENERIMA PIP ${year}`
    : `USULAN NAMA SISWA CALON PENERIMA PIP ${year} (${classFilter.startsWith('TINGKAT-') ? classFilter.replace('TINGKAT-', 'TINGKAT ') : `KELAS ${classFilter}`})`;
  const schoolName = (period && period.school_name) || 'SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Action Bar (hidden when printing) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'hsl(var(--foreground))', margin: 0 }}>
            Berita Acara & Laporan Usulan PIP
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: '2px 0 0 0' }}>
            Dokumen resmi usulan penetapan nama siswa penerima bantuan PIP
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Filter Kelas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="hsl(var(--muted-foreground))" />
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="form-select"
              style={{ width: '180px', padding: '6px 10px', fontSize: '0.8125rem' }}
              disabled={!hasCalc}
            >
              <option value="ALL">Semua Kelas ({allPassedStudents.length})</option>
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

          <button onClick={onExportExcel} className="btn btn-outline btn-sm" disabled={!hasCalc}>
            <Download size={14} />
            <span>Unduh Excel Usulan ({year})</span>
          </button>
          <button onClick={handlePrint} className="btn btn-primary btn-sm" disabled={!hasCalc}>
            <Printer size={14} />
            <span>Cetak Dokumen</span>
          </button>
        </div>
      </div>

      {/* Official Printable Document Container */}
      <div className="card" style={{ padding: '36px 40px', background: 'white', color: '#0f172a', maxWidth: '960px', margin: '0 auto', width: '100%', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
        
        {/* Formal School Letterhead */}
        <div style={{ borderBottom: '3px double #0f172a', paddingBottom: '14px', marginBottom: '20px', textAlign: 'center' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.04em', color: '#334155', textTransform: 'uppercase', margin: 0 }}>
            PEMERINTAH DAERAH PROVINSI SUMATERA UTARA
          </h4>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '0.02em', color: '#0f172a', textTransform: 'uppercase', margin: '2px 0 0 0' }}>
            DINAS PENDIDIKAN DAN KEBUDAYAAN
          </h3>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: '3px 0 0 0' }}>
            {schoolName.toUpperCase()}
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#475569', margin: '3px 0 0 0' }}>
            Jl. Sisingamangaraja No. 192, Pasar Siborong-Borong, Kec. Siborongborong, Kab. Tapanuli Utara, Sumatera Utara • Kode Pos: 22474
          </p>
        </div>

        {/* Document Title (Requested Exact Format) */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, textTransform: 'uppercase', textDecoration: 'underline', margin: 0 }}>
            {documentTitle}
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#475569', margin: '4px 0 0 0' }}>
            Lampiran Berita Acara Nomor: 421.2 / 084 / SPK-PIP / {year}
          </p>
        </div>

        {/* Narrative Intro */}
        <div style={{ fontSize: '0.8125rem', lineHeight: '1.6', color: '#1e293b', marginBottom: '16px', textAlign: 'justify' }}>
          Berdasarkan hasil seleksi dan verifikasi kelayakan calon penerima Program Indonesia Pintar (PIP) Tahun Anggaran {year} melalui Sistem Pendukung Keputusan (SPK) dengan metode BWM dan WASPAS, berikut disampaikan daftar siswa yang diusulkan memenuhi alokasi kuota penerima bantuan:
        </div>

        {/* Main Table: NO, NISN, NAMA SISWA, KELAS, ASAL SEKOLAH */}
        <div style={{ marginBottom: '28px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ border: '1px solid #cbd5e1', padding: '7px 6px', textAlign: 'center', width: '42px', fontWeight: 700 }}>NO</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '7px 8px', textAlign: 'left', width: '115px', fontWeight: 700 }}>NISN</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '7px 10px', textAlign: 'left', minWidth: '170px', fontWeight: 700 }}>NAMA SISWA</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '7px 8px', textAlign: 'center', width: '85px', fontWeight: 700 }}>KELAS</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '7px 10px', textAlign: 'left', minWidth: '200px', fontWeight: 700 }}>ASAL SEKOLAH</th>
              </tr>
            </thead>
            <tbody>
              {!hasCalc || passedStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ border: '1px solid #cbd5e1', padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    Belum ada data siswa yang lolos seleksi {classFilter !== 'ALL' ? `untuk kelas ${classFilter}` : ''}. Silakan sesuaikan filter atau jalankan ranking.
                  </td>
                </tr>
              ) : (
                passedStudents.map((s, idx) => (
                  <tr key={s.id} style={{ background: idx % 2 === 1 ? '#f8fafc' : 'white' }}>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 6px', textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', fontFamily: 'monospace' }}>{s.nisn}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 600 }}>{s.nama_lengkap}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center' }}>{s.kelas}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}>{s.asal_sekolah || schoolName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Formal Signatures Section */}
        <div style={{ marginTop: '28px', pageBreakInside: 'avoid' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#0f172a' }}>
            <div></div>
            <div style={{ textAlign: 'center', minWidth: '220px' }}>
              <div>Ditetapkan pada tanggal: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '16px', textAlign: 'center', fontSize: '0.8125rem' }}>
            {decisionMakers && decisionMakers.length > 0 ? (
              decisionMakers.map((dm, idx) => (
                <div key={dm.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '110px' }}>
                  <div style={{ fontWeight: 600, color: '#334155' }}>
                    {idx === 0 ? 'Mengetahui,' : 'Tim Verifikator,'}
                    <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>{dm.title}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, textDecoration: 'underline' }}>{dm.name}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>NIP. 19780512 200501 1 00{idx + 1}</div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '110px' }}>
                  <div>Operator PIP Sekolah</div>
                  <div style={{ fontWeight: 700, textDecoration: 'underline' }}>Ahmad Fauzi, S.Kom</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '110px' }}>
                  <div>Waka Kesiswaan</div>
                  <div style={{ fontWeight: 700, textDecoration: 'underline' }}>Siti Rahmawati, S.Pd</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '110px' }}>
                  <div>Kepala Sekolah</div>
                  <div style={{ fontWeight: 700, textDecoration: 'underline' }}>Drs. H. Mulyadi, M.Pd</div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
