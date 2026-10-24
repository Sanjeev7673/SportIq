import api from './api';

export const scoutService = {
  async searchTalent(params = {}) {
    const res = await api.get('/scouts/search', { params });
    return res.data;
  },

  async getPlayerPerformance(playerId) {
    const res = await api.get(`/scouts/players/${playerId}/performance`);
    return res.data;
  },

  async compareProspects(playerIds) {
    const res = await api.post('/scouts/compare', { player_ids: playerIds });
    return res.data;
  },

  async addToShortlist(data) {
    const res = await api.post('/scouts/shortlist', data);
    return res.data;
  },

  async getShortlist() {
    const res = await api.get('/scouts/shortlist');
    return res.data;
  },

  async updateShortlistNotes(itemId, data) {
    const res = await api.put(`/scouts/shortlist/${itemId}`, data);
    return res.data;
  },

  async removeFromShortlist(itemId) {
    const res = await api.delete(`/scouts/shortlist/${itemId}`);
    return res.data;
  }
};
