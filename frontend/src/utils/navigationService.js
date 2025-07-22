// Navigation utilities for notifications and alerts
import { CommonActions } from '@react-navigation/native';
import { Alert } from 'react-native';

class NavigationService {
  constructor() {
    this.navigationRef = null;
    this.userType = null; // Will be set by the app
    this.pendingNavigations = [];
    this.isReady = false;
  }

  setNavigationRef(ref) {
    this.navigationRef = ref;
    this.isReady = true;
    // Process any pending navigations
    if (this.pendingNavigations.length > 0) {
      this.pendingNavigations.forEach(({ method, args }) => {
        try {
          // Avoid infinite recursion if method queues itself again
          if (typeof this[method] === 'function') {
            this[method](...args);
          }
        } catch (e) {
          console.error('Failed to process pending navigation:', method, args, e);
        }
      });
      this.pendingNavigations = [];
    }
  }

  setUserType(userType) {
    this.userType = userType;
    console.log('Navigation service user type set to:', userType);
  }

  // Determine which tab contains family management based on user type
  getFamilyTabName() {
    // For all users, family management is under Family tab
    // The SwipeTabs component handles the Family screen for all user types
    return 'Family';
  }

  navigate(routeName, params = {}) {
    if (this.navigationRef?.current) {
      try {
        this.navigationRef.current.navigate(routeName, params);
        return true;
      } catch (error) {
        console.error('Navigation error:', error);
        return false;
      }
    } else {
      // Queue navigation if not ready
      this.pendingNavigations.push({ method: 'navigate', args: [routeName, params] });
      console.warn('Navigation ref not available, queuing navigation:', routeName);
      return false;
    }
  }

  // Navigate to a specific tab (for elderly users)
  navigateToTab(tabName) {
    if (this.navigationRef?.current) {
      try {
        this.navigationRef.current.navigate('MainTabs', {
          screen: tabName
        });
        return true;
      } catch (error) {
        console.error(`Error navigating to ${tabName} tab:`, error);
        return false;
      }
    } else {
      this.pendingNavigations.push({ method: 'navigateToTab', args: [tabName] });
      console.warn('Cannot navigate to tab - navigation ref not available, queuing.');
      return false;
    }
  }

  navigateToFamilyTab() {
    if (this.navigationRef?.current) {
      try {
        const tabName = this.getFamilyTabName();
        console.log(`Navigating to ${tabName} tab for user type: ${this.userType}`);
        this.navigationRef.current.navigate('MainTabs', {
          screen: tabName
        });
        return true;
      } catch (error) {
        console.error('Error navigating to family tab:', error);
        return false;
      }
    } else {
      this.pendingNavigations.push({ method: 'navigateToFamilyTab', args: [] });
      console.warn('Cannot navigate to family tab - navigation ref not available, queuing.');
      return false;
    }
  }

  navigateToFamilyManagement() {
    if (this.navigationRef?.current) {
      try {
        const tabName = this.getFamilyTabName();
        console.log(`Attempting to navigate to Family Management via ${tabName} tab...`);
        this.navigationRef.current.navigate('MainTabs', {
          screen: tabName
        });
        console.log('Navigation command sent successfully');
        return true;
      } catch (error) {
        console.error('Error navigating to Family Management:', error);
        return false;
      }
    } else {
      this.pendingNavigations.push({ method: 'navigateToFamilyManagement', args: [] });
      console.warn('Cannot navigate to Family Management - navigation ref not available, queuing.');
      return false;
    }
  }
  // Remove extra closing brace above
  navigateToInviteAcceptance(invitationId, invitationData) {
    if (this.navigationRef?.current) {
      try {
        console.log('Navigating to AcceptInvitation screen:', { invitationId, invitationData });
        // Navigate directly to the AcceptInvitation screen (it's in the MainStackNavigator)
        this.navigationRef.current.navigate('AcceptInvitation', {
          inviteId: invitationId,
          inviteData: invitationData,
          invitationId: invitationId, // Also pass as legacy field name
          invitationData: invitationData, // Also pass as legacy field name
        });
        return true;
      } catch (error) {
        console.error('Error navigating to Invite Acceptance:', error);
        // Fallback to Family Management screen
        Alert.alert(
          'Navigation Notice',
          'Opening Family Management screen. Please check for pending invitations there.',
          [{ text: 'OK' }]
        );
        return this.navigateToFamilyManagement();
      }
    } else {
      this.pendingNavigations.push({ method: 'navigateToInviteAcceptance', args: [invitationId, invitationData] });
      console.warn('Cannot navigate to Invite Acceptance - navigation ref not available, queuing.');
      return false;
    }
  }

  getCurrentRoute() {
    if (this.navigationRef?.current) {
      return this.navigationRef.current.getCurrentRoute();
    }
    return null;
  }

  canGoBack() {
    if (this.navigationRef?.current) {
      return this.navigationRef.current.canGoBack();
    }
    return false;
  }

  goBack() {
    if (this.navigationRef?.current && this.canGoBack()) {
      this.navigationRef.current.goBack();
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const navigationService = new NavigationService();
export default navigationService;
