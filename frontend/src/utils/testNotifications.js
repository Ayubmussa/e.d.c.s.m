// Enhanced notification testing utilities for Expo SDK 53+
import { Alert, Platform } from 'react-native';
import notificationService from '../services/notificationService';
import notificationHandler from './notificationHandler';
import navigationService from './navigationService';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

export const testNotificationCapabilities = () => {
  const capabilities = notificationHandler.getCapabilities();
  
  Alert.alert(
    'Notification Capabilities',
    `Platform: ${capabilities.platform}\n` +
    `Environment: ${capabilities.environment}\n` +
    `Push Notifications: ${capabilities.pushNotifications ? 'Enabled' : 'Disabled'}\n` +
    `Local Notifications: ${capabilities.localNotifications ? 'Enabled' : 'Disabled'}\n` +
    `In-App Alerts: ${capabilities.inAppAlerts ? 'Enabled' : 'Disabled'}\n` +
    `Device Token: ${capabilities.deviceToken ? 'Available' : 'Not Available'}`,
    [{ text: 'OK' }]
  );
};

export const testLocalNotification = async () => {
  try {
    console.log('Testing local notification...');
    
    if (isExpoGo) {
      Alert.alert(
        'Test Notification (Expo Go)',
        'This is a test notification shown as an alert in Expo Go.',
        [{ text: 'OK' }]
      );
      return;
    }

    await notificationHandler.presentNotification({
      title: 'Test Notification',
      body: 'This is a test notification from the Elderly Companion app.',
      data: { type: 'test' },
      channelId: 'general-notifications'
    });
    
    Alert.alert('Success', 'Test notification sent!');
  } catch (error) {
    console.error('Error testing notification:', error);
    Alert.alert('Error', `Failed to send test notification: ${error.message}`);
  }
};

export const testEmergencyAlert = async () => {
  try {
    console.log('Testing emergency alert...');
    
    await notificationHandler.presentNotification({
      title: 'EMERGENCY ALERT',
      body: 'This is a test emergency alert. In a real emergency, family members would be notified immediately.',
      data: { 
        type: 'emergency_alert',
        emergency_id: 'test-123',
        location: 'Test Location'
      },
      channelId: 'emergency-alerts'
    });
    
    Alert.alert('Success', 'Emergency alert test sent!');
  } catch (error) {
    console.error('Error testing emergency alert:', error);
    Alert.alert('Error', `Failed to send emergency alert: ${error.message}`);
  }
};

