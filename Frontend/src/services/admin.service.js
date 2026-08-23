import api from './api';

export const getAdminUsers = async () => {
  const res = await api.get('/admin/users');
  return res.data;
};

export const getAdminAppointments = async () => {
  const res = await api.get('/admin/appointments');
  return res.data;
};

export const getAdminDoctors = async () => {
  const res = await api.get('/admin/doctors');
  return res.data;
};

export const createDoctor = async (data) => {
  const res = await api.post('/admin/doctors', data);
  return res.data;
};

export const updateDoctor = async (id, data) => {
  const res = await api.patch(`/admin/doctors/${id}`, data);
  return res.data;
};

export const addDoctorLeave = async (doctorId, data) => {
  const res = await api.post(`/admin/doctors/${doctorId}/leave`, data);
  return res.data;
};

export const toggleUserStatus = async (id) => {
  const res = await api.patch(`/admin/users/${id}/status`);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await api.delete(`/admin/users/${id}`);
  return res.data;
};

