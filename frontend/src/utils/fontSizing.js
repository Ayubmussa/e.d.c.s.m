/**
 * Font sizing utilities for elderly-friendly dynamic font scaling
 */

/**
 * Get font size multiplier based on user preference
 * Updated for elderly-friendly base sizes (already larger by default)
 * @param {string} fontSizePreference - 'small', 'medium', 'large', 'xlarge'
 * @returns {number} multiplier to apply to base font sizes
 */
export const getFontSizeMultiplier = (fontSizePreference) => {
  switch (fontSizePreference) {
    case 'small':
      return 0.9;   // slightly increased from 0.85 - still readable for elderly
    case 'medium':
      return 1.0;   // default - already elderly-friendly
    case 'large':
      return 1.2;   // increased from 1.15 for better elderly accessibility
    case 'xlarge':
      return 1.4;   // increased from 1.3 for vision-impaired users
    default:
      return 1.0;
  }
};

/**
 * Scale a font size based on user preference
 * @param {number} baseFontSize - Base font size in pixels (already elderly-friendly)
 * @param {string} fontSizePreference - User's font size preference
 * @returns {number} scaled font size
 */
export const scaleFontSize = (baseFontSize, fontSizePreference = 'medium') => {
  const multiplier = getFontSizeMultiplier(fontSizePreference);
  return Math.round(baseFontSize * multiplier);
};

/**
 * Get responsive font sizes for different screen contexts
 * Updated with elderly-friendly base sizes (18px minimum for body text)
 * @param {string} fontSizePreference - User's font size preference
 * @returns {object} object with common scaled font sizes
 */
export const getResponsiveFontSizes = (fontSizePreference = 'medium') => {
  const multiplier = getFontSizeMultiplier(fontSizePreference);
  
  return {
    // Text sizes - elderly-friendly base sizes
    caption: Math.round(16 * multiplier),      // increased from 12
    body: Math.round(18 * multiplier),         // increased from 14 - minimum readable
    bodyLarge: Math.round(20 * multiplier),    // increased from 16
    title: Math.round(22 * multiplier),        // increased from 18
    titleMedium: Math.round(24 * multiplier),  // increased from 20
    titleLarge: Math.round(26 * multiplier),   // increased from 22
    headline: Math.round(30 * multiplier),     // increased from 24
    headlineMedium: Math.round(34 * multiplier), // increased from 28
    headlineLarge: Math.round(38 * multiplier),  // increased from 32
    display: Math.round(42 * multiplier),        // increased from 36
    
    // Button and UI element sizes - larger for elderly users
    button: Math.round(20 * multiplier),           // increased from 16
    buttonLarge: Math.round(24 * multiplier),      // new large button size
    tab: Math.round(18 * multiplier),              // increased from 14
    navigationTitle: Math.round(22 * multiplier),  // increased from 18
    
    // Specific use cases for elderly-friendly design
    medicationLabel: Math.round(20 * multiplier),     // increased from 16
    emergencyButton: Math.round(24 * multiplier),     // increased from 18
    healthMetric: Math.round(26 * multiplier),        // increased from 20
    alertMessage: Math.round(20 * multiplier),        // increased from 16
    cardTitle: Math.round(22 * multiplier),           // new card title size
    cardContent: Math.round(18 * multiplier),         // new card content size
    quickActionTitle: Math.round(18 * multiplier),    // new quick action size
    welcomeText: Math.round(20 * multiplier),         // new welcome text size
  };
};

/**
 * Hook-like function to get scaled font sizes with theme context
 * Use this in components that need font scaling
 */
export const useScaledFontSizes = (theme, fontSizePreference) => {
  return getResponsiveFontSizes(fontSizePreference);
};

/**
 * Apply font scaling to a React Native Paper theme
 * Enhanced for elderly-friendly typography system
 * @param {object} baseTheme - Base theme object
 * @param {string} fontSizePreference - User's font size preference
 * @returns {object} theme with scaled fonts
 */
