import * as Location from 'expo-location';
import apiService from './apiService';

class GeofencingService {
  constructor() {
    this.isTracking = false;
    this.trackingInterval = null;
    this.updateInterval = 5000; // Reduce to 5 seconds for faster testing
    this.lastKnownLocation = null;
    
    console.log('GeofencingService constructor called');
  }

  // Start location tracking for geofencing
  async startLocationTracking() {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted - geofencing disabled');
        return { success: false, error: 'Location permission not granted' };
      }

      // Request background location permissions for better geofencing
      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status !== 'granted') {
        console.warn('Background location permission not granted - limited geofencing functionality');
      }

      // Test location access before starting tracking
      try {
        const testLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
          maximumAge: 60000, // Accept cached location up to 1 minute old for test
        });
        
        if (!testLocation || !testLocation.coords) {
          throw new Error('Unable to get current location');
        }
        
        console.log('Location access test successful');
        
        // Initialize zone status on the backend with current location
        try {
          console.log('Initializing zone status with current location...');
          await this.initializeZoneStatus({
            latitude: testLocation.coords.latitude,
            longitude: testLocation.coords.longitude
          });
          console.log('Zone status initialized successfully');
        } catch (initError) {
          console.warn('Failed to initialize zone status:', initError);
          // Continue tracking even if initialization fails
        }
        
      } catch (locationError) {
        console.error('Location access test failed:', locationError);
        return { success: false, error: 'Unable to access location services' };
      }

      this.isTracking = true;
      
      // Start periodic location updates
      this.trackingInterval = setInterval(() => {
        this.updateCurrentLocation();
      }, this.updateInterval);

      // Send initial location
      await this.updateCurrentLocation();

      console.log('Geofencing location tracking started successfully');
      return { success: true };

    } catch (error) {
      console.error('Failed to start location tracking:', error);
      return { success: false, error: error.message };
    }
  }

  // Stop location tracking
  stopLocationTracking() {
    this.isTracking = false;
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    
    // Reset zone status on the backend
    try {
      this.resetZoneStatus();
    } catch (error) {
      console.warn('Failed to reset zone status:', error);
    }
    
    console.log('Geofencing location tracking stopped');
  }

  // Get current location and send to backend
  async updateCurrentLocation() {
    if (!this.isTracking) {
      console.log('Not tracking, skipping location update');
      return;
    }

    console.log('Getting current location...');

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000, // Accept cached location up to 10 seconds old
      });

      if (!location || !location.coords) {
        console.warn('Invalid location data received');
        return;
      }

      console.log('Raw location data:', location);

      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || null,
        timestamp: new Date(location.timestamp || Date.now()).toISOString(),
        altitude: location.coords.altitude || null,
        heading: location.coords.heading || null,
        speed: location.coords.speed || null
      };

      console.log('Formatted location data:', locationData);

      // Validate required fields
      if (!locationData.latitude || !locationData.longitude) {
        console.warn('Missing required location coordinates');
        return;
      }

      // Only send update if location has changed significantly
      if (this.shouldSendLocationUpdate(locationData)) {
        console.log('Sending location update to backend...');
        await this.sendLocationUpdate(locationData);
        this.lastKnownLocation = locationData;
      } else {
        console.log('Location update skipped - no significant change');
      }

    } catch (error) {
      console.error('Error getting current location:', error);
    }
  }

  // Check if we should send location update (avoid spam)
  shouldSendLocationUpdate(newLocation) {
    if (!this.lastKnownLocation) {
      console.log('No previous location, sending update');
      return true;
    }

    const distance = this.calculateDistance(
      this.lastKnownLocation.latitude,
      this.lastKnownLocation.longitude,
      newLocation.latitude,
      newLocation.longitude
    );

    // Send update if moved more than 0.5 meters or after 30 seconds (more frequent for testing)
    const timeDiff = new Date() - new Date(this.lastKnownLocation.timestamp);
    const shouldSend = distance > 0.0005 || timeDiff > 30000; // 0.5m or 30 seconds
    
    console.log(`Location check: distance=${(distance * 1000).toFixed(2)}m, timeDiff=${Math.round(timeDiff/1000)}s, shouldSend=${shouldSend}`);
    
    return shouldSend;
  }

  // Calculate distance between two coordinates (in kilometers)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  // Send location update to backend
  async sendLocationUpdate(locationData) {
    try {
      // Validate location data before sending
      if (!locationData || typeof locationData !== 'object') {
        throw new Error('Invalid location data: must be an object');
      }

      if (!locationData.latitude || !locationData.longitude) {
        throw new Error('Invalid location data: missing coordinates');
      }

      // Clean the data to avoid null values causing JSON parsing issues
      const cleanLocationData = {
        latitude: Number(locationData.latitude),
        longitude: Number(locationData.longitude),
        timestamp: locationData.timestamp || new Date().toISOString()
      };

      // Add optional fields only if they have valid values
      if (locationData.accuracy && !isNaN(locationData.accuracy)) {
        cleanLocationData.accuracy = Number(locationData.accuracy);
      }
      if (locationData.altitude && !isNaN(locationData.altitude)) {
        cleanLocationData.altitude = Number(locationData.altitude);
      }
      if (locationData.heading && !isNaN(locationData.heading)) {
        cleanLocationData.heading = Number(locationData.heading);
      }
      if (locationData.speed && !isNaN(locationData.speed)) {
        cleanLocationData.speed = Number(locationData.speed);
      }

      console.log('Sending location update:', cleanLocationData);
      
      const response = await apiService.post('/api/geofencing/location-update', cleanLocationData);
      
      if (response.success && response.data && response.data.events && response.data.events.length > 0) {
        // Handle geofencing events (zone entry/exit)
        console.log('Geofencing events detected:', response.data.events);
        
        // You could emit events here for the app to handle
        response.data.events.forEach(event => {
          this.handleGeofencingEvent(event);
        });
      }

      return response;
    } catch (error) {
      console.error('Failed to send location update:', error);
      throw error;
    }
  }

  // Handle geofencing events (zone entry/exit)
  handleGeofencingEvent(event) {
    console.log(`Geofencing event: ${event.type} - ${event.zone}`, event);
    
    // You could show local notifications here if needed
    // Or update the app state to reflect zone status
    
    if (event.type === 'zone_exit' && event.alertTriggered) {
      console.warn(`⚠️ Exited safe zone: ${event.zone}`);
      // Could trigger a local notification or app alert
    } else if (event.type === 'zone_enter' && event.alertTriggered) {
      console.log(`✅ Entered safe zone: ${event.zone}`);
    }
  }

  // Get safe zones from backend
  async getSafeZones() {
    try {
      const response = await apiService.get('/api/geofencing/safe-zones');
      return response;
    } catch (error) {
      console.error('Failed to get safe zones:', error);
      throw error;
    }
  }

  // Create a new safe zone
  async createSafeZone(zoneData) {
    try {
      const response = await apiService.post('/api/geofencing/safe-zones', zoneData);
      return response;
    } catch (error) {
      console.error('Failed to create safe zone:', error);
      throw error;
    }
  }

  // Update an existing safe zone
  async updateSafeZone(zoneId, zoneData) {
    try {
      const response = await apiService.put(`/api/geofencing/safe-zones/${zoneId}`, zoneData);
      return response;
    } catch (error) {
      console.error('Failed to update safe zone:', error);
      throw error;
    }
  }

  // Delete a safe zone
  async deleteSafeZone(zoneId) {
    try {
      const response = await apiService.delete(`/api/geofencing/safe-zones/${zoneId}`);
      return response;
    } catch (error) {
      console.error('Failed to delete safe zone:', error);
      throw error;
    }
  }

  // Get location events history
  async getLocationEvents(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await apiService.get(`/api/geofencing/location-events?${queryParams}`);
      return response;
    } catch (error) {
      console.error('Failed to get location events:', error);
      throw error;
    }
  }

  // Initialize zone status with current location
  async initializeZoneStatus(location) {
    try {
      const response = await apiService.post('/api/geofencing/initialize-status', location);
      return response;
    } catch (error) {
      console.error('Failed to initialize zone status:', error);
      throw error;
    }
  }

  // Reset zone status
  async resetZoneStatus() {
    try {
      const response = await apiService.post('/api/geofencing/reset-status', {});
      return response;
    } catch (error) {
      console.error('Failed to reset zone status:', error);
      throw error;
    }
  }
}

// Create singleton instance
const geofencingService = new GeofencingService();

export default geofencingService;
