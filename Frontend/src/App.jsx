import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppointmentProvider } from './context/AppointmentContext';
import AppRoutes from './routes/app.routes';

function App() {
  return (
    <AuthProvider>
      <AppointmentProvider>
        <AppRoutes />
      </AppointmentProvider>
    </AuthProvider>
  );
}

export default App;
