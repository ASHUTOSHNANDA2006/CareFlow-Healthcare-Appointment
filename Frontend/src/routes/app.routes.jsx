import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import Landing from '../pages/public/Landing';
import LoginRegister from '../pages/auth/LoginRegister';
import SearchDoctors from '../pages/patient/SearchDoctors';
import BookingFlow from '../pages/patient/BookingFlow';
import Dashboard from '../pages/patient/Dashboard';
import Layout from '../components/common/Layout';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={styles.loader}>Loading session parameters...</div>;
  if (!user) return <Navigate to="/auth" replace />;

  return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={styles.loader}>Loading session parameters...</div>;
  if (user) return <Navigate to="/dashboard" replace />;

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<PublicRoute><LoginRegister /></PublicRoute>} />

      {/* Authenticated Dashboard redirs */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      
      {/* Patient Specific Booking Pages */}
      <Route path="/doctors" element={<PrivateRoute><SearchDoctors /></PrivateRoute>} />
      <Route path="/book" element={<PrivateRoute><BookingFlow /></PrivateRoute>} />

      {/* Fallback route redirection */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const styles = {
  loader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontSize: '1.1rem',
    color: '#2F6F6D',
    fontWeight: '500',
    fontFamily: '"Inter", sans-serif',
  },
};

export default AppRoutes;
