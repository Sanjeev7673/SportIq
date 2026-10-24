import api from './api';

export const eventService = {
  /**
   * List published and verified sports events with server-side filtering.
   */
  async getEvents(params = {}) {
    const res = await api.get('/events', { params });
    return res.data?.data;
  },

  /**
   * Get complete details of a specific sports event.
   */
  async getEventDetails(eventId) {
    const res = await api.get(`/events/${eventId}`);
    return res.data?.data;
  },

  /**
   * Bookmark / save an event.
   */
  async saveEvent(eventId) {
    const res = await api.post(`/events/${eventId}/save`);
    return res.data?.data;
  },

  /**
   * Unsave / remove bookmark.
   */
  async unsaveEvent(eventId) {
    const res = await api.delete(`/events/${eventId}/save`);
    return res.data?.data;
  },

  /**
   * Get user's saved events.
   */
  async getSavedEvents() {
    const res = await api.get('/events/saved');
    return res.data?.data || [];
  },

  /**
   * Coach recommends an event to a player.
   */
  async recommendEvent(eventId, { player_id, message }) {
    const res = await api.post(`/events/${eventId}/recommend`, {
      player_id,
      message
    });
    return res.data?.data;
  },

  /**
   * Get athlete's coach-recommended events.
   */
  async getRecommendedEvents() {
    const res = await api.get('/events/recommended');
    return res.data?.data || [];
  },

  // -------------------------------------------------------------
  // Organizer APIs
  // -------------------------------------------------------------
  async organizerGetProfile() {
    const res = await api.get('/organizer/profile');
    return res.data?.data;
  },

  async organizerUpdateProfile(data) {
    const res = await api.put('/organizer/profile', data);
    return res.data?.data;
  },

  async organizerCreateEvent(data) {
    const res = await api.post('/organizer/events', data);
    return res.data?.data;
  },

  async organizerGetEvents() {
    const res = await api.get('/organizer/events');
    return res.data?.data || [];
  },

  async organizerGetEvent(eventId) {
    const res = await api.get(`/organizer/events/${eventId}`);
    return res.data?.data;
  },

  async organizerUpdateEvent(eventId, data) {
    const res = await api.put(`/organizer/events/${eventId}`, data);
    return res.data?.data;
  },

  async organizerCancelEvent(eventId) {
    const res = await api.delete(`/organizer/events/${eventId}`);
    return res.data?.data;
  },

  // -------------------------------------------------------------
  // Admin Event Management APIs
  // -------------------------------------------------------------
  async adminCreateEvent(data) {
    const res = await api.post('/admin/events', data);
    return res.data?.data;
  },

  async adminGetEvents(params = {}) {
    const res = await api.get('/admin/events', { params });
    return res.data?.data;
  },

  async adminGetPendingEvents() {
    const res = await api.get('/admin/events/pending');
    return res.data?.data || [];
  },

  async adminApproveEvent(eventId) {
    const res = await api.put(`/admin/events/${eventId}/approve`);
    return res.data?.data;
  },

  async adminRejectEvent(eventId, notes = '') {
    const res = await api.put(`/admin/events/${eventId}/reject`, {
      action: 'REJECT',
      admin_notes: notes
    });
    return res.data?.data;
  },

  async adminRequestChanges(eventId, notes = '') {
    const res = await api.put(`/admin/events/${eventId}/request-changes`, {
      action: 'REQUEST_CHANGES',
      admin_notes: notes
    });
    return res.data?.data;
  },

  async adminUpdateEvent(eventId, data) {
    const res = await api.put(`/admin/events/${eventId}`, data);
    return res.data?.data;
  },

  async adminCancelEvent(eventId) {
    const res = await api.delete(`/admin/events/${eventId}`);
    return res.data?.data;
  },

  async adminGetOrganizers() {
    const res = await api.get('/admin/organizers');
    return res.data?.data || [];
  },

  async adminVerifyOrganizer(organizerId, { status, rejection_reason }) {
    const res = await api.put(`/admin/organizers/${organizerId}/verify`, {
      status,
      rejection_reason
    });
    return res.data?.data;
  },

  async adminGetEventStats() {
    const res = await api.get('/admin/events/stats');
    return res.data?.data;
  }
};

export default eventService;
