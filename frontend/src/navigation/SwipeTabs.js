import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';
import { useNavigation } from '@react-navigation/native';
import UnifiedHeader from '../components/UnifiedHeader';
import HomeScreen from '../screens/main/HomeScreen';
import MedicationsScreen from '../screens/medications/MedicationsScreen';
import HealthScreen from '../screens/health/HealthHistoryScreen';
import BrainScreen from '../screens/brain/BrainTrainingScreen';
import EmergencyScreen from '../screens/emergency/EmergencyScreen';
import FamilyScreen from '../screens/FamilyCaregiver/FamilyManagementScreen';
import CaregiverDashboardScreen from '../screens/FamilyCaregiver/CaregiverDashboardScreen';

const MainScreenNavigator = forwardRef(({ userType, route }, ref) => {
  const { theme } = useTheme();
  const { t } = useLocalization();
  const navigation = useNavigation();
  
  // Get initial screen from route params, default based on user type
  const getDefaultScreen = () => {
    if (userType === 'caregiver' || userType === 'family') {
      return 'Dashboard'; // Caregivers see Dashboard as default
    }
    return 'Home'; // Elderly users see Home as default
  };
  
  const initialScreen = route?.params?.screen || getDefaultScreen();
  
  // State to track the currently active screen
  const [activeScreen, setActiveScreen] = useState(initialScreen);

  // Update active screen when route params change
  useEffect(() => {
    if (route?.params?.screen && route.params.screen !== activeScreen) {
      setActiveScreen(route.params.screen);
    }
  }, [route?.params?.screen, activeScreen]);

  useImperativeHandle(ref, () => ({
    goToTab: (tabName) => {
      try {
        // Map our navigation keys to actual screen names
        const screenMapping = {
          'medications': 'Medications',
          'health': 'Health', 
          'brain': 'Brain',
          'emergency': 'Emergency',
          'family': 'Family',
          'home': 'Home',
          'dashboard': 'Dashboard',
        };
        
        const targetScreen = screenMapping[tabName.toLowerCase()] || tabName;
        setActiveScreen(targetScreen);
      } catch (error) {
        console.error('Screen navigation error:', error);
      }
    },
  }));

  // Function to handle navigation from header buttons
  const handleScreenChange = (screenName) => {
    setActiveScreen(screenName);
  };

  // Function to render the active screen
  const renderActiveScreen = () => {
    const commonProps = {
      navigation,
      goToTab: (tabName) => {
        const screenMapping = {
          'medications': 'Medications',
          'health': 'Health', 
          'brain': 'Brain',
          'emergency': 'Emergency',
          'family': 'Family',
          'home': 'Home',
          'dashboard': 'Dashboard',
        };
        
        const targetScreen = screenMapping[tabName.toLowerCase()] || tabName;
        setActiveScreen(targetScreen);
      }
    };

    switch (activeScreen) {
      case 'Home':
        return <HomeScreen {...commonProps} />;
      case 'Dashboard':
        return <CaregiverDashboardScreen {...commonProps} />;
      case 'Medications':
        return <MedicationsScreen {...commonProps} />;
      case 'Health':
        return <HealthScreen {...commonProps} />;
      case 'Brain':
        return userType === 'elderly' ? <BrainScreen {...commonProps} /> : <CaregiverDashboardScreen {...commonProps} />;
      case 'Emergency':
        return <EmergencyScreen {...commonProps} />;
      case 'Family':
        return <FamilyScreen {...commonProps} />;
      default:
        return userType === 'elderly' ? <HomeScreen {...commonProps} /> : <CaregiverDashboardScreen {...commonProps} />;
    }
  };
  
  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: theme.colors.background,
    }}>
      {/* Unified Header with Navigation Buttons */}
      <UnifiedHeader
        title={userType === 'elderly' ? 'Home' : 'Dashboard'}
        navigation={navigation}
        userType={userType}
        showBackButton={false}
        activeScreen={activeScreen}
        onScreenChange={handleScreenChange}
      />
      
      {/* Content Area - Shows the selected screen */}
      <View style={{ flex: 1 }}>
        {renderActiveScreen()}
      </View>
    </View>
  );
});

MainScreenNavigator.displayName = 'MainScreenNavigator';

export default MainScreenNavigator;

