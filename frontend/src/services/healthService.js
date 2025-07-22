import apiService from './apiService';

class HealthService {
  async createHealthCheckin(checkinData) {
    try {
      const response = await apiService.post('/api/health/checkins', checkinData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getHealthCheckins(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await apiService.get(`/api/health/checkins?${queryParams}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getTodayCheckin() {
    try {
      const response = await apiService.get('/api/health/checkins/today');
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getCheckinByDate(date) {
    try {
      const response = await apiService.get(`/api/health/checkins/${date}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateCheckin(checkinId, checkinData) {
    try {
      const response = await apiService.put(`/api/health/checkins/${checkinId}`, checkinData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getHealthTrends(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await apiService.get(`/api/health/trends?${queryParams}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getHealthSummary(period = '30') {
    try {
      const response = await apiService.get(`/api/health/summary?period=${period}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async addVitalSigns(vitalData) {
    try {
      // Using the unified checkins endpoint as per the backend
      const response = await apiService.post('/api/health/checkins', vitalData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getVitalSigns(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await apiService.get(`/api/health/checkins?${queryParams}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new HealthService();
