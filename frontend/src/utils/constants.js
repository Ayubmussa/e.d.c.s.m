// App Configuration
export const APP_CONFIG = {
  name: 'Elderly Digital Companion',
  version: '1.0.0',
  environment: __DEV__ ? 'development' : 'production',
};

// API Configuration
export const API_CONFIG = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
};

// Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: '@edcsm_user_token',
  USER_DATA: '@edcsm_user_data',
  SETTINGS: '@edcsm_settings',
  NOTIFICATIONS: '@edcsm_notifications',
  OFFLINE_DATA: '@edcsm_offline_data',
  ONBOARDING: '@edcsm_onboarding_complete',
};

// Medication Constants
export const MEDICATION_TYPES = [
  'tablet',
  'capsule',
  'liquid',
  'injection',
  'topical',
  'inhaler',
  'drops',
  'patch',
  'other'
];

export const MEDICATION_CATEGORIES = [
  'prescription',
  'over_the_counter',
  'supplement',
  'vitamin'
];

export const DOSAGE_UNITS = [
  'mg',
  'g',
  'ml',
  'drops',
  'units',
  'tablets',
  'capsules',
  'sprays',
  'pumps'
];

export const MEDICATION_FREQUENCIES = [
  { label: 'Once daily', value: 'daily' },
  { label: 'Twice daily', value: 'twice_daily' },
  { label: 'Three times daily', value: 'three_times_daily' },
  { label: 'Four times daily', value: 'four_times_daily' },
  { label: 'Every 4 hours', value: 'every_4_hours' },
  { label: 'Every 6 hours', value: 'every_6_hours' },
  { label: 'Every 8 hours', value: 'every_8_hours' },
  { label: 'Every 12 hours', value: 'every_12_hours' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'As needed', value: 'as_needed' }
];

// Health Constants
export const MOOD_OPTIONS = [
  { label: 'Very Sad', value: 'very_sad', emoji: '😢', color: '#F44336' },
  { label: 'Sad', value: 'sad', emoji: '😞', color: '#FF9800' },
  { label: 'Neutral', value: 'neutral', emoji: '😐', color: '#FFC107' },
  { label: 'Happy', value: 'happy', emoji: '😊', color: '#8BC34A' },
  { label: 'Very Happy', value: 'very_happy', emoji: '😄', color: '#4CAF50' }
];

export const ENERGY_LEVELS = [
  { label: 'Very Low', value: 1 },
  { label: 'Low', value: 2 },
  { label: 'Moderate', value: 3 },
  { label: 'High', value: 4 },
  { label: 'Very High', value: 5 }
];

export const PAIN_LEVELS = [
  { label: 'No Pain', value: 0 },
  { label: 'Mild', value: 1 },
  { label: 'Moderate', value: 2 },
  { label: 'Severe', value: 3 },
  { label: 'Very Severe', value: 4 },
  { label: 'Worst Possible', value: 5 }
];

export const COMMON_SYMPTOMS = [
  'headache',
  'fatigue',
  'nausea',
  'dizziness',
  'shortness_of_breath',
  'chest_pain',
  'back_pain',
  'joint_pain',
  'fever',
  'cough',
  'sore_throat',
  'stomach_pain',
  'anxiety',
  'depression',
  'insomnia',
  'loss_of_appetite',
  'muscle_aches',
  'swelling',
  'rash',
  'blurred_vision'
];

export const PHYSICAL_ACTIVITIES = [
  'walking',
  'swimming',
  'cycling',
  'yoga',
  'tai_chi',
  'stretching',
  'strength_training',
  'gardening',
  'dancing',
  'hiking',
  'golf',
  'tennis',
  'water_aerobics',
  'chair_exercises',
  'balance_training'
];

// Emergency Constants
export const EMERGENCY_CONTACT_RELATIONSHIPS = [
  'spouse',
  'child',
  'parent',
  'sibling',
  'friend',
  'neighbor',
  'caregiver',
  'doctor',
  'other'
];

export const EMERGENCY_TYPES = [
  'medical',
  'fall',
  'fire',
  'police',
  'general'
];

