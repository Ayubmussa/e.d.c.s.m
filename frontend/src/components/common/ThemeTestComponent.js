import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Text, Button, Surface, Switch } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { validateThemeAccessibility, generateAccessibilityReport } from '../../utils/accessibilityHelpers';
import { ThemedText, ThemedHeading, ThemedBodyText, ThemedSecondaryText } from './ThemedText';

/**
 * Development component for testing theme accessibility and text visibility
 * This component should only be used during development and testing
 */
export const ThemeTestComponent = ({ visible = false }) => {
  const { theme, isDarkMode, toggleTheme, fontSize, setFontSize } = useTheme();
  const [showReport, setShowReport] = useState(false);
  
  if (!visible) return null;

  const validation = validateThemeAccessibility(theme);
  const report = generateAccessibilityReport(theme);

  return (
    <Surface style={{ 
      position: 'absolute', 
      top: 100, 
      right: 10, 
      width: 300, 
      maxHeight: 500,
      padding: 16,
      elevation: 8,
      zIndex: 1000 
    }}>
      <ScrollView>
        <ThemedHeading level={4}>Theme Test Panel</ThemedHeading>
        
        {/* Theme Controls */}
        <View style={{ marginVertical: 10 }}>
          <ThemedBodyText>Current Theme: {isDarkMode ? 'Dark' : 'Light'}</ThemedBodyText>
          <Switch value={isDarkMode} onValueChange={toggleTheme} />
        </View>

        <View style={{ marginVertical: 10 }}>
          <ThemedBodyText>Font Size: {fontSize}</ThemedBodyText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {['small', 'medium', 'large', 'xlarge'].map(size => (
              <Button
                key={size}
                mode={fontSize === size ? 'contained' : 'outlined'}
                onPress={() => setFontSize(size)}
                style={{ margin: 2 }}
                compact
              >
                {size}
              </Button>
            ))}
          </View>
        </View>

        {/* Text Samples */}
        <Surface style={{ marginVertical: 10, borderRadius: 12, backgroundColor: theme.colors.cardBackground, padding: 12, elevation: 2 }}>
          <ThemedHeading level={5}>Text Samples</ThemedHeading>
          <ThemedBodyText>Primary body text - should be highly readable</ThemedBodyText>
          <ThemedSecondaryText>Secondary text - should be readable but less prominent</ThemedSecondaryText>
          <ThemedText>Subtle information (uses primary text color)</ThemedText>
          <ThemedText>Standout text (uses primary text color)</ThemedText>
          <ThemedText>Positive feedback (uses primary text color)</ThemedText>
          <ThemedText>Caution (uses primary text color)</ThemedText>
          <ThemedText>Helpful information (uses primary text color)</ThemedText>
        </Surface>

        {/* Color Contrast Samples */}
        <Surface style={{ marginVertical: 10, borderRadius: 12, backgroundColor: theme.colors.cardBackground, padding: 12, elevation: 2 }}>
          <ThemedHeading level={5}>Background Samples</ThemedHeading>
          <Surface style={{ backgroundColor: theme.colors.primary, padding: 10, marginVertical: 5, borderRadius: 8 }}>
            <Text style={{ color: '#fff' }}>
              Text on Primary Background
            </Text>
          </Surface>
          <Surface style={{ backgroundColor: theme.colors.background, padding: 10, marginVertical: 5, borderRadius: 8 }}>
            <Text style={{ color: theme.colors.text.primary }}>
              Text on Background
            </Text>
          </Surface>
        </Surface>

        {/* Accessibility Status */}
        <Surface style={{ marginVertical: 10, borderRadius: 12, backgroundColor: theme.colors.cardBackground, padding: 12, elevation: 2 }}>
          <ThemedHeading level={5}>
            Accessibility: {validation.passes ? '✅ Pass' : '❌ Fail'}
          </ThemedHeading>
          {!validation.passes && (
            <ThemedText color="error">
              {validation.issues.length} issues found
            </ThemedText>
          )}
          <Button 
            mode="outlined" 
            onPress={() => setShowReport(!showReport)}
            style={{ marginTop: 10 }}
          >
            {showReport ? 'Hide' : 'Show'} Report
          </Button>
        </Surface>

        {/* Full Report */}
        {showReport && (
          <Surface style={{ marginVertical: 10, borderRadius: 12, backgroundColor: theme.colors.cardBackground, padding: 12, elevation: 2 }}>
            <Text style={{ 
              fontFamily: 'monospace', 
              fontSize: 10, 
              color: theme.colors.text.primary 
            }}>
              {report}
            </Text>
          </Surface>
        )}
      </ScrollView>
    </Surface>
  );
};

export default ThemeTestComponent;
