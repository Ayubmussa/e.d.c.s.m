const express = require('express');
const { auth } = require('../middleware/auth');
const { validateRequest, brainTrainingSchema } = require('../middleware/validation');
const brainTrainingController = require('../controllers/brainTrainingController');

const router = express.Router();

// All brain training routes require authentication
router.use(auth);

// Exercise management
router.get('/exercises', brainTrainingController.getAvailableExercises);
router.post('/exercises/generate', brainTrainingController.generateExercise);

// Session management
router.post('/sessions', validateRequest(brainTrainingSchema), brainTrainingController.createSession);
router.get('/sessions', brainTrainingController.getSessions);
router.get('/sessions/type/:type', brainTrainingController.getSessionsByType);
router.put('/sessions/:id/complete', brainTrainingController.completeSession);

// Progress tracking
router.get('/progress', brainTrainingController.getProgressStats);

module.exports = router;
