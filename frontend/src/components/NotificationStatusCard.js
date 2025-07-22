import React from 'react';
import { View } from 'react-native';
import { Text, Chip, Surface } from 'react-native-paper';
import { useNotification } from '../context/NotificationContext';

const NotificationStatusCard = ({ style }) => {
  const { showNotificationInfo } = useNotification();
  const notificationInfo = showNotificationInfo();

  return (
    <Surface style={[{
      marginVertical: 12,
      borderRadius: 20,
      backgroundColor: '#fff',
      shadowColor: 'rgba(0,0,0,0.04)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
      padding: 16,
    }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Text variant="titleMedium" style={{ color: '#007bff', fontWeight: '600', fontSize: 18 }}>Notification Status</Text>
        <Chip
          mode="outlined"
          compact
          style={{ marginLeft: 10, borderRadius: 12, borderColor: '#007bff', backgroundColor: notificationInfo.localNotificationsAvailable ? '#007bff' : 'transparent' }}
          textStyle={{ fontSize: 13, color: notificationInfo.localNotificationsAvailable ? '#fff' : '#007bff', fontWeight: 'bold' }}
        >
          {notificationInfo.localNotificationsAvailable ? 'Active' : 'Inactive'}
        </Chip>
      </View>
      <Text variant="bodyMedium" style={{ color: '#000', fontSize: 15, marginBottom: 2 }}>
        {notificationInfo.message}
      </Text>
      {!notificationInfo.pushNotificationsAvailable && (
        <Text variant="bodySmall" style={{ color: '#007bff', marginTop: 6, fontSize: 13 }}>
          📱 Local notifications (medication reminders, health check-ins) will still work perfectly!
        </Text>
      )}
    </Surface>
  );
};

export default NotificationStatusCard;
