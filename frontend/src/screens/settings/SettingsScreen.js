import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  ScrollView,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Switch, Avatar, Divider, RadioButton } from 'react-native-paper';
import { ThemedText, ThemedHeading, ThemedCardTitle } from '../../components/common/ThemedText';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { useLocalization } from '../../context/LocalizationContext';
import { settingsService } from '../../services/settingsService';
import { validateThemeAccessibility } from '../../utils/accessibilityHelpers';
import { WellnessCard, QuickActionCard, NotificationCard } from '../../components/common/CustomCards';
import { CustomButton } from '../../components/common/CustomButton';

export default function SettingsScreen(props) {
  // Export user data handler: navigate to ExportDataScreen
  const handleExportData = () => {
    if (!navigation || typeof navigation.navigate !== 'function') {
      Alert.alert(t('navigationError', 'Navigation is not available.'));
      return;
    }
    navigation.navigate('ExportData');
  };
  const navigation = props.navigation || useNavigation();
  const { user, logout } = useAuth();
  const { updateNotificationSettings } = useNotification();
  const { theme, isDarkMode, fontSize, toggleTheme, setFontSize } = useTheme();
  const { t, language, timeFormat, setLanguage, setTimeFormat, formatTime, formatDate } = useLocalization();

  // Debug logging for user data
  console.log('=== SETTINGS SCREEN USER DATA ===');
  console.log('User object:', user);
  console.log('User profileImage:', user?.profileImage);
  console.log('User first_name:', user?.first_name);
  console.log('User email:', user?.email);

  const profileImageToDisplay = user?.profile_image || user?.profileImage;
  console.log('SettingsScreen: Profile image being displayed:', profileImageToDisplay);

  const styles = createStyles(theme);

  const [settings, setSettings] = useState({
    notifications: {
      medicationReminders: true,
      healthCheckins: true,
      emergencyAlerts: true,
      brainTraining: true,
      pushNotifications: true,
    },
    accessibility: {
      highContrast: false,
      voiceAssistant: true,
      hapticFeedback: true,
    },
    privacy: {
      shareHealthData: false,
      locationTracking: true,
      analytics: true,
    },
    general: {
      dateFormat: 'mm/dd/yyyy',
    },
  });
  // Safe zones state for picker
  const [safeZones, setSafeZones] = useState([]);
  const [safeZonePickerVisible, setSafeZonePickerVisible] = useState(false);
  const [selectedSafeZone, setSelectedSafeZone] = useState(null);

  const [loading, setLoading] = useState(true);

  // Get accessibility validation for current theme
  const themeValidation = validateThemeAccessibility(theme);

  useEffect(() => {
    loadSettings();
    fetchSafeZones();
  }, []);

  const fetchSafeZones = async () => {
    try {
      // Replace with your actual API/service call
      const response = await fetch('/api/geofencing/safe-zones');
      const data = await response.json();
      setSafeZones(data.safe_zones || []);
    } catch (error) {
      setSafeZones([]);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getUserSettings();
      setSettings(prevSettings => ({
        ...prevSettings,
        ...response.data
      }));
    } catch (error) {
      console.error('Error loading settings:', error);
      // Load from local storage as fallback
      try {
        const localSettings = await AsyncStorage.getItem('userSettings');
        if (localSettings) {
          setSettings(prevSettings => ({
            ...prevSettings,
            ...JSON.parse(localSettings)
          }));
        }
      } catch (localError) {
        console.error('Error loading local settings:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (category, key, value) => {
    try {
      const newSettings = {
        ...settings,
        [category]: {
          ...settings[category],
          [key]: value
        }
      };
      
      setSettings(newSettings);
      
      // Save to server
      await settingsService.updateUserSettings(newSettings);
      
      // Save to local storage as backup
      await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
      
      // Update notification settings if needed
      if (category === 'notifications') {
        await updateNotificationSettings(newSettings.notifications);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert(t('error'), t('failedToUpdateSettings'));
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('signOutTitle'),
      t('signOutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('signOut'),
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('deleteAccountTitle'),
      t('deleteAccountWarning'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('confirmDeletionTitle'),
              t('confirmDeletionPrompt'),
              [
                { text: t('cancel'), style: 'cancel' },
                {
                  text: t('confirm'),
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await settingsService.deleteAccount();
                      logout();
                    } catch (error) {
                      Alert.alert(t('error'), t('failedToDeleteAccount'));
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  // Handler for Manage Safe Zones button
  function handleManageSafeZones() {
    if (!navigation || typeof navigation.navigate !== 'function') {
      Alert.alert(t('navigationError', 'Navigation is not available.'));
      return;
    }
    navigation.navigate('AddSafeZone', { screen: 'SafeZones' });
  }

  const fontSizeOptions = [
    { label: t('small'), value: 'small' },
    { label: t('medium'), value: 'medium' },
    { label: t('large'), value: 'large' },
    { label: t('extraLarge'), value: 'xlarge' },
  ];

  const languageOptions = [
    { label: t('english'), value: 'en' },
    { label: t('spanish'), value: 'es' },
    { label: t('french'), value: 'fr' },
    { label: t('arabic'), value: 'ar' },
  ];

  const timeFormatOptions = [
    { label: '12 ' + t('hours'), value: '12h' },
    { label: '24 ' + t('hours'), value: '24h' },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>{t('loading')}</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <WellnessCard style={styles.card}>
          <View style={styles.profileSection}>
            {profileImageToDisplay ? (
              <Image
                source={{ uri: profileImageToDisplay }}
                style={styles.profileImage}
                onLoad={() => console.log('SettingsScreen: Profile image loaded successfully:', profileImageToDisplay)}
                onError={(error) => console.error('SettingsScreen: Profile image failed to load:', error.nativeEvent.error, 'URL:', profileImageToDisplay)}
                onLoadStart={() => console.log('SettingsScreen: Profile image loading started:', profileImageToDisplay)}
                onLoadEnd={() => console.log('SettingsScreen: Profile image loading ended:', profileImageToDisplay)}
              />
            ) : (
              <MaterialCommunityIcons name="account-circle" size={64} color={theme.colors.primary} style={styles.profileIcon} />
            )}
            <ThemedHeading level={2} style={styles.profileName}>
              {user?.first_name || t('user')}
            </ThemedHeading>
            <ThemedText variant="bodyLarge" color="secondary" style={styles.profileEmail}>
              {user?.email}
            </ThemedText>
            <ThemedText variant="bodyMedium" color="secondary" style={styles.profileSince}>
              {(t('memberSince') || 'Member since {{year}}').replace('{{year}}', user?.created_at ? new Date(user.created_at).getFullYear() : '2024')}
            </ThemedText>
            <CustomButton
              mode="contained"
              onPress={() => navigation.navigate('EditProfile')}
              style={styles.heroEditBtn}
              icon="account-edit"
              textColor={theme.colors.surface}
            >
              {t('editProfile')}
            </CustomButton>
            <CustomButton
              mode="contained"
              onPress={() => navigation.navigate('ResetPassword', { fromSettings: true })}
              style={[styles.heroEditBtn, { marginTop: theme.spacing.sm }]}
              icon="lock-reset"
              textColor={theme.colors.surface}
            >
              {t('resetPassword') || 'Reset Password'}
            </CustomButton>
          </View>
        </WellnessCard>

        {/* Notification Settings */}
        <View style={styles.section}>
          <ThemedHeading level={3} style={styles.sectionTitle}>
            <MaterialCommunityIcons name="bell" size={44} color={theme.colors.primary} style={styles.sectionIcon} />
            {t('notifications')}
          </ThemedHeading>
          
          <View style={styles.settingItem}>
            <View style={styles.settingText}>
              <ThemedText variant="bodyLarge" style={styles.settingTitle}>{t('medicationReminders')}</ThemedText>
              <ThemedText variant="bodyMedium" color="secondary">{t('getNotifiedAboutMedicationTimes')}</ThemedText>
            </View>
            <Switch
              value={settings.notifications.medicationReminders}
              onValueChange={(value) => updateSetting('notifications', 'medicationReminders', value)}
              style={styles.settingSwitch}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingText}>
              <ThemedText variant="bodyLarge" style={styles.settingTitle}>{t('healthCheckins')}</ThemedText>
              <ThemedText variant="bodyMedium" color="secondary">{t('dailyHealthCheckinReminders')}</ThemedText>
            </View>
            <Switch
              value={settings.notifications.healthCheckins}
              onValueChange={(value) => updateSetting('notifications', 'healthCheckins', value)}
              style={styles.settingSwitch}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingText}>
              <ThemedText variant="bodyLarge" style={styles.settingTitle}>{t('emergencyAlerts')}</ThemedText>
              <ThemedText variant="bodyMedium" color="secondary">{t('criticalEmergencyNotifications')}</ThemedText>
            </View>
            <Switch
              value={settings.notifications.emergencyAlerts}
              onValueChange={(value) => updateSetting('notifications', 'emergencyAlerts', value)}
              style={styles.settingSwitch}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingText}>
              <ThemedText variant="bodyLarge" style={styles.settingTitle}>{t('brainTraining')}</ThemedText>
              <ThemedText variant="bodyMedium" color="secondary">{t('dailyBrainTrainingReminders')}</ThemedText>
            </View>
            <Switch
              value={settings.notifications.brainTraining}
              onValueChange={(value) => updateSetting('notifications', 'brainTraining', value)}
              style={styles.settingSwitch}
            />
          </View>
        </View>

        {/* Accessibility Settings */}
        <View style={styles.section}>
          <ThemedHeading level={3} style={styles.sectionTitle}>
            <MaterialCommunityIcons name="eye" size={44} color={theme.colors.primary} style={styles.sectionIcon} />
            {t('accessibility')}
          </ThemedHeading>
          
          <View style={styles.settingGroup}>
            <ThemedText variant="bodyLarge" style={styles.settingTitle}>{t('fontSize')}</ThemedText>
            <ThemedText variant="bodyMedium" color="secondary">{t('adjustTextSize')}</ThemedText>
            <RadioButton.Group
              onValueChange={(value) => setFontSize(value)}
              value={fontSize}
            >
              {fontSizeOptions.map((option) => (
                <RadioButton.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  style={styles.radioItem}
                />
              ))}
            </RadioButton.Group>
          </View>

         {/* <View style={styles.settingItem}>
            <View style={styles.settingText}>
              <ThemedText variant="bodyLarge" style={styles.settingTitle}>{t('highContrast')}</ThemedText>
              <ThemedText variant="bodyMedium" color="secondary">{t('increaseColorContrast')}</ThemedText>
            </View>
            <Switch
              value={settings.accessibility.highContrast}
              onValueChange={(value) => updateSetting('accessibility', 'highContrast', value)}
              style={styles.settingSwitch}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingText}>
              <ThemedText variant="bodyLarge" style={styles.settingTitle}>{t('darkMode')}</ThemedText>
              <ThemedText variant="bodyMedium" color="secondary">{t('switchTheme')}</ThemedText>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              style={styles.settingSwitch}
            />
          </View>*/}

          <View style={styles.settingItem}>
            <View style={styles.settingText}>
              <ThemedText variant="bodyLarge" style={styles.settingTitle}>{t('voiceAssistant')}</ThemedText>
              <ThemedText variant="bodyMedium" color="secondary">{t('enableVoiceCommands')}</ThemedText>
            </View>
            <Switch
              value={settings.accessibility.voiceAssistant}
              onValueChange={(value) => updateSetting('accessibility', 'voiceAssistant', value)}
              style={styles.settingSwitch}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingText}>
              <ThemedText variant="bodyLarge" style={styles.settingTitle}>{t('hapticFeedback')}</ThemedText>
              <ThemedText variant="bodyMedium" color="secondary">{t('vibrationFeedback')}</ThemedText>
            </View>
            <Switch
              value={settings.accessibility.hapticFeedback}
              onValueChange={(value) => updateSetting('accessibility', 'hapticFeedback', value)}
              style={styles.settingSwitch}
            />
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <ThemedHeading level={3} style={styles.sectionTitle}>
            <MaterialCommunityIcons name="shield-account" size={44} color={theme.colors.primary} style={styles.sectionIcon} />
            {t('privacyAndData')}
          </ThemedHeading>
          
          <View style={styles.settingItem}>
            <View style={styles.settingText}>
              <ThemedText variant="bodyLarge" style={styles.settingTitle}>{t('manageSafeZones')}</ThemedText>
              <ThemedText variant="bodyMedium" color="secondary">{t('configureGeofencedAreas')}</ThemedText>
            </View>
            <CustomButton
              mode="contained"
              compact
              onPress={() => {
                if (!navigation || typeof navigation.navigate !== 'function') {
                  Alert.alert(t('navigationError', 'Navigation is not available.'));
                  return;
                }
                navigation.navigate('SafeZones');
              }}
              style={styles.actionButton}
              textColor={theme.colors.surface}
            >
              {t('manage')}
            </CustomButton>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingText}>
              <ThemedText variant="bodyLarge" style={styles.settingTitle}>{t('Edit SafeZone')}</ThemedText>
              <ThemedText variant="bodyMedium" color="secondary">{t('Edit or Remove SafeZone')}</ThemedText>
            </View>
            <CustomButton
              mode="contained"
              compact
              onPress={() => {
                if (!navigation || typeof navigation.navigate !== 'function') {
                  Alert.alert(t('navigationError', 'Navigation is not available.'));
                  return;
                }
                if (!safeZones || safeZones.length === 0) {
                  Alert.alert(t('noSafeZonesFound', 'No safe zones found.'));
                } else {
                  navigation.navigate('EditSafeZone', { safeZoneId: safeZones[0].id });
                }
              }}
              style={styles.actionButton}
              textColor={theme.colors.surface}
            >
              {t('edit')}
            </CustomButton>
          </View>
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <ThemedHeading level={3} style={styles.sectionTitle}>
            <MaterialCommunityIcons name="cog" size={44} color={theme.colors.primary} style={styles.sectionIcon} />
            {t('general')}
          </ThemedHeading>
          
          <View style={styles.settingGroup}>
            <ThemedText variant="bodyLarge" style={styles.settingTitle}>{t('language')}</ThemedText>
            <ThemedText variant="bodyMedium" color="secondary">{t('appLanguage')}</ThemedText>
            <RadioButton.Group
              onValueChange={(value) => setLanguage(value)}
              value={language}
            >
              {languageOptions.map((option) => (
                <RadioButton.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  style={styles.radioItem}
                />
              ))}
            </RadioButton.Group>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.settingGroup}>
            <ThemedText variant="bodyLarge" style={styles.settingTitle}>{t('timeFormat')}</ThemedText>
            <ThemedText variant="bodyMedium" color="secondary">{t('12hourOr24hour')}</ThemedText>
            <RadioButton.Group
              onValueChange={(value) => setTimeFormat(value)}
              value={timeFormat}
            >
              {timeFormatOptions.map((option) => (
                <RadioButton.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  style={styles.radioItem}
                />
              ))}
            </RadioButton.Group>
          </View>
        </View>

        {/* Support & Info
        <View style={styles.section}>
          <ThemedHeading level={3} style={styles.sectionTitle}>
            <MaterialCommunityIcons name="help-circle" size={44} color={theme.colors.primary} style={styles.sectionIcon} />
            {t('supportAndInfo')}
          </ThemedHeading>
          
          <TouchableOpacity 
            style={styles.supportItem}
            onPress={() => Alert.alert(t('help'), t('helpSectionComingSoon'))}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <MaterialCommunityIcons name="help" size={32} color={theme.colors.primary} style={styles.supportIcon} />
            <View style={styles.supportText}>
              <ThemedText variant="bodyLarge" style={styles.settingTitle}>{t('helpFaq')}</ThemedText>
              <ThemedText variant="bodyMedium" color="secondary">{t('getHelpAndAnswers')}</ThemedText>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.supportItem}
            onPress={() => Alert.alert(t('contactSupport'), t('supportContactComingSoon'))}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <MaterialCommunityIcons name="email" size={32} color={theme.colors.primary} style={styles.supportIcon} />
            <View style={styles.supportText}>
              <ThemedText variant="bodyLarge" style={styles.settingTitle}>{t('contactSupport')}</ThemedText>
              <ThemedText variant="bodyMedium" color="secondary">{t('getInTouchSupport')}</ThemedText>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.supportItem}
            onPress={() => Alert.alert(t('about'), t('aboutSectionComingSoon'))}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <MaterialCommunityIcons name="information" size={32} color={theme.colors.primary} style={styles.supportIcon} />
            <View style={styles.supportText}>
              <ThemedText variant="bodyLarge" style={styles.settingTitle}>{t('about')}</ThemedText>
              <ThemedText variant="bodyMedium" color="secondary">{t('appVersionInfo')}</ThemedText>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View> */}

        {/* Account Actions */}
        <View style={styles.section}>
         
           
          
          <View style={styles.accountActions}>
            <CustomButton
              mode="contained"
              onPress={handleExportData}
              icon="download"
              style={[styles.accountButton, { backgroundColor: theme.colors.primary }]}
              textColor={theme.colors.surface}
            >
              {t('exportMyData')}
            </CustomButton>
            
            <CustomButton
              mode="contained"
              onPress={handleLogout}
              icon="logout"
              style={[styles.accountButton, { backgroundColor: theme.colors.secondary }]}
              textColor={theme.colors.surface}
            >
              {t('signOut')}
            </CustomButton>
            
            <CustomButton
              mode="contained"
              onPress={handleDeleteAccount}
              icon="delete"
              style={[styles.accountButton, { backgroundColor: theme.colors.error }]}
              textColor={theme.colors.surface}
            >
              {t('deleteAccount')}
            </CustomButton>
          </View>
        </View>

        {/* Extra spacing for bottom navigation */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    scrollContent: {
      paddingBottom: theme.spacing.xxl, // Add padding to the bottom for the extra spacing
    },
    card: {
      borderRadius: theme.roundness,
      elevation: 3,
      backgroundColor: theme.colors.cardBackground,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    surface: {
      borderRadius: theme.roundness,
      elevation: 2,
      backgroundColor: theme.colors.surfaceVariant,
    },
    // Hero section styles
    profileSection: {
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    profileIcon: {
      marginBottom: theme.spacing.sm,
    },
    profileImage: {
      width: 64,
      height: 64,
      borderRadius: 32,
      marginBottom: theme.spacing.sm,
    },
    profileName: {
      fontWeight: 'bold',
      fontSize: theme.typography.h5.fontSize,
      color: theme.colors.text.primary,
      marginBottom: 4,
      textAlign: 'center',
    },
    profileEmail: {
      fontSize: theme.typography.body1.fontSize,
      color: theme.colors.text.secondary,
      marginBottom: 2,
      textAlign: 'center',
    },
    profileSince: {
      fontSize: theme.typography.caption.fontSize,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    heroEditBtn: {
      width: '100%',
      borderRadius: theme.roundness,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 2,
    },
    // Section styles
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    sectionIcon: {
      marginRight: theme.spacing.sm,
    },
    // Setting item styles
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    settingText: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    settingTitle: {
      fontWeight: 'bold',
      marginBottom: theme.spacing.xxs,
    },
    settingSwitch: {
      marginLeft: theme.spacing.sm,
    },
    // Setting group for radio buttons
    settingGroup: {
      marginBottom: theme.spacing.sm,
    },
    radioItem: {
      paddingLeft: theme.spacing.md,
      marginBottom: theme.spacing.xxs,
    },
    // Action button for privacy/privacy settings
    actionButton: {
      minWidth: 210,
      borderRadius: theme.roundness,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 2,
    },
    // Account actions container
    accountActions: {
      gap: theme.spacing.sm,
    },
    accountButton: {
      borderRadius: theme.roundness,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 2,
    },
    divider: {
      marginVertical: theme.spacing.sm,
    },
    // Support & Info item styles
    supportItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    supportIcon: {
      marginRight: theme.spacing.sm,
    },
    supportText: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    
  });
}
