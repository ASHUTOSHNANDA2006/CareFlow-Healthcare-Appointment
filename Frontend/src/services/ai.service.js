import api from './api';

export const submitSymptoms = async (data) => {
  const res = await api.post('/ai/pre-visit', data);
  return res.data;
};

export const submitVisitNotes = async (data) => {
  const res = await api.post('/ai/post-visit', data);
  return res.data;
};

export const updateVisitNotes = async (id, data) => {
  const res = await api.put(`/ai/post-visit/${id}`, data);
  return res.data;
};
