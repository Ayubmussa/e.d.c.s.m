const geofencingService = require('../services/geofencingService');
const logger = require('../config/logger');

// Get all safe zones for the authenticated user
const getSafeZones = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Debug logging
    logger.info(`Getting safe zones for user: ${userId}`);
    logger.info(`User object:`, req.user);
    
    if (!userId) {
      logger.error('User ID is undefined in getSafeZones');
      return res.status(400).json({
        success: false,
        error: 'User ID not found'
      });
    }
    
    const safeZones = await geofencingService.getUserSafeZones(userId);
    
    res.json({
      success: true,
      data: {
        safe_zones: safeZones,
        count: safeZones.length
      }
    });
  } catch (error) {
    logger.error('Get safe zones controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch safe zones'
    });
  }
};

// Get a single safe zone by ID
const getSafeZone = async (req, res) => {
  try {
    const userId = req.user.id;
    const { zoneId } = req.params;
    
    // Debug logging
    logger.info(`Getting safe zone ${zoneId} for user: ${userId}`);
    
    if (!userId) {
      logger.error('User ID is undefined in getSafeZone');
      return res.status(400).json({
        success: false,
        error: 'User ID not found'
      });
    }
    
    const safeZone = await geofencingService.getSafeZoneById(userId, zoneId);
    
    if (!safeZone) {
      return res.status(404).json({
        success: false,
        error: 'Safe zone not found'
      });
    }
    
    res.json({
      success: true,
      data: safeZone
    });
  } catch (error) {
    logger.error('Get safe zone controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch safe zone'
    });
  }
};

// Create a new safe zone
const createSafeZone = async (req, res) => {
  try {
    const userId = req.user.id;
    const zoneData = req.body;
    
    // Validate required fields
    const { name, center_latitude, center_longitude } = zoneData;
    if (!name || !center_latitude || !center_longitude) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, center_latitude, center_longitude'
      });
    }
    
    const safeZone = await geofencingService.createSafeZone(userId, zoneData);
    
    res.status(201).json({
      success: true,
      data: {
        safe_zone: safeZone
      }
    });
  } catch (error) {
    logger.error('Create safe zone controller error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create safe zone'
    });
  }
};

// Update a safe zone
const updateSafeZone = async (req, res) => {
  try {
    const userId = req.user.id;
    const { zoneId } = req.params;
    const updates = req.body;
    
    const updatedZone = await geofencingService.updateSafeZone(userId, zoneId, updates);
    
    res.json({
      success: true,
      data: {
        safe_zone: updatedZone
      }
    });
  } catch (error) {
    logger.error('Update safe zone controller error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update safe zone'
    });
  }
};

// Delete a safe zone
const deleteSafeZone = async (req, res) => {
  try {
    const userId = req.user.id;
    const { zoneId } = req.params;
    
    await geofencingService.deleteSafeZone(userId, zoneId);
    
    res.json({
      success: true,
      message: 'Safe zone deleted successfully'
    });
  } catch (error) {
    logger.error('Delete safe zone controller error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete safe zone'
    });
  }
};

// Get location history for the user
const getLocationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50 } = req.query;
    
    const history = await geofencingService.getLocationHistory(userId, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        location_history: history,
        count: history.length
      }
    });
  } catch (error) {
    logger.error('Get location history controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch location history'
    });
  }
};

// Get current zone status
const getCurrentZoneStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const zoneStatus = await geofencingService.getCurrentZoneStatus(userId);
    
    res.json({
      success: true,
      data: {
        zone_status: zoneStatus
      }
    });
  } catch (error) {
    logger.error('Get zone status controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get zone status'
    });
  }
};

// Process location update from mobile app
const processLocationUpdate = async (req, res) => {
  try {
    const userId = req.user.id;
    const locationData = req.body;
    
    // Debug logging
    logger.info(`Processing location update for user: ${userId}`);
    logger.info(`Location data received:`, locationData);
    
    // Validate that we have a valid request body
    if (!locationData || typeof locationData !== 'object') {
      logger.error('Invalid location data: request body is not a valid object');
      return res.status(400).json({
        success: false,
        error: 'Invalid location data: request body must be a valid JSON object'
      });
    }
    
    // Validate location data
    const { latitude, longitude } = locationData;
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      logger.error('Invalid location coordinates:', { latitude, longitude });
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid required location coordinates (latitude, longitude)'
      });
    }
    
    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      logger.error('Location coordinates out of valid range:', { latitude, longitude });
      return res.status(400).json({
        success: false,
        error: 'Location coordinates out of valid range'
      });
    }
    
    const result = await geofencingService.processLocationData(userId, locationData);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Process location update controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process location update'
    });
  }
};

// Get location events for the user
const getLocationEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, zone_id } = req.query;
    
    const events = await geofencingService.getLocationEvents(userId, {
      limit: parseInt(limit),
      zoneId: zone_id
    });
    
    res.json({
      success: true,
      data: {
        location_events: events,
        count: events.length
      }
    });
  } catch (error) {
    logger.error('Get location events controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch location events'
    });
  }
};

// Get geofencing status and monitoring info
const getGeofencingStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const status = await geofencingService.getGeofencingStatus(userId);
    
    res.json({
      success: true,
      data: {
        geofencing_status: status
      }
    });
  } catch (error) {
    logger.error('Get geofencing status controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get geofencing status'
    });
  }
};

// Get zone history for a specific zone
const getZoneHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { zoneId } = req.params;
    const { limit = 50 } = req.query;
    
    const history = await geofencingService.getZoneHistory(userId, zoneId, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        zone_history: history,
        count: history.length
      }
    });
  } catch (error) {
    logger.error('Get zone history controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get zone history'
    });
  }
};

// Initialize zone status for a user (called when starting tracking)
const initializeZoneStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Missing required location coordinates'
      });
    }
    
    const result = await geofencingService.initializeUserZoneStatus(userId, { latitude, longitude });
    
    res.json({
      success: true,
      data: {
        initialized: result,
        message: 'Zone status initialized successfully'
      }
    });
  } catch (error) {
    logger.error('Initialize zone status controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize zone status'
    });
  }
};

// Reset zone status for a user (called when stopping tracking)
const resetZoneStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = geofencingService.resetUserZoneStatus(userId);
    
    res.json({
      success: true,
      data: {
        reset: result,
        message: 'Zone status reset successfully'
      }
    });
  } catch (error) {
    logger.error('Reset zone status controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset zone status'
    });
  }
};

module.exports = {
  getSafeZones,
  getSafeZone,
  createSafeZone,
  updateSafeZone,
  deleteSafeZone,
  getLocationEvents,
  getLocationHistory,
  getCurrentZoneStatus,
  getGeofencingStatus,
  getZoneHistory,
  processLocationUpdate,
  initializeZoneStatus,
  resetZoneStatus
};
