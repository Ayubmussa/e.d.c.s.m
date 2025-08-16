import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Switch,
  RefreshControl,
} from 'react-native';
import { Surface, Avatar, Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ThemedText, ThemedHeading, ThemedCardTitle } from '../../components/common/ThemedText';
import { WellnessCard, QuickActionCard, HealthMetricCard } from '../../components/common/CustomCards';
import { CustomButton } from '../../components/common/CustomButton';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import emergencyService from '../../services/emergencyService';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';

const EmergencyScreen = (props) => {
  const navigation = props.navigation || useNavigation();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [fallDetectionEnabled, setFallDetectionEnabled] = useState(false);
  const [sosEnabled, setSosEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { scheduleNotification } = useNotification();

  useEffect(() => {
    loadEmergencySettings();
    getCurrentLocation();
  }, []);

  const loadEmergencySettings = async () => {
    try {
      setLoading(true);
      const [contactsResponse, settingsResponse] = await Promise.all([
        emergencyService.getEmergencyContacts(),
        emergencyService.getEmergencySettings()
      ]);
      
      setEmergencyContacts(contactsResponse.data.contacts || []);
      setFallDetectionEnabled(settingsResponse.data.fallDetectionEnabled);
      setSosEnabled(settingsResponse.data.sosEnabled);
    } catch (error) {
      console.error('Error loading emergency settings:', error);
      Alert.alert('Error', 'Failed to load emergency settings');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEmergencySettings();
    setRefreshing(false);
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleEmergencyCall = async () => {
    Alert.alert(
      'Emergency Call',
      'This will call emergency services (911). Do you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 911',
          style: 'destructive',
          onPress: () => {
            const phoneNumber = Platform.OS === 'ios' ? 'tel:911' : 'tel:911';
            Linking.openURL(phoneNumber);
            
            // Log emergency call
            emergencyService.logEmergencyEvent({
              type: 'emergency_call',
              location: currentLocation?.coords,
              timestamp: new Date().toISOString()
            });
          },
        },
      ]
    );
  };

  const handleSOSAlert = async () => {
    try {
      Alert.alert(
        'SOS Alert',
        'This will send an emergency alert to all your emergency contacts. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send SOS',
            style: 'destructive',
            onPress: async () => {
              const alertData = {
                type: 'sos',
                location: currentLocation?.coords,
                timestamp: new Date().toISOString(),
                message: 'Emergency SOS alert triggered'
              };

              await emergencyService.sendSOSAlert(alertData);
              
              // Send notifications to contacts
              (emergencyContacts || []).forEach(contact => {
                scheduleNotification({
                  title: 'Emergency SOS Alert',
                  body: `${contact.name} has sent an emergency SOS alert`,
                  data: alertData
                });
              });

              Alert.alert('SOS Sent', 'Emergency alert has been sent to your contacts.');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send SOS alert');
    }
  };

  const handleFallDetectionToggle = async (value) => {
    try {
      await emergencyService.updateEmergencySettings({
        fallDetectionEnabled: value
      });
      setFallDetectionEnabled(value);
      
      if (value) {
        Alert.alert(
          'Fall Detection Enabled',
          'Your device will now monitor for potential falls and automatically alert emergency contacts if detected.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update fall detection setting');
    }
  };

  const handleSOSToggle = async (value) => {
    try {
      await emergencyService.updateEmergencySettings({
        sosEnabled: value
      });
      setSosEnabled(value);
    } catch (error) {
      Alert.alert('Error', 'Failed to update SOS setting');
    }
  };

  const callContact = (contact) => {
    // Try different possible field names for phone number (prioritize phone_number from database)
    const phoneNumber = contact.phone_number || contact.phone || contact.phoneNumber;
    
    if (!phoneNumber) {
      Alert.alert('Error', 'No phone number available for this contact');
      return;
    }

    // Clean the phone number (remove spaces, dashes, etc.)
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Format for tel: URL
    const telUrl = `tel:${cleanPhone}`;
    
    // Direct call to Linking.openURL without canOpenURL check
    // This is more reliable on actual devices
    Linking.openURL(telUrl).catch(err => {
      console.error('Error opening phone dialer:', err);
      
      // Show a more helpful error message with options
      Alert.alert(
        'Unable to Make Call',
        `Could not open phone dialer for ${phoneNumber}. You can copy the number to dial manually.`,
        [
          {
            text: 'Copy Number',
            onPress: async () => {
              try {
                await Clipboard.setStringAsync(phoneNumber);
                Alert.alert('Copied!', `Phone number ${phoneNumber} has been copied to clipboard`);
              } catch (error) {
                console.error('Error copying to clipboard:', error);
                Alert.alert('Phone Number', phoneNumber);
              }
            }
          },
          { text: 'OK', style: 'cancel' }
        ]
      );
    });
  };

  const renderEmergencyContact = (contact, index) => (
    <Surface
      key={contact._id || contact.id || index}
      style={{
        padding: 16,
        marginBottom: 8,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <Avatar.Icon
          size={40}
          icon="account"
          style={{ backgroundColor: theme.colors.primary, marginRight: 12 }}
          color="#fff"
        />
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>
            {contact.name}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
            {contact.relationship} • {contact.phone_number}
          </Text>
          {contact.email && (
            <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
              {contact.email}
            </Text>
          )}
        </View>
      </View>
      <Button
        mode="contained"
        compact
        icon="phone"
        style={{ borderRadius: 18, backgroundColor: theme.colors.primary }}
        labelStyle={{ color: '#fff', fontWeight: 'bold' }}
        onPress={() => callContact(contact)}
      >
        Call
      </Button>
    </Surface>
  );

  const quickActions = [
    {
      title: 'Call 911',
      icon: 'phone-alert',
      color: '#F44336',
      onPress: handleEmergencyCall,
      description: 'Direct call to emergency services'
    },
    {
      title: 'Send SOS',
      icon: 'alert',
      color: '#FF9800',
      onPress: handleSOSAlert,
      description: 'Alert all emergency contacts'
    },
    {
      title: 'Medical Info',
      icon: 'medical-bag',
      color: '#2196F3',
      onPress: () => {
        if (!navigation || typeof navigation.navigate !== 'function') {
          Alert.alert('Navigation Error', 'Navigation is not available.');
          return;
        }
        navigation.navigate('MedicalInfo');
      },
      description: 'Show medical information'
    },
    {
      title: 'Share Location',
      icon: 'map-marker',
      color: '#4CAF50',
      onPress: () => {
        if (!navigation || typeof navigation.navigate !== 'function') {
          Alert.alert('Navigation Error', 'Navigation is not available.');
          return;
        }
        navigation.navigate('ShareLocation');
      },
      description: 'Share current location'
    }
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons 
          name="phone-alert" 
          size={48} 
          color={theme.colors.primary} 
        />
        <ThemedText variant="bodyLarge" style={styles.loadingText}>
          Loading emergency settings...
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <ThemedHeading variant="headlineMedium" style={styles.sectionTitle}>
            Quick Actions
          </ThemedHeading>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <QuickActionCard
                key={index}
                title={action.title}
                description={action.description}
                icon={action.icon}
                color={action.color}
                onPress={action.onPress}
                style={styles.quickActionCard}
              />
            ))}
          </View>
        </View>

        {/* Safety Settings */}
        <View style={styles.settingsSection}>
          <ThemedHeading variant="headlineMedium" style={styles.sectionTitle}>
            Safety Settings
          </ThemedHeading>
          <View style={styles.settingsContainer}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <ThemedCardTitle style={styles.settingTitle}>
                  Fall Detection
                </ThemedCardTitle>
                <ThemedText variant="bodyMedium" style={styles.settingDescription}>
                  Automatically detect falls and alert contacts
                </ThemedText>
              </View>
              <Switch
                value={fallDetectionEnabled}
                onValueChange={handleFallDetectionToggle}
                thumbColor={fallDetectionEnabled ? theme.colors.primary : theme.colors.surface}
                trackColor={{ false: theme.colors.surface, true: theme.colors.primary + '50' }}
              />
            </View>
            <View style={styles.settingDivider} />
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <ThemedCardTitle style={styles.settingTitle}>
                  SOS Alerts
                </ThemedCardTitle>
                <ThemedText variant="bodyMedium" style={styles.settingDescription}>
                  Enable quick SOS alerts to emergency contacts
                </ThemedText>
              </View>
              <Switch
                value={sosEnabled}
                onValueChange={handleSOSToggle}
                thumbColor={sosEnabled ? theme.colors.primary : theme.colors.surface}
                trackColor={{ false: theme.colors.surface, true: theme.colors.primary + '50' }}
              />
            </View>
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.contactsSection}>
          <View style={styles.sectionHeader}>
            <ThemedHeading variant="headlineMedium" style={styles.sectionTitle}>
              Emergency Contacts
            </ThemedHeading>
            <CustomButton
              mode="contained"
              style={styles.addButton}
              textColor="#FFFFFF"
              icon={({ size, color }) => (
                <MaterialCommunityIcons name="account-plus" size={24} color={color} style={{ marginLeft: 8 }} />
              )}
              onPress={() => {
                if (!navigation || typeof navigation.navigate !== 'function') {
                  Alert.alert('Navigation Error', 'Navigation is not available.');
                  return;
                }
                navigation.navigate('AddEmergencyContact');
              }}
            />
          </View>
          <View style={styles.contactsContainer}>
            {emergencyContacts.length === 0 ? (
              <View style={styles.emptyContactsContainer}>
                <MaterialCommunityIcons 
                  name="account-plus" 
                  size={18} 
                  color={theme.colors.primary} 
                />
                <ThemedHeading variant="headlineMedium" style={styles.emptyContactsTitle}>
                  No Emergency Contacts
                </ThemedHeading>
                <ThemedText variant="bodyLarge" style={styles.emptyContactsText}>
                  Add trusted contacts who will be notified in case of emergency
                </ThemedText>
                <CustomButton
                  mode="contained"
                  style={styles.addFirstContactButton}
                  onPress={() => {
                    if (!navigation || typeof navigation.navigate !== 'function') {
                      Alert.alert('Navigation Error', 'Navigation is not available.');
                      return;
                    }
                    navigation.navigate('AddEmergencyContact');
                  }}
                >
                  Add First Contact
                </CustomButton>
              </View>
            ) : (
              <View style={styles.contactsList}>
                {(emergencyContacts || []).map((contact, index) => (
                  <TouchableOpacity
                    key={contact._id || contact.id || index}
                    style={styles.contactCard}
                    activeOpacity={0.7}
                  >
                    <View style={styles.contactCardContent}>
                      <View style={styles.contactIconContainer}>
                        <MaterialCommunityIcons
                          name="account"
                          size={32}
                          color={theme.colors.primary}
                        />
                      </View>
                      <View style={styles.contactInfo}>
                        <ThemedCardTitle style={styles.contactName}>
                          {contact.name}
                        </ThemedCardTitle>
                        <ThemedText variant="bodyMedium" style={styles.contactDetails}>
                          {contact.relationship} • {contact.phone_number}
                        </ThemedText>
                        {contact.email && (
                          <ThemedText variant="bodySmall" style={styles.contactEmail}>
                            {contact.email}
                          </ThemedText>
                        )}
                      </View>
                      <CustomButton
                        mode="contained"
                        style={styles.callButton}
                        icon="phone"
                        onPress={() => callContact(contact)}
                      >
                        Call
                      </CustomButton>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Medical Information */}
        <View style={styles.medicalInfoSection}>
          <View style={styles.sectionHeader}>
            <ThemedHeading variant="headlineMedium" style={styles.sectionTitle}>
              Medical Information
            </ThemedHeading>
            <CustomButton
              mode="contained"
              style={styles.viewButton}
              textColor="#FFFFFF"
              icon={({ size, color }) => (
                <MaterialCommunityIcons name="eye" size={24} color={color} style={{ marginLeft: 8 }} />
              )}
              onPress={() => {
                if (!navigation || typeof navigation.navigate !== 'function') {
                  Alert.alert('Navigation Error', 'Navigation is not available.');
                  return;
                }
                navigation.navigate('MedicalInfo');
              }}
            />
          </View>
          <View style={styles.medicalInfoContainer}>
            <ThemedText variant="bodyLarge" style={styles.medicalInfoDescription}>
              Quick access to your medical information for first responders:
            </ThemedText>
            <View style={styles.medicalInfoChips}>
              <View style={styles.medicalChip}>
                <MaterialCommunityIcons name="pill" size={16} color={theme.colors.primary} />
                <ThemedText variant="bodyMedium" style={styles.chipText}>Medications</ThemedText>
              </View>
              <View style={styles.medicalChip}>
                <MaterialCommunityIcons name="alert" size={16} color={theme.colors.primary} />
                <ThemedText variant="bodyMedium" style={styles.chipText}>Allergies</ThemedText>
              </View>
              <View style={styles.medicalChip}>
                <MaterialCommunityIcons name="heart" size={16} color={theme.colors.primary} />
                <ThemedText variant="bodyMedium" style={styles.chipText}>Conditions</ThemedText>
              </View>
              <View style={styles.medicalChip}>
                <MaterialCommunityIcons name="account" size={16} color={theme.colors.primary} />
                <ThemedText variant="bodyMedium" style={styles.chipText}>Emergency Contacts</ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Location Status */}
        <View style={styles.locationSection}>
          <View style={styles.locationHeader}>
            <MaterialCommunityIcons 
              name="map-marker" 
              size={28} 
              color={currentLocation ? '#4CAF50' : '#FF9800'} 
            />
            <ThemedHeading variant="headlineMedium" style={styles.locationTitle}>
              Location Services
            </ThemedHeading>
          </View>
          <ThemedText variant="bodyLarge" style={styles.locationDescription}>
            {currentLocation 
              ? 'Location services enabled - emergency responders can find you' 
              : 'Location services disabled - consider enabling for emergency situations'
            }
          </ThemedText>
          {!currentLocation && (
            <CustomButton
              mode="contained"
              style={styles.enableLocationButton}
              textColor="#FFFFFF"
              icon="map-marker"
              onPress={getCurrentLocation}
            >
              Enable Location
            </CustomButton>
          )}
        </View>

        {/* Emergency Button */}
        <View style={styles.emergencyButtonContainer}>
          <CustomButton
            mode="contained"
            onPress={handleEmergencyCall}
            style={styles.emergencyButton}
            textColor="#FFFFFF"
            icon="phone-alert"
          >
            Emergency Call
          </CustomButton>
        </View>

        {/* Extra spacing for better scrolling */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default EmergencyScreen;

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    padding: theme.spacing.md,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  loadingText: {
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  
  // Section Headers
  sectionTitle: {
    marginBottom: theme.spacing.md,
    color: theme.colors.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  
  // Quick Actions
  quickActionsSection: {
    marginBottom: theme.spacing.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    minHeight: 120,
  },
  
  // Safety Settings
  settingsSection: {
    marginBottom: theme.spacing.lg,
  },
  settingsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    minHeight: 60,
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingTitle: {
    marginBottom: theme.spacing.xs,
  },
  settingDescription: {
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  settingDivider: {
    height: 1,
    backgroundColor: theme.colors.outline,
    opacity: 0.3,
    marginVertical: theme.spacing.sm,
  },
  
  // Emergency Contacts
  contactsSection: {
    marginBottom: theme.spacing.lg,
  },
  contactsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  addButton: {
    borderRadius: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 4,
    borderWidth: 0,
    backgroundColor: theme.colors.primary,
    flexShrink: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    width: 140,
    minHeight: 40,
  },
  emptyContactsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyContactsTitle: {
    textAlign: 'center',
    color: theme.colors.primary,
  },
  emptyContactsText: {
    textAlign: 'center',
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  addFirstContactButton: {
    minWidth: 150,
    borderRadius: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  contactsList: {
    gap: theme.spacing.md,
  },
  contactCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 80,
  },
  contactCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    marginBottom: theme.spacing.xs,
  },
  contactDetails: {
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  contactEmail: {
    color: theme.colors.onSurface,
    opacity: 0.6,
    marginTop: theme.spacing.xs,
  },
  callButton: {
    minWidth: 60,
    borderRadius: theme.spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    elevation: 1,
  },
  
  // Medical Information
  medicalInfoSection: {
    marginBottom: theme.spacing.lg,
  },
  medicalInfoContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  medicalInfoDescription: {
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.md,
  },
  medicalInfoChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  medicalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  chipText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  viewButton: {
    borderRadius: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 4,
    borderWidth: 0,
    backgroundColor: theme.colors.primary,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    width: 140,
    minHeight: 40,
  },
  
  // Location Status
  locationSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: theme.spacing.lg,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  locationTitle: {
    color: theme.colors.primary,
    fontSize: 20,
  },
  locationDescription: {
    color: theme.colors.onSurface,
    opacity: 0.7,
    marginBottom: theme.spacing.md,
  },
  enableLocationButton: {
    alignSelf: 'flex-start',
    borderRadius: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 4,
    borderWidth: 0,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.md,
  },
  
  // Emergency Button
  emergencyButtonContainer: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  emergencyButton: {
    minWidth: 200,
    borderRadius: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#F44336',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});
