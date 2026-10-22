import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Key, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  AlertCircle,
  UserCheck,
  X,
  Lock
} from 'lucide-react';

export default function UsersView({ 
  users, 
  currentUser, 
  onAddUser, 
  onUpdateUser, 
  onDeleteUser 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('operator');
  const [title, setTitle] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const openAddModal = () => {
    setEditingUser(null);
    setUsername('');
    setFullName('');
    setRole('operator');
    setTitle('Operator PIP Sekolah');
    setPassword('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setUsername(u.username);
    setFullName(u.full_name);
    setRole(u.role === 'pengambil_keputusan' ? 'pengambil_keputusan' : 'operator');
    setTitle(u.title || '');
    setPassword('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (!editingUser) {
      if (newRole === 'pengambil_keputusan') {
        setTitle('Kepala Sekolah (Pengambil Keputusan)');
      } else {
        setTitle('Operator PIP Sekolah');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !fullName.trim()) {
      setErrorMsg('Username dan nama lengkap wajib diisi.');
      return;
    }

    if (!editingUser && (!password || password.length < 6)) {
      setErrorMsg('Kata sandi awal minimal 6 karakter.');
      return;
    }

    if (editingUser && password && password.length < 6) {
      setErrorMsg('Jika ingin mengganti kata sandi, minimal 6 karakter.');
      return;
    }

    try {
      if (editingUser) {
        const payload = {
          full_name: fullName.trim(),
          role,
          title: title.trim(),
          ...(password ? { password } : {})
        };
        const res = await onUpdateUser(editingUser.id, payload);
        if (res && res.success === false) {
          setErrorMsg(res.message);
          return;
        }
      } else {
        const payload = {
          username: username.trim(),
          full_name: fullName.trim(),
          role,
          title: title.trim(),
          password
        };
        const res = await onAddUser(payload);
        if (res && res.success === false) {
          setErrorMsg(res.message);
          return;
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses data pengguna.');
    }
  };

  const handleDelete = async (u) => {
    if (currentUser && currentUser.id === u.id) {
      alert('Anda tidak dapat menghapus akun yang sedang Anda gunakan.');
      return;
    }
    if (window.confirm(`Yakin ingin menghapus akun pengguna "${u.username}" (${u.full_name})?`)) {
      await onDeleteUser(u.id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'hsl(var(--foreground))', margin: 0 }}>
            Manajemen Pengguna Sistem
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: '2px 0 0 0' }}>
            Kelola hak akses akun untuk Operator PIP dan Pengambil Keputusan (Kepala Sekolah)
          </p>
        </div>

        <button onClick={openAddModal} className="btn btn-primary btn-sm">
          <UserPlus size={14} />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Info Card Role Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
        <div className="card" style={{ padding: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={18} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'hsl(var(--foreground))', margin: '0 0 4px 0' }}>
              Akun Operator PIP
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: 0, lineHeight: 1.5 }}>
              Bertanggung jawab menginput atau mengimpor data siswa, menyesuaikan kriteria, mengatur kuota penerima, dan mengelola akun pengguna sistem.
            </p>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'hsl(var(--success-light))', color: 'hsl(var(--success))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={18} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'hsl(var(--foreground))', margin: '0 0 4px 0' }}>
              Akun Pengambil Keputusan (Kepsek)
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: 0, lineHeight: 1.5 }}>
              Akses bagi pimpinan/Kepala Sekolah untuk memvalidasi kelayakan, melihat hasil perangkingan WASPAS, serta menandatangani dan mencetak Berita Acara resmi.
            </p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
            Daftar Pengguna Terdaftar ({users ? users.length : 0})
          </h3>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '45px', textAlign: 'center' }}>No</th>
                <th style={{ width: '130px' }}>Username</th>
                <th style={{ minWidth: '160px' }}>Nama Lengkap</th>
                <th style={{ width: '160px', textAlign: 'center' }}>Peran / Hak Akses</th>
                <th style={{ minWidth: '180px' }}>Jabatan</th>
                <th style={{ width: '90px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!users || users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'hsl(var(--muted-foreground))' }}>
                    Belum ada data pengguna.
                  </td>
                </tr>
              ) : (
                users.map((u, idx) => {
                  const isOp = u.role === 'operator';
                  const isCurrent = currentUser && currentUser.id === u.id;

                  return (
                    <tr key={u.id}>
                      <td style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '0.75rem' }}>
                        {idx + 1}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="code-num" style={{ fontWeight: 700 }}>{u.username}</span>
                          {isCurrent && (
                            <span style={{ fontSize: '0.625rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                              Anda
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                        {u.full_name}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${isOp ? 'badge-benefit' : 'badge-passed'}`} style={{ fontSize: '0.6875rem' }}>
                          {isOp ? <Users size={11} /> : <Shield size={11} />}
                          <span>{isOp ? 'Operator PIP' : 'Pengambil Keputusan'}</span>
                        </span>
                      </td>
                      <td style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.8125rem' }}>
                        {u.title || '-'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <button
                            onClick={() => openEditModal(u)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '4px' }}
                            title="Edit Data / Ubah Kata Sandi"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={isCurrent}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '4px', color: isCurrent ? 'hsl(var(--muted-foreground))' : 'hsl(var(--destructive))' }}
                            title={isCurrent ? 'Tidak bisa menghapus akun sendiri' : 'Hapus Pengguna'}
                          >
                            <Trash2 size={14} />
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
      </div>

      {/* Modal Add / Edit User */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} color="hsl(var(--primary))" />
                <h3 className="card-title">
                  {editingUser ? `Edit Pengguna: ${editingUser.username}` : 'Tambah Pengguna Baru'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {errorMsg && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: 'var(--radius)', background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', fontSize: '0.8125rem' }}>
                    <AlertCircle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nama Pengguna (Username)</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: operator2 / kepsek"
                    disabled={!!editingUser}
                    className="form-input"
                    required
                  />
                  {editingUser && (
                    <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', marginTop: '3px', display: 'block' }}>
                      Username tidak dapat diubah setelah dibuat.
                    </span>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nama Lengkap</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama lengkap beserta gelar"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Peran / Hak Akses</label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="form-select"
                  >
                    <option value="operator">Operator PIP (Kelola Data & Algoritma)</option>
                    <option value="pengambil_keputusan">Pengambil Keputusan (Kepala Sekolah)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Jabatan Struktural</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Kepala Sekolah / Operator PIP"
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    {editingUser ? 'Ganti Kata Sandi (Kosongkan jika tidak diubah)' : 'Kata Sandi Awal'}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingUser ? 'Minimal 6 karakter baru' : 'Minimal 6 karakter'}
                    className="form-input"
                    required={!editingUser}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="btn btn-secondary btn-sm"
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  <CheckCircle2 size={14} />
                  <span>{editingUser ? 'Simpan Perubahan' : 'Tambahkan Pengguna'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
