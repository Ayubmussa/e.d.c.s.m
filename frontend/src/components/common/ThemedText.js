import React from 'react';
import { Text as RNText } from 'react-native';
import { Text as PaperText } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';

/**
 * Elderly-friendly theme-aware Text component with high contrast and accessibility
 * This component automatically selects appropriate text colors and sizes for elderly users
 */
export const ThemedText = ({ 
  children, 
  variant = 'bodyMedium',
  color = 'primary',
  style = {},
  usePaper = true,
  ...props 
}) => {
  const { theme, isDark } = useTheme();
  
  // High contrast colors for elderly-friendly design
  let effectiveColor;
  
  // Use theme-specific text colors with high contrast
  if (color === 'primary') {
    effectiveColor = isDark ? theme.colors.text.primary : theme.colors.textPrimary;
  } else if (color === 'secondary') {
    effectiveColor = isDark ? theme.colors.text.secondary : theme.colors.textSecondary;
  } else if (color === 'blue') {
    effectiveColor = theme.colors.primary; // use theme blue for accent text
  } else if (color === 'error') {
    effectiveColor = theme.colors.error;
  } else if (color === 'success') {
    effectiveColor = theme.colors.success;
  } else {
    // If a custom color is provided, use it
    effectiveColor = typeof color === 'string' && color.startsWith('#') ? color : theme.colors.textPrimary;
  }
  
  // Override any conflicting color in style
  if (style && style.color && (style.color === '#fff' || style.color === '#222')) {
    style = { ...style, color: effectiveColor };
  }
  
  const combinedStyle = [
    { 
      color: effectiveColor,
      // Improve readability for elderly users
      letterSpacing: 0.2,
      lineHeight: undefined, // let the variant handle line height
    }, 
    style
  ];

  if (usePaper) {
    return (
      <PaperText 
        variant={variant} 
        style={combinedStyle} 
        accessible={true}
        accessibilityRole="text"
        {...props}
      >
        {children}
      </PaperText>
    );
  }

  return (
    <RNText 
      style={combinedStyle} 
      accessible={true}
      accessibilityRole="text"
      {...props}
    >
      {children}
    </RNText>
  );
};

/**
 * Elderly-friendly heading component with appropriate sizing and contrast
 */
export const ThemedHeading = ({ children, level = 1, style = {}, color = 'primary', ...props }) => {
  const variants = {
    1: 'headlineLarge',   // 38px - largest heading
    2: 'headlineMedium',  // 34px
    3: 'headlineSmall',   // 30px
    4: 'titleLarge',      // 26px
    5: 'titleMedium',     // 20px
    6: 'titleSmall'       // 18px
  };

  return (
    <ThemedText 
      variant={variants[level] || 'headlineMedium'}
      color={color}
      style={[
        { 
          fontWeight: level <= 3 ? '700' : '600', // bolder headings for better visibility
          marginBottom: 8, // consistent spacing
          lineHeight: undefined, // let variant control line height
        },
        style
      ]}
      {...props}
    >
      {children}
    </ThemedText>
  );
};

/**
 * Elderly-friendly body text with improved readability
 */
export const ThemedBodyText = ({ children, size = 'medium', style = {}, color = 'primary', ...props }) => {
  const variants = {
    small: 'bodySmall',   // 16px - still readable
    medium: 'bodyMedium', // 18px - comfortable reading
    large: 'bodyLarge'    // 20px - easy reading
  };

  return (
    <ThemedText 
      variant={variants[size] || 'bodyMedium'}
      color={color}
      style={[
        {
          lineHeight: size === 'large' ? 28 : size === 'medium' ? 26 : 22, // improved line spacing
        },
        style
      ]}
      {...props}
    >
      {children}
    </ThemedText>
  );
};

/**
 * Elderly-friendly secondary text with sufficient contrast
 */
export const ThemedSecondaryText = ({ children, style = {}, ...props }) => {
  return (
    <ThemedText 
      variant="bodyMedium"
      color="secondary"
      style={[
        {
          lineHeight: 24, // comfortable line spacing
        },
        style
      ]}
      {...props}
    >
      {children}
    </ThemedText>
  );
};

/**
 * Specialized text component for card titles with blue theming
 */
export const ThemedCardTitle = ({ children, style = {}, ...props }) => {
  return (
    <ThemedText 
      variant="titleMedium"
      color="blue"
      style={[
        {
          fontWeight: '600',
          marginBottom: 4,
          lineHeight: 26,
        },
        style
      ]}
      {...props}
    >
      {children}
    </ThemedText>
  );
};

/**
 * Specialized text component for card content with optimal readability
 */
export const ThemedCardContent = ({ children, style = {}, ...props }) => {
  return (
    <ThemedText 
      variant="bodyMedium"
      color="primary"
      style={[
        {
          lineHeight: 24,
          fontWeight: '400',
        },
        style
      ]}
      {...props}
    >
      {children}
    </ThemedText>
  );
};

/**
 * Large, prominent text for important information
 */
export const ThemedEmphasisText = ({ children, style = {}, color = 'blue', ...props }) => {
  return (
    <ThemedText 
      variant="titleLarge"
      color={color}
      style={[
        {
          fontWeight: '700',
          textAlign: 'center',
          lineHeight: 32,
          letterSpacing: 0.3,
        },
        style
      ]}
      {...props}
    >
      {children}
    </ThemedText>
  );
};

/**
 * Button text with optimal sizing and contrast
 */
export const ThemedButtonText = ({ children, style = {}, variant = 'primary', ...props }) => {
  const textColor = variant === 'primary' ? '#ffffff' : variant === 'secondary' ? 'blue' : 'primary';
  
  return (
    <ThemedText 
      variant="labelLarge"
      color={textColor}
      style={[
        {
          fontWeight: '600',
          textAlign: 'center',
          letterSpacing: 0.5,
        },
        style
      ]}
      {...props}
    >
      {children}
    </ThemedText>
  );
};
