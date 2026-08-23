import api from './api';

export const getDoctors = async (params) => {
  const res = await api.get('/doctors', { params });
  return res.data;
};

export const getDoctorById = async (id) => {
  const res = await api.get(`/doctors/${id}`);
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
