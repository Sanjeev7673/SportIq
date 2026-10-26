import axios from 'axios';

const LOCAL_API = 'http://127.0.0.1:8000/api/v1';
const configuredApi = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');

const isLocalHost = () => {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' ||
    host.startsWith('192.168.') || host.startsWith('10.');
};

// Never silently route production traffic to an old provider or a fake API.
// Configure VITE_API_URL to the actual deployed API URL when the backend is deployed.
const getApiBaseUrl = () => configuredApi || (isLocalHost() ? LOCAL_API : '');

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
});

api.interceptors.request.use(
  (config) => {
    if (!config.baseURL) {
      return Promise.reject(new Error(
        'SportIQ backend is not configured yet. The frontend is online, but the API deployment URL has not been connected.'
      ));
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
      localStorage.removeItem('sportiq_token');
      localStorage.removeItem('sportiq_user');
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('sportiq:unauthorized'));
    }
    const serverMessage = error.response?.data?.message || error.response?.data?.detail || error.response?.data?.error;
    const message = serverMessage || (error.code === 'ECONNABORTED'
      ? 'The request timed out. Try a shorter video or retry.'
      : !error.response
        ? error.message || 'Cannot connect to SportIQ services. Check the backend deployment and API URL.'
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
