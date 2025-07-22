import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ImageBackground,
  TouchableOpacity,
  Image,
} from 'react-native';
import { ThemedText, ThemedHeading, ThemedCardTitle, ThemedEmphasisText } from '../../components/common/ThemedText';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useHealth } from '../../context/HealthContext';
import { useMedication } from '../../context/MedicationContext';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { useLocalization } from '../../context/LocalizationContext';
import { UI_CONFIG } from '../../config/config';
import { WellnessCard, QuickActionCard, HealthMetricCard, NotificationCard } from '../../components/common/CustomCards';
import { CustomButton, EmergencyButton } from '../../components/common/CustomButton';
import { runAppValidation } from '../../utils/appValidator';

const HomeScreen = (props) => {
  const navigation = props.navigation || useNavigation();
  const { route, goToTab } = props;
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t, formatTime, formatDate } = useLocalization();
  const styles = createStyles(theme);
  
  // Debug logging for user data
  console.log('=== HOME SCREEN USER DATA ===');
  console.log('User object:', user);
  console.log('User profileImage:', user?.profileImage);
  console.log('User profile_image:', user?.profile_image);
  const profileImageToDisplay = user?.profile_image || user?.profileImage;
  console.log('HomeScreen: Profile image being displayed:', profileImageToDisplay);
  const { 
    todayCheckin, 
    getHealthInsights, 
    getTodayWellnessStatus,
    needsCheckinReminder,
    loadTodayCheckin,
    loading: healthLoading,
  } = useHealth();
  const { 
    upcomingReminders, 
    loadMedications,
    loading: medicationLoading,
  } = useMedication();
  const { scheduleHealthCheckinReminder } = useNotification();

  const [refreshing, setRefreshing] = useState(false);
  const [debugMode, setDebugMode] = useState(__DEV__); // Only show in development
  const userType = user?.userType || 'elderly';

  useEffect(() => {
    loadInitialData();
    
    // Debug navigation structure
    console.log('Navigation object:', navigation);
    console.log('Navigation methods:', Object.keys(navigation || {}));
    if (navigation && navigation.getParent) {
      const parent = navigation.getParent();
      console.log('Parent navigation:', parent);
      console.log('Parent navigation methods:', Object.keys(parent || {}));
    }
  }, []);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadTodayCheckin(),
        loadMedications(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleDebugValidation = async () => {
    Alert.alert(
      'App Validation',
      'This will test all navigation and API connections. Check the console for detailed results.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Run Tests', 
          onPress: async () => {
            try {
              const results = await runAppValidation();
              // Results will be shown by the validator itself
            } catch (error) {
              Alert.alert('Validation Error', `Failed to run validation: ${error.message}`);
            }
          }
        }
      ]
    );
  };



  // Use only today's wellness status
  const getWellnessStatus = () => {
    const status = getTodayWellnessStatus();
    return {
      status: status.status === 'excellent' ? 'Excellent' : 
             status.status === 'good' ? 'Good' : 
             status.status === 'needs_attention' ? 'Needs Attention' : 'Unknown',
      icon: status.icon,
      color: status.color,
      message: status.message,
    };
  };

  const handleEmergency = () => {
    Alert.alert(
      'Emergency',
      'Do you need immediate assistance?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes, Get Help', 
          style: 'destructive',
          onPress: () => {
            if (!navigation || typeof navigation.navigate !== 'function') {
              Alert.alert('Navigation Error', 'Navigation is not available.');
              return;
            }
            navigation.navigate('Emergency');
          }
        },
      ]
    );
  };

  // Elderly-friendly quick actions with larger touch targets and clearer icons
  const quickActions = [
    {
      title: t('healthCheckin') || 'Health Check-in',
      icon: 'heart-pulse',
      color: theme.colors.primary,
      onPress: () => {
        if (!navigation || typeof navigation.navigate !== 'function') {
          Alert.alert('Navigation Error', 'Navigation is not available.');
          return;
        }
        navigation.navigate('HealthCheckin');
      },
      subtitle: needsCheckinReminder() ? "Today's check-in needed" : 'Check-in complete for today',
      showBadge: needsCheckinReminder(),
    },
    {
      title: t('medications') || 'Medications',
      icon: 'pill',
      color: theme.colors.secondary,
      onPress: () => {
        if (goToTab && typeof goToTab === 'function') {
          goToTab('medications');
        } else {
          Alert.alert('Navigation Error', 'Tab navigation is not available.');
        }
      },
      subtitle: upcomingReminders.length > 0 ? `${upcomingReminders.length} upcoming` : 'All up to date',
      showBadge: upcomingReminders.length > 0,
    },
    {
      title: 'Brain Training',
      icon: 'brain',
      color: theme.colors.primary,
      onPress: () => {
        if (goToTab && typeof goToTab === 'function') {
          goToTab('brain');
        } else {
          Alert.alert('Navigation Error', 'Tab navigation is not available.');
        }
      },
      subtitle: 'Keep your mind sharp',
      showBadge: false,
    },
    {
      title: 'Voice Assistant',
      icon: 'microphone',
      color: theme.colors.primaryLight,
      onPress: () => {
        if (!navigation || typeof navigation.navigate !== 'function') {
          Alert.alert('Navigation Error', 'Navigation is not available.');
          return;
        }
        navigation.navigate('VoiceAssistant');
      },
      subtitle: 'Ask me anything',
      showBadge: false,
    },
    {
      title: 'Family Care',
      icon: 'account-group',
      color: theme.colors.secondaryLight,
      onPress: () => {
        if (goToTab && typeof goToTab === 'function') {
          goToTab('family');
        } else {
          Alert.alert('Navigation Error', 'Tab navigation is not available.');
        }
      },
      subtitle: 'Manage caregivers',
      showBadge: false,
    },
  ];

  const wellnessStatus = getWellnessStatus();

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >

        {/* Quick Actions - Larger, more accessible cards */}
        <View style={styles.section}>
          <ThemedHeading level={3} style={styles.sectionTitle}>
            Quick Actions
          </ThemedHeading>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, idx) => (
              <TouchableOpacity
                key={action.title}
                style={styles.quickActionCard}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${action.title} - ${action.subtitle}`}
                onPress={() => {
                  if (action.onPress) {
                    action.onPress();
                  }
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <View style={[styles.quickActionIconCircle, { backgroundColor: action.color + '20' }]} pointerEvents="none">
                  <MaterialCommunityIcons 
                    name={action.icon} 
                    size={32} // increased icon size
                    color={action.color} 
                  />
                  {action.showBadge && <View style={styles.quickActionBadge} />}
                </View>
                <ThemedCardTitle style={styles.quickActionTitle} pointerEvents="none">
                  {String(action.title)}
                </ThemedCardTitle>
                {action.subtitle && (
                  <ThemedText 
                    variant="bodyMedium" 
                    color="secondary" 
                    style={styles.quickActionSubtitle}
                    pointerEvents="none"
                  >
                    {String(action.subtitle)}
                  </ThemedText>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Wellness Status Card - Prominent and easy to read */}
        <View style={styles.section}>
          <ThemedHeading level={3} style={[styles.sectionTitle, { color: '#000000', fontWeight: 'bold' }]}>
            Today's Wellness
          </ThemedHeading>
          <WellnessCard
            status={wellnessStatus.status === 'excellent' ? 'Excellent' : 
                   wellnessStatus.status === 'good' ? 'Good' : 
                   'Needs Attention'}
            icon={wellnessStatus.icon}
            color={wellnessStatus.color}
            style={styles.wellnessCard}
          >
            <ThemedText variant="bodyLarge" style={[styles.wellnessMessage, { color: '#000000', fontWeight: 'bold' }]}>
              {wellnessStatus.message}
            </ThemedText>
          </WellnessCard>
        </View>

        {/* Extra spacing for emergency button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Emergency FAB - Enhanced visibility and accessibility */}
      <View style={styles.fabContainer}>
        <EmergencyButton
          onPress={handleEmergency}
          style={styles.emergencyButton}
        />
        
        {/* Debug validation button - only show in development 
        {debugMode && (
          <TouchableOpacity 
            style={[styles.debugButton, { marginTop: 16 }]}
            onPress={handleDebugValidation}
          >
            <MaterialCommunityIcons 
              name="bug-check" 
              size={20} 
              color={theme.colors.surface} 
            />
          </TouchableOpacity>
        )}*/}
      </View>
    </View>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 120, // extra space for emergency button
  },
  

  
  // Sections
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
  },
    
  // Quick Actions - Enhanced for elderly users
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
  },
  quickActionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.card,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%', // Two cards per row with some spacing
    minHeight: 120, // increased height
    borderWidth: 1,
    borderColor: theme.colors.borderColor,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    position: 'relative',
    overflow: 'visible',
  },
  quickActionIconCircle: {
    width: 60, // increased size
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  quickActionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.error,
    borderWidth: 2,
    borderColor: theme.colors.surface,
    zIndex: 2,
  },
  quickActionTitle: {
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 22,
  },
  quickActionSubtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Wellness card
  wellnessCard: {
    borderLeftWidth: 6,
    borderLeftColor: theme.colors.primary,
  },
  wellnessMessage: {
    lineHeight: 26,
    textAlign: 'center',
  },

  // Emergency FAB - Enhanced visibility
  fabContainer: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.xl,
    zIndex: 100,
    elevation: 10,
  },
  emergencyButton: {
    shadowColor: theme.colors.emergencyPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  debugButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default HomeScreen;
