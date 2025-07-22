const admin = require('firebase-admin');
const webpush = require('web-push');
const logger = require('../config/logger');
const { supabaseAdmin } = require('../config/database');

class PushNotificationService {
  constructor() {
    this.initializeFirebase();
    this.initializeWebPush();
  }

  initializeFirebase() {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

      // Check if credentials are properly configured (not placeholders)
      if (projectId && privateKey && clientEmail && 
          !projectId.includes('your_') && 
          !privateKey.includes('your_') && 
          !clientEmail.includes('your_')) {
        
        const serviceAccount = {
          type: "service_account",
          project_id: projectId,
          private_key: privateKey.replace(/\\n/g, '\n'),
          client_email: clientEmail,
        };

        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: projectId
          });
        }

        this.messaging = admin.messaging();
        logger.info('Firebase Admin SDK initialized successfully');
      } else {
        logger.warn('Firebase credentials not configured properly - push notifications disabled');
        this.messaging = null;
      }
    } catch (error) {
      logger.error('Firebase initialization error:', error);
      this.messaging = null;
    }
  }

  initializeWebPush() {
    try {
      if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        webpush.setVapidDetails(
          process.env.VAPID_SUBJECT || 'mailto:support@elderlycompanion.com',
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        );
        logger.info('Web Push initialized successfully');
      } else {
        logger.warn('VAPID keys not provided, web push notifications disabled');
      }
    } catch (error) {
      logger.error('Web Push initialization error:', error);
    }
  }

  async registerDeviceToken(userId, token, platform = 'unknown') {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_device_tokens')
        .upsert({
          user_id: userId,
          device_token: token,
          platform,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,device_token'
        });

      if (error) {
        logger.error('Device token registration error:', error);
        throw new Error('Failed to register device token');
      }

      logger.info(`Device token registered for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Register device token error:', error);
      throw error;
    }
  }

  async sendPushNotification(userId, notification) {
    try {
      // Get user's device tokens
      const { data: tokens, error } = await supabaseAdmin
        .from('user_device_tokens')
        .select('device_token, platform')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error || !tokens || tokens.length === 0) {
        logger.warn(`No device tokens found for user ${userId}`);
        return { success: false, message: 'No device tokens found' };
      }

      const results = [];

      for (const tokenData of tokens) {
        try {
          let result;
          
          if (tokenData.platform === 'web') {
            result = await this.sendWebPushNotification(tokenData.device_token, notification);
          } else {
            result = await this.sendFirebaseNotification(tokenData.device_token, notification);
          }
          
          results.push({ token: tokenData.device_token, result });
        } catch (tokenError) {
          logger.error(`Failed to send notification to token ${tokenData.device_token}:`, tokenError);
          results.push({ token: tokenData.device_token, error: tokenError.message });
          
          // Remove invalid tokens
          if (tokenError.code === 'messaging/invalid-registration-token' || 
              tokenError.code === 'messaging/registration-token-not-registered') {
            await this.removeInvalidToken(userId, tokenData.device_token);
          }
        }
      }

      return { success: true, results };
    } catch (error) {
      logger.error('Send push notification error:', error);
      throw error;
    }
  }

  async sendFirebaseNotification(token, notification) {
    if (!this.messaging) {
      throw new Error('Firebase messaging not initialized');
    }

    const message = {
      token,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#007bff',
          sound: 'default',
          priority: 'high'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await this.messaging.send(message);
    logger.info(`Firebase notification sent successfully: ${response}`);
    return response;
  }

  async sendWebPushNotification(subscription, notification) {
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: notification.data || {}
    });

    const response = await webpush.sendNotification(JSON.parse(subscription), payload);
    logger.info('Web push notification sent successfully');
    return response;
  }

  async sendBulkNotification(userIds, notification) {
    const results = [];
    
    for (const userId of userIds) {
      try {
        const result = await this.sendPushNotification(userId, notification);
        results.push({ userId, ...result });
      } catch (error) {
        logger.error(`Failed to send notification to user ${userId}:`, error);
        results.push({ userId, success: false, error: error.message });
      }
    }

    return results;
  }

  async sendEmergencyNotification(userId, emergencyData) {
    const notification = {
      title: '🚨 Emergency Alert',
      body: `Emergency detected for ${emergencyData.userName}. Check immediately!`,
      data: {
        type: 'emergency',
        alertId: emergencyData.alertId,
        userId: userId,
        location: JSON.stringify(emergencyData.location || {}),
        timestamp: new Date().toISOString()
      }
    };

    return await this.sendPushNotification(userId, notification);
  }

  async sendMedicationReminder(userId, medication) {
    const notification = {
      title: '💊 Medication Reminder',
      body: `Time to take ${medication.name} (${medication.dosage})`,
      data: {
        type: 'medication',
        medicationId: medication.id,
        timestamp: new Date().toISOString()
      }
    };

    return await this.sendPushNotification(userId, notification);
  }

  async sendHealthCheckinReminder(userId, userName) {
    const notification = {
      title: '🏥 Daily Check-in',
      body: `Hi ${userName}, don't forget your daily health check-in!`,
      data: {
        type: 'health_checkin',
        timestamp: new Date().toISOString()
      }
    };

    return await this.sendPushNotification(userId, notification);
  }

  async sendBrainTrainingReminder(userId, userName) {
    const notification = {
      title: '🧠 Brain Training Time',
      body: `${userName}, ready for your brain training exercises?`,
      data: {
        type: 'brain_training',
        timestamp: new Date().toISOString()
      }
    };

    return await this.sendPushNotification(userId, notification);
  }

  async removeInvalidToken(userId, token) {
    try {
      await supabaseAdmin
        .from('user_device_tokens')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('device_token', token);

      logger.info(`Removed invalid token for user ${userId}`);
    } catch (error) {
      logger.error('Remove invalid token error:', error);
    }
  }

  async getUserSubscriptions(userId) {
    try {
      const { data: subscriptions, error } = await supabaseAdmin
        .from('user_device_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        throw new Error('Failed to get user subscriptions');
      }

      return subscriptions;
    } catch (error) {
      logger.error('Get user subscriptions error:', error);
      throw error;
    }
  }
}

module.exports = new PushNotificationService();
