import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme } from '../theme/theme';
import { applyFontScaling } from '../utils/fontSizing';

const ThemeContext = createContext({
  theme: lightTheme,
  fontSize: 'medium',
  // No dark mode
  setFontSize: () => {},
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [fontSize, setFontSizeState] = useState('medium');

  const setFontSize = (fontSizeValue) => {
    setFontSizeState(fontSizeValue);
    // Optionally persist font size
    AsyncStorage.setItem('font_size_preference', fontSizeValue).catch(() => {});
  };

  // Always use light theme
  const currentTheme = applyFontScaling(lightTheme, fontSize);

  const value = {
    theme: currentTheme,
    fontSize,
    setFontSize,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
