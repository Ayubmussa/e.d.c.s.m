import { Platform } from 'react-native';

/**
 * Creates cross-platform shadow styles
 * @param {number} elevation - Shadow elevation (Android) / shadow intensity (iOS)
 * @param {string} shadowColor - Shadow color (default: '#000')
 * @param {number} shadowOpacity - Shadow opacity (iOS only, default: 0.1)
 * @param {number} shadowRadius - Shadow radius (iOS only, default: 2)
 * @param {object} shadowOffset - Shadow offset (iOS only, default: { width: 0, height: 1 })
 * @returns {object} Platform-specific shadow styles
 */
export const createShadow = (
  elevation = 2,
  shadowColor = '#000',
  shadowOpacity = 0.1,
  shadowRadius = 2,
  shadowOffset = { width: 0, height: 1 }
) => {
  if (Platform.OS === 'android') {
    return {
      elevation,
    };
  }
  
  return {
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
  };
};

/**
 * Predefined shadow styles for common use cases
 */
export const shadows = {
  small: createShadow(1, '#000', 0.1, 1, { width: 0, height: 1 }),
  medium: createShadow(2, '#000', 0.1, 2, { width: 0, height: 1 }),
  large: createShadow(4, '#000', 0.15, 4, { width: 0, height: 2 }),
  card: createShadow(2, '#000', 0.1, 2, { width: 0, height: 1 }),
  button: createShadow(3, '#000', 0.2, 3, { width: 0, height: 2 }),
};
