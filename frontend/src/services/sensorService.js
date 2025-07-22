import apiService from './apiService';

class SensorService {
  async uploadSensorData(sensorData) {
    try {
      // Make sure to include location data in the format:
      // {
      //   location: {
      //     latitude: number,
      //     longitude: number,
      //     accuracy: number,
      //     timestamp: string (ISO format date)
      //   },
      //   ...other sensor data
      // }
      // Location data is now the primary mechanism for alerting when an elder leaves a safe zone
      
      // Ensure location data is always included
      const dataWithLocation = await this.prepareSensorDataWithLocation(sensorData);
      
      const response = await apiService.post('/api/sensors/data', dataWithLocation);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getSensorHistory(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await apiService.get(`/api/sensors/history?${queryParams}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateSensorSettings(settings) {
    try {
      const response = await apiService.put('/api/sensors/settings', settings);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getSensorSettings() {
    try {
      const response = await apiService.get('/api/sensors/settings');
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getActivitySummary(period = 'week') {
    try {
      const response = await apiService.get(`/api/sensors/activity?period=${period}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Helper function to combine current location with other sensor data
  async prepareSensorDataWithLocation(sensorData) {
    try {
      // This would typically come from a location tracking library in a real app
      // For example: import Geolocation from '@react-native-community/geolocation';
      
      // Get current location (simulated for this example)
      const currentLocation = await this.getCurrentLocation();
      
      // Combine location with other sensor data
      return {
        ...sensorData,
        location: currentLocation,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error preparing sensor data with location:', error);
      // Still send data even if location is unavailable
      return {
        ...sensorData,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // Get current device location
  async getCurrentLocation() {
    // This is a placeholder for actual location acquisition logic
    // In a real app, you would use the device's location services
    
    // Example: 
    // return new Promise((resolve, reject) => {
    //   Geolocation.getCurrentPosition(
    //     position => {
    //       resolve({
    //         latitude: position.coords.latitude,
    //         longitude: position.coords.longitude,
    //         accuracy: position.coords.accuracy,
    //         timestamp: new Date(position.timestamp).toISOString()
    //       });
    //     },
    //     error => reject(error),
    //     { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    //   );
    // });
    
    // For testing, just return placeholder data
    return {
      latitude: 40.7128, // Example coordinates (New York)
      longitude: -74.0060,
      accuracy: 10,
      timestamp: new Date().toISOString()
    };
  }
}

export default new SensorService();
