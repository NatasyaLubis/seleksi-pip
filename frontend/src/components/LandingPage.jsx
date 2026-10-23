import React, { useState, useEffect } from 'react';
import {
  Lock,
  Sliders,
  Users,
  Award,
  SunMedium,
  Moon,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  HelpCircle,
  FileText,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Calculator,
  Printer,
  Sparkles,
  School,
  Mail,
  Phone,
  MapPin,
  Check,
  Send,
  X,
  Layers,
  Clock,
  Target,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  Download,
  Pencil
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'beranda', label: 'Beranda' },
  { id: 'fitur', label: 'Fitur' },
  { id: 'manfaat', label: 'Manfaat' },
  { id: 'metode', label: 'Metode' },
  { id: 'simulasi', label: 'Coba Simulasi', isSpecial: true },
  { id: 'tentang', label: 'Tentang' },
  { id: 'kontak', label: 'Kontak' }
];

export default function LandingPage({ onLogin, darkMode, toggleDarkMode }) {
  // Login modal & credentials state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [username, setUsername] = useState('operator');
  const [password, setPassword] = useState('pip2026');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Interactive Mockup Tab State
  const [mockupTab, setMockupTab] = useState('ranking'); // 'ranking' | 'weights' | 'simulator'
  const [activeStatInfo, setActiveStatInfo] = useState(null);
  const [activeStatKey, setActiveStatKey] = useState(null);
  const [selectedMockStudent, setSelectedMockStudent] = useState(null);
  const [mockSimQuota, setMockSimQuota] = useState(50);

  // Interactive Mini Quota Simulator State (For Live User Engagement)
  const [simQuota, setSimQuota] = useState(50);

  // Contact form state
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: 'Konsultasi Kriteria', message: '' });
  const [contactSuccess, setContactSuccess] = useState(false);

  // Infographic Lightbox Modal State
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await onLogin(username, password, 'live');
      if (!res.success) {
        setErrorMessage(res.message || 'Login tidak berhasil. Periksa username dan password.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal terhubung ke server backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectDemoLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await onLogin('operator', 'pip2026', 'demo');
      if (res && !res.success) {
        alert(res.message || 'Gagal masuk ke mode demo.');
      }
    } catch (err) {
      alert(err.message || 'Gagal masuk ke mode demo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  const [activeSection, setActiveSection] = useState('beranda');

  const scrollToSection = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      const navElement = document.querySelector('nav');
      const navHeight = navElement ? navElement.offsetHeight : 72;
      const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = Math.max(0, elementPosition - navHeight - 16);

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // ScrollSpy to track active section with precision as user scrolls
  useEffect(() => {
    const handleScroll = () => {
      const navElement = document.querySelector('nav');
      const navHeight = navElement ? navElement.offsetHeight : 72;
      const scrollPosition = window.pageYOffset + navHeight + 80;

      for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
        const item = NAV_ITEMS[i];
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSuccess(true);
    setTimeout(() => setContactSuccess(false), 5000);
    setContactForm({ name: '', email: '', subject: 'Konsultasi Kriteria', message: '' });
  };

  // Sample ranking data for interactive simulation
  const sampleRankings = [
    { rank: 1, name: 'Dimas Pratama', cls: 'X-AKL', score: 94.2, status: 'Lolos Kuota' },
    { rank: 2, name: 'Budi Santoso', cls: 'XI-MM', score: 92.5, status: 'Lolos Kuota' },
    { rank: 3, name: 'Siti Dewi', cls: 'X-OTKP', score: 91.1, status: 'Lolos Kuota' },
    { rank: 4, name: 'Rizky Nasution', cls: 'XII-BDP', score: 89.7, status: 'Lolos Kuota' },
    { rank: 5, name: 'Ahmad Fauzi', cls: 'XI-AKL', score: 87.4, status: 'Lolos Kuota' },
    { rank: 6, name: 'Nur Wulandari', cls: 'XII-OTKP', score: 85.0, status: 'Lolos Kuota' }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', scrollBehavior: 'smooth' }}>

      {/* 1. TOP NAVBAR */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: darkMode ? 'hsl(var(--card) / 0.92)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid hsl(var(--border))',
        padding: '12px 24px'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

          {/* Brand Logo: Logo KEMENDIKDASMEN Resmi Sesuai Sistem */}
          <div
            onClick={() => scrollToSection('beranda')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            <img
              src="https://pip.kemendikdasmen.go.id/v1/img/home/logo-kemdikbud.png"
              alt="Logo Kemendikdasmen"
              style={{ width: '42px', height: '42px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.08))' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.06em', color: 'hsl(var(--primary))', textTransform: 'uppercase' }}>
                Sistem Pendukung Keputusan
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '-0.025em', color: 'hsl(var(--foreground))', lineHeight: 1.15, fontFamily: 'var(--font-heading)' }}>
                Beasiswa PIP
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>
                SMKS Dharma Bhakti Walter Manalu
              </div>
            </div>
          </div>

          {/* Nav Links with Precision Active Pill Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="landing-nav-links">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.8125rem',
                    fontWeight: isActive ? 700 : 500,
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive
                      ? (darkMode ? 'hsl(var(--primary) / 0.18)' : 'hsl(var(--primary) / 0.1)')
                      : 'transparent',
                    color: isActive
                      ? 'hsl(var(--primary))'
                      : (item.isSpecial ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'),
                    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = darkMode ? 'hsl(var(--muted) / 0.4)' : 'hsl(var(--muted) / 0.6)';
                      e.currentTarget.style.color = 'hsl(var(--foreground))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = item.isSpecial ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))';
                    }
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Actions: Theme Toggle & Login Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={toggleDarkMode}
              className="btn btn-ghost btn-sm"
              style={{
                padding: '6px 8px',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              aria-label={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {darkMode ? (
                <SunMedium size={18} strokeWidth={2.4} color="#f8fafc" />
              ) : (
                <Moon size={18} strokeWidth={2.2} color="#6366f1" />
              )}
            </button>

            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="btn btn-primary btn-hero-primary"
              style={{
                padding: '8px 18px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '7px'
              }}
            >
              <Lock size={14} />
              <span>Login Sistem</span>
            </button>
          </div>

        </div>
      </nav>

      {/* MAIN CONTENT CONTAINER */}
      <main style={{ flex: 1, position: 'relative' }}>

        {/* HERO & MOCKUP WRAPPER WITH BACKGROUND FADE (inspired by smartfarm.yaelahver.dev) */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: 'calc(100vh - 72px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>

          {/* Subtle Top Radial Gradient Glow (Signature KosRank Background) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 0,
              background: darkMode
                ? 'radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.12) 0%, hsl(var(--background)) 75%)'
                : 'radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.08) 0%, hsl(var(--background)) 75%)'
            }}
          />

          {/* 2. HERO SECTION - Beranda Style KosRank (Centered, Instrument Sans & Serif, Browser Mockup) */}
          <section
            id="beranda"
            style={{
              position: 'relative',
              zIndex: 1,
              padding: '150px 24px 20px',
              maxWidth: '1240px',
              width: '100%',
              margin: '0 auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Main Headline: Instrument Sans Bold + Instrument Serif Italic Accent (Signature KosRank Font) */}
            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.25rem, 5vw, 4rem)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              color: 'hsl(var(--foreground))',
              maxWidth: '8810px',
              margin: '0 auto 18px',
              textAlign: 'center'
            }}>
              Seleksi Penerima Beasiswa PIP Lebih{' '}
              <span style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: 400,
                fontStyle: 'italic',
                color: 'hsl(var(--primary))'
              }}>
                Objektif, Transparan, & Akurat
              </span>
            </h1>

            {/* Description Subtitle */}
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(1rem, 2vw, 1.125rem)',
              lineHeight: 1.68,
              color: 'hsl(var(--muted-foreground))',
              maxWidth: '680px',
              margin: '0 auto 28px',
              textAlign: 'center'
            }}>
              Sistem pendukung keputusan SMKS Dharma Bhakti Walter Manalu untuk seleksi penerima Program Indonesia Pintar (PIP) secara ilmiah menggunakan integrasi metode pembobotan <strong>Best-Worst Method (BWM)</strong> dan perankingan <strong>WASPAS</strong>.
            </p>

            {/* CTA Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '12px'
            }}>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="btn btn-primary btn-hero-primary"
                style={{
                  padding: '12px 28px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: darkMode
                    ? '0 4px 16px rgba(70, 136, 235, 0.8)'
                    : '0 6px 16px rgba(37, 99, 235, 0.22)'
                }}
              >
                <span>Mulai Sekarang</span>
                <ArrowRight size={17} />
              </button>

              <button
                onClick={handleDirectDemoLogin}
                disabled={isLoading}
                className="btn btn-outline btn-hero-outline"
                style={{
                  padding: '12px 24px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Sparkles size={17} color="hsl(var(--primary))" />
                <span>{isLoading ? 'Memuat Demo...' : 'Lihat Demo (Operator)'}</span>
              </button>
            </div>

            {/* Micro Caption */}
            <p style={{
              fontSize: '0.8125rem',
              color: 'hsl(var(--muted-foreground))',
              textAlign: 'center',
              marginBottom: '18px'
            }}>
              - Teruji Ilmiah -
            </p>


            {/* Dashboard Mockup Window Preview (Mirrors the Actual System Dashboard) */}
            <div style={{
              margin: '28px auto 0',
              maxWidth: '1300px',
              width: '100%',
              padding: '90px',
              position: 'relative'
            }}>
              <div style={{
                background: 'hsl(var(--card))',
                borderRadius: '16px 16px 0 0',
                border: '1px solid hsl(var(--border))',
                borderBottom: 'none',
                boxShadow: darkMode
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px hsl(var(--border))'
                  : '0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 0 1px hsl(var(--border))',
                overflow: 'hidden'
              }}>
                {/* Browser-style Window Header Bar with URL bar like KosRank */}
                <div style={{
                  padding: '10px 16px',
                  background: 'hsl(var(--muted) / 0.5)',
                  borderBottom: '1px solid hsl(var(--border))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  {/* Traffic Light Dots */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                  </div>

                  {/* Centered Browser Address Bar */}
                  <div style={{
                    flex: 1,
                    maxWidth: '380px',
                    margin: '0 auto',
                    padding: '3px 14px',
                    borderRadius: '6px',
                    background: 'hsl(var(--muted))',
                    fontSize: '0.6875rem',
                    color: 'hsl(var(--muted-foreground))',
                    textAlign: 'center',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.01em',
                    border: '1px solid hsl(var(--border) / 0.6)'
                  }}>
                    pip.smks-dharmabhakti.sch.id/dashboard
                  </div>
                </div>

                {/* Dashboard Frame (Mini Sidebar + Main Dashboard Content) */}
                <div style={{ display: 'flex', minHeight: '520px' }}>

                  {/* Mini Sidebar Preview (Authentic replica of Sidebar.jsx) */}
                  <aside style={{
                    width: '210px',
                    minWidth: '210px',
                    borderRight: '1px solid hsl(var(--border))',
                    background: darkMode ? 'hsl(220 20% 7%)' : 'hsl(var(--muted) / 0.35)',
                    padding: '14px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {/* Brand */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '10px', borderBottom: '1px solid hsl(var(--border))' }}>
                      <img
                        src="https://pip.kemendikdasmen.go.id/v1/img/home/logo-kemdikbud.png"
                        alt="Kemendikdasmen"
                        style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                      />
                      <div>
                        <span style={{ fontSize: '0.5625rem', fontWeight: 800, letterSpacing: '0.04em', color: 'hsl(var(--primary))', textTransform: 'uppercase', display: 'block', lineHeight: 1 }}>
                          KEMENDIKDASMEN
                        </span>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--foreground))', lineHeight: 1.2 }}>
                          Seleksi PIP
                        </div>
                        <span style={{ fontSize: '0.5625rem', color: 'hsl(var(--muted-foreground))' }}>
                          SMKS Dharma Bhakti
                        </span>
                      </div>
                    </div>

                    {/* Kuota Summary Box */}
                    <div style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      fontSize: '0.6875rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--muted-foreground))' }}>
                        <span>Kuota PIP:</span>
                        <span style={{ fontWeight: 700, color: 'hsl(var(--primary))' }}>{mockSimQuota} Siswa</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', color: 'hsl(var(--muted-foreground))' }}>
                        <span>Terpilih:</span>
                        <span style={{ fontWeight: 700, color: 'hsl(var(--success))' }}>{mockSimQuota}/{mockSimQuota} (100%)</span>
                      </div>
                    </div>

                    {/* Navigation Menu Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: 'hsl(var(--primary) / 0.12)',
                        color: 'hsl(var(--primary))',
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}>
                        <BarChart3 size={14} />
                        <span>Dashboard</span>
                      </div>

                      {[
                        { icon: Sliders, label: 'Kriteria Seleksi' },
                        { icon: ShieldCheck, label: 'Penilaian Tim (BWM)' },
                        { icon: Users, label: 'Data Siswa', badge: '120' },
                        { icon: Award, label: 'Hasil Rangking' },
                        { icon: Printer, label: 'Berita Acara' }
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            color: 'hsl(var(--muted-foreground))',
                            fontSize: '0.72rem',
                            fontWeight: 500
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <item.icon size={14} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span style={{
                              fontSize: '0.6rem',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: 'hsl(var(--muted))',
                              fontWeight: 700
                            }}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </aside>

                  {/* Main Dashboard Content (Identical to DashboardView.jsx) */}
                  <div style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '18px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    background: 'hsl(var(--background) / 0.5)'
                  }}>

                    {/* Dashboard Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h2 style={{ fontSize: '1.1875rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'hsl(var(--foreground))', margin: 0 }}>
                          Dashboard Seleksi PIP
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <p style={{ fontSize: '0.78125rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                            Tahun Ajaran <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>2026/2027</span>
                          </p>
                          <span
                            style={{
                              padding: '2px 8px',
                              fontSize: '0.65625rem',
                              height: '22px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'hsl(var(--primary))',
                              background: 'hsl(var(--primary) / 0.08)',
                              borderRadius: '4px',
                              fontWeight: 600
                            }}
                          >
                            <Pencil size={11} />
                            <span>Ubah Tahun Ajaran</span>
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span
                          className="btn btn-outline btn-sm"
                          style={{ height: '30px', padding: '0 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Download size={13} />
                          <span>Export Excel</span>
                        </span>
                        <span
                          className="btn btn-primary btn-sm"
                          style={{ height: '30px', padding: '0 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Award size={13} />
                          <span>Lihat Hasil Lengkap</span>
                        </span>
                      </div>
                    </div>

                    {/* 4 Kartu KPI Ringkas Ala Shadcn (Total Calon Siswa, Kuota Penerima, Lolos Kuota, Cadangan) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      <div className="card" style={{ padding: '12px 14px', background: 'hsl(var(--card))' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>
                            Total Calon Siswa
                          </span>
                          <Users size={15} color="hsl(var(--muted-foreground))" />
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>
                          120
                        </div>
                        <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))' }}>
                          Siswa terdaftar
                        </span>
                      </div>

                      <div className="card" style={{ padding: '12px 14px', background: 'hsl(var(--card))' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>
                            Kuota Penerima
                          </span>
                          <Award size={15} color="hsl(var(--primary))" />
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', color: 'hsl(var(--primary))', letterSpacing: '-0.02em' }}>
                          {mockSimQuota}
                        </div>
                        <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))' }}>
                          Batas kuota bantuan
                        </span>
                      </div>

                      <div className="card" style={{ padding: '12px 14px', background: 'hsl(var(--card))' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>
                            Lolos Kuota
                          </span>
                          <CheckCircle2 size={15} color="hsl(var(--success))" />
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', color: 'hsl(var(--success))', letterSpacing: '-0.02em' }}>
                          {mockSimQuota}
                        </div>
                        <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))' }}>
                          Peringkat 1 s/d {mockSimQuota}
                        </span>
                      </div>

                      <div className="card" style={{ padding: '12px 14px', background: 'hsl(var(--card))' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>
                            Cadangan
                          </span>
                          <Clock size={15} color="hsl(var(--warning))" />
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', color: 'hsl(var(--warning))', letterSpacing: '-0.02em' }}>
                          {Math.max(0, 120 - mockSimQuota)}
                        </div>
                        <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))' }}>
                          Peringkat {mockSimQuota + 1} ke bawah
                        </span>
                      </div>
                    </div>

                    {/* Pengaturan Kuota & Hitung Rangking: Persis Dashboard Utama */}
                    <div className="card" style={{ padding: '10px 14px', background: 'hsl(var(--card))' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                            Atur Kuota:
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="number"
                              min="1"
                              max="120"
                              value={mockSimQuota}
                              onChange={(e) => setMockSimQuota(Math.min(120, Math.max(1, parseInt(e.target.value, 10) || 50)))}
                              className="form-input"
                              style={{ width: '64px', textAlign: 'center', fontWeight: 700, padding: '3px 6px', fontSize: '0.78125rem', height: '26px' }}
                            />
                            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Siswa</span>
                          </div>

                          {/* Quick preset buttons */}
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {[25, 50, 75, 100].map(val => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setMockSimQuota(val)}
                                className={`btn btn-sm ${mockSimQuota === val ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ padding: '2px 8px', fontSize: '0.65625rem', height: '24px' }}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ height: '26px', padding: '0 10px', fontSize: '0.71875rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <Calculator size={13} />
                          <span>Perbarui & Hitung Ranking</span>
                        </button>
                      </div>
                    </div>

                    {/* Pratinjau 5 Siswa Prioritas Teratas: Tabel Rapi Identik Dashboard Sistem */}
                    <div className="card" style={{ background: 'hsl(var(--card))' }}>
                      <div className="card-header" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 className="card-title" style={{ fontSize: '0.84375rem', fontWeight: 600, margin: 0 }}>
                            5 Siswa Prioritas Teratas
                          </h3>
                        </div>
                        <div style={{ fontSize: '0.71875rem', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, cursor: 'pointer' }}>
                          <span>Lihat Semua (120)</span>
                          <ArrowRight size={12} />
                        </div>
                      </div>

                      <div className="table-container" style={{ border: 'none', overflowX: 'auto' }}>
                        <table className="data-table" style={{ fontSize: '0.78125rem' }}>
                          <thead>
                            <tr>
                              <th style={{ width: '50px' }}>Rank</th>
                              <th style={{ width: '100px' }}>NISN</th>
                              <th>Nama Lengkap</th>
                              <th style={{ width: '80px' }}>Kelas</th>
                              <th style={{ width: '90px', textAlign: 'right' }}>Skor</th>
                              <th style={{ width: '120px' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { rank: 1, nisn: '0061234567', name: 'Dimas Pratama', cls: 'X-AKL', score: '94.2%' },
                              { rank: 2, nisn: '0067654321', name: 'Budi Santoso', cls: 'XI-MM', score: '92.5%' },
                              { rank: 3, nisn: '0069876543', name: 'Siti Dewi', cls: 'X-OTKP', score: '91.1%' },
                              { rank: 4, nisn: '0063456789', name: 'Rizky Nasution', cls: 'XII-BDP', score: '89.7%' },
                              { rank: 5, nisn: '0065432109', name: 'Anisa Rahma', cls: 'X-AKL', score: '88.3%' }
                            ].map((r) => (
                              <tr key={r.rank}>
                                <td>
                                  <strong style={{ fontSize: '0.8125rem', color: 'hsl(var(--foreground))' }}>
                                    #{r.rank}
                                  </strong>
                                </td>
                                <td className="code-num" style={{ fontSize: '0.71875rem' }}>{r.nisn}</td>
                                <td style={{ fontWeight: 600 }}>{r.name}</td>
                                <td style={{ color: 'hsl(var(--muted-foreground))' }}>{r.cls}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'hsl(var(--primary))' }}>
                                  {r.score}
                                </td>
                                <td>
                                  <span className="badge badge-passed" style={{ fontSize: '0.65625rem', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle2 size={11} />
                                    <span>Lolos Kuota</span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Bottom Fade Gradient into Background (KosRank Signature Effect) */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '110px',
                background: 'linear-gradient(to top, hsl(var(--background)) 15%, transparent)',
                pointerEvents: 'none',
                zIndex: 2
              }} />
            </div>

            {/* Elegant Scroll Down Indicator */}
            <div
              onClick={() => scrollToSection('fitur')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                marginTop: '16px',
                cursor: 'pointer',
                color: 'hsl(var(--muted-foreground))',
                transition: 'all 0.2s ease',
                userSelect: 'none',
                zIndex: 3
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'hsl(var(--primary))';
                e.currentTarget.style.transform = 'translateY(2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'hsl(var(--muted-foreground))';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              title="Gulir ke Fitur Utama Sistem"
            >
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Jelajahi Fitur Sistem
              </span>
              <ChevronDown size={16} />
            </div>

          </section>
        </div>

        {/* 3. FITUR UTAMA SISTEM (6 Cards Grid with Rich Hover Effects) */}
        <section id="fitur" style={{ padding: '64px 24px', background: 'hsl(var(--muted) / 0.25)', borderTop: '1px solid hsl(var(--border))', borderBottom: '1px solid hsl(var(--border))' }}>
          <div style={{ maxWidth: '1240px', margin: '0 auto' }}>

            <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 42px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Solusi Seleksi Komprehensif
              </span>
              <h2 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '6px', color: 'hsl(var(--foreground))' }}>
                Fitur Utama Sistem
              </h2>
              <p style={{ fontSize: '0.9375rem', color: 'hsl(var(--muted-foreground))', marginTop: '6px' }}>
                Dirancang khusus untuk mendukung operasional sekolah dalam menentukan penerima bantuan PIP secara cepat dan dapat dipertanggungjawabkan.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>

              {/* Card 1 */}
              <div className="card interactive-card" style={{ padding: '24px', borderRadius: '14px' }}>
                <div className="card-icon-bubble" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Users size={22} />
                </div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '8px' }}>Kelola Data Siswa</h3>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.55, margin: 0 }}>
                  Input, edit, dan kelola data calon penerima PIP secara mudah dan terstruktur, dilengkapi fitur impor & ekspor template Excel massal.
                </p>
              </div>

              {/* Card 2 */}
              <div className="card interactive-card" style={{ padding: '24px', borderRadius: '14px' }}>
                <div className="card-icon-bubble" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Sliders size={22} />
                </div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '8px' }}>Kelola Kriteria & Subkriteria</h3>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.55, margin: 0 }}>
                  Kelola kriteria, subkriteria, tipe orientasi (benefit/cost), dan skala penilaian ekonomi siswa sesuai regulasi terbaru.
                </p>
              </div>

              {/* Card 3 */}
              <div className="card interactive-card" style={{ padding: '24px', borderRadius: '14px' }}>
                <div className="card-icon-bubble" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <ShieldCheck size={22} />
                </div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '8px' }}>Pembobotan BWM</h3>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.55, margin: 0 }}>
                  Tentukan bobot kriteria menggunakan metode Best-Worst Method secara konsisten dengan perbandingan pairwise yang jauh lebih efisien.
                </p>
              </div>

              {/* Card 4 */}
              <div className="card interactive-card" style={{ padding: '24px', borderRadius: '14px' }}>
                <div className="card-icon-bubble" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Calculator size={22} />
                </div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '8px' }}>Perhitungan WASPAS</h3>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.55, margin: 0 }}>
                  Lakukan perankingan secara otomatis mengombinasikan model penjumlahan terbobot (WSM) dan model perkalian terbobot (WPM).
                </p>
              </div>

              {/* Card 5 */}
              <div className="card interactive-card" style={{ padding: '24px', borderRadius: '14px' }}>
                <div className="card-icon-bubble" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <TrendingUp size={22} />
                </div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '8px' }}>Analisis Sensitivitas & Kuota</h3>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.55, margin: 0 }}>
                  Uji stabilitas hasil dengan berbagai skenario parameter nilai lambda (0 s/d 1) dan simulasi batas kuota penerima secara instan.
                </p>
              </div>

              {/* Card 6 */}
              <div className="card interactive-card" style={{ padding: '24px', borderRadius: '14px' }}>
                <div className="card-icon-bubble" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Printer size={22} />
                </div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '8px' }}>Laporan & Export Resmi</h3>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.55, margin: 0 }}>
                  Cetak dokumen resmi Berita Acara penetapan usulan dan ekspor tabel nominasi penerima PIP ke format Excel resmi dinas.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* 4. MANFAAT MENGGUNAKAN SISTEM (4 Columns with Micro Bounce on Hover) */}
        <section id="manfaat" style={{ padding: '64px 24px', maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 46px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Nilai Tambah
            </span>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '6px', color: 'hsl(var(--foreground))' }}>
              Manfaat Menggunakan Sistem
            </h2>
            <p style={{ fontSize: '0.9375rem', color: 'hsl(var(--muted-foreground))', marginTop: '6px' }}>
              Membantu sekolah keluar dari penilaian yang bersifat subjektif menuju keputusan yang berbasis bukti dan ilmiah.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>

            <div className="benefit-col" style={{ textAlign: 'center', padding: '16px' }}>
              <div className="benefit-icon-ring" style={{ width: '58px', height: '58px', borderRadius: '50%', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Target size={28} />
              </div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '8px' }}>Keputusan Lebih Objektif</h3>
              <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}>
                Mengurangi subjektivitas dalam seleksi dengan perhitungan matematis berbasis metode ilmiah yang teruji.
              </p>
            </div>

            <div className="benefit-col" style={{ textAlign: 'center', padding: '16px' }}>
              <div className="benefit-icon-ring" style={{ width: '58px', height: '58px', borderRadius: '50%', background: 'hsl(var(--success) / 0.1)', color: 'hsl(var(--success))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <ShieldCheck size={28} />
              </div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '8px' }}>Transparan & Akuntabel</h3>
              <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}>
                Setiap proses dan hasil perhitungan dapat dilihat, diverifikasi, dan dipertanggungjawabkan kepada orang tua & dinas.
              </p>
            </div>

            <div className="benefit-col" style={{ textAlign: 'center', padding: '16px' }}>
              <div className="benefit-icon-ring" style={{ width: '58px', height: '58px', borderRadius: '50%', background: '#f59e0b22', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Clock size={28} />
              </div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '8px' }}>Efisien & Hemat Waktu</h3>
              <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}>
                Mempercepat proses seleksi ratusan berkas siswa dan meminimalkan kesalahan rekapitulasi data secara manual.
              </p>
            </div>

            <div className="benefit-col" style={{ textAlign: 'center', padding: '16px' }}>
              <div className="benefit-icon-ring" style={{ width: '58px', height: '58px', borderRadius: '50%', background: '#8b5cf622', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Users size={28} />
              </div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '8px' }}>Prioritas Tepat Sasaran</h3>
              <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}>
                Menentukan prioritas penerima sesuai tingkat kebutuhan ekonomi terdesak dan kuota yang dialokasikan pemerintah.
              </p>
            </div>

          </div>
        </section>

        {/* 5. METODE YANG DIGUNAKAN (Alur BWM & WASPAS Mudah Dipahami) */}
        <section id="metode" style={{ padding: '64px 24px', background: 'hsl(var(--muted) / 0.25)', borderTop: '1px solid hsl(var(--border))', borderBottom: '1px solid hsl(var(--border))' }}>
          <div style={{ maxWidth: '1240px', margin: '0 auto' }}>

            <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 46px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Metodologi Ilmiah
              </span>
              <h2 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '6px', color: 'hsl(var(--foreground))' }}>
                Metode yang Digunakan
              </h2>
              <p style={{ fontSize: '0.9375rem', color: 'hsl(var(--muted-foreground))', marginTop: '6px' }}>
                Kombinasi metode <strong>Best-Worst Method (BWM)</strong> dan <strong>WASPAS</strong> menyederhanakan perhitungan yang rumit menjadi alur langkah yang mudah dipahami oleh siapapun.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '20px' }}>

              {/* Step 1: BWM */}
              <div className="card method-step-card" style={{ padding: '24px', borderRadius: '14px', display: 'flex', flexDirection: 'column' }}>
                <div className="step-badge" style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'hsl(var(--primary))',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  1
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>
                  Best-Worst Method (BWM)
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, marginBottom: '14px' }}>
                  Menentukan bobot kriteria dengan memilih kriteria terbaik (paling penting) dan terburuk, kemudian melakukan perbandingan berpasangan.
                </p>
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--foreground))' }}>
                    <Check size={14} color="hsl(var(--primary))" />
                    <span>Pilih Best & Worst Kriteria</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--foreground))' }}>
                    <Check size={14} color="hsl(var(--primary))" />
                    <span>Best to Others (BO)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--foreground))' }}>
                    <Check size={14} color="hsl(var(--primary))" />
                    <span>Others to Worst (OW)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--foreground))' }}>
                    <Check size={14} color="hsl(var(--primary))" />
                    <span>Hitung bobot & konsistensi (CR)</span>
                  </div>
                </div>
              </div>

              {/* Step 2: WASPAS */}
              <div className="card method-step-card" style={{ padding: '24px', borderRadius: '14px', display: 'flex', flexDirection: 'column' }}>
                <div className="step-badge" style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'hsl(var(--primary))',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  2
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>
                  Weighted Aggregated Sum Product Assessment (WASPAS)
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, marginBottom: '14px' }}>
                  Melakukan perankingan alternatif dengan kombinasi metode penjumlahan (WSM) dan perkalian (WPM).
                </p>
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--foreground))' }}>
                    <Check size={14} color="hsl(var(--primary))" />
                    <span>Normalisasi matriks (Benefit/Cost)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--foreground))' }}>
                    <Check size={14} color="hsl(var(--primary))" />
                    <span>Hitung skor WSM & WPM</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--foreground))' }}>
                    <Check size={14} color="hsl(var(--primary))" />
                    <span>Agregasi gabungan parameter λ</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--foreground))' }}>
                    <Check size={14} color="hsl(var(--primary))" />
                    <span>Hasil nilai preferensi Qi</span>
                  </div>
                </div>
              </div>

              {/* Step 3: Ranking & Prioritas */}
              <div className="card method-step-card" style={{ padding: '24px', borderRadius: '14px', display: 'flex', flexDirection: 'column' }}>
                <div className="step-badge" style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'hsl(var(--primary))',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  3
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>
                  Ranking & Prioritas
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, marginBottom: '14px' }}>
                  Alternatif dirangking berdasarkan nilai preferensi untuk menentukan prioritas sesuai kuota yang tersedia.
                </p>
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--foreground))' }}>
                    <Check size={14} color="hsl(var(--primary))" />
                    <span>Urutan peringkat otomatis</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--foreground))' }}>
                    <Check size={14} color="hsl(var(--primary))" />
                    <span>Pemisahan batas kuota lolos</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--foreground))' }}>
                    <Check size={14} color="hsl(var(--primary))" />
                    <span>Daftar cadangan prioritas</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--foreground))' }}>
                    <Check size={14} color="hsl(var(--primary))" />
                    <span>Tie-breaker otomatis</span>
                  </div>
                </div>
              </div>

              {/* Step 4: Analisis Sensitivitas & Keputusan */}
              <div className="card method-step-card" style={{ padding: '24px', borderRadius: '14px', display: 'flex', flexDirection: 'column' }}>
                <div className="step-badge" style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'hsl(var(--primary))',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  4
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>
                  Analisis Sensitivitas
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, marginBottom: '14px' }}>
                  Uji kestabilan hasil dengan mengubah nilai parameter λ (0 - 1) untuk melihat perubahan ranking dan ketahanan hasil.
                </p>
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--foreground))' }}>
                    <Check size={14} color="hsl(var(--primary))" />
                    <span>Skenario bobot lambda dinamis</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--foreground))' }}>
                    <Check size={14} color="hsl(var(--primary))" />
                    <span>Ketahanan stabilitas perankingan</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--foreground))' }}>
                    <Check size={14} color="hsl(var(--primary))" />
                    <span>Berita Acara resmi penetapan</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--foreground))' }}>
                    <Check size={14} color="hsl(var(--primary))" />
                    <span>Ekspor Excel format resmi</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* 6. COBA SIMULASI INTERAKTIF (Hands-on Mini Widget) */}
        <section id="simulasi" style={{ padding: '44px 24px 20px', maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'center' }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                background: 'hsl(var(--primary) / 0.1)',
                color: 'hsl(var(--primary))',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '10px'
              }}>
                <SlidersHorizontal size={13} />
                <span>Coba Langsung Interaktif</span>
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'hsl(var(--foreground))', marginBottom: '10px' }}>
                Simulasi Batas Kuota & Perangkingan
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6, marginBottom: '20px' }}>
                Geser slider atau klik preset kuota di bawah untuk melihat bagaimana sistem otomatis membagi siswa menjadi <strong>Lolos Kuota</strong> dan <strong>Cadangan Prioritas</strong> secara instan:
              </p>

              {/* Preset Buttons */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '18px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>Pilihan Kuota:</span>
                {[25, 50, 75, 100].map(val => (
                  <button
                    key={val}
                    onClick={() => setSimQuota(val)}
                    className={`btn btn-sm ${simQuota === val ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '6px', transition: 'all 0.15s ease' }}
                  >
                    {val} Siswa
                  </button>
                ))}
              </div>

              {/* Slider Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={simQuota}
                  onChange={(e) => setSimQuota(parseInt(e.target.value, 10))}
                  style={{ flex: 1, accentColor: 'hsl(var(--primary))', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'hsl(var(--primary))', width: '80px', textAlign: 'right' }}>
                  {simQuota} Siswa
                </span>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="btn btn-primary btn-sm btn-hero-primary"
                  style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                >
                  <span>Masuk ke Sistem Penuh</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Live Mini Preview Box */}
            <div style={{ background: 'hsl(var(--card))', borderRadius: '14px', border: '1px solid hsl(var(--border))', padding: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                    Status Kuota Simulasi
                  </span>
                  <div style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))' }}>Dari total 120 siswa terdaftar</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#10b981' }}>{simQuota} Lolos</span>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}> / {Math.max(0, 120 - simQuota)} Cadangan</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {sampleRankings.slice(0, 4).map((s) => {
                  const isPassed = s.rank <= simQuota;
                  return (
                    <div
                      key={s.rank}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 10px',
                        borderRadius: '8px',
                        background: isPassed ? 'hsl(var(--success-light) / 0.3)' : 'hsl(var(--muted) / 0.4)',
                        border: isPassed ? '1px solid hsl(var(--success) / 0.3)' : '1px solid hsl(var(--border))',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isPassed ? '#10b981' : 'hsl(var(--muted-foreground))' }}>
                          #{s.rank}
                        </span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{s.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--primary))' }}>{s.score}%</span>
                        <span className={`badge ${isPassed ? 'badge-passed' : 'badge-neutral'}`} style={{ fontSize: '0.625rem', padding: '2px 6px' }}>
                          {isPassed ? 'Lolos Kuota' : 'Cadangan'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 7. TENTANG SISTEM (Presisi, Simetris, & Seimbang Kiri-Kanan) */}
        <section id="tentang" style={{ padding: '24px 24px 56px', maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '28px',
            alignItems: 'stretch'
          }}>

            {/* Kolom Kiri: Profil Sekolah & Infografis Alur Seleksi PIP */}
            <div style={{
              background: 'hsl(var(--card))',
              borderRadius: '18px',
              border: '1px solid hsl(var(--border))',
              padding: '26px',
              boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '18px',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 25px -4px rgba(37, 99, 235, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px -4px rgba(0, 0, 0, 0.05)';
              }}
            >
              {/* Header Satuan Pendidikan */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid hsl(var(--border))' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'hsl(var(--primary) / 0.12)',
                  color: 'hsl(var(--primary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <School size={22} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                    Satuan Pendidikan Penyelenggara
                  </span>
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'hsl(var(--foreground))', margin: 0, lineHeight: 1.25 }}>
                    SMKS DHARMA BHAKTI WALTER MANALU
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                    Siborongborong, Tapanuli Utara
                  </p>
                </div>
              </div>

              {/* Infografis Alur Seleksi PIP yang Rapi & Presisi */}
              <div
                onClick={() => setIsImageModalOpen(true)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: darkMode ? 'hsl(var(--muted) / 0.35)' : 'hsl(var(--muted) / 0.5)',
                  borderRadius: '12px',
                  border: '1px solid hsl(var(--border))',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Klik untuk melihat infografis dalam ukuran penuh"
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.16)';
                  e.currentTarget.style.borderColor = 'hsl(var(--primary))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'hsl(var(--border))';
                }}
              >
                <img
                  src="/alur-seleksi-pip.png"
                  alt="Alur Seleksi Penerima PIP"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: '8px',
                    objectFit: 'contain'
                  }}
                />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'hsl(var(--primary))',
                  marginTop: '10px'
                }}>
                  <Sparkles size={12} color="hsl(var(--primary))" />
                  <span>Klik untuk memperbesar infografis</span>
                </div>
              </div>

              {/* Komitmen Sekolah */}
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                Berkomitmen menyalurkan bantuan pendidikan Program Indonesia Pintar (PIP) secara adil, transparan, dan tepat sasaran bagi siswa yang membutuhkan.
              </p>
            </div>

            {/* Kolom Kanan: Deskripsi Inisiatif Sistem & 4 Pilar Keunggulan */}
            <div style={{
              background: 'hsl(var(--card))',
              borderRadius: '18px',
              border: '1px solid hsl(var(--border))',
              padding: '26px',
              boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '18px',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 25px -4px rgba(37, 99, 235, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px -4px rgba(0, 0, 0, 0.05)';
              }}
            >
              <div>
                {/* Header Profil Inisiatif */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid hsl(var(--border))' }}>
                  <div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                      Profil Inisiatif
                    </span>
                    <h2 style={{ fontSize: '1.4375rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'hsl(var(--foreground))', margin: 0, lineHeight: 1.25 }}>
                      Tentang Sistem
                    </h2>
                  </div>
                  <span className="badge badge-benefit" style={{ fontSize: '0.6875rem', padding: '4px 8px' }}>
                    Metode Ilmiah BWM & WASPAS
                  </span>
                </div>

                {/* Deskripsi Sistem */}
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.65, margin: 0 }}>
                    <strong style={{ color: 'hsl(var(--foreground))' }}>PIP Decision</strong> adalah Sistem Pendukung Keputusan yang dirancang khusus untuk membantu pihak sekolah dalam melakukan seleksi penerima Program Indonesia Pintar (PIP) secara objektif, transparan, dan akurat.
                  </p>
                  <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.65, margin: 0 }}>
                    Sistem ini mengintegrasikan metode ilmiah pembobotan kriteria <strong style={{ color: 'hsl(var(--foreground))' }}>Best-Worst Method (BWM)</strong> dan perankingan <strong style={{ color: 'hsl(var(--foreground))' }}>WASPAS</strong> dengan mempertimbangkan berbagai kriteria penting seperti kondisi ekonomi keluarga, tanggungan, dan kelayakan dokumen pendukung.
                  </p>
                  <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.65, margin: 0 }}>
                    Melalui digitalisasi proses ini, seluruh tahapan verifikasi data hingga penetapan rekomendasi kuota penerima dapat dilaksanakan secara lebih efisien, meminimalkan risiko kesalahan manual, serta menghasilkan dokumentasi keputusan yang transparan dan akuntabel bagi pihak sekolah maupun orang tua siswa.
                  </p>
                </div>
              </div>

              {/* 4 Feature Badges in 2x2 Grid with Hover Highlight */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div className="mockup-stat-pill" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border))' }}>
                  <School size={18} color="hsl(var(--primary))" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Khusus Satuan Pendidikan</span>
                </div>

                <div className="mockup-stat-pill" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border))' }}>
                  <Layers size={18} color="#8b5cf6" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Algoritma Multi-Kriteria</span>
                </div>

                <div className="mockup-stat-pill" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border))' }}>
                  <ShieldCheck size={18} color="#10b981" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Data Aman & Terverifikasi</span>
                </div>

                <div className="mockup-stat-pill" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border))' }}>
                  <Award size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Tepat Sasaran Kuota</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 8. HUBUNGI KAMI */}
        <section id="kontak" style={{ padding: '60px 24px', background: 'hsl(var(--muted) / 0.25)', borderTop: '1px solid hsl(var(--border))' }}>
          <div style={{ maxWidth: '1240px', margin: '0 auto' }}>

            <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 42px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Bantuan & Informasi
              </span>
              <h2 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '6px', color: 'hsl(var(--foreground))' }}>
                Hubungi Kami
              </h2>
              <p style={{ fontSize: '0.9375rem', color: 'hsl(var(--muted-foreground))', marginTop: '6px' }}>
                Jika Anda memiliki pertanyaan seputar seleksi atau membutuhkan informasi teknis penggunaan sistem, silakan hubungi tim pengelola.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>

              {/* Left Contact Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}>
                  Layanan pengaduan dan verifikasi berkas PIP SMKS Dharma Bhakti Walter Manalu Siborongborong dibuka pada hari kerja (Senin - Jumat, 08.00 - 15.00 WIB).
                </p>

                <div className="mockup-stat-pill" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px', borderRadius: '10px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Email</div>
                    <div style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>pip@smksdharmabhakti.sch.id</div>
                  </div>
                </div>

                <div className="mockup-stat-pill" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px', borderRadius: '10px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Phone size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Telepon / WhatsApp</div>
                    <div style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>+62 812-6481-7890</div>
                  </div>
                </div>

                <div className="mockup-stat-pill" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px', borderRadius: '10px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Alamat Sekolah</div>
                    <div style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                      Jl. Walter Manalu, Siborongborong, Kab. Tapanuli Utara, Sumatera Utara
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Form with Smooth Transitions */}
              <div className="card" style={{ padding: '24px', borderRadius: '16px', boxShadow: '0 8px 24px -6px rgba(0,0,0,0.06)' }}>
                {contactSuccess ? (
                  <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                    <CheckCircle2 size={36} color="hsl(var(--success))" style={{ margin: '0 auto 12px' }} />
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Pesan Berhasil Terkirim!</h4>
                    <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
                      Terima kasih telah menghubungi kami. Tim operator kami akan segera menanggapi pertanyaan Anda.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Nama Lengkap</label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          className="form-input"
                          placeholder="Masukkan nama Anda"
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          className="form-input"
                          placeholder="nama@email.com"
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Subjek</label>
                      <select
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        className="form-select"
                      >
                        <option value="Konsultasi Kriteria">Konsultasi Kriteria Seleksi</option>
                        <option value="Pengaduan Berkas Siswa">Verifikasi Data / Pengaduan</option>
                        <option value="Informasi Kuota PIP">Informasi Kuota PIP</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Pesan</label>
                      <textarea
                        required
                        rows="3"
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="form-input"
                        placeholder="Tulis pesan atau pertanyaan Anda..."
                        style={{ resize: 'vertical' }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-hero-primary"
                      style={{ padding: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <Send size={15} />
                      <span>Kirim Pesan</span>
                    </button>
                  </form>
                )}
              </div>

            </div>

          </div>
        </section>

      </main>

      {/* 9. FOOTER */}
      <footer style={{
        borderTop: '1px solid hsl(var(--border))',
        background: 'hsl(var(--card))',
        padding: '24px',
        fontSize: '0.8125rem',
        color: 'hsl(var(--muted-foreground))'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            © 2026 <strong>PIP Decision</strong> — SMKS Dharma Bhakti Walter Manalu Siborongborong. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span style={{ cursor: 'pointer' }}>Kebijakan Privasi</span>
            <span style={{ cursor: 'pointer' }}>Syarat & Ketentuan</span>
            <button onClick={() => scrollToSection('beranda')} className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
              Ke Atas ↑
            </button>
          </div>
        </div>
      </footer>

      {/* 10. MODAL LOGIN SISTEM */}
      {
        isLoginModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '440px', animation: 'modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                      Masuk ke Sistem Seleksi PIP
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                      Silakan masukkan akun Anda untuk mengelola sistem
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLoginModalOpen(false)}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleLoginSubmit}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                  {errorMessage && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: 'var(--radius)', background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', fontSize: '0.8125rem' }}>
                      <AlertCircle size={16} />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Tombol Pintas Akun Demo with Interactive States */}
                  <div style={{ background: 'hsl(var(--muted) / 0.4)', padding: '10px 12px', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      Pilih Akun Cepat (Satu Klik):
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleQuickSelect('operator', 'pip2026')}
                        className={`btn btn-sm ${username === 'operator' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ fontSize: '0.75rem', flex: 1, padding: '6px', transition: 'all 0.15s ease' }}
                      >
                        Operator PIP
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickSelect('kepsek', 'kepsek2026')}
                        className={`btn btn-sm ${username === 'kepsek' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ fontSize: '0.75rem', flex: 1, padding: '6px', transition: 'all 0.15s ease' }}
                      >
                        Pengambil Keputusan
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Nama Pengguna (Username)</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="form-input"
                      placeholder="Masukkan username Anda"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Kata Sandi (Password)</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input"
                      placeholder="Masukkan kata sandi"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary btn-hero-primary"
                    style={{ width: '100%', padding: '10px', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <span>{isLoading ? 'Memeriksa Kredensial...' : 'Masuk ke Aplikasi'}</span>
                    <ArrowRight size={15} />
                  </button>

                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* 11. MODAL LIGHTBOX INFOGRAFIS ALUR SELEKSI PIP */}
      {
        isImageModalOpen && (
          <div
            className="modal-overlay"
            onClick={() => setIsImageModalOpen(false)}
            style={{ zIndex: 9999, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(5px)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '960px',
                width: '100%',
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
                position: 'relative',
                animation: 'modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--muted) / 0.5)' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: 'hsl(var(--foreground))' }}>
                    Infografis Alur Seleksi Penerima PIP
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                    SMKS Dharma Bhakti Walter Manalu Siborongborong
                  </span>
                </div>
                <button
                  onClick={() => setIsImageModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Tutup"
                >
                  <X size={20} />
                </button>
              </div>
              <div style={{ padding: '18px', background: darkMode ? 'hsl(var(--background))' : '#ffffff', display: 'flex', justifyContent: 'center', overflowY: 'auto', maxHeight: '82vh' }}>
                <img
                  src="/alur-seleksi-pip.png"
                  alt="Infografis Lengkap Seleksi Penerima PIP"
                  style={{ width: '100%', height: 'auto', maxHeight: '76vh', objectFit: 'contain', display: 'block', borderRadius: '8px' }}
                />
              </div>
            </div>
          </div>
        )
      }

    </div >
  );
}
