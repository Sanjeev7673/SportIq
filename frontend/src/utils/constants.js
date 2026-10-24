const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.')) {
      return 'http://127.0.0.1:8000/api/v1';
    }
  }
  return 'https://sportiq-2.onrender.com/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

export const USER_ROLES = {
  PLAYER: 'PLAYER',
  COACH: 'COACH',
  SCOUT: 'SCOUT',
  ORGANIZER: 'ORGANIZER',
  ADMIN: 'ADMIN',
};

export const POTENTIAL_LEVELS = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  DEVELOPING: 'DEVELOPING',
};

export const DEFAULT_SPORTS = [
  'Badminton',
  'Football',
  'Tennis',
  'Cricket',
  'Athletics',
  'Basketball',
  'Swimming',
  'Table Tennis',
  'Volleyball',
  'Kabaddi',
  'Hockey'
];

export const SPORTS_LIST = DEFAULT_SPORTS;

export const EVENT_TYPES = [
  'Tournament',
  'Championship',
  'Selection Trials',
  'League',
  'Open Meet',
  'Workshop / Coaching Camp',
  'Exhibition Match'
];

export const COMPETITION_LEVELS = [
  'School',
  'College / University',
  'Club',
  'District',
  'Divisional / Zonal',
  'State',
  'National',
  'International',
  'Open'
];

export const INDIAN_STATES = [
  'Tamil Nadu',
  'Karnataka',
  'Kerala',
  'Andhra Pradesh',
  'Telangana',
  'Maharashtra',
  'Delhi',
  'Punjab',
  'Haryana',
  'Gujarat',
  'West Bengal',
  'Rajasthan',
  'Uttar Pradesh',
  'Madhya Pradesh',
  'Odisha'
];

export const SPORT_POSITIONS = {
  Football: ['Forward', 'Winger', 'Midfielder', 'Defender', 'Goalkeeper', 'Striker'],
  Basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
  Cricket: ['Batsman', 'Fast Bowler', 'Spin Bowler', 'All-Rounder', 'Wicket-Keeper'],
  Athletics: ['Sprinter (100m/200m)', 'Middle Distance (800m/1500m)', 'Long Distance', 'Hurdles', 'Jumping'],
  Badminton: ['Men Singles', 'Women Singles', 'Men Doubles', 'Women Doubles', 'Mixed Doubles'],
  Tennis: ['Men Singles', 'Women Singles', 'Men Doubles', 'Women Doubles', 'Mixed Doubles'],
};

export const METRIC_LABELS = {
  speed: 'Speed (km/h & Acceleration)',
  stamina: 'Stamina (Aerobic Endurance)',
  strength: 'Strength (Power & Force)',
  agility: 'Agility (Change of Direction)',
  accuracy: 'Accuracy (Technical Precision)',
};
