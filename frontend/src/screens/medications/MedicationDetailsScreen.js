import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMedication } from '../../context/MedicationContext';
import medicationService from '../../services/medicationService';
import { useTheme } from '../../context/ThemeContext';
import { ThemedText, ThemedCardTitle } from '../../components/common/ThemedText';
import { CustomButton } from '../../components/common/CustomButton';
import { WellnessCard } from '../../components/common/CustomCards';

export default function MedicationDetailsScreen({ route, navigation }) {
  const { medicationId } = route.params;
  const { theme } = useTheme();
  const { medications, markMedicationTaken, deleteMedication } = useMedication();
  const [medication, setMedication] = useState(null);
  const [medicationLogs, setMedicationLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [takingMedication, setTakingMedication] = useState(false);

  // Create styles with current theme
  const styles = createStyles(theme);

  useEffect(() => {
    loadMedicationDetails();
  }, [medicationId]);

  const loadMedicationDetails = async () => {
    try {
      setLoading(true);
      
      // First check local state for immediate display
      const localMed = medications.find(m => m.id === medicationId);
      if (localMed) {
        setMedication(localMed);
      }

      // Fetch fresh data from server
      const [medicationResponse, logsResponse] = await Promise.all([
        medicationService.getMedication(medicationId),
        medicationService.getMedicationHistory({ medicationId: medicationId, limit: 10 })
      ]);

      if (medicationResponse.success && medicationResponse.data.medication) {
        setMedication(medicationResponse.data.medication);
      } else {
        throw new Error('Medication not found');
      }

      if (logsResponse.success && logsResponse.data.logs) {
        setMedicationLogs(logsResponse.data.logs);
      }

    } catch (error) {
      console.error('Error loading medication details:', error);
      Alert.alert(
        'Error',
        'Failed to load medication details. Please try again.',
        [
          { text: 'Go Back', onPress: () => navigation.goBack() },
          { text: 'Retry', onPress: () => loadMedicationDetails() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedicationDetails();
    setRefreshing(false);
  };

  const handleMarkTaken = async () => {
    Alert.alert(
      'Mark as Taken',
      `Did you take ${medication.name} (${medication.dosage})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: async () => {
            try {
              setTakingMedication(true);
              const logData = {
                taken: true,
                scheduled_time: new Date().toISOString(),
                taken_at: new Date().toISOString(),
                notes: 'Marked as taken via medication details',
              };
              
              const result = await markMedicationTaken(medicationId, logData);
              if (result.success) {
                Alert.alert('Success', 'Medication marked as taken!');
                await loadMedicationDetails(); // Refresh data
              } else {
                Alert.alert('Error', result.error || 'Failed to mark medication as taken');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to mark medication as taken');
            } finally {
              setTakingMedication(false);
            }
          }
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Medication',
      `Are you sure you want to delete ${medication?.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteMedication(medicationId);
              if (result.success) {
                Alert.alert('Success', 'Medication deleted successfully');
                navigation.goBack();
              } else {
                Alert.alert('Error', result.error || 'Failed to delete medication');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete medication');
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('AddMedication', { 
      medicationId: medicationId,
      medication: medication 
    });
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      'once_daily': 'Once daily',
      'twice_daily': 'Twice daily',
      'three_times_daily': '3x daily',
      'four_times_daily': '4x daily',
      'as_needed': 'As needed',
    };
    return labels[frequency] || frequency;
  };

  const getNextDoseTime = () => {
    if (!medication?.times || medication.times.length === 0) return null;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Check if any time today is upcoming
    for (const timeStr of medication.times) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const timeInMinutes = hours * 60 + minutes;
      
      if (timeInMinutes > currentTime) {
        return timeStr;
      }
    }
    
    // If no time today, return first time tomorrow
    return `${medication.times[0]} (tomorrow)`;
  };

  const isTakenToday = () => {
    if (!medicationLogs || medicationLogs.length === 0) return false;
    
    const today = new Date().toDateString();
    return medicationLogs.some(log => 
      log.taken === true &&
      new Date(log.taken_at || log.scheduled_time).toDateString() === today
    );
  };

  const getRecentLogs = () => {
    return medicationLogs.slice(0, 5);
  };

  if (loading || !medication) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <ThemedText variant="bodyLarge" style={styles.loadingText}>
            Loading medication details...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const nextDose = getNextDoseTime();
  const takenToday = isTakenToday();
  const recentLogs = getRecentLogs();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Custom Header with Back Button */}
        <View style={styles.customHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons 
              name="arrow-left" 
              size={24} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
          <ThemedCardTitle style={styles.headerTitle}>
            Medication Details
          </ThemedCardTitle>
          <View style={styles.headerSpacer} />
        </View>
        {/* Header Card */}
        <WellnessCard style={[
          styles.medicationCard,
          takenToday && styles.medicationCardTaken
        ]}>
          <View style={styles.medicationHeader}>
            <View style={[
              styles.medicationIconContainer,
              takenToday && styles.medicationIconContainerTaken
            ]}>
              <MaterialCommunityIcons 
                name={takenToday ? "check-circle" : "pill"} 
                size={32} 
                color={takenToday ? theme.colors.success : theme.colors.primary} 
              />
            </View>
            <View style={styles.medicationInfo}>
              <ThemedCardTitle style={[
                styles.medicationName,
                takenToday && styles.medicationNameTaken
              ]}>
                {medication.name}
              </ThemedCardTitle>
              <ThemedText variant="bodyMedium" color="secondary" style={styles.medicationDosage}>
                {medication.dosage} • {getFrequencyLabel(medication.frequency)}
              </ThemedText>
              {takenToday && (
                <View style={[styles.statusBadge, { backgroundColor: theme.colors.success + '20' }]}>
                  <ThemedText variant="bodySmall" style={[styles.statusText, { color: theme.colors.success }]}>
                    ✓ Taken today
                  </ThemedText>
                </View>
              )}
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleEdit}
              >
                <MaterialCommunityIcons 
                  name="pencil" 
                  size={24} 
                  color={theme.colors.primary} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleDelete}
              >
                <MaterialCommunityIcons 
                  name="delete" 
                  size={24} 
                  color={theme.colors.error} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            {!takenToday ? (
              <CustomButton
                mode="contained"
                onPress={handleMarkTaken}
                loading={takingMedication}
                disabled={takingMedication}
                style={[styles.takenButton, { backgroundColor: theme.colors.success }]}
                textColor={theme.colors.surface}
                compact
              >
                ✓ Mark as Taken
              </CustomButton>
            ) : (
              <View style={[styles.takenIndicator, { backgroundColor: theme.colors.success }]}>
                <MaterialCommunityIcons 
                  name="check" 
                  size={20} 
                  color={theme.colors.surface} 
                />
                <ThemedText variant="bodyMedium" style={[styles.takenText, { color: theme.colors.surface }]}>
                  Taken Today
                </ThemedText>
              </View>
            )}
            <CustomButton
              mode="outlined"
              onPress={() => navigation.navigate('MedicationHistory', { medicationId })}
              style={styles.actionButtonFull}
              textColor={theme.colors.primary}
              compact
            >
              📊 View History
            </CustomButton>
          </View>
        </WellnessCard>

        {/* Schedule Information */}
        <WellnessCard style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons 
              name="clock-outline" 
              size={24} 
              color={theme.colors.primary} 
            />
            <ThemedCardTitle style={styles.cardTitle}>Schedule</ThemedCardTitle>
          </View>
          
          <View style={styles.scheduleInfo}>
            <View style={styles.infoRow}>
              <ThemedText variant="bodyMedium" color="secondary">Frequency</ThemedText>
              <ThemedText variant="bodyMedium">{getFrequencyLabel(medication.frequency)}</ThemedText>
            </View>
            
            {medication.times && medication.times.length > 0 && (
              <View style={styles.infoRow}>
                <ThemedText variant="bodyMedium" color="secondary">Times</ThemedText>
                <View style={styles.timesContainer}>
                  {medication.times.map((time, index) => (
                    <View key={index} style={[
                      styles.timeChip,
                      takenToday && styles.timeChipTaken
                    ]}>
                      <ThemedText variant="bodySmall" style={[
                        styles.timeChipText,
                        takenToday && styles.timeChipTextTaken
                      ]}>
                        🕐 {time}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {nextDose && (
              <View style={styles.infoRow}>
                <ThemedText variant="bodyMedium" color="secondary">Next Dose</ThemedText>
                <ThemedText variant="bodyMedium" style={styles.nextDoseText}>
                  {nextDose}
                </ThemedText>
              </View>
            )}

            {medication.start_date && (
              <View style={styles.infoRow}>
                <ThemedText variant="bodyMedium" color="secondary">Started</ThemedText>
                <ThemedText variant="bodyMedium">
                  {new Date(medication.start_date).toLocaleDateString()}
                </ThemedText>
              </View>
            )}

            {medication.end_date && (
              <View style={styles.infoRow}>
                <ThemedText variant="bodyMedium" color="secondary">Ends</ThemedText>
                <ThemedText variant="bodyMedium">
                  {new Date(medication.end_date).toLocaleDateString()}
                </ThemedText>
              </View>
            )}
          </View>
        </WellnessCard>

        {/* Instructions */}
        {medication.instructions && (
          <WellnessCard style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons 
                name="text-box-outline" 
                size={24} 
                color={theme.colors.primary} 
              />
              <ThemedCardTitle style={styles.cardTitle}>Instructions</ThemedCardTitle>
            </View>
            <ThemedText variant="bodyMedium" style={styles.instructionsText}>
              {medication.instructions}
            </ThemedText>
          </WellnessCard>
        )}

        {/* Recent Activity */}
        {recentLogs.length > 0 && (
          <WellnessCard style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons 
                name="history" 
                size={24} 
                color={theme.colors.primary} 
              />
              <ThemedCardTitle style={styles.cardTitle}>Recent Activity</ThemedCardTitle>
            </View>
            <View style={styles.activityList}>
              {recentLogs.map((log, index) => (
                <View key={index} style={[
                  styles.activityItem,
                  index < recentLogs.length - 1 && styles.activityItemBorder
                ]}>
                  <MaterialCommunityIcons 
                    name={log.taken ? "check-circle" : "close-circle"} 
                    size={20} 
                    color={log.taken ? theme.colors.success : theme.colors.error} 
                  />
                  <View style={styles.activityInfo}>
                    <ThemedText variant="bodyMedium">
                      {log.taken ? 'Taken' : 'Missed'}
                    </ThemedText>
                    <ThemedText variant="bodySmall" color="secondary">
                      {new Date(log.taken_at || log.scheduled_time).toLocaleString()}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </WellnessCard>
        )}

        {/* Emergency Information */}
        <WellnessCard style={[styles.card, styles.emergencyCard]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons 
              name="alert-circle" 
              size={24} 
              color={theme.colors.error} 
            />
            <ThemedCardTitle style={[styles.cardTitle, { color: theme.colors.error }]}>
              Emergency Information
            </ThemedCardTitle>
          </View>
          <ThemedText variant="bodyMedium" color="secondary" style={styles.emergencyText}>
            In case of overdose or adverse reaction, contact emergency services immediately or call Poison Control at 1-800-222-1222.
          </ThemedText>
        </WellnessCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    padding: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    textAlign: 'center',
  },
  
  // Custom Header
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.sm,
  },
  backButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: theme.spacing.xl, // Use theme spacing for spacer width
  },
  
  // Medication Card (consistent with MedicationsScreen)
  medicationCard: {
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  medicationCardTaken: {
    borderLeftColor: theme.colors.success,
    backgroundColor: theme.colors.successSoft || theme.colors.surface,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  medicationIconContainer: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.roundness,
    padding: theme.spacing.sm,
    minWidth: 56,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicationIconContainerTaken: {
    backgroundColor: theme.colors.successSoft,
  },
  medicationInfo: {
    flex: 1,
    minWidth: 0,
  },
  medicationName: {
    marginBottom: theme.spacing.xxs,
    fontSize: theme.typography.h6.fontSize,
    color: theme.colors.text.primary,
  },
  medicationNameTaken: {
    color: theme.colors.success,
  },
  medicationDosage: {
    lineHeight: theme.typography.body1.lineHeight,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: theme.roundness,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  statusText: {
    fontWeight: '600',
    fontSize: theme.typography.caption.fontSize,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  actionButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionButtonFull: {
    flex: 1,
  },
  takenButton: {
    flex: 1,
    backgroundColor: theme.colors.success,
  },
  takenIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.roundness,
  },
  takenText: {
    fontWeight: '600',
    fontSize: theme.typography.body1.fontSize,
  },
  
  // Cards (consistent with app design)
  card: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    marginBottom: 0,
    fontSize: theme.typography.h6.fontSize,
    color: theme.colors.text.primary,
  },
  
  // Schedule
  scheduleInfo: {
    gap: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  timeChip: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.roundness,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  timeChipTaken: {
    backgroundColor: theme.colors.successSoft,
  },
  timeChipText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: theme.typography.caption.fontSize,
  },
  timeChipTextTaken: {
    color: theme.colors.success,
  },
  nextDoseText: {
    fontWeight: '600',
    color: theme.colors.primary,
    fontSize: theme.typography.body1.fontSize,
  },
  
  // Instructions
  instructionsText: {
    lineHeight: theme.typography.body1.lineHeight,
    color: theme.colors.text.primary,
  },
  
  // Activity
  activityList: {
    gap: theme.spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '40',
  },
  activityInfo: {
    flex: 1,
  },
  
  // Emergency
  emergencyCard: {
    borderLeftColor: theme.colors.error,
    backgroundColor: theme.colors.error + '05',
  },
  emergencyText: {
    lineHeight: theme.typography.body1.lineHeight,
    color: theme.colors.error,
  },
});
