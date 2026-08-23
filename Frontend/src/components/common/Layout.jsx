import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  const getNavLinks = () => {
    if (!user) return [];
    if (user.role === 'patient') {
      return [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Find Doctor', path: '/doctors' },
        { label: 'Previous Visits', path: '/visits' },
        { label: 'Notifications', path: '/notifications' },
      ];
    }
    if (user.role === 'doctor') {
      return [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Notifications', path: '/notifications' },
      ];
    }
    if (user.role === 'admin') {
      return [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Notifications', path: '/notifications' },
      ];
    }
    return [];
  };


  return (
    <div style={styles.layout}>
      {/* Sidebar navigation */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <h2 style={styles.logo}>CARE<br />FLOW</h2>
          <span style={styles.tagline}>Healthcare platform</span>
        </div>
        <nav style={styles.nav}>
          {getNavLinks().map((link) => (
            <Link key={link.label} to={link.path} style={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </nav>
        {user && (
          <div style={styles.userSection}>
            <p style={styles.userName}>{user.name}</p>
            <p style={styles.userRole}>{user.role.toUpperCase()}</p>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Log out
            </button>
          </div>
        )}
      </aside>

      {/* Main viewport */}
      <div style={styles.viewport}>
        <header style={styles.header}>
          <h3>CareFlow Dashboard</h3>
        </header>
        <main style={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
};

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#F7F8F5',
  },
  sidebar: {
    width: '260px',
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid rgba(47, 111, 109, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    padding: '30px 24px',
    position: 'sticky',
    top: 0,
    height: '100vh',
  },
  brand: {
    marginBottom: '40px',
  },
  logo: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#2F6F6D',
    lineHeight: '1.1',
    letterSpacing: '0.05em',
  },
  tagline: {
    fontSize: '0.8rem',
    color: '#697776',
    display: 'block',
    marginTop: '4px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flexGrow: 1,
  },
  navLink: {
    fontSize: '0.95rem',
    color: '#263536',
    padding: '10px 14px',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
  },
  userSection: {
    borderTop: '1px solid rgba(47, 111, 109, 0.1)',
    paddingTop: '20px',
    marginTop: 'auto',
  },
  userName: {
    fontWeight: '600',
    color: '#263536',
    fontSize: '0.95rem',
  },
  userRole: {
    fontSize: '0.75rem',
    color: '#697776',
    marginBottom: '12px',
  },
  logoutBtn: {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: 'transparent',
    border: '1px solid rgba(201, 120, 114, 0.4)',
    color: '#C97872',
    fontSize: '0.85rem',
  },
  viewport: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    overflowY: 'auto',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid rgba(47, 111, 109, 0.1)',
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    padding: '40px',
    flexGrow: 1,
  },
};

export default Layout;
