import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/* Role → nav items */
const NAV_CONFIG = {
  patient: [
    { label: 'Dashboard',       path: '/dashboard',     icon: '⊞' },
    { label: 'Find Doctor',     path: '/doctors',        icon: '🔍' },
    { label: 'Previous Visits', path: '/visits',         icon: '📋' },
    { label: 'Notifications',   path: '/notifications',  icon: '🔔' },
  ],
  doctor: [
    { label: 'Dashboard',       path: '/dashboard',     icon: '⊞' },
    { label: 'Notifications',   path: '/notifications',  icon: '🔔' },
  ],
  admin: [
    { label: 'Dashboard',       path: '/dashboard',     icon: '⊞' },
    { label: 'Notifications',   path: '/notifications',  icon: '🔔' },
  ],
};

const ROLE_COLORS = {
  patient: { bg: 'rgba(30,138,132,0.2)', color: '#5ec5bc', label: 'Patient' },
  doctor:  { bg: 'rgba(245,158,11,0.2)', color: '#fbbf24', label: 'Doctor' },
  admin:   { bg: 'rgba(139,92,246,0.2)', color: '#a78bfa', label: 'Admin' },
};

const getInitials = (name = '') =>
  name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

/* ─── Component ─── */
const Layout = ({ children }) => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  const navItems = user ? (NAV_CONFIG[user.role] ?? []) : [];
  const roleStyle = user ? (ROLE_COLORS[user.role] ?? ROLE_COLORS.patient) : ROLE_COLORS.patient;

  const isActive = (path) => location.pathname === path;

  return (
    <div style={s.layout}>
      {/* ─── Sidebar ─── */}
      <aside style={s.sidebar}>
        {/* Brand */}
        <Link to="/" style={s.brand}>
          <div style={s.brandIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 8h-4V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v4H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4h4a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1z"
                    fill="white" fillOpacity="0.95"/>
            </svg>
          </div>
          <div>
            <span style={s.brandName}>CareFlow</span>
            <span style={s.brandSub}>Healthcare Platform</span>
          </div>
        </Link>

        {/* Divider */}
        <div style={s.sidebarDivider} />

        {/* Nav */}
        <nav style={s.nav} role="navigation" aria-label="Main navigation">
          <div style={s.navSection}>
            <span style={s.navSectionLabel}>MENU</span>
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  style={{ ...s.navItem, ...(active ? s.navItemActive : {}) }}
                  aria-current={active ? 'page' : undefined}
                >
                  {active && <span style={s.activeIndicator} />}
                  <span style={s.navIcon}>{item.icon}</span>
                  <span style={{ ...s.navLabel, ...(active ? s.navLabelActive : {}) }}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* User section */}
        {user && (
          <div style={s.userSection}>
            <div style={s.userCard}>
              {/* Avatar */}
              <div style={s.avatar}>{getInitials(user.name)}</div>
              <div style={s.userInfo}>
                <span style={s.userName}>{user.name}</span>
                <span style={{ ...s.userRole, background: roleStyle.bg, color: roleStyle.color }}>
                  {roleStyle.label}
                </span>
              </div>
            </div>
            <button onClick={handleLogout} style={s.logoutBtn} id="sidebar-logout-btn">
              <span>↩</span>
              <span>Log out</span>
            </button>
          </div>
        )}
      </aside>

      {/* ─── Main area ─── */}
      <div style={s.main}>
        {/* Top header */}
        <header style={s.header}>
          <div style={s.headerLeft}>
            <h3 style={s.headerTitle}>
              {navItems.find((n) => isActive(n.path))?.label ?? 'CareFlow'}
            </h3>
            <span style={s.headerSub}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
          {user && (
            <div style={s.headerRight}>
              <div style={s.headerAvatar}>{getInitials(user.name)}</div>
              <div>
                <div style={s.headerName}>{user.name}</div>
                <div style={{ ...s.headerRole, color: roleStyle.color }}>{roleStyle.label}</div>
              </div>
            </div>
          )}
        </header>

        {/* Page content */}
        <main style={s.content}>
          {children}
        </main>
      </div>
    </div>
  );
};

/* ─── Styles ─── */
const s = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f0f9f8',
    fontFamily: "'Inter', sans-serif",
  },

  /* Sidebar */
  sidebar: {
    width: '256px',
    background: '#0a2e2b',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
    flexShrink: 0,
    boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
  },

  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
    padding: '6px 8px',
    borderRadius: '12px',
    transition: 'background 0.2s',
    marginBottom: '4px',
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  brandName: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '1.15rem',
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '-0.03em',
    display: 'block',
    lineHeight: 1.15,
  },
  brandSub: {
    fontSize: '0.68rem',
    color: 'rgba(255,255,255,0.4)',
    display: 'block',
    fontWeight: 500,
    marginTop: '1px',
  },

  sidebarDivider: {
    height: 1,
    background: 'rgba(255,255,255,0.08)',
    margin: '16px 8px',
  },

  nav: { display: 'flex', flexDirection: 'column', gap: '2px' },
  navSection: { display: 'flex', flexDirection: 'column', gap: '2px' },
  navSectionLabel: {
    fontSize: '0.65rem',
    fontWeight: 800,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: '0.1em',
    padding: '0 8px',
    marginBottom: '8px',
    marginTop: '4px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '10px',
    textDecoration: 'none',
    color: 'rgba(255,255,255,0.55)',
    transition: 'background 0.15s, color 0.15s',
    position: 'relative',
    fontSize: '0.88rem',
    fontWeight: 500,
  },
  navItemActive: {
    background: 'rgba(94,197,188,0.12)',
    color: '#5ec5bc',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 3,
    height: 20,
    borderRadius: '0 3px 3px 0',
    background: '#5ec5bc',
    marginLeft: '-16px',
  },
  navIcon: { fontSize: '0.9rem', width: 20, textAlign: 'center', flexShrink: 0 },
  navLabel: { fontWeight: 500, letterSpacing: '0.01em' },
  navLabelActive: { fontWeight: 700 },

  /* User section */
  userSection: {
    borderTop: '1px solid rgba(255,255,255,0.08)',
    paddingTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.04)',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #1e8a84, #0a4f4b)',
    border: '2px solid rgba(94,197,188,0.3)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.82rem',
    fontWeight: 800,
    flexShrink: 0,
    letterSpacing: '0.02em',
  },
  userInfo: { display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 },
  userName: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.9)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block',
  },
  userRole: {
    fontSize: '0.68rem',
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: '9999px',
    alignSelf: 'flex-start',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '9px 12px',
    borderRadius: '10px',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.15)',
    color: 'rgba(252,165,165,0.85)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s',
    fontFamily: "'Inter', sans-serif",
    justifyContent: 'center',
  },

  /* Main */
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    minWidth: 0,
  },

  header: {
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(30,138,132,0.1)',
    padding: '16px 36px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    boxShadow: '0 1px 12px rgba(0,0,0,0.04)',
  },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: '2px' },
  headerTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '1.15rem',
    fontWeight: 800,
    color: '#0a2e2b',
    letterSpacing: '-0.02em',
  },
  headerSub: { fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #1e8a84, #0a4f4b)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.82rem',
    fontWeight: 800,
    boxShadow: '0 4px 10px rgba(30,138,132,0.2)',
  },
  headerName: { fontSize: '0.88rem', fontWeight: 700, color: '#111827' },
  headerRole: { fontSize: '0.72rem', fontWeight: 600 },

  content: {
    padding: '32px 36px',
    flexGrow: 1,
  },
};

export default Layout;
