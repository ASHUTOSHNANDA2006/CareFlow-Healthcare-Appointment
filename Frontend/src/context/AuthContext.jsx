import React, { createContext, useState, useEffect, useContext } from 'react';
import * as authService from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const data = await authService.me();
      if (data.success) {
        setUser(data.data.user);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const loginUser = async (email, password) => {
    const data = await authService.login(email, password);
    if (data.success) {
      if (data.data.token) {
        localStorage.setItem('cf_token', data.data.token);
      }
      setUser(data.data.user);
    }
    return data;
  };

  const registerUser = async (name, email, password, role) => {
    const data = await authService.register(name, email, password, role);
    if (data.success) {
      if (data.data.token) {
        localStorage.setItem('cf_token', data.data.token);
      }
      setUser(data.data.user);
    }
    return data;
  };

  const logoutUser = async () => {
    try {
      await authService.logout();
    } catch { /* silent */ }
    localStorage.removeItem('cf_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, registerUser, logoutUser, fetchSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
