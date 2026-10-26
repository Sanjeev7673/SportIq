import api from './api';

// The FastAPI backend uses lowercase role names while the UI route guards use
// uppercase labels. Normalize the user shape at the API boundary.
const normalizeUser = (rawUser) => {
  if (!rawUser || typeof rawUser !== 'object' || Array.isArray(rawUser)) return rawUser;
  const rawRole = String(rawUser.role || '').trim().toLowerCase();
  const roleMap = {
    athlete: 'PLAYER',
    player: 'PLAYER',
    coach: 'COACH',
    scout: 'SCOUT',
    organizer: 'ORGANIZER',
    organiser: 'ORGANIZER',
    admin: 'ADMIN',
  };
  return {
    ...rawUser,
    id: rawUser.id ?? rawUser.user_id ?? rawUser.sub,
    name: rawUser.name || rawUser.full_name || rawUser.display_name ||
      (rawUser.email ? String(rawUser.email).split('@')[0] : 'SportIQ User'),
    email: rawUser.email || rawUser.email_address || '',
    role: roleMap[rawRole] || String(rawUser.role || 'PLAYER').toUpperCase(),
  };
};

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
  const user = normalizeUser(data?.user);

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
    const response = unwrap(await api.get('/auth/me'));
    const user = normalizeUser(response?.user ?? response);
    if (!user || typeof user !== 'object' || Array.isArray(user) || user.id == null || !user.role) {
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
      const user = normalizeUser(JSON.parse(raw));
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
