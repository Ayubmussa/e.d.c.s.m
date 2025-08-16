import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { theme } from '../../theme/theme';
import { shadows } from '../../utils/shadows';
import { useMedication } from '../../context/MedicationContext';
import { useHealth } from '../../context/HealthContext';
import { useNotification } from '../../context/NotificationContext';

const exportOptions = [
  {
    id: 'medications',
    title: 'Medications & Reminders',
    description: 'Your medication list, schedules, and reminder history',
    icon: 'pill',
    dataSize: '~2-5 KB',
    included: true,
  },
  {
    id: 'health',
    title: 'Health Check-ins',
    description: 'Daily health logs, symptoms, and wellness data',
    icon: 'heart-pulse',
    dataSize: '~5-15 KB',
    included: true,
  },
  {
    id: 'emergency',
    title: 'Emergency Contacts',
    description: 'Emergency contacts and medical information',
    icon: 'shield-alert',
    dataSize: '~1-3 KB',
    included: true,
  },
  {
    id: 'brain_training',
    title: 'Brain Training Progress',
    description: 'Game scores, progress tracking, and statistics',
    icon: 'brain',
    dataSize: '~3-8 KB',
    included: true,
  },
  {
    id: 'notifications',
    title: 'Notification Settings',
    description: 'Your notification preferences and history',
    icon: 'bell',
    dataSize: '~1-2 KB',
    included: true,
  },
  {
    id: 'profile',
    title: 'Profile Information',
    description: 'Personal information and app settings',
    icon: 'account',
    dataSize: '~1 KB',
    included: true,
  },
];

