import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onLoginSuccess, currentUser }) {
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [username, setUsername] = useState('operator');
  const [password, setPassword] = useState('pip2026');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await onLoginSuccess(username, password);
      if (res.success) {
        onClose();
      } else {
        setErrorMessage(res.message || 'Login gagal.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                {currentUser ? 'Akun Operator Sekolah' : 'Login Keamanan Sistem'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                Autentikasi Terenkripsi JWT & Bcrypt
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleLogin}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {errorMessage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: 'var(--radius)', background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', fontSize: '0.8125rem' }}>
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Default Quick Fill Pills for Skripsi Presentation */}
            <div style={{ background: 'hsl(var(--muted) / 0.4)', padding: '10px 12px', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Pilihan Akun Demo (Klik untuk Isi Cepat):
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  type="button" 
                  onClick={() => handleQuickFill('operator', 'pip2026')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                >
                  Operator PIP (pip2026)
                </button>
                <button 
                  type="button" 
                  onClick={() => handleQuickFill('kepsek', 'kepsek2026')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                >
                  Pengambil Keputusan (kepsek2026)
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="form-input" 
                required 
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Kata Sandi (Password)</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="form-input" 
                required 
              />
            </div>

            {/* Security Badges */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '4px' }}>
              <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                Rate-Limit: Max 15x
              </span>
              <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                Bcrypt 10 Rounds
              </span>
              <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                JWT 24h Expiry
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Batal
            </button>
            <button type="submit" disabled={isLoading} className="btn btn-primary">
              <Lock size={15} />
              <span>{isLoading ? 'Memverifikasi...' : 'Masuk Sistem'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
