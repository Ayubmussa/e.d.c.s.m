const { supabaseAdmin } = require('../config/database');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');
const emergencyService = require('./emergencyService');
const geofencingService = require('./geofencingService');
const pushNotificationService = require('./pushNotificationService');

class LocationBasedSensorMonitoringService {
  constructor() {
    // Location-based monitoring thresholds (replacing movement detection)
    this.heartRateHighThreshold = parseFloat(process.env.HEART_RATE_HIGH_THRESHOLD) || 180; 
    this.heartRateLowThreshold = parseFloat(process.env.HEART_RATE_LOW_THRESHOLD) || 35; 
    this.emergencyHeartRateThreshold = 200; // Immediate emergency threshold
    this.criticalLowHeartRateThreshold = 30; // Immediate emergency threshold
    this.inactivityThreshold = parseInt(process.env.INACTIVITY_THRESHOLD_MINUTES) || 240; // 4 hours
    this.locationAccuracyThreshold = 100; // Minimum GPS accuracy in meters
    
    this.userActivityTracker = new Map(); // Track last activity per user
    this.lastLocationUpdate = new Map(); // Track last location update per user
    
    // APP-DRIVEN ONLY: This service only processes data when explicitly called by the mobile app
    this.isAppDriven = true;
    this.lastAppActivity = new Map(); // Track when each user's app was last active
    
    logger.info('Location-Based Sensor Monitoring Service initialized - APP-DRIVEN MODE ONLY');
    logger.info('Primary monitoring: Location-based geofencing, heart rate, and emergency detection');
    logger.info('Removed: Movement/fall detection (replaced with location monitoring)');
  }

  async processSensorData(userId, sensorData) {
    try {
      // Record that the app is actively sending sensor data
      this.lastAppActivity.set(userId, Date.now());
      
      // Log app activity for monitoring
      logger.info(`App-driven sensor data received from user ${userId} - app is active`);
      
      // Process location data first (primary monitoring)
      let locationEvents = [];
      if (sensorData.location) {
        const locationResult = await geofencingService.processLocationData(userId, sensorData.location);
        if (locationResult.success && locationResult.events) {
          locationEvents = locationResult.events;
          this.lastLocationUpdate.set(userId, Date.now());
          
          // Log successful location processing
          logger.info(`Location processed for user ${userId}: ${locationEvents.length} events`);
        }
      }
      
      // Analyze health sensor data (heart rate, activity level)
      const processedData = await this.analyzeHealthSensorData(userId, sensorData);
      
      // Store sensor data (only when app is active)
      await this.storeSensorData(userId, sensorData, processedData);
      
      // Check for health emergencies (heart rate, etc.)
      const emergencyDetected = await this.detectHealthEmergencies(userId, processedData);
      
      // Update activity tracker
      this.updateUserActivity(userId);
      
      return {
        processed_data: processedData,
        location_events: locationEvents,
        emergency_detected: emergencyDetected,
        timestamp: new Date().toISOString(),
        app_driven: true,
        source: 'mobile_app'
      };
    } catch (error) {
      logger.error('Sensor data processing error:', error);
      throw error;
    }
  }

