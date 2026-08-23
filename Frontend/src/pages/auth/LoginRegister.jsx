import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginRegister = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginUser, registerUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const res = await loginUser(email, password);
        if (res.success) navigate('/dashboard');
      } else {
        const res = await registerUser(name, email, password, role);
        if (res.success) navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* ── Left panel — brand + illustration ── */}
      <div style={s.leftPanel}>
        <div style={s.leftBlobA} aria-hidden="true" />
        <div style={s.leftBlobB} aria-hidden="true" />

        <div style={s.leftContent}>
          {/* Logo */}
          <Link to="/" style={s.leftLogo}>
            <div style={s.logoIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z"
                      fill="white" fillOpacity="0.95"/>
              </svg>
            </div>
            <span style={s.leftLogoText}>CareFlow</span>
          </Link>

          {/* Headline */}
          <div style={s.leftHeadline}>
            <h1 style={s.leftTitle}>
              Healthcare,<br />
              <span style={s.leftGradient}>prepared before</span><br />
              you arrive.
            </h1>
            <p style={s.leftDesc}>
              AI-assisted appointment coordination connecting patients, doctors, and administrators.
            </p>
          </div>

          {/* Feature pills */}
          <div style={s.pillsGroup}>
            {[
              { icon: '🧠', label: 'AI Pre-Visit Briefs' },
              { icon: '📅', label: 'Smart Scheduling' },
              { icon: '💊', label: 'Digital Prescriptions' },
              { icon: '📆', label: 'Calendar Sync' },
            ].map((pill) => (
              <div key={pill.label} style={s.pill}>
                <span>{pill.icon}</span>
                <span style={s.pillLabel}>{pill.label}</span>
              </div>
            ))}
          </div>

          {/* Subtle trust note */}
          <p style={s.leftNote}>
            ✓ End-to-end encrypted &nbsp;·&nbsp; ✓ Role-based access control &nbsp;·&nbsp; ✓ MongoDB Atlas
          </p>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div style={s.rightPanel}>
        {/* Back link top-right */}
        <div style={s.topBar}>
          <Link to="/" style={s.backLink}>
            ← Back to Home
          </Link>
        </div>

        <div style={s.formContainer}>
          {/* Toggle tabs */}
          <div style={s.tabs}>
            <button
              onClick={() => setIsLogin(true)}
              style={{ ...s.tab, ...(isLogin ? s.tabActive : {}) }}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              style={{ ...s.tab, ...(!isLogin ? s.tabActive : {}) }}
            >
              Create Account
            </button>
          </div>

          {/* Heading */}
          <div style={s.formHeader}>
            <h2 style={s.formTitle}>
              {isLogin ? 'Welcome back' : 'Join CareFlow'}
            </h2>
            <p style={s.formSub}>
              {isLogin
                ? 'Sign in to access your healthcare dashboard.'
                : 'Create your patient account in seconds.'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={s.errorBox}>
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={s.form}>
            {!isLogin && (
              <div style={s.field}>
                <label style={s.label}>Full Name</label>
                <input
                  type="text"
                  placeholder="Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={s.input}
                  required
                  autoComplete="name"
                />
              </div>
            )}

            <div style={s.field}>
              <label style={s.label}>Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={s.input}
                required
                autoComplete="email"
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={s.input}
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>

            {!isLogin && (
              <div style={s.field}>
                <label style={s.label}>Registering as</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={s.input}
                >
                  <option value="patient">Patient</option>
                </select>
              </div>
            )}

            <button type="submit" disabled={loading} style={s.submitBtn}>
              {loading ? (
                <span style={s.loadingRow}>
                  <span style={s.spinner} />
                  Authenticating…
                </span>
              ) : isLogin ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          {/* Footer toggle */}
          <div style={s.formFooter}>
            <span style={s.footerText}>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
            </span>
            <button onClick={() => setIsLogin(!isLogin)} style={s.toggleBtn}>
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </div>

          {/* Demo credentials hint */}
          <div style={s.demoBox}>
            <span style={s.demoTitle}>Demo credentials</span>
            <div style={s.demoGrid}>
              <div style={s.demoItem}><strong>Patient</strong><br /><span style={s.demoVal}>patient@careflow.com</span></div>
              <div style={s.demoItem}><strong>Doctor</strong><br /><span style={s.demoVal}>doctor@careflow.com</span></div>
              <div style={s.demoItem}><strong>Admin</strong><br /><span style={s.demoVal}>admin@careflow.com</span></div>
            </div>
            <span style={s.demoPass}>Password: <strong>password123</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Styles ─── */
const s = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'Inter', sans-serif",
    background: '#f0f9f8',
  },

  /* Left */
  leftPanel: {
    flex: '0 0 46%',
    background: 'linear-gradient(145deg, #0a2e2b 0%, #0a4f4b 50%, #134e4a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 56px',
    position: 'relative',
    overflow: 'hidden',
  },
  leftBlobA: {
    position: 'absolute',
    top: '-20%',
    right: '-20%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(47,168,159,0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  leftBlobB: {
    position: 'absolute',
    bottom: '-10%',
    left: '-15%',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(30,138,132,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  leftContent: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '40px',
    maxWidth: '420px',
    width: '100%',
  },
  leftLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
    width: 'fit-content',
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
    flexShrink: 0,
  },
  leftLogoText: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '1.4rem',
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '-0.03em',
  },
  leftHeadline: { display: 'flex', flexDirection: 'column', gap: '16px' },
  leftTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
    fontWeight: 800,
    color: '#fff',
    lineHeight: 1.1,
    letterSpacing: '-0.04em',
  },
  leftGradient: {
    background: 'linear-gradient(135deg, #5ec5bc, #2fa89f)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  leftDesc: {
    fontSize: '1rem',
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 1.7,
  },
  pillsGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    padding: '12px 16px',
    backdropFilter: 'blur(10px)',
  },
  pillLabel: { fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' },
  leftNote: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 },

  /* Right */
  rightPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 32px',
    position: 'relative',
    background: '#f0f9f8',
  },
  topBar: {
    position: 'absolute',
    top: '24px',
    left: '32px',
    right: '32px',
    display: 'flex',
    justifyContent: 'flex-start',
  },
  backLink: {
    fontSize: '0.85rem',
    color: '#4b5563',
    fontWeight: 500,
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    transition: 'color 0.2s',
  },

  formContainer: {
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },

  /* Tabs */
  tabs: {
    display: 'flex',
    background: 'rgba(255,255,255,0.8)',
    borderRadius: '12px',
    padding: '4px',
    border: '1px solid rgba(30,138,132,0.12)',
    gap: '4px',
  },
  tab: {
    flex: 1,
    padding: '10px',
    borderRadius: '9px',
    fontSize: '0.88rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    color: '#6b7280',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: 'linear-gradient(135deg, #166f6a 0%, #0a4f4b 100%)',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(22,111,106,0.25)',
  },

  formHeader: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#0a2e2b',
    letterSpacing: '-0.03em',
  },
  formSub: { fontSize: '0.9rem', color: '#6b7280', lineHeight: 1.5 },

  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#fee2e2',
    border: '1px solid rgba(220,38,38,0.15)',
    color: '#b91c1c',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '0.88rem',
    lineHeight: 1.4,
  },

  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.82rem', fontWeight: 700, color: '#374151', letterSpacing: '0.01em' },
  input: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1.5px solid #e5e7eb',
    fontSize: '0.95rem',
    color: '#111827',
    background: '#fff',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: "'Inter', sans-serif",
    WebkitAppearance: 'none',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #166f6a 0%, #0a4f4b 100%)',
    color: '#fff',
    borderRadius: '12px',
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    boxShadow: '0 8px 24px rgba(22,111,106,0.28)',
    transition: 'all 0.22s',
    letterSpacing: '-0.01em',
    marginTop: '4px',
    fontFamily: "'Inter', sans-serif",
  },
  loadingRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  spinner: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },

  formFooter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.85rem',
    paddingTop: '4px',
  },
  footerText: { color: '#9ca3af' },
  toggleBtn: {
    background: 'transparent',
    color: '#166f6a',
    fontWeight: 700,
    fontSize: '0.85rem',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    fontFamily: "'Inter', sans-serif",
  },

  /* Demo box */
  demoBox: {
    background: 'rgba(30,138,132,0.05)',
    border: '1px solid rgba(30,138,132,0.12)',
    borderRadius: '14px',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  demoTitle: { fontSize: '0.75rem', fontWeight: 800, color: '#166f6a', textTransform: 'uppercase', letterSpacing: '0.08em' },
  demoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  demoItem: { fontSize: '0.78rem', color: '#374151', lineHeight: 1.6 },
  demoVal: { color: '#166f6a', fontWeight: 600, fontSize: '0.75rem' },
  demoPass: { fontSize: '0.78rem', color: '#6b7280' },
};

/* Inject spinner keyframe */
if (typeof document !== 'undefined') {
  const styleId = 'cf-spinner-keyframe';
  if (!document.getElementById(styleId)) {
    const el = document.createElement('style');
    el.id = styleId;
    el.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(el);
  }
}

export default LoginRegister;
