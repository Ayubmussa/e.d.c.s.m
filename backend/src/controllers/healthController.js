const healthService = require('../services/healthService');
const logger = require('../config/logger');

class HealthController {
  async createCheckin(req, res) {
    try {
      const checkin = await healthService.createHealthCheckin(req.user.id, req.body);
      
      res.status(201).json({
        success: true,
        message: 'Health check-in recorded successfully',
        data: { checkin }
      });
    } catch (error) {
      logger.error('Create health checkin controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getCheckins(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 30;
      const checkins = await healthService.getUserHealthCheckins(req.user.id, limit);
      
      res.json({
        success: true,
        data: { checkins }
      });
    } catch (error) {
      logger.error('Get health checkins controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getCheckinByDate(req, res) {
    try {
      const { date } = req.params;
      const checkin = await healthService.getHealthCheckinByDate(req.user.id, date);
      
      res.json({
        success: true,
        data: { checkin }
      });
    } catch (error) {
      logger.error('Get health checkin by date controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateCheckin(req, res) {
    try {
      const { id } = req.params;
      const checkin = await healthService.updateHealthCheckin(req.user.id, id, req.body);
      
      res.json({
        success: true,
        message: 'Health check-in updated successfully',
        data: { checkin }
      });
    } catch (error) {
      logger.error('Update health checkin controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getHealthTrends(req, res) {
    try {
      const days = parseInt(req.query.days) || 30;
      const trends = await healthService.getHealthTrends(req.user.id, days);
      
      res.json({
        success: true,
        data: { trends }
      });
    } catch (error) {
      logger.error('Get health trends controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getTodayCheckin(req, res) {
    try {
      const checkin = await healthService.getTodayCheckin(req.user.id);
      
      res.json({
        success: true,
        data: { checkin }
      });
    } catch (error) {
      logger.error('Get today checkin controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getHealthSummary(req, res) {
    try {
      const summary = await healthService.getHealthSummary(req.user.id);
      
      res.json({
        success: true,
        data: { summary }
      });
    } catch (error) {
      logger.error('Get health summary controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new HealthController();
