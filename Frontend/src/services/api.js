import axios from 'axios';

const RENDER_BACKEND_URL = 'https://careflow-healthcare-appointment.onrender.com/api';

// Auto-detect backend URL: env var -> localhost (if on dev machine) -> deployed Render URL
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5000/api';
  }
  return RENDER_BACKEND_URL;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach Bearer token header if present in localStorage (cross-domain backup)
api.interceptors.request.use((reqConfig) => {
  const token = localStorage.getItem('cf_token');
  if (token) {
    reqConfig.headers.Authorization = `Bearer ${token}`;
  }
  return reqConfig;
});

// Redirect to /auth on 401 (session expired/invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if not already on auth page
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

