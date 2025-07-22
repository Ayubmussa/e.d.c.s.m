const twilio = require('twilio');
const logger = require('../config/logger');
const pushNotificationService = require('./pushNotificationService');
const emailService = require('./emailService');

class NotificationService {
  constructor() {
    this.twilioClient = null;
    this.smsCount = 0; // Track daily SMS count
    this.lastResetDate = new Date().toDateString(); // Track when counter was last reset
    this.maxDailySMS = 8; // Leave 1 SMS buffer for Twilio's 9-message limit
    
    // Email throttling properties
    this.emailCount = 0; // Track daily email count
    this.maxDailyEmails = 50; // Reasonable limit for emails per day
    this.lastEmailResetDate = new Date().toDateString();
    this.lastSensorAlertTime = {}; // Track last sensor alert time per user to prevent spam
    this.sensorAlertCooldown = 30 * 60 * 1000; // 30 minutes cooldown for sensor alerts
    
    // Only initialize Twilio if credentials are properly configured
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (accountSid && authToken && 
        !accountSid.includes('your_') && 
        !authToken.includes('your_') &&
        accountSid.startsWith('AC')) {
      try {
        this.twilioClient = twilio(accountSid, authToken);
        logger.info('Twilio SMS service initialized successfully');
      } catch (error) {
        logger.warn('Twilio initialization failed:', error.message);
        this.twilioClient = null;
      }
    } else {
      logger.warn('Twilio credentials not configured properly - SMS features disabled');
    }
  }

  // SMS throttling methods
  resetSmsCounterIfNeeded() {
    const currentDate = new Date().toDateString();
    if (this.lastResetDate !== currentDate) {
      this.smsCount = 0;
      this.lastResetDate = currentDate;
      logger.info('SMS counter reset for new day');
    }
  }

  canSendSMS() {
    this.resetSmsCounterIfNeeded();
    return this.smsCount < this.maxDailySMS;
  }

  // Email throttling methods
  resetEmailCounterIfNeeded() {
    const currentDate = new Date().toDateString();
    if (this.lastEmailResetDate !== currentDate) {
      this.emailCount = 0;
      this.lastEmailResetDate = currentDate;
      logger.info('Email counter reset for new day');
    }
  }

  canSendEmail() {
    this.resetEmailCounterIfNeeded();
    return this.emailCount < this.maxDailyEmails;
  }

  canSendSensorAlert(userId) {
    const now = Date.now();
    const lastAlertTime = this.lastSensorAlertTime[userId] || 0;
    
    if (now - lastAlertTime < this.sensorAlertCooldown) {
      logger.info(`Sensor alert for user ${userId} blocked due to cooldown period`);
      return false;
    }
    
    return true;
  }

  recordSensorAlert(userId) {
    this.lastSensorAlertTime[userId] = Date.now();
  }

  // Phone number validation and cleaning helper
  isValidPhoneNumber(phoneNumber) {
    if (!phoneNumber) return false;
    
    // Remove all non-digit characters except leading +
    const cleaned = phoneNumber.startsWith('+') 
      ? '+' + phoneNumber.substring(1).replace(/\D/g, '')
      : phoneNumber.replace(/\D/g, '');
    
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
    
    return !testPatterns.some(pattern => pattern.test(cleaned));
  }
  
  // Clean and format phone number for SMS delivery
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    
    // Keep leading + for international format, remove all other non-digits
    const cleaned = phoneNumber.startsWith('+') 
      ? '+' + phoneNumber.substring(1).replace(/\D/g, '')
      : phoneNumber.replace(/\D/g, '');
      
    // For US numbers without country code, add +1
    if (cleaned.length === 10 && !cleaned.startsWith('+') && !cleaned.startsWith('1')) {
      return `+1${cleaned}`;
    }
    
    // For numbers that don't start with +, add it
    if (!cleaned.startsWith('+')) {
      return `+${cleaned}`;
    }
    
