const { createServer } = require('http');
const { Server } = require('socket.io');
const logger = require('../config/logger');
const sensorMonitoringService = require('./sensorMonitoringService');
const voiceRecognitionService = require('./voiceRecognitionService');

class WebSocketService {
  constructor(app) {
    this.server = createServer(app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.SOCKET_IO_CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', (data) => {
        const { userId, token } = data;
        // Verify JWT token here
        socket.userId = userId;
        socket.join(`user_${userId}`);
        logger.info(`User ${userId} authenticated and joined room`);
      });

      // Handle real-time sensor data
      socket.on('sensor_data', async (data) => {
        try {
          if (!socket.userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const result = await sensorMonitoringService.processSensorData(socket.userId, data);
          
          // Send processed data back to client
          socket.emit('sensor_processed', result);

          // If emergency detected, notify emergency contacts
          if (result.emergency_detected && result.emergency_detected.length > 0) {
            this.notifyEmergencyContacts(socket.userId, result.emergency_detected);
          }
        } catch (error) {
          logger.error('Socket sensor data error:', error);
          socket.emit('error', { message: 'Failed to process sensor data' });
        }
      });

      // Handle real-time voice streaming
      socket.on('voice_stream_start', (data) => {
        try {
          if (!socket.userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          // Initialize streaming voice recognition
          const streamingRecognition = voiceRecognitionService.processStreamingAudio(
            socket.userId,
            socket
          );

          socket.streamingRecognition = streamingRecognition;
          socket.emit('voice_stream_ready');
        } catch (error) {
          logger.error('Voice stream start error:', error);
          socket.emit('error', { message: 'Failed to start voice streaming' });
        }
      });

      socket.on('voice_stream_data', (audioData) => {
        try {
          if (socket.streamingRecognition) {
            socket.streamingRecognition.write(audioData);
          }
        } catch (error) {
          logger.error('Voice stream data error:', error);
        }
      });

      socket.on('voice_stream_end', () => {
        try {
          if (socket.streamingRecognition) {
            socket.streamingRecognition.end();
            socket.streamingRecognition = null;
          }
          socket.emit('voice_stream_ended');
        } catch (error) {
          logger.error('Voice stream end error:', error);
        }
      });

      // Handle emergency alerts
      socket.on('emergency_alert', async (data) => {
        try {
          if (!socket.userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const emergencyService = require('./emergencyService');
          const alert = await emergencyService.createAlert(socket.userId, {
            alert_type: 'manual',
            message: data.message || 'Emergency button pressed',
            location: data.location
          });

          socket.emit('emergency_alert_created', { alert });
          this.notifyEmergencyContacts(socket.userId, [{ type: 'manual_emergency', alert }]);
        } catch (error) {
          logger.error('Emergency alert error:', error);
          socket.emit('error', { message: 'Failed to create emergency alert' });
        }
      });

      // Handle video call requests
      socket.on('initiate_call', async (data) => {
        try {
          if (!socket.userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const { contact_id, call_type } = data;
          
          // Get contact information
          const emergencyService = require('./emergencyService');
          const contacts = await emergencyService.getUserEmergencyContacts(socket.userId);
          const contact = contacts.find(c => c.id === contact_id);

          if (!contact) {
            socket.emit('error', { message: 'Contact not found' });
            return;
          }

          // Emit call initiation event
          socket.emit('call_initiated', {
            contact,
            call_type,
            timestamp: new Date().toISOString()
          });

          logger.info(`Call initiated by user ${socket.userId} to contact ${contact_id}`);
        } catch (error) {
          logger.error('Initiate call error:', error);
          socket.emit('error', { message: 'Failed to initiate call' });
        }
      });

      // Handle heartbeat for connection monitoring
      socket.on('heartbeat', () => {
        socket.emit('heartbeat_ack', { timestamp: new Date().toISOString() });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
        
        // Clean up streaming recognition if active
        if (socket.streamingRecognition) {
          socket.streamingRecognition.end();
        }
      });
    });
  }

  async notifyEmergencyContacts(userId, emergencies) {
    try {
      // Get user's emergency contacts
      const emergencyService = require('./emergencyService');
      const contacts = await emergencyService.getUserEmergencyContacts(userId);

      // Notify each contact via their connected sockets
      for (const contact of contacts) {
        // This could be enhanced to support family member connections
        this.io.to(`contact_${contact.id}`).emit('emergency_notification', {
          userId,
          emergencies,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('Notify emergency contacts via socket error:', error);
    }
  }

  // Send real-time notification to specific user
  sendToUser(userId, event, data) {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  // Send notification to all connected users
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  // Get server instance for Express app
  getServer() {
    return this.server;
  }

  // Get Socket.IO instance
  getIO() {
    return this.io;
  }
}

module.exports = WebSocketService;
