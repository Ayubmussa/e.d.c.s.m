const express = require('express');
const { auth } = require('../middleware/auth');
const { validateRequest, healthCheckinSchema } = require('../middleware/validation');
const healthController = require('../controllers/healthController');

const router = express.Router();

// All health routes require authentication
router.use(auth);

// Health check-ins
router.post('/checkins', validateRequest(healthCheckinSchema), healthController.createCheckin);
router.get('/checkins', healthController.getCheckins);
router.get('/checkins/today', healthController.getTodayCheckin);
router.get('/checkins/:date', healthController.getCheckinByDate);
router.put('/checkins/:id', validateRequest(healthCheckinSchema), healthController.updateCheckin);

// Health analytics
router.get('/trends', healthController.getHealthTrends);
router.get('/summary', healthController.getHealthSummary);

module.exports = router;
