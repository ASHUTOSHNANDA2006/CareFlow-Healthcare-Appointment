import api from './api';

export const register = async (name, email, password, role) => {
  const res = await api.post('/auth/register', { name, email, password, role });
  return res.data;
};

export const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const logout = async () => {
  const res = await api.post('/auth/logout');
  return res.data;
};

export const me = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};
