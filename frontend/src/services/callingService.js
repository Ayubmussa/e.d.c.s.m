import { makeApiCall } from './apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

class CallingService {
  constructor() {
    this.currentCall = null;
    this.callListeners = [];
  }

  // Add listener for call events
  addCallListener(listener) {
    this.callListeners.push(listener);
  }

  // Remove call listener
  removeCallListener(listener) {
    this.callListeners = this.callListeners.filter(l => l !== listener);
  }

  // Notify all listeners of call events
  notifyListeners(event, data) {
    this.callListeners.forEach(listener => {
      if (typeof listener === 'function') {
        listener(event, data);
      }
    });
  }

  // Initiate a voice call
  async initiateVoiceCall(contactId, contactInfo) {
    try {
      const response = await makeApiCall('/api/calls/initiate', 'POST', {
        contactId,
        callType: 'voice',
        contactInfo
      });

      if (response.success) {
        this.currentCall = {
          id: response.data.callId,
          type: 'voice',
          status: 'initiating',
          contactId,
          contactInfo,
          startTime: new Date(),
        };

        this.notifyListeners('callInitiated', this.currentCall);
        return { success: true, data: this.currentCall };
      }
      
      return response;
    } catch (error) {
      console.error('Error initiating voice call:', error);
      return { success: false, error: error.message };
    }
  }

  // Initiate a video call
  async initiateVideoCall(contactId, contactInfo) {
    try {
      const response = await makeApiCall('/api/calls/initiate', 'POST', {
        contactId,
        callType: 'video',
        contactInfo
      });

      if (response.success) {
        this.currentCall = {
          id: response.data.callId,
          type: 'video',
          status: 'initiating',
          contactId,
          contactInfo,
          startTime: new Date(),
        };

        this.notifyListeners('callInitiated', this.currentCall);
        return { success: true, data: this.currentCall };
      }
      
      return response;
    } catch (error) {
      console.error('Error initiating video call:', error);
      return { success: false, error: error.message };
    }
  }

  // Accept an incoming call
  async acceptCall(callId) {
    try {
      const response = await makeApiCall(`/api/calls/${callId}/accept`, 'POST');
      
      if (response.success && this.currentCall) {
        this.currentCall.status = 'active';
        this.currentCall.acceptTime = new Date();
        this.notifyListeners('callAccepted', this.currentCall);
      }
      
      return response;
    } catch (error) {
      console.error('Error accepting call:', error);
      return { success: false, error: error.message };
    }
  }

  // Decline an incoming call
  async declineCall(callId) {
    try {
      const response = await makeApiCall(`/api/calls/${callId}/decline`, 'POST');
      
      if (response.success) {
        this.currentCall = null;
        this.notifyListeners('callDeclined', { callId });
      }
      
      return response;
    } catch (error) {
      console.error('Error declining call:', error);
      return { success: false, error: error.message };
    }
  }

  // End the current call
  async endCall(callId) {
    try {
      const response = await makeApiCall(`/api/calls/${callId}/end`, 'POST');
      
      if (response.success) {
        const endedCall = { ...this.currentCall, endTime: new Date() };
        this.currentCall = null;
        this.notifyListeners('callEnded', endedCall);
      }
      
      return response;
    } catch (error) {
      console.error('Error ending call:', error);
      return { success: false, error: error.message };
    }
  }

  // Get call history
  async getCallHistory(params = {}) {
    try {
      const response = await makeApiCall('/api/calls/history', 'GET', null, params);
      return response;
    } catch (error) {
      console.error('Error fetching call history:', error);
      return { success: false, error: error.message };
    }
  }

  // Toggle mute
  async toggleMute(callId, muted) {
    try {
      const response = await makeApiCall(`/api/calls/${callId}/mute`, 'POST', { muted });
      
      if (response.success && this.currentCall) {
        this.currentCall.muted = muted;
        this.notifyListeners('callMuteToggled', { callId, muted });
      }
      
      return response;
    } catch (error) {
      console.error('Error toggling mute:', error);
      return { success: false, error: error.message };
    }
  }