const ExportDataScreen = ({ navigation }) => {
  const [selectedOptions, setSelectedOptions] = useState({
    medications: true,
    health: true,
    emergency: true,
    brain_training: true,
    notifications: true,
    profile: true,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Context hooks for real data
  const { user } = require('../../context/AuthContext').useAuth();
  const { settings } = require('./SettingsScreen');
  const { medications, medicationLogs } = useMedication();
  const { checkins } = useHealth();
  const { notificationSettings } = useNotification();

  // Replace mock data with real data
  const generateExportData = () => {
    const data = {};
    if (selectedOptions.medications) {
      // Export both medication list and full medication logs/history
      data.medications = medications || [];
      data.medicationLogs = medicationLogs || [];
    }
    if (selectedOptions.health) {
      // Export all health check-ins (not just today's)
      data.healthCheckins = checkins || [];
    }
    // Emergency and brain training: fallback to settings or empty
    if (selectedOptions.emergency) {
      data.emergencyContacts = settings?.emergencyContacts || [];
      data.medicalInfo = settings?.medicalInfo || {};
    }
    if (selectedOptions.brain_training) {
      data.brainTraining = settings?.brainTraining || {};
    }
    if (selectedOptions.notifications) {
      data.notificationSettings = notificationSettings || {};
    }
    if (selectedOptions.profile) {
      data.profile = {
        firstName: user?.first_name,
        lastName: user?.last_name,
        dateOfBirth: user?.date_of_birth,
        phone: user?.phone,
        email: user?.email,
      };
    }
    return data;
  };

  const exportAsJSON = async () => {
    try {
      setIsExporting(true);
      setExportProgress(20);

      const data = generateExportData(); // Use real data
      setExportProgress(50);

      const jsonString = JSON.stringify(data, null, 2);
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `elderly_companion_data_${timestamp}.json`;

      setExportProgress(70);

      if (Platform.OS === 'web') {
        // For web, use the download approach
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // For mobile platforms
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, jsonString);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Success', `Data exported to: ${fileUri}`);
        }
      }

      setExportProgress(100);
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        Alert.alert(
          'Export Complete',
          'Your data has been successfully exported. The file contains all selected information in JSON format.',
          [{ text: 'OK' }]
        );
      }, 500);

    } catch (error) {
      setIsExporting(false);
      setExportProgress(0);
      Alert.alert('Export Failed', 'There was an error exporting your data. Please try again.');
      console.error('Export error:', error);
    }
  };

  const exportAsText = async () => {
    try {
      setIsExporting(true);
      setExportProgress(20);

      const data = generateExportData(); // Use real data
      setExportProgress(40);

      let textContent = 'ELDERLY COMPANION - DATA EXPORT\n';
      textContent += `Generated on: ${new Date().toLocaleString()}\n\n`;

      // Medications
      if (data.medications) {
        textContent += '=== Medications & Reminders ===\n';
        if (data.medications.length === 0) {
          textContent += 'No medications found.\n\n';
        } else {
          data.medications.forEach((med, idx) => {
            textContent += `• ${med.name} (${med.dosage}) - Times: ${med.times?.join(', ') || 'N/A'}\n`;
          });
          textContent += '\n';
        }
      }
      if (data.medicationLogs) {
        textContent += 'Medication History:\n';
        if (data.medicationLogs.length === 0) {
          textContent += 'No medication logs found.\n\n';
        } else {
          data.medicationLogs.forEach((log, idx) => {
            // Try to get medicine name and start date, fallback to N/A if missing
            const medName = log.medicationName || log.name || 'N/A';
            // Prefer startDate, fallback to takenAt, date, timestamp, or N/A
            const startDate = log.startDate || log.takenAt || log.date || log.timestamp || 'N/A';
            textContent += `• ${medName} started on ${startDate}\n`;
          });
          textContent += '\n';
        }
      }

      // Health Check-ins
      if (data.healthCheckins) {
        textContent += '=== Health Check-ins ===\n';
        if (data.healthCheckins.length === 0) {
          textContent += 'No health check-ins found.\n\n';
        } else {
          data.healthCheckins.forEach((checkin, idx) => {
            textContent += `• ${checkin.checkin_date || checkin.date}: Mood ${checkin.mood_rating}, Energy ${checkin.energy_level}, Pain ${checkin.pain_level}, Sleep ${checkin.sleep_quality}\n`;
          });
          textContent += '\n';
        }
      }

      // Emergency Contacts
      if (data.emergencyContacts) {
        textContent += '=== Emergency Contacts ===\n';
        if (data.emergencyContacts.length === 0) {
          textContent += 'No emergency contacts found.\n\n';
        } else {
          data.emergencyContacts.forEach((contact, idx) => {
            textContent += `• ${contact.name} (${contact.relationship}) - ${contact.phone}\n`;
          });
          textContent += '\n';
        }
      }
      if (data.medicalInfo) {
        textContent += 'Medical Info:\n';
        Object.entries(data.medicalInfo).forEach(([key, value]) => {
          textContent += `• ${key}: ${value}\n`;
        });
        textContent += '\n';
      }

      // Brain Training
      if (data.brainTraining) {
        textContent += '=== Brain Training Progress ===\n';
        if (Object.keys(data.brainTraining).length === 0) {
          textContent += 'No brain training data found.\n\n';
        } else {
          if (data.brainTraining.stats) {
            textContent += `• Games Played: ${data.brainTraining.stats.totalGamesPlayed}\n`;
            textContent += `• Highest Score: ${data.brainTraining.stats.highestScore}\n`;
          }
          textContent += '\n';
        }
      }

      // Notifications
      if (data.notificationSettings) {
        textContent += '=== Notification Settings ===\n';
        Object.entries(data.notificationSettings).forEach(([key, value]) => {
          textContent += `• ${key}: ${value}\n`;
        });
        textContent += '\n';
      }

      // Profile
      if (data.profile) {
        textContent += '=== Profile Information ===\n';
        Object.entries(data.profile).forEach(([key, value]) => {
          textContent += `• ${key}: ${value}\n`;
        });
        textContent += '\n';
      }

      setExportProgress(70);

      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `elderly_companion_data_${timestamp}.txt`;

      if (Platform.OS === 'web') {
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, textContent);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Success', `Data exported to: ${fileUri}`);
        }
      }

      setExportProgress(100);
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        Alert.alert(
          'Export Complete',
          'Your data has been successfully exported as a text file.',
          [{ text: 'OK' }]
        );
      }, 500);

    } catch (error) {
      setIsExporting(false);
      setExportProgress(0);
      Alert.alert('Export Failed', 'There was an error exporting your data. Please try again.');
      console.error('Export error:', error);
    }
  };

  const shareDataSummary = async () => {
    try {
      const data = generateExportData(); // Use real data
      const selectedCount = Object.values(selectedOptions).filter(Boolean).length;
      
      let summary = `My Health Data Summary from Elderly Companion App\n\n`;
      summary += `Data Categories: ${selectedCount} selected\n`;
      
      if (data.medications && Array.isArray(data.medications)) {
        summary += `• ${data.medications.length} medications tracked\n`;
      }
      if (data.healthCheckins && Array.isArray(data.healthCheckins)) {
        summary += `• ${data.healthCheckins.length} health check-ins recorded\n`;
      }
      if (data.emergencyContacts && Array.isArray(data.emergencyContacts)) {
        summary += `• ${data.emergencyContacts.length} emergency contacts\n`;
      }
      if (data.brainTraining && data.brainTraining.stats) {
        summary += `• ${data.brainTraining.stats.totalGamesPlayed} brain training games played\n`;
      }
      
      summary += `\nGenerated on: ${new Date().toLocaleDateString()}`;

      await Share.share({
        message: summary,
        title: 'Health Data Summary',
      });
    } catch (error) {
      Alert.alert('Share Failed', 'Unable to share data summary.');
    }
  };

  const toggleOption = (id) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getSelectedDataSize = () => {
    return exportOptions
      .filter(option => selectedOptions[option.id])
      .reduce((total, option) => {
        const size = option.dataSize.match(/(\d+)-?(\d+)?/);
        const maxSize = size[2] ? parseInt(size[2]) : parseInt(size[1]);
        return total + maxSize;
      }, 0);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.9}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={28}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Export Data</Text>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <MaterialCommunityIcons
              name="download"
              size={36}
              color={theme.colors.primary}
            />
            <Text style={styles.infoTitle}>Export Your Data</Text>
            <Text style={styles.infoText}>
              Download a copy of your health and app data. This includes your medications,
              health check-ins, emergency contacts, and more. Your data will be exported
              in a secure, readable format.
            </Text>
          </View>
        </View>

        {/* Data Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Data to Export</Text>
          <Text style={styles.sectionSubtitle}>
            Choose which categories to include in your export
          </Text>

          <View style={styles.optionsContainer}>
            {exportOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  selectedOptions[option.id] && styles.optionCardSelected
                ]}
                onPress={() => toggleOption(option.id)}
                activeOpacity={0.85}
              >
                <View style={styles.optionHeader}>
                  <MaterialCommunityIcons
                    name={option.icon}
                    size={26}
                    color={selectedOptions[option.id] ? theme.colors.textOnPrimary : theme.colors.textSecondary}
                  />
                  <View style={styles.optionInfo}>
                    <Text style={[
                      styles.optionTitle,
                      selectedOptions[option.id] && styles.optionTitleSelected
                    ]}>
                      {option.title}
                    </Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                    <Text style={styles.optionSize}>{option.dataSize}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name={selectedOptions[option.id] ? "checkbox-marked" : "checkbox-blank-outline"}
                    size={26}
                    color={selectedOptions[option.id] ? theme.colors.textOnPrimary : theme.colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              Selected: {Object.values(selectedOptions).filter(Boolean).length} categories
            </Text>
            <Text style={styles.summarySize}>
              Estimated size: ~{getSelectedDataSize()} KB
            </Text>
          </View>
        </View>

        {/* Export Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Format</Text>

          <View style={styles.exportButtonsContainer}>
            <TouchableOpacity
              style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
              onPress={exportAsJSON}
              disabled={isExporting}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="code-json"
                size={26}
                color={theme.colors.textOnPrimary}
              />
              <View style={styles.exportButtonText}>
                <Text style={styles.exportButtonTitle}>JSON Format</Text>
                <Text style={styles.exportButtonSubtitle}>Machine-readable format</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.exportButton, styles.exportButtonSecondary, isExporting && styles.exportButtonDisabled]}
              onPress={exportAsText}
              disabled={isExporting}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="file-document"
                size={26}
                color={theme.colors.textOnPrimary}
              />
              <View style={styles.exportButtonText}>
                <Text style={[styles.exportButtonTitle, styles.exportButtonTitleSecondary]}>Text Format</Text>
                <Text style={styles.exportButtonSubtitle}>Human-readable format</Text>
              </View>
            </TouchableOpacity>

           
          </View>

          {isExporting && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Exporting data...</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${exportProgress}%` }]} />
              </View>
              <Text style={styles.progressPercentage}>{exportProgress}%</Text>
            </View>
          )}
        </View>

        {/* Important Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Important Notes</Text>
          <View style={styles.notesCard}>
            <View style={styles.noteItem}>
              <MaterialCommunityIcons
                name="shield-check"
                size={22}
                color={theme.colors.secondary}
              />
              <Text style={styles.noteText}>
                Your data is exported securely and remains private
              </Text>
            </View>
            <View style={styles.noteItem}>
              <MaterialCommunityIcons
                name="file-check"
                size={22}
                color={theme.colors.secondary}
              />
              <Text style={styles.noteText}>
                Exported files can be imported into other health apps
              </Text>
            </View>
            <View style={styles.noteItem}>
              <MaterialCommunityIcons
                name="backup-restore"
                size={22}
                color={theme.colors.secondary}
              />
              <Text style={styles.noteText}>
                Keep exported data as a backup of your health information
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginRight: theme.spacing.lg,
    padding: theme.spacing.sm,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.primaryLight,
  },
  headerTitle: {
    fontSize: theme.typography.h5.fontSize,
    fontWeight: theme.typography.h5.fontWeight,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  section: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.h6.fontSize,
    fontWeight: theme.typography.h6.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  infoCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.roundness,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: theme.typography.h6.fontSize,
    fontWeight: theme.typography.h6.fontWeight,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.body1.lineHeight,
  },
  optionsContainer: {
    gap: theme.spacing.md,
  },
  optionCard: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.roundness,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
  },
  optionCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
    marginRight: theme.spacing.md,
  },
  optionTitle: {
    fontSize: theme.typography.body1.fontSize,
    fontWeight: theme.typography.body1.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.xxs,
  },
  optionTitleSelected: {
    color: theme.colors.textOnPrimary,
  },
  optionDescription: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xxs,
  },
  optionSize: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  summaryCard: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.roundness,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: theme.typography.body2.fontSize,
    fontWeight: theme.typography.body2.fontWeight,
    color: theme.colors.primary,
  },
  summarySize: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.primary,
  },
  exportButtonsContainer: {
    gap: theme.spacing.md,
  },
  exportButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exportButtonSecondary: {
    backgroundColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  exportButtonTitle: {
    fontSize: theme.typography.body1.fontSize,
    fontWeight: theme.typography.body1.fontWeight,
    color: theme.colors.textOnPrimary,
  },
  exportButtonTitleSecondary: {
    color: theme.colors.textOnPrimary,
  },
  exportButtonSubtitle: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textOnPrimary,
    marginTop: theme.spacing.xxs,
  },
  progressContainer: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: theme.roundness,
  },
  progressText: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressPercentage: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  notesCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.roundness,
    padding: theme.spacing.lg,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  noteText: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
    flex: 1,
  },
});

export default ExportDataScreen;
