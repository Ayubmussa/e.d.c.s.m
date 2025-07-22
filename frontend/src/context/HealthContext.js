import React, { createContext, useContext, useReducer, useEffect } from 'react';
import healthService from '../services/healthService';
import { useAuth } from './AuthContext';
import { HEALTH_CONFIG } from '../config/config';

const HealthContext = createContext();

const initialState = {
  checkins: [],
  todayCheckin: null,
  healthTrends: null,
  healthSummary: null,
  loading: false,
  error: null,
  lastCheckinDate: null,
};

const healthReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload, error: null };
    case 'SET_CHECKINS':
      return { ...state, checkins: action.payload, loading: false };
    case 'SET_TODAY_CHECKIN':
      return { ...state, todayCheckin: action.payload, loading: false };
    case 'ADD_CHECKIN':
      return {
        ...state,
        checkins: [action.payload, ...(Array.isArray(state.checkins) ? state.checkins : [])],
        todayCheckin: action.payload,
        lastCheckinDate: action.payload.checkin_date,
        loading: false,
      };
    case 'UPDATE_CHECKIN':
      return {
        ...state,
        checkins: (Array.isArray(state.checkins) ? state.checkins : []).map(checkin =>
          checkin.id === action.payload.id ? action.payload : checkin
        ),
        todayCheckin: action.payload,
        loading: false,
      };
    case 'SET_HEALTH_TRENDS':
      return { ...state, healthTrends: action.payload, loading: false };
    case 'SET_HEALTH_SUMMARY':
      return { ...state, healthSummary: action.payload, loading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const HealthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(healthReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Track current date for daily reset
  const [currentDate, setCurrentDate] = React.useState(new Date().toISOString().split('T')[0]);

  // Helper to ensure todayCheckin is only for today
  const sanitizeTodayCheckin = (checkin) => {
    const today = new Date().toISOString().split('T')[0];
    if (!checkin || !checkin.checkin_date || String(checkin.checkin_date) !== today) {
      return null;
    }
    return checkin;
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadHealthCheckins();
      loadTodayCheckin();
      loadHealthSummary();
    }
  }, [isAuthenticated]);

  // Reset today's check-in when the date changes
  useEffect(() => {
    const interval = setInterval(() => {
      const today = new Date().toISOString().split('T')[0];
      if (today !== currentDate) {
        setCurrentDate(today);
        loadTodayCheckin();
      }
    }, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [currentDate, isAuthenticated]);

  const loadHealthCheckins = async (days = 30) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await healthService.getHealthCheckins({ days });
      
      if (response.success) {
        // Extract checkins array from response.data.checkins
        const checkins = Array.isArray(response.data?.checkins) ? response.data.checkins : [];
        dispatch({ type: 'SET_CHECKINS', payload: checkins });
      } else {
        // If no data or error, set empty array
        dispatch({ type: 'SET_CHECKINS', payload: [] });
        throw new Error(response.error || 'Failed to load health check-ins');
      }
    } catch (error) {
      // On error, ensure we have an empty array
      dispatch({ type: 'SET_CHECKINS', payload: [] });
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const loadTodayCheckin = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await healthService.getCheckinByDate(today);
      
      if (response.success && response.data?.checkin) {
        dispatch({ type: 'SET_TODAY_CHECKIN', payload: response.data.checkin });
      } else {
        dispatch({ type: 'SET_TODAY_CHECKIN', payload: null });
      }
    } catch (error) {
      // Not finding today's check-in is not an error
      dispatch({ type: 'SET_TODAY_CHECKIN', payload: null });
    }
  };

  const createHealthCheckin = async (checkinData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await healthService.createHealthCheckin(checkinData);
      
      if (response.success) {
        dispatch({ type: 'ADD_CHECKIN', payload: response.data.checkin });
        // Also refresh today's checkin to ensure consistency
        await loadTodayCheckin();
        return { success: true, data: response.data.checkin };
      } else {
        throw new Error(response.error || 'Failed to create health check-in');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const updateHealthCheckin = async (checkinId, updates) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await healthService.updateHealthCheckin(checkinId, updates);
      
      if (response.success) {
        dispatch({ type: 'UPDATE_CHECKIN', payload: response.data.checkin });
        return { success: true };
      } else {
        throw new Error(response.error || 'Failed to update health check-in');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const loadHealthTrends = async (period = '30days') => {
    try {
      const response = await healthService.getHealthTrends({ period });
      
      if (response.success) {
        dispatch({ type: 'SET_HEALTH_TRENDS', payload: response.data });
      } else {
        throw new Error(response.error || 'Failed to load health trends');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const loadHealthSummary = async () => {
    try {
      const response = await healthService.getHealthSummary();
      
      if (response.success) {
        dispatch({ type: 'SET_HEALTH_SUMMARY', payload: response.data });
      } else {
        throw new Error(response.error || 'Failed to load health summary');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const getHealthInsights = () => {
    // Ensure checkins is always an array before using it
    const checkins = Array.isArray(state.checkins) ? state.checkins : [];
    
    if (checkins.length === 0) {
      return null;
    }

    const recentCheckins = checkins.slice(0, 7); // Last 7 check-ins
    
    // Calculate averages
    const avgMood = recentCheckins.reduce((sum, c) => sum + c.mood_rating, 0) / recentCheckins.length;
    const avgEnergy = recentCheckins.reduce((sum, c) => sum + c.energy_level, 0) / recentCheckins.length;
    const avgPain = recentCheckins.reduce((sum, c) => sum + c.pain_level, 0) / recentCheckins.length;
    const avgSleep = recentCheckins.reduce((sum, c) => sum + c.sleep_quality, 0) / recentCheckins.length;

    // Generate insights
    const insights = [];
    
    if (avgMood < 3) {
      insights.push({
        type: 'warning',
        title: 'Mood Alert',
        message: 'Your mood has been below average recently. Consider talking to someone.',
        icon: 'emoticon-sad',
      });
    }
    
    if (avgEnergy < 2.5) {
      insights.push({
        type: 'info',
        title: 'Energy Levels',
        message: 'Your energy levels seem low. Make sure you\'re getting enough rest.',
        icon: 'battery-low',
      });
    }
    
    if (avgPain > 5) {
      insights.push({
        type: 'warning',
        title: 'Pain Management',
        message: 'You\'ve reported higher pain levels. Consider consulting your doctor.',
        icon: 'alert-circle',
      });
    }
    
    if (avgSleep < 3) {
      insights.push({
        type: 'info',
        title: 'Sleep Quality',
        message: 'Your sleep quality could be improved. Try establishing a bedtime routine.',
        icon: 'sleep',
      });
    }

    return {
      averages: {
        mood: avgMood.toFixed(1),
        energy: avgEnergy.toFixed(1),
        pain: avgPain.toFixed(1),
        sleep: avgSleep.toFixed(1),
      },
      insights,
      totalCheckins: Array.isArray(state.checkins) ? state.checkins.length : 0,
      streakDays: calculateStreakDays(),
    };
  };

  const calculateStreakDays = () => {
    const checkins = Array.isArray(state.checkins) ? state.checkins : [];
    if (checkins.length === 0) return 0;
    
    let streak = 0;
    const today = new Date().toDateString();
    const checkinDates = checkins.map(c => new Date(c.checkin_date).toDateString());
    
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toDateString();
      
      if (checkinDates.includes(dateString)) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const needsCheckinReminder = () => {
    const todayCheckin = sanitizeTodayCheckin(state.todayCheckin);
    return !todayCheckin;
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Returns wellness status based only on today's check-in
  const getTodayWellnessStatus = () => {
    const checkin = sanitizeTodayCheckin(state.todayCheckin);
    if (!checkin) {
      return {
        status: 'unknown',
        message: 'Complete your health check-in for today to see your wellness status.',
        color: '#1976D2',
        icon: 'help-circle-outline',
      };
    }
    // Defensive: if checkin is for today, but fields are missing, treat as incomplete
    if (
      typeof checkin.mood_rating !== 'number' ||
      typeof checkin.energy_level !== 'number' ||
      typeof checkin.pain_level !== 'number' ||
      typeof checkin.sleep_quality !== 'number'
    ) {
      return {
        status: 'unknown',
        message: 'Complete your health check-in for today to see your wellness status.',
        color: '#1976D2',
        icon: 'help-circle-outline',
      };
    }
    const mood = checkin.mood_rating;
    const energy = checkin.energy_level;
    return {
      status: mood >= 4 && energy >= 4 ? 'excellent'
        : mood >= 3 && energy >= 3 ? 'good'
        : 'needs_attention',
      message: mood >= 4 && energy >= 4
        ? 'You\'re doing great! Keep up the good work.'
        : mood >= 3 && energy >= 3
          ? 'You\'re feeling well overall.'
          : 'Consider talking to your healthcare provider.',
      color: '#1976D2',
      icon: mood >= 4 && energy >= 4
        ? 'emoticon-happy'
        : mood >= 3 && energy >= 3
          ? 'emoticon'
          : 'emoticon-sad',
      mood,
      energy,
      pain: checkin.pain_level,
      sleep: checkin.sleep_quality,
    };
  };

  const value = {
    ...state,
    loadHealthCheckins,
    loadTodayCheckin,
    createHealthCheckin,
    updateHealthCheckin,
    loadHealthTrends,
    loadHealthSummary,
    getHealthInsights,
    getTodayWellnessStatus,
    needsCheckinReminder,
    clearError,
  };

  return (
    <HealthContext.Provider value={value}>
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return context;
};

export { HealthContext };