  async analyzeHealthSensorData(userId, sensorData) {
    const {
      heart_rate,
      step_count,
      ambient_light,
      battery_level,
      timestamp,
      location
    } = sensorData;

    const analysis = {
      health_status: 'normal',
      activity_level: 'unknown',
      location_tracked: false,
      anomalies: [],
      timestamp: timestamp || new Date().toISOString()
    };

    // Heart rate analysis - primary health monitoring
    if (heart_rate) {
      analysis.heart_rate = heart_rate;
      
      // Critical heart rate thresholds
      if (heart_rate > this.emergencyHeartRateThreshold) {
        analysis.health_status = 'critical';
        analysis.anomalies.push('dangerously_high_heart_rate');
        logger.error(`CRITICAL: Dangerously high heart rate detected for user ${userId}: ${heart_rate} BPM`);
      } else if (heart_rate < this.criticalLowHeartRateThreshold) {
        analysis.health_status = 'critical';
        analysis.anomalies.push('dangerously_low_heart_rate');
        logger.error(`CRITICAL: Dangerously low heart rate detected for user ${userId}: ${heart_rate} BPM`);
      } else if (heart_rate > this.heartRateHighThreshold || heart_rate < this.heartRateLowThreshold) {
        analysis.health_status = 'concerning';
        analysis.anomalies.push('abnormal_heart_rate');
        logger.warn(`Abnormal heart rate detected for user ${userId}: ${heart_rate} BPM`);
      }
    }

    // Activity level assessment
    if (step_count !== undefined) {
      const recentSteps = await this.getRecentStepCount(userId, 60); // Last hour
      analysis.hourly_steps = recentSteps + (step_count || 0);
      
      if (analysis.hourly_steps === 0) {
        analysis.activity_level = 'inactive';
      } else if (analysis.hourly_steps < 50) {
        analysis.activity_level = 'low';
      } else if (analysis.hourly_steps < 200) {
        analysis.activity_level = 'moderate';
      } else {
        analysis.activity_level = 'high';
      }
    }

    // Location tracking status
    if (location && location.latitude && location.longitude) {
      analysis.location_tracked = true;
      analysis.location_accuracy = location.accuracy;
      
      // Check GPS accuracy
      if (location.accuracy && location.accuracy > this.locationAccuracyThreshold) {
        analysis.anomalies.push('poor_gps_accuracy');
        logger.warn(`Poor GPS accuracy for user ${userId}: ${location.accuracy}m`);
      }
    }

    // Battery level check (important for continuous monitoring)
    if (battery_level !== undefined) {
      analysis.battery_level = battery_level;
      if (battery_level < 20) {
        analysis.anomalies.push('low_battery');
        logger.warn(`Low battery detected for user ${userId}: ${battery_level}%`);
      }
    }

    return analysis;
  }

  async detectHealthEmergencies(userId, analysisData) {
    try {
      const emergencies = [];

      // Check for critical health conditions
      if (analysisData.health_status === 'critical') {
        for (const anomaly of analysisData.anomalies) {
          if (anomaly === 'dangerously_high_heart_rate' || anomaly === 'dangerously_low_heart_rate') {
            const emergency = {
              type: 'health_emergency',
              subtype: anomaly,
              severity: 'critical',
              heart_rate: analysisData.heart_rate,
              message: `Critical heart rate detected: ${analysisData.heart_rate} BPM`,
              requires_immediate_attention: true
            };
            
            emergencies.push(emergency);
            await this.handleHealthEmergency(userId, emergency);
          }
        }
      }

      // Check for prolonged inactivity (only if we have step data)
      if (analysisData.activity_level === 'inactive') {
        const lastActivity = this.userActivityTracker.get(userId);
        if (lastActivity) {
          const inactiveMinutes = (Date.now() - lastActivity.lastActivity) / (1000 * 60);
          if (inactiveMinutes > this.inactivityThreshold) {
            const emergency = {
              type: 'inactivity_alert',
              severity: 'moderate',
              inactive_minutes: Math.round(inactiveMinutes),
              message: `User has been inactive for ${Math.round(inactiveMinutes)} minutes`,
              requires_immediate_attention: false
            };
            
            emergencies.push(emergency);
            await this.handleInactivityAlert(userId, emergency);
          }
        }
      }

      return emergencies.length > 0 ? emergencies : false;

    } catch (error) {
      logger.error('Error detecting health emergencies:', error);
      return false;
    }
  }

  async handleHealthEmergency(userId, emergency) {
    try {
      logger.error(`HEALTH EMERGENCY detected for user ${userId}:`, emergency);

      // Create emergency alert
      const alertData = {
        user_id: userId,
        alert_type: 'health_anomaly',
        message: emergency.message,
        status: 'active',
        location: null // Will be updated by emergency service if available
      };

      // Send immediate notifications for critical emergencies
      if (emergency.requires_immediate_attention) {
        await emergencyService.createEmergencyAlert(alertData);
        logger.info(`Critical health emergency alert sent for user ${userId}`);
      }

    } catch (error) {
      logger.error('Error handling health emergency:', error);
    }
  }

  async handleInactivityAlert(userId, emergency) {
    try {
      logger.warn(`INACTIVITY ALERT for user ${userId}:`, emergency);

      // Only send inactivity alerts once per day to avoid spam
      const today = new Date().toISOString().split('T')[0];
      const alertKey = `inactivity_${userId}_${today}`;
      
      // Check if we already sent an inactivity alert today
      const existingAlert = await this.checkExistingAlert(userId, 'inactivity_detected', today);
      if (existingAlert) {
        logger.info(`Inactivity alert already sent today for user ${userId}`);
        return;
      }

      const alertData = {
        user_id: userId,
        alert_type: 'inactivity_detected',
        message: emergency.message,
        status: 'active'
      };

      await emergencyService.createEmergencyAlert(alertData);
      logger.info(`Inactivity alert sent for user ${userId}`);

    } catch (error) {
      logger.error('Error handling inactivity alert:', error);
    }
  }

