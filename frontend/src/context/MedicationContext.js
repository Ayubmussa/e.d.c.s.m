import React, { createContext, useContext, useReducer, useEffect } from 'react';
import medicationService from '../services/medicationService';
import { useAuth } from './AuthContext';
import * as Notifications from 'expo-notifications';

const MedicationContext = createContext();

const initialState = {
  medications: [],
  medicationLogs: [],
  loading: false,
  error: null,
  upcomingReminders: [],
};

const medicationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload, error: null };
    case 'SET_MEDICATIONS':
      return { ...state, medications: action.payload, loading: false };
    case 'ADD_MEDICATION':
      return {
        ...state,
        medications: [...(state.medications || []), action.payload],
        loading: false,
      };
    case 'UPDATE_MEDICATION':
      return {
        ...state,
        medications: (state.medications || []).map(med =>
          med.id === action.payload.id ? action.payload : med
        ),
        loading: false,
      };
    case 'DELETE_MEDICATION':
      return {
        ...state,
        medications: (state.medications || []).filter(med => med.id !== action.payload),
        loading: false,
      };
    case 'SET_MEDICATION_LOGS':
      return { ...state, medicationLogs: action.payload, loading: false };
    case 'ADD_MEDICATION_LOG':
      return {
        ...state,
        medicationLogs: [action.payload, ...(state.medicationLogs || [])],
        loading: false,
      };
    case 'SET_UPCOMING_REMINDERS':
      return { ...state, upcomingReminders: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const MedicationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(medicationReducer, initialState);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadMedications();
      loadMedicationLogs();
    }
  }, [isAuthenticated]);

  const loadMedications = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await medicationService.getMedications();
      
      if (response.success) {
        // Extract medications array from response data
        const medicationsArray = response.data.medications || [];
        dispatch({ type: 'SET_MEDICATIONS', payload: medicationsArray });
        updateUpcomingReminders(medicationsArray);
      } else {
        throw new Error(response.error || 'Failed to load medications');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const scheduleMedicationLocalNotification = async (medication) => {
    if (!medication.times || medication.times.length === 0) return;
    for (const time of medication.times) {
      const [hours, minutes] = time.split(':').map(Number);
      const now = new Date();
      const trigger = new Date(now);
      trigger.setHours(hours, minutes, 0, 0);
      if (trigger <= now) {
        trigger.setDate(trigger.getDate() + 1); // Schedule for tomorrow if time has passed
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 Medication Reminder',
          body: `Time to take ${medication.name} (${medication.dosage})`,
          data: { medicationId: medication.id },
        },
        trigger,
      });
    }
  };

  const addMedication = async (medicationData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await medicationService.addMedication(medicationData);
      
      if (response.success) {
        dispatch({ type: 'ADD_MEDICATION', payload: response.data.medication });
        updateUpcomingReminders([...state.medications, response.data.medication]);
        await scheduleMedicationLocalNotification(response.data.medication);
        return { success: true };
      } else {
        throw new Error(response.error || 'Failed to add medication');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const updateMedication = async (medicationId, updates) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await medicationService.updateMedication(medicationId, updates);
      
      if (response.success) {
        dispatch({ type: 'UPDATE_MEDICATION', payload: response.data.medication });
        const updatedMedications = state.medications.map(med =>
          med.id === medicationId ? response.data.medication : med
        );
        updateUpcomingReminders(updatedMedications);
        await scheduleMedicationLocalNotification(response.data.medication);
        return { success: true };
      } else {
        throw new Error(response.error || 'Failed to update medication');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const deleteMedication = async (medicationId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await medicationService.deleteMedication(medicationId);
      
      if (response.success) {
        dispatch({ type: 'DELETE_MEDICATION', payload: medicationId });
        const updatedMedications = (state.medications || []).filter(med => med.id !== medicationId);
        updateUpcomingReminders(updatedMedications);
        return { success: true };
      } else {
        throw new Error(response.error || 'Failed to delete medication');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const markMedicationTaken = async (medicationId, logData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await medicationService.markMedicationTaken(medicationId, logData);
      
      if (response.success) {
        dispatch({ type: 'ADD_MEDICATION_LOG', payload: response.data.log });
        return { success: true };
      } else {
        throw new Error(response.error || 'Failed to log medication');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const loadMedicationLogs = async (limit = 50) => {
    try {
      const response = await medicationService.getMedicationHistory({ limit });
      
      if (response.success) {
        // Extract logs array from response data
        const logsArray = response.data.logs || [];
        dispatch({ type: 'SET_MEDICATION_LOGS', payload: logsArray });
      } else {
        throw new Error(response.error || 'Failed to load medication logs');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const updateUpcomingReminders = (medications) => {
    const now = new Date();
    const upcoming = [];

    medications.forEach(medication => {
      if (medication.times && medication.times.length > 0) {
        medication.times.forEach(time => {
          const [hours, minutes] = time.split(':');
          const reminderTime = new Date();
          reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          // If the time has passed today, set for tomorrow
          if (reminderTime <= now) {
            reminderTime.setDate(reminderTime.getDate() + 1);
          }
          
          upcoming.push({
            medicationId: medication.id,
            medicationName: medication.name,
            dosage: medication.dosage,
            time: reminderTime,
            instructions: medication.notes,
          });
        });
      }
    });

    // Sort by time
    upcoming.sort((a, b) => a.time - b.time);
    
    dispatch({ type: 'SET_UPCOMING_REMINDERS', payload: upcoming.slice(0, 5) });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    loadMedications,
    addMedication,
    updateMedication,
    deleteMedication,
    markMedicationTaken,
    loadMedicationLogs,
    clearError,
  };

  return (
    <MedicationContext.Provider value={value}>
      {children}
    </MedicationContext.Provider>
  );
};

export const useMedication = () => {
  const context = useContext(MedicationContext);
  if (!context) {
    throw new Error('useMedication must be used within a MedicationProvider');
  }
  return context;
};

export { MedicationContext };
