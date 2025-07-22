const express = require('express');
const { auth } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

const router = express.Router();

// All settings routes require authentication
router.use(auth);

// User settings routes
router.get('/', settingsController.getUserSettings);
router.get('/export-data', settingsController.exportUserData);
router.put('/', settingsController.updateUserSettings);
router.put('/notifications', settingsController.updateNotificationSettings);

module.exports = router;
