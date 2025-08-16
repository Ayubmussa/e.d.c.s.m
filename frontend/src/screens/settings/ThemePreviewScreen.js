import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { CustomButton } from '../../components/common/CustomButton';
import { WellnessCard, QuickActionCard } from '../../components/common/CustomCards';
import { Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '../../components/common/ThemedText';
import { useTheme } from '../../context/ThemeContext';

const ThemePreviewScreen = ({ navigation }) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.content}>
        {/* Header */}
        <WellnessCard style={{ alignItems: 'center', backgroundColor: theme.colors.surface, marginBottom: 16, borderRadius: 12 }}> 
          <MaterialCommunityIcons
            name={isDarkMode ? 'weather-night' : 'weather-sunny'}
            size={50}
            color={theme.colors.primary}
          />
          <ThemedText variant="headlineMedium" color="primary" style={[styles.headerTitle, { marginTop: 12 }]}>Theme Preview</ThemedText>
          <ThemedText variant="bodyLarge" color="secondary" style={[styles.headerSubtitle, { marginTop: 4 }]}>Current theme: {isDarkMode ? 'Dark Mode' : 'Light Mode'}</ThemedText>
        </WellnessCard>

        {/* Theme Toggle Card */}
        <QuickActionCard style={{ marginBottom: 16, borderRadius: 12 }}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <ThemedText variant="titleMedium" color="primary" style={{ fontWeight: 'bold' }}>Dark Mode</ThemedText>
              <ThemedText variant="bodyMedium" color="secondary">Switch between light and dark theme</ThemedText>
            </View>
            <Switch value={isDarkMode} onValueChange={toggleTheme} />
          </View>
        </QuickActionCard>

        {/* Color Palette Preview */}
        <WellnessCard style={{ marginBottom: 16, borderRadius: 12 }}>
          <ThemedText variant="titleMedium" color="primary" style={{ fontWeight: 'bold', marginBottom: 8 }}>Color Palette</ThemedText>
          <View style={styles.colorGrid}>
            <View style={styles.colorRow}>
              <View style={[styles.colorSwatch, { backgroundColor: theme.colors.primary }]}>
                <ThemedText variant="bodySmall" color="primary" style={styles.colorLabel}>Primary</ThemedText>
              </View>
              <View style={[styles.colorSwatch, { backgroundColor: theme.dark ? '#fff' : '#222' }]}> 
                <ThemedText variant="bodySmall" color="primary" style={styles.colorLabel}>Secondary</ThemedText>
              </View>
            </View>
            <View style={styles.colorRow}>
              <View style={[styles.colorSwatch, { backgroundColor: theme.colors.success }]}>
                <ThemedText variant="bodySmall" color="primary" style={styles.colorLabel}>Success</ThemedText>
              </View>
              <View style={[styles.colorSwatch, { backgroundColor: theme.colors.error }]}>
                <ThemedText variant="bodySmall" color="primary" style={styles.colorLabel}>Error</ThemedText>
              </View>
            </View>
            <View style={styles.colorRow}>
              <View style={[styles.colorSwatch, { backgroundColor: theme.colors.warning }]}>
                <ThemedText variant="bodySmall" color="primary" style={styles.colorLabel}>Warning</ThemedText>
              </View>
              <View style={[styles.colorSwatch, { backgroundColor: theme.colors.info }]}>
                <ThemedText variant="bodySmall" color="primary" style={styles.colorLabel}>Info</ThemedText>
              </View>
            </View>
          </View>
        </WellnessCard>

        {/* UI Elements Preview */}
        <QuickActionCard style={{ marginBottom: 16, borderRadius: 12 }}>
          <ThemedText variant="titleMedium" color="primary" style={{ fontWeight: 'bold', marginBottom: 8 }}>UI Elements</ThemedText>
          <View style={styles.uiElements}>
            <CustomButton mode="contained" style={styles.button}>Primary Button</CustomButton>
            <CustomButton mode="outlined" style={styles.button}>Outlined Button</CustomButton>
            <CustomButton mode="text" style={styles.button}>Text Button</CustomButton>
            <View style={styles.chipContainer}>
              <View style={[styles.chip, { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4, marginRight: 8 }]}> 
                <ThemedText variant="bodySmall" color="primary">Selected Chip</ThemedText>
              </View>
              <View style={[styles.chip, { backgroundColor: 'transparent', borderColor: theme.dark ? '#fff' : '#222', borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 }]}> 
                <ThemedText variant="bodySmall" color="secondary">Outlined Chip</ThemedText>
              </View>
            </View>
          </View>
        </QuickActionCard>

        {/* Typography Preview */}
        <WellnessCard style={{ marginBottom: 16, borderRadius: 12 }}>
          <ThemedText variant="headlineSmall" color="primary" style={{ fontWeight: 'bold', marginBottom: 8 }}>Main Title (Large)</ThemedText>
          <ThemedText variant="bodyLarge" color="primary" style={{ marginBottom: 8 }}>Primary paragraph text with normal weight and good readability for elderly users.</ThemedText>
          <ThemedText variant="bodyMedium" color="secondary">Secondary text with lighter color and smaller size for less important information.</ThemedText>
        </WellnessCard>

        {/* Navigation Button */}
        <CustomButton
          mode="contained"
          icon="arrow-left"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          contentStyle={styles.buttonContent}
        >
          Back to Settings
        </CustomButton>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  headerTitle: {
    marginTop: 12,
    textAlign: 'center',
  },
  headerSubtitle: {
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  colorGrid: {
    gap: 8,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorSwatch: {
    flex: 1,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorLabel: {
    color: 'white',
    fontWeight: '500',
    fontSize: 12,
  },
  uiElements: {
    gap: 12,
  },
  button: {
    borderRadius: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    marginRight: 8,
  },
  typeExample: {
    marginBottom: 8,
  },
  backButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  buttonContent: {
    height: 48,
  },
});

export default ThemePreviewScreen;
