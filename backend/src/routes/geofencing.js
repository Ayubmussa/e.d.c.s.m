const express = require('express');
const { auth } = require('../middleware/auth');
const geofencingController = require('../controllers/geofencingController');

const router = express.Router();

// All geofencing routes require authentication
router.use(auth);

// Safe zone management
router.get('/safe-zones', geofencingController.getSafeZones);
router.get('/safe-zones/:zoneId', geofencingController.getSafeZone);
router.post('/safe-zones', geofencingController.createSafeZone);
router.put('/safe-zones/:zoneId', geofencingController.updateSafeZone);
router.delete('/safe-zones/:zoneId', geofencingController.deleteSafeZone);

// Location events and tracking
router.get('/location-events', geofencingController.getLocationEvents);
router.post('/location-update', geofencingController.processLocationUpdate);

// Zone status management
router.post('/initialize-status', geofencingController.initializeZoneStatus);
router.post('/reset-status', geofencingController.resetZoneStatus);

// Geofencing status and monitoring
router.get('/status', geofencingController.getGeofencingStatus);
router.get('/zone-history/:zoneId', geofencingController.getZoneHistory);

module.exports = router;
