import apiService from './apiService';

class NotificationService {
  async registerDevice(deviceData) {
    try {
      const response = await apiService.post('/api/notifications/register-device', deviceData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async sendNotification(notificationData) {
    try {
      const response = await apiService.post('/api/notifications/send', notificationData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getNotificationHistory(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await apiService.get(`/api/notifications/history?${queryParams}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateNotificationSettings(settings) {
    try {
      const response = await apiService.put('/api/notifications/settings', settings);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getNotificationSettings() {
    try {
      const response = await apiService.get('/api/notifications/settings');
      return response;
    } catch (error) {
      throw error;
    }
  }

  async markAsRead(notificationId) {
    try {
      const response = await apiService.put(`/api/notifications/${notificationId}/read`);
      return response;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId) {
    try {
      const response = await apiService.delete(`/api/notifications/${notificationId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new NotificationService();
