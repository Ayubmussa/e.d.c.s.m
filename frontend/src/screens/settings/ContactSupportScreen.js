import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Linking,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { shadows } from '../../utils/shadows';

const ContactSupportScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const supportEmail = 'support@edcsm.com';
  const supportPhone = '+1 (555) 123-4567';

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEmailSupport = () => {
    const { name, email, subject, message } = formData;
    
    if (!name || !email || !subject || !message) {
      Alert.alert('Error', 'Please fill in all fields before sending.');
      return;
    }

    const emailSubject = encodeURIComponent(`Support Request: ${subject}`);
    const emailBody = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    );
    
    const mailtoUrl = `mailto:${supportEmail}?subject=${emailSubject}&body=${emailBody}`;
    
    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert(
        'Email App Not Available',
        `Please send an email manually to: ${supportEmail}`
      );
    });
  };

  const handlePhoneSupport = () => {
    const phoneUrl = Platform.OS === 'ios' ? `tel:${supportPhone}` : `tel:${supportPhone}`;
    
    Linking.openURL(phoneUrl).catch(() => {
      Alert.alert(
        'Phone App Not Available',
        `Please call manually: ${supportPhone}`
      );
    });
  };

  const handleClearForm = () => {
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: '',
    });
  };

  const quickActions = [
    {
      title: 'Call Support',
      icon: 'phone',
      color: theme.colors.primary,
      action: handlePhoneSupport,
    },
    {
      title: 'Email Support',
      icon: 'email',
      color: theme.dark ? '#fff' : '#222',
      action: () => {
        const mailtoUrl = `mailto:${supportEmail}`;
        Linking.openURL(mailtoUrl);
      },
    },
    {
      title: 'FAQ',
      icon: 'help-circle',
      color: theme.dark ? '#fff' : '#222',
      action: () => {
        Alert.alert(
          'FAQ',
          'Frequently Asked Questions:\n\n• How do I add medications?\n• How do I set up emergency contacts?\n• How do I use brain training games?\n\nFor detailed help, please contact support.'
        );
      },
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
          <Text style={styles.headerTitle}>Contact Support</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickActionCard, { borderLeftColor: action.color }]}
                onPress={action.action}
              >
                <MaterialCommunityIcons
                  name={action.icon}
                  size={24}
                  color={action.color}
                />
                <Text style={styles.quickActionText}>{action.title}</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send us a message</Text>
          
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Enter your full name"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="Enter your email"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                style={styles.input}
                value={formData.subject}
                onChangeText={(value) => handleInputChange('subject', value)}
                placeholder="Brief description of your issue"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={[styles.input, styles.messageInput]}
                value={formData.message}
                onChangeText={(value) => handleInputChange('message', value)}
                placeholder="Describe your issue or question in detail..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearForm}
              >
                <Text style={styles.clearButtonText}>Clear Form</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleEmailSupport}
              >
                <MaterialCommunityIcons
                  name="send"
                  size={20}
                  color="white"
                  style={styles.sendIcon}
                />
                <Text style={styles.sendButtonText}>Send Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Support Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="email"
                size={20}
                color={theme.colors.primary}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{supportEmail}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="phone"
                size={20}
                color={theme.colors.primary}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{supportPhone}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="clock"
                size={20}
                color={theme.colors.primary}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Support Hours</Text>
                <Text style={styles.infoValue}>Mon-Fri 9AM-6PM EST</Text>
              </View>
            </View>
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
    marginRight: theme.spacing.md,
    padding: theme.spacing.xs,
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
  quickActionsContainer: {
    gap: theme.spacing.md,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    ...shadows.card,
  },
  quickActionText: {
    flex: 1,
    fontSize: theme.typography.body1.fontSize,
    fontWeight: theme.typography.body1.fontWeight,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
  formContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.lg,
    ...shadows.card,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: theme.typography.body1.fontSize,
    fontWeight: theme.typography.body1.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  messageInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  clearButton: {
    flex: 1,
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: theme.typography.button.fontSize,
    fontWeight: theme.typography.button.fontWeight,
    color: theme.colors.text,
  },
  sendButton: {
    flex: 2,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    marginRight: theme.spacing.sm,
  },
  sendButtonText: {
    fontSize: theme.typography.button.fontSize,
    fontWeight: theme.typography.button.fontWeight,
    color: theme.colors.textOnPrimary,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.lg,
    ...shadows.card,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoContent: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  infoLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xxs,
  },
  infoValue: {
    fontSize: theme.typography.body1.fontSize,
    fontWeight: theme.typography.body1.fontWeight,
    color: theme.colors.text,
  },
});

export default ContactSupportScreen;
