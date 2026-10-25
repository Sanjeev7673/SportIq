import axios from 'axios';

const LOCAL_API = 'http://127.0.0.1:8000/api/v1';
const PRODUCTION_API = 'https://sportiq-2.onrender.com/api/v1';

const getApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.')
    ) return LOCAL_API;
  }
  return PRODUCTION_API;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      const isLocal = host === 'localhost' || host === '127.0.0.1' ||
        host.startsWith('192.168.') || host.startsWith('10.');

      // Never allow a deployed frontend to accidentally call localhost.
      if (!isLocal && (!config.baseURL || /localhost|127\.0\.0\.1/.test(config.baseURL))) {
        config.baseURL = PRODUCTION_API;
      }
    }

    const token = localStorage.getItem('sportiq_token');
    config.headers = config.headers || {};
    if (token) config.headers.Authorization = `Bearer ${token}`;
    else delete config.headers.Authorization;

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      localStorage.removeItem('sportiq_token');
      localStorage.removeItem('sportiq_user');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('sportiq:unauthorized'));
      }
    }

    const serverMessage =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.response?.data?.error;
    const message = serverMessage ||
      (error.code === 'ECONNABORTED'
        ? 'The server took too long to respond. Please try again.'
        : !error.response
          ? 'Cannot connect to SportIQ services. The backend may be waking up; please retry shortly.'
          : error.message || 'Request failed. Please try again.');

    const normalizedError = new Error(typeof message === 'string' ? message : 'Request failed. Please try again.');
    normalizedError.status = status;
    normalizedError.code = error.code;
    return Promise.reject(normalizedError);
  }
);

export default api;
