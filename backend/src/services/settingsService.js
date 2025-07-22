const { supabaseAdmin } = require('../config/database');
const logger = require('../config/logger');

class SettingsService {
  async getUserSettings(userId) {
    try {
      // Get user notification settings
      const { data: notificationSettings, error: notifError } = await supabaseAdmin
        .from('user_notification_settings')
        .select('settings')
        .eq('user_id', userId)
        .single();

      // Get user sensor settings (including emergency settings)
      const { data: sensorSettings, error: sensorError } = await supabaseAdmin
        .from('user_sensor_settings')
        .select('settings')
        .eq('user_id', userId)
        .single();

      // Default settings structure
      const defaultSettings = {
        notifications: {
          medicationReminders: true,
          healthCheckIns: true,
          emergencyAlerts: true,
          voiceCommands: true,
          brainTraining: true,
          pushEnabled: true,
          emailEnabled: false,
          smsEnabled: false,
          sound: true,
          vibration: true,
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          }
        },
        accessibility: {
          fontSize: 'medium',
          highContrast: false,
          voiceAssistant: true,
          hapticFeedback: true
        },
        privacy: {
          shareHealthData: false,
          locationTracking: true,
          analytics: true
        },
        general: {
          language: 'en',
          timeFormat: '12h',
          dateFormat: 'mm/dd/yyyy'
        }
      };

      // Merge with user's custom settings
      const userSettings = { ...defaultSettings };
      
      if (notificationSettings && !notifError) {
        userSettings.notifications = { ...userSettings.notifications, ...notificationSettings.settings };
      }

      if (sensorSettings && !sensorError) {
        userSettings.sensors = sensorSettings.settings;
      }

      return userSettings;
    } catch (error) {
      logger.error('Get user settings service error:', error);
      throw new Error('Failed to retrieve user settings');
    }
  }

  async updateUserSettings(userId, settings) {
    try {
      const updatedSettings = {};

      // Update notification settings if provided
      if (settings.notifications) {
        await this.updateNotificationSettings(userId, settings.notifications);
        updatedSettings.notifications = settings.notifications;
      }

      // Update sensor settings if provided
      if (settings.sensors) {
        await this.upsertUserSettings('user_sensor_settings', userId, settings.sensors);
        updatedSettings.sensors = settings.sensors;
      }

      // Store other settings in a general user settings table (we can create this if needed)
      const generalSettings = { ...settings };
      delete generalSettings.notifications;
      delete generalSettings.sensors;

      if (Object.keys(generalSettings).length > 0) {
        // For now, we'll just return the settings without storing general ones
        // You can extend this to store in a separate table if needed
        Object.assign(updatedSettings, generalSettings);
      }

      return updatedSettings;
    } catch (error) {
      logger.error('Update user settings service error:', error);
      throw new Error('Failed to update user settings');
    }
  }

  async updateNotificationSettings(userId, notificationSettings) {
    try {
      await this.upsertUserSettings('user_notification_settings', userId, notificationSettings);
      return notificationSettings;
    } catch (error) {
      logger.error('Update notification settings service error:', error);
      throw new Error('Failed to update notification settings');
    }
  }

  async upsertUserSettings(tableName, userId, settings) {
    try {
      // First, try to get existing settings
      const { data: existingSettings } = await supabaseAdmin
        .from(tableName)
        .select('settings')
        .eq('user_id', userId)
        .single();

      const currentSettings = existingSettings?.settings || {};
      const newSettings = { ...currentSettings, ...settings };

      if (existingSettings) {
        // Update existing settings
        const { error } = await supabaseAdmin
          .from(tableName)
          .update({ settings: newSettings })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabaseAdmin
          .from(tableName)
          .insert([{
            user_id: userId,
            settings: newSettings
          }]);

        if (error) throw error;
      }

      return newSettings;
    } catch (error) {
      logger.error(`Upsert settings error for table ${tableName}:`, error);
      throw error;
    }
  }
}

module.exports = new SettingsService();
