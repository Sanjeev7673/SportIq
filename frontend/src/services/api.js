import axios from 'axios';

const LOCAL_API = 'http://127.0.0.1:8000/api/v1';
const configuredApi = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');

const isLocalHost = () => {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' ||
    host.startsWith('192.168.') || host.startsWith('10.');
};

// Production must point to a real API deployment. Never silently use an old provider.
const getApiBaseUrl = () => configuredApi || (isLocalHost() ? LOCAL_API : '');

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 180000,
});

api.interceptors.request.use(
  (config) => {
    if (!config.baseURL) {
      return Promise.reject(new Error(
        'SportIQ API is not connected yet. Sign-in, profile sync, and video analysis need the live backend URL.'
      ));
    }

    // Axios must generate the multipart boundary itself for video uploads.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers?.['Content-Type'];
      delete config.headers?.['content-type'];
    } else if (config.data && typeof config.data === 'object' && !(config.data instanceof Blob)) {
      config.headers = config.headers || {};
      if (!config.headers['Content-Type'] && !config.headers['content-type']) {
        config.headers['Content-Type'] = 'application/json';
      }
    }

    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('sportiq_token') : null;
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
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('sportiq_token');
        localStorage.removeItem('sportiq_user');
      }
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('sportiq:unauthorized'));
    }
    const serverMessage = error.response?.data?.message || error.response?.data?.detail || error.response?.data?.error;
    const message = serverMessage || (error.code === 'ECONNABORTED'
      ? 'The request timed out. Try a shorter video or retry.'
      : !error.response
        ? error.message || 'Cannot connect to SportIQ services. The live API URL must be configured.'
        : error.message || 'Request failed. Please try again.');
    const normalizedError = new Error(typeof message === 'string' ? message : 'Request failed. Please try again.');
    normalizedError.status = status;
    normalizedError.code = error.code;
    return Promise.reject(normalizedError);
  }
);

export const wakeBackend = () => {
  const baseUrl = api.defaults.baseURL;
  if (!baseUrl) return Promise.resolve();
  const healthUrl = baseUrl.replace(/\/api\/v1\/?$/, '');
  return fetch(`${healthUrl}/health`, { method: 'GET' }).catch(() => undefined);
};

export default api;
