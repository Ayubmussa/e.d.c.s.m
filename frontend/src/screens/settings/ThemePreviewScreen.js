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
        <WellnessCard style={{ alignItems: 'center', backgroundColor: theme.colors.surface, marginBottom: theme.spacing.lg, borderRadius: theme.roundness }}> 
          <MaterialCommunityIcons
            name={isDarkMode ? 'weather-night' : 'weather-sunny'}
            size={50}
            color={theme.colors.primary}
          />
          <ThemedText variant="headlineMedium" color="primary" style={[styles.headerTitle, { marginTop: theme.spacing.md }]}>Theme Preview</ThemedText>
          <ThemedText variant="bodyLarge" color="secondary" style={[styles.headerSubtitle, { marginTop: theme.spacing.xs }]}>Current theme: {isDarkMode ? 'Dark Mode' : 'Light Mode'}</ThemedText>
        </WellnessCard>

        {/* Theme Toggle Card */}
        <QuickActionCard style={{ marginBottom: theme.spacing.lg, borderRadius: theme.roundness }}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <ThemedText variant="titleMedium" color="primary" style={{ fontWeight: 'bold' }}>Dark Mode</ThemedText>
              <ThemedText variant="bodyMedium" color="secondary">Switch between light and dark theme</ThemedText>
            </View>
            <Switch value={isDarkMode} onValueChange={toggleTheme} />
          </View>
        </QuickActionCard>

        {/* Color Palette Preview */}
        <WellnessCard style={{ marginBottom: theme.spacing.lg, borderRadius: theme.roundness }}>
          <ThemedText variant="titleMedium" color="primary" style={{ fontWeight: 'bold', marginBottom: theme.spacing.sm }}>Color Palette</ThemedText>
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
        <QuickActionCard style={{ marginBottom: theme.spacing.lg, borderRadius: theme.roundness }}>
          <ThemedText variant="titleMedium" color="primary" style={{ fontWeight: 'bold', marginBottom: theme.spacing.sm }}>UI Elements</ThemedText>
          <View style={styles.uiElements}>
            <CustomButton mode="contained" style={styles.button}>Primary Button</CustomButton>
            <CustomButton mode="outlined" style={styles.button}>Outlined Button</CustomButton>
            <CustomButton mode="text" style={styles.button}>Text Button</CustomButton>
            <View style={styles.chipContainer}>
              <View style={[styles.chip, { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary, borderWidth: 1, borderRadius: theme.roundness, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, marginRight: theme.spacing.sm }]}> 
                <ThemedText variant="bodySmall" color="primary">Selected Chip</ThemedText>
              </View>
              <View style={[styles.chip, { backgroundColor: 'transparent', borderColor: theme.dark ? '#fff' : '#222', borderWidth: 1, borderRadius: theme.roundness, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs }]}> 
                <ThemedText variant="bodySmall" color="secondary">Outlined Chip</ThemedText>
              </View>
            </View>
          </View>
        </QuickActionCard>

        {/* Typography Preview */}
        <WellnessCard style={{ marginBottom: theme.spacing.lg, borderRadius: theme.roundness }}>
          <ThemedText variant="headlineSmall" color="primary" style={{ fontWeight: 'bold', marginBottom: theme.spacing.sm }}>Main Title (Large)</ThemedText>
          <ThemedText variant="bodyLarge" color="primary" style={{ marginBottom: theme.spacing.sm }}>Primary paragraph text with normal weight and good readability for elderly users.</ThemedText>
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
    padding: theme.spacing.lg,
  },
  header: {
    padding: theme.spacing.xl,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  headerTitle: {
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  headerSubtitle: {
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  card: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.roundness,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  colorGrid: {
    gap: theme.spacing.sm,
  },
  colorRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  colorSwatch: {
    flex: 1,
    height: 60,
    borderRadius: theme.roundness,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorLabel: {
    color: theme.colors.textOnPrimary,
    fontWeight: '500',
    fontSize: theme.typography.caption.fontSize,
  },
  uiElements: {
    gap: theme.spacing.md,
  },
  button: {
    borderRadius: theme.roundness,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  chip: {
    marginRight: theme.spacing.sm,
  },
  typeExample: {
    marginBottom: theme.spacing.sm,
  },
  backButton: {
    marginTop: theme.spacing.md,
    borderRadius: theme.roundness,
  },
  buttonContent: {
    height: 48,
  },
});

export default ThemePreviewScreen;