// Brain Training Constants
export const BRAIN_GAME_CATEGORIES = [
  {
    id: 'memory',
    name: 'Memory',
    icon: 'brain',
    color: '#2196F3',
    description: 'Improve recall and working memory'
  },
  {
    id: 'attention',
    name: 'Attention',
    icon: 'eye',
    color: '#FF9800',
    description: 'Enhance focus and concentration'
  },
  {
    id: 'language',
    name: 'Language',
    icon: 'alphabetical',
    color: '#4CAF50',
    description: 'Boost vocabulary and verbal skills'
  },
  {
    id: 'logic',
    name: 'Logic',
    icon: 'puzzle',
    color: '#9C27B0',
    description: 'Strengthen reasoning and problem solving'
  },
  {
    id: 'processing',
    name: 'Speed',
    icon: 'speedometer',
    color: '#F44336',
    description: 'Improve processing speed'
  },
  {
    id: 'spatial',
    name: 'Spatial',
    icon: 'cube',
    color: '#607D8B',
    description: 'Enhance spatial awareness'
  }
];

export const GAME_DIFFICULTY_LEVELS = [
  { label: 'Beginner', value: 'easy' },
  { label: 'Intermediate', value: 'medium' },
  { label: 'Advanced', value: 'hard' },
  { label: 'Expert', value: 'expert' }
];

// Notification Constants
export const NOTIFICATION_TYPES = {
  MEDICATION_REMINDER: 'medication_reminder',
  HEALTH_CHECKIN: 'health_checkin',
  EMERGENCY_ALERT: 'emergency_alert',
  BRAIN_TRAINING: 'brain_training',
  APPOINTMENT: 'appointment',
  GENERAL: 'general'
};

export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Accessibility Constants
export const FONT_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  XLARGE: 'xlarge'
};

export const FONT_SIZE_MULTIPLIERS = {
  [FONT_SIZES.SMALL]: 0.85,
  [FONT_SIZES.MEDIUM]: 1.0,
  [FONT_SIZES.LARGE]: 1.15,
  [FONT_SIZES.XLARGE]: 1.3
};

// Voice Assistant Constants
export const VOICE_COMMANDS = {
  MEDICATION: [
    'what medications do i need to take',
    'show my medication schedule',
    'mark medication as taken',
    'when is my next dose'
  ],
  HEALTH: [
    'start health check-in',
    'show my health history',
    'how am i feeling today',
    'record my symptoms'
  ],
  EMERGENCY: [
    'call emergency services',
    'contact my emergency contact',
    'send sos alert',
    'share my location'
  ],
  BRAIN_TRAINING: [
    'start brain training',
    'play a memory game',
    'show my progress',
    'daily challenge'
  ],
  NAVIGATION: [
    'go to home',
    'open settings',
    'show notifications',
    'go back'
  ]
};

// Time Constants
export const TIME_FORMATS = {
  '12_HOUR': '12h',
  '24_HOUR': '24h'
};

export const DATE_FORMATS = {
  'MM_DD_YYYY': 'mm/dd/yyyy',
  'DD_MM_YYYY': 'dd/mm/yyyy',
  'YYYY_MM_DD': 'yyyy/mm/dd'
};

// Language Constants
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' }
];

// Validation Constants
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBER: true,
  PASSWORD_REQUIRE_SPECIAL: true,
  EMAIL_MAX_LENGTH: 254,
  NAME_MAX_LENGTH: 50,
  PHONE_MIN_LENGTH: 10
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  AUTHENTICATION_ERROR: 'Authentication failed. Please log in again.',
  PERMISSION_DENIED: 'Permission denied. Please check your permissions.',
  NOT_FOUND: 'Resource not found.',
  TIMEOUT: 'Request timeout. Please try again.',
  GENERIC_ERROR: 'An error occurred. Please try again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  REGISTER_SUCCESS: 'Account created successfully!',
  MEDICATION_ADDED: 'Medication added successfully!',
  HEALTH_CHECKIN_SAVED: 'Health check-in saved successfully!',
  SETTINGS_UPDATED: 'Settings updated successfully!',
  DATA_EXPORTED: 'Data exported successfully!',
  EMERGENCY_ALERT_SENT: 'Emergency alert sent successfully!'
};
