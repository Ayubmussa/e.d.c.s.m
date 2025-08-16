import ElderlyDetailsScreen from '../screens/FamilyCaregiver/ElderlyDetailsScreen';
import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { View, TouchableOpacity, BackHandler, Platform } from 'react-native';
import UnifiedHeader from '../components/UnifiedHeader';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';


// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

// Main Screens
import HomeScreen from '../screens/main/HomeScreen';
import MedicationsScreen from '../screens/medications/MedicationsScreen';
import AddMedicationScreen from '../screens/medications/AddMedicationScreen';
import MedicationDetailsScreen from '../screens/medications/MedicationDetailsScreen';
import MedicationHistoryScreen from '../screens/medications/MedicationHistoryScreen';
import HealthCheckinScreen from '../screens/health/HealthCheckinScreen';
import HealthHistoryScreen from '../screens/health/HealthHistoryScreen';
import BrainTrainingScreen from '../screens/brain/BrainTrainingScreen';
import BrainGameScreen from '../screens/brain/BrainGameScreen';
import BrainGameCategoryScreen from '../screens/brain/BrainGameCategoryScreen';
import QuickBrainGameScreen from '../screens/brain/QuickBrainGameScreen';
import EmergencyScreen from '../screens/emergency/EmergencyScreen';
import EmergencyContactsScreen from '../screens/emergency/EmergencyContactsScreen';
import AddEmergencyContactScreen from '../screens/emergency/AddEmergencyContactScreen';
import MedicalInfoScreen from '../screens/emergency/MedicalInfoScreen';
import ShareLocationScreen from '../screens/emergency/ShareLocationScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import EditProfileScreen from '../screens/settings/EditProfileScreen';
import DataPrivacyScreen from '../screens/settings/DataPrivacyScreen';
import HelpScreen from '../screens/settings/HelpScreen';
import ContactSupportScreen from '../screens/settings/ContactSupportScreen';
import AboutScreen from '../screens/settings/AboutScreen';
import ExportDataScreen from '../screens/settings/ExportDataScreen';
import ThemePreviewScreen from '../screens/settings/ThemePreviewScreen';
import VoiceAssistantScreen from '../screens/voice/VoiceAssistantScreen';
import SafeZonesScreen from '../screens/settings/SafeZonesScreen';
import AddSafeZoneScreen from '../screens/settings/AddSafeZoneScreen';
import EditSafeZoneScreen from '../screens/settings/EditSafeZoneScreen';

// Family & Caregiver Screens
import FamilyManagementScreen from '../screens/FamilyCaregiver/FamilyManagementScreen';
import InviteFamilyScreen from '../screens/FamilyCaregiver/InviteFamilyScreen';
import InviteAcceptanceScreen from '../screens/FamilyCaregiver/InviteAcceptanceScreen';
import ManagePermissionsScreen from '../screens/FamilyCaregiver/ManagePermissionsScreen';

// Calling Screens
import CallScreen from '../screens/calling/CallScreen';

import MainScreenNavigator from './SwipeTabs';
import { useWindowDimensions } from 'react-native';

const Stack = createStackNavigator();

// Auth Stack Navigator
const AuthNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background },
      }}
      initialRouteName="Login"
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};

// Medication Stack Navigator
const MedicationNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.white,
        headerTitleStyle: {
          fontSize: theme.typography.h6.fontSize,
          fontFamily: theme.typography.h6.fontFamily,
        },
      }}
    >
      <Stack.Screen 
        name="MedicationsList" 
        component={MedicationsScreen} 
        options={{ title: 'My Medications' }}
      />
      <Stack.Screen 
        name="AddMedication" 
        component={AddMedicationScreen} 
        options={{ title: 'Add Medication' }}
      />
      <Stack.Screen 
        name="MedicationDetails" 
        component={MedicationDetailsScreen} 
        options={{ title: 'Medication Details' }}
      />
      <Stack.Screen 
        name="MedicationHistory" 
        component={MedicationHistoryScreen} 
        options={{ title: 'Medication History' }}
      />
    </Stack.Navigator>
  );
};

// Health Stack Navigator
const HealthNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.white,
        headerTitleStyle: {
          fontSize: theme.typography.h6.fontSize,
          fontFamily: theme.typography.h6.fontFamily,
        },
      }}
    >
      <Stack.Screen 
        name="HealthHistory" 
        component={HealthHistoryScreen} 
        options={{ title: 'Health History' }}
      />
      <Stack.Screen 
        name="HealthCheckin" 
        component={HealthCheckinScreen} 
        options={{ title: 'Daily Check-in' }}
      />
    </Stack.Navigator>
  );
};

