// API Configuration - With multiple fallbacks
let apiBaseUrl = 'http://172.20.34.59:3000'; // Default fallback

try {
  const Constants = require('expo-constants').default;
  apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || apiBaseUrl;
} catch (error) {
  console.log('expo-constants not available for API config, using default');
}

export const API_CONFIG = {
  BASE_URL: apiBaseUrl,
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

console.log('API Config Debug:');
console.log('BASE_URL:', API_CONFIG.BASE_URL);

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'Elderly Digital Companion',
  VERSION: '1.0.0',
  STORAGE_KEYS: {
    AUTH_TOKEN: '@elderly_companion:auth_token',
    USER_DATA: '@elderly_companion:user_data',
    SETTINGS: '@elderly_companion:settings',
    OFFLINE_DATA: '@elderly_companion:offline_data',
  },
  NOTIFICATION_CHANNELS: {
    MEDICATION: 'medication_reminders',
    HEALTH: 'health_checkins',
    EMERGENCY: 'emergency_alerts',
    GENERAL: 'general_notifications',
  },
};

// Sensor Configuration
export const SENSOR_CONFIG = {
  ACCELEROMETER: {
    UPDATE_INTERVAL: 100, // milliseconds
    FALL_THRESHOLD: 20,   // m/s²
  },
  GYROSCOPE: {
    UPDATE_INTERVAL: 100,
  },
  LOCATION: {
    ACCURACY: 'high',
    UPDATE_INTERVAL: 30000, // 30 seconds - increased frequency for better geofencing
    DISTANCE_FILTER: 5,     // minimum movement in meters to trigger an update
    SIGNIFICANT_CHANGES: true, // use significant location changes API when available
  },
};

// Emergency Configuration
export const EMERGENCY_CONFIG = {
  FALL_DETECTION_ENABLED: false, // Disabled in favor of location-based alerts
  LOCATION_BASED_ALERTS_ENABLED: true, // Primary alerting mechanism - geofencing
  INACTIVITY_THRESHOLD: 2 * 60 * 60 * 1000, // 2 hours
  AUTO_CALL_DELAY: 30000, // 30 seconds
  GPS_ACCURACY_THRESHOLD: 100, // meters
};

// Voice Recognition Configuration
export const VOICE_CONFIG = {
  LANGUAGE: 'en-US',
  WAKE_WORDS: ['hello companion', 'help me', 'emergency'],
  CONTINUOUS_LISTENING: false,
  SPEECH_TIMEOUT: 5000,
};

// Health Configuration
export const HEALTH_CONFIG = {
  DAILY_CHECKIN_REMINDER: '09:00',
  VITAL_SIGNS_FREQUENCY: 'daily',
  MOOD_SCALE: {
    MIN: 1,
    MAX: 5,
    LABELS: ['Very Bad', 'Bad', 'Okay', 'Good', 'Very Good'],
  },
  PAIN_SCALE: {
    MIN: 0,
    MAX: 10,
    LABELS: ['No Pain', 'Mild', 'Moderate', 'Severe', 'Extreme'],
  },
};

// Medication Configuration
export const MEDICATION_CONFIG = {
  REMINDER_ADVANCE_TIME: 5 * 60 * 1000, // 5 minutes before
  SNOOZE_DURATION: 10 * 60 * 1000,      // 10 minutes
  MAX_SNOOZE_COUNT: 3,
  DEFAULT_FREQUENCIES: [
    { value: 'once_daily', label: 'Once Daily' },
    { value: 'twice_daily', label: 'Twice Daily' },
    { value: 'three_times_daily', label: 'Three Times Daily' },
    { value: 'four_times_daily', label: 'Four Times Daily' },
    { value: 'as_needed', label: 'As Needed' },
  ],
};

// Brain Training Configuration
export const BRAIN_TRAINING_CONFIG = {
  DAILY_GOAL_MINUTES: 15,
  DIFFICULTY_LEVELS: ['easy', 'medium', 'hard'],
  EXERCISE_TYPES: [
    { id: 'memory_cards', name: 'Memory Cards', icon: 'cards' },
    { id: 'word_matching', name: 'Word Matching', icon: 'text' },
    { id: 'number_sequence', name: 'Number Sequence', icon: 'numeric' },
    { id: 'pattern_recognition', name: 'Pattern Recognition', icon: 'pattern' },
  ],
  SESSION_TIMEOUT: 10 * 60 * 1000, // 10 minutes
};

// UI Configuration
export const UI_CONFIG = {
  FONT_SIZES: {
    SMALL: 16,
    MEDIUM: 18,
    LARGE: 20,
    EXTRA_LARGE: 24,
    BUTTON: 20,
    HEADER: 24,
  },
  TOUCH_TARGET_SIZE: 48, // Minimum touch target size
  ANIMATION_DURATION: 300,
  LOADING_TIMEOUT: 10000,
};
