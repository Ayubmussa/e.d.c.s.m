const pushNotificationService = require('../services/pushNotificationService');
const logger = require('../config/logger');

class NotificationController {
  async registerDevice(req, res) {
    try {
      const { device_token, platform } = req.body;

      if (!device_token) {
        return res.status(400).json({
          success: false,
          error: 'Device token is required'
        });
      }

      await pushNotificationService.registerDeviceToken(req.user.id, device_token, platform);

      res.json({
        success: true,
        message: 'Device registered for push notifications successfully'
      });
    } catch (error) {
      logger.error('Register device controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async sendTestNotification(req, res) {
    try {
      const { title, body, data } = req.body;

      const notification = {
        title: title || 'Test Notification',
        body: body || 'This is a test notification from Elderly Companion',
        data: data || {}
      };

      const result = await pushNotificationService.sendPushNotification(req.user.id, notification);

      res.json({
        success: true,
        message: 'Test notification sent successfully',
        data: result
      });
    } catch (error) {
      logger.error('Send test notification controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getNotificationSettings(req, res) {
    try {
      const { supabaseAdmin } = require('../config/database');
      const { data: settings, error } = await supabaseAdmin
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', req.user.id)
        .single();

      const defaultSettings = {
        medication_reminders: true,
        health_checkin_reminders: true,
        emergency_alerts: true,
        brain_training_reminders: true,
        family_notifications: true,
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        notification_sound: true,
        vibration: true
      };

      const userSettings = settings?.settings || defaultSettings;

      res.json({
        success: true,
        data: { settings: userSettings }
      });
    } catch (error) {
      logger.error('Get notification settings controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateNotificationSettings(req, res) {
    try {
      const { settings } = req.body;

      const { supabaseAdmin } = require('../config/database');
      const { error } = await supabaseAdmin
        .from('user_notification_settings')
        .upsert({
          user_id: req.user.id,
          settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        throw new Error('Failed to update notification settings');
      }

      res.json({
        success: true,
        message: 'Notification settings updated successfully',
        data: { settings }
      });
    } catch (error) {
      logger.error('Update notification settings controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getDeviceSubscriptions(req, res) {
    try {
      const subscriptions = await pushNotificationService.getUserSubscriptions(req.user.id);

      res.json({
        success: true,
        data: { subscriptions }
      });
    } catch (error) {
      logger.error('Get device subscriptions controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async removeDevice(req, res) {
    try {
      const { device_token } = req.body;

      if (!device_token) {
        return res.status(400).json({
          success: false,
          error: 'Device token is required'
        });
      }

      await pushNotificationService.removeInvalidToken(req.user.id, device_token);

      res.json({
        success: true,
        message: 'Device removed from push notifications successfully'
      });
    } catch (error) {
      logger.error('Remove device controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getNotificationHistory(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const { supabaseAdmin } = require('../config/database');
      
      // Enhanced error handling and logging
      if (!req.user || !req.user.id) {
        logger.error('Notification history error: User ID missing in request');
        return res.status(400).json({
          success: false,
          error: 'User information missing'
        });
      }
      
      logger.info(`Fetching notification history for user: ${req.user.id}`);
      
      try {
        const { data: notifications, error } = await supabaseAdmin
          .from('notification_history')
          .select('*')
          .eq('user_id', req.user.id)
          .limit(limit);

        if (error) {
          logger.error(`Notification history fetch error: ${JSON.stringify(error)}`);
          throw new Error('Failed to retrieve notification history');
        }

        logger.info(`Found ${notifications?.length || 0} notifications for user ${req.user.id}`);
        
        res.json({
          success: true,
          data: { notifications: notifications || [] }
        });
      } catch (dbError) {
        logger.error(`Database error in notification history: ${dbError.message}`);
        throw new Error(`Database error: ${dbError.message}`);
      }
    } catch (error) {
      logger.error('Get notification history controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async markNotificationRead(req, res) {
    try {
      const { notification_id } = req.params;

      const { supabaseAdmin } = require('../config/database');
      const { error } = await supabaseAdmin
        .from('notification_history')
        .update({ 
          read_at: new Date().toISOString(),
          is_read: true 
        })
        .eq('id', notification_id)
        .eq('user_id', req.user.id);

      if (error) {
        throw new Error('Failed to mark notification as read');
      }

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      logger.error('Mark notification read controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async sendCustomNotification(req, res) {
    try {
      const { recipient_user_id, title, body, type, data } = req.body;

      // Verify the requester has permission to send to recipient
      // This could be enhanced with proper authorization logic
      if (recipient_user_id !== req.user.id) {
        // Check if requester is an emergency contact or family member
        const { supabaseAdmin } = require('../config/database');
        const { data: contact, error } = await supabaseAdmin
          .from('emergency_contacts')
          .select('id')
          .eq('user_id', recipient_user_id)
          .eq('email', req.user.email)
          .single();

        if (error || !contact) {
          return res.status(403).json({
            success: false,
            error: 'Not authorized to send notifications to this user'
          });
        }
      }

      const notification = {
        title: title || 'New Message',
        body: body || 'You have a new message',
        data: { type: type || 'custom', ...data }
      };

      const result = await pushNotificationService.sendPushNotification(recipient_user_id, notification);

      res.json({
        success: true,
        message: 'Custom notification sent successfully',
        data: result
      });
    } catch (error) {
      logger.error('Send custom notification controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async sendEmergencyContactsSMS(req, res) {
    try {
      const { 
        message, 
        contactIds = [], 
        title = 'Emergency Notification',
        includeAllContacts = false
      } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'Message is required'
        });
      }

      // Get the contacts based on provided IDs or fetch all emergency contacts if no IDs provided
      let contacts = [];
      const { supabaseAdmin } = require('../config/database');

      // Query to get the contacts
      let query = supabaseAdmin
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', req.user.id)
        .eq('is_active', true);

      if (!includeAllContacts && contactIds.length > 0) {
        // Only fetch specific contacts if IDs provided
        query = query.in('id', contactIds);
      }
      
      const { data, error } = await query;

      if (error) {
        throw new Error('Failed to fetch emergency contacts');
      }
      contacts = data || [];

      if (contacts.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No active emergency contacts found'
        });
      }

      // Get user info to include in the notification
      const { data: user } = await supabaseAdmin
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('id', req.user.id)
        .single();

      const userName = user ? `${user.first_name} ${user.last_name}` : 'User';
      
      // Format the message with user's name if not already included
      const formattedMessage = message.includes(userName) 
        ? message 
        : `Message from ${userName}: ${message}`;

      // Send SMS notifications
      const notificationService = require('../services/notificationService');
      const result = await notificationService.sendBulkNotification(contacts, formattedMessage, {
        type: 'sms',
        subject: title,
        contactType: 'emergency_contact'
      });

      // Record the notification in history
      await supabaseAdmin
        .from('notification_history')
        .insert([{
          id: require('uuid').v4(),
          user_id: req.user.id,
          title,
          message: formattedMessage,
          type: 'emergency_contact_sms',
          data: {
            contactsNotified: result.results.map(r => ({ id: r.contactId, success: r.results?.sms?.success }))
          },
          is_read: true, // User initiated, so mark as read
          timestamp: new Date().toISOString()
        }]);

      res.json({
        success: true,
        message: `SMS notification sent to ${result.successfulDeliveries} of ${result.totalContacts} emergency contacts`,
        data: result
      });
    } catch (error) {
      logger.error('Send emergency contacts SMS controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new NotificationController();

// --- New: Send SMS to a specific user the sender has access to ---
/**
 * POST /notifications/send-user-sms
 * Body: { targetUserId, message, title }
 * Only allows sending to users the sender has an accepted relationship with.
 */
NotificationController.prototype.sendUserSMS = async function(req, res) {
  try {
    const { targetUserId, message, title = 'Direct Notification' } = req.body;
    if (!targetUserId || !message) {
      return res.status(400).json({ success: false, error: 'targetUserId and message are required' });
    }

    // Get accessible users for this user
    const { user } = req;
    const userType = user.user_type || 'unknown';
    const familyService = require('../services/familyService');
    const { familyMembers } = await familyService.getFamilyMembers(user.id, userType);
    const accessibleUser = familyMembers.find(fm => fm.userId === targetUserId);
    if (!accessibleUser) {
      return res.status(403).json({ success: false, error: 'You do not have access to this user' });
    }

    // Get target user's phone number
    const phoneNumber = accessibleUser.phoneNumber;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Target user does not have a phone number' });
    }

    // Format message
    const senderName = user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : 'A user';
    const formattedMessage = message.includes(senderName) ? message : `Message from ${senderName}: ${message}`;

    // Send SMS
    const notificationService = require('../services/notificationService');
    const smsResult = await notificationService.sendSMS(phoneNumber, formattedMessage);

    // Log in notification history
    const { supabaseAdmin } = require('../config/database');
    await supabaseAdmin.from('notification_history').insert([
      {
        id: require('uuid').v4(),
        user_id: user.id,
        title,
        message: formattedMessage,
        type: 'direct_user_sms',
        data: { targetUserId, phoneNumber, smsSid: smsResult?.sid },
        is_read: true,
        timestamp: new Date().toISOString()
      }
    ]);

    res.json({ success: true, message: 'SMS sent successfully', data: { smsSid: smsResult?.sid } });
  } catch (error) {
    logger.error('Send user SMS controller error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
