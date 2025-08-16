import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText, ThemedHeading } from '../../components/common/ThemedText';
import { CustomButton } from '../../components/common/CustomButton';
import { WellnessCard } from '../../components/common/CustomCards';
import { useTheme } from '../../context/ThemeContext';
import { GestureHandlerRootView, ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import { FAB } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [selectedFeature, setSelectedFeature] = useState(null);
  useEffect(() => {
    const userType = route?.params?.userType || 'elderly';
    const fromRegistration = route?.params?.fromRegistration || false;
    // Restrict WelcomeScreen access: only allow if fromRegistration is true
    if (!fromRegistration) {
      navigation.reset({
        index: 0,
        routes: [
          { name: 'MainTabs', params: { userType, screen: userType === 'elderly' ? 'Home' : 'Dashboard' } }
        ]
      });
      return;
    }
    // If fromRegistration, auto-redirect after delay
    if (fromRegistration === true && route?.params?.userType) {
      const timeout = setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [
            { name: 'MainTabs', params: { userType, screen: userType === 'elderly' ? 'Home' : 'Dashboard' } }
          ]
        });
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [route?.params?.userType, route?.params?.fromRegistration, navigation]);

  // Check if user came from registration
  const fromRegistration = route?.params?.fromRegistration || false;

  const appFeatures = [
    {
      id: 1,
      icon: 'pill',
      title: 'Smart Medication Management',
      description: 'Never miss a dose with intelligent reminders',
      details: 'Set personalized medication schedules, receive timely alerts, track adherence, and get refill reminders. Our smart system learns your routine and adjusts notifications accordingly.',
      color: '#007BFF',
      benefits: ['Automated reminders', 'Dosage tracking', 'Refill alerts', 'History logs'],
      image: require('../../../assets/medication.png'),
    },
    {
      id: 2,
      icon: 'heart-pulse',
      title: 'Comprehensive Health Tracking',
      description: 'Monitor your wellness journey every day',
      details: 'Daily health check-ins, mood tracking, symptom monitoring, and vital signs logging. Generate comprehensive reports to share with your healthcare providers.',
      color: '#007BFF',
      benefits: ['Daily check-ins', 'Mood tracking', 'Symptom logs', 'Health reports'],
      image: require('../../../assets/health-tracking.png'),
    },
    {
      id: 3,
      icon: 'brain',
      title: 'Cognitive Brain Training',
      description: 'Keep your mind sharp and engaged',
      details: 'Scientifically-designed games and exercises to improve memory, attention, and cognitive function. Track your progress and celebrate achievements.',
      color: '#007BFF',
      benefits: ['Memory games', 'Attention exercises', 'Progress tracking', 'Achievements'],
      image: require('../../../assets/brain-training.png'),
    },
    {
      id: 4,
      icon: 'phone-alert',
      title: 'Emergency Safety System',
      description: 'Instant help when you need it most',
      details: 'Quick emergency contacts, location sharing, medical information storage, and one-touch emergency calls. Your safety is our priority.',
      color: '#007BFF',
      benefits: ['Emergency contacts', 'Location sharing', 'Medical info', 'Quick calls'],
      image: require('../../../assets/emergency.png'),
    },
    {
      id: 5,
      icon: 'microphone',
      title: 'Intelligent Voice Assistant',
      description: 'Your personal digital companion',
      details: 'Voice-activated assistance for medication reminders, health questions, emergency calls, and daily tasks. Simply speak naturally to get help.',
      color: '#007BFF',
      benefits: ['Voice commands', 'Natural language', 'Task assistance', 'Hands-free operation'],
      image: require('../../../assets/voice-assistant.png'),
    },
    {
      id: 6,
      icon: 'account-group',
      title: 'Family Care Network',
      description: 'Stay connected with loved ones',
      details: 'Secure family dashboard for caregivers, health data sharing, activity monitoring, and peace of mind for everyone who cares about you.',
      color: '#007BFF',
      benefits: ['Family dashboard', 'Health sharing', 'Activity monitoring', 'Peace of mind'],
      image: require('../../../assets/family-care.png'),
    },
  ];

  const handleGetStarted = () => {
    navigation.navigate('Register');
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  const handleLetsStart = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleFabGetStarted = () => {
    // Determine user type and navigate accordingly
    const userType = route?.params?.userType || 'elderly';
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { userType } }],
    });
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons 
                name={fromRegistration ? "check-circle" : "heart-plus"} 
                size={48} 
                color="#ffffff" 
              />
            </View>
          </View>
          <ThemedHeading level={1} style={styles.appTitle}>
            EDCSM
          </ThemedHeading>
          <ThemedHeading level={2} style={styles.appSubtitle}>
            {fromRegistration 
              ? 'Welcome to Your Health Companion!' 
              : 'Elderly Digital Care & Safety Management'
            }
          </ThemedHeading>
          <View style={styles.taglineContainer}>
            <ThemedText variant="bodyLarge" style={styles.tagline}>
              {fromRegistration
                ? 'Congratulations! You\'re now part of a community dedicated to healthy aging and independence. Let\'s explore what EDCSM can do for you.'
                : 'Your trusted digital companion for health, safety, and independence'
              }
            </ThemedText>
          </View>
        </View>

        {/* Key Benefits Section */}
        <WellnessCard style={styles.benefitsCard}>
          <ThemedHeading level={3} style={styles.sectionTitle}>
            Why Choose EDCSM?
          </ThemedHeading>
          <View style={styles.benefitsGrid}>
            <View style={styles.benefitHighlight}>
              <MaterialCommunityIcons name="shield-check" size={24} color="#4CAF50" />
              <ThemedText variant="bodyMedium" style={styles.benefitHighlightText}>
                Designed specifically for elderly users with large, clear interfaces
              </ThemedText>
            </View>
            <View style={styles.benefitHighlight}>
              <MaterialCommunityIcons name="heart" size={24} color="#E91E63" />
              <ThemedText variant="bodyMedium" style={styles.benefitHighlightText}>
                Comprehensive health and safety management in one app
              </ThemedText>
            </View>
            <View style={styles.benefitHighlight}>
              <MaterialCommunityIcons name="account-group" size={24} color="#007BFF" />
              <ThemedText variant="bodyMedium" style={styles.benefitHighlightText}>
                Connect with family and caregivers for added peace of mind
              </ThemedText>
            </View>
          </View>
        </WellnessCard>

        {/* Features Section - Vertical List */}
        <View style={styles.featuresSection}>
          <ThemedHeading level={3} style={[styles.sectionTitle, { color: '#007BFF' }]}>Comprehensive Care Features</ThemedHeading>
          <ThemedText variant="bodyMedium" color="secondary" style={styles.sectionSubtitle}>
            Explore each feature in detail below
          </ThemedText>
          {appFeatures.map((feature) => (
            <View key={feature.id} style={styles.featureSlide}>
              <ImageBackground 
                source={feature.image} 
                style={styles.featureBackground}
                resizeMode="cover"
              >
                <ScrollView style={styles.featureOverlay} contentContainerStyle={styles.featureOverlayContent}>
                  <ThemedHeading level={2} style={[styles.featureTitle, { color: theme.colors.background }]}> {feature.title} </ThemedHeading>
                  <ThemedText variant="bodyLarge" style={[styles.featureDescription, { color: theme.colors.background }]}> {feature.description} </ThemedText>
                  <ThemedText variant="bodyMedium" style={[styles.featureDetails, { color: theme.colors.background }]}> {feature.details} </ThemedText>
                  <View style={styles.benefitsList}>
                    {feature.benefits.map((benefit, index) => (
                      <View key={index} style={styles.benefitItem}>
                        <MaterialCommunityIcons name="check-circle" size={20} color="#007BFF" />
                        <ThemedText variant="bodySmall" style={[styles.benefitText, { color: theme.colors.background }]}> {benefit} </ThemedText>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </ImageBackground>
            </View>
          ))}
        </View>

        {/* Call to Action Section
        <WellnessCard style={styles.ctaCard}>
          <ThemedHeading level={3} style={styles.ctaTitle}>
            {fromRegistration ? 'Welcome to EDCSM!' : 'Ready to Get Started?'}
          </ThemedHeading>
          <ThemedText variant="bodyLarge" style={styles.ctaDescription}>
            {fromRegistration 
              ? 'Your account has been created successfully! You now have access to all features. Let\'s start your health and wellness journey together.'
              : 'Join thousands of users who trust EDCSM for their daily health and safety needs'
            }
          </ThemedText>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedHeading level={4} style={styles.statNumber}>10K+</ThemedHeading>
              <ThemedText variant="bodySmall" color="secondary">Active Users</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedHeading level={4} style={styles.statNumber}>99.9%</ThemedHeading>
              <ThemedText variant="bodySmall" color="secondary">Uptime</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedHeading level={4} style={styles.statNumber}>24/7</ThemedHeading>
              <ThemedText variant="bodySmall" color="secondary">Support</ThemedText>
            </View>
          </View>
        </WellnessCard> */}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <CustomButton
            mode="contained"
            onPress={handleFabGetStarted}
            style={styles.primaryButton}
            textColor="#ffffff"
            icon="arrow-right"
          >
            Get Started
          </CustomButton>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText variant="bodySmall" color="secondary" style={styles.versionText}>
            Version 1.0.0 • Made with ❤️ for Elderly Care
          </ThemedText>
        </View>
        {/* FAB Get Started Button */}
        {fromRegistration && (
          <FAB
            style={styles.fab}
            label="Get Started"
            icon="arrow-right"
            color="#fff"
            onPress={handleFabGetStarted}
          />
        )}
      </ScrollView>
    </GestureHandlerRootView>
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
    paddingBottom: theme.spacing.xxl,
  },
  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: `${theme.colors.primary}15`,
  },
  logoContainer: {
    marginBottom: theme.spacing.lg,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: 18,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  taglineContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tagline: {
    textAlign: 'center',
    lineHeight: 24,
    color: theme.colors.text.primary,
  },
  // Benefits Section
  benefitsCard: {
    margin: theme.spacing.lg,
  },
  benefitsGrid: {
    gap: theme.spacing.md,
  },
  benefitHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  benefitHighlightText: {
    marginLeft: theme.spacing.md,
    flex: 1,
    lineHeight: 22,
  },
  // Features Section
  featuresSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    color: theme.colors.primary,
  },
  sectionSubtitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  featureScrollView: {
    height: height * 0.6, // 60% of screen height
  },
  featureSlide: {
    width: '100%',
    minHeight: 180,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.spacing.md,
    elevation: 4,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  featureBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.spacing.md,
    overflow: 'hidden',
  },
  featureOverlay: {
    flex: 1,
    width: '100%',
    padding: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: theme.spacing.md,
  },
  featureOverlayContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: theme.spacing.md,
  },
  featureTitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontSize: 24,
  },
  featureDescription: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    lineHeight: 24,
  },
  featureDetails: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  benefitsList: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.spacing.sm,
  },
  benefitText: {
    marginLeft: theme.spacing.sm,
  },
  // CTA Section
  ctaCard: {
    margin: theme.spacing.lg,
    alignItems: 'center',
  },
  ctaTitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    color: theme.colors.primary,
  },
  ctaDescription: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  // Actions
  actionsContainer: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.md,
    minHeight: 56,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryButton: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    borderRadius: theme.spacing.md,
    minHeight: 56,
  },
  registrationWelcomeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: '#4CAF5015',
    borderRadius: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#4CAF5030',
  },
  checkIcon: {
    marginRight: theme.spacing.sm,
  },
  welcomeNoteText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  versionText: {
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 32,
    paddingHorizontal: 24,
    elevation: 6,
    zIndex: 10,
  },
});

export default WelcomeScreen;