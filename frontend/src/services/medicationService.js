import apiService from './apiService';

class MedicationService {
  async getMedications() {
    try {
      const response = await apiService.get('/api/medications');
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getMedication(medicationId) {
    try {
      const response = await apiService.get(`/api/medications/${medicationId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async addMedication(medicationData) {
    try {
      const response = await apiService.post('/api/medications', medicationData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateMedication(medicationId, medicationData) {
    try {
      const response = await apiService.put(`/api/medications/${medicationId}`, medicationData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async deleteMedication(medicationId) {
    try {
      const response = await apiService.delete(`/api/medications/${medicationId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async markMedicationTaken(medicationId, takenData) {
    try {
      const response = await apiService.post(`/api/medications/${medicationId}/log`, takenData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getMedicationHistory(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await apiService.get(`/api/medications/history?${queryParams}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getMedicationReminders() {
    try {
      const response = await apiService.get('/api/medications/reminders');
      return response;
    } catch (error) {
      throw error;
    }
  }

  async snoozeReminder(medicationId, snoozeMinutes = 10) {
    try {
      const response = await apiService.post(`/api/medications/${medicationId}/snooze`, {
        snoozeMinutes,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getMedicationStats(period = '30') {
    try {
      const response = await apiService.get(`/api/medications/stats?period=${period}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new MedicationService();
