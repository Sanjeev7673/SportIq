// Offline Queue Manager for Rural / Disconnected Environments

const STORAGE_KEY = 'sportiq_offline_performance_queue';

export const offlineQueue = {
  getQueue() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading offline queue:', e);
      return [];
    }
  },

  addLog(logData) {
    try {
      const queue = this.getQueue();
      const newEntry = {
        ...logData,
        _offline_id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        _queued_at: new Date().toISOString(),
        _synced: false
      };
      queue.push(newEntry);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
      return newEntry;
    } catch (e) {
      console.error('Error adding to offline queue:', e);
      return null;
    }
  },

  removeLog(offlineId) {
    try {
      const queue = this.getQueue().filter(item => item._offline_id !== offlineId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Error removing from offline queue:', e);
    }
  },

  clearQueue() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Error clearing offline queue:', e);
    }
  },

  async syncQueue(apiSubmitFn) {
    const queue = this.getQueue();
    if (queue.length === 0) return { success: true, count: 0 };

    let syncedCount = 0;
    const errors = [];

    for (const item of queue) {
      try {
        const { _offline_id, _queued_at, _synced, ...payload } = item;
        await apiSubmitFn(payload);
        this.removeLog(_offline_id);
        syncedCount++;
      } catch (err) {
        console.error('Failed to sync item:', item, err);
        errors.push({ item, error: err.message });
      }
    }

    return {
      success: errors.length === 0,
      syncedCount,
      remaining: this.getQueue().length,
      errors
    };
  }
};

export default offlineQueue;
