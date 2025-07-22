const brainTrainingService = require('../services/brainTrainingService');
const logger = require('../config/logger');

class BrainTrainingController {
  async getAvailableExercises(req, res) {
    try {
      const exercises = await brainTrainingService.getAvailableExercises();
      
      res.json({
        success: true,
        data: { exercises }
      });
    } catch (error) {
      logger.error('Get available exercises controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async createSession(req, res) {
    try {
      const session = await brainTrainingService.createSession(req.user.id, req.body);
      
      res.status(201).json({
        success: true,
        message: 'Brain training session created successfully',
        data: { session }
      });
    } catch (error) {
      logger.error('Create brain training session controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async completeSession(req, res) {
    try {
      const { id } = req.params;
      const session = await brainTrainingService.completeSession(req.user.id, id, req.body);
      
      res.json({
        success: true,
        message: 'Brain training session completed successfully',
        data: { session }
      });
    } catch (error) {
      logger.error('Complete brain training session controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getSessions(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const sessions = await brainTrainingService.getUserSessions(req.user.id, limit);
      
      res.json({
        success: true,
        data: { sessions }
      });
    } catch (error) {
      logger.error('Get brain training sessions controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getSessionsByType(req, res) {
    try {
      const { type } = req.params;
      const limit = parseInt(req.query.limit) || 10;
      const sessions = await brainTrainingService.getSessionsByType(req.user.id, type, limit);
      
      res.json({
        success: true,
        data: { sessions }
      });
    } catch (error) {
      logger.error('Get brain training sessions by type controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getProgressStats(req, res) {
    try {
      const stats = await brainTrainingService.getProgressStats(req.user.id);
      
      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      logger.error('Get progress stats controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async generateExercise(req, res) {
    try {
      const { type, difficulty = 'medium' } = req.body;
      
      const exerciseData = await brainTrainingService.generateExerciseData(type, difficulty);
      
      res.json({
        success: true,
        data: { 
          exercise_type: type,
          difficulty,
          exercise_data: exerciseData
        }
      });
    } catch (error) {
      logger.error('Generate exercise controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new BrainTrainingController();
