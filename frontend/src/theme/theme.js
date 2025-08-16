import { DefaultTheme, MD3DarkTheme } from 'react-native-paper';

// Elderly-friendly spacing with larger touch targets and better visual separation
const commonSpacing = {
  xs: 6,     // increased from 4
  sm: 12,    // increased from 8  
  md: 20,    // increased from 16
  lg: 32,    // increased from 24
  xl: 44,    // increased from 32 - minimum touch target size
  xxl: 56,   // increased from 48
  card: 20,  // standard card padding
  button: 16, // button internal padding
};

// Increased border radius for modern, friendly appearance
const commonBorderRadius = {
  xs: 6,     // increased from 4
  sm: 12,    // increased from 8
  md: 16,    // increased from 12
  lg: 20,    // increased from 16
  xl: 28,    // increased from 24
  button: 12, // standard button radius
  card: 16,   // standard card radius
};

// Elderly-friendly typography with larger, more readable fonts
const commonTypography = {
  h1: {
    fontSize: 38,    // increased from 32
    fontFamily: 'System',
    fontWeight: '700',
  },
  h2: {
    fontSize: 34,    // increased from 28
    fontFamily: 'System',
    fontWeight: '600',
  },
  h3: {
    fontSize: 30,    // increased from 24
    fontFamily: 'System',
    fontWeight: '600',
  },
  h4: {
    fontSize: 26,    // increased from 22
    fontFamily: 'System',
    fontWeight: '500',
  },
  h5: {
    fontSize: 24,    // increased from 20
    fontFamily: 'System',
    fontWeight: '500',
  },
  h6: {
    fontSize: 22,    // increased from 18
    fontFamily: 'System',
    fontWeight: '500',
  },
  body1: {
    fontSize: 20,    // increased from 16
    fontFamily: 'System',
    fontWeight: '400',
  },
  body2: {
    fontSize: 18,    // increased from 14 - minimum readable size
    fontFamily: 'System',
    fontWeight: '400',
  },
  subtitle1: {
    fontSize: 20,    // increased from 16
    fontFamily: 'System',
    fontWeight: '500',
  },
  subtitle2: {
    fontSize: 18,    // increased from 14
    fontFamily: 'System',
    fontWeight: '500',
  },
  caption: {
    fontSize: 16,    // increased from 12
    fontFamily: 'System',
    fontWeight: '400',
  },
  button: {
    fontSize: 20,    // increased from 16
    fontFamily: 'System',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,    // increased from 20
    fontFamily: 'System',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 20,    // increased from 16
    fontFamily: 'System',
    fontWeight: '500',
  },
  body: {
    fontSize: 18,    // increased from 14
    fontFamily: 'System',
    fontWeight: '400',
  },
  // Card-specific typography
  cardTitle: {
    fontSize: 22,
    fontFamily: 'System',
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 18,
    fontFamily: 'System',
    fontWeight: '400',
  },
  cardContent: {
    fontSize: 18,
    fontFamily: 'System',
    fontWeight: '400',
  },
};

// Elderly-friendly fonts with larger sizes for React Native Paper v5 compatibility
const commonFonts = {
  regular: {
    fontFamily: 'System',
    fontWeight: '400',
  },
  medium: {
    fontFamily: 'System',
    fontWeight: '500',
  },
  light: {
    fontFamily: 'System',
    fontWeight: '300',
  },
  thin: {
    fontFamily: 'System',
    fontWeight: '100',
  },
  // React Native Paper v5 fonts with elderly-friendly sizes
  default: {
    fontFamily: 'System',
    fontWeight: '400',
  },
  bodyLarge: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 20,    // increased from 16
  },
  bodyMedium: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 18,    // increased from 14
  },
  bodySmall: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 16,    // increased from 12
  },
  labelLarge: {
    fontFamily: 'System',
    fontWeight: '500',
    fontSize: 18,    // increased from 14
  },
  labelMedium: {
    fontFamily: 'System',
    fontWeight: '500',
    fontSize: 16,    // increased from 12
  },
  labelSmall: {
    fontFamily: 'System',
    fontWeight: '500',
    fontSize: 14,    // increased from 11
  },
  titleLarge: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 26,    // increased from 22
  },
  titleMedium: {
    fontFamily: 'System',
    fontWeight: '500',
    fontSize: 20,    // increased from 16
  },
  titleSmall: {
    fontFamily: 'System',
    fontWeight: '500',
    fontSize: 18,    // increased from 14
  },
  headlineLarge: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 38,    // increased from 32
  },
  headlineMedium: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 34,    // increased from 28
  },
  headlineSmall: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 30,    // increased from 24
  },
  displayLarge: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 64,    // increased from 57
  },
  displayMedium: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 52,    // increased from 45
  },
  displaySmall: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 42,    // increased from 36
  },
};

