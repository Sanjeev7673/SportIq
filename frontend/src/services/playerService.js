import api from './api';

export const playerService = {
  async createProfile(data) {
    const res = await api.post('/players/profile', data);
    return res.data;
  },

  async getMyProfile() {
    const res = await api.get('/players/profile/me');
    return res.data;
  },

  async updateMyProfile(data) {
    const res = await api.put('/players/profile/me', data);
    return res.data;
  },

  async uploadPhoto(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/players/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async deleteMyProfile() {
    const res = await api.delete('/players/profile/me');
    return res.data;
  },

  async listPlayers(params = {}) {
    const res = await api.get('/players', { params });
    return res.data;
  },

  async getPlayerById(playerId) {
    const res = await api.get(`/players/${playerId}`);
    return res.data;
  }
};
