import { makeApiCall } from './apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const familyService = {
  // Invite a family member to connect
  inviteFamilyMember: async (emailOrPhone, relationship, accessLevel = 'view', message = '') => {
    try {
      const response = await makeApiCall('/api/family/invite', 'POST', {
        emailOrPhone,
        relationship,
        accessLevel,
        message,
        // Backward compatibility: convert accessLevel to permissions for now
        permissions: {
          viewHealth: accessLevel === 'manage' || accessLevel === 'full',
          viewMedications: accessLevel === 'manage' || accessLevel === 'full',
          viewEmergency: true, // Always allow emergency access
          viewLocation: accessLevel === 'manage' || accessLevel === 'full',
          manageSettings: accessLevel === 'full',
        }
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('Error inviting family member:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all family members and their relationships
  getFamilyMembers: async () => {
    try {
      const response = await makeApiCall('/api/family/members', 'GET');
      return { success: true, data: response };
    } catch (error) {
      console.error('Error fetching family members:', error);
      return { success: false, error: error.message };
    }
  },

  // Get only pending invitations
  getPendingInvites: async () => {
    try {
      const response = await makeApiCall('/api/family/pending-invites', 'GET');
      return { success: true, data: response };
    } catch (error) {
      console.error('Error fetching pending invites:', error);
      return { success: false, error: error.message };
    }
  },

  // Update relationship status (accept/decline invite)
  updateRelationshipStatus: async (relationshipId, status) => {
    try {
      const response = await makeApiCall(`/api/family/relationships/${relationshipId}/status`, 'PUT', {
        status
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('Error updating relationship status:', error);
      return { success: false, error: error.message };
    }
  },

  // Remove a family relationship
  removeRelationship: async (relationshipId) => {
    try {
      const response = await makeApiCall(`/api/family/relationships/${relationshipId}`, 'DELETE');
      return { success: true, data: response };
    } catch (error) {
      console.error('Error removing relationship:', error);
      return { success: false, error: error.message };
    }
  },

  // Get permissions for a specific relationship
  getPermissions: async (relationshipId) => {
    try {
      const response = await makeApiCall(`/api/family/relationships/${relationshipId}/permissions`, 'GET');
      return { success: true, data: response };
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return { success: false, error: error.message };
    }
  },

  // Update permissions for a family relationship
  updatePermissions: async (relationshipId, permissions) => {
    try {
      const response = await makeApiCall(`/api/family/relationships/${relationshipId}/permissions`, 'PUT', {
        permissions
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('Error updating permissions:', error);
      return { success: false, error: error.message };
    }
  },

  // Get elderly member's data (for caregivers)
  getElderlyData: async (elderlyId) => {
    try {
      const response = await makeApiCall(`/api/family/elderly/${elderlyId}/data`, 'GET');
      return { success: true, data: response };
    } catch (error) {
      console.error('Error fetching elderly data:', error);
      return { success: false, error: error.message };
    }
  },

  // Get caregiver dashboard data
  getCaregiverDashboard: async () => {
    try {
      const response = await makeApiCall('/api/family/dashboard', 'GET');
      return { success: true, data: response };
    } catch (error) {
      console.error('Error fetching caregiver dashboard:', error);
      return { success: false, error: error.message };
    }
  },

  // Accept family invite (for when user clicks on invite link/notification)
  acceptInvite: async (inviteId) => {
    try {
      const response = await makeApiCall('/api/family/accept-invite', 'POST', {
        inviteId
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('Error accepting invite:', error);
      return { success: false, error: error.message };
    }
  }
};
