import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText, ThemedHeading, ThemedCardTitle } from '../../components/common/ThemedText';
import { WellnessCard, QuickActionCard, HealthMetricCard } from '../../components/common/CustomCards';
import { CustomButton } from '../../components/common/CustomButton';
import { useMedication } from '../../context/MedicationContext';
import { useTheme } from '../../context/ThemeContext';
import { MEDICATION_CONFIG } from '../../config/config';

const MedicationsScreen = (props) => {
  const navigation = props.navigation || useNavigation();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const { 
    medications, 
    upcomingReminders,
    medicationLogs,
    loading,
    loadMedications,
    loadMedicationLogs,
    markMedicationTaken,
    deleteMedication,
  } = useMedication();

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'taken_today'

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadMedications(),
      loadMedicationLogs(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleMarkTaken = async (medication) => {
    Alert.alert(
      'Mark as Taken',
      `Did you take ${medication.name} (${medication.dosage})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: async () => {
            const logData = {
              taken: true,
              scheduled_time: new Date().toISOString(),
              taken_at: new Date().toISOString(),
              notes: 'Marked as taken via app',
            };
            
            const result = await markMedicationTaken(medication.id, logData);
            if (result.success) {
              Alert.alert('Success', 'Medication marked as taken');
              // Refresh the medication list and logs to show updated status
              await loadInitialData();
            } else {
              Alert.alert('Error', result.error);
            }
          }
        },
      ]
    );
  };

  const handleDeleteMedication = (medication) => {
    Alert.alert(
      'Delete Medication',
      `Are you sure you want to delete ${medication.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const result = await deleteMedication(medication.id);
            if (result.success) {
              Alert.alert('Success', 'Medication deleted');
              // Refresh the list after deletion
              await loadInitialData();
            } else {
              Alert.alert('Error', result.error);
            }
          }
        },
      ]
    );
  };

  const getNextDoseTime = (medication) => {
    if (!medication.times || medication.times.length === 0) return null;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Check if any time today is upcoming
    for (const timeStr of medication.times) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const timeInMinutes = hours * 60 + minutes;
      
      if (timeInMinutes > currentTime) {
        const nextDose = new Date();
        nextDose.setHours(hours, minutes, 0, 0);
        return nextDose;
      }
    }
    
    // If no time today, return first time tomorrow
    const [hours, minutes] = medication.times[0].split(':').map(Number);
    const nextDose = new Date();
    nextDose.setDate(nextDose.getDate() + 1);
    nextDose.setHours(hours, minutes, 0, 0);
    return nextDose;
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

  const isMedicationTakenToday = (medication) => {
    if (!medicationLogs || medicationLogs.length === 0) return false;
    
    const today = new Date().toDateString();
    return medicationLogs.some(log => {
      const logDate = new Date(log.taken_at || log.scheduled_time).toDateString();
      return log.medication_id === medication.id && 
             log.taken === true &&
             logDate === today;
    });
  };

  const getMedicationStatus = (medication) => {
    // First check if medication was already taken today
    const takenToday = isMedicationTakenToday(medication);
    if (takenToday) {
      return { 
        status: 'taken_today', 
        color: theme.colors.success,
        text: 'Taken today'
      };
    }

    const nextDose = getNextDoseTime(medication);
    if (!nextDose) {
      return { 
        status: 'no_schedule', 
        color: theme.colors.textSecondary,
        text: 'No schedule'
      };
    }
    
    const now = new Date();
    const timeDiff = nextDose.getTime() - now.getTime();
    const hoursUntilNext = timeDiff / (1000 * 60 * 60);
    
    if (hoursUntilNext <= 0) {
      return { 
        status: 'overdue', 
        color: theme.colors.error,
        text: 'Overdue'
      };
    } else if (hoursUntilNext <= 1) {
      return { 
        status: 'due_soon', 
        color: theme.colors.warning || theme.colors.error,
        text: 'Due soon'
      };
    } else if (hoursUntilNext <= 24) {
      return { 
        status: 'upcoming', 
        color: theme.colors.primary,
        text: 'Upcoming'
      };
    } else {
      return { 
        status: 'scheduled', 
        color: theme.colors.textSecondary,
        text: 'Scheduled'
      };
    }
  };

  const filteredMedications = (() => {
    const medicationsArray = Array.isArray(medications) ? medications : [];
    
    return medicationsArray.filter(medication => {
      switch (filter) {
        case 'active':
          // Active means medications that haven't been taken today (pending/due medications)
          return !isMedicationTakenToday(medication);
        case 'taken_today':
          // Medications that were taken today
          return isMedicationTakenToday(medication);
        default:
          // All medications
          return true;
      }
    });
  })();

  // Calculate counts for each filter
  const getFilterCounts = () => {
    const medicationsArray = Array.isArray(medications) ? medications : [];
    
    const allCount = medicationsArray.length;
    const takenTodayCount = medicationsArray.filter(med => isMedicationTakenToday(med)).length;
    const activeCount = medicationsArray.filter(med => !isMedicationTakenToday(med)).length;
    
    return {
      all: allCount,
      active: activeCount,
      taken_today: takenTodayCount
    };
  };

  const filterCounts = getFilterCounts();

  // Calculate total doses due today across all medications
  const getTotalDosesToday = () => {
    if (!Array.isArray(medications)) {
      return 0;
    }
    
    return medications.reduce((totalDoses, medication) => {
      
      // Skip medications that don't have times scheduled
      if (!medication.times || !Array.isArray(medication.times)) {
        // If no times array, calculate based on frequency
        const dosesFromFrequency = getFrequencyDoses(medication.frequency);
        return totalDoses + dosesFromFrequency;
      }
      
      // Each time in the times array represents one dose for today
      return totalDoses + medication.times.length;
    }, 0);
  };

  // Helper function to get number of doses from frequency
  const getFrequencyDoses = (frequency) => {
    switch (frequency) {
      case 'once_daily': return 1;
      case 'twice_daily': return 2;
      case 'three_times_daily': return 3;
      case 'four_times_daily': return 4;
      case 'as_needed': return 0; // Don't count as needed medications
      default: return 1;
    }
  };

  // Calculate remaining (not taken) doses for today
  const getRemainingDosesToday = () => {
    if (!Array.isArray(medications)) {
      return 0;
    }
    
    return medications.reduce((remainingDoses, medication) => {
      const isTaken = isMedicationTakenToday(medication);
      
      // Skip if no times scheduled
      if (!medication.times || !Array.isArray(medication.times)) {
        const dosesFromFrequency = getFrequencyDoses(medication.frequency);
        
        // If medication was already taken today, it contributes 0 remaining doses
        if (isTaken) {
          return remainingDoses;
        }
        
        return remainingDoses + dosesFromFrequency;
      }
      
      // If medication was already taken today, it contributes 0 remaining doses
      if (isTaken) {
        return remainingDoses;
      }
      
      // Otherwise, all scheduled doses for this medication are still remaining
      return remainingDoses + medication.times.length;
    }, 0);
  };

  const totalDosesToday = getTotalDosesToday();
  const remainingDosesToday = getRemainingDosesToday();
  const completedDosesToday = totalDosesToday - remainingDosesToday;

  const FilterButton = ({ filterKey, label, count }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterKey && styles.filterButtonActive
      ]}
      onPress={() => setFilter(filterKey)}
    >
      <ThemedText 
        variant="bodyLarge" 
        style={[
          styles.filterButtonText,
          filter === filterKey && styles.filterButtonTextActive
        ]}
      >
        {label} {count !== undefined && `(${count})`}
      </ThemedText>
    </TouchableOpacity>
  );

  const MedicationCard = ({ medication }) => {
    const status = getMedicationStatus(medication);
    const nextDose = getNextDoseTime(medication);
    const takenToday = isMedicationTakenToday(medication);

    return (
      <WellnessCard style={[
        styles.medicationCard,
        takenToday && styles.medicationCardTaken
      ]}>
        <TouchableOpacity
          onPress={() => {
            if (!navigation || typeof navigation.navigate !== 'function') {
              Alert.alert('Navigation Error', 'Navigation is not available.');
              return;
            }
            if (!medication.id) {
              Alert.alert('Error', 'Medication ID is missing.');
              return;
            }
            navigation.navigate('MedicationDetails', { 
              medicationId: medication.id 
            });
          }}
          activeOpacity={0.7}
        >
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
              {status.text && (
                <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                  <ThemedText variant="bodySmall" style={[styles.statusText, { color: status.color }]}>
                    {status.text}
                  </ThemedText>
                </View>
              )}
            </View>
            <View style={styles.buttonContainer}>
              {takenToday ? (
                <View style={[styles.takenIndicator, { backgroundColor: theme.colors.success }]}>
                  <MaterialCommunityIcons 
                    name="check" 
                    size={20} 
                    color={theme.colors.surface} 
                  />
                  <ThemedText variant="bodyMedium" style={[styles.takenText, { color: theme.colors.surface }]}>
                    Taken
                  </ThemedText>
                </View>
              ) : (
                <CustomButton
                  mode="contained"
                  onPress={() => handleMarkTaken(medication)}
                  style={[
                    styles.takenButton,
                    status.status === 'overdue' && styles.takenButtonOverdue,
                    status.status === 'due_soon' && styles.takenButtonDueSoon
                  ]}
                  textColor={theme.colors.surface}
                  compact
                >
                  ✓ Take
                </CustomButton>
              )}
            </View>
          </View>

          {nextDose && !takenToday && (
            <View style={styles.nextDoseContainer}>
              <MaterialCommunityIcons 
                name="clock-outline" 
                size={20} 
                color={status.color} 
              />
              <ThemedText 
                variant="bodyMedium" 
                style={[styles.nextDoseText, { color: status.color }]}
              >
                Next dose: {nextDose.toLocaleString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  month: 'short',
                  day: 'numeric',
                })}
              </ThemedText>
            </View>
          )}

          {medication.instructions && (
            <View style={styles.notesContainer}>
              <ThemedText variant="bodyMedium" color="secondary" style={styles.medicationNotes}>
                📝 {medication.instructions}
              </ThemedText>
            </View>
          )}

          <View style={styles.medicationFooter}>
            <View style={styles.timesContainer}>
              {medication.times?.map((time, timeIndex) => (
                <View key={timeIndex} style={[
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
            <CustomButton
              mode="outlined"
              onPress={() => handleDeleteMedication(medication)}
              style={styles.deleteButton}
              textColor={theme.colors.error}
              compact
            >
              Delete
            </CustomButton>
          </View>
        </TouchableOpacity>
      </WellnessCard>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <HealthMetricCard
            title="Total"
            value={Array.isArray(medications) ? medications.length.toString() : '0'}
            unit="meds"
            color={theme.colors.primary}
            icon="pill"
            style={styles.statCard}
          />
          <HealthMetricCard
            title="Due Today"
            value={remainingDosesToday.toString()}
            unit="doses"
            color={theme.colors.secondary}
            icon="clock-alert"
            style={styles.statCard}
          />
          <HealthMetricCard
            title="Completed Today"
            value={completedDosesToday.toString()}
            unit="doses"
            color={theme.colors.success}
            icon="check-circle"
            style={styles.statCard}
          />
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterScrollContent}>
              <FilterButton 
                filterKey="all" 
                label="All" 
                count={filterCounts.all}
              />
              <FilterButton 
                filterKey="active" 
                label="Active" 
                count={filterCounts.active}
              />
              <FilterButton 
                filterKey="taken_today" 
                label="Taken Today" 
                count={filterCounts.taken_today}
              />
            </View>
          </ScrollView>
        </View>

        {/* Upcoming Reminders */}
        {upcomingReminders.length > 0 && (
          <WellnessCard style={styles.remindersCard}>
            <View style={styles.reminderHeader}>
              <MaterialCommunityIcons 
                name="bell-ring" 
                size={28} 
                color={theme.colors.secondary} 
              />
              <ThemedHeading level={4} style={styles.reminderTitle}>
                Next Reminders
              </ThemedHeading>
            </View>
            {upcomingReminders.slice(0, 3).map((reminder, index) => (
              <View key={index} style={styles.reminderItem}>
                <View style={styles.reminderContent}>
                  <ThemedText variant="titleMedium" style={styles.reminderMedication}>
                    {reminder.medicationName}
                  </ThemedText>
                  <ThemedText variant="bodyLarge" style={styles.reminderTime}>
                    🕐 {reminder.time.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </ThemedText>
                </View>
                <MaterialCommunityIcons 
                  name="chevron-right" 
                  size={24} 
                  color={theme.colors.textSecondary} 
                />
              </View>
            ))}
          </WellnessCard>
        )}

        {/* Medications List */}
        <View style={styles.medicationsSection}>
          <ThemedHeading level={3} style={styles.sectionTitle}>
            My Medications
          </ThemedHeading>
          
          {filteredMedications.length === 0 ? (
            <WellnessCard style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <MaterialCommunityIcons 
                  name="pill" 
                  size={70} 
                  color={theme.colors.primarySoft} 
                />
                <ThemedHeading level={4} style={styles.emptyTitle}>
                  No Medications
                </ThemedHeading>
                 {/*<ThemedText variant="bodyLarge" color="secondary" style={styles.emptyMessage}>
                  {/* {filter === 'all' 
                    ? "You haven't added any medications yet. Tap the button below to get started."
                    : "No medications match the selected filter."
                  }
                </ThemedText>*/}
                {filter === 'all' && (
                  <CustomButton
                    mode="contained"
                    onPress={() => {
                      if (!navigation || typeof navigation.navigate !== 'function') {
                        Alert.alert('Navigation Error', 'Navigation is not available.');
                        return;
                      }
                      navigation.navigate('AddMedication');
                    }}
                    style={styles.addFirstButton}
                    icon="plus"
                  >
                    Add
                  </CustomButton>
                )}
              </View>
            </WellnessCard>
          ) : (
            filteredMedications.map((medication) => (
              <MedicationCard key={medication.id} medication={medication} />
            ))
          )}
        </View>

        {/* Add Medication Button */}
        {filteredMedications.length > 0 && (
          <View style={styles.addButtonContainer}>
            <CustomButton
              mode="contained"
              onPress={() => {
                if (!navigation || typeof navigation.navigate !== 'function') {
                  Alert.alert('Navigation Error', 'Navigation is not available.');
                  return;
                }
                navigation.navigate('AddMedication');
              }}
              style={styles.addButton}
              icon="plus"
            >
              Add New Medication
            </CustomButton>
          </View>
        )}

        {/* Extra spacing for better scrolling */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const createStyles = (theme) => StyleSheet.create({
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
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
  },
  
  // Filters
  filterContainer: {
    marginBottom: theme.spacing.lg,
  },
  filterScrollContent: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  filterButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.borderColor,
    minWidth: 100,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  filterButtonTextActive: {
    color: theme.colors.textOnPrimary,
  },
  
  // Reminders
  remindersCard: {
    marginBottom: theme.spacing.lg,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  reminderTitle: {
    color: theme.colors.secondary,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor + '40',
  },
  reminderContent: {
    flex: 1,
  },
  reminderMedication: {
    marginBottom: theme.spacing.xxs,
    color: theme.colors.textPrimary,
  },
  reminderTime: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  
  // Medications
  medicationsSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
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
    minWidth: 0, // Allows text to wrap properly
  },
  medicationName: {
    marginBottom: theme.spacing.xxs,
    fontSize: theme.typography.h6.fontSize,
    color: theme.colors.textPrimary,
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
    minWidth: 100,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  takenButton: {
    minWidth: 80,
    backgroundColor: theme.colors.success,
  },
  takenButtonOverdue: {
    backgroundColor: theme.colors.error,
  },
  takenButtonDueSoon: {
    backgroundColor: theme.colors.warning || theme.colors.error,
  },
  takenIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness,
    minWidth: 80,
    justifyContent: 'center',
  },
  takenText: {
    fontWeight: '600',
    fontSize: theme.typography.body1.fontSize,
  },
  nextDoseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  nextDoseText: {
    fontWeight: '500',
    fontSize: theme.typography.body2.fontSize,
  },
  notesContainer: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.roundness,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  medicationNotes: {
    fontStyle: 'italic',
    fontSize: theme.typography.body2.fontSize,
  },
  medicationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    flex: 1,
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
  deleteButton: {
    minWidth: 80,
    borderColor: theme.colors.error,
    alignSelf: 'flex-end',
  },
  
  // Empty State
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  emptyTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  addFirstButton: {
    minWidth: 200,
  },
  
  // Add Button
  addButtonContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  addButton: {
    minWidth: 200,
  },
});

export default MedicationsScreen;
