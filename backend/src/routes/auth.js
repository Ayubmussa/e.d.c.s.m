const express = require('express');
const { auth } = require('../middleware/auth');
const { 
  validateRequest, 
  userRegisterSchema, 
  userLoginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  passwordResetTokenSchema
} = require('../middleware/validation');
const authController = require('../controllers/authController');
const { validateToken } = require('../controllers/tokenValidationController');

const router = express.Router();

// Public routes
router.post('/register', validateRequest(userRegisterSchema), authController.register);
router.post('/login', validateRequest(userLoginSchema), authController.login);

// Password reset routes
router.post('/request-password-reset', validateRequest(passwordResetRequestSchema), authController.validateEmailForReset);
router.post('/reset-password', validateRequest(passwordResetSchema), authController.resetPassword);
router.post('/reset-password-with-token', validateRequest(passwordResetTokenSchema), authController.resetPasswordWithToken);

// Debug route (only in development)
if (process.env.NODE_ENV === 'development') {
  router.post('/validate-token', validateToken);
}

// Protected routes
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.post('/logout', auth, authController.logout);

module.exports = router;
