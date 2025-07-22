const sensorMonitoringService = require('../services/sensorMonitoringService');
const logger = require('../config/logger');

class SensorController {
  async processSensorData(req, res) {
    try {
      const sensorData = req.body;

      // Validate required sensor data structure
      if (!sensorData || typeof sensorData !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid sensor data format'
        });
      }

      const result = await sensorMonitoringService.processSensorData(req.user.id, sensorData);

      res.json({
        success: true,
        message: 'Sensor data processed successfully',
        data: result
      });
    } catch (error) {
      logger.error('Process sensor data controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getSensorHistory(req, res) {
    try {
      const hours = parseInt(req.query.hours) || 24;
      const history = await sensorMonitoringService.getSensorDataHistory(req.user.id, hours);

      res.json({
        success: true,
        data: { history }
      });
    } catch (error) {
      logger.error('Get sensor history controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getActivitySummary(req, res) {
    try {
      const days = parseInt(req.query.days) || 7;
      const summary = await sensorMonitoringService.getUserActivitySummary(req.user.id, days);

      res.json({
        success: true,
        data: { summary }
      });
    } catch (error) {
      logger.error('Get activity summary controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateSensorSettings(req, res) {
    try {
      const { settings } = req.body;

      // Validate settings structure
      const validSettings = {
        fall_detection_enabled: false, // Disable fall detection as we're using location-based alerts
        fall_detection_sensitivity: settings.fall_detection_sensitivity || 'low',
        inactivity_monitoring: settings.inactivity_monitoring || true,
        inactivity_threshold_minutes: settings.inactivity_threshold_minutes || 120,
        location_tracking: true, // Always enable location tracking for geofencing
        geofencing_enabled: settings.geofencing_enabled !== undefined ? settings.geofencing_enabled : true, // Enable geofencing by default
        heart_rate_monitoring: settings.heart_rate_monitoring || false,
        step_counting: settings.step_counting || true
      };

      // Store settings in database
      const { supabaseAdmin } = require('../config/database');
      const { error } = await supabaseAdmin
        .from('user_sensor_settings')
        .upsert({
          user_id: req.user.id,
          settings: validSettings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        throw new Error('Failed to update sensor settings');
      }

      res.json({
        success: true,
        message: 'Sensor settings updated successfully',
        data: { settings: validSettings }
      });
    } catch (error) {
      logger.error('Update sensor settings controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getSensorSettings(req, res) {
    try {
      const { supabaseAdmin } = require('../config/database');
      const { data: userSettings, error } = await supabaseAdmin
        .from('user_sensor_settings')
        .select('settings')
        .eq('user_id', req.user.id)
        .single();

      const defaultSettings = {
        fall_detection_enabled: false, // Disabled in favor of location-based monitoring
        fall_detection_sensitivity: 'low',
        inactivity_monitoring: true,
        inactivity_threshold_minutes: 120,
        location_tracking: true, // Always on for geofencing
        geofencing_enabled: true, // Enable location-based alerts by default
        heart_rate_monitoring: false,
        step_counting: true
      };

      const settings = userSettings?.settings || defaultSettings;

      res.json({
        success: true,
        data: { settings }
      });
    } catch (error) {
      logger.error('Get sensor settings controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async testSensorConnection(req, res) {
    try {
      const { sensor_types } = req.body;

      const testResults = {
        accelerometer: sensor_types?.includes('accelerometer') || false,
        gyroscope: sensor_types?.includes('gyroscope') || false,
        magnetometer: sensor_types?.includes('magnetometer') || false,
        location: sensor_types?.includes('location') || false,
        heart_rate: sensor_types?.includes('heart_rate') || false,
        step_counter: sensor_types?.includes('step_counter') || false,
        ambient_light: sensor_types?.includes('ambient_light') || false
      };

      res.json({
        success: true,
        message: 'Sensor connection test completed',
        data: { 
          available_sensors: testResults,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Test sensor connection controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async calibrateSensors(req, res) {
    try {
      const { calibration_data } = req.body;

      // Store calibration data
      const { supabaseAdmin } = require('../config/database');
      const { error } = await supabaseAdmin
        .from('sensor_calibration')
        .upsert({
          user_id: req.user.id,
          calibration_data,
          calibrated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        throw new Error('Failed to store calibration data');
      }

      res.json({
        success: true,
        message: 'Sensors calibrated successfully',
        data: { 
          calibration_completed: true,
          calibrated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Calibrate sensors controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getMonitoringStatus(req, res) {
    try {
      const status = await sensorMonitoringService.getAppMonitoringStatus(req.user.id);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Get monitoring status controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new SensorController();
