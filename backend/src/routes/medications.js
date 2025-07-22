const express = require('express');
const { auth } = require('../middleware/auth');
const { validateRequest, medicationSchema } = require('../middleware/validation');
const medicationController = require('../controllers/medicationController');

const router = express.Router();

// All medication routes require authentication
router.use(auth);

// Medication management
router.post('/', validateRequest(medicationSchema), medicationController.createMedication);
router.get('/', medicationController.getMedications);
router.get('/today', medicationController.getTodaysMedications);
router.get('/history', medicationController.getMedicationHistory);
router.get('/reminders', medicationController.getMedicationReminders);
router.get('/logs', medicationController.getMedicationLogs);
router.get('/stats', medicationController.getMedicationStats);
router.get('/:id', medicationController.getMedication);
router.put('/:id', validateRequest(medicationSchema), medicationController.updateMedication);
router.delete('/:id', medicationController.deleteMedication);

// Medication logging
router.post('/:id/log', medicationController.logMedication);
router.post('/:id/snooze', medicationController.snoozeMedicationReminder);

module.exports = router;
