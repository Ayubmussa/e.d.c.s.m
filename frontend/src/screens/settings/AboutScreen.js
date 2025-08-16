import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { shadows } from '../../utils/shadows';

const AboutScreen = ({ navigation }) => {
  const appVersion = '1.0.0';
  const buildNumber = '100';

  const handleOpenLink = (url) => {
    Linking.openURL(url).catch(() => {
      console.error('Failed to open URL:', url);
    });
  };

  const featuresList = [
    {
      icon: 'pill',
      title: 'Medication Management',
      description: 'Track medications, set reminders, and manage dosages',
    },
    {
      icon: 'heart-pulse',
      title: 'Health Monitoring',
      description: 'Log daily health check-ins and track wellness trends',
    },
    {
      icon: 'shield-alert',
      title: 'Emergency Features',
      description: 'Quick access to emergency contacts and location sharing',
    },
    {
      icon: 'brain',
      title: 'Brain Training',
      description: 'Cognitive exercises and memory games for mental fitness',
    },
    {
      icon: 'microphone',
      title: 'Voice Assistant',
      description: 'Voice-controlled features for easy interaction',
    },
    {
      icon: 'bell',
      title: 'Smart Notifications',
      description: 'Customizable reminders and alerts for daily activities',
    },
  ];

  const teamMembers = [
    {
      name: 'Development Team',
      role: 'App Development & Design',
      icon: 'code-braces',
    },
    {
      name: 'Healthcare Advisors',
      role: 'Medical Consultation & Guidance',
      icon: 'stethoscope',
    },
    {
      name: 'UX Researchers',
      role: 'User Experience & Accessibility',
      icon: 'account-group',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About</Text>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <View style={styles.appInfoCard}>
            <View style={styles.appIconContainer}>
              <MaterialCommunityIcons
                name="heart-plus"
                size={60}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.appName}>Elderly Companion</Text>
            <Text style={styles.appTagline}>Your Digital Health & Wellness Partner</Text>
            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>Version {appVersion}</Text>
              <Text style={styles.buildText}>Build {buildNumber}</Text>
            </View>
          </View>
        </View>

        {/* Mission Statement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <View style={styles.missionCard}>
            <Text style={styles.missionText}>
              We are dedicated to empowering elderly individuals with technology that enhances 
              their independence, health management, and overall quality of life. Our app provides 
              easy-to-use tools for medication tracking, health monitoring, emergency assistance, 
              and cognitive wellness.
            </Text>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featuresContainer}>
            {featuresList.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <MaterialCommunityIcons
                    name={feature.icon}
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Team Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Team</Text>
          <View style={styles.teamContainer}>
            {teamMembers.map((member, index) => (
              <View key={index} style={styles.teamCard}>
                <MaterialCommunityIcons
                  name={member.icon}
                  size={32}
                  color={theme.colors.primary}
                />
                <View style={styles.teamInfo}>
                  <Text style={styles.teamName}>{member.name}</Text>
                  <Text style={styles.teamRole}>{member.role}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Contact & Links Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          <View style={styles.contactContainer}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleOpenLink('mailto:support@edcsm.com')}
            >
              <MaterialCommunityIcons
                name="email"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.contactButtonText}>Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleOpenLink('https://www.edcsm.com/privacy')}
            >
              <MaterialCommunityIcons
                name="shield-check"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.contactButtonText}>Privacy Policy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleOpenLink('https://www.edcsm.com/terms')}
            >
              <MaterialCommunityIcons
                name="file-document"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.contactButtonText}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Acknowledgments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acknowledgments</Text>
          <View style={styles.acknowledgementsCard}>
            <Text style={styles.acknowledgementsText}>
              We thank all the healthcare professionals, elderly care specialists, and 
              beta testers who contributed their expertise and feedback to make this app 
              more effective and user-friendly.
            </Text>
            
            <View style={styles.poweredByContainer}>
              <Text style={styles.poweredByText}>Powered by React Native & Expo</Text>
              <View style={styles.techStack}>
                <MaterialCommunityIcons
                  name="react"
                  size={16}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.techText}>React Native</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Copyright */}
        <View style={styles.copyrightSection}>
          <Text style={styles.copyrightText}>
            © 2025 Elderly Companion. All rights reserved.
          </Text>
          <Text style={styles.copyrightSubText}>
            Made with ❤️ for the elderly community
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
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    fontSize: theme.typography.h6.fontSize,
    fontWeight: theme.typography.h6.fontWeight,
    color: theme.colors.text,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.h6.fontSize,
    fontWeight: theme.typography.h6.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  appInfoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...shadows.card,
  },
  appIconContainer: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 50,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  appName: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  appTagline: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  versionText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.primary,
    fontWeight: theme.typography.caption.fontWeight,
  },
  buildText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  missionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.lg,
    ...shadows.small,
  },
  missionText: {
    fontSize: theme.typography.body1.fontSize,
    lineHeight: theme.typography.body1.lineHeight,
    color: theme.colors.text,
    textAlign: 'justify',
  },
  featuresContainer: {
    gap: theme.spacing.md,
  },
  featureCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.small,
  },
  featureIconContainer: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 25,
    padding: theme.spacing.md,
    marginRight: theme.spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: theme.typography.body1.fontSize,
    fontWeight: theme.typography.body1.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  featureDescription: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.caption.lineHeight,
  },
  teamContainer: {
    gap: theme.spacing.md,
  },
  teamCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.small,
  },
  teamInfo: {
    marginLeft: 15,
    flex: 1,
  },
  teamName: {
    fontSize: theme.typography.body1.fontSize,
    fontWeight: theme.typography.body1.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.xxs,
  },
  teamRole: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  contactContainer: {
    gap: 12,
  },
  contactButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.small,
  },
  contactButtonText: {
    fontSize: theme.typography.body1.fontSize,
    fontWeight: theme.typography.body1.fontWeight,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  acknowledgementsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.lg,
    ...shadows.small,
  },
  acknowledgementsText: {
    fontSize: theme.typography.body1.fontSize,
    lineHeight: theme.typography.body1.lineHeight,
    color: theme.colors.text,
    textAlign: 'justify',
    marginBottom: theme.spacing.lg,
  },
  poweredByContainer: {
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  poweredByText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  techStack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  techText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  copyrightSection: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  copyrightText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xxs,
  },
  copyrightSubText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default AboutScreen;
