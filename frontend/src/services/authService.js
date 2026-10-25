import api from './api';

// API responses may be returned directly or wrapped in { success, data }.
const unwrap = (value) => {
  let result = value;
  for (let i = 0; i < 3 && result && typeof result === 'object'; i += 1) {
    if (result.access_token || result.token || result.user) break;
    if (Object.prototype.hasOwnProperty.call(result, 'data')) {
      result = result.data;
      continue;
    }
    break;
  }
  return result;
};

const persistSession = (rawResponse) => {
  const data = unwrap(rawResponse);
  const token = data?.access_token || data?.token;
  const user = data?.user;

  if (typeof token !== 'string' || !token || !user || typeof user !== 'object') {
    throw new Error(data?.message || 'The server response was incomplete. Please try again or contact support.');
  }

  localStorage.setItem('sportiq_token', token);
  localStorage.setItem('sportiq_user', JSON.stringify(user));
  return { ...data, access_token: token, user };
};

export const authService = {
  async sendOTP({ purpose, channel, destination }) {
    return unwrap(await api.post('/otp/send', { purpose, channel, destination }));
  },

  async verifyOTP({ purpose, channel, destination, code }) {
    return unwrap(await api.post('/otp/verify', { purpose, channel, destination, code }));
  },

  async register(data) {
    return unwrap(await api.post('/auth/register', data));
  },

  async login(data) {
    return persistSession(await api.post('/auth/login', data));
  },

  async forgotPassword(identifier, preferredDestination = null) {
    return unwrap(await api.post('/auth/forgot-password', {
      identifier,
      preferred_destination: preferredDestination
    }));
  },

  async verifyResetCode(identifier, code) {
    return unwrap(await api.post('/auth/verify-reset-code', { identifier, code }));
  },

  async resetPassword(resetToken, newPassword, confirmPassword) {
    return unwrap(await api.post('/auth/reset-password', {
      reset_token: resetToken,
      new_password: newPassword,
      confirm_password: confirmPassword
    }));
  },

  async getMe() {
    const user = unwrap(await api.get('/auth/me'));
    if (!user || typeof user !== 'object' || Array.isArray(user)) {
      throw new Error('The server returned an invalid session response.');
    }
    localStorage.setItem('sportiq_user', JSON.stringify(user));
    return user;
  },

  logout() {
    localStorage.removeItem('sportiq_token');
    localStorage.removeItem('sportiq_user');
  },

  getCurrentUser() {
    try {
      const raw = localStorage.getItem('sportiq_user');
      if (!raw) return null;
      const user = JSON.parse(raw);
      return user && typeof user === 'object' && !Array.isArray(user) ? user : null;
    } catch {
      localStorage.removeItem('sportiq_user');
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('sportiq_token');
  }
};

export default authService;
