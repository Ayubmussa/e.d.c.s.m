const { supabaseAdmin } = require('../config/database');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');
const notificationService = require('./notificationService');

class EmergencyService {
  async createAlert(userId, alertData, options = {}) {
    try {
      // Enhanced throttling: Check for recent similar alerts to prevent spam
      const recentThreshold = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      const { data: recentAlerts } = await supabaseAdmin
        .from('emergency_alerts')
        .select('id, alert_type, triggered_at, message')
        .eq('user_id', userId)
        .eq('alert_type', alertData.alert_type)
        .gte('triggered_at', recentThreshold.toISOString())
        .order('triggered_at', { ascending: false })
        .limit(1);

      // If there's a recent similar alert, don't create a new one
      if (recentAlerts && recentAlerts.length > 0) {
        const lastAlert = recentAlerts[0];
        const timeSince = new Date() - new Date(lastAlert.triggered_at);
        const minutesSince = Math.round(timeSince / (1000 * 60));
        
        logger.info(`Skipping duplicate ${alertData.alert_type} alert for user ${userId} - similar alert created ${minutesSince} minutes ago (ID: ${lastAlert.id})`);
        return lastAlert;
      }

      // Daily email limit check - only for user-initiated alerts that send emails
      if (options.notifyContacts !== false && alertData.alert_type !== 'sensor_detected' && !options.bypassDailyLimit) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const { data: todayAlerts } = await supabaseAdmin
          .from('emergency_alerts')
          .select('id, alert_type, triggered_at')
          .eq('user_id', userId)
          .gte('triggered_at', todayStart.toISOString())
          .neq('alert_type', 'sensor_detected') // Exclude sensor alerts from count
          .order('triggered_at', { ascending: false });

        if (todayAlerts && todayAlerts.length >= 1) {
          logger.warn(`Daily email limit reached for user ${userId} - ${todayAlerts.length} alerts already sent today`);
          // Still create the alert but don't send notifications
          options.notifyContacts = false;
        }
      }

      const alertId = uuidv4();
      const { data: alert, error } = await supabaseAdmin
        .from('emergency_alerts')
        .insert([{
          id: alertId,
          user_id: userId,
          ...alertData
        }])
        .select('*')
        .single();

      if (error) {
        logger.error('Create emergency alert error:', error);
        throw new Error('Failed to create emergency alert');
      }

      logger.info(`Created ${alertData.alert_type} alert for user ${userId} (ID: ${alertId})`);

      // Only notify emergency contacts for user-initiated alerts, not sensor alerts
      if (options.notifyContacts !== false && alertData.alert_type !== 'sensor_detected') {
        await this.notifyEmergencyContacts(userId, alert);
      } else if (alertData.alert_type === 'sensor_detected') {
        logger.info(`Sensor alert created for user ${userId} but no notifications sent to prevent spam`);
      } else if (options.notifyContacts === false) {
        logger.info(`Alert created for user ${userId} but notifications skipped due to daily limit`);
      }

      return alert;
    } catch (error) {
      logger.error('Emergency alert service error:', error);
      throw error;
    }
  }

  async getUserAlerts(userId, limit = 20) {
    try {
      const { data: alerts, error } = await supabaseAdmin
        .from('emergency_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('triggered_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Get emergency alerts error:', error);
        throw new Error('Failed to retrieve emergency alerts');
      }

      return alerts;
    } catch (error) {
      logger.error('Get emergency alerts service error:', error);
      throw error;
    }
  }

  async updateAlertStatus(userId, alertId, status, resolvedBy = null) {
    try {
      const updateData = { 
        status,
        resolved_at: status === 'resolved' || status === 'false_alarm' ? new Date().toISOString() : null
      };

      if (resolvedBy) {
        updateData.resolved_by = resolvedBy;
      }

      const { data: alert, error } = await supabaseAdmin
        .from('emergency_alerts')
        .update(updateData)
        .eq('id', alertId)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) {
        logger.error('Update emergency alert error:', error);
        throw new Error('Failed to update emergency alert');
      }

      return alert;
    } catch (error) {
      logger.error('Update emergency alert service error:', error);
      throw error;
    }
  }

  async notifyEmergencyContacts(userId, alert) {
    try {
      // Get user's emergency contacts
      const { data: contacts, error } = await supabaseAdmin
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false });

      if (error) {
        logger.error('Get emergency contacts error:', error);
        return;
      }

      // Get user info
      const { data: user } = await supabaseAdmin
        .from('user_profiles')
        .select('first_name, last_name, user_type')
        .eq('id', userId)
        .single();

      const userName = user ? `${user.first_name} ${user.last_name}` : 'User';

      // Send notifications to emergency contacts
      for (const contact of contacts) {
        try {
          await notificationService.sendEmergencyNotification(contact, {
            userName,
            alertType: alert.alert_type,
            message: alert.message,
            location: alert.location,
            triggeredAt: alert.triggered_at
          });
        } catch (notificationError) {
          logger.error(`Failed to notify emergency contact ${contact.id}:`, notificationError);
        }
      }

      // --- NEW: Notify family/caregivers by email if alert is from an elder ---
      if (user && user.user_type === 'elderly') {
        try {
          const familyService = require('./familyService');
          const { familyMembers } = await familyService.getFamilyMembers(userId, user.user_type);
          for (const member of familyMembers) {
            if (member.email) {
              // Use notificationService to send email
              await notificationService.sendEmail(
                member.email,
                'Emergency Alert',
                `🚨 EMERGENCY ALERT 🚨\n${userName} has triggered an emergency alert.\nType: ${alert.alert_type}\nMessage: ${alert.message}`
              );
              logger.info(`Emergency email sent to family/caregiver: ${member.email}`);
            }
          }
        } catch (famErr) {
          logger.error('Failed to notify family/caregivers:', famErr);
        }
      }

      // Update alert to mark contacts as notified
      await supabaseAdmin
        .from('emergency_alerts')
        .update({ emergency_contacts_notified: true })
        .eq('id', alert.id);

    } catch (error) {
      logger.error('Notify emergency contacts error:', error);
    }
  }

  // Phone number validation helper
  isValidPhoneNumber(phoneNumber) {
    if (!phoneNumber) return false;
    
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid format (at least 10 digits for US numbers)
    // Don't allow test numbers like 123456XXXX
    if (cleaned.length < 10 || cleaned.length > 15) return false;
    
    // Check for obvious test patterns
    const testPatterns = [
      /^1234567?890$/, // 1234567890
      /^(\d)\1{9,}$/, // Repeated digits like 1111111111
      /.*X{3,}.*/i, // Contains XXX or similar
      /^555.*$/, // Starts with 555 (often test numbers)
    ];
    
    return !testPatterns.some(pattern => pattern.test(phoneNumber));
  }

  async createEmergencyContact(userId, contactData) {
    try {
      // Validate phone number if provided
      if (contactData.phone_number && !this.isValidPhoneNumber(contactData.phone_number)) {
        throw new Error(`Invalid phone number format: ${contactData.phone_number}. Please provide a valid phone number.`);
      }

      const contactId = uuidv4();
      const { data: contact, error } = await supabaseAdmin
        .from('emergency_contacts')
        .insert([{
          id: contactId,
          user_id: userId,
          ...contactData
        }])
        .select('*')
        .single();

      if (error) {
        logger.error('Create emergency contact error:', error);
        throw new Error('Failed to create emergency contact');
      }

      return contact;
    } catch (error) {
      logger.error('Emergency contact service error:', error);
      throw error;
    }
  }

  async getUserEmergencyContacts(userId) {
    try {
      const { data: contacts, error } = await supabaseAdmin
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false });

      if (error) {
        logger.error('Get emergency contacts error:', error);
        throw new Error('Failed to retrieve emergency contacts');
      }

      return contacts;
    } catch (error) {
      logger.error('Get emergency contacts service error:', error);
      throw error;
    }
  }

  async updateEmergencyContact(userId, contactId, updateData) {
    try {
      // Validate phone number if being updated
      if (updateData.phone_number && !this.isValidPhoneNumber(updateData.phone_number)) {
        throw new Error(`Invalid phone number format: ${updateData.phone_number}. Please provide a valid phone number.`);
      }

      const { data: contact, error } = await supabaseAdmin
        .from('emergency_contacts')
        .update(updateData)
        .eq('id', contactId)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) {
        logger.error('Update emergency contact error:', error);
        throw new Error('Failed to update emergency contact');
      }

      return contact;
    } catch (error) {
      logger.error('Update emergency contact service error:', error);
      throw error;
    }
  }

  async deleteEmergencyContact(userId, contactId) {
    try {
      const { error } = await supabaseAdmin
        .from('emergency_contacts')
        .update({ is_active: false })
        .eq('id', contactId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Delete emergency contact error:', error);
        throw new Error('Failed to delete emergency contact');
      }

      return true;
    } catch (error) {
      logger.error('Delete emergency contact service error:', error);
      throw error;
    }
  }

  async getEmergencySettings(userId) {
    try {
      const { data: settings, error } = await supabaseAdmin
        .from('user_sensor_settings')
        .select('settings')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        logger.error('Get emergency settings error:', error);
        throw new Error('Failed to retrieve emergency settings');
      }

      // Return default settings if none exist
      const defaultSettings = {
        fallDetectionEnabled: false,
        sosEnabled: true,
        fallThreshold: 20,
        inactivityEnabled: false,
        inactivityThreshold: 120,
        samplingRate: 10
      };

      return settings ? { ...defaultSettings, ...settings.settings } : defaultSettings;
    } catch (error) {
      logger.error('Get emergency settings service error:', error);
      throw error;
    }
  }

  async updateEmergencySettings(userId, settingsUpdate) {
    try {
      // First, try to get existing settings
      const { data: existingSettings } = await supabaseAdmin
        .from('user_sensor_settings')
        .select('settings')
        .eq('user_id', userId)
        .single();

      const currentSettings = existingSettings?.settings || {};
      const newSettings = { ...currentSettings, ...settingsUpdate };

      let result;
      if (existingSettings) {
        // Update existing settings
        const { data, error } = await supabaseAdmin
          .from('user_sensor_settings')
          .update({ settings: newSettings })
          .eq('user_id', userId)
          .select('*')
          .single();

        result = data;
        if (error) throw error;
      } else {
        // Insert new settings
        const { data, error } = await supabaseAdmin
          .from('user_sensor_settings')
          .insert([{
            user_id: userId,
            settings: newSettings
          }])
          .select('*')
          .single();

        result = data;
        if (error) throw error;
      }

      return result.settings;
    } catch (error) {
      logger.error('Update emergency settings service error:', error);
      throw new Error('Failed to update emergency settings');
    }
  }

  // Helper method to check if user has reached daily email limit
  async checkDailyEmailLimit(userId) {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const { data: todayAlerts } = await supabaseAdmin
        .from('emergency_alerts')
        .select('id, alert_type, triggered_at')
        .eq('user_id', userId)
        .gte('triggered_at', todayStart.toISOString())
        .neq('alert_type', 'sensor_detected') // Exclude sensor alerts from count
        .order('triggered_at', { ascending: false });

      const emailsSentToday = todayAlerts ? todayAlerts.length : 0;
      const dailyLimit = 1; // 1 email per day per user

      return {
        limitReached: emailsSentToday >= dailyLimit,
        emailsSentToday,
        dailyLimit,
        remainingEmails: Math.max(0, dailyLimit - emailsSentToday)
      };
    } catch (error) {
      logger.error('Check daily email limit error:', error);
      return {
        limitReached: false,
        emailsSentToday: 0,
        dailyLimit: 1,
        remainingEmails: 1,
        error: error.message
      };
    }
  }

  // Method to create an emergency alert that bypasses daily limits (for true emergencies)
  async createUrgentAlert(userId, alertData) {
    try {
      logger.warn(`Creating urgent alert for user ${userId} - bypassing daily limits`);
      
      // Force notifications to be sent regardless of daily limits
      const options = { 
        notifyContacts: true,
        bypassDailyLimit: true 
      };
      
      // Still check for recent duplicates to prevent spam
      const recentThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago for urgent alerts
      const { data: recentAlerts } = await supabaseAdmin
        .from('emergency_alerts')
        .select('id, alert_type, triggered_at')
        .eq('user_id', userId)
        .eq('alert_type', alertData.alert_type)
        .gte('triggered_at', recentThreshold.toISOString())
        .limit(1);

      if (recentAlerts && recentAlerts.length > 0) {
        logger.warn(`Urgent alert blocked - similar alert created within 5 minutes for user ${userId}`);
        return recentAlerts[0];
      }

      const alertId = uuidv4();
      const { data: alert, error } = await supabaseAdmin
        .from('emergency_alerts')
        .insert([{
          id: alertId,
          user_id: userId,
          priority: 'urgent',
          ...alertData
        }])
        .select('*')
        .single();

      if (error) {
        logger.error('Create urgent alert error:', error);
        throw new Error('Failed to create urgent alert');
      }

      logger.warn(`Created urgent ${alertData.alert_type} alert for user ${userId} (ID: ${alertId})`);

      // Always send notifications for urgent alerts
      await this.notifyEmergencyContacts(userId, alert);

      return alert;
    } catch (error) {
      logger.error('Urgent alert service error:', error);
      throw error;
    }
  }
}

module.exports = new EmergencyService();
