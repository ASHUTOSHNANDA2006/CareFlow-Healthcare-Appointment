import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
        if (res.success) {
          navigate('/dashboard');
        }
      } else {
        const res = await registerUser(name, email, password, role);
        if (res.success) {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>{isLogin ? 'Sign in to CareFlow' : 'Create an Account'}</h2>
          <p style={styles.sub}>
            {isLogin ? 'Welcome back. Enter your details below.' : 'Register details to coordinate care.'}
          </p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                placeholder="Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Registering as</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.select}>
                <option value="patient">Patient</option>
              </select>
            </div>
          )}

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Authenticating...' : isLogin ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div style={styles.toggleFooter}>
          <span>{isLogin ? "Don't have an account?" : 'Already registered?'}</span>
          <button onClick={() => setIsLogin(!isLogin)} style={styles.toggleBtn}>
            {isLogin ? 'Create one' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#F7F8F5',
    padding: '20px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(47, 111, 109, 0.1)',
    borderRadius: '14px',
    padding: '40px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.01)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '1.6rem',
    color: '#263536',
    fontWeight: '600',
    marginBottom: '8px',
  },
  sub: {
    fontSize: '0.9rem',
    color: '#697776',
  },
  errorBox: {
    backgroundColor: '#FDF3F2',
    color: '#C97872',
    border: '1px solid rgba(201, 120, 114, 0.2)',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '0.85rem',
    marginBottom: '20px',
    lineHeight: '1.4',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#263536',
  },
  select: {
    cursor: 'pointer',
  },
  submitBtn: {
    backgroundColor: '#2F6F6D',
    color: '#FFFFFF',
    padding: '12px',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: '500',
    marginTop: '10px',
  },
  toggleFooter: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #F7F8F5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.85rem',
    color: '#697776',
  },
  toggleBtn: {
    backgroundColor: 'transparent',
    color: '#2F6F6D',
    padding: 0,
    fontSize: '0.85rem',
    fontWeight: '600',
  },
};

export default LoginRegister;
