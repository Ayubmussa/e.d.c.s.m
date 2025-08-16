import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Switch,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MapView, Marker, Circle } from '../../components/common/PlatformMap';
import * as Location from 'expo-location';
import Slider from '@react-native-community/slider';
import { theme } from '../../theme';
import apiService from '../../services/apiService';

const AddSafeZoneScreen = ({ navigation, route }) => {
  // Get passed current location, or use a default
  const initialLocation = route.params?.currentLocation || {
    latitude: 37.78825,
    longitude: -122.4324
  };

  const [safeZone, setSafeZone] = useState({
    name: '',
    description: '',
    latitude: initialLocation.latitude,
    longitude: initialLocation.longitude,
    radius: 100, // meters
    isActive: true,
    alertOnEntry: true,
    alertOnExit: true,
    notificationMessage: ''
  });

  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: initialLocation.latitude,
    longitude: initialLocation.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to create safe zones.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(newLocation);
      
      // If no initial location was provided, use current location
      if (!route.params?.currentLocation) {
        setSafeZone(prev => ({
          ...prev,
          latitude: newLocation.latitude,
          longitude: newLocation.longitude
        }));
        setMapRegion(prev => ({
          ...prev,
          latitude: newLocation.latitude,
          longitude: newLocation.longitude
        }));
      }
    } catch (error) {
      console.error('Get location error:', error);
      Alert.alert('Error', 'Failed to get current location. Please try again.');
    }
  };

  const handleMapPress = (event) => {
    const coordinate = event.nativeEvent.coordinate;
    if (coordinate) {
      setSafeZone(prev => ({
        ...prev,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude
      }));
    }
  };

  const handleSaveSafeZone = async () => {
    if (!safeZone.name.trim()) {
      Alert.alert('Error', 'Please enter a name for the safe zone');
      return;
    }

    if (safeZone.radius < 5 || safeZone.radius > 1000) {
      Alert.alert('Error', 'Radius must be between 5 and 1000 meters');
      return;
    }

    setLoading(true);

    try {
      const safeZoneData = {
        name: safeZone.name.trim(),
        description: safeZone.description.trim(),
        center_latitude: safeZone.latitude,
        center_longitude: safeZone.longitude,
        radius_meters: Math.round(safeZone.radius),
        is_active: safeZone.isActive,
        alert_on_enter: safeZone.alertOnEntry,
        alert_on_exit: safeZone.alertOnExit,
        notification_message: safeZone.notificationMessage.trim() || `Safe zone "${safeZone.name}" alert`
      };

      const response = await apiService.post('/api/geofencing/safe-zones', safeZoneData);

      if (response.success) {
        Alert.alert(
          'Safe Zone Created',
          `"${safeZone.name}" has been created successfully.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to create safe zone');
      }
    } catch (error) {
      console.error('Save safe zone error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create safe zone. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const useCurrentLocation = () => {
    if (currentLocation) {
      setSafeZone(prev => ({
        ...prev,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      }));
      setMapRegion(prev => ({
        ...prev,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      }));
    } else {
      getCurrentLocation();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <MaterialCommunityIcons 
          name="shield-plus" 
          size={40} 
          color={theme.colors.primary} 
        />
        <Text style={styles.title}>Create Safe Zone</Text>
        <Text style={styles.subtitle}>
          Set up a safe zone to receive alerts when entering or leaving this area
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Safe Zone Name *</Text>
          <TextInput
            style={styles.input}
            value={safeZone.name}
            onChangeText={(text) => setSafeZone(prev => ({ ...prev, name: text }))}
            placeholder="e.g., Home, Work, Hospital"
            maxLength={50}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={safeZone.description}
            onChangeText={(text) => setSafeZone(prev => ({ ...prev, description: text }))}
            placeholder="Add any additional notes about this safe zone"
            multiline
            numberOfLines={3}
            maxLength={200}
          />
        </View>

        <View style={styles.locationSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity
              style={styles.currentLocationButton}
              onPress={useCurrentLocation}
            >
              <MaterialCommunityIcons 
                name="crosshairs-gps" 
                size={16} 
                color={theme.colors.primary} 
              />
              <Text style={styles.currentLocationText}>Use Current Location</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={mapRegion}
              onPress={handleMapPress}
              onRegionChangeComplete={setMapRegion}
            >
              <Marker
                coordinate={{
                  latitude: safeZone.latitude,
                  longitude: safeZone.longitude,
                }}
                title={safeZone.name || "Safe Zone Center"}
                description="Tap on map to move this location"
              />
              <Circle
                center={{
                  latitude: safeZone.latitude,
                  longitude: safeZone.longitude,
                }}
                radius={safeZone.radius}
                strokeColor={theme.colors.primary}
                fillColor={`${theme.colors.primary}20`}
                strokeWidth={2}
              />
              {currentLocation && (
                <Marker
                  coordinate={currentLocation}
                  title="Current Location"
                  pinColor="blue"
                />
              )}
            </MapView>
          </View>

          <View style={styles.coordinatesInfo}>
            <Text style={styles.coordinatesText}>
              Latitude: {safeZone.latitude.toFixed(6)}
            </Text>
            <Text style={styles.coordinatesText}>
              Longitude: {safeZone.longitude.toFixed(6)}
            </Text>
          </View>
        </View>

        <View style={styles.radiusSection}>
          <Text style={styles.label}>Radius: {Math.round(safeZone.radius)} meters</Text>
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={1000}
            value={safeZone.radius}
            onValueChange={(value) => setSafeZone(prev => ({ ...prev, radius: value }))}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbStyle={{ backgroundColor: theme.colors.primary }}
            step={5}
          />
          <View style={styles.radiusLabels}>
            <Text style={styles.radiusLabel}>5m</Text>
            <Text style={styles.radiusLabel}>1000m</Text>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Alert Settings</Text>
          
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Active</Text>
              <Text style={styles.switchDescription}>Enable monitoring for this safe zone</Text>
            </View>
            <Switch
              value={safeZone.isActive}
              onValueChange={(value) => setSafeZone(prev => ({ ...prev, isActive: value }))}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={safeZone.isActive ? theme.colors.primary : theme.colors.textSecondary}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Alert on Entry</Text>
              <Text style={styles.switchDescription}>Notify when entering this zone</Text>
            </View>
            <Switch
              value={safeZone.alertOnEntry}
              onValueChange={(value) => setSafeZone(prev => ({ ...prev, alertOnEntry: value }))}
              trackColor={{ false: theme.colors.border, true: theme.colors.success }}
              thumbColor={safeZone.alertOnEntry ? theme.colors.success : theme.colors.textSecondary}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Alert on Exit</Text>
              <Text style={styles.switchDescription}>Notify when leaving this zone</Text>
            </View>
            <Switch
              value={safeZone.alertOnExit}
              onValueChange={(value) => setSafeZone(prev => ({ ...prev, alertOnExit: value }))}
              trackColor={{ false: theme.colors.border, true: theme.colors.warning }}
              thumbColor={safeZone.alertOnExit ? theme.colors.warning : theme.colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Custom Notification Message (Optional)</Text>
          <TextInput
            style={styles.input}
            value={safeZone.notificationMessage}
            onChangeText={(text) => setSafeZone(prev => ({ ...prev, notificationMessage: text }))}
            placeholder={`Safe zone "${safeZone.name}" alert`}
            maxLength={100}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSaveSafeZone}
          disabled={loading}
        >
          <MaterialCommunityIcons 
            name={loading ? "loading" : "content-save"} 
            size={20} 
            color="white" 
            style={{ marginRight: 8 }}
          />
          <Text style={styles.saveButtonText}>
            {loading ? 'Creating...' : 'Create Safe Zone'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: theme.typography.title.fontSize,
    fontWeight: theme.typography.title.fontWeight,
    color: theme.colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: theme.typography.subtitle.fontSize,
    fontWeight: theme.typography.subtitle.fontWeight,
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  locationSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: theme.typography.subtitle.fontSize,
    fontWeight: theme.typography.subtitle.fontWeight,
    color: theme.colors.text,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  currentLocationText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.primary,
    marginLeft: 4,
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
  },
  map: {
    flex: 1,
  },
  coordinatesInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  coordinatesText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  radiusSection: {
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 40,
    marginVertical: 8,
  },
  radiusLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  radiusLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  settingsSection: {
    marginBottom: 20,
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    fontSize: theme.typography.button.fontSize,
    color: theme.colors.textSecondary,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  saveButtonText: {
    fontSize: theme.typography.button.fontSize,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AddSafeZoneScreen;