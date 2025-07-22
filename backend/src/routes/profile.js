const express = require('express');
const { auth } = require('../middleware/auth');
const profileImageController = require('../controllers/profileImageController');

const router = express.Router();

// Upload profile image
router.post('/upload-image', (req, res, next) => { console.log('Route /api/profile/upload-image hit'); next(); }, auth, profileImageController.uploadProfileImage);

// Test endpoint to verify response format
router.get('/test-response', (req, res) => {
  console.log('Test response endpoint hit');
  const testResponse = { success: true, imageUrl: 'https://example.com/test.jpg' };
  console.log('Sending test response:', testResponse);
  res.json(testResponse);
});

// Serve profile image
router.get('/image/:filename', profileImageController.getProfileImage);

module.exports = router;