  // Toggle video (for video calls)
  async toggleVideo(callId, videoEnabled) {
    try {
      const response = await makeApiCall(`/api/calls/${callId}/video`, 'POST', { videoEnabled });
      
      if (response.success && this.currentCall) {
        this.currentCall.videoEnabled = videoEnabled;
        this.notifyListeners('callVideoToggled', { callId, videoEnabled });
      }
      
      return response;
    } catch (error) {
      console.error('Error toggling video:', error);
      return { success: false, error: error.message };
    }
  }

  // Get emergency contacts for quick calling
  async getEmergencyContacts() {
    try {
      const response = await makeApiCall('/api/emergency/contacts', 'GET');
      return response;
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      return { success: false, error: error.message };
    }
  }

  // Get family members for calling
  async getFamilyContacts() {
    try {
      const response = await makeApiCall('/api/family/contacts', 'GET');
      return response;
    } catch (error) {
      console.error('Error fetching family contacts:', error);
      return { success: false, error: error.message };
    }
  }

  // Emergency call functionality
  async initiateEmergencyCall(emergencyType = 'general') {
    try {
      const response = await makeApiCall('/api/calls/emergency', 'POST', {
        emergencyType,
        timestamp: new Date().toISOString(),
        location: await this.getCurrentLocation()
      });

      if (response.success) {
        this.currentCall = {
          id: response.data.callId,
          type: 'emergency',
          status: 'initiating',
          emergencyType,
          startTime: new Date(),
        };

        this.notifyListeners('emergencyCallInitiated', this.currentCall);
        return { success: true, data: this.currentCall };
      }
      
      return response;
    } catch (error) {
      console.error('Error initiating emergency call:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current location for emergency calls
  async getCurrentLocation() {
    try {
      // This would integrate with location services
      // For now, return a placeholder
      return {
        latitude: 0,
        longitude: 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  // Get current call info
  getCurrentCall() {
    return this.currentCall;
  }

  // Check if currently in a call
  isInCall() {
    return this.currentCall !== null;
  }

  // Simulate incoming call (for testing)
  simulateIncomingCall(contactInfo, callType = 'voice') {
    const incomingCall = {
      id: `call_${Date.now()}`,
      type: callType,
      status: 'incoming',
      contactInfo,
      startTime: new Date(),
    };
    
    this.currentCall = incomingCall;
    this.notifyListeners('incomingCall', incomingCall);
    return incomingCall;
  }

  // Get Twilio access token
  async getTwilioToken(callType = 'voice', roomName = null) {
    try {
      const params = new URLSearchParams({ callType });
      if (roomName) {
        params.append('roomName', roomName);
      }

      const response = await makeApiCall(`/api/calls/twilio-token?${params}`, 'GET');
      
      if (response.success) {
        return response.data;
      }
      
      return response;
    } catch (error) {
      console.error('Error getting Twilio token:', error);
      return { success: false, error: error.message };
    }
  }

  // Get call data with Twilio information
  async getCallTwilioData(callId) {
    try {
      const response = await makeApiCall(`/api/calls/${callId}/twilio-data`, 'GET');
      return response;
    } catch (error) {
      console.error('Error getting call Twilio data:', error);
      return { success: false, error: error.message };
    }
  }

  // Initialize Twilio Voice/Video
  async initializeTwilioCall(callId, callType) {
    try {
      // Get call data with Twilio tokens
      const callDataResponse = await this.getCallTwilioData(callId);
      
      if (!callDataResponse.success) {
        throw new Error('Failed to get call data');
      }

      const { twilioData } = callDataResponse.data;
      
      if (!twilioData) {
        throw new Error('No Twilio data available for this call');
      }

      // Store Twilio data for use in CallScreen
      if (this.currentCall) {
        this.currentCall.twilioData = twilioData;
        this.notifyListeners('twilioDataReceived', { callId, twilioData });
      }

      return { success: true, data: twilioData };
      
    } catch (error) {
      console.error('Error initializing Twilio call:', error);
      return { success: false, error: error.message };
    }
  }
}

export const callingService = new CallingService();
export default callingService;
