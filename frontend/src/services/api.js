import axios from 'axios';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.')) {
      return 'http://127.0.0.1:8000/api/v1';
    }
  }
  return 'https://sportiq-2.onrender.com/api/v1';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Bearer Token and enforce live backend if deployed
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined' && window.location) {
      const host = window.location.hostname;
      const isLocal = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.');
      if (!isLocal && (!config.baseURL || config.baseURL.includes('127.0.0.1') || config.baseURL.includes('localhost'))) {
        config.baseURL = 'https://sportiq-2.onrender.com/api/v1';
      }
    }
    const token = localStorage.getItem('sportiq_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle APIResponse envelope and 401 Logout
api.interceptors.response.use(
  (response) => {
    // Backend wraps data in { success: true, message: "...", data: {...} }
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sportiq_token');
      localStorage.removeItem('sportiq_user');
    }
    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.message ||
      'Network error. Please check if the server is running.';
    return Promise.reject(new Error(message));
  }
);

export default api;
