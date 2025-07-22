const settingsService = require('../services/settingsService');
const logger = require('../config/logger');

class SettingsController {
  async exportUserData(req, res) {
    try {
      // Gather all user data
      const userId = req.user.id;
      const supabase = req.app.get('supabaseAdmin');
      const profile = await supabase.from('user_profiles').select('*').eq('id', userId).single();
      const emergencyContacts = await supabase.from('emergency_contacts').select('*').eq('user_id', userId);
      const notificationSettings = await supabase.from('user_notification_settings').select('*').eq('user_id', userId).single();
      const sensorSettings = await supabase.from('user_sensor_settings').select('*').eq('user_id', userId).single();

      // Generate PDF using pdfkit
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument();
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        res.setHeader('Content-Disposition', 'attachment; filename="user_data.pdf"');
        res.setHeader('Content-Type', 'application/pdf');
        res.status(200).send(pdfData);
      });

      doc.fontSize(20).text('User Data Export', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text('Profile:', { underline: true });
      doc.fontSize(12).text(JSON.stringify(profile.data || {}, null, 2));
      doc.moveDown();
      doc.fontSize(16).text('Emergency Contacts:', { underline: true });
      doc.fontSize(12).text(JSON.stringify(emergencyContacts.data || [], null, 2));
      doc.moveDown();
      doc.fontSize(16).text('Notification Settings:', { underline: true });
      doc.fontSize(12).text(JSON.stringify(notificationSettings.data || {}, null, 2));
      doc.moveDown();
      doc.fontSize(16).text('Sensor Settings:', { underline: true });
      doc.fontSize(12).text(JSON.stringify(sensorSettings.data || {}, null, 2));
      doc.end();
    } catch (error) {
      logger.error('Export user data error:', error);
      res.status(500).json({ success: false, error: 'Failed to export user data' });
    }
  }
  async getUserSettings(req, res) {
    try {
      const settings = await settingsService.getUserSettings(req.user.id);
      
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      logger.error('Get user settings controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateUserSettings(req, res) {
    try {
      const settings = await settingsService.updateUserSettings(req.user.id, req.body);
      
      res.json({
        success: true,
        message: 'Settings updated successfully',
        data: settings
      });
    } catch (error) {
      logger.error('Update user settings controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateNotificationSettings(req, res) {
    try {
      const settings = await settingsService.updateNotificationSettings(req.user.id, req.body);
      
      res.json({
        success: true,
        message: 'Notification settings updated successfully',
        data: settings
      });
    } catch (error) {
      logger.error('Update notification settings controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new SettingsController();
