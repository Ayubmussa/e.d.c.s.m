import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import medicationService from '../services/medicationService';

export const useMedications = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadMedications = async () => {
    try {
      setError(null);
      const response = await medicationService.getMedications();
      setMedications(response.data);
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', 'Failed to load medications');
    } finally {
      setLoading(false);
    }
  };

  const refreshMedications = async () => {
    setRefreshing(true);
    await loadMedications();
    setRefreshing(false);
  };

  const addMedication = async (medicationData) => {
    try {
      const response = await medicationService.addMedication(medicationData);
      setMedications(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      Alert.alert('Error', 'Failed to add medication');
      throw err;
    }
  };

  const updateMedication = async (medicationId, medicationData) => {
    try {
      const response = await medicationService.updateMedication(medicationId, medicationData);
      setMedications(prev => 
        prev.map(med => med._id === medicationId ? response.data : med)
      );
      return response.data;
    } catch (err) {
      Alert.alert('Error', 'Failed to update medication');
      throw err;
    }
  };

  const deleteMedication = async (medicationId) => {
    try {
      await medicationService.deleteMedication(medicationId);
      setMedications(prev => prev.filter(med => med._id !== medicationId));
    } catch (err) {
      Alert.alert('Error', 'Failed to delete medication');
      throw err;
    }
  };

  const markTaken = async (medicationId, takenData = {}) => {
    try {
      const response = await medicationService.markMedicationTaken(medicationId, takenData);
      // Update local state to reflect the medication was taken
      setMedications(prev => 
        prev.map(med => {
          if (med._id === medicationId) {
            return {
              ...med,
              lastTaken: new Date().toISOString(),
              takenHistory: [...(med.takenHistory || []), response.data]
            };
          }
          return med;
        })
      );
      return response.data;
    } catch (err) {
      Alert.alert('Error', 'Failed to mark medication as taken');
      throw err;
    }
  };

  const getTodaysMedications = () => {
    const today = new Date().toDateString();
    return (medications || []).filter(med => {
      if (!med.schedule) return false;
      
      // Check if medication should be taken today
      const startDate = new Date(med.startDate).toDateString();
      const endDate = med.endDate ? new Date(med.endDate).toDateString() : null;
      
      if (today < startDate || (endDate && today > endDate)) {
        return false;
      }
      
      return true;
    });
  };

  const getUpcomingMedications = () => {
    const now = new Date();
    const todaysMeds = getTodaysMedications();
    
    return todaysMeds.filter(med => {
      if (!med.schedule?.times) return false;
      
      return med.schedule.times.some(timeStr => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const scheduleTime = new Date();
        scheduleTime.setHours(hours, minutes, 0, 0);
        return scheduleTime > now;
      });
    });
  };

  const getMissedMedications = () => {
    const now = new Date();
    const todaysMeds = getTodaysMedications();
    
    return todaysMeds.filter(med => {
      if (!med.schedule?.times) return false;
      
      return med.schedule.times.some(timeStr => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const scheduleTime = new Date();
        scheduleTime.setHours(hours, minutes, 0, 0);
        
        // Check if this time has passed and medication wasn't taken
        if (scheduleTime < now) {
          const lastTaken = med.lastTaken ? new Date(med.lastTaken) : null;
          if (!lastTaken || lastTaken.toDateString() !== now.toDateString()) {
            return true;
          }
        }
        return false;
      });
    });
  };

  useEffect(() => {
    loadMedications();
  }, []);

  return {
    medications,
    loading,
    error,
    refreshing,
    loadMedications,
    refreshMedications,
    addMedication,
    updateMedication,
    deleteMedication,
    markTaken,
    getTodaysMedications,
    getUpcomingMedications,
    getMissedMedications,
  };
};
