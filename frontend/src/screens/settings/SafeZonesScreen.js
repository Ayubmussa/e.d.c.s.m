import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { theme } from '../../theme';
import apiService from '../../services/apiService';

const SafeZonesScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [safeZones, setSafeZones] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  
  useEffect(() => {
    const initializeScreen = async () => {
      await loadSafeZones();
      // Use a global/session variable to ensure permission is only requested once per app session
      if (!window.__locationPermissionRequested) {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          await getCurrentLocation();
        }
        window.__locationPermissionRequested = true;
      }
    };

    initializeScreen();

    const unsubscribe = navigation.addListener('focus', async () => {
      await loadSafeZones();
      // Do not call getCurrentLocation again on focus
    });

    return unsubscribe;
  }, [navigation]);

  const loadSafeZones = async () => {
    try {
      const response = await apiService.get('/api/geofencing/safe-zones');
      
      if (response.success) {
        const safeZones = response.data?.safe_zones || [];
        setSafeZones(safeZones);
        
        // If we have safe zones, center the map on the first one
        if (safeZones && safeZones.length > 0) {
          const firstZone = safeZones[0];
          setMapRegion(prev => ({
            ...prev,
            latitude: firstZone.center_latitude,
            longitude: firstZone.center_longitude,
          }));
        }
      } else {
        throw new Error(response.message || 'Failed to load safe zones');
      }
    } catch (error) {
      console.error('Load safe zones error:', error);
      Alert.alert(
        'Error',
        'Failed to load safe zones. Please try again.',
        [
          { text: 'Retry', onPress: loadSafeZones },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      // Only request permission if not already granted
      const { status } = await Location.getForegroundPermissionsAsync();
      let finalStatus = status;
      if (status !== 'granted') {
        const result = await Location.requestForegroundPermissionsAsync();
        finalStatus = result.status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to show your current location.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Get current location error:', error);
      Alert.alert('Error', 'Failed to get current location.');
    }
  };

  // Helper functions
  const handleAddSafeZone = () => {
    navigation.navigate('AddSafeZone');
  };

  const handleEditSafeZone = (zone) => {
    navigation.navigate('EditSafeZone', { zone });
  };

  const handleDeleteSafeZone = (zone) => {
    Alert.alert(
      'Delete Safe Zone',
      `Are you sure you want to delete "${zone.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            setLoading(true);
            const response = await apiService.delete(`/api/geofencing/safe-zones/${zone.id}`);
            if (response.success) {
              await loadSafeZones();
            } else {
              throw new Error(response.message || 'Failed to delete safe zone');
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to delete safe zone.');
          } finally {
            setLoading(false);
          }
        }}
      ]
    );
  };

  const handleToggleSafeZone = async (zone) => {
    try {
      setLoading(true);
      const response = await apiService.patch(`/api/geofencing/safe-zones/${zone.id}`, {
        is_active: !zone.is_active,
      });
      if (response.success) {
        await loadSafeZones();
      } else {
        throw new Error(response.message || 'Failed to update safe zone');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update safe zone.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSafeZones();
  };

  const centerMapOnZone = (zone) => {
    setMapRegion(prev => ({
      ...prev,
      latitude: zone.center_latitude,
      longitude: zone.center_longitude,
    }));
  };

  const getStatusColor = (isActive) => {
    return isActive ? theme.colors.success : theme.colors.textSecondary;
  };

  const getAlertTypeText = (zone) => {
    if (zone.alert_on_entry && zone.alert_on_exit) return 'Entry & Exit';
    if (zone.alert_on_entry) return 'Entry';
    if (zone.alert_on_exit) return 'Exit';
    return 'None';
  };

  // Loading indicator
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading Safe Zones...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <MaterialCommunityIcons 
              name="shield-check" 
              size={28} 
              color={theme.colors.primary} 
            />
            <Text style={styles.title}>Safe Zones</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddSafeZone}
          >
            <MaterialCommunityIcons 
              name="plus" 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Manage your geofencing safe zones and receive alerts when entering or leaving designated areas
        </Text>
      </View>

      {safeZones.length > 0 ? (
        <>
          <View style={styles.mapSection}>
            <View style={styles.mapContainer}>
              {/* <MapView
                style={styles.map}
                region={mapRegion}
                onRegionChangeComplete={setMapRegion}
              >
                {currentLocation && (
                  <Marker
                    coordinate={currentLocation}
                    title="Current Location"
                    pinColor="blue"
                  />
                )}
                {safeZones.map((zone) => (
                  <React.Fragment key={zone.id}>
                    <Marker
                      coordinate={{
                        latitude: zone.center_latitude,
                        longitude: zone.center_longitude,
                      }}
                      title={zone.name}
                      description={zone.description || 'Safe Zone'}
                      pinColor={zone.is_active ? "red" : "gray"}
                    />
                    <Circle
                      center={{
                        latitude: zone.center_latitude,
                        longitude: zone.center_longitude,
                      }}
                      radius={zone.radius_meters}
                      strokeColor={zone.is_active ? theme.colors.primary : theme.colors.textSecondary}
                      fillColor={zone.is_active ? `${theme.colors.primary}20` : `${theme.colors.textSecondary}20`}
                      strokeWidth={2}
                    />
                  </React.Fragment>
                ))}
              </MapView> */}
            </View>
            {/* Current Location Section with Map */}
            <View style={{ padding: theme.spacing.lg, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
              <Text style={{ fontWeight: 'bold', fontSize: theme.typography.subtitle.fontSize, color: theme.colors.text, marginBottom: theme.spacing.xs }}>Current Location</Text>
              <View style={{ height: 180, borderRadius: theme.roundness, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border }}>
                {/* <MapView
                  style={{ flex: 1 }}
                  region={currentLocation ? {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }
                  : mapRegion}
                  scrollEnabled={false}
                  zoomEnabled={true}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  {currentLocation && (
                    <Marker
                      coordinate={currentLocation}
                      title="Current Location"
                      pinColor="blue"
                    />
                  )}
                </MapView> */}
              </View>
              {currentLocation ? (
                <Text style={{ color: theme.colors.textSecondary, marginTop: theme.spacing.xs }}>
                  Latitude: {currentLocation.latitude.toFixed(6)}{"\n"}
                  Longitude: {currentLocation.longitude.toFixed(6)}
                </Text>
              ) : (
                <Text style={{ color: theme.colors.textSecondary, marginTop: theme.spacing.xs }}>Location not available</Text>
              )}
            </View>
          </View>

          <ScrollView 
            style={styles.listSection}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Your Safe Zones ({safeZones.length})</Text>
            </View>

            {safeZones.map((zone) => (
              <View key={zone.id} style={styles.safeZoneCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleSection}>
                    <Text style={styles.zoneName}>{zone.name}</Text>
                    <View style={styles.statusContainer}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(zone.is_active) }]} />
                      <Text style={[styles.statusText, { color: getStatusColor(zone.is_active) }]}>
                        {zone.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.centerButton}
                    onPress={() => centerMapOnZone(zone)}
                  >
                    <MaterialCommunityIcons 
                      name="map-marker" 
                      size={20} 
                      color={theme.colors.primary} 
                    />
                  </TouchableOpacity>
                </View>

                {zone.description && (
                  <Text style={styles.zoneDescription}>{zone.description}</Text>
                )}

                <View style={styles.zoneDetails}>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons 
                      name="resize" 
                      size={16} 
                      color={theme.colors.textSecondary} 
                    />
                    <Text style={styles.detailText}>Radius: {zone.radius_meters}m</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons 
                      name="bell" 
                      size={16} 
                      color={theme.colors.textSecondary} 
                    />
                    <Text style={styles.detailText}>Alerts: {getAlertTypeText(zone)}</Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.toggleButton]}
                    onPress={() => handleToggleSafeZone(zone)}
                  >
                    <MaterialCommunityIcons 
                      name={zone.is_active ? "pause" : "play"} 
                      size={16} 
                      color={zone.is_active ? theme.colors.warning : theme.colors.success} 
                    />
                    <Text style={[styles.actionButtonText, { 
                      color: zone.is_active ? theme.colors.warning : theme.colors.success 
                    }]}>
                      {zone.is_active ? 'Deactivate' : 'Activate'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEditSafeZone(zone)}
                  >
                    <MaterialCommunityIcons 
                      name="pencil" 
                      size={16} 
                      color={theme.colors.primary} 
                    />
                    <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
                      Edit
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteSafeZone(zone)}
                  >
                    <MaterialCommunityIcons 
                      name="delete" 
                      size={16} 
                      color={theme.colors.error} 
                    />
                    <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </>
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons 
            name="shield-plus-outline" 
            size={80} 
            color={theme.colors.textSecondary} 
          />
          <Text style={styles.emptyTitle}>No Safe Zones Created</Text>
          <Text style={styles.emptyDescription}>
            Create your first safe zone to start receiving location-based alerts and monitoring
          </Text>
          <TouchableOpacity
            style={styles.createFirstButton}
            onPress={handleAddSafeZone}
          >
            <MaterialCommunityIcons 
              name="plus" 
              size={20} 
              color={theme.colors.textOnPrimary} 
              style={{ marginRight: theme.spacing.xs }}
            />
            <Text style={styles.createFirstButtonText}>Create First Safe Zone</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.title.fontSize,
    fontWeight: theme.typography.title.fontWeight,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.body1.lineHeight,
  },
  mapSection: {
    height: 200,
  },
  mapContainer: {
    flex: 1,
    margin: theme.spacing.lg,
    borderRadius: theme.roundness,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  map: {
    flex: 1,
  },
  listSection: {
    flex: 1,
  },
  listHeader: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  listTitle: {
    fontSize: theme.typography.subtitle.fontSize,
    fontWeight: theme.typography.subtitle.fontWeight,
    color: theme.colors.text,
  },
  safeZoneCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  cardTitleSection: {
    flex: 1,
  },
  zoneName: {
    fontSize: theme.typography.subtitle.fontSize,
    fontWeight: theme.typography.subtitle.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.xxs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  statusText: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '500',
  },
  centerButton: {
    padding: theme.spacing.sm,
  },
  zoneDescription: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    fontStyle: 'italic',
  },
  zoneDetails: {
    marginBottom: theme.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xxs,
  },
  detailText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.roundness,
    borderWidth: 1,
    gap: theme.spacing.xs,
  },
  toggleButton: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  editButton: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  deleteButton: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.error + '10',
  },
  actionButtonText: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: theme.typography.title.fontSize,
    fontWeight: theme.typography.title.fontWeight,
    color: theme.colors.text,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  emptyDescription: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.body1.lineHeight,
    marginBottom: theme.spacing.xl,
  },
  createFirstButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.roundness,
  },
  createFirstButtonText: {
    fontSize: theme.typography.button.fontSize,
    color: theme.colors.textOnPrimary,
    fontWeight: 'bold',
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  webMapText: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default SafeZonesScreen;