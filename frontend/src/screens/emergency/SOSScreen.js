import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  Dimensions,
  ActivityIndicator,
  Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { AuthContext } from '../../context/AuthContext';
import { theme } from '../../theme';
import apiService from '../../services/apiService';

const { width, height } = Dimensions.get('window');

const SOSScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [isEmergency, setIsEmergency] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [location, setLocation] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadEmergencyContacts();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    let interval = null;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      triggerEmergency();
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const loadEmergencyContacts = async () => {
    try {
      const response = await apiService.get('/family/emergency-contacts');
      if (response.success) {
        setEmergencyContacts(response.data || []);
      }
    } catch (error) {
      console.error('Load emergency contacts error:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get location error:', error);
    }
  };

  const handleSOSPress = () => {
    // Start 5-second countdown with vibration
    setCountdown(5);
    Vibration.vibrate([0, 200, 100, 200]);
    
    Alert.alert(
      'Emergency Alert',
      'Emergency services will be contacted in 5 seconds. Press Cancel to abort.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setCountdown(null);
            Vibration.cancel();
          }
        }
      ]
    );
  };

  const triggerEmergency = async () => {
    setIsEmergency(true);
    setIsLoading(true);
    setCountdown(null);

    // Strong vibration pattern for emergency
    Vibration.vibrate([0, 500, 200, 500, 200, 500]);

    try {
      // Get fresh location before sending emergency
      await getCurrentLocation();

      const emergencyData = {
        userId: user.id,
        userProfile: {
          name: user?.user_metadata?.full_name || 'Unknown User',
          email: user?.email || 'No email',
          phone: user?.user_metadata?.phone || 'No phone'
        },
        location: location,
        timestamp: new Date().toISOString(),
        emergencyType: 'SOS_BUTTON',
        description: 'Emergency SOS button activated by user'
      };

      // Trigger emergency alert
      const response = await apiService.post('/emergency/trigger-alert', emergencyData);

      if (response.success) {
        Alert.alert(
          'Emergency Alert Sent',
          'Emergency services and your caregivers have been notified. Help is on the way.',
          [
            {
              text: 'OK',
              onPress: () => {
                setIsEmergency(false);
                // Stay on screen for continued emergency actions
              }
            }
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to send emergency alert');
      }
    } catch (error) {
      console.error('Emergency trigger error:', error);
      Alert.alert(
        'Emergency Alert Failed',
        'Failed to send emergency alert. Please try calling emergency services directly.',
        [
          {
            text: 'Call 911',
            onPress: () => {
              // This would typically open the phone dialer
              Alert.alert('Please call 911 directly');
            }
          },
          {
            text: 'Retry',
            onPress: () => triggerEmergency()
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'call_911':
        Alert.alert(
          'Call Emergency Services',
          'This will call 911 directly. Are you sure?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Call 911', 
              onPress: () => {
                // In a real app, this would use Linking to open phone dialer
                Alert.alert('Calling 911...');
              }
            }
          ]
        );
        break;
      case 'medical_emergency':
        if (!navigation || typeof navigation.navigate !== 'function') {
          Alert.alert('Navigation Error', 'Navigation is not available.');
          break;
        }
        navigation.navigate('DirectEmailScreen');
        break;
      case 'send_location':
        shareLocationWithContacts();
        break;
      case 'invite_caregiver':
        if (!navigation || typeof navigation.navigate !== 'function') {
          Alert.alert('Navigation Error', 'Navigation is not available.');
          break;
        }
        navigation.navigate('InviteCaregiverScreen');
        break;
    }
  };

  const shareLocationWithContacts = async () => {
    if (!location) {
      Alert.alert('Location Unavailable', 'Unable to get current location. Please try again.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiService.post('/emergency/share-location', {
        location: location,
        message: 'I am sharing my current location with you for safety purposes.',
        contacts: emergencyContacts
      });

      if (response.success) {
        Alert.alert(
          'Location Shared',
          'Your current location has been shared with your emergency contacts.'
        );
      }
    } catch (error) {
      console.error('Share location error:', error);
      Alert.alert('Error', 'Failed to share location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency SOS</Text>
        <Text style={styles.subtitle}>
          Press and hold the SOS button for emergency assistance
        </Text>
      </View>

      {countdown !== null && (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownText}>
            Emergency alert in {countdown} seconds
          </Text>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setCountdown(null);
              Vibration.cancel();
            }}
          >
            <Text style={styles.cancelButtonText}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.sosContainer}>
        <TouchableOpacity
          style={[
            styles.sosButton,
            isEmergency && styles.sosButtonActive,
            countdown !== null && styles.sosButtonCountdown
          ]}
          onPress={handleSOSPress}
          disabled={isLoading || countdown !== null}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="white" />
          ) : (
            <>
              <MaterialCommunityIcons 
                name="alert-octagon" 
                size={80} 
                color="white" 
              />
              <Text style={styles.sosButtonText}>SOS</Text>
              {countdown !== null && (
                <Text style={styles.sosCountdownText}>{countdown}</Text>
              )}
            </>
          )}
        </TouchableOpacity>
        
        <Text style={styles.sosInstructions}>
          {countdown !== null 
            ? 'Release to cancel emergency alert'
            : 'Tap to send emergency alert'
          }
        </Text>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.quickActionsTitle}>Quick Emergency Actions</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleQuickAction('call_911')}
            disabled={isLoading}
          >
            <MaterialCommunityIcons 
              name="phone" 
              size={24} 
              color={theme.colors.error} 
            />
            <Text style={styles.actionButtonText}>Call 911</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleQuickAction('medical_emergency')}
            disabled={isLoading}
          >
            <MaterialCommunityIcons 
              name="email-alert" 
              size={24} 
              color={theme.colors.error} 
            />
            <Text style={styles.actionButtonText}>Send Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleQuickAction('send_location')}
            disabled={isLoading || !location}
          >
            <MaterialCommunityIcons 
              name="map-marker-alert" 
              size={24} 
              color={theme.colors.primary} 
            />
            <Text style={styles.actionButtonText}>Share Location</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleQuickAction('invite_caregiver')}
            disabled={isLoading}
          >
            <MaterialCommunityIcons 
              name="account-plus" 
              size={24} 
              color={theme.colors.primary} 
            />
            <Text style={styles.actionButtonText}>Invite Caregiver</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statusInfo}>
        <View style={styles.statusItem}>
          <MaterialCommunityIcons 
            name="map-marker" 
            size={16} 
            color={location ? theme.colors.success : theme.colors.error} 
          />
          <Text style={styles.statusText}>
            Location: {location ? 'Available' : 'Not Available'}
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          <MaterialCommunityIcons 
            name="account-group" 
            size={16} 
            color={emergencyContacts.length > 0 ? theme.colors.success : theme.colors.warning} 
          />
          <Text style={styles.statusText}>
            Emergency Contacts: {emergencyContacts.length}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: theme.typography.h3.fontSize,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.body1.fontSize + 1,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  countdownContainer: {
    backgroundColor: theme.colors.error,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  countdownText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cancelButtonText: {
    color: theme.colors.error,
    fontWeight: 'bold',
    fontSize: 16,
  },
  sosContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  sosButton: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 20,
  },
  sosButtonActive: {
    backgroundColor: '#d32f2f',
    transform: [{ scale: 0.95 }],
  },
  sosButtonCountdown: {
    backgroundColor: '#ff5722',
  },
  sosButtonText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  sosCountdownText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    position: 'absolute',
  },
  sosInstructions: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  quickActions: {
    marginTop: 20,
  },
  quickActionsTitle: {
    fontSize: theme.typography.subtitle.fontSize,
    fontWeight: theme.typography.subtitle.fontWeight,
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: theme.colors.cardBackground,
    padding: 16,
    borderRadius: theme.roundness,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: theme.typography.caption.fontSize + 1,
    color: theme.colors.text.primary,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  statusInfo: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
});

export default SOSScreen;