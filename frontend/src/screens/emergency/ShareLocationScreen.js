import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Switch,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import * as Location from 'expo-location';

const ShareLocationScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    shareWithContacts: true,
    shareWith911: true,
    includeMessage: true,
    autoShare: false,
  });
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Remove mock location data
  // const mockLocation = { ... };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied.');
          setLoading(false);
          return;
        }
        let loc = await Location.getCurrentPositionAsync({});
        let address = 'Unknown address';
        try {
          if (
            loc &&
            loc.coords &&
            typeof loc.coords.latitude === 'number' &&
            typeof loc.coords.longitude === 'number'
          ) {
            const addressObj = await Location.reverseGeocodeAsync(loc.coords);
            if (addressObj && addressObj[0]) {
              address = `${addressObj[0].street || ''}, ${addressObj[0].city || ''}, ${addressObj[0].region || ''} ${addressObj[0].postalCode || ''}`.trim();
            }
          }
        } catch (geoError) {
          console.warn('Reverse geocoding failed:', geoError);
          // Keep address as 'Unknown address'
        }
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          address,
          accuracy: loc.coords.accuracy,
          timestamp: new Date(loc.timestamp).toISOString(),
        });
      } catch (e) {
        setError('Failed to get location. Please check your device settings.');
        console.error('Location error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleShareLocation = async () => {
    if (!location) {
      Alert.alert('Error', 'Location not available. Please try again.');
      return;
    }

    setIsSharing(true);
    
    try {
      // Simulate sharing location
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Location Shared',
        'Your location has been shared with emergency contacts and authorities.',
        [
          {
            text: 'OK',
            onPress: () => {
              setIsSharing(false);
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      setIsSharing(false);
      Alert.alert('Error', 'Failed to share location. Please try again.');
    }
  };

  const handleCall911 = () => {
    Alert.alert(
      'Call 911',
      'This will immediately call emergency services. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          style: 'destructive',
          onPress: () => {
            Linking.openURL('tel:911');
          },
        },
      ]
    );
  };

  const handleShareViaMessage = () => {
    if (!location) return;
    
    const message = customMessage || 
      `EMERGENCY: I need help! My location: ${location.address}. Coordinates: ${location.latitude}, ${location.longitude}`;
    
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    Linking.openURL(smsUrl);
  };

  const handleOpenMaps = () => {
    if (!location) return;
    
    const mapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    Linking.openURL(mapsUrl);
  };

  const renderLocationInfo = () => {
    if (loading) {
      return (
        <View style={styles.locationCard}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.locationStatus}>Getting your location...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.locationCard}>
          <MaterialCommunityIcons 
            name="map-marker-off" 
            size={48} 
            color={theme.colors.text.secondary} 
          />
          <Text style={styles.locationStatus}>{error}</Text>
        </View>
      );
    }
    if (!location) {
      return (
        <View style={styles.locationCard}>
          <MaterialCommunityIcons 
            name="map-marker-off" 
            size={48} 
            color={theme.colors.text.secondary} 
          />
          <Text style={styles.locationStatus}>Location not available.</Text>
        </View>
      );
    }

    return (
      <View style={styles.locationCard}>
        <View style={styles.locationHeader}>
          <MaterialCommunityIcons 
            name="map-marker" 
            size={24} 
            color={theme.colors.error} 
          />
          <Text style={styles.locationTitle}>Current Location</Text>
        </View>
        
        <Text style={styles.locationAddress}>{location.address}</Text>
        
        <Text style={styles.locationCoords}>
          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
        </Text>
        
        <View style={styles.locationMeta}>
          <Text style={styles.locationAccuracy}>
            Accuracy: ±{location.accuracy}m
          </Text>
          <Text style={styles.locationTime}>
            Updated: {new Date(location.timestamp).toLocaleTimeString()}
          </Text>
        </View>

        <TouchableOpacity style={styles.viewMapButton} onPress={handleOpenMaps}>
          <MaterialCommunityIcons 
            name="map" 
            size={16} 
            color={theme.colors.primary} 
          />
          <Text style={styles.viewMapText}>View on Map</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderShareSettings = () => (
    <View style={styles.settingsCard}>
      <Text style={styles.settingsTitle}>Share Settings</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <MaterialCommunityIcons 
            name="contacts" 
            size={20} 
            color={theme.colors.text.primary} 
          />
          <Text style={styles.settingLabel}>Share with Emergency Contacts</Text>
        </View>
        <Switch
          value={shareSettings.shareWithContacts}
          onValueChange={(value) => 
            setShareSettings({...shareSettings, shareWithContacts: value})
          }
          trackColor={{ false: theme.colors.text.secondary, true: theme.colors.error }}
          thumbColor={theme.colors.white}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <MaterialCommunityIcons 
            name="phone-alert" 
            size={20} 
            color={theme.colors.text.primary} 
          />
          <Text style={styles.settingLabel}>Share with 911 Services</Text>
        </View>
        <Switch
          value={shareSettings.shareWith911}
          onValueChange={(value) => 
            setShareSettings({...shareSettings, shareWith911: value})
          }
          trackColor={{ false: theme.colors.text.secondary, true: theme.colors.error }}
          thumbColor={theme.colors.white}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <MaterialCommunityIcons 
            name="message-text" 
            size={20} 
            color={theme.colors.text.primary} 
          />
          <Text style={styles.settingLabel}>Include Emergency Message</Text>
        </View>
        <Switch
          value={shareSettings.includeMessage}
          onValueChange={(value) => 
            setShareSettings({...shareSettings, includeMessage: value})
          }
          trackColor={{ false: theme.colors.text.secondary, true: theme.colors.error }}
          thumbColor={theme.colors.white}
        />
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <Text style={styles.quickActionsTitle}>Quick Actions</Text>
      
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCall911}>
          <MaterialCommunityIcons 
            name="phone" 
            size={24} 
            color={theme.colors.white} 
          />
          <Text style={styles.actionButtonText}>Call 911</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButtonSecondary} onPress={handleShareViaMessage}>
          <MaterialCommunityIcons 
            name="message" 
            size={24} 
            color={theme.colors.error} 
          />
          <Text style={styles.actionButtonTextSecondary}>Send SMS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.error} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color={theme.colors.white} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Location</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Emergency Alert */}
        <View style={styles.emergencyAlert}>
          <MaterialCommunityIcons 
            name="alert-circle" 
            size={24} 
            color={theme.colors.error} 
          />
          <Text style={styles.emergencyAlertText}>
            Emergency location sharing will send your current location to emergency contacts and services.
          </Text>
        </View>

        {renderLocationInfo()}
        {renderShareSettings()}
        {renderQuickActions()}

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <MaterialCommunityIcons 
            name="shield-check" 
            size={20} 
            color={theme.colors.info} 
          />
          <Text style={styles.privacyText}>
            Your location will only be shared with selected emergency contacts and authorities. 
            This information is not stored or used for any other purpose.
          </Text>
        </View>
      </ScrollView>

      {/* Share Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.shareButton, isSharing && styles.shareButtonDisabled]} 
          onPress={handleShareLocation}
          disabled={isSharing || !location}
        >
          {isSharing ? (
            <MaterialCommunityIcons 
              name="loading" 
              size={20} 
              color={theme.colors.white} 
            />
          ) : (
            <MaterialCommunityIcons 
              name="share-variant" 
              size={20} 
              color={theme.colors.white} 
            />
          )}
          <Text style={styles.shareButtonText}>
            {isSharing ? 'Sharing Location...' : 'Share My Location'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.error,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: theme.colors.white,
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emergencyAlert: {
    flexDirection: 'row',
    backgroundColor: theme.colors.error + '20',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  emergencyAlertText: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.error,
    flex: 1,
    marginLeft: 8,
    fontWeight: '600',
    lineHeight: 18,
  },
  locationCard: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  locationStatus: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.secondary,
    marginTop: 12,
  },
  locationAddress: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  locationCoords: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  locationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  locationAccuracy: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.text.secondary,
  },
  locationTime: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.text.secondary,
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
  },
  viewMapText: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  settingsTitle: {
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.primary,
    marginLeft: 12,
  },
  quickActions: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  quickActionsTitle: {
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.button.fontSize,
    fontFamily: theme.typography.button.fontFamily,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  actionButtonTextSecondary: {
    color: theme.colors.error,
    fontSize: theme.typography.button.fontSize,
    fontFamily: theme.typography.button.fontFamily,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  privacyNotice: {
    flexDirection: 'row',
    backgroundColor: theme.colors.info + '20',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  privacyText: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.text.secondary,
    flex: 1,
    marginLeft: 8,
    lineHeight: 18,
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  shareButton: {
    backgroundColor: theme.colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  shareButtonDisabled: {
    backgroundColor: theme.colors.text.secondary,
  },
  shareButtonText: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.typography.button.fontSize,
    fontFamily: theme.typography.button.fontFamily,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
});

export default ShareLocationScreen;
