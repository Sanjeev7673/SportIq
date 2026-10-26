import api from './api';

const LOCAL_CATALOG = [
  { sport: 'Football', assessment_types: [
    { name: 'Sprint', description: 'Acceleration and running form' },
    { name: 'Agility', description: 'Change of direction' },
    { name: 'Ball Control', description: 'On-ball technical review' },
  ] },
  { sport: 'Basketball', assessment_types: [
    { name: 'Sprint', description: 'Acceleration and running form' },
    { name: 'Agility', description: 'Change of direction' },
    { name: 'Shooting', description: 'Shooting form review' },
  ] },
];

const reportToAssessment = (report) => {
  const metrics = report?.analysis_metrics && typeof report.analysis_metrics === 'object'
    ? report.analysis_metrics
    : {};
  const observableMetrics = Object.entries(metrics)
    .filter(([, value]) => value !== null && value !== undefined && typeof value !== 'object')
    .map(([name, value]) => ({
      metric_name: name.replaceAll('_', ' '),
      value: String(value),
      unit: name.includes('percent') ? '%' : '',
      is_observable: true,
      status_note: 'Experimental computer-vision measurement; not a validated performance benchmark.',
    }));
  Object.entries(metrics).forEach(([name, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && value.mean !== undefined) {
      observableMetrics.push({
        metric_name: name.replaceAll('_', ' '),
        value: String(value.mean),
        unit: name.includes('angle') ? 'deg' : '',
        is_observable: true,
        status_note: `Observed range: ${value.minimum ?? '—'} to ${value.maximum ?? '—'}; experimental 2D estimate.`,
      });
    }
  });
  const status = report?.analysis_status || 'analysis_pending';
  const summary = report?.strengths || 'No analysis summary was returned by the server.';
  return {
    ...report,
    id: report?.id,
    sport: report?.sport || 'Unspecified',
    assessment_type: report?.discipline || 'General Review',
    original_filename: report?.video_filename || `Video report #${report?.id ?? ''}`,
    uploaded_at: report?.created_at,
    status: status === 'pose_metrics_available' ? 'ANALYSIS_COMPLETE'
      : status === 'insufficient_pose_visibility' ? 'ANALYSIS_LIMITED'
      : status === 'pose_analysis_unavailable' ? 'ANALYSIS_UNAVAILABLE'
      : status === 'video_read_failed' ? 'VIDEO_READ_FAILED' : 'ANALYSIS_PENDING',
    processing_status: status,
    validation_status: status === 'pose_metrics_available' ? 'POSE_METRICS_AVAILABLE'
      : status === 'insufficient_pose_visibility' ? 'INSUFFICIENT_EVIDENCE' : status.toUpperCase(),
    analysis_result: {
      summary,
      observable_metrics: observableMetrics,
      limitations: report?.improvements || '',
    },
    local_review_only: false,
    backend_report: true,
  };
};

export const videoAnalysisService = {
  // The API currently accepts sport and discipline text rather than a catalog endpoint.
  getAssessmentCatalog: async () => LOCAL_CATALOG,

  // The backend exposes reports, not the legacy /video-assessments resource.
  getMyAssessments: async () => {
    const response = await api.get('/reports');
    return { assessments: (response?.reports || []).map(reportToAssessment), total: response?.reports?.length || 0 };
  },

  // Upload a video to the real backend endpoint and let it run its configured pose pipeline.
  uploadVideoAssessment: async (formData, onUploadProgress) => {
    const outgoing = new FormData();
    outgoing.append('sport', formData.get('sport') || 'Unspecified');
    outgoing.append('discipline', formData.get('assessment_type') || 'General Review');
    outgoing.append('notes', formData.get('notes') || '');
    const file = formData.get('file') || formData.get('video');
    if (!(file instanceof File)) {
      throw new Error('Choose a video file before starting analysis.');
    }
    const allowedExtensions = /\.(mp4|mov|webm|mkv)$/i;
    if (!(file.type.startsWith('video/') || allowedExtensions.test(file.name))) {
      throw new Error('Unsupported video format. Choose MP4, MOV, WebM, or MKV.');
    }
    if (file.size > 250 * 1024 * 1024) {
      throw new Error('Video exceeds the server limit of 250 MB.');
    }
    outgoing.append('video', file, file.name);
    const response = await api.post('/athletes/me/videos', outgoing, {
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          onUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      },
    });
    return response;
  },

  downloadReportPdf: async (assessmentId) => api.get(`/reports/${assessmentId}/pdf`, { responseType: 'blob' }),

  getAssessmentDetail: async (assessmentId) => {
    const response = await api.get(`/reports/${assessmentId}`);
    return reportToAssessment(response?.report || {});
  },

  // The current backend does not expose report deletion; fail clearly instead of calling a nonexistent route.
  deleteAssessment: async () => {
    throw new Error('Report deletion is not available in the current backend yet.');
  },

  verifyAssessment: async () => {
    throw new Error('Coach verification is not available in the current backend yet.');
  },

  rejectAssessment: async () => {
    throw new Error('Coach review actions are not available in the current backend yet.');
  },

  getAssessmentAudit: async () => {
    throw new Error('Assessment audit history is not available in the current backend yet.');
  },

  getPlayerAssessments: async (playerId) => {
    const response = await api.get(`/reports?player_id=${encodeURIComponent(playerId)}`);
    return { assessments: (response?.reports || []).map(reportToAssessment) };
  },
};

export default videoAnalysisService;
