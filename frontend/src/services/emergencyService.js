import apiService from './apiService';

class EmergencyService {
  async getEmergencyContacts() {
    try {
      const response = await apiService.get('/api/emergency/contacts');
      return response;
    } catch (error) {
      throw error;
    }
  }

  async addEmergencyContact(contactData) {
    try {
      const response = await apiService.post('/api/emergency/contacts', contactData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateEmergencyContact(contactId, contactData) {
    try {
      const response = await apiService.put(`/api/emergency/contacts/${contactId}`, contactData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async deleteEmergencyContact(contactId) {
    try {
      const response = await apiService.delete(`/api/emergency/contacts/${contactId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async triggerEmergencyAlert(alertData) {
    try {
      const response = await apiService.post('/api/emergency/alert', alertData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateAlertStatus(alertId, statusData) {
    try {
      const response = await apiService.put(`/api/emergency/alerts/${alertId}/status`, statusData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getEmergencyHistory(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await apiService.get(`/api/emergency/history?${queryParams}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async testEmergencySystem() {
    try {
      const response = await apiService.post('/api/emergency/test');
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getEmergencySettings() {
    try {
      const response = await apiService.get('/api/emergency/settings');
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateEmergencySettings(settingsData) {
    try {
      const response = await apiService.put('/api/emergency/settings', settingsData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async sendSOSAlert(alertData) {
    try {
      const response = await apiService.post('/api/emergency/alerts', {
        alert_type: 'sos',
        ...alertData
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async logEmergencyEvent(eventData) {
    try {
      // Map event data to the expected alert structure
      const alertData = {
        alert_type: eventData.type || 'manual',
        location: eventData.location && (eventData.location.latitude !== undefined || eventData.location.longitude !== undefined) ? {
          latitude: eventData.location.latitude || null,
          longitude: eventData.location.longitude || null,
          address: eventData.location.address || null
        } : null,
        message: eventData.message || `Emergency event: ${eventData.type || 'Unknown'} at ${new Date().toLocaleString()}`
      };

      const response = await apiService.post('/api/emergency/alerts', alertData);
      return response;
    } catch (error) {
      console.error('Failed to log emergency event:', error);
      // Don't throw error for logging - it's not critical
      return { success: false, error: error.message };
    }
  }
}

export default new EmergencyService();
