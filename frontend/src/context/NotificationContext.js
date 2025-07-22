import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import notificationService from '../services/notificationService';
import notificationHandler from '../utils/notificationHandler';
import navigationService from '../utils/navigationService';
import { useAuth } from './AuthContext';
import { APP_CONFIG } from '../config/config';

const NotificationContext = createContext();

const initialState = {
  notifications: [],
  settings: {
    medicationReminders: true,
    healthCheckins: true,
    emergencyAlerts: true,
    brainTrainingReminders: true,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '07:00',
    },
  },
  deviceToken: null,
  loading: false,
  error: null,
};

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload, error: null };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload, loading: false };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        loading: false,
      };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notif =>
          notif.id === action.payload ? { ...notif, read: true } : notif
        ),
        loading: false,
      };
    case 'SET_DEVICE_TOKEN':
      return { ...state, deviceToken: action.payload };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload, loading: false };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
        loading: false,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      console.log('Authentication state changed to authenticated, initializing notifications');
      initializeNotifications();
      loadNotificationSettings();
      loadNotificationHistory();
    }
  }, [isAuthenticated]);

  const initializeNotifications = async () => {
    try {
      console.log('Initializing notifications...');
      
      // Initialize the notification handler
      await notificationHandler.initialize();
      
      const capabilities = notificationHandler.getCapabilities();
      console.log('Notification capabilities:', capabilities);
      
      // Store device token if available
      if (capabilities.deviceToken) {
        dispatch({ type: 'SET_DEVICE_TOKEN', payload: capabilities.deviceToken });
        await registerDevice(capabilities.deviceToken);
      }
      
      console.log('Notifications initialized successfully');
      
    } catch (error) {
      console.error('Error initializing notifications:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const createNotificationChannels = async () => {
    // Create notification channels for Android
    await Notifications.setNotificationChannelAsync(APP_CONFIG.NOTIFICATION_CHANNELS.MEDICATION, {
      name: 'Medication Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync(APP_CONFIG.NOTIFICATION_CHANNELS.HEALTH, {
      name: 'Health Check-ins',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync(APP_CONFIG.NOTIFICATION_CHANNELS.EMERGENCY, {
      name: 'Emergency Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync(APP_CONFIG.NOTIFICATION_CHANNELS.GENERAL, {
      name: 'General Notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  };

  const registerDevice = async (token) => {
    try {
      const response = await notificationService.registerDevice({
        device_token: token,
        platform: 'mobile',
        device_name: 'Mobile App',
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to register device');
      }
    } catch (error) {
      console.error('Error registering device:', error);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const response = await notificationService.getNotificationSettings();
      
      if (response.success) {
        dispatch({ type: 'SET_SETTINGS', payload: response.data });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const updateNotificationSettings = async (newSettings) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await notificationService.updateNotificationSettings(newSettings);
      
      if (response.success) {
        dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
        return { success: true };
      } else {
        throw new Error(response.error || 'Failed to update settings');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const loadNotificationHistory = async (retryCount = 0) => {
    try {
      console.log('Loading notification history...');
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        const response = await notificationService.getNotificationHistory();
        
        if (response.success) {
          console.log(`Received ${response.data?.notifications?.length || 0} notifications`);
          dispatch({ type: 'SET_NOTIFICATIONS', payload: response.data?.notifications || [] });
          
          // Check for any unread notifications (including family invitations)
          const unreadNotifications = response.data?.notifications?.filter(
            notif => !notif.is_read
          );
          
          console.log('All notifications:', response.data?.notifications);
          console.log('Unread notifications:', unreadNotifications);
          
          if (unreadNotifications && unreadNotifications.length > 0) {
            console.log(`Found ${unreadNotifications.length} unread notifications, showing them to user`);
            
            // Show debug alert
            Alert.alert(
              'Debug: Notifications Found',
              `Found ${unreadNotifications.length} unread notifications:\n${unreadNotifications.map(n => `• ${n.title}: ${n.type}`).join('\n')}`,
              [{ text: 'OK' }]
            );
            
            // Use the notification handler to present notifications appropriately
            for (const notification of unreadNotifications) {
              console.log(`Processing notification: ${notification.title} - ${notification.type}`);
              
              // Prepare notification data for the handler
              const notificationData = {
                title: notification.title,
                body: notification.message,
                data: {
                  type: notification.type,
                  id: notification.id,
                  ...notification.data
                }
              };
              
              try {
                await notificationHandler.presentNotification(notificationData);
              } catch (notifError) {
                console.error('Error presenting notification:', notifError);
              }
              
              // Small delay between notifications
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } else {
            console.log('No unread notifications found');
            
            // Show debug alert when no notifications are found
            Alert.alert(
              'Debug: No Notifications',
              `Total notifications: ${response.data?.notifications?.length || 0}\nUnread: 0`,
              [{ text: 'OK' }]
            );
          }
        } else {
          console.error('Failed to load notifications:', response.error);
          
          // If we've failed but haven't retried too many times, try again
          if (retryCount < 2) {
            console.log(`Retrying notification fetch (attempt ${retryCount + 1})`);
            // Wait 1 second before retry
            setTimeout(() => loadNotificationHistory(retryCount + 1), 1000);
          }
        }
      } catch (requestError) {
        console.error('Request error loading notification history:', requestError);
        
        // Retry on network or server errors, but not on 4xx errors (client errors)
        if (retryCount < 2 && (!requestError.status || requestError.status >= 500)) {
          console.log(`Retrying notification fetch due to server error (attempt ${retryCount + 1})`);
          setTimeout(() => loadNotificationHistory(retryCount + 1), 1000);
        }
      }
    } catch (error) {
      console.error('Error in notification history function:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const scheduleLocalNotification = async (notification) => {
    try {
      return await notificationHandler.scheduleLocalNotification(notification);
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  };

  const scheduleMedicationReminder = async (medication, reminderTime) => {
    try {
      if (!state.settings.medicationReminders) return;
      
      const trigger = new Date(reminderTime);
      
      const notificationId = await scheduleLocalNotification({
        title: 'Medication Reminder',
        body: `Time to take ${medication.name} (${medication.dosage})`,
        data: {
          type: 'medication_reminder',
          medicationId: medication.id,
          scheduledTime: reminderTime,
        },
        trigger,
        channelId: APP_CONFIG.NOTIFICATION_CHANNELS.MEDICATION,
      });
      
      return notificationId;
    } catch (error) {
      console.error('Error scheduling medication reminder:', error);
    }
  };

  const scheduleHealthCheckinReminder = async () => {
    try {
      if (!state.settings.healthCheckins) return;
      
      // Schedule daily at 9 AM
      const trigger = {
        hour: 9,
        minute: 0,
        repeats: true,
      };
      
      const notificationId = await scheduleLocalNotification({
        title: 'Daily Health Check-in',
        body: 'How are you feeling today? Take a moment to log your health.',
        data: {
          type: 'health_checkin_reminder',
        },
        trigger,
        channelId: APP_CONFIG.NOTIFICATION_CHANNELS.HEALTH,
      });
      
      return notificationId;
    } catch (error) {
      console.error('Error scheduling health check-in reminder:', error);
    }
  };

  const sendEmergencyNotification = async (emergencyData) => {
    try {
      // Send immediate notification using the handler
      await notificationHandler.presentNotification({
        title: 'EMERGENCY ALERT',
        body: emergencyData.message || 'Emergency situation detected',
        data: {
          type: 'emergency_alert',
          ...emergencyData,
        },
        channelId: 'emergency-alerts'
      });
      
      // Also send to backend for processing
      const response = await notificationService.sendEmergencyNotification(emergencyData);
      
      return response;
    } catch (error) {
      console.error('Error sending emergency notification:', error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });
      
      // Update on backend
      await notificationService.markNotificationRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const cancelNotification = async (notificationId) => {
    try {
      await notificationHandler.cancelNotification(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await notificationHandler.cancelAllNotifications();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  };

  const isInQuietHours = () => {
    if (!state.settings.quietHours.enabled) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMinute] = state.settings.quietHours.startTime.split(':').map(Number);
    const [endHour, endMinute] = state.settings.quietHours.endTime.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    if (startTime < endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Crosses midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const showNotificationInfo = () => {
    // This can be called to inform users about notification capabilities
    const capabilities = notificationHandler.getCapabilities();
    return {
      ...capabilities,
      message: capabilities.pushNotifications 
        ? 'Push and local notifications are enabled'
        : 'Local notifications are enabled. For push notifications, use a development build instead of Expo Go.'
    };
  };

  const value = {
    ...state,
    initializeNotifications,
    updateNotificationSettings,
    loadNotificationSettings,
    loadNotificationHistory,
    getNotificationSettings: loadNotificationSettings,
    getNotificationHistory: loadNotificationHistory,
    scheduleLocalNotification,
    scheduleMedicationReminder,
    scheduleHealthCheckinReminder,
    sendEmergencyNotification,
    markNotificationAsRead,
    cancelNotification,
    cancelAllNotifications,
    isInQuietHours,
    clearError,
    showNotificationInfo,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export { NotificationContext };
