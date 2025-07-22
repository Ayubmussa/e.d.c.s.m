const cron = require('node-cron');
const { supabaseAdmin } = require('../config/database');
const logger = require('../config/logger');
const notificationService = require('./notificationService');
const pushNotificationService = require('./pushNotificationService');
const sensorMonitoringService = require('./sensorMonitoringService');

class SchedulerService {
  constructor() {
    this.initializeScheduledTasks();
  }

  initializeScheduledTasks() {
    // Medication reminders - check every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      await this.checkMedicationReminders();
    });

    // Daily health check-in reminders - 9 AM every day
    cron.schedule('0 9 * * *', async () => {
      await this.sendDailyCheckinReminders();
    });

    // Brain training reminders - 10 AM every Sunday
    cron.schedule('0 10 * * 0', async () => {
      await this.sendBrainTrainingReminders();
    });

    // Inactivity monitoring - check every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      await this.checkUserInactivity();
    });

    // Clean up old data - daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldData();
    });

    // Emergency alert follow-ups - every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.checkEmergencyAlertFollowups();
    });

    logger.info('Scheduled tasks initialized');
  }

  async checkMedicationReminders() {
    try {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      const today = now.toISOString().split('T')[0];

      // Get medications that are due now
      const { data: medications, error } = await supabaseAdmin
        .from('medications')
        .select(`
          *,
          user_profiles!inner(id, first_name, phone_number)
        `)
        .eq('is_active', true)
        .lte('start_date', today)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .contains('times', [currentTime]);

      if (error) {
        logger.error('Medication reminder query error:', error);
        return;
      }

      for (const medication of medications) {
        try {
          // Check if reminder already sent today for this time
          const { data: existingLog, error: logError } = await supabaseAdmin
            .from('medication_logs')
            .select('id')
            .eq('user_id', medication.user_id)
            .eq('medication_id', medication.id)
            .gte('scheduled_time', `${today}T${currentTime}:00.000Z`)
            .lt('scheduled_time', `${today}T${currentTime}:59.999Z`)
            .single();

          if (logError && logError.code === 'PGRST116') {
            // No existing log, send reminder
            await this.sendMedicationReminder(medication);
            
            // Log the scheduled medication
            await supabaseAdmin
              .from('medication_logs')
              .insert({
                user_id: medication.user_id,
                medication_id: medication.id,
                status: 'pending', // Fixed: use 'status' instead of 'taken'
                scheduled_time: `${today}T${currentTime}:00.000Z`,
                notes: 'Automated reminder sent'
              });
          }
        } catch (medicationError) {
          logger.error(`Error processing medication reminder for ${medication.id}:`, medicationError);
        }
      }

      logger.info(`Checked medication reminders at ${currentTime}`);
    } catch (error) {
      logger.error('Check medication reminders error:', error);
    }
  }

  async sendMedicationReminder(medication) {
    try {
      const user = medication.user_profiles;
      
      // Send SMS notification
      await notificationService.sendMedicationReminder(user, medication);
      
      // Send push notification
      await pushNotificationService.sendMedicationReminder(user.id, medication);
      
      logger.info(`Medication reminder sent to ${user.first_name} for ${medication.name}`);
    } catch (error) {
      logger.error('Send medication reminder error:', error);
    }
  }

  async sendDailyCheckinReminders() {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get users who haven't completed today's check-in
      const { data: users, error } = await supabaseAdmin
        .from('user_profiles')
        .select(`
          id, first_name, phone_number,
          health_checkins!left(id)
        `)
        .eq('is_active', true)
        .is('health_checkins.checkin_date', null)
        .or(`health_checkins.checkin_date.neq.${today}`);

      if (error) {
        logger.error('Daily check-in reminder query error:', error);
        return;
      }

      for (const user of users) {
        try {
          // Send SMS reminder
          await notificationService.sendDailyCheckinReminder(user);
          
          // Send push notification
          await pushNotificationService.sendHealthCheckinReminder(user.id, user.first_name);
          
          logger.info(`Daily check-in reminder sent to ${user.first_name}`);
        } catch (userError) {
          logger.error(`Error sending daily reminder to user ${user.id}:`, userError);
        }
      }

      logger.info(`Sent daily check-in reminders to ${users.length} users`);
    } catch (error) {
      logger.error('Send daily check-in reminders error:', error);
    }
  }

  async sendBrainTrainingReminders() {
    try {
      // Get users who haven't done brain training this week
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: users, error } = await supabaseAdmin
        .from('user_profiles')
        .select(`
          id, first_name, phone_number,
          brain_training_sessions!left(id)
        `)
        .eq('is_active', true)
        .or(`brain_training_sessions.completed_at.is.null,brain_training_sessions.completed_at.lt.${weekAgo}`);

      if (error) {
        logger.error('Brain training reminder query error:', error);
        return;
      }

      for (const user of users) {
        try {
          // Send push notification
          await pushNotificationService.sendBrainTrainingReminder(user.id, user.first_name);
          
          logger.info(`Brain training reminder sent to ${user.first_name}`);
        } catch (userError) {
          logger.error(`Error sending brain training reminder to user ${user.id}:`, userError);
        }
      }

      logger.info(`Sent brain training reminders to ${users.length} users`);
    } catch (error) {
      logger.error('Send brain training reminders error:', error);
    }
  }

  async checkUserInactivity() {
    try {
      const thresholdMinutes = parseInt(process.env.INACTIVITY_THRESHOLD_MINUTES) || 120;
      const thresholdTime = new Date(Date.now() - thresholdMinutes * 60 * 1000).toISOString();

      // Get users with no recent sensor data
      const { data: inactiveUsers, error } = await supabaseAdmin
        .from('user_profiles')
        .select(`
          id, first_name, last_name,
          sensor_data_logs!left(id, created_at)
        `)
        .eq('is_active', true)
        .or(`sensor_data_logs.created_at.is.null,sensor_data_logs.created_at.lt.${thresholdTime}`)
        .order('sensor_data_logs.created_at', { ascending: false })
        .limit(1);

      if (error) {
        logger.error('Inactivity check query error:', error);
        return;
      }

      for (const user of inactiveUsers) {
        try {
          // Create inactivity alert
          const emergencyService = require('./emergencyService');
          await emergencyService.createAlert(user.id, {
            alert_type: 'inactivity_detected',
            message: `User ${user.first_name} ${user.last_name} has been inactive for over ${thresholdMinutes} minutes`
          });

          logger.warn(`Inactivity alert created for user ${user.id}`);
        } catch (userError) {
          logger.error(`Error creating inactivity alert for user ${user.id}:`, userError);
        }
      }
    } catch (error) {
      logger.error('Check user inactivity error:', error);
    }
  }

  async cleanupOldData() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Clean up old sensor data
      await sensorMonitoringService.cleanupOldData(30);

      // Clean up old voice interactions
      const { error: voiceError } = await supabaseAdmin
        .from('voice_interactions')
        .delete()
        .lt('processed_at', thirtyDaysAgo);

      if (voiceError) {
        logger.error('Voice interactions cleanup error:', voiceError);
      }

      // Clean up old notification history
      const { error: notificationError } = await supabaseAdmin
        .from('notification_history')
        .delete()
        .lt('timestamp', thirtyDaysAgo);

      if (notificationError) {
        logger.error('Notification history cleanup error:', notificationError);
      }

      logger.info('Old data cleanup completed');
    } catch (error) {
      logger.error('Cleanup old data error:', error);
    }
  }

  async checkEmergencyAlertFollowups() {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      // Get active emergency alerts that haven't been resolved
      const { data: activeAlerts, error } = await supabaseAdmin
        .from('emergency_alerts')
        .select(`
          *,
          user_profiles!inner(first_name, last_name)
        `)
        .eq('status', 'active')
        .lt('triggered_at', fiveMinutesAgo);

      if (error) {
        logger.error('Emergency alert followup query error:', error);
        return;
      }

      for (const alert of activeAlerts) {
        try {
          // Send follow-up notification to emergency contacts
          const emergencyService = require('./emergencyService');
          await emergencyService.notifyEmergencyContacts(alert.user_id, {
            ...alert,
            message: `FOLLOW-UP: ${alert.message} - Alert still active after 5 minutes`
          });

          logger.warn(`Emergency alert follow-up sent for alert ${alert.id}`);
        } catch (alertError) {
          logger.error(`Error sending follow-up for alert ${alert.id}:`, alertError);
        }
      }
    } catch (error) {
      logger.error('Check emergency alert follow-ups error:', error);
    }
  }

  // Manual trigger methods for testing
  async triggerMedicationCheck() {
    await this.checkMedicationReminders();
  }

  async triggerDailyReminders() {
    await this.sendDailyCheckinReminders();
  }

  async triggerBrainTrainingReminders() {
    await this.sendBrainTrainingReminders();
  }
}

// Initialize the scheduler service
const schedulerService = new SchedulerService();

module.exports = schedulerService;
