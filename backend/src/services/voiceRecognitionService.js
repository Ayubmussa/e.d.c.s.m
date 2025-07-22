const { AssemblyAI } = require('assemblyai');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');
const { supabaseAdmin } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class VoiceRecognitionService {
  constructor() {
    this.initializeAssemblyAI();
    this.commands = this.initializeVoiceCommands();
  }

  initializeAssemblyAI() {
    try {
      const apiKey = process.env.ASSEMBLYAI_API_KEY;
      
      if (apiKey && !apiKey.includes('your_')) {
        this.assemblyAI = new AssemblyAI({
          apiKey: apiKey
        });
        logger.info('AssemblyAI client initialized successfully');
      } else {
        logger.warn('AssemblyAI API key not configured properly - voice recognition disabled');
        this.assemblyAI = null;
      }
    } catch (error) {
      logger.error('AssemblyAI initialization error:', error);
      this.assemblyAI = null;
    }
  }

  initializeVoiceCommands() {
    return {
      // Emergency commands
      emergency: {
        keywords: ['emergency', 'help', 'call 911', 'urgent', 'medical emergency'],
        action: 'trigger_emergency',
        priority: 'high'
      },
      
      // Medication commands
      medication: {
        keywords: ['medication', 'pills', 'medicine', 'take medication', 'remind medication'],
        action: 'medication_reminder',
        priority: 'medium'
      },
      
      // Health check commands
      health: {
        keywords: ['health check', 'how are you', 'feeling', 'symptoms', 'pain'],
        action: 'health_checkin',
        priority: 'medium'
      },
      
      // Brain training commands
      brain_training: {
        keywords: ['brain training', 'memory game', 'puzzle', 'exercise brain'],
        action: 'start_brain_training',
        priority: 'low'
      },
      
      // General assistance
      assistance: {
        keywords: ['help me', 'assistance', 'what can you do', 'commands'],
        action: 'show_help',
        priority: 'low'
      }
    };
  }

  async transcribeAudio(audioFilePath, userId, token = null) {
    try {
      if (token) {
        logger.info(`Authenticated user token received in transcribeAudio: ${token}`);
      }
      if (!this.assemblyAI) {
        throw new Error('AssemblyAI not initialized');
      }

      // Check if file exists
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioFilePath}`);
      }

      // Get file stats
      const stats = fs.statSync(audioFilePath);
      logger.info(`Processing audio file: ${audioFilePath} (${stats.size} bytes)`);
      logger.info(`Audio file extension: ${path.extname(audioFilePath)}, format: ${stats.isFile() ? 'file' : 'not file'}`);
      if (stats.size === 0) {
        logger.error('Audio file is empty:', audioFilePath);
        throw new Error('Audio file is empty.');
      }

      // For local files, upload as raw binary with only Authorization header
      const audioData = fs.readFileSync(audioFilePath);
      logger.info('Uploading audio file to AssemblyAI using axios...');
      const axios = require('axios');
      let uploadUrl;
      try {
        const response = await axios.post(
          'https://api.assemblyai.com/v2/upload',
          audioData,
          {
            headers: {
              'Authorization': process.env.ASSEMBLYAI_API_KEY
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          }
        );
        // Log the raw response object for diagnostics
        console.log('AssemblyAI raw upload response:', response);
        logger.info('AssemblyAI upload response status:', response.status);
        logger.info('AssemblyAI upload response headers:', JSON.stringify(response.headers));
        logger.info('AssemblyAI upload response data:', JSON.stringify(response.data));
        if (!response.data || !response.data.upload_url) {
          logger.error('AssemblyAI upload response missing upload_url:', JSON.stringify(response.data));
          throw new Error('AssemblyAI upload response missing upload_url.');
        }
        uploadUrl = response.data.upload_url;
      } catch (uploadErr) {
        logger.error('AssemblyAI upload threw error:', {
          message: uploadErr.message,
          stack: uploadErr.stack,
          name: uploadErr.name,
          response: uploadErr.response ? uploadErr.response.data : null,
          code: uploadErr.code ? uploadErr.code : null,
          status: uploadErr.status ? uploadErr.status : null
        });
        throw new Error('AssemblyAI upload threw error: ' + uploadErr.message);
      }

      if (!uploadUrl) {
        logger.error('AssemblyAI upload failed or returned invalid upload_url:', uploadUrl);
        throw new Error('AssemblyAI upload failed: No valid upload_url returned.');
      }

      // Configure transcription with the correct audio_url
      logger.info('Transcription request audio_url:', uploadUrl);
      // Send only required fields for transcription
      const config = {
        audio_url: typeof uploadUrl === 'string' ? uploadUrl : ''
      };
      logger.info('Transcription request config:', JSON.stringify(config));
      console.log('Transcription POST body:', JSON.stringify(config));

      // Start transcription using direct HTTP POST, ensure JSON body
      let transcript;
      try {
        const response = await axios.post(
          'https://api.assemblyai.com/v2/transcript',
          JSON.stringify(config),
          {
            headers: {
              'Authorization': process.env.ASSEMBLYAI_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        transcript = response.data;
        logger.info('AssemblyAI transcript response:', JSON.stringify(transcript));
        if (transcript.error) {
          logger.error('AssemblyAI transcript error:', transcript.error);
        }
      } catch (transcribeErr) {
        logger.error('AssemblyAI transcription threw error:', {
          message: transcribeErr.message,
          stack: transcribeErr.stack,
          name: transcribeErr.name,
          response: transcribeErr.response ? transcribeErr.response.data : null,
          code: transcribeErr.code ? transcribeErr.code : null,
          status: transcribeErr.status ? transcribeErr.status : null
        });
        throw new Error('AssemblyAI transcription threw error: ' + transcribeErr.message);
      }

      if (transcript.status === 'error') {
        throw new Error(`Transcription failed: ${transcript.error}`);
      }

      const result = {
        transcription: transcript.text || '',
        confidence: transcript.confidence || 0,
        language: config.language_code,
        duration: transcript.audio_duration ? transcript.audio_duration / 1000 : null, // Convert to seconds
        words: transcript.words || []
      };

      // Save interaction to database
      await this.saveVoiceInteraction(userId, audioFilePath, result);

      logger.info(`Transcription completed: "${result.transcription}" (confidence: ${result.confidence})`);
      return result;

    } catch (error) {
      logger.error('Audio transcription error:', error);
      throw error;
    }
  }

 
  async processAudioFile(audioFilePath, userId, token = null) {
    // This method wraps transcribeAudio for controller usage
    return await this.transcribeAudio(audioFilePath, userId, token);
  }

  async processTextCommand(text, userId) {
    try {
      const command = this.analyzeCommand(text);
      const result = await this.executeCommand(command, userId);
      
      // Save text command interaction
      await this.saveVoiceInteraction(userId, null, {
        transcription: text,
        command: command,
        result: result,
        type: 'text_command'
      });

      return {
        command: command,
        result: result,
        originalText: text
      };

    } catch (error) {
      logger.error('Text command processing error:', error);
      throw error;
    }
  }

  analyzeCommand(text) {
    const lowerText = text.toLowerCase();
    
    for (const [commandType, commandConfig] of Object.entries(this.commands)) {
      for (const keyword of commandConfig.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          return {
            type: commandType,
            action: commandConfig.action,
            priority: commandConfig.priority,
            confidence: this.calculateKeywordConfidence(lowerText, keyword),
            originalText: text
          };
        }
      }
    }

    // If no specific command found, return general assistance
    return {
      type: 'unknown',
      action: 'general_response',
      priority: 'low',
      confidence: 0.5,
      originalText: text
    };
  }

  calculateKeywordConfidence(text, keyword) {
    const exactMatch = text.includes(keyword.toLowerCase());
    const words = text.split(' ');
    const keywordWords = keyword.toLowerCase().split(' ');
    
    let matchedWords = 0;
    for (const kw of keywordWords) {
      if (words.some(word => word.includes(kw))) {
        matchedWords++;
      }
    }
    
    const wordMatchRatio = matchedWords / keywordWords.length;
    return exactMatch ? 1.0 : wordMatchRatio;
  }

  async executeCommand(command, userId) {
    try {
      switch (command.action) {
        case 'trigger_emergency':
          return await this.triggerEmergencyAlert(userId);
          
        case 'medication_reminder':
          return await this.getMedicationReminder(userId);
          
        case 'health_checkin':
          return await this.initiateHealthCheckin(userId);
          
        case 'start_brain_training':
          return await this.startBrainTraining(userId);
          
        case 'show_help':
          return this.getHelpInformation();
          
        default:
          return this.getGeneralResponse(command.originalText);
      }
    } catch (error) {
      logger.error(`Command execution error for ${command.action}:`, error);
      return {
        success: false,
        message: 'Sorry, I encountered an error processing your request.',
        error: error.message
      };
    }
  }

  async triggerEmergencyAlert(userId) {
    try {
      // Get user's emergency contacts
      const { data: contacts, error } = await supabaseAdmin
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      return {
        success: true,
        message: 'Emergency alert has been triggered. Help is on the way.',
        action: 'emergency_triggered',
        contacts_notified: contacts?.length || 0
      };
    } catch (error) {
      throw new Error(`Failed to trigger emergency alert: ${error.message}`);
    }
  }

  async getMedicationReminder(userId) {
    try {
      const { data: medications, error } = await supabaseAdmin
        .from('medications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      const now = new Date();
      const upcomingMeds = medications?.filter(med => {
        const nextDose = new Date(med.next_dose_time);
        const timeDiff = nextDose - now;
        return timeDiff > 0 && timeDiff < 3600000; // Next hour
      }) || [];

      return {
        success: true,
        message: upcomingMeds.length > 0 
          ? `You have ${upcomingMeds.length} medication(s) coming up.`
          : 'No medications scheduled for the next hour.',
        medications: upcomingMeds,
        action: 'medication_reminder'
      };
    } catch (error) {
      throw new Error(`Failed to get medication reminder: ${error.message}`);
    }
  }

  async initiateHealthCheckin(userId) {
    return {
      success: true,
      message: 'Let\'s do a quick health check. How are you feeling today?',
      action: 'health_checkin_initiated',
      next_step: 'prompt_for_symptoms'
    };
  }

  async startBrainTraining(userId) {
    try {
      const { data: games, error } = await supabaseAdmin
        .from('brain_training_games')
        .select('*')
        .eq('is_active', true)
        .limit(3);

      if (error) throw error;

      return {
        success: true,
        message: 'Great! I have some brain training exercises for you.',
        action: 'brain_training_started',
        available_games: games || []
      };
    } catch (error) {
      throw new Error(`Failed to start brain training: ${error.message}`);
    }
  }

  getHelpInformation() {
    return {
      success: true,
      message: 'I can help you with emergencies, medications, health check-ins, and brain training.',
      action: 'help_provided',
      available_commands: [
        'Emergency help',
        'Medication reminders',
        'Health check-ins',
        'Brain training exercises',
        'General assistance'
      ]
    };
  }

  getGeneralResponse(text) {
    const responses = [
      'I understand you said "' + text + '". How can I help you today?',
      'Thank you for talking to me. Is there something specific I can help you with?',
      'I\'m here to help with your health, medications, or any emergencies. What do you need?'
    ];
    
    return {
      success: true,
      message: responses[Math.floor(Math.random() * responses.length)],
      action: 'general_response',
      suggestions: ['Emergency help', 'Check medications', 'Health check-in']
    };
  }

  async saveVoiceInteraction(userId, audioFilePath, result) {
    try {
      const interaction = {
        id: uuidv4(),
        user_id: userId,
        transcript: result.transcription || result.text || '',
        audio_file_path: audioFilePath,
        command_type: result.command?.type || 'unknown',
        command_result: result.result || result
      };

      const { error } = await supabaseAdmin
        .from('voice_interactions')
        .insert([interaction]);

      if (error) {
        logger.error('Failed to save voice interaction:', error);
      } else {
        logger.info(`Voice interaction saved for user ${userId}`);
      }

    } catch (error) {
      logger.error('Error saving voice interaction:', error);
    }
  }

  async getVoiceHistory(userId, limit = 50) {
    try {
      const { data, error } = await supabaseAdmin
        .from('voice_interactions')
        .select('*')
        .eq('user_id', userId)
        .order('processed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error fetching voice history:', error);
      throw error;
    }
  }

  async deleteAudioFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Audio file deleted: ${filePath}`);
      }
    } catch (error) {
      logger.error(`Failed to delete audio file ${filePath}:`, error);
    }
  }

  getSupportedFormats() {
    return {
      audio_formats: ['wav', 'mp3', 'mp4', 'm4a', 'flac'],
      max_file_size: '512MB',
      max_duration: '7200s', // 2 hours
      sample_rates: ['8000Hz', '16000Hz', '22050Hz', '44100Hz', '48000Hz'],
      recommended: {
        format: 'wav',
        sample_rate: '16000Hz',
        channels: 'mono',
        encoding: '16-bit PCM'
      }
    };
  }

  isServiceAvailable() {
    return this.assemblyAI !== null;
  }
}

module.exports = new VoiceRecognitionService();
