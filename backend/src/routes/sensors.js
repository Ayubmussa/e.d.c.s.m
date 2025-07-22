const express = require('express');
const { auth } = require('../middleware/auth');
const sensorController = require('../controllers/sensorController');

const router = express.Router();

// All sensor routes require authentication
router.use(auth);

// Sensor data processing
router.post('/data', sensorController.processSensorData);

// Sensor monitoring status
router.get('/monitoring-status', sensorController.getMonitoringStatus);

// Sensor history and analytics
router.get('/history', sensorController.getSensorHistory);
router.get('/activity-summary', sensorController.getActivitySummary);

// Sensor configuration
router.get('/settings', sensorController.getSensorSettings);
router.put('/settings', sensorController.updateSensorSettings);

// Sensor testing and calibration
router.post('/test-connection', sensorController.testSensorConnection);
router.post('/calibrate', sensorController.calibrateSensors);

module.exports = router;
