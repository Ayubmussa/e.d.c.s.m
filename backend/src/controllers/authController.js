const authService = require('../services/authService');
const logger = require('../config/logger');

class AuthController {
  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      logger.error('Registration controller error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      logger.error('Login controller error:', error);
      res.status(401).json({
        success: false,
        error: error.message
      });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await authService.getUserById(req.user.id);
      
      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Get profile controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const user = await authService.updateUser(req.user.id, req.body);
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });
    } catch (error) {
      logger.error('Update profile controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async logout(req, res) {
    try {
      // In a stateless JWT system, logout is handled client-side
      // You could implement token blacklisting here if needed
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async validateEmailForReset(req, res) {
    try {
      const { email } = req.body;
      const result = await authService.validateEmailForReset(email);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Email validation controller error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { accessToken, newPassword, userId } = req.body;
      let result;
      // If userId is provided, use admin method (authenticated user)
      if (userId) {
        result = await authService.changePasswordByUserId(userId, newPassword);
      } else {
        // Try to extract userId from accessToken if possible
        let resolvedUserId = null;
        if (accessToken) {
          try {
            // Decode JWT to get user id (Supabase access tokens are JWTs)
            const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());
            resolvedUserId = payload.sub || payload.user_id || payload.id;
          } catch (e) {
            logger.warn('Could not decode accessToken to get userId:', e);
          }
        }
        if (resolvedUserId) {
          // Try admin method if we have userId
          try {
            result = await authService.changePasswordByUserId(resolvedUserId, newPassword);
          } catch (e) {
            logger.warn('Admin password update failed, falling back to session method:', e);
            result = await authService.resetPassword(accessToken, newPassword);
          }
        } else {
          // Only accessToken available, use session method
          result = await authService.resetPassword(accessToken, newPassword);
        }
      }
      res.json({
        success: true,
        message: result.message,
        data: result.user ? { user: result.user } : undefined
      });
    } catch (error) {
      logger.error('Password reset controller error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // New method for token-based password reset
  async resetPasswordWithToken(req, res) {
    try {
      const { resetToken, newPassword } = req.body;
      const result = await authService.resetPasswordWithToken(resetToken, newPassword);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Token-based password reset controller error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();
