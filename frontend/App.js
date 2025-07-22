import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator, AccessibilityInfo, Linking } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { HealthProvider } from './src/context/HealthContext';
import { MedicationProvider } from './src/context/MedicationContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LocalizationProvider } from './src/context/LocalizationContext';
import AppNavigator, { setForceResetPasswordScreen } from './src/navigation/AppNavigator';
import { lightTheme } from './src/theme/theme';
import { initializeApp } from './src/services/appInitialization';
import navigationService from './src/utils/navigationService';
import { apiEvents } from './src/services/apiService';

// Component to set up navigation service with user context
const NavigationSetup = ({ navigationRef }) => {
  const { user } = useAuth();
  
  useEffect(() => {
    if (user?.user_type || user?.userType) {
      const userType = user.user_type || user.userType;
      navigationService.setUserType(userType);
      console.log('Navigation service updated with user type:', userType);
    }
  }, [user]);
  
  return null; // This component doesn't render anything
};

// Deep link handler component
const DeepLinkHandler = ({ navigationRef }) => {
  useEffect(() => {
    const handleDeepLink = (url) => {
      console.log('Deep link received:', url);
      if (url.includes('reset-password')) {
        try {
          // Extract access token and type from Supabase magic link
          const urlParams = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
          const accessToken = urlParams.get('access_token');
          const type = urlParams.get('type');
          if (type === 'recovery' && accessToken) {
            console.log('Password reset deep link detected, navigating to ResetPassword screen');
            if (navigationRef.current) {
              navigationRef.current.navigate('ResetPassword', { accessToken, fromDeepLink: true });
            }
            return;
          }
        } catch (error) {
          console.error('Error parsing reset password deep link:', error);
        }
      }
    };

    // Handle initial URL if app was opened from a link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL:', url);
        handleDeepLink(url);
      }
    });

    // Handle deep links when app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [navigationRef]);

  return null;
};

// App content component that uses the theme
const AppContent = () => {
  const { theme, isDarkMode } = useTheme();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const navigationRef = useRef();

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('Initializing app...');
        
        // Check if screen reader is enabled for accessibility enhancements
        const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
        setIsScreenReaderEnabled(screenReaderEnabled);
        
        await initializeApp();
        console.log('App initialized successfully');
        setIsReady(true);
      } catch (err) {
        console.error('App initialization failed:', err);
        setError(err.message);
        setIsReady(true); // Still render the app even if initialization fails
      }
    };

    // Set up global family invitation handler
    global.handleFamilyInvitation = (relationshipId, invitationData) => {
      console.log('Handling family invitation:', relationshipId, invitationData);
      navigationService.navigateToInviteAcceptance(relationshipId, invitationData);
    };

    // Set navigation ref for the navigation service
    navigationService.setNavigationRef(navigationRef);

    initialize();

    // Listen for screen reader changes
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled) => {
        setIsScreenReaderEnabled(enabled);
        console.log('Screen reader status changed:', enabled);
      }
    );

    // Listen for global logout event
    const handleLogout = () => {
      if (navigationRef.current) {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    };
    apiEvents.on('logout', handleLogout);
    return () => {
      apiEvents.off('logout', handleLogout);
      subscription?.remove();
    };
  }, []);

  if (!isReady) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: theme.colors.background, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ 
          marginTop: 20, 
          fontSize: 18, 
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.body.fontFamily 
        }}>
          Initializing Elder Care...
        </Text>
        {error && (
          <Text style={{ 
            marginTop: 10, 
            fontSize: 14, 
            color: theme.colors.error,
            textAlign: 'center',
            paddingHorizontal: 20
          }}>
            Warning: {error}
          </Text>
        )}
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <NavigationSetup navigationRef={navigationRef} />
        <DeepLinkHandler navigationRef={navigationRef} />
        <HealthProvider>
          <MedicationProvider>
            <NotificationProvider>
              <NavigationContainer 
                ref={navigationRef}
                theme={{
                  dark: isDarkMode,
                  colors: {
                    primary: theme.colors.primary,
                    background: theme.colors.background,
                    card: theme.colors.surface,
                    text: theme.colors.textPrimary,
                    border: theme.colors.borderColor,
                    notification: theme.colors.primary,
                  },
                }}
              >
                <AppNavigator />
                <StatusBar 
                  style={isDarkMode ? "light" : "dark"} 
                  backgroundColor={theme.colors.primary}
                />
              </NavigationContainer>
            </NotificationProvider>
          </MedicationProvider>
        </HealthProvider>
      </AuthProvider>
    </PaperProvider>
  );
};

// Main App component
const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LocalizationProvider>
          <AppContent />
        </LocalizationProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
