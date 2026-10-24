import api from './api';

export const videoAnalysisService = {
  // Get catalog of sports and assessment drill types
  getAssessmentCatalog: async () => {
    const res = await api.get('/video-assessments/types');
    return res.data;
  },

  // Upload video assessment with upload progress callback
  uploadVideoAssessment: async (formData, onUploadProgress) => {
    const res = await api.post('/video-assessments/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted);
        }
      },
    });
    return res.data;
  },

  // Get current player's video assessments
  getMyAssessments: async () => {
    const res = await api.get('/video-assessments/my');
    return res.data;
  },

  // Get assessment details by ID
  getAssessmentDetail: async (assessmentId) => {
    const res = await api.get(`/video-assessments/${assessmentId}`);
    return res.data;
  },

  // Delete unverified video assessment
  deleteAssessment: async (assessmentId) => {
    const res = await api.delete(`/video-assessments/${assessmentId}`);
    return res.data;
  },

  // Coach verifies video assessment (Locks as immutable)
  verifyAssessment: async (assessmentId, notes) => {
    const res = await api.post(`/video-assessments/${assessmentId}/verify`, { notes });
    return res.data;
  },

  // Coach rejects video assessment with feedback
  rejectAssessment: async (assessmentId, reason) => {
    const res = await api.post(`/video-assessments/${assessmentId}/reject`, { reason });
    return res.data;
  },

  // Get assessment audit trail history
  getAssessmentAudit: async (assessmentId) => {
    const res = await api.get(`/video-assessments/${assessmentId}/audit`);
    return res.data;
  },

  // Get player video assessments for coach/scout/admin
  getPlayerAssessments: async (playerId) => {
    const res = await api.get(`/video-assessments/player/${playerId}`);
    return res.data;
  }
};

export default videoAnalysisService;
