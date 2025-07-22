// backend/src/services/medicationReminderScheduler.js
// Schedules and sends medication reminders automatically

const cron = require('node-cron');
const medicationService = require('./medicationService');
const notificationService = require('./notificationService');
const logger = require('../config/logger');

// Run every minute
// Run every 3 hours
cron.schedule('* * * * *', async () => {
  try {
    logger.info('Medication reminder scheduler running...');
    // Get all users with active medications
    // This assumes you have a way to get all user IDs (adjust as needed)
    const { data: users, error } = await require('../config/database').supabaseAdmin
      .from('user_profiles')
      .select('id, first_name, last_name, phone_number');
    if (error) {
      logger.error('Error fetching users for medication reminders:', error);
      return;
    }
    for (const user of users) {
      // Get due medication reminders for this user
      const dueMedications = await medicationService.getMedicationReminders(user.id);
      for (const medication of dueMedications) {
        // Send reminder
        await notificationService.sendMedicationReminder(user, medication);
        logger.info(`Sent medication reminder for user ${user.id}, medication ${medication.id}`);
      }
    }
  } catch (err) {
    logger.error('Medication reminder scheduler error:', err);
  }
});

module.exports = {}; // No exports needed, just runs on import
