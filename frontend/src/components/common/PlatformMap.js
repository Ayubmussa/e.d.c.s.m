import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';

// Platform-specific map components
let MapView, Marker, Circle;

if (Platform.OS === 'web') {
  // For web, we'll use a placeholder or a web-compatible map library
  MapView = ({ children, style, region, onPress, onRegionChangeComplete, ...props }) => (
    <View style={[styles.webMapPlaceholder, style]}>
      <Text style={styles.webMapText}>Map View (Web)</Text>
      <Text style={styles.webMapSubtext}>
        Interactive map available on mobile devices
      </Text>
      <Text style={styles.webCoordinates}>
        Lat: {region?.latitude?.toFixed(6)}, Lng: {region?.longitude?.toFixed(6)}
      </Text>
      <View style={styles.webChildrenContainer}>
        {typeof children === 'string' ? <Text>{children}</Text> : children}
      </View>
    </View>
  );

  Marker = ({ title, description, coordinate, pinColor }) => (
    <View style={styles.webMarker}>
      <Text style={styles.webMarkerText}>
        {pinColor === 'blue' ? '🔵' : '📍'} {title} 
      </Text>
      <Text style={styles.webMarkerCoords}>
        ({coordinate?.latitude?.toFixed(6)}, {coordinate?.longitude?.toFixed(6)})
      </Text>
      {description && <Text style={styles.webMarkerDesc}>{description}</Text>}
    </View>
  );

  Circle = ({ center, radius, strokeColor, fillColor, strokeWidth, ...props }) => (
    <View style={styles.webCircle}>
      <Text style={styles.webCircleText}>
        🔵 Safe Zone: {radius}m radius
      </Text>
      <Text style={styles.webCircleCoords}>
        Center: ({center?.latitude?.toFixed(6)}, {center?.longitude?.toFixed(6)})
      </Text>
    </View>
  );
} else {
  // For native platforms, use react-native-maps
  try {
    const ReactNativeMaps = require('react-native-maps');
    
    // react-native-maps exports the components directly
    MapView = ReactNativeMaps.default || ReactNativeMaps;
    Marker = ReactNativeMaps.Marker;
    Circle = ReactNativeMaps.Circle;
    
    // If react-native-maps doesn't have the components, fall back
    if (!MapView || !Marker || !Circle) {
      throw new Error('react-native-maps components not found');
    }
    
    console.log('Successfully loaded react-native-maps components');
  } catch (error) {
    console.warn('react-native-maps not available, using fallback components:', error.message);
    
    // Fallback components for when react-native-maps is not available
    MapView = ({ children, style, ...props }) => (
      <View style={[styles.fallbackMap, style]}>
        <Text style={styles.fallbackText}>Map View Unavailable</Text>
        <Text style={styles.fallbackSubtext}>
          Please install react-native-maps for map functionality
        </Text>
        {typeof children === 'string' ? <Text>{children}</Text> : children}
      </View>
    );

    Marker = ({ title, description, coordinate }) => (
      <View style={styles.fallbackMarker}>
        <Text style={styles.fallbackMarkerText}>
          📍 {title}
        </Text>
        {description && <Text style={styles.fallbackMarkerDesc}>{description}</Text>}
      </View>
    );

    Circle = ({ center, radius }) => (
      <View style={styles.fallbackCircle}>
        <Text style={styles.fallbackCircleText}>
          Safe Zone: {radius}m
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  webMapPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 200,
    padding: 16,
  },
  webMapText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  webMapSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  webCoordinates: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  webChildrenContainer: {
    alignItems: 'center',
    width: '100%',
  },
  webMarker: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    margin: 4,
    alignItems: 'center',
  },
  webMarkerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  webMarkerCoords: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  webMarkerDesc: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  webCircle: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
    margin: 2,
    alignItems: 'center',
  },
  webCircleText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  webCircleCoords: {
    fontSize: 10,
    color: '#007AFF',
    marginTop: 2,
  },
  fallbackMap: {
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 200,
  },
  fallbackText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  fallbackSubtext: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  fallbackMarker: {
    backgroundColor: 'white',
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    margin: 2,
  },
  fallbackMarkerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  fallbackMarkerDesc: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  fallbackCircle: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
    margin: 2,
  },
  fallbackCircleText: {
    fontSize: 10,
    color: '#FF9500',
  },
});

export { MapView, Marker, Circle };
