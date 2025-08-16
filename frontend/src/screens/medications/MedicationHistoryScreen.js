import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import {
  ActivityIndicator,
  Menu,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMedication } from '../../context/MedicationContext';
import medicationService from '../../services/medicationService';
import { useTheme } from '../../context/ThemeContext';
import { ThemedText, ThemedCardTitle } from '../../components/common/ThemedText';
import { CustomButton } from '../../components/common/CustomButton';
import { WellnessCard } from '../../components/common/CustomCards';
import ScreenWithHeader from '../../components/ScreenWithHeader';

const MedicationHistoryScreen = ({ navigation, route }) => {
  const { medicationId } = route.params || {};
  const { theme } = useTheme();
  const { medications } = useMedication();
  
  const [medication, setMedication] = useState(null);
  const [medicationLogs, setMedicationLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, taken, missed, late
  const [dateRange, setDateRange] = useState('7'); // 7, 30, 90, all
  const [menuVisible, setMenuVisible] = useState(false);
  
  // Create styles with current theme
  const styles = createStyles(theme);

  useEffect(() => {
    loadData();
  }, [medicationId, dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load medication details if we have an ID
      if (medicationId) {
        const localMed = medications.find(m => m.id === medicationId);
        if (localMed) {
          setMedication(localMed);
        }
        
        const medicationResponse = await medicationService.getMedication(medicationId);
        if (medicationResponse.success && medicationResponse.data.medication) {
          setMedication(medicationResponse.data.medication);
        }
      }

      // Load medication logs
      const params = {
        limit: dateRange === 'all' ? 1000 : parseInt(dateRange) * 4, // Rough estimate for range
      };
      
      if (medicationId) {
        params.medicationId = medicationId;
      }

      const logsResponse = await medicationService.getMedicationHistory(params);
      if (logsResponse.success && logsResponse.data.logs) {
        const logs = logsResponse.data.logs;
        
        // Filter by date range
        const filteredLogs = filterLogsByDateRange(logs, dateRange);
        setMedicationLogs(filteredLogs);
      }

    } catch (error) {
      console.error('Error loading medication history:', error);
      Alert.alert('Error', 'Failed to load medication history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filterLogsByDateRange = (logs, range) => {
    if (range === 'all') return logs;
    
    const days = parseInt(range);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return logs.filter(log => {
      const logDate = new Date(log.taken_at || log.scheduled_time);
      return logDate >= cutoffDate;
    });
  };

  const filteredLogs = useMemo(() => {
    let filtered = medicationLogs;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(log => {
        if (filterStatus === 'taken') return log.taken === true;
        if (filterStatus === 'missed') return log.taken === false;
        if (filterStatus === 'late') {
          // Consider logs taken more than 1 hour after scheduled time as late
          if (!log.taken) return false;
          const scheduled = new Date(log.scheduled_time);
          const taken = new Date(log.taken_at);
          const diffHours = (taken.getTime() - scheduled.getTime()) / (1000 * 60 * 60);
          return diffHours > 1;
        }
        return true;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => {
        const medicationName = medication?.name?.toLowerCase() || '';
        const notes = log.notes?.toLowerCase() || '';
        const status = log.taken ? 'taken' : 'missed';
        return medicationName.includes(query) || notes.includes(query) || status.includes(query);
      });
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.taken_at || a.scheduled_time);
      const dateB = new Date(b.taken_at || b.scheduled_time);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });
  }, [medicationLogs, filterStatus, searchQuery, medication]);

  const getAdherenceStats = () => {
    const total = medicationLogs.length;
    if (total === 0) return { total: 0, taken: 0, missed: 0, late: 0, adherenceRate: 0 };

    const taken = medicationLogs.filter(log => log.taken === true).length;
    const missed = medicationLogs.filter(log => log.taken === false).length;
    
    // Calculate late doses (taken more than 1 hour after scheduled)
    const late = medicationLogs.filter(log => {
      if (!log.taken) return false;
      const scheduled = new Date(log.scheduled_time);
      const takenAt = new Date(log.taken_at);
      const diffHours = (takenAt.getTime() - scheduled.getTime()) / (1000 * 60 * 60);
      return diffHours > 1;
    }).length;

    const onTime = taken - late;
    const adherenceRate = total > 0 ? Math.round(((onTime + late) / total) * 100) : 0;

    return { total, taken: onTime, late, missed, adherenceRate };
  };

  const getStatusInfo = (log) => {
    if (!log.taken) {
      return {
        status: 'missed',
        icon: 'close-circle',
        color: theme.colors.error,
        text: 'Missed'
      };
    }

    // Check if taken late
    const scheduled = new Date(log.scheduled_time);
    const taken = new Date(log.taken_at);
    const diffHours = (taken.getTime() - scheduled.getTime()) / (1000 * 60 * 60);
    
    if (diffHours > 1) {
      return {
        status: 'late',
        icon: 'clock-alert',
        color: theme.colors.warning || theme.colors.error,
        text: `Late (${Math.round(diffHours)}h)`
      };
    }

    return {
      status: 'taken',
      icon: 'check-circle',
      color: theme.colors.success,
      text: 'Taken'
    };
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    };
  };

  const exportHistory = async () => {
    Alert.alert(
      'Export History',
      'Export medication history to share with your healthcare provider?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: () => {
            // TODO: Implement export functionality
            Alert.alert('Export', 'Export functionality coming soon!');
          }
        }
      ]
    );
  };

  const stats = getAdherenceStats();

  if (loading) {
    return (
      <ScreenWithHeader 
        title="Medication History" 
        navigation={navigation}
        backgroundColor={theme.colors.background}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <ThemedText variant="bodyLarge" style={styles.loadingText}>
            Loading medication history...
          </ThemedText>
        </View>
      </ScreenWithHeader>
    );
  }

  return (
    <ScreenWithHeader 
      title="Medication History" 
      navigation={navigation}
      backgroundColor={theme.colors.background}
      rightComponent={
        <TouchableOpacity onPress={exportHistory} style={styles.exportButton}>
          <MaterialCommunityIcons 
            name="download" 
            size={24} 
            color={theme.colors.primary} 
          />
        </TouchableOpacity>
      }
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Medication Info Card */}
        {medication && (
          <WellnessCard style={styles.medicationCard}>
            <View style={styles.medicationHeader}>
              <View style={styles.medicationIconContainer}>
                <MaterialCommunityIcons 
                  name="pill" 
                  size={32} 
                  color={theme.colors.primary} 
                />
              </View>
              <View style={styles.medicationInfo}>
                <ThemedCardTitle style={styles.medicationName}>
                  {medication.name}
                </ThemedCardTitle>
                <ThemedText variant="bodyMedium" color="secondary">
                  {medication.dosage} • {medication.frequency}
                </ThemedText>
              </View>
            </View>
          </WellnessCard>
        )}

        {/* Statistics Card */}
        <WellnessCard style={styles.statsCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons 
              name="chart-line" 
              size={24} 
              color={theme.colors.primary} 
            />
            <ThemedCardTitle style={styles.cardTitle}>
              Adherence Statistics ({dateRange === 'all' ? 'All time' : `Last ${dateRange} days`})
            </ThemedCardTitle>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <ThemedText variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.primary }]}>
                {stats.adherenceRate}%
              </ThemedText>
              <ThemedText variant="bodySmall" color="secondary">Adherence Rate</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.success }]}>
                {stats.taken}
              </ThemedText>
              <ThemedText variant="bodySmall" color="secondary">On Time</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.warning || theme.colors.error }]}>
                {stats.late}
              </ThemedText>
              <ThemedText variant="bodySmall" color="secondary">Late</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.error }]}>
                {stats.missed}
              </ThemedText>
              <ThemedText variant="bodySmall" color="secondary">Missed</ThemedText>
            </View>
          </View>
        </WellnessCard>

        {/* Filters and Search */}
        <WellnessCard style={styles.filtersCard}>
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons 
              name="magnify" 
              size={20} 
              color={theme.colors.textSecondary} 
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search history..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <View style={styles.filtersRow}>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <TouchableOpacity 
                  style={styles.filterButton}
                  onPress={() => setMenuVisible(true)}
                >
                  <MaterialCommunityIcons 
                    name="filter" 
                    size={16} 
                    color={theme.colors.primary} 
                  />
                  <ThemedText variant="bodySmall" style={styles.filterButtonText}>
                    {filterStatus === 'all' ? 'All Status' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                  </ThemedText>
                  <MaterialCommunityIcons 
                    name="chevron-down" 
                    size={16} 
                    color={theme.colors.primary} 
                  />
                </TouchableOpacity>
              }
            >
              <Menu.Item onPress={() => { setFilterStatus('all'); setMenuVisible(false); }} title="All Status" />
              <Menu.Item onPress={() => { setFilterStatus('taken'); setMenuVisible(false); }} title="Taken" />
              <Menu.Item onPress={() => { setFilterStatus('late'); setMenuVisible(false); }} title="Late" />
              <Menu.Item onPress={() => { setFilterStatus('missed'); setMenuVisible(false); }} title="Missed" />
            </Menu>

            <View style={styles.dateRangeButtons}>
              {['7', '30', '90', 'all'].map((range) => (
                <TouchableOpacity
                  key={range}
                  style={[
                    styles.dateRangeButton,
                    dateRange === range && styles.dateRangeButtonActive
                  ]}
                  onPress={() => setDateRange(range)}
                >
                  <ThemedText 
                    variant="bodySmall" 
                    style={[
                      styles.dateRangeButtonText,
                      dateRange === range && styles.dateRangeButtonTextActive
                    ]}
                  >
                    {range === 'all' ? 'All' : `${range}d`}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </WellnessCard>

        {/* History List */}
        <WellnessCard style={styles.historyCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons 
              name="history" 
              size={24} 
              color={theme.colors.primary} 
            />
            <ThemedCardTitle style={styles.cardTitle}>
              History ({filteredLogs.length} entries)
            </ThemedCardTitle>
          </View>

          {filteredLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons 
                name="calendar-blank" 
                size={48} 
                color={theme.colors.textSecondary} 
              />
              <ThemedText variant="bodyLarge" color="secondary" style={styles.emptyText}>
                No medication history found
              </ThemedText>
              <ThemedText variant="bodyMedium" color="secondary" style={styles.emptySubtext}>
                {searchQuery ? 'Try adjusting your search or filters' : 'Medication logs will appear here once you start taking medications'}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.historyList}>
              {filteredLogs.map((log, index) => {
                const statusInfo = getStatusInfo(log);
                const dateTime = formatDateTime(log.taken_at || log.scheduled_time);
                
                return (
                  <View 
                    key={`${log.id || index}`} 
                    style={[
                      styles.historyItem,
                      index < filteredLogs.length - 1 && styles.historyItemBorder
                    ]}
                  >
                    <View style={styles.historyItemHeader}>
                      <View style={styles.historyDate}>
                        <ThemedText variant="bodyMedium" style={styles.dateText}>
                          {dateTime.date}
                        </ThemedText>
                        <ThemedText variant="bodySmall" color="secondary">
                          {dateTime.time}
                        </ThemedText>
                      </View>
                      
                      <View style={styles.historyStatus}>
                        <MaterialCommunityIcons 
                          name={statusInfo.icon} 
                          size={20} 
                          color={statusInfo.color} 
                        />
                        <ThemedText 
                          variant="bodyMedium" 
                          style={[styles.statusText, { color: statusInfo.color }]}
                        >
                          {statusInfo.text}
                        </ThemedText>
                      </View>
                    </View>
                    
                    {log.notes && (
                      <View style={styles.historyNotes}>
                        <ThemedText variant="bodySmall" color="secondary" style={styles.notesText}>
                          💬 {log.notes}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </WellnessCard>
      </ScrollView>
    </ScreenWithHeader>
  );
};

const createStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    padding: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    textAlign: 'center',
  },
  exportButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.button,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  // Medication Card
  medicationCard: {
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  medicationIconContainer: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.borderRadius.circle,
    padding: theme.spacing.md,
    minWidth: 64,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    marginBottom: 4,
  },

  // Stats Card
  statsCard: {
    marginBottom: theme.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    marginBottom: 0,
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },

  // Filters Card
  filtersCard: {
    marginBottom: theme.spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.borderRadius.button,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.button,
  },
  filterButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  dateRangeButtons: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  dateRangeButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.button,
    backgroundColor: theme.colors.surfaceSecondary,
    minWidth: 40,
    alignItems: 'center',
  },
  dateRangeButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  dateRangeButtonText: {
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  dateRangeButtonTextActive: {
    color: theme.colors.surface,
  },

  // History Card
  historyCard: {
    marginBottom: theme.spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtext: {
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  historyList: {
    gap: theme.spacing.sm,
  },
  historyItem: {
    paddingVertical: theme.spacing.md,
  },
  historyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor + '40',
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  historyDate: {
    flex: 1,
  },
  dateText: {
    fontWeight: '600',
  },
  historyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statusText: {
    fontWeight: '600',
  },
  historyNotes: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderColor + '20',
  },
  notesText: {
    fontStyle: 'italic',
    lineHeight: 20,
  },
});

export default MedicationHistoryScreen;
