import React, { useState, useEffect } from 'react';
import api from './services/api';
import './App.css';

function App() {
  const [healthStatus, setHealthStatus] = useState({
    status: 'loading',
    timestamp: null,
    error: null,
  });

  useEffect(() => {
    api.get('/health')
      .then((response) => {
        if (response.data && response.data.success) {
          setHealthStatus({
            status: 'healthy',
            timestamp: response.data.data.timestamp,
            error: null,
          });
        } else {
          setHealthStatus({
            status: 'unhealthy',
            timestamp: null,
            error: 'Invalid response structure',
          });
        }
      })
      .catch((err) => {
        setHealthStatus({
          status: 'error',
          timestamp: null,
          error: err.message || 'Could not connect to backend',
        });
      });
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>CARE<br />FLOW</h1>
        <p style={styles.tagline}>Healthcare, prepared before you arrive.</p>
      </header>

      <main style={styles.main}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Milestone 1: Project Foundation</h2>
          
          <div style={styles.statusSection}>
            <span style={styles.statusLabel}>Backend Connection:</span>
            <span style={{
              ...styles.statusBadge,
              backgroundColor: 
                healthStatus.status === 'healthy' ? '#6FA889' :
                healthStatus.status === 'loading' ? '#D6A85C' : '#C97872'
            }}>
              {healthStatus.status.toUpperCase()}
            </span>
          </div>

          {healthStatus.timestamp && (
            <p style={styles.timestamp}>
              <strong>Server Timestamp:</strong> {new Date(healthStatus.timestamp).toLocaleString()}
            </p>
          )}

          {healthStatus.error && (
            <div style={styles.errorBox}>
              <strong>Error details:</strong> {healthStatus.error}
            </div>
          )}

          <div style={styles.infoBox}>
            <p>Frontend structure is initialized successfully with Vite + React + Vanilla CSS.</p>
            <p>Axios service layer is connected to Express backend server.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: '"Outfit", "Inter", sans-serif',
    backgroundColor: '#F7F8F5',
    color: '#263536',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  logo: {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#2F6F6D',
    lineHeight: '1.1',
    letterSpacing: '0.05em',
    margin: '0 0 10px 0',
  },
  tagline: {
    color: '#697776',
    fontSize: '1.1rem',
    margin: 0,
  },
  main: {
    width: '100%',
    maxWidth: '500px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid rgba(47, 111, 109, 0.1)',
    padding: '30px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
  },
  cardTitle: {
    color: '#2F6F6D',
    fontSize: '1.5rem',
    fontWeight: '600',
    marginTop: 0,
    marginBottom: '24px',
    borderBottom: '1px solid #F7F8F5',
    paddingBottom: '12px',
  },
  statusSection: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
    fontSize: '1.1rem',
  },
  statusLabel: {
    marginRight: '12px',
    fontWeight: '500',
  },
  statusBadge: {
    color: '#FFFFFF',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    letterSpacing: '0.05em',
  },
  timestamp: {
    fontSize: '0.9rem',
    color: '#697776',
    backgroundColor: '#F7F8F5',
    padding: '10px 14px',
    borderRadius: '8px',
    margin: '0 0 20px 0',
  },
  errorBox: {
    backgroundColor: '#FDF3F2',
    color: '#C97872',
    border: '1px solid rgba(201, 120, 114, 0.2)',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '0.9rem',
    marginBottom: '20px',
  },
  infoBox: {
    fontSize: '0.95rem',
    color: '#697776',
    lineHeight: '1.6',
    borderLeft: '4px solid #2F6F6D',
    paddingLeft: '16px',
    margin: '20px 0 0 0',
  }
};

export default App;
