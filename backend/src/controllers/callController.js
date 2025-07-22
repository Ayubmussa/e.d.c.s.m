const db = require('../config/database');
const logger = require('../config/logger');
const twilioService = require('../services/twilioService');

// Initiate a call
const initiateCall = async (req, res) => {
  try {
    const { contactId, callType, contactInfo } = req.body;
    const callerId = req.user.id;

    // Validate input
    if (!contactId || !callType) {
      return res.status(400).json({
        success: false,
        error: 'Contact ID and call type are required'
      });
    }

    if (!['voice', 'video'].includes(callType)) {
      return res.status(400).json({
        success: false,
        error: 'Call type must be voice or video'
      });
    }

    // Create call record
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info(`Call initiated: ${callId} from ${callerId} to ${contactId}`);

    res.json({
      success: true,
      data: {
        callId,
        status: 'initiated',
        callType,
        contactInfo
      }
    });

  } catch (error) {
    logger.error('Error initiating call:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate call'
    });
  }
};

// Accept a call
const acceptCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;

    logger.info(`Call accepted: ${callId} by ${userId}`);

    res.json({
      success: true,
      data: {
        callId,
        status: 'active',
        message: 'Call accepted successfully'
      }
    });

  } catch (error) {
    logger.error('Error accepting call:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept call'
    });
  }
};

// Decline a call
const declineCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;

    logger.info(`Call declined: ${callId} by ${userId}`);

    res.json({
      success: true,
      data: {
        callId,
        status: 'declined',
        message: 'Call declined'
      }
    });

  } catch (error) {
    logger.error('Error declining call:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to decline call'
    });
  }
};

// End a call
const endCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;

    logger.info(`Call ended: ${callId} by ${userId}`);

    res.json({
      success: true,
      data: {
        callId,
        status: 'ended',
        message: 'Call ended successfully'
      }
    });

  } catch (error) {
    logger.error('Error ending call:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end call'
    });
  }
};

// Get call history
const getCallHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    res.json({
      success: true,
      data: {
        calls: [],
        total: 0
      }
    });

  } catch (error) {
    logger.error('Error getting call history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get call history'
    });
  }
};

// Get call status
const getCallStatus = async (req, res) => {
  try {
    const { callId } = req.params;

    res.json({
      success: true,
      data: {
        callId,
        status: 'unknown'
      }
    });

  } catch (error) {
    logger.error('Error getting call status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get call status'
    });
  }
};

// Initiate emergency call
const initiateEmergencyCall = async (req, res) => {
  try {
    const callerId = req.user.id;
    const callId = `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.warn(`Emergency call initiated: ${callId} from ${callerId}`);

    res.json({
      success: true,
      data: {
        callId,
        status: 'emergency_initiated',
        callType: 'voice',
        isEmergency: true
      }
    });

  } catch (error) {
    logger.error('Error initiating emergency call:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate emergency call'
    });
  }
};

// Generate Twilio access token
const generateAccessToken = async (req, res) => {
  try {
    const { identity } = req.body;
    const userId = req.user.id;

    // Use provided identity or default to user ID
    const tokenIdentity = identity || `user-${userId}`;

    // Generate both voice and video tokens
    const voiceToken = twilioService.generateVoiceToken(tokenIdentity);
    const videoToken = twilioService.generateVideoToken(tokenIdentity, 'default-room');

    logger.info(`Access tokens generated for user: ${userId}, identity: ${tokenIdentity}`);

    res.json({
      success: true,
      data: {
        token: videoToken, // Primary token for video calls
        voiceToken,
        videoToken,
        identity: tokenIdentity,
        ttl: 3600 // 1 hour
      }
    });

  } catch (error) {
    logger.error('Error generating access token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate access token'
    });
  }
};

module.exports = {
  generateAccessToken,
  initiateCall,
  acceptCall,
  declineCall,
  endCall,
  getCallHistory,
  getCallStatus,
  initiateEmergencyCall
};