// Elderly-friendly blue color palette with high contrast and accessibility
const elderlyFriendlyPalette = {
  // Primary blues - main interactive elements
  primary: '#60a5fa',           // consistent light blue for both themes
  primaryLight: '#93c5fd',      // lighter blue for secondary elements
  primaryDark: '#2563eb',       // darker blue for emphasis
  primarySoft: '#dbeafe',       // very light blue for backgrounds
  
  // Secondary blues - supporting elements
  secondary: '#1e40af',         // deep blue for important secondary content
  secondaryLight: '#60a5fa',    // light blue for subtle highlights
  secondaryDark: '#1e3a8a',     // very dark blue for headings
  
  // Interactive elements
  buttonBg: '#60a5fa',          // primary button background (light blue)
  buttonText: '#1e293b',        // dark text for contrast on light blue
  buttonBgSecondary: '#e0f2fe', // secondary button background
  buttonTextSecondary: '#1e40af', // secondary button text
  
  // Icons and accents
  icon: '#3b82f6',              // primary icon color
  iconSecondary: '#60a5fa',     // secondary icon color
  iconBg: 'transparent',        // icon background
  
  // Status and feedback colors (blue-tinted for consistency)
  success: '#0891b2',           // blue-green for success
  successSoft: '#cffafe',       // very light success color for backgrounds
  warning: '#0284c7',           // blue-tinted warning
  error: '#dc2626',             // red for errors (accessibility requirement)
  info: '#0ea5e9',              // bright blue for information
  
  // Backgrounds and surfaces
  background: '#f8fafc',        // very light blue-gray background
  surface: '#ffffff',           // white surface
  surfaceSecondary: '#f1f5f9',  // light blue-gray for secondary surfaces
  cardBackground: '#ffffff',    // white card backgrounds
  
  // Borders and separators
  borderColor: '#cbd5e1',       // light blue-gray borders
  divider: '#e2e8f0',           // very light blue-gray dividers
  
  // Text colors with high contrast
  textPrimary: '#1e293b',       // very dark blue-gray for primary text
  textSecondary: '#475569',     // medium blue-gray for secondary text
  textTertiary: '#64748b',      // lighter blue-gray for tertiary text
  textOnPrimary: '#ffffff',     // white text on blue backgrounds
  
  // Shadows and elevation
  shadow: 'rgba(37, 99, 235, 0.08)', // blue-tinted shadow
  shadowDark: 'rgba(37, 99, 235, 0.12)', // darker blue shadow
  
  // Special elderly-friendly additions
  focus: '#3b82f6',             // focus indicator color
  focusRing: 'rgba(59, 130, 246, 0.2)', // focus ring background
  emergencyPrimary: '#dc2626',  // emergency button primary
  emergencySecondary: '#fecaca', // emergency button background
};

export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...elderlyFriendlyPalette,
    
    // React Native Paper color overrides for elderly-friendly design
    primary: elderlyFriendlyPalette.primary,
    secondary: elderlyFriendlyPalette.secondary,
    background: elderlyFriendlyPalette.background,
    surface: elderlyFriendlyPalette.surface,
    error: elderlyFriendlyPalette.error,
    
    // Text color compatibility
    text: {
      primary: elderlyFriendlyPalette.textPrimary,
      secondary: elderlyFriendlyPalette.textSecondary,
    },
    
    // Additional theme properties
    onBackground: elderlyFriendlyPalette.textPrimary,
    onSurface: elderlyFriendlyPalette.textPrimary,
    onPrimary: elderlyFriendlyPalette.textOnPrimary,
    
    // Elderly-specific color shortcuts
    cardBg: elderlyFriendlyPalette.cardBackground,
    border: elderlyFriendlyPalette.borderColor,
    buttonPrimary: elderlyFriendlyPalette.buttonBg,
    buttonSecondary: elderlyFriendlyPalette.buttonBgSecondary,
    
    // Disabled states with sufficient contrast
    buttonBgDisabled: '#e2e8f0',
    buttonTextDisabled: '#94a3b8',
  },
  
  // Enhanced roundness for friendly appearance
  roundness: 16,
  
  // Elderly-friendly font system
  fonts: commonFonts,
  spacing: commonSpacing,
  borderRadius: commonBorderRadius,
  typography: commonTypography,
  
  // Additional elderly-friendly properties
  accessibility: {
    minimumTouchTarget: 44,     // WCAG minimum touch target
    focusRingWidth: 3,          // visible focus indicators
    highContrast: true,         // flag for high contrast mode
  },
  
  // Touch and interaction settings
  interaction: {
    touchableOpacity: 0.7,      // clear press feedback
    animationDuration: 200,     // slower animations for elderly users
    hapticFeedback: true,       // enable haptic feedback
  },
};

// Dark theme with elderly-friendly adjustments (optional)
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    
    // Dark theme with blue accents
    primary: '#60a5fa',           // lighter blue for dark backgrounds
    secondary: '#93c5fd',         // even lighter blue
    background: '#0f172a',        // very dark blue-gray
    surface: '#1e293b',           // dark blue-gray surface
    
    // High contrast text for dark theme
    text: {
      primary: '#f8fafc',         // near white for primary text
      secondary: '#cbd5e1',       // light blue-gray for secondary text
    },
    
    onBackground: '#f8fafc',
    onSurface: '#f8fafc',
    onPrimary: '#1e293b',
    
    // Dark theme specific colors
    cardBackground: '#1e293b',
    borderColor: '#374151',
    buttonBg: '#60a5fa',
    buttonText: '#1e293b',
    
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
  
  fonts: commonFonts,
  spacing: commonSpacing,
  borderRadius: commonBorderRadius,
  typography: commonTypography,
  
  accessibility: {
    minimumTouchTarget: 44,
    focusRingWidth: 3,
    highContrast: true,
  },
  
  interaction: {
    touchableOpacity: 0.7,
    animationDuration: 200,
    hapticFeedback: true,
  },
};

// Default export for backward compatibility
export const theme = lightTheme;