// Brain Training Stack Navigator
const BrainTrainingNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.white,
        headerTitleStyle: {
          fontSize: theme.typography.h6.fontSize,
          fontFamily: theme.typography.h6.fontFamily,
        },
      }}
    >
      <Stack.Screen 
        name="BrainTrainingOverview" 
        component={BrainTrainingScreen} 
        options={{ title: 'Brain Training' }}
      />
      <Stack.Screen 
        name="BrainGame" 
        component={BrainGameScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="BrainGameCategory" 
        component={BrainGameCategoryScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="QuickBrainGame" 
        component={QuickBrainGameScreen} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// Emergency Stack Navigator
const EmergencyNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.error,
        },
        headerTintColor: theme.colors.white,
        headerTitleStyle: {
          fontSize: theme.typography.h6.fontSize,
          fontFamily: theme.typography.h6.fontFamily,
        },
      }}
    >
      <Stack.Screen 
        name="EmergencyOverview" 
        component={EmergencyScreen} 
        options={{ title: 'Emergency' }}
      />
      <Stack.Screen 
        name="EmergencyContacts" 
        component={EmergencyContactsScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AddEmergencyContact" 
        component={AddEmergencyContactScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="MedicalInfo" 
        component={MedicalInfoScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ShareLocation" 
        component={ShareLocationScreen} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// Settings Stack Navigator
const SettingsNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.white,
        headerTitleStyle: {
          fontSize: theme.typography.h6.fontSize,
          fontFamily: theme.typography.h6.fontFamily,
        },
      }}
    >
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="DataPrivacy" 
        component={DataPrivacyScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Help" 
        component={HelpScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ContactSupport" 
        component={ContactSupportScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="About" 
        component={AboutScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ExportData" 
        component={ExportDataScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ThemePreview" 
        component={ThemePreviewScreen} 
        options={{ title: 'Theme Preview' }}
      />
      <Stack.Screen 
        name="SafeZones" 
        component={SafeZonesScreen} 
        options={{ title: 'Safe Zones' }}
      />
      <Stack.Screen 
        name="AddSafeZone" 
        component={AddSafeZoneScreen} 
        options={{ title: 'Add Safe Zone' }}
      />
      <Stack.Screen 
        name="EditSafeZone" 
        component={EditSafeZoneScreen} 
        options={{ title: 'Edit Safe Zone' }}
      />
    </Stack.Navigator>
  );
};

// Family/Caregiver Stack Navigator
const FamilyNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.white,
        headerTitleStyle: {
          fontSize: theme.typography.h6.fontSize,
          fontFamily: theme.typography.h6.fontFamily,
        },
      }}
    >
      <Stack.Screen 
        name="FamilyManagement" 
        component={FamilyManagementScreen} 
        options={{ title: 'Family & Caregivers' }}
      />
      <Stack.Screen 
        name="InviteFamily" 
        component={InviteFamilyScreen} 
        options={{ title: 'Invite Family Member' }}
      />
      <Stack.Screen 
        name="InviteAcceptance" 
        component={InviteAcceptanceScreen} 
        options={{ title: 'Accept Invitation' }}
      />
      <Stack.Screen 
        name="ManagePermissions" 
        component={ManagePermissionsScreen} 
        options={{ title: 'Manage Permissions' }}
      />
    </Stack.Navigator>
  );
};



