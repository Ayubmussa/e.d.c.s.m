const nodemailer = require('nodemailer');
const logger = require('../config/logger');

class EmailService {
  constructor() {
    // Create a test account at ethereal.email (for testing purposes)
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // Using Gmail SMTP for sending real emails
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
      
      logger.info(`Email service initialized with Gmail SMTP: ${process.env.EMAIL_USER}`);
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
      throw error;
    }
  }

  async sendEmail(to, subject, text, html, options = {}) {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      if (!to) {
        throw new Error('No recipient email address provided');
      }

      // Validate the recipient email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to)) {
        throw new Error(`Invalid recipient email address: ${to}`);
      }

      // Get sender configuration from environment
      let fromName = process.env.EMAIL_FROM_NAME || 'Elderly Companion System';
      const fromEmail = process.env.EMAIL_SYSTEM_SENDER || process.env.EMAIL_USER;

      // Allow dynamic sender name while keeping same email for SMTP auth
      if (options.senderName) {
        fromName = `${options.senderName} (via Elderly Companion)`;
      }

      // Send email
      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: to,
        subject: subject,
        text: text,
        html: html || text.replace(/\n/g, '<br>'),
      });

      logger.info(`Email sent from ${fromEmail} to ${to}. Subject: ${subject}. Message ID: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new EmailService();
