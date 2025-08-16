import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const DataPrivacyScreen = ({ navigation }) => {
  const [privacySettings, setPrivacySettings] = useState({
    shareHealthData: false,
    allowAnalytics: true,
    shareLocationData: false,
    allowNotifications: true,
    shareWithFamily: true,
    anonymousUsage: true,
    marketingCommunications: false,
    dataRetention: '1year',
  });

  const updateSetting = (key, value) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const renderToggleSetting = (title, subtitle, key, icon) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <MaterialCommunityIcons 
          name={icon} 
          size={24} 
          color={theme.colors.primary} 
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={privacySettings[key]}
        onValueChange={(value) => updateSetting(key, value)}
        trackColor={{ 
          false: theme.colors.divider, 
          true: theme.colors.primary + '50' 
        }}
        thumbColor={privacySettings[key] ? theme.colors.primary : theme.colors.text.secondary}
      />
    </View>
  );

  const renderSelectSetting = (title, subtitle, options, selectedValue, onSelect, icon) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <MaterialCommunityIcons 
          name={icon} 
          size={24} 
          color={theme.colors.primary} 
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                selectedValue === option.value && styles.optionButtonSelected
              ]}
              onPress={() => onSelect(option.value)}
            >
              <Text style={[
                styles.optionText,
                selectedValue === option.value && styles.optionTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const dataRetentionOptions = [
    { value: '6months', label: '6 Months' },
    { value: '1year', label: '1 Year' },
    { value: '2years', label: '2 Years' },
    { value: 'indefinite', label: 'Indefinite' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color={theme.colors.textOnPrimary} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data & Privacy</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Privacy Overview */}
        <View style={styles.overviewCard}>
          <MaterialCommunityIcons 
            name="shield-check" 
            size={40} 
            color={theme.colors.success} 
          />
          <Text style={styles.overviewTitle}>Your Privacy Matters</Text>
          <Text style={styles.overviewText}>
            We are committed to protecting your personal health information. 
            You have full control over how your data is used and shared.
          </Text>
        </View>

        {/* Data Sharing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Sharing</Text>
          {renderToggleSetting(
            'Share Health Data',
            'Allow sharing of health metrics with healthcare providers',
            'shareHealthData',
            'heart-pulse'
          )}
          {renderToggleSetting(
            'Location Services',
            'Share location data for emergency services',
            'shareLocationData',
            'map-marker'
          )}
          {renderToggleSetting(
            'Family Access',
            'Allow designated family members to view your data',
            'shareWithFamily',
            'account-group'
          )}
        </View>

        {/* Analytics & Improvement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analytics & Improvement</Text>
          {renderToggleSetting(
            'Usage Analytics',
            'Help improve the app by sharing anonymous usage data',
            'allowAnalytics',
            'chart-line'
          )}
          {renderToggleSetting(
            'Anonymous Usage Statistics',
            'Share anonymized data to improve app performance',
            'anonymousUsage',
            'incognito'
          )}
        </View>

        {/* Communications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Communications</Text>
          {renderToggleSetting(
            'Push Notifications',
            'Receive medication reminders and health alerts',
            'allowNotifications',
            'bell'
          )}
          {renderToggleSetting(
            'Marketing Communications',
            'Receive updates about new features and health tips',
            'marketingCommunications',
            'email'
          )}
        </View>

        {/* Data Retention */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Retention</Text>
          {renderSelectSetting(
            'Keep My Data For',
            'How long should we store your health data?',
            dataRetentionOptions,
            privacySettings.dataRetention,
            (value) => updateSetting('dataRetention', value),
            'calendar-clock'
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons 
              name="download" 
              size={20} 
              color={theme.colors.primary} 
            />
            <Text style={styles.actionButtonText}>Download My Data</Text>
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={20} 
              color={theme.colors.text.secondary} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons 
              name="file-document" 
              size={20} 
              color={theme.colors.primary} 
            />
            <Text style={styles.actionButtonText}>Privacy Policy</Text>
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={20} 
              color={theme.colors.text.secondary} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons 
              name="gavel" 
              size={20} 
              color={theme.colors.primary} 
            />
            <Text style={styles.actionButtonText}>Terms of Service</Text>
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={20} 
              color={theme.colors.text.secondary} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.dangerButton]}>
            <MaterialCommunityIcons 
              name="delete-forever" 
              size={20} 
              color={theme.colors.error} 
            />
            <Text style={[styles.actionButtonText, styles.dangerText]}>Delete All Data</Text>
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={20} 
              color={theme.colors.text.secondary} 
            />
          </TouchableOpacity>
        </View>

        {/* Info Footer */}
        <View style={styles.infoFooter}>
          <MaterialCommunityIcons 
            name="information" 
            size={20} 
            color={theme.colors.info} 
          />
          <Text style={styles.infoText}>
            Your data is encrypted and stored securely. We never sell your personal 
            information to third parties. Changes to these settings take effect immediately.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  overviewCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  overviewTitle: {
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  overviewText: {
    fontSize: theme.typography.body2.fontSize,
    fontFamily: theme.typography.body2.fontFamily,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.body2.lineHeight,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
  },
  settingItem: {
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing.md,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.md,
  },
  settingIcon: {
    marginRight: theme.spacing.md,
    marginTop: theme.spacing.xxs,
  },
  settingContent: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingTitle: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xxs,
  },
  settingSubtitle: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.caption.lineHeight,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  optionButton: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  optionButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionText: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.text.secondary,
  },
  optionTextSelected: {
    color: theme.colors.textOnPrimary,
    fontWeight: 'bold',
  },
  actionsSection: {
    marginBottom: theme.spacing.xl,
  },
  actionButton: {
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.md,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
  },
  actionButtonText: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.primary,
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  dangerText: {
    color: theme.colors.error,
  },
  infoFooter: {
    flexDirection: 'row',
    backgroundColor: theme.colors.info + '20',
    padding: theme.spacing.md,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.lg,
  },
  infoText: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.text.secondary,
    flex: 1,
    marginLeft: theme.spacing.xs,
    lineHeight: theme.typography.caption.lineHeight,
  },
});

export default DataPrivacyScreen;
