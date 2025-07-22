// Enhanced notification handler for Expo SDK 53+ compatibility
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import navigationService from './navigationService';

class NotificationHandler {
  constructor() {
    this.isExpoGo = Constants.appOwnership === 'expo';
    this.deviceToken = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    console.log('Initializing NotificationHandler...');
    console.log('Running in Expo Go:', this.isExpoGo);
    console.log('Platform:', Platform.OS);
    console.log('Device type:', Device.deviceType);

    try {
      // Set notification handler for both Expo Go and production
      Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          console.log('Received notification:', notification);
          
          // In Expo Go, we'll handle most notifications as in-app alerts
          if (this.isExpoGo) {
            const content = notification.request.content;
            
            // For family invitations, show immediate alert
            if (content.data?.type === 'family_invitation') {
              setTimeout(() => {
                Alert.alert(
                  content.title || 'Family Invitation',
                  content.body || 'You have a new family invitation',
                  [
                    {
                      text: 'View in Family Tab',
                      onPress: () => {
                        this.storePendingInvitation(content.data);
                      }
                    },
                    {
                      text: 'Later',
                      style: 'cancel'
                    }
                  ]
                );
              }, 100);
              
              return {
                shouldShowAlert: false, // We're showing our own alert
                shouldPlaySound: false,
                shouldSetBadge: false,
              };
            }
          }

          return {
            shouldShowAlert: true,
            shouldPlaySound: !this.isExpoGo, // Disable sound in Expo Go
            shouldSetBadge: false,
          };
        },
      });

      // Register for push notifications if not in Expo Go
      if (!this.isExpoGo && Device.isDevice) {
        await this.registerForPushNotifications();
      } else {
        console.log('Skipping push notification registration (Expo Go or emulator)');
      }

      this.initialized = true;
      console.log('NotificationHandler initialized successfully');
    } catch (error) {
      console.error('Error initializing NotificationHandler:', error);
    }
  }

  async registerForPushNotifications() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      console.log('Expo push token:', token.data);
      this.deviceToken = token.data;

      // Create notification channels for Android
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  async createNotificationChannels() {
    const channels = [
      {
        id: 'medication-reminders',
        name: 'Medication Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      },
      {
        id: 'health-checkins',
        name: 'Health Check-ins',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
      },
      {
        id: 'emergency-alerts',
        name: 'Emergency Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      },
      {
        id: 'family-invitations',
        name: 'Family Invitations',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      },
      {
        id: 'general-notifications',
        name: 'General Notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
      },
    ];

    for (const channel of channels) {
      await Notifications.setNotificationChannelAsync(channel.id, channel);
      console.log(`Created notification channel: ${channel.name}`);
    }
  }

  async presentNotification(notification) {
    const { title, body, data = {}, channelId = 'general-notifications' } = notification;

    try {
      if (this.isExpoGo) {
        // In Expo Go, use alerts for most notifications
        console.log('Presenting notification as alert in Expo Go:', title);
        
        if (data.type === 'family_invitation') {
          // Determine the correct tab name based on user type
          const tabName = navigationService.getFamilyTabName ? navigationService.getFamilyTabName() : 'Family';
          
          Alert.alert(
            title,
            body,
            [
              {
                text: `View Invitation`,
                onPress: () => {
                  console.log('Navigating to invitation acceptance screen...');
                  // Try to navigate to the invitation acceptance screen first
                  const success = navigationService.navigateToInviteAcceptance(
                    data.invitation_id || data.id,
                    data
                  );
                  if (!success) {
                    console.log('Invitation screen navigation failed, trying family management');
                    navigationService.navigateToFamilyManagement();
                  }
                }
              },
              {
                text: `Go to ${tabName} Tab`,
                onPress: () => {
                  console.log('Navigating to Family management...');
                  const success = navigationService.navigateToFamilyManagement();
                  if (!success) {
                    console.log('Direct navigation failed, storing invitation for later');
                    this.storePendingInvitation(data);
                  }
                }
              },
              {
                text: 'Later',
                style: 'cancel',
                onPress: () => {
                  this.storePendingInvitation(data);
                }
              }
            ]
          );
        } else if (data.type === 'emergency_alert') {
          Alert.alert(
            '🚨 ' + title,
            body,
            [
              {
                text: 'View Emergency',
                onPress: () => {
                  console.log('Navigating to emergency screen...');
                  const success = navigationService.navigateToTab('Emergency');
                  if (!success) {
                    console.log('Failed to navigate to Emergency tab');
                  }
                }
              },
              { text: 'OK' }
            ]
          );
        } else {
          // For other notifications, show simple alert
          Alert.alert(title, body, [{ text: 'OK' }]);
        }
      } else {
        // In production build, use system notifications
        if (Platform.OS === 'web') {
          Alert.alert(title, body, [{ text: 'OK' }]);
        } else {
          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data,
              sound: 'default',
              channelId,
            },
            trigger: null,
          });
          console.log('Presented system notification:', title);
        }
      }
    } catch (error) {
      console.error('Error presenting notification:', error);
      // Fallback to alert
      Alert.alert(title, body, [{ text: 'OK' }]);
    }
  }

  async storePendingInvitation(invitationData) {
    try {
      await AsyncStorage.setItem('pendingInvitation', JSON.stringify(invitationData));
      console.log('Stored pending invitation for later access');
    } catch (error) {
      console.error('Error storing pending invitation:', error);
    }
  }

  async getPendingInvitation() {
    try {
      const stored = await AsyncStorage.getItem('pendingInvitation');
      if (stored) {
        await AsyncStorage.removeItem('pendingInvitation');
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('Error getting pending invitation:', error);
      return null;
    }
  }

  async scheduleLocalNotification(notification) {
    try {
      const { title, body, data, trigger, channelId = 'general-notifications' } = notification;
      
      if (this.isExpoGo) {
        console.log('Local notifications have limited support in Expo Go');
        // For testing, we could store and show later
        return 'expo-go-local-notification';
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          channelId,
        },
        trigger,
      });

      console.log('Scheduled local notification:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      throw error;
    }
  }

  async cancelNotification(notificationId) {
    try {
      if (notificationId === 'expo-go-local-notification') {
        console.log('Cannot cancel Expo Go local notification');
        return;
      }
      
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Canceled notification:', notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Canceled all scheduled notifications');
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  getCapabilities() {
    return {
      pushNotifications: !this.isExpoGo && Device.isDevice,
      localNotifications: !this.isExpoGo,
      inAppAlerts: true,
      platform: Platform.OS,
      environment: this.isExpoGo ? 'expo-go' : 'production',
      deviceToken: this.deviceToken,
    };
  }
}

// Export singleton instance
export const notificationHandler = new NotificationHandler();
export default notificationHandler;
