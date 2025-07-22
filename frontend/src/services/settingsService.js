import apiService from './apiService';

class SettingsService {
  async getUserSettings() {
    try {
      const response = await apiService.get('/api/settings');
      return response;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      throw error;
    }
  }

  async updateUserSettings(settings) {
    try {
      const response = await apiService.put('/api/settings', settings);
      return response;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  async updateNotificationSettings(notificationSettings) {
    try {
      const response = await apiService.put('/api/settings/notifications', notificationSettings);
      return response;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  async updatePrivacySettings(privacySettings) {
    try {
      const response = await apiService.put('/api/settings/privacy', privacySettings);
      return response;
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  }

  async updateAccessibilitySettings(accessibilitySettings) {
    try {
      const response = await apiService.put('/api/settings/accessibility', accessibilitySettings);
      return response;
    } catch (error) {
      console.error('Error updating accessibility settings:', error);
      throw error;
    }
  }

  async exportUserData(format = 'json') {
    try {
      const response = await apiService.get(`/api/settings/export?format=${format}`);
      return response;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  async deleteAccount(password) {
    try {
      const response = await apiService.delete('/api/settings/account', {
        data: { password }
      });
      return response;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await apiService.put('/api/settings/profile', profileData);
      return response;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiService.put('/api/settings/password', {
        currentPassword,
        newPassword
      });
      return response;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  async updateLanguage(language) {
    try {
      const response = await apiService.put('/api/settings/language', { language });
      return response;
    } catch (error) {
      console.error('Error updating language:', error);
      throw error;
    }
  }

  async getSystemInfo() {
    try {
      const response = await apiService.get('/api/settings/system-info');
      return response;
    } catch (error) {
      console.error('Error fetching system info:', error);
      throw error;
    }
  }

  async reportIssue(issueData) {
    try {
      const response = await apiService.post('/api/settings/report-issue', {
        ...issueData,
        reportedAt: new Date().toISOString()
      });
      return response;
    } catch (error) {
      console.error('Error reporting issue:', error);
      throw error;
    }
  }

  async getFAQ() {
    try {
      const response = await apiService.get('/api/settings/faq');
      return response;
    } catch (error) {
      console.error('Error fetching FAQ:', error);
      throw error;
    }
  }

  async getPrivacyPolicy() {
    try {
      const response = await apiService.get('/api/settings/privacy-policy');
      return response;
    } catch (error) {
      console.error('Error fetching privacy policy:', error);
      throw error;
    }
  }

  async getTermsOfService() {
    try {
      const response = await apiService.get('/api/settings/terms-of-service');
      return response;
    } catch (error) {
      console.error('Error fetching terms of service:', error);
      throw error;
    }
  }

  async syncSettings() {
    try {
      const response = await apiService.post('/api/settings/sync');
      return response;
    } catch (error) {
      console.error('Error syncing settings:', error);
      throw error;
    }
  }

  async backupData() {
    try {
      const response = await apiService.post('/api/settings/backup');
      return response;
    } catch (error) {
      console.error('Error backing up data:', error);
      throw error;
    }
  }

  async restoreData(backupData) {
    try {
      const response = await apiService.post('/api/settings/restore', backupData);
      return response;
    } catch (error) {
      console.error('Error restoring data:', error);
      throw error;
    }
  }
}

export const settingsService = new SettingsService();
