const voiceRecognitionService = require('../services/voiceRecognitionService');
const logger = require('../config/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/audio');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `audio-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg', 'audio/m4a'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file type'));
    }
  }
});

class VoiceController {
  async processAudioFile(req, res) {
    try {
      logger.info('[VoiceController] /process-audio route hit');
      logger.info('[VoiceController] Request headers:', JSON.stringify(req.headers));
      logger.info('[VoiceController] Request body:', JSON.stringify(req.body));
      logger.info('[VoiceController] Request file:', req.file);
      if (!req.file) {
        logger.warn('[VoiceController] No audio file provided');
        return res.status(400).json({
          success: false,
          error: 'No audio file provided'
        });
      }

      // Extract token from Authorization header
      const authHeader = req.header('Authorization');
      const token = authHeader?.replace('Bearer ', '');

      const result = await voiceRecognitionService.processAudioFile(req.file.path, req.user.id, token);

      // Clean up uploaded file after processing
      // fs.unlink(req.file.path, (err) => {
      //   if (err) logger.error('File cleanup error:', err);
      // });

      res.json({
        success: true,
        message: 'Audio processed successfully',
        data: result
      });
    } catch (error) {
      logger.error('Process audio file controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async processTextCommand(req, res) {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Text command is required'
        });
      }

      const result = await voiceRecognitionService.processTextCommand(text, req.user.id);

      res.json({
        success: true,
        response: result.result?.message || 'Command processed successfully',
        action: result.result?.action || null,
        data: {
          input: text,
          command: result.command,
          originalResult: result.result
        }
      });
    } catch (error) {
      logger.error('Process text command controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getVoiceHistory(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const history = await voiceRecognitionService.getVoiceHistory(req.user.id, limit);

      res.json({
        success: true,
        data: { history }
      });
    } catch (error) {
      logger.error('Get voice history controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getVoiceCommands(req, res) {
    try {
      const commands = {
        emergency: {
          examples: ["Help me", "I need help", "Emergency", "I've fallen", "Call for help"],
          description: "Trigger emergency alert and notify contacts"
        },
        medication: {
          examples: ["What medications do I need?", "Remind me about my pills", "Check my medicine"],
          description: "Get information about current medications"
        },
        health: {
          examples: ["How am I feeling today?", "Health check-in", "My mood today"],
          description: "Check health status and daily check-ins"
        },
        call: {
          examples: ["Call my family", "Contact my son", "Make a phone call"],
          description: "Initiate calls to emergency contacts"
        },
        games: {
          examples: ["Play a game", "Brain training", "Memory exercise"],
          description: "Start brain training exercises"
        },
        general: {
          examples: ["What time is it?", "What's the date?", "Help"],
          description: "General information and assistance"
        }
      };

      res.json({
        success: true,
        data: { commands }
      });
    } catch (error) {
      logger.error('Get voice commands controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Middleware for file upload
  uploadAudio() {
    return upload.single('audio');
  }
}

module.exports = new VoiceController();
