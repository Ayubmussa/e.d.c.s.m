import apiService from './apiService';
import axios from 'axios';

class VoiceService {
  async getVoiceCommands(token) {
    try {
      console.log('[VoiceService] getVoiceCommands called with token:', token);
      const response = await apiService.get('/api/voice/commands', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      console.log('[VoiceService] getVoiceCommands response:', response);
      return response;
    } catch (error) {
      console.error('[VoiceService] Get voice commands error:', error);
      if (error.response) {
        console.error('[VoiceService] Get voice commands error response:', error.response);
      }
      throw error;
    }
  }
  async processTextCommand(textData, token) {
    try {
      console.log('[VoiceService] processTextCommand called with:', { textData, token });
      const response = await apiService.post('/api/voice/process-text', textData, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      console.log('[VoiceService] processTextCommand response:', response);
      return response;
    } catch (error) {
      console.error('[VoiceService] processTextCommand error:', error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.error('[VoiceService] Authentication error, token may be expired or invalid:', error.response.data);
        throw new Error('Authentication error. Please log in again.');
      }
      if (error.response) {
        console.error('[VoiceService] processTextCommand error response:', error.response);
      }
      throw error;
    }
  }

  async uploadAudio(audioFile, language = 'en', token) {
    try {
      console.log('[VoiceService] uploadAudio called with:', { audioFile, language, token });
      if (!audioFile || typeof audioFile !== 'string' || !audioFile.startsWith('file://')) {
        console.error('[VoiceService] Invalid or missing audio URI:', audioFile);
        throw new Error('Invalid or missing audio file URI.');
      }
      
      const extension = audioFile.split('.').pop() || 'wav';
      let mimeType = 'audio/wav';
      if (extension === 'm4a') mimeType = 'audio/m4a';
      else if (extension === 'mp3') mimeType = 'audio/mp3';
      else if (extension === 'ogg') mimeType = 'audio/ogg';
      else if (extension === 'webm') mimeType = 'audio/webm';
      
      const fileName = `audio.${extension}`;
      console.log('[VoiceService] Uploading audio:', {
        uri: audioFile,
        language,
        token,
        fileName,
        mimeType
      });
      
      if (!token || typeof token !== 'string' || token.length < 10) {
        console.error('[VoiceService] Missing or invalid token for audio upload:', token);
        throw new Error('No authentication token found. Please log in again.');
      }
      
     const formData = new FormData();
     formData.append('audio', {
     uri: audioFile,
     name: fileName,
     type: mimeType,
    }); 
    formData.append('language', language);
      
      console.log('[VoiceService] Uploading audio with Axios:', { 
        uri: audioFile, 
        fileName, 
        mimeType, 
        token,
        formDataKeys: Object.keys(formData)
      });
      
      const response = await fetch(`${apiService.api.defaults.baseURL}/api/voice/process-audio`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      console.log('[VoiceService] Audio upload response:', data);
      return data;
    } catch (error) {
      console.error('[VoiceService] Audio upload error:', error);
      if (error.response) {
        console.error('[VoiceService] Audio upload error response:', error.response);
      }
      throw error;
    }
  }

  async getVoiceHistory(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await apiService.get(`/api/voice/history?${queryParams}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getVoiceSettings() {
    try {
      const response = await apiService.get('/api/voice/settings');
      return response;
    } catch (error) {
      throw error;
    }
  }

  async processVoiceCommand(audioUri, token) {
    try {
      console.log('[VoiceService] processVoiceCommand called with:', { audioUri, token });
      
      // Validate audioUri parameter
      if (!audioUri) {
        throw new Error('audioUri parameter is required');
      }
      
      if (typeof audioUri !== 'string') {
        throw new Error('audioUri must be a string');
      }
      
      if (!audioUri.startsWith('file://')) {
        throw new Error('audioUri must be a valid file URI starting with file://');
      }
      
      const response = await this.uploadAudio(audioUri, 'en', token);
      console.log('[VoiceService] processVoiceCommand response:', response);
      return response;
    } catch (error) {
      console.error('[VoiceService] processVoiceCommand error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('audioUri')) {
        console.error('[VoiceService] audioUri validation error:', error.message);
        throw new Error('Invalid audio file. Please try recording again.');
      }
      
      throw error;
    }
  }

  async updateVoiceSettings(settings) {
    try {
      const response = await apiService.put('/api/voice/settings', settings);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new VoiceService();
