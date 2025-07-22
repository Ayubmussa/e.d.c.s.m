const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    next();
  };
};

// User validation schemas
const userRegisterSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  dateOfBirth: Joi.date().optional(),
  phoneNumber: Joi.string().pattern(/^\+?[\d\s\-()]+$/).required(),
  userType: Joi.string().valid('elderly', 'caregiver').optional(),
  emergencyContact: Joi.object({
    name: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    relationship: Joi.string().required()
  }).optional().allow(null),
  address: Joi.string().allow('').optional(),
  medicalConditions: Joi.array().items(Joi.string()).optional()
});

const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Medication validation schemas
const medicationSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  dosage: Joi.string().min(1).max(100).required(),
  frequency: Joi.string().valid('once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'as_needed').required(),
  times: Joi.array().items(Joi.string()).required(), // Accepted for compatibility but stored in medication_schedules table
  start_date: Joi.date().required(),
  end_date: Joi.date().allow(null, '').optional(),
  notes: Joi.string().allow(''), // Accepted for compatibility but not stored in database (use 'instructions' field instead)
  instructions: Joi.string().allow('').optional() // Actual database field for medication notes/instructions
});

// Health check-in validation schema
const healthCheckinSchema = Joi.object({
  checkin_date: Joi.date().required(),
  mood_rating: Joi.number().integer().min(1).max(5).required(),
  energy_level: Joi.number().integer().min(1).max(5).required(),
  pain_level: Joi.number().integer().min(0).max(10).required(),
  sleep_quality: Joi.number().integer().min(1).max(5).required(),
  notes: Joi.string().allow(''),
  symptoms: Joi.array().items(Joi.string()).default([]),
  activities: Joi.array().items(Joi.string()).default([]) // Accepted for compatibility but not stored in database
});

// Emergency contact validation schema
const emergencyContactSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  relationship: Joi.string().min(1).max(100).required(),
  phone_number: Joi.string().pattern(/^\+?[\d\s\-()]+$/).required(),
  email: Joi.string().email().allow(''),
  is_primary: Joi.boolean().default(false)
});

// Emergency alert validation schema
const emergencyAlertSchema = Joi.object({
  alert_type: Joi.string().default('manual'),
  location: Joi.object({
    latitude: Joi.number(),
    longitude: Joi.number(),
    address: Joi.string()
  }).allow(null),
  message: Joi.string().allow('')
});

// Emergency email validation schema
const emergencyEmailSchema = Joi.object({
  to: Joi.string().email().required(),
  subject: Joi.string().min(1).max(200).default('Emergency Alert'),
  message: Joi.string().min(1).max(2000).required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('high'),
  senderName: Joi.string().max(100).optional()
});

// Brain training session validation schema
const brainTrainingSchema = Joi.object({
  exercise_type: Joi.string().min(1).max(100).required(),
  exercise_data: Joi.object().required(),
  score: Joi.number().integer().allow(null),
  max_score: Joi.number().integer().allow(null),
  duration_seconds: Joi.number().integer().allow(null)
});

// Emergency settings validation schema
const emergencySettingsSchema = Joi.object({
  fallDetectionEnabled: Joi.boolean(),
  sosEnabled: Joi.boolean(),
  fallThreshold: Joi.number().min(1).max(100),
  inactivityEnabled: Joi.boolean(),
  inactivityThreshold: Joi.number().min(1).max(1440), // max 24 hours in minutes
  samplingRate: Joi.number().min(1).max(60) // max 60 seconds
});

// Password reset validation schemas
const passwordResetRequestSchema = Joi.object({
  email: Joi.string().email().required()
});

const passwordResetSchema = Joi.object({
  accessToken: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

const passwordResetTokenSchema = Joi.object({
  resetToken: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

module.exports = {
  validateRequest,
  userRegisterSchema,
  userLoginSchema,
  medicationSchema,
  healthCheckinSchema,
  emergencyContactSchema,
  emergencyAlertSchema,
  emergencyEmailSchema,
  brainTrainingSchema,
  emergencySettingsSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  passwordResetTokenSchema
};