  async checkExistingAlert(userId, alertType, date) {
    try {
      const { data, error } = await supabaseAdmin
        .from('emergency_alerts')
        .select('id')
        .eq('user_id', userId)
        .eq('alert_type', alertType)
        .gte('triggered_at', `${date}T00:00:00.000Z`)
        .lt('triggered_at', `${date}T23:59:59.999Z`)
        .limit(1);

      if (error) {
        logger.error('Error checking existing alerts:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      logger.error('Error checking existing alerts:', error);
      return false;
    }
  }

  async storeSensorData(userId, rawData, analysisData) {
    try {
      const { data, error } = await supabaseAdmin
        .from('sensor_data_logs')
        .insert({
          user_id: userId,
          raw_sensor_data: rawData,
          processed_data: analysisData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Error storing sensor data:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Error storing sensor data:', error);
      return null;
    }
  }

  updateUserActivity(userId) {
    this.userActivityTracker.set(userId, {
      lastActivity: Date.now(),
      lastLocationUpdate: this.lastLocationUpdate.get(userId) || null
    });
  }

  async getRecentStepCount(userId, minutes) {
    try {
      const sinceTime = new Date(Date.now() - minutes * 60 * 1000).toISOString();
      
      const { data, error } = await supabaseAdmin
        .from('sensor_data_logs')
        .select('raw_sensor_data')
        .eq('user_id', userId)
        .gte('created_at', sinceTime)
        .not('raw_sensor_data->step_count', 'is', null);

      if (error || !data) return 0;

      const totalSteps = data.reduce((sum, record) => {
        return sum + (record.raw_sensor_data?.step_count || 0);
      }, 0);

      return totalSteps;
    } catch (error) {
      logger.error('Error getting recent step count:', error);
      return 0;
    }
  }

  async getSensorDataHistory(userId, hours = 24) {
    try {
      const sinceTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabaseAdmin
        .from('sensor_data_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', sinceTime)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching sensor data history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error getting sensor data history:', error);
      return [];
    }
  }

  async getUserActivitySummary(userId, days = 7) {
    try {
      const sinceTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabaseAdmin
        .from('sensor_data_logs')
        .select('processed_data, created_at')
        .eq('user_id', userId)
        .gte('created_at', sinceTime)
        .order('created_at', { ascending: false });

      if (error || !data) {
        return {
          total_readings: 0,
          average_activity_level: 'unknown',
          location_updates: 0,
          health_anomalies: 0
        };
      }

      const summary = {
        total_readings: data.length,
        location_updates: data.filter(d => d.processed_data?.location_tracked).length,
        health_anomalies: data.filter(d => d.processed_data?.anomalies?.length > 0).length,
        activity_levels: {},
        average_heart_rate: 0
      };

      // Calculate activity level distribution
      let heartRateSum = 0;
      let heartRateCount = 0;
      
      data.forEach(record => {
        const processed = record.processed_data;
        if (processed?.activity_level) {
          summary.activity_levels[processed.activity_level] = 
            (summary.activity_levels[processed.activity_level] || 0) + 1;
        }
        if (processed?.heart_rate) {
          heartRateSum += processed.heart_rate;
          heartRateCount++;
        }
      });

      if (heartRateCount > 0) {
        summary.average_heart_rate = Math.round(heartRateSum / heartRateCount);
      }

      return summary;
    } catch (error) {
      logger.error('Error getting user activity summary:', error);
      return { error: error.message };
    }
  }

  // Keep this method for compatibility but always return false
  async checkInactivityForAllUsers() {
    logger.info('Inactivity checking disabled - app-driven mode only');
    return false;
  }

  isAppActive(userId) {
    const lastActivity = this.lastAppActivity.get(userId);
    if (!lastActivity) return false;
    
    // Consider app active if data was received in the last 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return lastActivity > fiveMinutesAgo;
  }
}

module.exports = new LocationBasedSensorMonitoringService();
