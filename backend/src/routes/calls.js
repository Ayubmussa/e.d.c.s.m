const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const { auth } = require('../middleware/auth');

// Initiate a call
router.post('/initiate', auth, callController.initiateCall);

// Accept a call
router.post('/:callId/accept', auth, callController.acceptCall);

// Decline a call
router.post('/:callId/decline', auth, callController.declineCall);

// End a call
router.post('/:callId/end', auth, callController.endCall);

// Get call history
router.get('/history', auth, callController.getCallHistory);

// Get active call status
router.get('/:callId/status', auth, callController.getCallStatus);

// Emergency call
router.post('/emergency', auth, callController.initiateEmergencyCall);

// Generate Twilio access token
router.post('/token', auth, callController.generateAccessToken);

module.exports = router;