export const applyFontScaling = (baseTheme, fontSizePreference = 'medium') => {
  const multiplier = getFontSizeMultiplier(fontSizePreference);
  
  const scaledTypography = {};
  const scaledFonts = {};

  // Scale typography with elderly-friendly minimum sizes
  if (baseTheme.typography) {
    Object.keys(baseTheme.typography).forEach(key => {
      const originalSize = baseTheme.typography[key].fontSize;
      const scaledSize = Math.round(originalSize * multiplier);
      
      // Ensure minimum readable sizes for elderly users
      const minSize = getMinimumFontSize(key);
      const finalSize = Math.max(scaledSize, minSize);
      
      scaledTypography[key] = {
        ...baseTheme.typography[key],
        fontSize: finalSize,
      };
    });
  }

  // Scale fonts (React Native Paper v5) with minimum size enforcement
  if (baseTheme.fonts) {
    Object.keys(baseTheme.fonts).forEach(key => {
      if (baseTheme.fonts[key].fontSize) {
        const originalSize = baseTheme.fonts[key].fontSize;
        const scaledSize = Math.round(originalSize * multiplier);
        
        // Ensure minimum readable sizes
        const minSize = getMinimumFontSizeForFont(key);
        const finalSize = Math.max(scaledSize, minSize);
        
        scaledFonts[key] = {
          ...baseTheme.fonts[key],
          fontSize: finalSize,
        };
      } else {
        scaledFonts[key] = baseTheme.fonts[key];
      }
    });
  }

  return {
    ...baseTheme,
    typography: scaledTypography,
    fonts: scaledFonts,
  };
};

/**
 * Get minimum font size for typography variants (elderly accessibility)
 * @param {string} variant - Typography variant name
 * @returns {number} minimum font size in pixels
 */
const getMinimumFontSize = (variant) => {
  const minimums = {
    caption: 14,      // minimum readable size
    body: 16,         // minimum body text
    body1: 18,        // minimum comfortable body text
    body2: 16,        // minimum secondary body text
    button: 18,       // minimum button text
    h6: 18,           // minimum heading
    h5: 20,
    h4: 22,
    h3: 26,
    h2: 30,
    h1: 34,
    title: 20,
    subtitle: 18,
    cardTitle: 20,
    cardContent: 16,
  };
  
  return minimums[variant] || 16; // default minimum
};

/**
 * Get minimum font size for React Native Paper font variants
 * @param {string} fontKey - Font variant key
 * @returns {number} minimum font size in pixels
 */
const getMinimumFontSizeForFont = (fontKey) => {
  const minimums = {
    bodySmall: 14,
    bodyMedium: 16,
    bodyLarge: 18,
    labelSmall: 12,
    labelMedium: 14,
    labelLarge: 16,
    titleSmall: 16,
    titleMedium: 18,
    titleLarge: 22,
    headlineSmall: 26,
    headlineMedium: 30,
    headlineLarge: 34,
    displaySmall: 38,
    displayMedium: 46,
    displayLarge: 58,
  };
  
  return minimums[fontKey] || 14; // default minimum
};

/**
 * Get elderly-friendly touch target size based on font size
 * Ensures minimum 44px touch targets as per WCAG guidelines
 * @param {number} fontSize - Font size in pixels
 * @returns {number} recommended touch target height
 */
export const getTouchTargetSize = (fontSize) => {
  // Base calculation: font size + padding, with minimum of 44px
  const calculated = fontSize + 24; // 12px padding top + bottom
  return Math.max(calculated, 44);
};

/**
 * Get recommended padding for elderly-friendly UI elements
 * @param {string} elementType - Type of UI element
 * @returns {object} padding values
 */
export const getElderlyFriendlyPadding = (elementType) => {
  const paddings = {
    button: { horizontal: 20, vertical: 12 },
    buttonLarge: { horizontal: 28, vertical: 16 },
    card: { horizontal: 20, vertical: 16 },
    listItem: { horizontal: 16, vertical: 12 },
    input: { horizontal: 16, vertical: 14 },
    tab: { horizontal: 16, vertical: 12 },
  };
  
  return paddings[elementType] || { horizontal: 16, vertical: 12 };
};
