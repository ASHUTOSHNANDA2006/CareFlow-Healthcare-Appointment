import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import Landing from '../pages/public/Landing';
import LoginRegister from '../pages/auth/LoginRegister';
import Layout from '../components/common/Layout';

// Patient pages
import PatientDashboard from '../pages/patient/Dashboard';
import SearchDoctors from '../pages/patient/SearchDoctors';
import BookingFlow from '../pages/patient/BookingFlow';
import PreviousVisits from '../pages/patient/PreviousVisits';

// Doctor pages
import DoctorDashboard from '../pages/doctor/DoctorDashboard';

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard';

// Shared
import NotificationsPage from '../pages/shared/Notifications';

// ─── Route guards ─────────────────────────────────────────────────────────────

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={styles.loader}>Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={styles.loader}>Loading...</div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

// ─── Role-aware /dashboard ────────────────────────────────────────────────────

const DashboardRouter = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role === 'doctor') return <DoctorDashboard />;
  if (user.role === 'admin') return <AdminDashboard />;
  return <PatientDashboard />;
};

// ─── Routes ──────────────────────────────────────────────────────────────────

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/" element={<Landing />} />
    <Route path="/auth" element={<PublicRoute><LoginRegister /></PublicRoute>} />

    {/* Role-aware dashboard */}
    <Route path="/dashboard" element={<PrivateRoute><DashboardRouter /></PrivateRoute>} />

    {/* Patient-only */}
    <Route path="/doctors" element={<PrivateRoute roles={['patient']}><SearchDoctors /></PrivateRoute>} />
    <Route path="/book" element={<PrivateRoute roles={['patient']}><BookingFlow /></PrivateRoute>} />
    <Route path="/visits" element={<PrivateRoute roles={['patient']}><PreviousVisits /></PrivateRoute>} />

    {/* Shared */}
    <Route path="/notifications" element={<PrivateRoute roles={['patient', 'doctor', 'admin']}><NotificationsPage /></PrivateRoute>} />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const styles = {
  loader: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', fontSize: '1.1rem', color: '#2F6F6D',
    fontWeight: '500', fontFamily: '"Inter", sans-serif',
  },
};

export default AppRoutes;
