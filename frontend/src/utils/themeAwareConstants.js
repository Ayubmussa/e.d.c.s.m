/**
 * Theme-aware constants that adapt to light/dark mode
 */

/**
 * Get mood options with theme-appropriate colors
 * @param {object} theme - The current theme object
 * @returns {array} Mood options with proper colors
 */
export const getMoodOptions = (theme) => [
  { label: 'Very Sad', value: 'very_sad', emoji: '😢', color: theme.colors.primary },
  { label: 'Sad', value: 'sad', emoji: '😞', color: theme.colors.primary },
  { label: 'Neutral', value: 'neutral', emoji: '😐', color: theme.colors.primary },
  { label: 'Happy', value: 'happy', emoji: '😊', color: theme.colors.primary },
  { label: 'Very Happy', value: 'very_happy', emoji: '😄', color: theme.colors.primary }
];

/**
 * Get health metric colors based on theme
 * @param {object} theme - The current theme object
 * @returns {object} Health metric colors
 */
export const getHealthMetricColors = (theme) => ({
  bloodPressure: theme.colors.primary,
  heartRate: theme.colors.primary,
  weight: theme.colors.primary,
  bloodSugar: theme.colors.primary,
  temperature: theme.colors.primary,
  oxygen: theme.colors.primary,
});

/**
 * Get brain training game colors based on theme
 * @param {object} theme - The current theme object
 * @returns {array} Brain training game configurations with proper colors
 */
export const getBrainTrainingGames = (theme) => [
  {
    id: 'memory',
    name: 'Memory Match',
    icon: 'brain',
    color: theme.colors.primary,
    description: 'Match pairs of cards to improve memory',
    difficulty: 'Easy'
  },
  {
    id: 'math',
    name: 'Quick Math',
    icon: 'calculator',
    color: theme.colors.primary,
    description: 'Solve simple math problems',
    difficulty: 'Medium'
  },
  {
    id: 'words',
    name: 'Word Search',
    icon: 'alphabetical',
    color: theme.colors.primary,
    description: 'Find hidden words in the grid',
    difficulty: 'Easy'
  },
  {
    id: 'patterns',
    name: 'Pattern Recognition',
    icon: 'shape',
    color: theme.colors.primary,
    description: 'Identify and complete patterns',
    difficulty: 'Hard'
  },
  {
    id: 'attention',
    name: 'Focus Challenge',
    icon: 'target',
    color: theme.colors.primary,
    description: 'Test and improve your attention span',
    difficulty: 'Medium'
  },
  {
    id: 'reaction',
    name: 'Quick Reactions',
    icon: 'lightning-bolt',
    color: theme.colors.primary,
    description: 'Test your reaction time',
    difficulty: 'Easy'
  }
];

/**
 * Get medication reminder colors based on theme
 * @param {object} theme - The current theme object
 * @returns {object} Medication reminder colors
 */
export const getMedicationColors = (theme) => ({
  taken: theme.colors.primary,
  missed: theme.colors.primary,
  pending: theme.colors.primary,
  scheduled: theme.colors.primary,
});

/**
 * Get emergency contact colors based on theme
 * @param {object} theme - The current theme object
 * @returns {object} Emergency contact colors
 */
export const getEmergencyColors = (theme) => ({
  call: theme.colors.primary,
  sms: theme.colors.primary,
  email: theme.colors.primary,
  location: theme.colors.primary,
});

/**
 * Get status colors for various app states
 * @param {object} theme - The current theme object
 * @returns {object} Status colors
 */
export const getStatusColors = (theme) => ({
  active: theme.colors.primary,
  inactive: theme.colors.primary,
  pending: theme.colors.primary,
  error: theme.colors.primary,
  info: theme.colors.primary,
  critical: theme.colors.primary,
  safe: theme.colors.primary,
});

/**
 * Get priority colors for notifications and alerts
 * @param {object} theme - The current theme object
 * @returns {object} Priority colors
 */
export const getPriorityColors = (theme) => ({
  low: theme.colors.primary,
  medium: theme.colors.primary,
  high: theme.colors.primary,
  critical: theme.colors.primary,
});
