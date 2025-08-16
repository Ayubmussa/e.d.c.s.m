import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MapView, Marker, Circle } from '../../components/common/PlatformMap';
import * as Location from 'expo-location';
import Slider from '@react-native-community/slider';
import { theme } from '../../theme';
import apiService from '../../services/apiService';

const EditSafeZoneScreen = ({ navigation, route }) => {
  const { safeZoneId } = route.params;
  
  const [safeZone, setSafeZone] = useState({
    name: '',
    description: '',
    latitude: 37.78825,
    longitude: -122.4324,
    radius: 100,
    isActive: true,
    alertOnEntry: true,
    alertOnExit: true,
    notificationMessage: ''
  });

  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    loadSafeZone();
    getCurrentLocation();
  }, []);

  const loadSafeZone = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/api/geofencing/safe-zones/${safeZoneId}`);
      
      if (response.success && response.data) {
        const zoneData = response.data;
        setSafeZone({
          name: zoneData.name || '',
          description: zoneData.description || '',
          latitude: zoneData.center_latitude,
          longitude: zoneData.center_longitude,
          radius: zoneData.radius_meters,
          isActive: zoneData.is_active !== false,
          alertOnEntry: zoneData.alert_on_enter !== false,
          alertOnExit: zoneData.alert_on_exit !== false,
          notificationMessage: zoneData.notification_message || ''
        });

        setMapRegion({
          latitude: zoneData.center_latitude,
          longitude: zoneData.center_longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else {
        throw new Error(response.message || 'Safe zone not found');
      }
    } catch (error) {
      console.error('Load safe zone error:', error);
      Alert.alert(
        'Error',
        'Failed to load safe zone details. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Get location error:', error);
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

  const handleUpdateSafeZone = async () => {
    if (!safeZone.name.trim()) {
      Alert.alert('Error', 'Please enter a name for the safe zone');
      return;
    }

    if (safeZone.radius < 5 || safeZone.radius > 1000) {
      Alert.alert('Error', 'Radius must be between 5 and 1000 meters');
      return;
    }

    setSaving(true);

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

      const response = await apiService.put(`/api/geofencing/safe-zones/${safeZoneId}`, safeZoneData);

      if (response.success) {
        Alert.alert(
          'Safe Zone Updated',
          `"${safeZone.name}" has been updated successfully.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to update safe zone');
      }
    } catch (error) {
      console.error('Update safe zone error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to update safe zone. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSafeZone = () => {
    Alert.alert(
      'Delete Safe Zone',
      `Are you sure you want to delete "${safeZone.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDeleteSafeZone
        }
      ]
    );
  };

  const confirmDeleteSafeZone = async () => {
    setDeleting(true);

    try {
      const response = await apiService.delete(`/api/geofencing/safe-zones/${safeZoneId}`);

      if (response.success) {
        Alert.alert(
          'Safe Zone Deleted',
          `"${safeZone.name}" has been deleted successfully.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to delete safe zone');
      }
    } catch (error) {
      console.error('Delete safe zone error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to delete safe zone. Please try again.'
      );
    } finally {
      setDeleting(false);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading safe zone details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <MaterialCommunityIcons 
          name="shield-edit" 
          size={40} 
          color={theme.colors.primary} 
        />
        <Text style={styles.title}>Edit Safe Zone</Text>
        <Text style={styles.subtitle}>
          Modify the settings for your safe zone
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
          style={[styles.button, styles.deleteButton]}
          onPress={handleDeleteSafeZone}
          disabled={saving || deleting}
        >
          <MaterialCommunityIcons 
            name={deleting ? "loading" : "delete"} 
            size={20} 
            color={theme.colors.error} 
            style={{ marginRight: theme.spacing.xs }}
          />
          <Text style={styles.deleteButtonText}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={saving || deleting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleUpdateSafeZone}
          disabled={saving || deleting}
        >
          <MaterialCommunityIcons 
            name={saving ? "loading" : "content-save"} 
            size={20} 
            color={theme.colors.textOnPrimary} 
            style={{ marginRight: theme.spacing.xs }}
          />
          <Text style={styles.saveButtonText}>
            {saving ? 'Updating...' : 'Update'}
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
    padding: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.title.fontSize,
    fontWeight: theme.typography.title.fontWeight,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.body1.lineHeight,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.subtitle.fontSize,
    fontWeight: theme.typography.subtitle.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  locationSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.subtitle.fontSize,
    fontWeight: theme.typography.subtitle.fontWeight,
    color: theme.colors.text,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  currentLocationText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  mapContainer: {
    height: 200,
    borderRadius: theme.roundness,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  map: {
    flex: 1,
  },
  coordinatesInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
  },
  coordinatesText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  radiusSection: {
    marginBottom: theme.spacing.lg,
  },
  slider: {
    width: '100%',
    height: 40,
    marginVertical: theme.spacing.sm,
  },
  radiusLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
  },
  radiusLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  settingsSection: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  switchInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  switchLabel: {
    fontSize: theme.typography.body1.fontSize,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.xxs,
  },
  switchDescription: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  button: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.roundness,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  deleteButtonText: {
    fontSize: theme.typography.button.fontSize,
    color: theme.colors.error,
    fontWeight: 'bold',
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
    color: theme.colors.textOnPrimary,
    fontWeight: 'bold',
  },
});

export default EditSafeZoneScreen;