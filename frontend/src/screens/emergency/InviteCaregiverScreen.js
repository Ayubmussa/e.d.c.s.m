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

const InviteCaregiverScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [invitationData, setInvitationData] = useState({
    email: '',
    name: '',
    message: '',
    phoneNumber: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSendInvitation = async () => {
    if (!invitationData.email.trim()) {
      Alert.alert('Error', 'Please enter the caregiver\'s email address');
      return;
    }

    if (!invitationData.name.trim()) {
      Alert.alert('Error', 'Please enter the caregiver\'s name');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(invitationData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiService.post('/family/invite-caregiver', {
        email: invitationData.email.trim(),
        name: invitationData.name.trim(),
        message: invitationData.message.trim(),
        phoneNumber: invitationData.phoneNumber.trim(),
        invitedBy: user.id,
        inviterName: user?.user_metadata?.full_name || 'Unknown User'
      });

      if (response.success) {
        Alert.alert(
          'Invitation Sent',
          `Caregiver invitation has been sent to ${invitationData.email}. They will receive an email with instructions to join as your caregiver.`,
          [
            {
              text: 'Send Another',
              onPress: () => {
                setInvitationData({
                  email: '',
                  name: '',
                  message: '',
                  phoneNumber: ''
                });
              }
            },
            {
              text: 'Done',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Send invitation error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to send caregiver invitation. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickMessage = (message) => {
    setInvitationData(prev => ({ ...prev, message }));
  };

  const quickMessages = [
    'I would like you to be my caregiver to help monitor my health and safety.',
    'Please join as my caregiver so you can receive emergency alerts and help me with medication reminders.',
    'I trust you to be my caregiver and would appreciate your support in managing my daily health needs.',
    'As my family member, I would like to invite you to be my caregiver for peace of mind.'
  ];

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <MaterialCommunityIcons 
            name="account-plus" 
            size={60} 
            color={theme.colors.primary} 
          />
          <Text style={styles.title}>Invite Caregiver</Text>
          <Text style={styles.subtitle}>
            Invite a trusted person to be your caregiver and help monitor your safety
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Caregiver's Email *</Text>
            <TextInput
              style={styles.input}
              value={invitationData.email}
              onChangeText={(text) => setInvitationData(prev => ({ ...prev, email: text }))}
              placeholder="caregiver@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Caregiver's Name *</Text>
            <TextInput
              style={styles.input}
              value={invitationData.name}
              onChangeText={(text) => setInvitationData(prev => ({ ...prev, name: text }))}
              placeholder="Full name"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number (Optional)</Text>
            <TextInput
              style={styles.input}
              value={invitationData.phoneNumber}
              onChangeText={(text) => setInvitationData(prev => ({ ...prev, phoneNumber: text }))}
              placeholder="+1 (555) 123-4567"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Personal Message (Optional)</Text>
            <TextInput
              style={[styles.input, styles.messageInput]}
              value={invitationData.message}
              onChangeText={(text) => setInvitationData(prev => ({ ...prev, message: text }))}
              placeholder="Add a personal message to your invitation..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.quickMessagesSection}>
            <Text style={styles.quickMessagesTitle}>Quick Message Templates:</Text>
            {quickMessages.map((message, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickMessageButton}
                onPress={() => handleQuickMessage(message)}
              >
                <Text style={styles.quickMessageText}>
                  {message.substring(0, 60)}...
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <MaterialCommunityIcons 
                name="information" 
                size={20} 
                color={theme.colors.primary} 
              />
              <Text style={styles.infoTitle}>What caregivers can do:</Text>
            </View>
            <View style={styles.permissionsList}>
              <View style={styles.permissionItem}>
                <MaterialCommunityIcons 
                  name="heart-pulse" 
                  size={16} 
                  color={theme.colors.success} 
                />
                <Text style={styles.permissionText}>Monitor your health status and vital signs</Text>
              </View>
              <View style={styles.permissionItem}>
                <MaterialCommunityIcons 
                  name="map-marker" 
                  size={16} 
                  color={theme.colors.success} 
                />
                <Text style={styles.permissionText}>Track your location and safety zones</Text>
              </View>
              <View style={styles.permissionItem}>
                <MaterialCommunityIcons 
                  name="pill" 
                  size={16} 
                  color={theme.colors.success} 
                />
                <Text style={styles.permissionText}>Help manage medication schedules</Text>
              </View>
              <View style={styles.permissionItem}>
                <MaterialCommunityIcons 
                  name="alert" 
                  size={16} 
                  color={theme.colors.success} 
                />
                <Text style={styles.permissionText}>Receive emergency alerts about you</Text>
              </View>
              <View style={styles.permissionItem}>
                <MaterialCommunityIcons 
                  name="phone" 
                  size={16} 
                  color={theme.colors.success} 
                />
                <Text style={styles.permissionText}>Contact emergency services if needed</Text>
              </View>
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
            onPress={handleSendInvitation}
            disabled={isLoading}
          >
            <MaterialCommunityIcons 
              name={isLoading ? "loading" : "send"} 
              size={20} 
              color={theme.colors.textOnPrimary} 
              style={{ marginRight: 8 }}
            />
            <Text style={styles.sendButtonText}>
              {isLoading ? 'Sending...' : 'Send Invitation'}
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
    lineHeight: 22,
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
    height: 100,
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
  infoSection: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: theme.typography.subtitle.fontSize,
    fontWeight: theme.typography.subtitle.fontWeight,
    color: theme.colors.text,
    marginLeft: 8,
  },
  permissionsList: {
    gap: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    marginLeft: 12,
    flex: 1,
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
    backgroundColor: theme.colors.primary,
  },
  sendButtonText: {
    fontSize: theme.typography.button.fontSize,
    color: theme.colors.textOnPrimary,
    fontWeight: 'bold',
  },
});

export default InviteCaregiverScreen;