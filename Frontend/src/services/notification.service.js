import api from './api';

export const getNotifications = async () => {
  const res = await api.get('/appointments/notifications');
  return res.data;
};

export const markRead = async (id) => {
  const res = await api.patch(`/appointments/notifications/${id}/read`);
  return res.data;
};
