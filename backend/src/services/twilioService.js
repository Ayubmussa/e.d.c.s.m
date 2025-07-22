const twilio = require('twilio');
const logger = require('../config/logger');

class TwilioService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (!this.accountSid || !this.authToken || !this.phoneNumber) {
      logger.error('Twilio credentials not properly configured');
      this.client = null;
    } else {
      this.client = twilio(this.accountSid, this.authToken);
      logger.info('Twilio client initialized successfully');
    }
  }

  // Generate access token for Twilio Voice
  generateVoiceToken(identity) {
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }

    const { jwt } = require('twilio');
    const VoiceGrant = jwt.AccessToken.VoiceGrant;
    const AccessToken = jwt.AccessToken;

    // Create an access token
    const accessToken = new AccessToken(
      this.accountSid,
      process.env.TWILIO_API_KEY || this.accountSid,
      process.env.TWILIO_API_SECRET || this.authToken,
      { identity }
    );

    // Create a Voice grant and add to token
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
      incomingAllow: true
    });
    accessToken.addGrant(voiceGrant);

    return accessToken.toJwt();
  }

  // Generate access token for Twilio Video
  generateVideoToken(identity, roomName) {
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }

    const { jwt } = require('twilio');
    const VideoGrant = jwt.AccessToken.VideoGrant;
    const AccessToken = jwt.AccessToken;

    // Create an access token
    const accessToken = new AccessToken(
      this.accountSid,
      process.env.TWILIO_API_KEY || this.accountSid,
      process.env.TWILIO_API_SECRET || this.authToken,
      { identity }
    );

    // Create a Video grant and add to token
    const videoGrant = new VideoGrant({
      room: roomName
    });
    accessToken.addGrant(videoGrant);

    return accessToken.toJwt();
  }

  // Create a video room
  async createVideoRoom(roomName, roomType = 'group') {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }

      const room = await this.client.video.rooms.create({
        uniqueName: roomName,
        type: roomType,
        maxParticipants: 2 // For 1-on-1 calls
      });

      logger.info(`Video room created: ${room.sid}`);
      return room;
    } catch (error) {
      logger.error('Error creating video room:', error);
      throw error;
    }
  }

  // Get video room status
  async getVideoRoom(roomName) {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }

      const room = await this.client.video.rooms(roomName).fetch();
      return room;
    } catch (error) {
      logger.error('Error fetching video room:', error);
      throw error;
    }
  }

  // End video room
  async endVideoRoom(roomName) {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }

      const room = await this.client.video.rooms(roomName)
        .update({ status: 'completed' });
      
      logger.info(`Video room ended: ${room.sid}`);
      return room;
    } catch (error) {
      logger.error('Error ending video room:', error);
      throw error;
    }
  }

  // Make a phone call (for emergency or fallback)
  async makePhoneCall(toNumber, fromNumber = null, twimlUrl = null) {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }

      const callOptions = {
        to: toNumber,
        from: fromNumber || this.phoneNumber
      };

      if (twimlUrl) {
        callOptions.url = twimlUrl;
      } else {
        // Default TwiML for emergency calls
        callOptions.twiml = `
          <Response>
            <Say voice="alice">This is an emergency call from the Elderly Companion app. Please respond immediately.</Say>
            <Pause length="2"/>
            <Say voice="alice">This call is being recorded for safety purposes.</Say>
          </Response>
        `;
      }

      const call = await this.client.calls.create(callOptions);
      
      logger.info(`Phone call initiated: ${call.sid}`);
      return call;
    } catch (error) {
      logger.error('Error making phone call:', error);
      throw error;
    }
  }

  // Send SMS notification
  async sendSMSNotification(toNumber, message, fromNumber = null) {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }

      const sms = await this.client.messages.create({
        body: message,
        to: toNumber,
        from: fromNumber || this.phoneNumber
      });

      logger.info(`SMS sent: ${sms.sid}`);
      return sms;
    } catch (error) {
      logger.error('Error sending SMS:', error);
      throw error;
    }
  }

  // Get call status
  async getCallStatus(callSid) {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }

      const call = await this.client.calls(callSid).fetch();
      return call;
    } catch (error) {
      logger.error('Error fetching call status:', error);
      throw error;
    }
  }

  // Validate phone number
  async validatePhoneNumber(phoneNumber) {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }

      const lookup = await this.client.lookups.v1
        .phoneNumbers(phoneNumber)
        .fetch();

      return {
        valid: true,
        formatted: lookup.phoneNumber,
        countryCode: lookup.countryCode,
        carrier: lookup.carrier
      };
    } catch (error) {
      logger.error('Error validating phone number:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

module.exports = new TwilioService();
