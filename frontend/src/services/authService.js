import api from './api';

export const authService = {
  async register(data) {
    const res = await api.post('/auth/register', data);
    const tokenData = res?.data || res;
    if (tokenData?.access_token) {
      localStorage.setItem('sportiq_token', tokenData.access_token);
      localStorage.setItem('sportiq_user', JSON.stringify(tokenData.user));
    }
    return tokenData;
  },

  async login(data) {
    const res = await api.post('/auth/login', data);
    const tokenData = res?.data || res;
    if (tokenData?.access_token) {
      localStorage.setItem('sportiq_token', tokenData.access_token);
      localStorage.setItem('sportiq_user', JSON.stringify(tokenData.user));
    }
    return tokenData;
  },

  async forgotPassword(identifier, preferredDestination = null) {
    const res = await api.post('/auth/forgot-password', {
      identifier,
      preferred_destination: preferredDestination
    });
    return res?.data !== undefined ? res.data : res;
  },

  async verifyResetCode(identifier, code) {
    const res = await api.post('/auth/verify-reset-code', {
      identifier,
      code
    });
    return res?.data !== undefined ? res.data : res;
  },

  async resetPassword(resetToken, newPassword, confirmPassword) {
    const res = await api.post('/auth/reset-password', {
      reset_token: resetToken,
      new_password: newPassword,
      confirm_password: confirmPassword
    });
    return res?.data !== undefined ? res.data : res;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    const userData = res?.data !== undefined ? res.data : res;
    if (userData) {
      localStorage.setItem('sportiq_user', JSON.stringify(userData));
    }
    return userData;
  },

  logout() {
    localStorage.removeItem('sportiq_token');
    localStorage.removeItem('sportiq_user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('sportiq_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken() {
    return localStorage.getItem('sportiq_token');
  }
};

export default authService;
