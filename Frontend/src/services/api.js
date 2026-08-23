import axios from 'axios';

const RENDER_BACKEND_URL = 'https://careflow-healthcare-appointment.onrender.com/api';

// Auto-detect backend URL: env var -> localhost (if on dev machine) -> deployed Render URL
const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (!url && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    url = 'http://localhost:5000/api';
  }
  if (!url) {
    url = RENDER_BACKEND_URL;
  }
  url = url.trim().replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
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

// Handle 401 (session expired/invalid) by clearing stored token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cf_token');
    }
    return Promise.reject(error);
  }
);

export default api;

