import api from './api';

export const performanceService = {
  async addRecord(data) {
    const res = await api.post('/performance', data);
    return res.data;
  },

  async uploadEvidence(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/performance/evidence', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  async verifyRecord(recordId, verificationData) {
    const res = await api.put(`/performance/${recordId}/verify`, verificationData);
    return res.data;
  },

  async getPlayerHistory(playerId) {
    const res = await api.get(`/performance/player/${playerId}`);
    return res.data;
  },

  async getPlayerStats(playerId) {
    const res = await api.get(`/performance/player/${playerId}/stats`);
    return res.data;
  },

  async updateRecord(recordId, data) {
    const res = await api.put(`/performance/${recordId}`, data);
    return res.data;
  },

  async deleteRecord(recordId) {
    const res = await api.delete(`/performance/${recordId}`);
    return res.data;
  }
};

export default performanceService;
