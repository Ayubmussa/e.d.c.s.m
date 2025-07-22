import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Badge } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { familyService } from '../services/familyService';

// Custom hook to get pending invites count
export const usePendingInvites = () => {
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  
  const fetchPendingInvites = async () => {
    try {
      const result = await familyService.getPendingInvites();
      if (result.success && result.data.pending_invites) {
        setPendingInvitesCount(result.data.pending_invites.length);
      }
    } catch (error) {
      console.error('Error fetching pending invites:', error);
    }
  };
  
  useEffect(() => {
    fetchPendingInvites();
    
    // Set up interval to periodically check for pending invites
    const intervalId = setInterval(fetchPendingInvites, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, []);
  
  return pendingInvitesCount;
};

// TabBarIcon component that shows badge if there are pending invites
export const TabBarIconWithBadge = ({ name, focused, color, pendingInvitesCount }) => {
  return (
    <View>
      <MaterialCommunityIcons name={name} size={24} color={'#007bff'} />
      {pendingInvitesCount > 0 && (
        <Badge
          style={{
            position: 'absolute',
            top: -8,
            right: -10,
            backgroundColor: '#007bff',
            color: '#fff',
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#fff',
            paddingHorizontal: 2,
            fontWeight: 'bold',
            fontSize: 12,
            elevation: 2,
          }}
          size={16}
        >
          {pendingInvitesCount}
        </Badge>
      )}
    </View>
  );
};
