import api from './api';

export const aiService = {
  async predictTalent(data) {
    const res = await api.post('/ai/predict', data);
    return res.data;
  },

  async getLatestPlayerAI(playerId) {
    const res = await api.get(`/ai/players/${playerId}/latest`);
    return res.data;
  },

  async getPlayerAIHistory(playerId) {
    const res = await api.get(`/ai/players/${playerId}/history`);
    return res.data;
  }
};