// Unified Main App Stack Navigator with beautiful header
const MainStackNavigator = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const userType = user?.userType || user?.user_type || 'elderly';

  // Ref for MainTabNavigator
  const mainTabRef = React.useRef();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Disable default headers completely
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      {/* WelcomeScreen as the first screen after login/registration */}
      <Stack.Screen
        name="WelcomeScreen"
        component={require('../screens/auth/WelcomeScreen').default}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MainTabs"
        options={{ 
          headerAccessibilityLabel: userType === 'elderly' ? 'Home screen' : 'Dashboard screen',
        }}
      >
        {props => <MainScreenNavigator {...props} userType={userType} route={props.route} ref={mainTabRef} />}
      </Stack.Screen>
      {/* Medications */}
      <Stack.Screen 
        name="AddMedication" 
        component={AddMedicationScreen} 
        options={{ 
          headerAccessibilityLabel: 'Add medication screen',
        }} 
      />
      <Stack.Screen 
        name="MedicationDetails" 
        component={MedicationDetailsScreen} 
        options={{ 
          headerAccessibilityLabel: 'Medication details screen',
        }} 
      />
      <Stack.Screen 
        name="MedicationHistory" 
        component={MedicationHistoryScreen} 
        options={{ 
          headerAccessibilityLabel: 'Medication history screen',
        }} 
      />
      {/* Health */}
      <Stack.Screen 
        name="HealthCheckin" 
        component={HealthCheckinScreen} 
        options={{ 
          headerAccessibilityLabel: 'Daily health check-in screen',
        }} 
      />
      {/* Brain Training */}
      <Stack.Screen 
        name="BrainGame" 
        component={BrainGameScreen} 
      />
      <Stack.Screen 
        name="BrainGameCategory" 
        component={BrainGameCategoryScreen} 
      />
      <Stack.Screen 
        name="QuickBrainGame" 
        component={QuickBrainGameScreen} 
      />
      {/* Emergency */}
      <Stack.Screen 
        name="Emergency" 
        component={EmergencyScreen} 
        options={{ 
          headerAccessibilityLabel: 'Emergency screen',
        }} 
      />
      <Stack.Screen 
        name="EmergencyContacts" 
        component={EmergencyContactsScreen} 
        options={{ 
          headerAccessibilityLabel: 'Emergency contacts screen',
        }} 
      />
      <Stack.Screen 
        name="AddEmergencyContact" 
        component={AddEmergencyContactScreen} 
        options={{ 
          headerAccessibilityLabel: 'Add emergency contact screen',
        }} 
      />
      <Stack.Screen 
        name="MedicalInfo" 
        component={MedicalInfoScreen} 
        options={{ 
          headerAccessibilityLabel: 'Medical information screen',
        }} 
      />
      <Stack.Screen 
        name="ShareLocation" 
        component={ShareLocationScreen} 
        options={{ 
          headerAccessibilityLabel: 'Share location screen',
        }} 
      />
      {/* Settings/Profile */}
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ 
          headerAccessibilityLabel: 'Settings screen',
        }} 
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{ 
          headerAccessibilityLabel: 'Edit profile screen',
        }} 
      />
      <Stack.Screen 
        name="VoiceAssistant" 
        component={VoiceAssistantScreen} 
        options={{ 
          headerAccessibilityLabel: 'Voice assistant screen',
        }} 
      />
      <Stack.Screen 
        name="ThemePreview" 
        component={ThemePreviewScreen} 
        options={{ 
          headerAccessibilityLabel: 'Theme preview screen',
        }} 
      />
      <Stack.Screen 
        name="SafeZones" 
        component={SafeZonesScreen} 
        options={{ 
          headerAccessibilityLabel: 'Safe zones screen',
        }} 
      />
      <Stack.Screen 
        name="AddSafeZone" 
        component={AddSafeZoneScreen} 
        options={{ 
          headerAccessibilityLabel: 'Add safe zone screen',
        }} 
      />
      <Stack.Screen 
        name="EditSafeZone" 
        component={EditSafeZoneScreen} 
        options={{ 
          headerAccessibilityLabel: 'Edit safe zone screen',
        }} 
      />
      <Stack.Screen 
        name="DataPrivacy" 
        component={DataPrivacyScreen} 
        options={{ 
          headerAccessibilityLabel: 'Data privacy screen',
        }} 
      />
      <Stack.Screen 
        name="Help" 
        component={HelpScreen} 
        options={{ 
          headerAccessibilityLabel: 'Help screen',
        }} 
      />
      <Stack.Screen 
        name="ContactSupport" 
        component={ContactSupportScreen} 
        options={{ 
          headerAccessibilityLabel: 'Contact support screen',
        }} 
      />
      <Stack.Screen 
        name="About" 
        component={AboutScreen} 
        options={{ 
          headerAccessibilityLabel: 'About screen',
        }} 
      />
      <Stack.Screen 
        name="ExportData" 
        component={ExportDataScreen} 
        options={{ 
          headerAccessibilityLabel: 'Export data screen',
        }} 
      />
      {/* Calling */}
      <Stack.Screen 
        name="Call" 
        component={CallScreen} 
        options={{ 
          presentation: 'modal', 
          gestureEnabled: false,
        }} 
      />
      {/* Family & Caregivers */}
      <Stack.Screen 
        name="ElderlyDetailsScreen" 
        component={ElderlyDetailsScreen} 
        options={{ 
          headerAccessibilityLabel: 'Elderly details screen',
        }} 
      />
      <Stack.Screen 
        name="InviteFamily" 
        component={InviteFamilyScreen} 
        options={{ 
          headerAccessibilityLabel: 'Invite family member screen',
        }} 
      />
      <Stack.Screen 
        name="InviteAcceptance" 
        component={InviteAcceptanceScreen} 
        options={{ 
          presentation: 'modal', 
          gestureEnabled: true,
          headerAccessibilityLabel: 'Accept family invitation screen',
        }} 
      />
      <Stack.Screen 
        name="ManagePermissions" 
        component={ManagePermissionsScreen} 
        options={{ 
          headerAccessibilityLabel: 'Manage permissions screen',
        }} 
      />
      <Stack.Screen 
        name="ResetPassword" 
        component={ResetPasswordScreen} 
        options={{ headerAccessibilityLabel: 'Reset password screen' }} 
      />
    </Stack.Navigator>
  );
};


// Global flag for forced navigation to ResetPasswordScreen
let forceResetPasswordScreen = false;
let resetPasswordParams = null;

export const setForceResetPasswordScreen = (params) => {
  forceResetPasswordScreen = true;
  resetPasswordParams = params;
};
export const clearForceResetPasswordScreen = () => {
  forceResetPasswordScreen = false;
  resetPasswordParams = null;
};


// Main App Navigator

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return null; // Or a loading screen component
  }
  // Always use navigator for screen rendering
  return isAuthenticated ? <MainStackNavigator /> : <AuthNavigator />;
};

export default AppNavigator;
