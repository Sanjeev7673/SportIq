import api from './api';

export const coachService = {
  async listSquadPlayers(params = {}) {
    const res = await api.get('/coaches/players', { params });
    return res.data;
  },

  async getPlayerPerformance(playerId) {
    const res = await api.get(`/coaches/players/${playerId}/performance`);
    return res.data;
  },

  async comparePlayers(playerIds) {
    const res = await api.post('/coaches/compare', { player_ids: playerIds });
    return res.data;
  },

  async createRecommendation(data) {
    const res = await api.post('/coaches/recommendations', data);
    return res.data;
  },

  async getMyRecommendations() {
    const res = await api.get('/coaches/recommendations');
    return res.data;
  },

  async getPlayerRecommendations(playerId) {
    const res = await api.get(`/coaches/recommendations/player/${playerId}`);
    return res.data;
  },

  async updateRecommendation(recId, data) {
    const res = await api.put(`/coaches/recommendations/${recId}`, data);
    return res.data;
  },

  async deleteRecommendation(recId) {
    const res = await api.delete(`/coaches/recommendations/${recId}`);
    return res.data;
  }
};
