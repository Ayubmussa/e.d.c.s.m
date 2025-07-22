const express = require('express');
const { auth } = require('../middleware/auth');
const { validateRequest, emergencyAlertSchema, emergencyContactSchema, emergencySettingsSchema, emergencyEmailSchema } = require('../middleware/validation');
const emergencyController = require('../controllers/emergencyController');

const router = express.Router();

// All emergency routes require authentication
router.use(auth);

// Emergency alerts
router.post('/alerts', validateRequest(emergencyAlertSchema), emergencyController.createAlert);
router.post('/alerts/urgent', validateRequest(emergencyAlertSchema), emergencyController.createUrgentAlert);
router.get('/alerts', emergencyController.getAlerts);
router.put('/alerts/:id/status', emergencyController.updateAlertStatus);

// Direct emergency email sending
router.post('/send-email', validateRequest(emergencyEmailSchema), emergencyController.sendEmail);

// Daily email limit checking
router.get('/email-limit', emergencyController.checkDailyEmailLimit);

// Emergency detection
router.post('/detect', emergencyController.detectEmergency);

// Emergency settings
router.get('/settings', emergencyController.getEmergencySettings);
router.put('/settings', validateRequest(emergencySettingsSchema), emergencyController.updateEmergencySettings);

// Emergency contacts
router.post('/contacts', validateRequest(emergencyContactSchema), emergencyController.createEmergencyContact);
router.get('/contacts', emergencyController.getEmergencyContacts);
router.put('/contacts/:id', validateRequest(emergencyContactSchema), emergencyController.updateEmergencyContact);
router.delete('/contacts/:id', emergencyController.deleteEmergencyContact);

module.exports = router;
