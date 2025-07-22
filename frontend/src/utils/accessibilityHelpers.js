/**
 * Accessibility and contrast utilities for theme-aware design
 */

/**
 * Calculate relative luminance of a color
 * @param {string} color - Hex color string (e.g., '#FFFFFF')
 * @returns {number} Relative luminance value (0-1)
 */
const getRelativeLuminance = (color) => {
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Apply gamma correction
  const getRGB = (c) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  
  const rLinear = getRGB(r);
  const gLinear = getRGB(g);
  const bLinear = getRGB(b);
  
  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
};

/**
 * Calculate contrast ratio between two colors
 * @param {string} color1 - First color (hex)
 * @param {string} color2 - Second color (hex)
 * @returns {number} Contrast ratio (1-21)
 */
export const getContrastRatio = (color1, color2) => {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Check if a color combination meets WCAG accessibility standards
 * @param {string} textColor - Text color (hex)
 * @param {string} backgroundColor - Background color (hex)
 * @param {string} level - WCAG level ('AA' or 'AAA')
 * @param {string} size - Text size ('normal' or 'large')
 * @returns {object} Accessibility check result
 */
export const checkAccessibility = (textColor, backgroundColor, level = 'AA', size = 'normal') => {
  const contrastRatio = getContrastRatio(textColor, backgroundColor);
  
  // WCAG contrast ratio requirements
  const requirements = {
    AA: {
      normal: 4.5,
      large: 3.0
    },
    AAA: {
      normal: 7.0,
      large: 4.5
    }
  };
  
  const required = requirements[level][size];
  const passes = contrastRatio >= required;
  
  return {
    contrastRatio: Math.round(contrastRatio * 100) / 100,
    required,
    passes,
    level,
    size,
    recommendation: passes 
      ? 'Color combination meets accessibility standards' 
      : `Increase contrast. Need ${required}:1, got ${Math.round(contrastRatio * 100) / 100}:1`
  };
};

/**
 * Get the best text color (black or white) for a given background
 * @param {string} backgroundColor - Background color (hex)
 * @returns {string} Best text color ('#000000' or '#FFFFFF')
 */
export const getBestTextColor = (backgroundColor) => {
  const whiteContrast = getContrastRatio('#FFFFFF', backgroundColor);
  const blackContrast = getContrastRatio('#000000', backgroundColor);
  
  return whiteContrast > blackContrast ? '#FFFFFF' : '#000000';
};

/**
 * Validate theme colors for accessibility
 * @param {object} theme - Theme object with colors
 * @returns {object} Validation results
 */
export const validateThemeAccessibility = (theme) => {
  const results = {
    passes: true,
    issues: [],
    checks: []
  };
  
  // Key color combinations to check
  const combinations = [
    {
      name: 'Primary text on background',
      text: theme.colors.text.primary,
      background: theme.colors.background
    },
    {
      name: 'Secondary text on background',
      text: theme.colors.text.secondary,
      background: theme.colors.background
    },
    {
      name: 'Text on surface',
      text: theme.colors.text.primary,
      background: theme.colors.surface
    },
    {
      name: 'Text on primary button',
      text: theme.colors.onPrimary,
      background: theme.colors.primary
    },
    {
      name: 'Text on secondary button',
      text: theme.colors.onSecondary,
      background: theme.colors.secondary
    }
  ];
  
  combinations.forEach(combo => {
    const check = checkAccessibility(combo.text, combo.background, 'AA', 'normal');
    check.name = combo.name;
    results.checks.push(check);
    
    if (!check.passes) {
      results.passes = false;
      results.issues.push(combo.name);
    }
  });
  
  return results;
};

/**
 * Suggest accessible text colors for a given theme
 * @param {object} theme - Theme object
 * @returns {object} Suggested improvements
 */
export const suggestAccessibleColors = (theme) => {
  const suggestions = [];
  
  // Check if current text colors are optimal
  const textOnBackground = checkAccessibility(
    theme.colors.text.primary, 
    theme.colors.background
  );
  
  if (!textOnBackground.passes) {
    const betterTextColor = getBestTextColor(theme.colors.background);
    suggestions.push({
      issue: 'Primary text on background has poor contrast',
      current: theme.colors.text.primary,
      suggested: betterTextColor,
      improvement: `Contrast ratio would improve from ${textOnBackground.contrastRatio}:1 to ${getContrastRatio(betterTextColor, theme.colors.background).toFixed(2)}:1`
    });
  }
  
  return suggestions;
};

/**
 * Generate a accessibility report for the current theme
 * @param {object} theme - Theme object
 * @returns {string} Human-readable accessibility report
 */
export const generateAccessibilityReport = (theme) => {
  const validation = validateThemeAccessibility(theme);
  const suggestions = suggestAccessibleColors(theme);
  
  let report = `Theme Accessibility Report\n`;
  report += `========================\n\n`;
  
  if (validation.passes) {
    report += `✅ All color combinations meet WCAG AA standards!\n\n`;
  } else {
    report += `❌ ${validation.issues.length} accessibility issues found:\n`;
    validation.issues.forEach(issue => {
      report += `  • ${issue}\n`;
    });
    report += `\n`;
  }
  
  report += `Detailed Checks:\n`;
  validation.checks.forEach(check => {
    const status = check.passes ? '✅' : '❌';
    report += `${status} ${check.name}: ${check.contrastRatio}:1 (required: ${check.required}:1)\n`;
  });
  
  if (suggestions.length > 0) {
    report += `\nSuggested Improvements:\n`;
    suggestions.forEach(suggestion => {
      report += `• ${suggestion.issue}\n`;
      report += `  Current: ${suggestion.current}\n`;
      report += `  Suggested: ${suggestion.suggested}\n`;
      report += `  ${suggestion.improvement}\n\n`;
    });
  }
  
  return report;
};
