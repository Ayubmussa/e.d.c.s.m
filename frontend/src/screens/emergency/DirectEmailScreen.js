import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { theme } from '../../theme';
import apiService from '../../services/apiService';

const DirectEmailScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [emailData, setEmailData] = useState({
    to: '',
    subject: 'Emergency Alert',
    message: '',
    priority: 'high'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSendEmail = async () => {
    if (!emailData.to.trim()) {
      Alert.alert('Error', 'Please enter recipient email address');
      return;
    }

    if (!emailData.message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiService.post('/emergency/send-email', {
        to: emailData.to,
        subject: emailData.subject,
        message: emailData.message,
        priority: emailData.priority,
        senderName: user?.user_metadata?.full_name || 'Emergency Contact'
      });

      if (response.success) {
        Alert.alert(
          'Email Sent',
          'Emergency email has been sent successfully',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Send email error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to send emergency email. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickMessage = (message) => {
    setEmailData(prev => ({ ...prev, message }));
  };

  const quickMessages = [
    'I need immediate assistance. Please contact me as soon as possible.',
    'This is an emergency. I require help at my current location.',
    'Please call emergency services and contact my family members.',
    'I am experiencing a medical emergency and need immediate help.'
  ];

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <MaterialCommunityIcons 
            name="email-alert" 
            size={60} 
            color={theme.colors.error} 
          />
          <Text style={styles.title}>Emergency Email</Text>
          <Text style={styles.subtitle}>
            Send an urgent email to emergency contacts
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recipient Email *</Text>
            <TextInput
              style={styles.input}
              value={emailData.to}
              onChangeText={(text) => setEmailData(prev => ({ ...prev, to: text }))}
              placeholder="emergency@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              value={emailData.subject}
              onChangeText={(text) => setEmailData(prev => ({ ...prev, subject: text }))}
              placeholder="Emergency Alert"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message *</Text>
            <TextInput
              style={[styles.input, styles.messageInput]}
              value={emailData.message}
              onChangeText={(text) => setEmailData(prev => ({ ...prev, message: text }))}
              placeholder="Describe your emergency situation..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.quickMessagesSection}>
            <Text style={styles.quickMessagesTitle}>Quick Messages:</Text>
            {quickMessages.map((message, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickMessageButton}
                onPress={() => handleQuickMessage(message)}
              >
                <Text style={styles.quickMessageText}>
                  {message.substring(0, 50)}...
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.prioritySection}>
            <Text style={styles.label}>Priority Level</Text>
            <View style={styles.priorityButtons}>
              {['low', 'medium', 'high', 'critical'].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityButton,
                    emailData.priority === priority && styles.priorityButtonActive
                  ]}
                  onPress={() => setEmailData(prev => ({ ...prev, priority }))}
                >
                  <Text style={[
                    styles.priorityButtonText,
                    emailData.priority === priority && styles.priorityButtonTextActive
                  ]}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.sendButton]}
            onPress={handleSendEmail}
            disabled={isLoading}
          >
            <MaterialCommunityIcons 
              name={isLoading ? "loading" : "send"} 
              size={20} 
              color="white" 
              style={{ marginRight: 8 }}
            />
            <Text style={styles.sendButtonText}>
              {isLoading ? 'Sending...' : 'Send Email'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: theme.typography.title.fontSize,
    fontWeight: theme.typography.title.fontWeight,
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: theme.typography.subtitle.fontSize,
    fontWeight: theme.typography.subtitle.fontWeight,
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  messageInput: {
    height: 120,
  },
  quickMessagesSection: {
    marginBottom: 20,
  },
  quickMessagesTitle: {
    fontSize: theme.typography.subtitle.fontSize,
    fontWeight: theme.typography.subtitle.fontWeight,
    color: theme.colors.text,
    marginBottom: 12,
  },
  quickMessageButton: {
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickMessageText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  prioritySection: {
    marginBottom: 30,
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
  },
  priorityButtonText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  priorityButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    fontSize: theme.typography.button.fontSize,
    color: theme.colors.textSecondary,
  },
  sendButton: {
    backgroundColor: theme.colors.error,
  },
  sendButtonText: {
    fontSize: theme.typography.button.fontSize,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DirectEmailScreen;