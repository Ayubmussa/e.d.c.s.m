/**
 * Format date for display
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return dateObj.toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

/**
 * Format time for display
 */
export const formatTime = (date, use24Hour = false) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !use24Hour,
  });
};

/**
 * Format medication dosage
 */
export const formatDosage = (dosage, unit = 'mg') => {
  if (!dosage) return '';
  return `${dosage} ${unit}`;
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now - dateObj;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDate(dateObj);
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format US phone numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  return phone;
};

/**
 * Generate medication schedule times
 */
export const generateScheduleTimes = (frequency, startTime = '08:00') => {
  const times = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  
  let interval = 24; // Default to once daily
  
  switch (frequency) {
    case 'twice_daily':
      interval = 12;
      break;
    case 'three_times_daily':
      interval = 8;
      break;
    case 'four_times_daily':
      interval = 6;
      break;
    case 'every_6_hours':
      interval = 6;
      break;
    case 'every_8_hours':
      interval = 8;
      break;
    case 'every_12_hours':
      interval = 12;
      break;
  }
  
  let currentHour = startHour;
  let currentMinute = startMinute;
  
  for (let i = 0; i < 24 / interval; i++) {
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    times.push(timeString);
    
    currentHour = (currentHour + interval) % 24;
  }
  
  return times;
};

/**
 * Calculate next medication time
 */
export const getNextMedicationTime = (schedule) => {
  if (!schedule || !schedule.times || schedule.times.length === 0) {
    return null;
  }
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  for (const timeStr of schedule.times) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const scheduleTime = hours * 60 + minutes;
    
    if (scheduleTime > currentTime) {
      const nextTime = new Date();
      nextTime.setHours(hours, minutes, 0, 0);
      return nextTime;
    }
  }
  
  // If no time today, return first time tomorrow
  const [hours, minutes] = schedule.times[0].split(':').map(Number);
  const nextTime = new Date();
  nextTime.setDate(nextTime.getDate() + 1);
  nextTime.setHours(hours, minutes, 0, 0);
  return nextTime;
};

/**
 * Calculate health score from various metrics
 */
export const calculateHealthScore = (metrics) => {
  if (!metrics) return 0;
  
  const {
    mood = 3,
    energyLevel = 3,
    painLevel = 0,
    sleepQuality = 3,
    stressLevel = 3
  } = metrics;
  
  // Convert mood (1-5 scale) to score (0-100)
  const moodScore = ((mood - 1) / 4) * 100;
  
  // Convert energy (1-5 scale) to score (0-100)
  const energyScore = ((energyLevel - 1) / 4) * 100;
  
  // Convert pain (0-10 scale, lower is better) to score (0-100)
  const painScore = Math.max(0, (10 - painLevel) / 10) * 100;
  
  // Convert sleep quality (1-5 scale) to score (0-100)
  const sleepScore = ((sleepQuality - 1) / 4) * 100;
  
  // Convert stress (1-5 scale, lower is better) to score (0-100)
  const stressScore = Math.max(0, (5 - stressLevel) / 4) * 100;
  
  // Calculate weighted average
  const totalScore = (
    moodScore * 0.25 +
    energyScore * 0.25 +
    painScore * 0.20 +
    sleepScore * 0.15 +
    stressScore * 0.15
  );
  
  return Math.round(totalScore);
};

/**
 * Get health status from score
 */
export const getHealthStatus = (score) => {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  if (score >= 40) return 'poor';
  return 'critical';
};

/**
 * Debounce function for search inputs
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Generate unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
};

/**
 * Storage helpers
 */
export const storage = {
  async set(key, value) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error storing data:', error);
    }
  },
  
  async get(key) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  },
  
  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data:', error);
    }
  },
  
  async clear() {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
};
