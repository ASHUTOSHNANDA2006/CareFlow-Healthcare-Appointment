import api from './api';

export const getAvailability = async (doctorId, date) => {
  const res = await api.get(`/appointments/doctors/${doctorId}/availability`, { params: { date } });
  return res.data;
};

export const holdSlot = async (data) => {
  const res = await api.post('/appointments/hold', data);
  return res.data;
};

export const confirmBooking = async (data) => {
  const res = await api.post('/appointments/confirm', data);
  return res.data;
};

export const getAppointments = async () => {
  const res = await api.get('/appointments');
  return res.data;
};

export const cancelAppointment = async (id) => {
  const res = await api.patch(`/appointments/${id}/cancel`);
  return res.data;
};

export const rescheduleAppointment = async (id, data) => {
  const res = await api.patch(`/appointments/${id}/reschedule`, data);
  return res.data;
};
