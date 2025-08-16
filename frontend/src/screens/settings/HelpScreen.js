import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const HelpScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const faqData = [
    {
      id: 1,
      question: 'How do I add a new medication?',
      answer: 'To add a new medication, go to the Medications tab and tap the "+" button. Fill in the medication details including name, dosage, and schedule.',
      category: 'medications'
    },
    {
      id: 2,
      question: 'How do I set up emergency contacts?',
      answer: 'Go to the Emergency tab, then tap "Emergency Contacts". You can add multiple contacts and set one as primary for emergency situations.',
      category: 'emergency'
    },
    {
      id: 3,
      question: 'Can I share my health data with my doctor?',
      answer: 'Yes! Go to Settings > Data & Privacy and enable "Share Health Data". You can then export your data or share it directly with healthcare providers.',
      category: 'health'
    },
    {
      id: 4,
      question: 'How do I change my notification settings?',
      answer: 'Go to Settings > Notifications to customize when and how you receive medication reminders and health alerts.',
      category: 'settings'
    },
    {
      id: 5,
      question: 'What should I do if I miss a medication dose?',
      answer: 'If you miss a dose, take it as soon as you remember unless it\'s close to your next scheduled dose. Never double up on doses. Consult your doctor for specific guidance.',
      category: 'medications'
    },
    {
      id: 6,
      question: 'How do I use the voice assistant?',
      answer: 'Access the voice assistant from the main menu or by tapping the microphone icon. You can ask about medications, health check-ins, or emergency assistance.',
      category: 'voice'
    },
    {
      id: 7,
      question: 'How do brain training games help?',
      answer: 'Brain training games help improve cognitive function, memory, and attention. Regular practice can help maintain mental sharpness and may slow cognitive decline.',
      category: 'brain'
    },
    {
      id: 8,
      question: 'Is my data secure?',
      answer: 'Yes, all your data is encrypted and stored securely. We follow strict privacy standards and never share your personal information without your consent.',
      category: 'privacy'
    }
  ];

  const quickActions = [
    {
      title: 'Getting Started Guide',
      description: 'Learn the basics of using the app',
      icon: 'rocket-launch',
      action: () => console.log('Getting Started')
    },
    {
      title: 'Video Tutorials',
      description: 'Watch step-by-step tutorials',
      icon: 'play-circle',
      action: () => console.log('Video Tutorials')
    },
    {
      title: 'Contact Support',
      description: 'Get help from our support team',
      icon: 'headset',
      action: () => {
        if (!navigation || typeof navigation.navigate !== 'function') {
          Alert.alert('Navigation Error', 'Navigation is not available.');
          return;
        }
        navigation.navigate('ContactSupport');
      }
    },
    {
      title: 'Accessibility Features',
      description: 'Learn about accessibility options',
      icon: 'human-handsup',
      action: () => console.log('Accessibility')
    }
  ];

  const filteredFAQs = faqData.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const renderQuickAction = (action, index) => (
    <TouchableOpacity
      key={index}
      style={styles.quickActionCard}
      onPress={action.action}
    >
      <View style={styles.quickActionIcon}>
        <MaterialCommunityIcons 
          name={action.icon} 
          size={32} 
          color={theme.colors.primary} 
        />
      </View>
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{action.title}</Text>
        <Text style={styles.quickActionDescription}>{action.description}</Text>
      </View>
      <MaterialCommunityIcons 
        name="chevron-right" 
        size={20} 
        color={theme.colors.text.secondary} 
      />
    </TouchableOpacity>
  );

  const renderFAQItem = (faq) => (
    <View key={faq.id} style={styles.faqItem}>
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={() => toggleFAQ(faq.id)}
      >
        <Text style={styles.faqQuestion}>{faq.question}</Text>
        <MaterialCommunityIcons 
          name={expandedFAQ === faq.id ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={theme.colors.text.secondary} 
        />
      </TouchableOpacity>
      {expandedFAQ === faq.id && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{faq.answer}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color={theme.colors.textOnPrimary} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <MaterialCommunityIcons 
            name="help-circle" 
            size={60} 
            color={theme.colors.primary} 
          />
          <Text style={styles.welcomeTitle}>How can we help you?</Text>
          <Text style={styles.welcomeText}>
            Find answers to common questions or get in touch with our support team.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons 
            name="magnify" 
            size={20} 
            color={theme.colors.text.secondary} 
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help topics..."
            placeholderTextColor={theme.colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons 
                name="close-circle" 
                size={20} 
                color={theme.colors.text.secondary} 
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          {quickActions.map((action, index) => renderQuickAction(action, index))}
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map(renderFAQItem)
          ) : (
            <View style={styles.noResults}>
              <MaterialCommunityIcons 
                name="file-search" 
                size={48} 
                color={theme.colors.text.secondary} 
              />
              <Text style={styles.noResultsText}>
                No help topics found for "{searchQuery}"
              </Text>
              <Text style={styles.noResultsSubtext}>
                Try a different search term or contact support for assistance.
              </Text>
            </View>
          )}
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactText}>
            Our support team is here to help you with any questions or issues.
          </Text>
          
          <View style={styles.contactButtons}>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => {
                if (!navigation || typeof navigation.navigate !== 'function') {
                  Alert.alert('Navigation Error', 'Navigation is not available.');
                  return;
                }
                navigation.navigate('ContactSupport');
              }}
            >
              <MaterialCommunityIcons 
                name="email" 
                size={20} 
                color={theme.colors.textOnPrimary} 
              />
              <Text style={styles.contactButtonText}>Send Message</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactButtonSecondary}>
              <MaterialCommunityIcons 
                name="phone" 
                size={20} 
                color={theme.colors.primary} 
              />
              <Text style={styles.contactButtonSecondaryText}>Call Support</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.supportHours}>
            <MaterialCommunityIcons 
              name="clock" 
              size={16} 
              color={theme.colors.text.secondary} 
            />
            <Text style={styles.supportHoursText}>
              Support Hours: Monday - Friday, 9 AM - 6 PM EST
            </Text>
          </View>
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
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  welcomeTitle: {
    fontSize: theme.typography.h5.fontSize,
    fontFamily: theme.typography.h5.fontFamily,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.body1.lineHeight,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
  },
  quickActionCard: {
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.md,
  },
  quickActionIcon: {
    marginRight: theme.spacing.lg,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xxs,
  },
  quickActionDescription: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.text.secondary,
  },
  faqItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  faqQuestion: {
    flex: 1,
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginRight: theme.spacing.md,
  },
  faqAnswer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  faqAnswerText: {
    fontSize: theme.typography.body2.fontSize,
    fontFamily: theme.typography.body2.fontFamily,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.body2.lineHeight,
    marginTop: theme.spacing.md,
  },
  noResults: {
    alignItems: 'center',
    padding: theme.spacing.xxl,
  },
  noResultsText: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  noResultsSubtext: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  contactSection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.lg,
  },
  contactTitle: {
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  contactText: {
    fontSize: theme.typography.body2.fontSize,
    fontFamily: theme.typography.body2.fontFamily,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: theme.typography.body2.lineHeight,
  },
  contactButtons: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  contactButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.roundness,
  },
  contactButtonText: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.typography.button.fontSize,
    fontFamily: theme.typography.button.fontFamily,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
  contactButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.roundness,
  },
  contactButtonSecondaryText: {
    color: theme.colors.primary,
    fontSize: theme.typography.button.fontSize,
    fontFamily: theme.typography.button.fontFamily,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
  supportHours: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportHoursText: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
});

export default HelpScreen;
