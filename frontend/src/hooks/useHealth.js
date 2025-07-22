import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import healthService from '../services/healthService';

export const useHealth = () => {
  const [healthCheckins, setHealthCheckins] = useState([]);
  const [healthSummary, setHealthSummary] = useState(null);
  const [wellnessScore, setWellnessScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHealthData = async () => {
    try {
      setError(null);
      const [checkinsResponse, summaryResponse, scoreResponse] = await Promise.all([
        healthService.getHealthCheckins({ limit: 30 }),
        healthService.getHealthSummary('week'),
        healthService.getWellnessScore('week')
      ]);
      
      setHealthCheckins(checkinsResponse.data);
      setHealthSummary(summaryResponse.data);
      setWellnessScore(scoreResponse.data.score || 0);
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  };

  const submitCheckin = async (checkinData) => {
    try {
      const response = await healthService.submitHealthCheckin(checkinData);
      setHealthCheckins(prev => [response.data, ...prev]);
      // Refresh summary and score
      loadHealthSummary();
      loadWellnessScore();
      return response.data;
    } catch (err) {
      Alert.alert('Error', 'Failed to submit health check-in');
      throw err;
    }
  };

  const updateCheckin = async (checkinId, checkinData) => {
    try {
      const response = await healthService.updateHealthCheckin(checkinId, checkinData);
      setHealthCheckins(prev => 
        prev.map(checkin => checkin._id === checkinId ? response.data : checkin)
      );
      return response.data;
    } catch (err) {
      Alert.alert('Error', 'Failed to update health check-in');
      throw err;
    }
  };

  const deleteCheckin = async (checkinId) => {
    try {
      await healthService.deleteHealthCheckin(checkinId);
      setHealthCheckins(prev => prev.filter(checkin => checkin._id !== checkinId));
    } catch (err) {
      Alert.alert('Error', 'Failed to delete health check-in');
      throw err;
    }
  };

  const loadHealthSummary = async (timeframe = 'week') => {
    try {
      const response = await healthService.getHealthSummary(timeframe);
      setHealthSummary(response.data);
    } catch (err) {
      console.error('Failed to load health summary:', err);
    }
  };

  const loadWellnessScore = async (timeframe = 'week') => {
    try {
      const response = await healthService.getWellnessScore(timeframe);
      setWellnessScore(response.data.score || 0);
    } catch (err) {
      console.error('Failed to load wellness score:', err);
    }
  };

  const getTodaysCheckin = () => {
    const today = new Date().toDateString();
    return healthCheckins.find(checkin => 
      new Date(checkin.checkInDate).toDateString() === today
    );
  };

  const getRecentCheckins = (days = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return healthCheckins.filter(checkin => 
      new Date(checkin.checkInDate) >= cutoffDate
    );
  };

  const getHealthTrends = () => {
    const recentCheckins = getRecentCheckins(30).reverse(); // Oldest first
    
    if (recentCheckins.length < 2) return null;
    
    const trends = {
      mood: [],
      energy: [],
      pain: [],
      sleep: []
    };
    
    recentCheckins.forEach(checkin => {
      trends.mood.push({
        date: checkin.checkInDate,
        value: getMoodValue(checkin.mood)
      });
      trends.energy.push({
        date: checkin.checkInDate,
        value: checkin.energyLevel || 3
      });
      trends.pain.push({
        date: checkin.checkInDate,
        value: checkin.painLevel || 0
      });
      trends.sleep.push({
        date: checkin.checkInDate,
        value: checkin.sleepQuality || 3
      });
    });
    
    return trends;
  };

  const getMoodValue = (mood) => {
    const moodValues = {
      'very_sad': 1,
      'sad': 2,
      'neutral': 3,
      'happy': 4,
      'very_happy': 5
    };
    return moodValues[mood] || 3;
  };

  const getHealthInsights = () => {
    const recentCheckins = getRecentCheckins(7);
    if (recentCheckins.length === 0) return [];
    
    const insights = [];
    
    // Mood insight
    const avgMood = recentCheckins.reduce((sum, checkin) => 
      sum + getMoodValue(checkin.mood), 0) / recentCheckins.length;
    
    if (avgMood <= 2) {
      insights.push({
        type: 'mood',
        severity: 'high',
        message: 'Your mood has been low recently. Consider talking to someone or engaging in activities you enjoy.',
        icon: 'emoticon-sad'
      });
    } else if (avgMood >= 4) {
      insights.push({
        type: 'mood',
        severity: 'positive',
        message: 'Great job maintaining a positive mood!',
        icon: 'emoticon-happy'
      });
    }
    
    // Energy insight
    const avgEnergy = recentCheckins.reduce((sum, checkin) => 
      sum + (checkin.energyLevel || 3), 0) / recentCheckins.length;
    
    if (avgEnergy <= 2) {
      insights.push({
        type: 'energy',
        severity: 'medium',
        message: 'Your energy levels have been low. Make sure you\'re getting enough sleep and consider light exercise.',
        icon: 'battery-low'
      });
    }
    
    // Pain insight
    const avgPain = recentCheckins.reduce((sum, checkin) => 
      sum + (checkin.painLevel || 0), 0) / recentCheckins.length;
    
    if (avgPain >= 3) {
      insights.push({
        type: 'pain',
        severity: 'high',
        message: 'You\'ve been experiencing significant pain. Consider consulting with your healthcare provider.',
        icon: 'alert-circle'
      });
    }
    
    return insights;
  };

  useEffect(() => {
    loadHealthData();
  }, []);

  return {
    healthCheckins,
    healthSummary,
    wellnessScore,
    loading,
    error,
    loadHealthData,
    submitCheckin,
    updateCheckin,
    deleteCheckin,
    loadHealthSummary,
    loadWellnessScore,
    getTodaysCheckin,
    getRecentCheckins,
    getHealthTrends,
    getHealthInsights,
  };
};