export const testFamilyInvitation = async () => {
  try {
    console.log('Testing family invitation notification...');
    
    // Generate a proper UUID for testing
    const generateTestUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    
    const testInvitationId = generateTestUUID();
    const testUserId = generateTestUUID();
    
    // Show warning that this is a test invitation
    Alert.alert(
      'Test Family Invitation',
      'This will create a test invitation notification. Note: Accepting this test invitation may cause an error since it uses fake data. Use this only to test the UI flow.',
      [
        {
          text: 'Show Test Invitation',
          onPress: async () => {
            await notificationHandler.presentNotification({
              title: 'Family Invitation (TEST)',
              body: 'John Doe has invited you to join their family circle. This is a TEST invitation.',
              data: { 
                type: 'family_invitation',
                invitation_id: testInvitationId,
                relationship_id: testInvitationId,
                id: testInvitationId,
                inviter_name: 'John Doe (TEST)',
                inviter_id: testUserId,
                inviter_email: 'john.doe.test@example.com',
                inviterName: 'John Doe (TEST)',
                inviterUserType: 'family',
                relationship: 'Son',
                accessLevel: 'view',
                notes: 'Hi! This is a TEST invitation. Do not accept as it will cause an error.',
                createdAt: new Date().toISOString(),
                isTest: true
              },
              channelId: 'family-invitations'
            });
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  } catch (error) {
    console.error('Error testing family invitation:', error);
    Alert.alert('Error', `Failed to send family invitation: ${error.message}`);
  }
};

export const testFamilyInvitations = async () => {
  console.log('Testing family invitation notifications...');
  
  try {
    const response = await notificationService.getNotificationHistory();
    console.log('Notification response:', response);
    
    if (response.success) {
      const notifications = response.data?.notifications || [];
      console.log(`Total notifications: ${notifications.length}`);
      
      const familyInvitations = notifications.filter(n => 
        n.type === 'family_invitation' && !n.is_read
      );
      
      console.log(`Family invitations found: ${familyInvitations.length}`);
      
      if (familyInvitations.length > 0) {
        Alert.alert(
          'Family Invitations Found!',
          `Found ${familyInvitations.length} family invitation(s):\n${familyInvitations.map(inv => `• ${inv.title || 'Invitation'}`).join('\n')}\n\nIn Expo Go, these will be shown as alerts. In production, they would be push notifications.`,
          [
            {
              text: 'Show Details',
              onPress: () => {
                familyInvitations.forEach((inv, index) => {
                  setTimeout(() => {
                    Alert.alert(
                      inv.title || 'Family Invitation',
                      inv.message || 'You have a family invitation',
                      [
                        {
                          text: 'Go to Family Management',
                          onPress: () => {
                            console.log('User wants to navigate to family management for invitation:', inv.id);
                            const success = navigationService.navigateToFamilyManagement();
                            if (!success) {
                              Alert.alert('Navigation Failed', 'Could not navigate to Family Management. Please manually go to the Dashboard/Family tab to view invitations.');
                            }
                          }
                        },
                        { text: 'OK' }
                      ]
                    );
                  }, index * 1500); // Stagger alerts
                });
              }
            },
            { text: 'OK' }
          ]
        );
      } else {
        Alert.alert(
          'No Family Invitations',
          'No unread family invitations found. You can create a test invitation using the "Test Family Invitation" button.',
          [{ text: 'OK' }]
        );
      }
    } else {
      Alert.alert('Error', `Failed to load notifications: ${response.error}`);
    }
  } catch (error) {
    console.error('Test error:', error);
    Alert.alert('Test Error', error.message);
  }
};

export const testMedicationReminder = async () => {
  try {
    console.log('Testing medication reminder...');
    
    await notificationHandler.presentNotification({
      title: 'Medication Reminder',
      body: 'Time to take your medication: Aspirin 81mg',
      data: { 
        type: 'medication_reminder',
        medication_id: 'test-med-123',
        medication_name: 'Aspirin',
        dosage: '81mg'
      },
      channelId: 'medication-reminders'
    });
    
    Alert.alert('Success', 'Medication reminder test sent!');
  } catch (error) {
    console.error('Error testing medication reminder:', error);
    Alert.alert('Error', `Failed to send medication reminder: ${error.message}`);
  }
};

export const runFullNotificationTest = async () => {
  Alert.alert(
    'Full Notification Test',
    'This will test all notification types. You should see several alerts in sequence.',
    [
      {
        text: 'Run Test',
        onPress: async () => {
          try {
            console.log('Running full notification test suite...');
            
            // Test capabilities first
            testNotificationCapabilities();
            
            // Wait between tests
            setTimeout(() => testLocalNotification(), 2000);
            setTimeout(() => testFamilyInvitation(), 4000);
            setTimeout(() => testMedicationReminder(), 6000);
            setTimeout(() => testEmergencyAlert(), 8000);
            
            // Test real notifications last
            setTimeout(() => testFamilyInvitations(), 10000);
            
          } catch (error) {
            console.error('Error in full test:', error);
            Alert.alert('Test Error', error.message);
          }
        }
      },
      {
        text: 'Cancel',
        style: 'cancel'
      }
    ]
  );
};

export const checkForPendingInvitations = async () => {
  try {
    const pendingInvitation = await notificationHandler.getPendingInvitation();
    if (pendingInvitation) {
      Alert.alert(
        'Pending Family Invitation',
        'You have a family invitation waiting. Would you like to review it now?',
        [
          {
            text: 'Review Invitation',
            onPress: () => {
              console.log('User wants to review pending invitation:', pendingInvitation);
              // Could navigate to specific invitation screen or show details
            }
          },
          {
            text: 'Later',
            style: 'cancel',
            onPress: () => {
              // Put it back for later
              notificationHandler.storePendingInvitation(pendingInvitation);
            }
          }
        ]
      );
    }
  } catch (error) {
    console.error('Error checking pending invitations:', error);
  }
};

export const navigateToFamilyTab = () => {
  const success = navigationService.navigateToFamilyManagement();
  if (!success) {
    const tabName = navigationService.getFamilyTabName ? navigationService.getFamilyTabName() : 'Dashboard/Family';
    Alert.alert(
      'Navigation Helper',
      `Could not automatically navigate to Family Management. Please manually tap on the ${tabName} tab at the bottom of the screen.`,
      [{ text: 'OK' }]
    );
  }
  return success;
};
