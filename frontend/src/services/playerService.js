import api from './api';

// The shared Axios client already returns response.data. Do not unwrap .data again.
const unwrap = (value) => value?.data ?? value;

export const playerService = {
  async createProfile(data) {
    return unwrap(await api.post('/players/profile', data));
  },
  async getMyProfile() {
    return unwrap(await api.get('/players/profile/me'));
  },
  async updateMyProfile(data) {
    return unwrap(await api.put('/players/profile/me', data));
  },
  async uploadPhoto(file) {
    const formData = new FormData();
    formData.append('file', file);
    return unwrap(await api.post('/players/profile/photo', formData));
  },
  async deleteMyProfile() {
    return unwrap(await api.delete('/players/profile/me'));
  },
  async listPlayers(params = {}) {
    return unwrap(await api.get('/players', { params }));
  },
  async getPlayerById(playerId) {
    return unwrap(await api.get(`/players/${playerId}`));
  }
};

export default playerService;
