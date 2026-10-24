export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

export const getPotentialBadgeColor = (level) => {
  switch (level?.toUpperCase()) {
    case 'HIGH':
    case 'HIGH POTENTIAL':
      return 'bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/30';
    case 'MEDIUM':
    case 'SOLID PROSPECT':
      return 'bg-[#2563EB]/15 text-[#60A5FA] border-[#2563EB]/30';
    case 'DEVELOPING':
    default:
      return 'bg-[#94A3B8]/15 text-[#94A3B8] border-[#94A3B8]/30';
  }
};

export const getPerformanceStatusBadgeColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'AI ANALYZED':
      return 'bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/30';
    case 'EVALUATED':
      return 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30';
    case 'NOT EVALUATED':
    default:
      return 'bg-[#94A3B8]/15 text-[#94A3B8] border-[#94A3B8]/30';
  }
};

export const getRoleBadgeColor = (role) => {
  switch (role?.toUpperCase()) {
    case 'PLAYER':
      return 'bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/30';
    case 'COACH':
      return 'bg-[#2563EB]/15 text-[#60A5FA] border-[#2563EB]/30';
    case 'SCOUT':
      return 'bg-[#2563EB]/15 text-[#60A5FA] border-[#2563EB]/30';
    case 'ORGANIZER':
      return 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30';
    case 'ADMIN':
      return 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30';
    default:
      return 'bg-[#94A3B8]/15 text-[#94A3B8] border-[#94A3B8]/30';
  }
};

export const getScoreColor = (score) => {
  if (score >= 85) return 'text-[#06B6D4]';
  if (score >= 70) return 'text-[#2563EB]';
  if (score >= 55) return 'text-[#F59E0B]';
  return 'text-[#EF4444]';
};

export const getConfidenceColor = (score) => {
  if (score >= 85) return 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/30';
  if (score >= 70) return 'text-[#06B6D4] bg-[#06B6D4]/10 border-[#06B6D4]/30';
  if (score >= 50) return 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30';
  return 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30';
};

export const getSourceTypeDetails = (sourceType) => {
  switch (sourceType?.toUpperCase()) {
    case 'STANDARDIZED_FIELD_TEST':
      return {
        label: 'Field Test Protocol',
        icon: '⏱️',
        badgeColor: 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30'
      };
    case 'SMARTPHONE_DERIVED':
      return {
        label: 'Smartphone Sensor',
        icon: '📱',
        badgeColor: 'bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/30'
      };
    case 'COACH_VERIFIED':
      return {
        label: 'Coach Certified Trial',
        icon: '📋',
        badgeColor: 'bg-[#2563EB]/10 text-[#60A5FA] border-[#2563EB]/30'
      };
    case 'WEARABLE_DEVICE':
      return {
        label: 'Wearable Sensor',
        icon: '⌚',
        badgeColor: 'bg-[#2563EB]/10 text-[#60A5FA] border-[#2563EB]/30'
      };
    case 'SELF_REPORTED_MANUAL':
    default:
      return {
        label: 'Self-Reported Entry',
        icon: '✍️',
        badgeColor: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30'
      };
  }
};

export const getVerificationStatusDetails = (status) => {
  switch (status?.toUpperCase()) {
    case 'COACH_VERIFIED':
      return {
        label: 'Coach Certified',
        badgeColor: 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30',
        isVerified: true
      };
    case 'AI_VIDEO_VERIFIED':
      return {
        label: 'Video AI Verified',
        badgeColor: 'bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/30',
        isVerified: true
      };
    case 'SYSTEM_VALIDATED':
      return {
        label: 'System Validated',
        badgeColor: 'bg-[#2563EB]/10 text-[#60A5FA] border-[#2563EB]/30',
        isVerified: true
      };
    case 'UNVERIFIED':
    default:
      return {
        label: 'Unverified Entry',
        badgeColor: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30',
        isVerified: false
      };
  }
};

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const getServerBaseUrl = () => {
    if (import.meta.env.VITE_SERVER_URL) {
      return import.meta.env.VITE_SERVER_URL;
    }
    if (typeof window !== 'undefined' && window.location) {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.')) {
        return 'http://127.0.0.1:8000';
      }
    }
    return 'https://sportiq-2.onrender.com';
  };

  const backendBase = getServerBaseUrl();
  return `${backendBase}${path.startsWith('/') ? '' : '/'}${path}`;
};
