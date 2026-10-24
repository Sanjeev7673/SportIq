import api from './api';

export const adminService = {
  // -------------------------------------------------------------
  // Dashboard & KPIs
  // -------------------------------------------------------------
  async getDashboard() {
    const res = await api.get('/admin/dashboard');
    return res.data?.data;
  },

  async getPlatformStats() {
    const res = await api.get('/admin/stats');
    return res.data?.data;
  },

  // -------------------------------------------------------------
  // User & Entity Management
  // -------------------------------------------------------------
  async listUsers(params = {}) {
    const res = await api.get('/admin/users', { params });
    return res.data?.data;
  },

  async listAthletes(params = {}) {
    const res = await api.get('/admin/athletes', { params });
    return res.data?.data || [];
  },

  async listCoaches(params = {}) {
    const res = await api.get('/admin/coaches', { params });
    return res.data?.data || [];
  },

  async listScouts(params = {}) {
    const res = await api.get('/admin/scouts', { params });
    return res.data?.data || [];
  },

  async toggleUserStatus(userId, isActive) {
    const res = await api.put(`/admin/users/${userId}/status`, { is_active: isActive });
    return res.data?.data;
  },

  async updateUser(userId, data) {
    const res = await api.put(`/admin/users/${userId}`, data);
    return res.data?.data;
  },

  async deleteUser(userId) {
    const res = await api.delete(`/admin/users/${userId}`);
    return res.data?.data;
  },

  // -------------------------------------------------------------
  // Event Management & Review
  // -------------------------------------------------------------
  async getEvent(eventId) {
    const res = await api.get(`/admin/events/${eventId}`);
    return res.data?.data;
  },

  // -------------------------------------------------------------
  // Reports, Notifications & System Settings
  // -------------------------------------------------------------
  async getReports() {
    const res = await api.get('/admin/reports');
    return res.data?.data;
  },

  async getNotifications() {
    const res = await api.get('/admin/notifications');
    return res.data?.data || [];
  },

  async getSettings() {
    const res = await api.get('/admin/settings');
    return res.data?.data;
  },

  async updateSettings(data) {
    const res = await api.put('/admin/settings', data);
    return res.data?.data;
  },

  // -------------------------------------------------------------
  // Sports Catalog Management
  // -------------------------------------------------------------
  async createSport(data) {
    const res = await api.post('/admin/sports', data);
    return res.data?.data;
  },

  async listSports() {
    const res = await api.get('/admin/sports');
    return res.data?.data || [];
  },

  async deleteSport(sportId) {
    const res = await api.delete(`/admin/sports/${sportId}`);
    return res.data?.data;
  },

  async deletePerformance(recordId) {
    const res = await api.delete(`/admin/performance/${recordId}`);
    return res.data?.data;
  }
};

export default adminService;
