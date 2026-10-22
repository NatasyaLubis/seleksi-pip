import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  X,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function CriteriaView({ criteria, onAddCriterion, onUpdateCriterion, onDeleteCriterion }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState(null);
  const [showScaleDetails, setShowScaleDetails] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('benefit');
  const [valueType, setValueType] = useState('real_numeric');
  const [unit, setUnit] = useState('');
  const [options, setOptions] = useState([
    { point: 1, label: 'Sangat Rendah' },
    { point: 2, label: 'Rendah' },
    { point: 3, label: 'Sedang' },
    { point: 4, label: 'Tinggi' },
    { point: 5, label: 'Sangat Tinggi' }
  ]);

  const openAddModal = () => {
    setEditingCriterion(null);
    setCode(`C${criteria.length + 1}`);
    setName('');
    setType('benefit');
    setValueType('real_numeric');
    setUnit('');
    setOptions([
      { point: 1, label: 'Sangat Rendah' },
      { point: 2, label: 'Rendah' },
      { point: 3, label: 'Sedang' },
      { point: 4, label: 'Tinggi' },
      { point: 5, label: 'Sangat Tinggi' }
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (crit) => {
    setEditingCriterion(crit);
    setCode(crit.code);
    setName(crit.name);
    setType(crit.type);
    setValueType(crit.value_type);
    setUnit(crit.unit || '');
    setOptions(crit.options && crit.options.length > 0 ? crit.options : [
      { point: 1, label: 'Tingkat 1' },
      { point: 2, label: 'Tingkat 2' },
      { point: 3, label: 'Tingkat 3' },
      { point: 4, label: 'Tingkat 4' },
      { point: 5, label: 'Tingkat 5' }
    ]);
    setIsModalOpen(true);
  };

  const handleOptionChange = (index, newLabel) => {
    const updated = [...options];
    updated[index].label = newLabel;
    setOptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Nama kriteria wajib diisi.');

    const payload = {
      code,
      name,
      type,
      value_type: valueType,
      unit: unit || (valueType === 'discrete_scale' ? 'Skala 1-5' : 'Poin'),
      description: '',
      options: valueType === 'discrete_scale' ? options : null
    };

    if (editingCriterion) {
      await onUpdateCriterion(editingCriterion.id, payload);
    } else {
      await onAddCriterion(payload);
    }
    setIsModalOpen(false);
  };

  const totalWeight = criteria.reduce((sum, c) => sum + (parseFloat(c.final_weight) || 0), 0);
  const scaleCriteria = criteria.filter(c => c.value_type === 'discrete_scale');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Header Bar: Bersih & Minimalis */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'hsl(var(--foreground))', margin: 0 }}>
            Kriteria Seleksi
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: '2px 0 0 0' }}>
            Daftar kriteria penilaian kelayakan penerima PIP
          </p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary btn-sm">
          <Plus size={14} />
          <span>Tambah Kriteria</span>
        </button>
      </div>

      {/* Tabel Kriteria: Sangat Simpel & To The Point */}
      <div className="card">
        <div className="card-header" style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title" style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
            Daftar Kriteria ({criteria.length})
          </h3>
          <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
            Total Bobot: <strong style={{ color: 'hsl(var(--primary))' }}>{(totalWeight * 100).toFixed(1)}%</strong>
          </div>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Kode</th>
                <th>Nama Kriteria</th>
                <th style={{ width: '130px' }}>Sifat</th>
                <th style={{ width: '130px' }}>Satuan</th>
                <th style={{ width: '110px', textAlign: 'right' }}>Bobot</th>
                <th style={{ width: '90px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {criteria.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px 20px', color: 'hsl(var(--muted-foreground))' }}>
                    Belum ada data kriteria seleksi. Silakan klik tombol <strong>"Tambah Kriteria"</strong> di atas untuk menginput kriteria penilaian PIP secara mandiri.
                  </td>
                </tr>
              ) : (
                criteria.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="code-num" style={{ fontWeight: 700 }}>{c.code}</span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                      {c.name}
                    </td>
                    <td>
                      <span className={`badge ${c.type === 'benefit' ? 'badge-benefit' : 'badge-cost'}`}>
                        {c.type === 'benefit' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        <span>{c.type.toUpperCase()}</span>
                      </span>
                    </td>
                    <td style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.8125rem' }}>
                      {c.unit || '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'hsl(var(--primary))' }}>
                      {((parseFloat(c.final_weight || 0)) * 100).toFixed(1)}%
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <button 
                          onClick={() => openEditModal(c)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px' }}
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => onDeleteCriterion(c.id, c.code, c.name)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px', color: 'hsl(var(--destructive))' }}
                          title="Hapus"
                          disabled={criteria.length <= 2}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rincian Skala Nilai 1-5 (Menu Buka-Tutup Bersih) */}
      {scaleCriteria.length > 0 && (
        <div className="card">
          <button 
            onClick={() => setShowScaleDetails(!showScaleDetails)}
            style={{
              width: '100%',
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
              Lihat Keterangan Skala Nilai (1 s/d 5)
            </span>
            {showScaleDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showScaleDetails && (
            <div style={{ padding: '0 18px 16px 18px', borderTop: '1px solid hsl(var(--border))' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '14px' }}>
                {scaleCriteria.map(c => (
                  <div key={c.id} style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', padding: '12px', background: 'hsl(var(--muted) / 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '0.8125rem' }}>{c.code} - {c.name}</strong>
                      <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>{c.type.toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {c.options && c.options.map(opt => (
                        <div key={opt.point} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                          <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            {opt.point}
                          </span>
                          <span style={{ color: 'hsl(var(--muted-foreground))' }}>{opt.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Tambah / Edit Kriteria: Bersih & Cepat */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                {editingCriterion ? `Edit Kriteria ${editingCriterion.code}` : 'Tambah Kriteria Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Kode</label>
                    <input 
                      type="text" 
                      value={code} 
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="form-input" 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nama Kriteria</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Penghasilan Orang Tua"
                      className="form-input" 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Sifat Kriteria</label>
                    <select value={type} onChange={(e) => setType(e.target.value)} className="form-select">
                      <option value="benefit">Benefit (Makin Besar Makin Bagus)</option>
                      <option value="cost">Cost (Makin Kecil Makin Bagus)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Format Pengisian</label>
                    <select value={valueType} onChange={(e) => setValueType(e.target.value)} className="form-select">
                      <option value="real_numeric">Angka Riil (Uang/Jumlah)</option>
                      <option value="discrete_scale">Pilihan Skala (1 s/d 5)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Satuan Nilai</label>
                  <input 
                    type="text" 
                    value={unit} 
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Contoh: Rupiah, Orang, VA, Skala 1-5"
                    className="form-input" 
                  />
                </div>

                {/* Sub-kriteria jika memilih Skala 1-5 */}
                {valueType === 'discrete_scale' && (
                  <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', padding: '12px', background: 'hsl(var(--muted) / 0.3)' }}>
                    <label className="form-label" style={{ marginBottom: '8px' }}>
                      Keterangan Poin 1 s/d 5
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {options.map((opt, idx) => (
                        <div key={opt.point} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                            {opt.point}
                          </span>
                          <input 
                            type="text"
                            value={opt.label}
                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                            className="form-input"
                            style={{ flex: 1, padding: '4px 8px', fontSize: '0.75rem' }}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ padding: '12px 18px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline btn-sm">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  <Check size={14} />
                  <span>{editingCriterion ? 'Simpan' : 'Tambahkan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
