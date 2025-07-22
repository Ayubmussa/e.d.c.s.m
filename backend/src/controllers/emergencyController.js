const emergencyService = require('../services/emergencyService');
const logger = require('../config/logger');

class EmergencyController {
  async createAlert(req, res) {
    try {
      const alert = await emergencyService.createAlert(req.user.id, req.body);
      
      res.status(201).json({
        success: true,
        message: 'Emergency alert created successfully',
        data: { alert }
      });
    } catch (error) {
      logger.error('Create emergency alert controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAlerts(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const alerts = await emergencyService.getUserAlerts(req.user.id, limit);
      
      res.json({
        success: true,
        data: { alerts }
      });
    } catch (error) {
      logger.error('Get emergency alerts controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateAlertStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, resolved_by } = req.body;
      
      const alert = await emergencyService.updateAlertStatus(req.user.id, id, status, resolved_by);
      
      res.json({
        success: true,
        message: 'Alert status updated successfully',
        data: { alert }
      });
    } catch (error) {
      logger.error('Update alert status controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async createEmergencyContact(req, res) {
    try {
      // Map phoneNumber to phone_number for database compatibility
      const contactData = { ...req.body };
      if (contactData.phoneNumber && !contactData.phone_number) {
        contactData.phone_number = contactData.phoneNumber;
        delete contactData.phoneNumber;
      }
      
      const contact = await emergencyService.createEmergencyContact(req.user.id, contactData);
      
      res.status(201).json({
        success: true,
        message: 'Emergency contact created successfully',
        data: { contact }
      });
    } catch (error) {
      logger.error('Create emergency contact controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getEmergencyContacts(req, res) {
    try {
      const contacts = await emergencyService.getUserEmergencyContacts(req.user.id);
      
      res.json({
        success: true,
        data: { contacts }
      });
    } catch (error) {
      logger.error('Get emergency contacts controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateEmergencyContact(req, res) {
    try {
      const { id } = req.params;
      
      // Map phoneNumber to phone_number for database compatibility
      const updateData = { ...req.body };
      if (updateData.phoneNumber && !updateData.phone_number) {
        updateData.phone_number = updateData.phoneNumber;
        delete updateData.phoneNumber;
      }
      
      const contact = await emergencyService.updateEmergencyContact(req.user.id, id, updateData);
      
      res.json({
        success: true,
        message: 'Emergency contact updated successfully',
        data: { contact }
      });
    } catch (error) {
      logger.error('Update emergency contact controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteEmergencyContact(req, res) {
    try {
      const { id } = req.params;
      await emergencyService.deleteEmergencyContact(req.user.id, id);
      
      res.json({
        success: true,
        message: 'Emergency contact deleted successfully'
      });
    } catch (error) {
      logger.error('Delete emergency contact controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Emergency detection endpoint for mobile app sensors
  detectEmergency = async (req, res) => {
    try {
      const { sensor_data, location } = req.body;
      
      // Analyze sensor data for fall detection, inactivity, etc.
      const isEmergency = this.analyzeSensorData(sensor_data);
      
      if (isEmergency.detected) {
        const alert = await emergencyService.createAlert(req.user.id, {
          alert_type: 'automatic',
          location,
          message: `Automatic emergency detection: ${isEmergency.reason}`
        });
        
        res.json({
          success: true,
          emergency_detected: true,
          data: { alert }
        });
      } else {
        res.json({
          success: true,
          emergency_detected: false,
          message: 'No emergency detected'
        });
      }
    } catch (error) {
      logger.error('Emergency detection controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async analyzeSensorData(sensorData) {
    try {
      // Simple emergency detection logic
      // In a real implementation, you'd use more sophisticated algorithms
      
      const { accelerometer, gyroscope, inactivity_minutes } = sensorData;
      
      // Fall detection based on accelerometer data
      if (accelerometer) {
        const { x, y, z } = accelerometer;
        const totalAcceleration = Math.sqrt(x*x + y*y + z*z);
        
        // Threshold for fall detection (simplified)
        if (totalAcceleration > 20) {
          return { detected: true, reason: 'Possible fall detected' };
        }
      }
      
      // Inactivity detection
      if (inactivity_minutes && inactivity_minutes > 120) { // 2 hours
        return { detected: true, reason: 'Extended inactivity detected' };
      }
      
      return { detected: false };
    } catch (error) {
      logger.error('Sensor data analysis error:', error);
      return { detected: false };
    }
  }

  async getEmergencySettings(req, res) {
    try {
      const settings = await emergencyService.getEmergencySettings(req.user.id);
      
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      logger.error('Get emergency settings controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateEmergencySettings(req, res) {
    try {
      const settings = await emergencyService.updateEmergencySettings(req.user.id, req.body);
      
      res.json({
        success: true,
        message: 'Emergency settings updated successfully',
        data: settings
      });
    } catch (error) {
      logger.error('Update emergency settings controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Check daily email limit status
  async checkDailyEmailLimit(req, res) {
    try {
      const limitStatus = await emergencyService.checkDailyEmailLimit(req.user.id);
      
      res.json({
        success: true,
        data: limitStatus
      });
    } catch (error) {
      logger.error('Check daily email limit controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Create urgent alert that bypasses daily limits
  async createUrgentAlert(req, res) {
    try {
      const alert = await emergencyService.createUrgentAlert(req.user.id, req.body);
      
      res.status(201).json({
        success: true,
        message: 'Urgent emergency alert created successfully',
        data: { alert }
      });
    } catch (error) {
      logger.error('Create urgent alert controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Send emergency email directly
  async sendEmail(req, res) {
    try {
      const { to, subject, message, priority, senderName } = req.body;
      
      if (!to || !message) {
        return res.status(400).json({
          success: false,
          error: 'Recipient email and message are required'
        });
      }

      const emailService = require('../services/emailService');
      
      // Create priority indicator in subject
      const priorityPrefix = priority === 'critical' ? '🚨 CRITICAL: ' : 
                           priority === 'high' ? '❗ URGENT: ' : 
                           priority === 'medium' ? '⚠️ IMPORTANT: ' : '';
      
      const finalSubject = `${priorityPrefix}${subject}`;
      
      // Add emergency context to message
      const finalMessage = `
EMERGENCY MESSAGE FROM ELDERLY COMPANION SYSTEM

Priority Level: ${priority?.toUpperCase() || 'HIGH'}
Sent by: ${senderName || 'Emergency Contact'}
Timestamp: ${new Date().toISOString()}

Message:
${message}

---
This is an automated emergency message from the Elderly Companion Safety System.
Please respond promptly to this emergency communication.
      `.trim();

      const result = await emailService.sendEmail(
        to, 
        finalSubject, 
        finalMessage, 
        null, 
        { senderName }
      );
      
      if (result.success) {
        // Log the emergency email for tracking
        logger.info(`Emergency email sent from user ${req.user.id} to ${to} with priority ${priority}`);
        
        res.json({
          success: true,
          message: 'Emergency email sent successfully',
          data: {
            messageId: result.messageId,
            timestamp: result.timestamp,
            priority,
            recipient: to
          }
        });
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      logger.error('Send emergency email controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new EmergencyController();
