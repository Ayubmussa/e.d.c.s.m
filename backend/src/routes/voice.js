const express = require('express');
const { auth } = require('../middleware/auth');
const voiceController = require('../controllers/voiceController');

const router = express.Router();

// All voice routes require authentication
router.use(auth);

// Voice recognition endpoints
router.post('/process-audio', 
  voiceController.uploadAudio(), 
  voiceController.processAudioFile
);

router.post('/process-text', voiceController.processTextCommand);

// Voice interaction history
router.get('/history', voiceController.getVoiceHistory);

// Available voice commands
router.get('/commands', voiceController.getVoiceCommands);

module.exports = router;
