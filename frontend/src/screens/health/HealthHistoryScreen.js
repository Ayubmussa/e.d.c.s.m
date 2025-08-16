import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Alert,
  Text,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ThemedText, ThemedHeading, ThemedCardTitle } from '../../components/common/ThemedText';
import { WellnessCard, QuickActionCard, HealthMetricCard, NotificationCard } from '../../components/common/CustomCards';
import { CustomButton } from '../../components/common/CustomButton';
import { useHealth } from '../../context/HealthContext';
import { useTheme } from '../../context/ThemeContext';
import healthService from '../../services/healthService';

const HealthHistoryScreen = (props) => {
  const navigation = props.navigation || useNavigation();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const { healthCheckins } = useHealth();
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState('week');
  const [menuVisible, setMenuVisible] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sheetVisible, setSheetVisible] = useState(false);

  useEffect(() => {
    loadHealthHistory();
  }, [timeFilter]);

  const loadHealthHistory = async () => {
    try {
      console.log('Loading health history for timeFilter:', timeFilter);
      setLoading(true);
      const response = await healthService.getHealthCheckins({
        timeframe: timeFilter,
        limit: 50,
        sort: sortBy
      });
      console.log('Health service response:', response);
      
      // Extract checkins array from response.data.checkins
      const checkins = response.data?.checkins || [];
      console.log('Extracted checkins:', checkins);
      console.log('Checkins is array:', Array.isArray(checkins));
      console.log('Checkins length:', checkins.length);
      
      // Validate each checkin object
      const validCheckins = checkins.filter(checkin => {
        const isValid = checkin && checkin.id;
        if (!isValid) {
          console.warn('Invalid checkin found:', checkin);
        }
        return isValid;
      });
      
      console.log('Valid checkins:', validCheckins.length);
      setCheckins(Array.isArray(validCheckins) ? validCheckins : []);
    } catch (error) {
      console.error('Error loading health history:', error);
      Alert.alert('Error', 'Failed to load health history');
      // Set empty array on error
      setCheckins([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHealthHistory();
    setRefreshing(false);
  }, [timeFilter]);

  const getMoodIcon = (moodRating) => {
    // Convert numeric mood rating to icon
    const moodIcons = {
      1: 'emoticon-cry',      // Very sad
      2: 'emoticon-sad',      // Sad
      3: 'emoticon-neutral',  // Neutral
      4: 'emoticon-happy',    // Happy
      5: 'emoticon-excited'   // Very happy
    };
    return moodIcons[moodRating] || 'emoticon-neutral';
  };

  const getMoodColor = (moodRating) => {
    // Convert numeric mood rating to color
    const moodColors = {
      1: theme.colors.error,   // Very sad - Red
      2: theme.colors.warning,   // Sad - Orange
      3: theme.colors.info,   // Neutral - Yellow
      4: theme.colors.success,   // Happy - Light Green
      5: theme.colors.success // Very happy - Green
    };
    return moodColors[moodRating] || theme.colors.primary;
  };

  const getEnergyLevel = (energyLevel) => {
    const levels = ['Very Low', 'Low', 'Moderate', 'High', 'Very High'];
    return levels[energyLevel - 1] || 'Unknown';
  };

  const formatSymptoms = (symptoms) => {
    if (!symptoms || symptoms.length === 0) return 'None reported';
    return symptoms.join(', ');
  };

  const formatActivities = (activities) => {
    if (!activities || activities.length === 0) return 'None reported';
    return activities.join(', ');
  };

  const getHealthScore = (checkin) => {
    // Calculate a simple health score based on mood, energy, and pain
    const moodScore = checkin.mood_rating || 3;
    const energyScore = checkin.energy_level || 3;
    const painScore = 6 - (checkin.pain_level || 3); // Invert pain (less pain = higher score)
    
    return Math.round((moodScore + energyScore + painScore) / 3 * 20); // Score out of 100
  };

  const getScoreColor = (score) => {
    if (score >= 80) return theme.colors.success;
    if (score >= 60) return theme.colors.info;
    if (score >= 40) return theme.colors.warning;
    if (score >= 20) return theme.colors.error;
    return theme.colors.error;
  };

  const FilterButton = ({ filterKey, label, count }) => {
    // Debug log to check if props are received correctly
    console.log('FilterButton props:', { filterKey, label, count, timeFilter });
    console.log('Theme colors:', { 
      onSurface: theme.colors.onSurface, 
      onPrimary: theme.colors.onPrimary,
      primary: theme.colors.primary,
      surface: theme.colors.surface
    });
    
    return (
      <TouchableOpacity
        style={[
          styles.filterButton,
          timeFilter === filterKey && styles.filterButtonActive,
        ]}
        onPress={() => {
          console.log('Filter button pressed:', filterKey);
          console.log('Current timeFilter:', timeFilter);
          try {
            setTimeFilter(filterKey);
            console.log('setTimeFilter called successfully');
          } catch (error) {
            console.error('Error in setTimeFilter:', error);
          }
        }}
        activeOpacity={0.7}
      >
        <ThemedText 
          variant="bodyLarge" 
          style={[
            styles.filterButtonText,
            timeFilter === filterKey && styles.filterButtonTextActive,
          ]}
        >
          {label}
        </ThemedText>
        {count !== null && (
          <ThemedText 
            variant="bodySmall" 
            style={[
              styles.filterButtonCount,
              timeFilter === filterKey && styles.filterButtonCountActive,
            ]}
          >
            {count}
          </ThemedText>
        )}
      </TouchableOpacity>
    );
  };

  const HealthCheckinCard = ({ checkin }) => {
    // Add safety checks for checkin object
    if (!checkin || !checkin.id) {
      console.warn('Invalid checkin object:', checkin);
      return null;
    }

    const healthScore = getHealthScore(checkin);
    const scoreColor = getScoreColor(healthScore);

    return (
      <WellnessCard 
        key={checkin.id} 
        style={styles.checkinCard}
        title={checkin.checkin_date ? new Date(checkin.checkin_date).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric'
        }) : 'Unknown Date'}
        score={healthScore}
        status={null}
        icon={getMoodIcon(checkin.mood_rating)}
        color={getMoodColor(checkin.mood_rating)}
        details={[]}
      >
        <View style={styles.checkinDetails}>
          <View style={styles.checkinRow}>
            <MaterialCommunityIcons 
              name="emoticon-happy" 
              size={20} 
              color={theme.colors.primary} 
            />
            <ThemedText variant="bodyMedium" style={styles.checkinDetailText}>
              Mood: {checkin.mood_rating || 'N/A'}/5
            </ThemedText>
          </View>
          <View style={styles.checkinRow}>
            <MaterialCommunityIcons 
              name="battery" 
              size={20} 
              color={theme.colors.primary} 
            />
            <ThemedText variant="bodyMedium" style={styles.checkinDetailText}>
              Energy: {getEnergyLevel(checkin.energy_level)}
            </ThemedText>
          </View>
          {checkin.pain_level !== undefined && checkin.pain_level !== null && (
            <View style={styles.checkinRow}>
              <MaterialCommunityIcons 
                name="alert-circle" 
                size={20} 
                color={theme.colors.primary} 
              />
              <ThemedText variant="bodyMedium" style={styles.checkinDetailText}>
                Pain: {checkin.pain_level}/5
              </ThemedText>
            </View>
          )}
          {checkin.notes && checkin.notes.trim() && (
            <View style={styles.checkinRow}>
              <MaterialCommunityIcons 
                name="note-text" 
                size={20} 
                color={theme.colors.primary} 
              />
              <ThemedText variant="bodyMedium" style={styles.checkinDetailText}>
                {checkin.notes}
              </ThemedText>
            </View>
          )}
        </View>
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
            metric="Total"
            value={Array.isArray(checkins) ? checkins.length.toString() : '0'}
            unit="check-ins"
            color={theme.colors.primary}
            icon="chart-line"
            style={styles.statCard}
          />
          <HealthMetricCard
            metric="This Week"
            value={Array.isArray(checkins) ? checkins.filter(c => 
              new Date(c.checkin_date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            ).length.toString() : '0'}
            unit="check-ins"
            color={theme.colors.secondary}
            icon="calendar-week"
            style={styles.statCard}
          />
          <HealthMetricCard
            metric="Avg Score"
            value={Array.isArray(checkins) && checkins.length > 0 ? 
              Math.round(checkins.reduce((acc, c) => acc + getHealthScore(c), 0) / checkins.length).toString() : '0'}
            unit="/ 100"
            color={theme.colors.accent}
            icon="heart"
            style={styles.statCard}
          />
        </View>

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <ThemedHeading variant="headlineMedium" style={styles.filterTitle}>
            Time Period
          </ThemedHeading>
          <View style={styles.filterButtons}>
            <FilterButton filterKey="week" label="Week" count={null} />
            <FilterButton filterKey="month" label="Month" count={null} />
            <FilterButton filterKey="year" label="Year" count={null} />
          </View>
        </View>
        {/* Health Check-ins List */}
        <View style={styles.checkinsSection}>
          <ThemedHeading variant="headlineMedium" style={styles.sectionTitle}>
            Health Check-ins
          </ThemedHeading>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <MaterialCommunityIcons 
                name="loading" 
                size={48} 
                color={theme.colors.primary} 
              />
              <ThemedText variant="bodyLarge" style={styles.loadingText}>
                Loading health history...
              </ThemedText>
            </View>
          ) : !Array.isArray(checkins) || checkins.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="chart-line" 
                size={64} 
                color={theme.colors.primary} 
                style={styles.emptyIcon}
              />
              <ThemedHeading variant="headlineMedium" style={styles.emptyTitle}>
                No Health Check-ins Yet
              </ThemedHeading>
              <ThemedText variant="bodyLarge" style={styles.emptyMessage}>
                Start tracking your health by completing your first check-in.
              </ThemedText>
            </View>
          ) : (
            Array.isArray(checkins) && checkins.length > 0 ? (
              checkins
                .filter(checkin => checkin && checkin.id) // Filter out invalid checkins
                .map((checkin) => (
                  <HealthCheckinCard key={checkin.id} checkin={checkin} />
                ))
            ) : (
              <View style={styles.noCheckinsContainer}>
                <ThemedText variant="bodyLarge" style={styles.noCheckinsText}>
                  No health check-ins found for this period.
                </ThemedText>
              </View>
            )
          )}
        </View>

        {/* Add New Check-in Button */}
        <View style={styles.addButtonContainer}>
          <CustomButton
            mode="contained"
            onPress={() => {
              if (!navigation || typeof navigation.navigate !== 'function') {
                Alert.alert('Navigation Error', 'Navigation is not available.');
                return;
              }
              navigation.navigate('HealthCheckin');
            }}
            style={styles.addButton}
            icon="plus"
          >
            Add
          </CustomButton>
        </View>

        {/* Extra spacing for better scrolling */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default HealthHistoryScreen;

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
  
  // Filter Section
  filterSection: {
    marginBottom: theme.spacing.lg,
  },
  filterTitle: {
    marginBottom: theme.spacing.md,
    color: theme.colors.primary,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  filterButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 44,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    fontSize: theme.typography.bodyLarge.fontSize,
  },
  filterButtonTextActive: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.typography.bodyLarge.fontSize,
  },
  filterButtonCount: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  filterButtonCountActive: {
    color: theme.colors.onPrimary,
  },
  
  // Check-ins Section
  checkinsSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
    color: theme.colors.primary,
  },
  checkinCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  checkinDetails: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  checkinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  checkinDetailText: {
    color: theme.colors.onSurface,
    flex: 1,
  },
  
  // Loading & Empty States
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  loadingText: {
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyIcon: {
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    color: theme.colors.primary,
  },
  emptyMessage: {
    textAlign: 'center',
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.lg,
  },
  noCheckinsContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  noCheckinsText: {
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  
  // Add Button
  addButtonContainer: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  addButton: {
    minWidth: 200,
    borderRadius: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
});
