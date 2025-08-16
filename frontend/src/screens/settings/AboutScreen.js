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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 15,
  },
  appInfoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    ...shadows.card,
  },
  appIconContainer: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 50,
    padding: 20,
    marginBottom: 15,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  appTagline: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 15,
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  versionText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  buildText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  missionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    ...shadows.small,
  },
  missionText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
    textAlign: 'justify',
  },
  featuresContainer: {
    gap: 12,
  },
  featureCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.small,
  },
  featureIconContainer: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 25,
    padding: 12,
    marginRight: 15,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  teamContainer: {
    gap: 12,
  },
  teamCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.small,
  },
  teamInfo: {
    marginLeft: 15,
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  teamRole: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  contactContainer: {
    gap: 12,
  },
  contactButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.small,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginLeft: 12,
  },
  acknowledgementsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    ...shadows.small,
  },
  acknowledgementsText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
    textAlign: 'justify',
    marginBottom: 20,
  },
  poweredByContainer: {
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  poweredByText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  techStack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  techText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  copyrightSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  copyrightText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  copyrightSubText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default AboutScreen;
