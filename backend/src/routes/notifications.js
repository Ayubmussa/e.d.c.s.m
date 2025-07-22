const express = require('express');
const { auth } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// All notification routes require authentication
router.use(auth);

// Device registration for push notifications
router.post('/register-device', notificationController.registerDevice);
router.post('/remove-device', notificationController.removeDevice);
router.get('/devices', notificationController.getDeviceSubscriptions);

// Notification settings
router.get('/settings', notificationController.getNotificationSettings);
router.put('/settings', notificationController.updateNotificationSettings);

// Send notifications
router.post('/send-test', notificationController.sendTestNotification);
router.post('/send-custom', notificationController.sendCustomNotification);
router.post('/send-emergency-sms', notificationController.sendEmergencyContactsSMS);
// New: Send SMS to a specific user the sender has access to
router.post('/send-user-sms', notificationController.sendUserSMS);

// Notification history
router.get('/history', notificationController.getNotificationHistory);
router.put('/history/:notification_id/read', notificationController.markNotificationRead);

module.exports = router;
