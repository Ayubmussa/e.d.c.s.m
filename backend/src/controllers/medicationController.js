const medicationService = require('../services/medicationService');
const logger = require('../config/logger');

class MedicationController {
  async createMedication(req, res) {
    try {
      // Convert empty end_date string to null
      if (req.body.end_date === '') {
        req.body.end_date = null;
      }
      
      const medication = await medicationService.createMedication(req.user.id, req.body);
      
      res.status(201).json({
        success: true,
        message: 'Medication created successfully',
        data: { medication }
      });
    } catch (error) {
      logger.error('Create medication controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getMedications(req, res) {
    try {
      const medications = await medicationService.getUserMedications(req.user.id);
      
      res.json({
        success: true,
        data: { medications }
      });
    } catch (error) {
      logger.error('Get medications controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getMedication(req, res) {
    try {
      const { id } = req.params;
      const medication = await medicationService.getMedicationById(req.user.id, id);
      
      if (!medication) {
        return res.status(404).json({
          success: false,
          error: 'Medication not found'
        });
      }
      
      res.json({
        success: true,
        data: { medication }
      });
    } catch (error) {
      logger.error('Get medication controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateMedication(req, res) {
    try {
      const { id } = req.params;
      
      // Convert empty end_date string to null
      if (req.body.end_date === '') {
        req.body.end_date = null;
      }
      
      const medication = await medicationService.updateMedication(req.user.id, id, req.body);
      
      res.json({
        success: true,
        message: 'Medication updated successfully',
        data: { medication }
      });
    } catch (error) {
      logger.error('Update medication controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteMedication(req, res) {
    try {
      const { id } = req.params;
      await medicationService.deleteMedication(req.user.id, id);
      
      res.json({
        success: true,
        message: 'Medication deleted successfully'
      });
    } catch (error) {
      logger.error('Delete medication controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async logMedication(req, res) {
    try {
      const { id } = req.params;
      const log = await medicationService.logMedication(req.user.id, id, req.body);
      
      res.status(201).json({
        success: true,
        message: 'Medication logged successfully',
        data: { log }
      });
    } catch (error) {
      logger.error('Log medication controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getMedicationLogs(req, res) {
    try {
      const { medicationId } = req.query;
      const limit = parseInt(req.query.limit) || 50;
      
      const logs = await medicationService.getMedicationLogs(req.user.id, medicationId, limit);
      
      res.json({
        success: true,
        data: { logs }
      });
    } catch (error) {
      logger.error('Get medication logs controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getTodaysMedications(req, res) {
    try {
      const medications = await medicationService.getTodaysMedications(req.user.id);
      
      res.json({
        success: true,
        data: { medications }
      });
    } catch (error) {
      logger.error('Get today medications controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getMedicationHistory(req, res) {
    try {
      const { days = 30, medicationId } = req.query;
      const history = await medicationService.getMedicationHistory(req.user.id, {
        days: parseInt(days),
        medicationId
      });
      
      res.json({
        success: true,
        data: { logs: history }  // Changed from 'history' to 'logs' to match frontend expectation
      });
    } catch (error) {
      logger.error('Get medication history controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getMedicationReminders(req, res) {
    try {
      const reminders = await medicationService.getMedicationReminders(req.user.id);
      
      res.json({
        success: true,
        data: { reminders }
      });
    } catch (error) {
      logger.error('Get medication reminders controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async snoozeMedicationReminder(req, res) {
    try {
      const { id } = req.params;
      const { snoozeMinutes = 10 } = req.body;
      const result = await medicationService.snoozeMedicationReminder(req.user.id, id, snoozeMinutes);
      
      res.json({
        success: true,
        message: `Medication reminder snoozed for ${snoozeMinutes} minutes`,
        data: { result }
      });
    } catch (error) {
      logger.error('Snooze medication reminder controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getMedicationStats(req, res) {
    try {
      const { period = '30' } = req.query;
      const stats = await medicationService.getMedicationStats(req.user.id, period);
      
      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      logger.error('Get medication stats controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new MedicationController();
