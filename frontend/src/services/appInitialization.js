import { Platform } from 'react-native';
import * as Font from 'expo-font';
import * as Notifications from 'expo-notifications';
import authService from './authService';
import geofencingService from './geofencingService';
import { APP_CONFIG } from '../config/config';

// Initialize app fonts
const loadFonts = async () => {
  try {
    // For now, skip custom font loading as fonts don't exist
    // await Font.loadAsync({
    //   'Roboto': require('../../assets/fonts/Roboto-Regular.ttf'),
    //   'Roboto-Bold': require('../../assets/fonts/Roboto-Bold.ttf'),
    // });
    console.log('Fonts loaded successfully (using system fonts)');
  } catch (error) {
    console.log('Error loading fonts:', error);
    // Continue without custom fonts
  }
};

// Configure notifications
const configureNotifications = () => {
  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Handle notification interactions
  Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    
    // Handle different notification types
    switch (data.type) {
      case 'medication_reminder':
        // Navigate to medication screen
        console.log('Navigate to medication:', data.medicationId);
        break;
      case 'health_checkin_reminder':
        // Navigate to health check-in screen
        console.log('Navigate to health check-in');
        break;
      case 'emergency_alert':
        // Handle emergency notification
        console.log('Emergency alert received:', data);
        break;
      case 'family_invitation':
        // Handle family invitation notification
        console.log('Family invitation received:', data);
        // Navigate to accept invitation screen
        if (data.relationshipId) {
          // We need access to navigation here, so we'll emit an event
          // that can be caught by the navigation container
          global.handleFamilyInvitation?.(data.relationshipId, data);
        }
        break;
      default:
        console.log('Unknown notification type:', data.type);
    }
  });
};

// Initialize app services
export const initializeApp = async () => {
  try {
    console.log('Initializing Elderly Companion App...');
    
    // Load fonts
    await loadFonts();
    
    // Configure notifications
    configureNotifications();
    
    // Initialize auth service (currently no initialize method needed)
    // authService.initialize();
    
    console.log('App initialization complete');
  } catch (error) {
    console.error('Error initializing app:', error);
  }
};

// Handle app state changes
export const handleAppStateChange = (nextAppState) => {
  console.log('App state changed to:', nextAppState);
  
  if (nextAppState === 'background') {
    // App moved to background
    console.log('App moved to background');
  } else if (nextAppState === 'active') {
    // App became active
    console.log('App became active');
  }
};