    return cleaned;
  }

  async sendEmergencyNotification(contact, alertInfo) {
    try {
      // Check if this is a sensor alert and if we should throttle it
      if (alertInfo.alertType === 'sensor_detected') {
        if (!this.canSendSensorAlert(contact.user_id)) {
          logger.info(`Sensor alert email to ${contact.name} throttled due to cooldown period`);
          return { 
            success: false, 
            throttled: true,
            message: 'Alert throttled to prevent spam'
          };
        }
        this.recordSensorAlert(contact.user_id);
      }

      const message = this.formatEmergencyMessage(contact.name, alertInfo);
      let notificationResults = {
        sms: null,
        email: null
      };
      
      // Only send SMS for user-initiated alerts, not sensor alerts
      const shouldSendSMS = alertInfo.alertType !== 'sensor_detected' && 
                           ['sos_alert', 'direct_email', 'manual_alert'].includes(alertInfo.alertType);
      
      // Send SMS notification with validation (only for user-initiated alerts)
      if (shouldSendSMS && this.twilioClient && contact.phone_number) {
        if (this.canSendSMS() && this.isValidPhoneNumber(contact.phone_number)) {
          try {
            // Send SMS and get the result
            const smsResult = await this.sendSMS(contact.phone_number, message);
            notificationResults.sms = {
              success: true,
              messageId: smsResult?.sid,
              timestamp: new Date().toISOString()
            };
            logger.info(`Emergency SMS sent to ${contact.name} (${contact.phone_number}) - SID: ${smsResult?.sid}`);
          } catch (smsError) {
            // Check for specific Twilio errors
            if (smsError.code === 63038) {
              logger.warn(`Daily SMS limit exceeded for Twilio account`);
              notificationResults.sms = { success: false, error: 'SMS daily limit exceeded', code: smsError.code };
            } else if (smsError.code === 21211) {
              logger.warn(`Invalid phone number format: ${contact.phone_number}`);
              notificationResults.sms = { success: false, error: 'Invalid phone number format', code: smsError.code };
            } else {
              logger.error(`SMS failed for ${contact.name}:`, smsError);
              notificationResults.sms = { success: false, error: smsError.message, code: smsError.code };
            }
            // Don't throw here, continue with email if available
          }
        } else {
          if (!this.canSendSMS()) {
            logger.warn(`SMS to ${contact.name} skipped - daily SMS limit reached`);
            notificationResults.sms = { success: false, error: 'Daily SMS limit reached' };
          } else {
            logger.warn(`Skipping SMS to ${contact.name} - invalid phone number: ${contact.phone_number}`);
            notificationResults.sms = { success: false, error: 'Invalid phone number format (validation failed)' };
          }
        }
      } else {
        if (alertInfo.alertType === 'sensor_detected') {
          logger.info(`SMS to ${contact.name} skipped - sensor alerts don't send SMS`);
          notificationResults.sms = { success: false, error: 'SMS disabled for sensor alerts' };
        } else if (!this.twilioClient) {
          logger.warn(`SMS to ${contact.name} skipped - Twilio not configured`);
          notificationResults.sms = { success: false, error: 'Twilio not configured' };
        } else if (!contact.phone_number) {
          logger.warn(`SMS to ${contact.name} skipped - No phone number provided`);
          notificationResults.sms = { success: false, error: 'No phone number provided' };
        }
      }

      // Send email notification if available and within limits
      if (contact.email && this.canSendEmail()) {
        try {
          const emailSubject = alertInfo.alertType === 'sensor_detected' ? 
            'Health Monitoring Alert' : 'Emergency Alert';
          
          // Pass the user's name as the sender for dynamic "from" name
          const emailOptions = {
            senderName: alertInfo.userName || 'User'
          };
          
          await this.sendEmail(contact.email, emailSubject, message, emailOptions);
          this.emailCount++; // Increment email counter
          logger.info(`Emergency email sent to ${contact.name} (${contact.email})`);
          notificationResults.email = { success: true, timestamp: new Date().toISOString() };
        } catch (emailError) {
          logger.error(`Email failed for ${contact.name}:`, emailError);
          notificationResults.email = { success: false, error: emailError.message };
        }
      } else {
        if (!contact.email) {
          logger.warn(`Email to ${contact.name} skipped - No email provided`);
          notificationResults.email = { success: false, error: 'No email provided' };
        } else if (!this.canSendEmail()) {
          logger.warn(`Email to ${contact.name} skipped - Daily email limit reached`);
          notificationResults.email = { success: false, error: 'Daily email limit reached' };
        }
      }

      // Record notification attempt in the database for tracking
      try {
        const { supabaseAdmin } = require('../config/database');
        await supabaseAdmin
          .from('notification_history')
          .insert([{
            id: require('uuid').v4(),
            user_id: contact.user_id,
            recipient_id: contact.id,
            recipient_type: 'emergency_contact',
            title: 'Emergency Alert',
            message: message,
            type: 'emergency_alert',
            delivery_status: JSON.stringify(notificationResults),
            is_read: false,
            timestamp: new Date().toISOString()
          }]);
      } catch (dbError) {
        logger.error('Failed to record notification attempt:', dbError);
      }

      return { success: true, results: notificationResults };
    } catch (error) {
      logger.error('Send emergency notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendMedicationReminder(user, medication) {
    try {
      const message = `Hi ${user.first_name}, this is a reminder to take your medication: ${medication.name} (${medication.dosage}). Time: ${new Date().toLocaleTimeString()}`;
      
      if (this.twilioClient && user.phone_number) {
        await this.sendSMS(user.phone_number, message);
      }

      // Also send push notification
      await pushNotificationService.sendMedicationReminder(user.id, medication);

      logger.info(`Medication reminder sent to ${user.first_name} ${user.last_name}`);
      return true;
    } catch (error) {
      logger.error('Send medication reminder error:', error);
      throw error;
    }
  }

  async sendDailyCheckinReminder(user) {
    try {
      const message = `Hello ${user.first_name}! Don't forget to complete your daily health check-in. Your family cares about your wellbeing.`;
      
      if (this.twilioClient && user.phone_number) {
        await this.sendSMS(user.phone_number, message);
      }

      // Also send push notification
      await pushNotificationService.sendHealthCheckinReminder(user.id, user.first_name);

      logger.info(`Daily check-in reminder sent to ${user.first_name} ${user.last_name}`);
      return true;
    } catch (error) {
      logger.error('Send daily check-in reminder error:', error);
      throw error;
    }
  }

  async sendFamilyNotification(contact, user, notificationType, data = {}) {
    try {
      let message;
      
      switch (notificationType) {
        case 'daily_checkin_completed':
          message = `${user.first_name} has completed their daily health check-in. Everything looks good!`;
          break;
        case 'missed_medication':
          message = `${user.first_name} missed taking their medication: ${data.medicationName}. You may want to check in with them.`;
          break;
        case 'low_mood_alert':
          message = `${user.first_name} reported a low mood today. Consider reaching out to offer support.`;
          break;
        case 'high_pain_alert':
          message = `${user.first_name} reported high pain levels today. They may need medical attention.`;
          break;
        default:
          message = `Update from ${user.first_name}: ${data.message || 'General notification'}`;
      }

      if (this.twilioClient && contact.phone_number) {
        await this.sendSMS(contact.phone_number, message);
      }

      if (contact.email) {
        await this.sendEmail(contact.email, `Update on ${user.first_name}`, message);
      }

      logger.info(`Family notification sent to ${contact.name}: ${notificationType}`);
      return true;
    } catch (error) {
      logger.error('Send family notification error:', error);
      throw error;
    }
  }

  async sendSMS(phoneNumber, message) {
    try {
      if (!this.twilioClient) {
        logger.warn('Twilio not configured, skipping SMS');
        return null;
      }

      // Check if we can send SMS (throttling)
      if (!this.canSendSMS()) {
        logger.warn(`Daily SMS limit reached (${this.maxDailySMS}), skipping SMS to ${phoneNumber}`);
        throw new Error('Daily SMS limit reached for this account');
      }

      // Validate phone number format
      if (!this.isValidPhoneNumber(phoneNumber)) {
        throw new Error(`Invalid phone number format: ${phoneNumber}`);
      }
      
      // Format the phone number for SMS delivery
      const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);
      if (!formattedPhoneNumber) {
        throw new Error(`Could not format phone number: ${phoneNumber}`);
      }

      // Check if we have a valid Twilio phone number
      const twilioFromNumber = process.env.TWILIO_PHONE_NUMBER;
      if (!twilioFromNumber) {
        logger.error('Twilio phone number not configured');
        throw new Error('Twilio phone number not configured');
      }

      // Send SMS via Twilio
      const result = await this.twilioClient.messages.create({
        body: message,
        from: twilioFromNumber,
        to: formattedPhoneNumber
      });

      // Increment SMS counter on successful send
      this.smsCount++;
      logger.info(`SMS sent successfully: ${result.sid} to ${formattedPhoneNumber} (${this.smsCount}/${this.maxDailySMS} daily limit)`);
      return result;
    } catch (error) {
      // Add specific error handling for common Twilio errors
      if (error.code === 63038) {
        logger.error('Twilio daily message limit exceeded. Consider upgrading your Twilio account.');
        // Set our counter to max to prevent further attempts
        this.smsCount = this.maxDailySMS;
      } else if (error.code === 21211) {
        logger.error(`Invalid phone number format: ${phoneNumber}`);
      } else if (error.code === 21614) {
        logger.error(`Phone number is not verified for trial account: ${phoneNumber}`);
      } else {
        logger.error('Send SMS error:', error);
      }
      throw error;
    }
  }

  async sendEmail(email, subject, message, options = {}) {
    try {
      if (!email) {
        logger.warn('No email address provided for email notification');
        return { success: false, error: 'No email address provided' };
      }

      // Use the real email service to send emails, pass through options
      const result = await emailService.sendEmail(email, subject, message, null, options);
      logger.info(`Email sent to ${email}: ${subject}`);
      return result;
    } catch (error) {
      logger.error('Send email error:', error);
      return { success: false, error: error.message };
    }
  }

  formatEmergencyMessage(contactName, alertInfo) {
    const locationText = alertInfo.location 
      ? `Location: ${alertInfo.location.address || `${alertInfo.location.latitude}, ${alertInfo.location.longitude}`}` 
      : 'Location: Not available';
    
    return `🚨 EMERGENCY ALERT 🚨
${alertInfo.userName} has triggered an emergency alert.
Type: ${alertInfo.alertType}
${alertInfo.message ? `Message: ${alertInfo.message}` : ''}
${locationText}
Time: ${new Date(alertInfo.triggeredAt).toLocaleString()}

Please check on them immediately or contact emergency services if needed.`;
  }

  async sendBulkNotification(contacts, message, options = {}) {
    const results = [];
    const type = options.type || 'sms';
    const subject = options.subject || 'Notification';
    let successCount = 0;
    
    // Process contacts in parallel for faster delivery
    const notificationPromises = contacts.map(async (contact) => {
      try {
        const contactResult = {
          contactId: contact.id,
          name: contact.name,
          contactType: options.contactType || 'general',
          results: {}
        };
        
        // Send SMS if requested and phone number exists
        if ((type === 'sms' || type === 'all') && contact.phone_number) {
          try {
            if (this.isValidPhoneNumber(contact.phone_number)) {
              const smsResult = await this.sendSMS(contact.phone_number, message);
              contactResult.results.sms = { 
                success: true, 
                messageId: smsResult?.sid,
                timestamp: new Date().toISOString()
              };
              successCount++;
              logger.info(`Bulk SMS sent to ${contact.name} (${contact.phone_number}) - SID: ${smsResult?.sid}`);
            } else {
              contactResult.results.sms = { 
                success: false, 
                error: 'Invalid phone number format'
              };
              logger.warn(`Skipping bulk SMS to ${contact.name} - invalid phone number: ${contact.phone_number}`);
            }
          } catch (smsError) {
            contactResult.results.sms = { 
              success: false, 
              error: smsError.message,
              code: smsError.code
            };
            logger.error(`Bulk SMS failed for ${contact.name}:`, smsError);
          }
        }
        
        // Send email if requested and email exists
        if ((type === 'email' || type === 'all') && contact.email) {
          try {
            await this.sendEmail(contact.email, subject, message);
            contactResult.results.email = { 
              success: true,
              timestamp: new Date().toISOString()
            };
            logger.info(`Bulk email sent to ${contact.name} (${contact.email})`);
          } catch (emailError) {
            contactResult.results.email = { 
              success: false, 
              error: emailError.message
            };
            logger.error(`Bulk email failed for ${contact.name}:`, emailError);
          }
        }
        
        results.push(contactResult);
        return contactResult;
      } catch (error) {
        logger.error(`Failed to send bulk notification to contact ${contact.id}:`, error);
        results.push({ 
          contactId: contact.id, 
          name: contact.name,
          success: false, 
          error: error.message 
        });
        return null;
      }
    });
    
    // Wait for all notifications to complete
    await Promise.all(notificationPromises);
    
    // Log summary
    logger.info(`Bulk notification summary: ${successCount}/${contacts.length} successful deliveries`);
    
    return {
      success: successCount > 0,
      totalContacts: contacts.length,
      successfulDeliveries: successCount,
      results: results
    };
  }
}

module.exports = new NotificationService();
