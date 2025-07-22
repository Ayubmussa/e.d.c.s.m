import apiService from './apiService';

class BrainTrainingService {
  async getExercises() {
    try {
      const response = await apiService.get('/api/brain-training/exercises');
      return response;
    } catch (error) {
      throw error;
    }
  }

  async startSession(sessionData) {
    try {
      const response = await apiService.post('/api/brain-training/sessions', sessionData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async submitScore(scoreData) {
    try {
      // Complete the session with the score data
      const response = await apiService.put(`/api/brain-training/sessions/${scoreData.sessionId}/complete`, scoreData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getPlayerStats() {
    try {
      // This maps to the backend /progress endpoint
      const response = await apiService.get('/api/brain-training/progress');
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getProgress(period = '30') {
    try {
      const response = await apiService.get(`/api/brain-training/progress?period=${period}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getSessionHistory(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await apiService.get(`/api/brain-training/sessions?${queryParams}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getLeaderboard(exerciseType = 'all') {
    try {
      // Since there's no leaderboard endpoint, return sessions with high scores
      const response = await apiService.get('/api/brain-training/sessions?limit=10&sort=score');
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getDailyChallenge() {
    try {
      // Since there's no daily challenge endpoint, generate a random exercise
      const response = await apiService.post('/api/brain-training/exercises/generate');
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getUserProgress() {
    try {
      // This maps to the backend /progress endpoint
      const response = await apiService.get('/api/brain-training/progress');
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getTodaysGames() {
    try {
      // This maps to getting sessions for today
      const today = new Date().toISOString().split('T')[0];
      const response = await apiService.get(`/api/brain-training/sessions?date=${today}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new BrainTrainingService();
