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

export const getDoctorMe = async () => {
  const res = await api.get('/doctors/me');
  return res.data;
};

export const getDoctorMeLeaves = async () => {
  const res = await api.get('/doctors/me/leaves');
  return res.data;
};

export const addDoctorMeLeave = async (data) => {
  const res = await api.post('/doctors/me/leave', data);
  return res.data;
};

export const deleteDoctorMeLeave = async (id) => {
  const res = await api.delete(`/doctors/me/leave/${id}`);
  return res.data;
};

