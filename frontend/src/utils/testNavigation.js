// Simple test script to verify notification and navigation setup
import { Alert } from 'react-native';
import navigationService from '../utils/navigationService';
import notificationHandler from '../utils/notificationHandler';

export const runNavigationTest = () => {
  console.log('Running navigation test...');
  
  const currentRoute = navigationService.getCurrentRoute();
  console.log('Current route:', currentRoute);
  
  Alert.alert(
    'Navigation Test',
    `Current route: ${currentRoute?.name || 'Unknown'}\n\nNavigation service is ${navigationService.navigationRef ? 'connected' : 'not connected'}`,
    [
      {
        text: 'Test Family Navigation',
        onPress: () => {
          console.log('Testing navigation to Family Management...');
          const success = navigationService.navigateToFamilyManagement();
          setTimeout(() => {
            Alert.alert('Navigation Result', success ? 'Navigation successful!' : 'Navigation failed - check console for details');
          }, 500);
        }
      },
      {
        text: 'Test Family Tab',
        onPress: () => {
          console.log('Testing navigation to Family Tab...');
          const success = navigationService.navigateToFamilyTab();
          setTimeout(() => {
            Alert.alert('Navigation Result', success ? 'Family tab navigation successful!' : 'Family tab navigation failed');
          }, 500);
        }
      },
      {
        text: 'Test Capabilities',
        onPress: () => {
          const capabilities = notificationHandler.getCapabilities();
          Alert.alert(
            'Notification Capabilities',
            `Environment: ${capabilities.environment}\nPush: ${capabilities.pushNotifications}\nLocal: ${capabilities.localNotifications}\nAlerts: ${capabilities.inAppAlerts}`
          );
        }
      },
      { text: 'OK' }
    ]
  );
};

export const testInvitationFlow = () => {
  console.log('Testing invitation flow...');
  
  Alert.alert(
    'Test Family Invitation',
    'This will simulate receiving a family invitation notification.',
    [
      {
        text: 'Simulate Invitation',
        onPress: async () => {
          try {
            // Generate a valid UUID for the test invitation
            const generateTestUUID = () => {
              return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
              });
            };
            
            const testInvitationId = generateTestUUID();
            
            await notificationHandler.presentNotification({
              title: 'Family Invitation Test',
              body: 'This is a test family invitation. Tap "View in Family Tab" to test navigation.',
              data: {
                type: 'family_invitation',
                invitation_id: testInvitationId,
                inviter_name: 'Test User',
                isTest: true // Mark as test invitation
              }
            });
          } catch (error) {
            Alert.alert('Test Error', error.message);
          }
        }
      },
      { text: 'Cancel', style: 'cancel' }
    ]
  );
};

export const debugNavigationState = () => {
  const currentRoute = navigationService.getCurrentRoute();
  const isConnected = !!navigationService.navigationRef?.current;
  
  console.log('=== Navigation Debug ===');
  console.log('Navigation service connected:', isConnected);
  console.log('Current route:', currentRoute);
  console.log('Can go back:', navigationService.canGoBack());
  
  let stateInfo = 'Navigation state not available';
  if (navigationService.navigationRef?.current) {
    try {
      const state = navigationService.navigationRef.current.getState();
      console.log('Navigation state:', JSON.stringify(state, null, 2));
      stateInfo = `Routes: ${state.routes?.map(r => r.name).join(', ') || 'None'}`;
    } catch (error) {
      console.error('Error getting navigation state:', error);
      stateInfo = 'Error getting state';
    }
  }
  
  Alert.alert(
    'Navigation Debug',
    `Connected: ${isConnected}\nRoute: ${currentRoute?.name || 'Unknown'}\nCan go back: ${navigationService.canGoBack()}\n${stateInfo}`,
    [
      {
        text: 'Test Family Nav',
        onPress: () => {
          console.log('Testing direct family navigation...');
          const success = navigationService.navigateToFamilyManagement();
          console.log('Navigation result:', success);
        }
      },
      { text: 'OK' }
    ]
  );
};
