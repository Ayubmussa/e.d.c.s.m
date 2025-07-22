const { supabaseAdmin } = require('../config/database');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');
const emergencyService = require('./emergencyService');
const geofencingService = require('./geofencingService');
const pushNotificationService = require('./pushNotificationService');

class SensorMonitoringService {
  constructor() {
    // Location-based monitoring is now the PRIMARY alert mechanism
    this.heartRateHighThreshold = parseFloat(process.env.HEART_RATE_HIGH_THRESHOLD) || 180; 
    this.heartRateLowThreshold = parseFloat(process.env.HEART_RATE_LOW_THRESHOLD) || 35; 
    this.inactivityThreshold = parseInt(process.env.INACTIVITY_THRESHOLD_MINUTES) || 240; // 4 hours
    this.locationAccuracyThreshold = 100; // Minimum GPS accuracy in meters
    this.emergencyHeartRateThreshold = 200; // Immediate emergency threshold
    this.criticalLowHeartRateThreshold = 30; // Immediate emergency threshold
    
    // Location-based alert priorities
    this.locationAlertPriority = {
      'zone_exit': 'high',        // Elder left safe zone - HIGH priority
      'zone_entry': 'medium',     // Elder entered safe zone - confirmation
      'location_update': 'low'    // Regular location tracking
    };
    
    this.userActivityTracker = new Map(); // Track last activity per user
    this.lastLocationUpdate = new Map(); // Track last location update per user
    
    // APP-DRIVEN ONLY: This service only processes data when explicitly called by the mobile app
    this.isAppDriven = true;
    this.lastAppActivity = new Map(); // Track when each user's app was last active
    
    logger.info('Location-Based Sensor Monitoring Service initialized - APP-DRIVEN MODE ONLY');
    logger.info('PRIMARY ALERTS: Location-based geofencing (zone entry/exit detection)');
    logger.info('SECONDARY MONITORING: Heart rate emergencies and inactivity detection');
    logger.info('REMOVED: Movement/fall detection (fully replaced with location monitoring)');
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

  async analyzeNewSensorData(userId, sensorData) {
    const {
      accelerometer,
      gyroscope,
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
      anomalies: []
    };
    if (accelerometer) {
      const { x, y, z } = accelerometer;
      const totalAcceleration = Math.sqrt(x*x + y*y + z*z);
      const jerk = this.calculateJerk(userId, accelerometer);
      
      analysis.total_acceleration = totalAcceleration;
      analysis.jerk = jerk;
      
      // Much stricter fall detection logic - only very severe impacts
      if (totalAcceleration > this.fallDetectionThreshold) {
        analysis.fall_risk_score = Math.min(100, (totalAcceleration / this.fallDetectionThreshold) * 100);
        analysis.anomalies.push('severe_impact');
        logger.warn(`Severe impact detected for user ${userId}: ${totalAcceleration.toFixed(2)}g (threshold: ${this.fallDetectionThreshold}g)`);
      }
      
      // Only trigger on very sudden, violent movements
      if (jerk > this.jerkThreshold) {
        analysis.fall_risk_score += 40; // Increased penalty for violent movement
        analysis.anomalies.push('violent_movement');
        logger.warn(`Violent movement detected for user ${userId}: jerk ${jerk.toFixed(2)} (threshold: ${this.jerkThreshold})`);
      }
    }

    // Gyroscope analysis for orientation changes - much stricter
    if (gyroscope) {
      const { x, y, z } = gyroscope;
      const rotationMagnitude = Math.sqrt(x*x + y*y + z*z);
      
      // Only trigger on very rapid, extreme rotations (like a fall or violent shake)
      if (rotationMagnitude > this.rotationThreshold) {
        analysis.fall_risk_score += 30; // Increased penalty
        analysis.anomalies.push('extreme_rotation');
        logger.warn(`Extreme rotation detected for user ${userId}: ${rotationMagnitude.toFixed(2)} (threshold: ${this.rotationThreshold})`);
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

    // Heart rate analysis - only extreme values
    if (heart_rate) {
      analysis.heart_rate = heart_rate;
      
      // Only trigger on truly dangerous heart rates
      if (heart_rate > this.heartRateHighThreshold || heart_rate < this.heartRateLowThreshold) {
        analysis.anomalies.push('critical_heart_rate');
        logger.warn(`Critical heart rate detected for user ${userId}: ${heart_rate} BPM (normal range: ${this.heartRateLowThreshold}-${this.heartRateHighThreshold})`);
      }
    }

    // Location change detection
    if (location) {
      const lastLocation = await this.getLastLocation(userId);
      if (lastLocation) {
        const distance = this.calculateDistance(location, lastLocation);
        analysis.location_change = distance > 0.1; // 100 meters threshold
        analysis.distance_moved = distance;
      }
    }

    // Device orientation analysis - more restrictive
    if (device_orientation) {
      analysis.device_orientation = device_orientation;
      
      // Only trigger if device is face down AND there was a very strong impact (suggesting a fall)
      if (device_orientation === 'face_down' && analysis.total_acceleration > this.deviceImpactThreshold) {
        analysis.fall_risk_score += 35; // Increased penalty
        analysis.anomalies.push('device_impact_with_drop');
        logger.warn(`Device impact with drop detected for user ${userId}: ${analysis.total_acceleration.toFixed(2)}g while face down`);
      }
    }

    return analysis;
  }

  calculateJerk(userId, currentAccel) {
    const userBuffer = this.sensorDataBuffer.get(userId) || [];
    
    if (userBuffer.length === 0) {
      this.sensorDataBuffer.set(userId, [currentAccel]);
      return 0;
    }

    const lastAccel = userBuffer[userBuffer.length - 1];
    const jerk = Math.sqrt(
      Math.pow(currentAccel.x - lastAccel.x, 2) +
      Math.pow(currentAccel.y - lastAccel.y, 2) +
      Math.pow(currentAccel.z - lastAccel.z, 2)
    );

    // Keep only last 5 readings instead of 10 to be less sensitive to normal movement patterns
    userBuffer.push(currentAccel);
    if (userBuffer.length > 5) {
      userBuffer.shift();
    }
    this.sensorDataBuffer.set(userId, userBuffer);

    // Apply smoothing to reduce noise from normal movements
    if (userBuffer.length >= 3) {
      const recentJerks = [];
      for (let i = 1; i < userBuffer.length; i++) {
        const prevAccel = userBuffer[i-1];
        const currAccel = userBuffer[i];
        const sampleJerk = Math.sqrt(
          Math.pow(currAccel.x - prevAccel.x, 2) +
          Math.pow(currAccel.y - prevAccel.y, 2) +
          Math.pow(currAccel.z - prevAccel.z, 2)
        );
        recentJerks.push(sampleJerk);
      }
      
      // Return the average jerk to smooth out noise
      return recentJerks.reduce((sum, j) => sum + j, 0) / recentJerks.length;
    }

    return jerk;
  }

  async detectEmergencies(userId, analysisData) {
    const emergencies = [];

    // Much stricter fall detection - only trigger on very high risk scores
    if (analysisData.fall_risk_score > this.fallRiskCriticalThreshold) {
      // Require confirmation from multiple readings to prevent false alarms
      const shouldTriggerAlert = await this.confirmEmergencyPattern(userId, 'fall_detected', analysisData);
      
      if (shouldTriggerAlert) {
        emergencies.push({
          type: 'fall_detected',
          severity: analysisData.fall_risk_score > 95 ? 'critical' : 'high',
          details: `Critical fall risk score: ${analysisData.fall_risk_score}% (confirmed pattern)`,
          anomalies: analysisData.anomalies,
          confirmed: true
        });
        logger.error(`CONFIRMED FALL EMERGENCY for user ${userId}: score ${analysisData.fall_risk_score}%`);
      } else {
        logger.info(`Potential fall detected for user ${userId} (score: ${analysisData.fall_risk_score}%) - awaiting confirmation`);
      }
    }

    // App inactivity detection - only meaningful when app was recently active
    // This detects if the user stopped using the app (app closed, phone off, etc.)
    const appInactivityDuration = this.getAppInactivityDuration(userId);
    if (appInactivityDuration) {
      const appInactiveMinutes = appInactivityDuration / (1000 * 60);
      
      // Only trigger inactivity alert if:
      // 1. App was active recently (within last hour) but now stopped
      // 2. App has been inactive for more than the threshold
      if (appInactiveMinutes > 60 && appInactiveMinutes > this.inactivityThreshold) {
        emergencies.push({
          type: 'app_inactivity',
          severity: appInactiveMinutes > this.inactivityThreshold * 1.5 ? 'high' : 'medium',
          details: `Mobile app inactive for ${Math.round(appInactiveMinutes)} minutes (${Math.round(appInactiveMinutes/60)} hours) - user may need assistance`,
          inactive_duration: appInactiveMinutes,
          app_driven: true
        });
        logger.warn(`App inactivity detected for user ${userId}: ${Math.round(appInactiveMinutes)} minutes since last app activity`);
      }
    }

    // Traditional sensor-based inactivity (only when app is active)
    if (this.isAppActive(userId)) {
      const lastActivity = this.userActivityTracker.get(userId);
      if (lastActivity) {
        const inactiveMinutes = (Date.now() - lastActivity) / (1000 * 60);
        if (inactiveMinutes > this.inactivityThreshold) {
          emergencies.push({
            type: 'prolonged_inactivity',
            severity: inactiveMinutes > this.inactivityThreshold * 1.5 ? 'high' : 'medium',
            details: `No movement detected for ${Math.round(inactiveMinutes)} minutes (${Math.round(inactiveMinutes/60)} hours) while app is active`,
            inactive_duration: inactiveMinutes,
            app_driven: true
          });
          logger.warn(`Movement inactivity detected for user ${userId}: ${Math.round(inactiveMinutes)} minutes (app is active)`);
        }
      }
    }

    // Only truly critical heart rate emergencies
    if (analysisData.heart_rate) {
      if (analysisData.heart_rate > this.heartRateHighThreshold || analysisData.heart_rate < this.heartRateLowThreshold) {
        const shouldTriggerAlert = await this.confirmEmergencyPattern(userId, 'critical_heart_rate', analysisData);
        
        if (shouldTriggerAlert) {
          emergencies.push({
            type: 'critical_heart_rate',
            severity: 'critical',
            details: `Critical heart rate: ${analysisData.heart_rate} BPM (confirmed pattern)`,
            heart_rate: analysisData.heart_rate,
            confirmed: true
          });
          logger.error(`CONFIRMED HEART RATE EMERGENCY for user ${userId}: ${analysisData.heart_rate} BPM`);
        } else {
          logger.info(`Critical heart rate detected for user ${userId} (${analysisData.heart_rate} BPM) - awaiting confirmation`);
        }
      }
    }

    // Process confirmed emergencies only
    for (const emergency of emergencies) {
      if (emergency.confirmed || emergency.type === 'prolonged_inactivity' || emergency.type === 'app_inactivity') {
        await this.handleEmergencyDetection(userId, emergency);
      }
    }

    return emergencies;
  }

  async handleEmergencyDetection(userId, emergency) {
    try {
      // Create emergency alert
      const alert = await emergencyService.createAlert(userId, {
        alert_type: 'sensor_detected',
        message: `${emergency.type}: ${emergency.details}`,
        location: null // Will be updated with latest location if available
      });

      // Send immediate push notification
      await pushNotificationService.sendEmergencyNotification(userId, {
        userName: 'User', // Will be updated with actual name
        alertId: alert.id,
        location: null
      });

      logger.warn(`Emergency detected for user ${userId}: ${emergency.type}`);
      
      return alert;
    } catch (error) {
      logger.error('Emergency detection handling error:', error);
      throw error;
    }
  }

  async storeSensorData(userId, rawData, analysisData) {
    try {
      const sensorLogId = uuidv4();
      
      const { error } = await supabaseAdmin
        .from('sensor_data_logs')
        .insert({
          id: sensorLogId,
          user_id: userId,
          raw_sensor_data: rawData,
          analysis_data: analysisData,
          created_at: new Date().toISOString()
        });

      if (error) {
        logger.error('Sensor data storage error:', error);
      }
    } catch (error) {
      logger.error('Store sensor data error:', error);
    }
  }

  updateUserActivity(userId) {
    this.userActivityTracker.set(userId, Date.now());
  }

  async getRecentStepCount(userId, minutes) {
    try {
      const startTime = new Date(Date.now() - minutes * 60 * 1000).toISOString();
      
      const { data, error } = await supabaseAdmin
        .from('sensor_data_logs')
        .select('raw_sensor_data')
        .eq('user_id', userId)
        .gte('created_at', startTime)
        .order('created_at', { ascending: false });

      if (error || !data) return 0;

      let totalSteps = 0;
      data.forEach(log => {
        if (log.raw_sensor_data?.step_count) {
          totalSteps += log.raw_sensor_data.step_count;
        }
      });

      return totalSteps;
    } catch (error) {
      logger.error('Get recent step count error:', error);
      return 0;
    }
  }

  async getLastLocation(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('sensor_data_logs')
        .select('raw_sensor_data')
        .eq('user_id', userId)
        .not('raw_sensor_data->location', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      return data.raw_sensor_data?.location;
    } catch (error) {
      logger.error('Get last location error:', error);
      return null;
    }
  }

  calculateDistance(loc1, loc2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(loc2.latitude - loc1.latitude);
    const dLon = this.toRadians(loc2.longitude - loc1.longitude);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(loc1.latitude)) * Math.cos(this.toRadians(loc2.latitude)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  async getSensorDataHistory(userId, hours = 24) {
    try {
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabaseAdmin
        .from('sensor_data_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startTime)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('Failed to retrieve sensor data history');
      }

      return data;
    } catch (error) {
      logger.error('Get sensor data history error:', error);
      throw error;
    }
  }

  async getUserActivitySummary(userId, days = 7) {
    try {
      const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabaseAdmin
        .from('sensor_data_logs')
        .select('analysis_data, created_at')
        .eq('user_id', userId)
        .gte('created_at', startTime)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('Failed to retrieve activity summary');
      }

      // Aggregate data by day
      const dailySummary = {};
      
      data.forEach(log => {
        const date = log.created_at.split('T')[0];
        if (!dailySummary[date]) {
          dailySummary[date] = {
            total_readings: 0,
            avg_activity_level: 0,
            emergencies: 0,
            step_count: 0
          };
        }
        
        dailySummary[date].total_readings++;
        
        if (log.analysis_data?.hourly_steps) {
          dailySummary[date].step_count += log.analysis_data.hourly_steps;
        }
        
        if (log.analysis_data?.anomalies?.length > 0) {
          dailySummary[date].emergencies++;
        }
      });

      return dailySummary;
    } catch (error) {
      logger.error('Get activity summary error:', error);
      throw error;
    }
  }

  // Clean up old sensor data
  async cleanupOldData(daysToKeep = 30) {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabaseAdmin
        .from('sensor_data_logs')
        .delete()
        .lt('created_at', cutoffDate);

      if (error) {
        logger.error('Sensor data cleanup error:', error);
      } else {
        logger.info(`Cleaned up sensor data older than ${daysToKeep} days`);
      }
    } catch (error) {
      logger.error('Cleanup old data error:', error);
    }
  }

  // Method to confirm emergency patterns - requires multiple concerning readings
  async confirmEmergencyPattern(userId, emergencyType, analysisData) {
    const confirmationKey = `${userId}_${emergencyType}`;
    
    if (!this.emergencyConfirmationBuffer.has(confirmationKey)) {
      this.emergencyConfirmationBuffer.set(confirmationKey, []);
    }
    
    const confirmationBuffer = this.emergencyConfirmationBuffer.get(confirmationKey);
    
    // Add current concerning reading
    confirmationBuffer.push({
      timestamp: Date.now(),
      data: analysisData,
      score: analysisData.fall_risk_score || 0
    });
    
    // Keep only recent readings (last 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentReadings = confirmationBuffer.filter(reading => reading.timestamp > fiveMinutesAgo);
    this.emergencyConfirmationBuffer.set(confirmationKey, recentReadings);
    
    // Require at least 3 concerning readings within 5 minutes to confirm emergency
    if (recentReadings.length >= this.confirmationRequiredReadings) {
      // Calculate average severity
      const avgScore = recentReadings.reduce((sum, reading) => sum + reading.score, 0) / recentReadings.length;
      
      if (avgScore > this.fallRiskCriticalThreshold) {
        // Clear the buffer after confirmation
        this.emergencyConfirmationBuffer.delete(confirmationKey);
        logger.info(`Emergency pattern confirmed for user ${userId}: ${emergencyType} (${recentReadings.length} readings, avg score: ${avgScore.toFixed(1)})`);
        return true;
      }
    }
    
    return false;
  }

  // Check if user's app is currently active (sent data recently)
  isAppActive(userId) {
    const lastActivity = this.lastAppActivity.get(userId);
    if (!lastActivity) return false;
    
    // Consider app active if sensor data was received within last 2 minutes
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    return lastActivity > twoMinutesAgo;
  }

  // Get app inactivity duration (how long since app last sent sensor data)
  getAppInactivityDuration(userId) {
    const lastActivity = this.lastAppActivity.get(userId);
    if (!lastActivity) return null;
    
    return Date.now() - lastActivity;
  }

  // Get current app monitoring status for a user
  getAppMonitoringStatus(userId) {
    const lastAppActivity = this.lastAppActivity.get(userId);
    const lastSensorActivity = this.userActivityTracker.get(userId);
    const isActive = this.isAppActive(userId);
    const appInactivityDuration = this.getAppInactivityDuration(userId);
    
    return {
      app_driven_mode: this.isAppDriven,
      is_app_active: isActive,
      last_app_activity: lastAppActivity ? new Date(lastAppActivity).toISOString() : null,
      last_sensor_activity: lastSensorActivity ? new Date(lastSensorActivity).toISOString() : null,
      app_inactive_minutes: appInactivityDuration ? Math.round(appInactivityDuration / (1000 * 60)) : null,
      monitoring_active: isActive,
      note: isActive ? 'Sensor monitoring is active - app is running' : 'Sensor monitoring is inactive - app is not sending data'
    };
  }
}

module.exports = new SensorMonitoringService();
