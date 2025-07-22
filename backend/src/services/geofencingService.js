const { supabaseAdmin } = require('../config/database');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');
const emergencyService = require('./emergencyService');

class GeofencingService {
  constructor() {
    this.lastLocationCheck = new Map(); // Track last location check per user
    this.userZoneStatus = new Map(); // Track which zones users are currently in
    
    logger.info('Geofencing Service initialized');
  }

  /**
   * Process location data and check for geofence violations
   * @param {string} userId - User ID
   * @param {Object} locationData - Location data from mobile app
   */
  async processLocationData(userId, locationData) {
    try {
      const { latitude, longitude, accuracy, timestamp } = locationData;
      
      if (!latitude || !longitude) {
        logger.warn(`Invalid location data for user ${userId}:`, locationData);
        return { success: false, error: 'Invalid location coordinates' };
      }

      // Get user's safe zones
      const safeZones = await this.getUserSafeZones(userId);
      
      if (safeZones.length === 0) {
        logger.info(`No safe zones configured for user ${userId}`);
        return { success: true, message: 'No safe zones configured' };
      }

      // Check each safe zone
      const zoneEvents = [];
      for (const zone of safeZones) {
        const event = await this.checkZoneStatus(userId, locationData, zone);
        if (event) {
          zoneEvents.push(event);
        }
      }

      // Log location update
      await this.logLocationEvent(userId, 'location_update', null, locationData);

      return {
        success: true,
        events: zoneEvents,
        zonesChecked: safeZones.length,
        currentLocation: { latitude, longitude }
      };

    } catch (error) {
      logger.error('Error processing location data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user's location violates any safe zone rules
   */
  async checkZoneStatus(userId, locationData, zone) {
    try {

      const { latitude, longitude, accuracy = 0 } = locationData;
      const distance = this.calculateDistance(
        latitude, longitude,
        zone.center_latitude, zone.center_longitude
      );

      // Add a buffer to the radius to account for GPS inaccuracy (10 meters)
      const bufferMeters = 10;
      const effectiveRadiusMeters = zone.radius_meters + bufferMeters;
      const isInsideZone = (distance * 1000) <= effectiveRadiusMeters; // Convert km to meters
      const zoneKey = `${userId}_${zone.id}`;

      // Track previous status in memory
      const hasZoneStatus = this.userZoneStatus.has(zoneKey);
      const wasInsideZone = this.userZoneStatus.get(zoneKey) || false;

      let event = null;

      // If we don't have previous status, initialize it (first location update)
      if (!hasZoneStatus) {
        logger.info(`Initializing zone status for user ${userId}, zone ${zone.name}: ${isInsideZone ? 'INSIDE' : 'OUTSIDE'}`);
        this.userZoneStatus.set(zoneKey, isInsideZone);
        await this.logLocationEvent(userId, 'zone_status_init', zone.id, locationData, distance);
        return null;
      }

      // --- Improved: Always check for exit if user is outside zone, even if status didn't change ---
      if (!isInsideZone) {
        if (wasInsideZone) {
          // Normal exit event
          event = await this.handleZoneExit(userId, zone, locationData, distance);
        } else {
          // Already outside, but keep alerting/logging if not recently alerted (could add cooldown logic here)
          logger.info(`User ${userId} remains OUTSIDE zone ${zone.name} (distance: ${(distance * 1000).toFixed(1)}m, radius: ${zone.radius_meters}m, accuracy: ${accuracy}m)`);
          // Optionally, re-alert or log repeated violations here
        }
      } else if (isInsideZone && !wasInsideZone) {
        // Entry event
        event = await this.handleZoneEntry(userId, zone, locationData, distance);
      }

      // Update zone status
      this.userZoneStatus.set(zoneKey, isInsideZone);

      // Log current status for debugging
      logger.debug(`Zone status check for ${zone.name}: was=${wasInsideZone}, now=${isInsideZone}, distance=${(distance * 1000).toFixed(1)}m, radius=${zone.radius_meters}m, buffer=${bufferMeters}m, accuracy=${accuracy}m`);

      return event;

    } catch (error) {
      logger.error('Error checking zone status:', error);
      return null;
    }
  }

  /**
   * Handle when user enters a zone
   */
  async handleZoneEntry(userId, zone, locationData, distance) {
    try {
      logger.info(`User ${userId} entered zone ${zone.name} (${zone.zone_type})`);

      // Log the event
      const event = await this.logLocationEvent(
        userId, 'zone_enter', zone.id, locationData, distance
      );

      // Send alert if configured
      if (zone.alert_on_enter) {
        await this.sendZoneAlert(userId, zone, 'enter', locationData);
      }

      return {
        type: 'zone_enter',
        zone: zone.name,
        zoneType: zone.zone_type,
        distance: distance * 1000, // Convert to meters
        alertTriggered: zone.alert_on_enter
      };

    } catch (error) {
      logger.error('Error handling zone entry:', error);
      return null;
    }
  }

  /**
   * Handle when user exits a zone
   */
  async handleZoneExit(userId, zone, locationData, distance) {
    try {
      logger.info(`User ${userId} exited zone ${zone.name} (${zone.zone_type})`);

      // Log the event
      const event = await this.logLocationEvent(
        userId, 'zone_exit', zone.id, locationData, distance
      );

      // Send alert if configured
      if (zone.alert_on_exit) {
        await this.sendZoneAlert(userId, zone, 'exit', locationData);
      }

      return {
        type: 'zone_exit',
        zone: zone.name,
        zoneType: zone.zone_type,
        distance: distance * 1000, // Convert to meters
        alertTriggered: zone.alert_on_exit
      };

    } catch (error) {
      logger.error('Error handling zone exit:', error);
      return null;
    }
  }

  /**
   * Send alert for zone violation
   */
  async sendZoneAlert(userId, zone, eventType, locationData) {
    try {
      const message = zone.notification_message || 
        `User has ${eventType === 'enter' ? 'entered' : 'left'} the safe zone "${zone.name}"`;

      // Create emergency alert using the emergency service
      const alertData = {
        alert_type: eventType === 'enter' ? 'geofence_enter' : 'geofence_exit',
        triggered_at: new Date().toISOString(),
        location: JSON.stringify({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          timestamp: locationData.timestamp
        }),
        message: message,
        status: 'active',
        severity: eventType === 'exit' ? 'high' : 'medium', // Zone exits are more concerning
        metadata: JSON.stringify({
          zone_id: zone.id,
          zone_name: zone.name,
          zone_type: zone.zone_type,
          event_type: eventType,
          center_latitude: zone.center_latitude,
          center_longitude: zone.center_longitude,
          radius_meters: zone.radius_meters
        })
      };

      // Use emergency service to create alert and notify contacts
      const emergencyService = require('./emergencyService');
      const alert = await emergencyService.createAlert(userId, alertData, {
        notifyContacts: true, // Always notify for geofence violations
        bypassDailyLimit: eventType === 'exit' // Zone exits are critical, bypass daily limits
      });

      // Send push notification to the user's device
      try {
        const pushNotificationService = require('./pushNotificationService');
        const pushData = {
          alertId: alert.id,
          zoneName: zone.name,
          eventType: eventType,
          location: locationData,
          userName: 'User' // We could get this from user data if needed
        };

        await pushNotificationService.sendPushNotification(userId, {
          title: eventType === 'exit' ? '⚠️ Safe Zone Alert' : '✅ Safe Zone Entry',
          body: message,
          data: {
            type: 'geofence_alert',
            alertId: alert.id,
            zoneId: zone.id,
            zoneName: zone.name,
            eventType: eventType,
            location: JSON.stringify(locationData),
            timestamp: new Date().toISOString()
          }
        });

        logger.info(`Push notification sent to user ${userId} for zone ${eventType}`);
      } catch (pushError) {
        logger.error('Error sending push notification for zone alert:', pushError);
        // Don't fail the whole alert if push notification fails
      }

      logger.info(`Zone ${eventType} alert created for user ${userId}: ${message} (Alert ID: ${alert.id})`);

      return alert;

    } catch (error) {
      logger.error('Error sending zone alert:', error);
      throw error;
    }
  }

  /**
   * Get all safe zones for a user
   */
  async getUserSafeZones(userId) {
    try {
      logger.info(`GeofencingService: Getting safe zones for user ID: ${userId}`);
      logger.info(`User ID type: ${typeof userId}`);
      
      if (!userId) {
        logger.error('GeofencingService: User ID is null or undefined');
        return [];
      }

      const { data, error } = await supabaseAdmin
        .from('safe_zones')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching safe zones:', error);
        return [];
      }

      logger.info(`GeofencingService: Found ${data?.length || 0} safe zones for user ${userId}`);
      return data || [];

    } catch (error) {
      logger.error('Error getting user safe zones:', error);
      return [];
    }
  }

  /**
   * Create a new safe zone for a user
   */
  async createSafeZone(userId, zoneData) {
    try {
      const {
        name,
        zone_type = 'safe',
        center_latitude,
        center_longitude,
        radius_meters = 100,
        description,
        alert_on_enter = false,
        alert_on_exit = true,
        notification_message,
        is_active = true
      } = zoneData;

      const { data, error } = await supabaseAdmin
        .from('safe_zones')
        .insert({
          user_id: userId,
          name,
          zone_type,
          center_latitude,
          center_longitude,
          radius_meters,
          description,
          alert_on_enter,
          alert_on_exit,
          notification_message,
          is_active
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating safe zone:', error);
        throw new Error('Failed to create safe zone');
      }

      logger.info(`Safe zone created for user ${userId}: ${name}`);
      return data;

    } catch (error) {
      logger.error('Error creating safe zone:', error);
      throw error;
    }
  }

  /**
   * Update a safe zone
   */
  async updateSafeZone(userId, zoneId, updates) {
    try {
      // Map frontend field names to database field names
      const dbUpdates = {};
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.center_latitude !== undefined) dbUpdates.center_latitude = updates.center_latitude;
      if (updates.center_longitude !== undefined) dbUpdates.center_longitude = updates.center_longitude;
      if (updates.radius_meters !== undefined) dbUpdates.radius_meters = updates.radius_meters;
      if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;
      if (updates.alert_on_enter !== undefined) dbUpdates.alert_on_enter = updates.alert_on_enter;
      if (updates.alert_on_exit !== undefined) dbUpdates.alert_on_exit = updates.alert_on_exit;
      if (updates.notification_message !== undefined) dbUpdates.notification_message = updates.notification_message;
      
      const { data, error } = await supabaseAdmin
        .from('safe_zones')
        .update({
          ...dbUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', zoneId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating safe zone:', error);
        throw new Error('Failed to update safe zone');
      }

      return data;

    } catch (error) {
      logger.error('Error updating safe zone:', error);
      throw error;
    }
  }

  /**
   * Delete a safe zone
   */
  async deleteSafeZone(userId, zoneId) {
    try {
      const { error } = await supabaseAdmin
        .from('safe_zones')
        .update({ is_active: false })
        .eq('id', zoneId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error deleting safe zone:', error);
        throw new Error('Failed to delete safe zone');
      }

      // Clear zone status
      this.userZoneStatus.delete(`${userId}_${zoneId}`);

      logger.info(`Safe zone deleted for user ${userId}: ${zoneId}`);

    } catch (error) {
      logger.error('Error deleting safe zone:', error);
      throw error;
    }
  }

  /**
   * Log location event
   */
  async logLocationEvent(userId, eventType, safeZoneId, locationData, distance = null) {
    try {
      const { latitude, longitude, address } = locationData;

      const { data, error } = await supabaseAdmin
        .from('location_events')
        .insert({
          user_id: userId,
          event_type: eventType,
          safe_zone_id: safeZoneId,
          latitude,
          longitude,
          address,
          distance_from_zone: distance ? distance * 1000 : null, // Convert to meters
          alert_triggered: eventType.includes('zone_')
        })
        .select()
        .single();

      if (error) {
        logger.error('Error logging location event:', error);
        return null;
      }

      return data;

    } catch (error) {
      logger.error('Error logging location event:', error);
      return null;
    }
  }

  /**
   * Get location history for a user
   */
  async getLocationHistory(userId, limit = 50) {
    try {
      const { data, error } = await supabaseAdmin
        .from('location_events')
        .select(`
          *,
          safe_zones (name, zone_type)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching location history:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      logger.error('Error getting location history:', error);
      return [];
    }
  }

  /**
   * Get location events for a user
   */
  async getLocationEvents(userId, options = {}) {
    try {
      const { limit = 50, zoneId } = options;
      
      let query = supabaseAdmin
        .from('location_events')
        .select(`
          *,
          safe_zones (
            id,
            name,
            zone_type
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (zoneId) {
        query = query.eq('safe_zone_id', zoneId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
      
    } catch (error) {
      logger.error('Error getting location events:', error);
      return [];
    }
  }

  /**
   * Get geofencing status and monitoring info
   */
  async getGeofencingStatus(userId) {
    try {
      // Get user's safe zones
      const safeZones = await this.getUserSafeZones(userId);
      
      // Get recent location events (last 24 hours)
      const { data: recentEvents } = await supabaseAdmin
        .from('location_events')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });
      
      // Get current zone status
      const currentZoneStatus = await this.getCurrentZoneStatus(userId);
      
      // Calculate statistics
      const totalZones = safeZones.length;
      const activeZones = safeZones.filter(zone => zone.is_active).length;
      const totalEvents = recentEvents?.length || 0;
      const alertEvents = recentEvents?.filter(event => 
        event.event_type === 'zone_exit' || event.event_type === 'zone_entry'
      ).length || 0;
      
      return {
        total_safe_zones: totalZones,
        active_safe_zones: activeZones,
        current_zone_status: currentZoneStatus,
        recent_events_24h: totalEvents,
        alert_events_24h: alertEvents,
        last_location_update: this.lastLocationCheck.get(userId) || null,
        monitoring_active: totalZones > 0 && activeZones > 0
      };
      
    } catch (error) {
      logger.error('Error getting geofencing status:', error);
      return {
        total_safe_zones: 0,
        active_safe_zones: 0,
        current_zone_status: [],
        recent_events_24h: 0,
        alert_events_24h: 0,
        last_location_update: null,
        monitoring_active: false
      };
    }
  }

  /**
   * Get zone history for a specific zone
   */
  async getZoneHistory(userId, zoneId, limit = 50) {
    try {
      const { data, error } = await supabaseAdmin
        .from('location_events')
        .select(`
          *,
          safe_zones (
            id,
            name,
            zone_type,
            center_latitude,
            center_longitude,
            radius_meters
          )
        `)
        .eq('user_id', userId)
        .eq('safe_zone_id', zoneId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return data || [];
      
    } catch (error) {
      logger.error('Error getting zone history:', error);
      return [];
    }
  }

  /**
   * Get a single safe zone by ID for a user
   */
  async getSafeZoneById(userId, zoneId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('safe_zones')
        .select('*')
        .eq('user_id', userId)
        .eq('id', zoneId)
        .single();

      if (error) {
        logger.error('Error fetching safe zone by ID:', error);
        return null;
      }

      return data;

    } catch (error) {
      logger.error('Error getting safe zone by ID:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Initialize zone status for a user based on their current location
   * This should be called when a user first starts tracking or logs in
   */
  async initializeUserZoneStatus(userId, currentLocation) {
    try {
      logger.info(`Initializing zone status for user ${userId}`);
      
      const safeZones = await this.getUserSafeZones(userId);
      const { latitude, longitude } = currentLocation;

      for (const zone of safeZones) {
        const distance = this.calculateDistance(
          latitude, longitude,
          zone.center_latitude, zone.center_longitude
        );
        
        const isInsideZone = distance <= (zone.radius_meters / 1000);
        const zoneKey = `${userId}_${zone.id}`;
        
        this.userZoneStatus.set(zoneKey, isInsideZone);
        
        logger.info(`Initialized zone ${zone.name}: ${isInsideZone ? 'INSIDE' : 'OUTSIDE'} (distance: ${(distance * 1000).toFixed(1)}m)`);
      }

      logger.info(`Zone status initialized for user ${userId} with ${safeZones.length} zones`);
      return true;

    } catch (error) {
      logger.error('Error initializing user zone status:', error);
      return false;
    }
  }

  /**
   * Reset zone status for a user (useful when they logout or stop tracking)
   */
  resetUserZoneStatus(userId) {
    try {
      const keys = Array.from(this.userZoneStatus.keys()).filter(key => key.startsWith(`${userId}_`));
      keys.forEach(key => this.userZoneStatus.delete(key));
      
      logger.info(`Reset zone status for user ${userId} (cleared ${keys.length} zones)`);
      return true;

    } catch (error) {
      logger.error('Error resetting user zone status:', error);
      return false;
    }
  }

  /**
   * Check if a point is inside a safe zone
   */
  isLocationInSafeZone(latitude, longitude, zone) {
    const distance = this.calculateDistance(
      latitude, longitude,
      zone.center_latitude, zone.center_longitude
    );
    return distance <= (zone.radius_meters / 1000); // Convert meters to km
  }

  /**
   * Get current zone status for a user
   */
  async getCurrentZoneStatus(userId) {
    try {
      const safeZones = await this.getUserSafeZones(userId);
      const zoneStatuses = [];

      for (const zone of safeZones) {
        const isInside = this.userZoneStatus.get(`${userId}_${zone.id}`) || false;
        zoneStatuses.push({
          zone_id: zone.id,
          zone_name: zone.name,
          zone_type: zone.zone_type,
          is_inside: isInside,
          radius_meters: zone.radius_meters
        });
      }

      return zoneStatuses;

    } catch (error) {
      logger.error('Error getting current zone status:', error);
      return [];
    }
  }
}

module.exports = new GeofencingService();
