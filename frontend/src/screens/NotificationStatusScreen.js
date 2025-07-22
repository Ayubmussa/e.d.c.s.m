import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  List,
  Surface,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import notificationHandler from '../../utils/notificationHandler';
import { 
  testNotificationCapabilities,
  testLocalNotification,
  testFamilyInvitation,
  testEmergencyAlert,
  testMedicationReminder,
  runFullNotificationTest
} from '../../utils/testNotifications';
import Constants from 'expo-constants';

const NotificationStatusScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { settings, showNotificationInfo } = useNotification();
  const styles = createStyles(theme);
  
  const [capabilities, setCapabilities] = useState(null);
  const [notificationInfo, setNotificationInfo] = useState(null);
  
  const isExpoGo = Constants.appOwnership === 'expo';

  useEffect(() => {
    loadNotificationStatus();
  }, []);

  const loadNotificationStatus = () => {
    const caps = notificationHandler.getCapabilities();
    const info = showNotificationInfo();
    
    setCapabilities(caps);
    setNotificationInfo(info);
  };

  const getStatusIcon = (enabled) => {
    return enabled ? 'check-circle' : 'alert-circle';
  };

  const getStatusColor = (enabled) => {
    return enabled ? theme.colors.success || '#4CAF50' : theme.colors.warning || '#FF9800';
  };

  const testFunctions = [
    {
      title: 'Test Capabilities',
      description: 'Check what notification features are available',
      icon: 'information',
      onPress: testNotificationCapabilities,
    },
    {
      title: 'Test Local Notification',
      description: 'Send a test notification',
      icon: 'bell',
      onPress: testLocalNotification,
    },
    {
      title: 'Test Family Invitation',
      description: 'Simulate a family invitation notification',
      icon: 'account-plus',
      onPress: testFamilyInvitation,
    },
    {
      title: 'Test Emergency Alert',
      description: 'Simulate an emergency alert',
      icon: 'alert',
      onPress: testEmergencyAlert,
    },
    {
      title: 'Test Medication Reminder',
      description: 'Simulate a medication reminder',
      icon: 'pill',
      onPress: testMedicationReminder,
    },
    {
      title: 'Run Full Test Suite',
      description: 'Test all notification types in sequence',
      icon: 'play-circle',
      onPress: runFullNotificationTest,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Environment Status */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <MaterialCommunityIcons 
              name="cellphone-settings" 
              size={32} 
              color={theme.colors.primary} 
            />
            <Title style={styles.headerTitle}>Notification Status</Title>
          </View>
          
          <View style={styles.statusRow}>
            <MaterialCommunityIcons 
              name={isExpoGo ? 'react' : 'cellphone'} 
              size={20} 
              color={theme.colors.text.primary} 
            />
            <Text style={styles.statusText}>Environment: {isExpoGo ? 'Expo Go (Development)' : 'Production Build'}</Text>
          </View>
          
          {isExpoGo && (
            <Surface style={styles.warningBox}>
              <View style={styles.warningContent}>
                <MaterialCommunityIcons 
                  name="alert-circle" 
                  size={20} 
                  color={theme.colors.warning || '#FF9800'} 
                />
                <Text style={styles.warningText}>
                  Push notifications are not supported in Expo Go (SDK 53+). 
                  The app uses in-app alerts instead. For full push notification support, 
                  use a development build.
                </Text>
              </View>
            </Surface>
          )}
        </Card.Content>
      </Card>

      {/* Capabilities Overview */}
      {capabilities && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Notification Capabilities</Title>
            
            <List.Item
              title="Push Notifications"
              description={capabilities.pushNotifications ? "Enabled and working" : "Not available in Expo Go"}
              left={() => (
                <MaterialCommunityIcons 
                  name={getStatusIcon(capabilities.pushNotifications)} 
                  size={24} 
                  color={getStatusColor(capabilities.pushNotifications)} 
                />
              )}
              right={() => (
                <Chip 
                  mode={capabilities.pushNotifications ? "flat" : "outlined"}
                  textStyle={{ fontSize: 12 }}
                >
                  {capabilities.pushNotifications ? 'Available' : 'Unavailable'}
                </Chip>
              )}
            />
            
            <List.Item
              title="Local Notifications"
              description={capabilities.localNotifications ? "Scheduled notifications work" : "Limited support"}
              left={() => (
                <MaterialCommunityIcons 
                  name={getStatusIcon(capabilities.localNotifications)} 
                  size={24} 
                  color={getStatusColor(capabilities.localNotifications)} 
                />
              )}
              right={() => (
                <Chip 
                  mode={capabilities.localNotifications ? "flat" : "outlined"}
                  textStyle={{ fontSize: 12 }}
                >
                  {capabilities.localNotifications ? 'Available' : 'Limited'}
                </Chip>
              )}
            />
            
            <List.Item
              title="In-App Alerts"
              description="Alert dialogs shown within the app"
              left={() => (
                <MaterialCommunityIcons 
                  name={getStatusIcon(capabilities.inAppAlerts)} 
                  size={24} 
                  color={getStatusColor(capabilities.inAppAlerts)} 
                />
              )}
              right={() => (
                <Chip mode="flat" textStyle={{ fontSize: 12 }}>
                  Available
                </Chip>
              )}
            />

            {capabilities.deviceToken && (
              <View style={styles.tokenContainer}>
                <Text style={styles.tokenLabel}>Device Token:</Text>
                <Text style={styles.tokenText} numberOfLines={3}>
                  {capabilities.deviceToken}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Current Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Notification Settings</Title>
          
          <List.Item
            title="Medication Reminders"
            left={() => (
              <MaterialCommunityIcons 
                name={getStatusIcon(settings.medicationReminders)} 
                size={24} 
                color={getStatusColor(settings.medicationReminders)} 
              />
            )}
            right={() => (
              <Chip mode={settings.medicationReminders ? "flat" : "outlined"}>
                {settings.medicationReminders ? 'Enabled' : 'Disabled'}
              </Chip>
            )}
          />
          
          <List.Item
            title="Health Check-ins"
            left={() => (
              <MaterialCommunityIcons 
                name={getStatusIcon(settings.healthCheckins)} 
                size={24} 
                color={getStatusColor(settings.healthCheckins)} 
              />
            )}
            right={() => (
              <Chip mode={settings.healthCheckins ? "flat" : "outlined"}>
                {settings.healthCheckins ? 'Enabled' : 'Disabled'}
              </Chip>
            )}
          />
          
          <List.Item
            title="Emergency Alerts"
            left={() => (
              <MaterialCommunityIcons 
                name={getStatusIcon(settings.emergencyAlerts)} 
                size={24} 
                color={getStatusColor(settings.emergencyAlerts)} 
              />
            )}
            right={() => (
              <Chip mode={settings.emergencyAlerts ? "flat" : "outlined"}>
                {settings.emergencyAlerts ? 'Enabled' : 'Disabled'}
              </Chip>
            )}
          />

          <List.Item
            title="Brain Training Reminders"
            left={() => (
              <MaterialCommunityIcons 
                name={getStatusIcon(settings.brainTrainingReminders)} 
                size={24} 
                color={getStatusColor(settings.brainTrainingReminders)} 
              />
            )}
            right={() => (
              <Chip mode={settings.brainTrainingReminders ? "flat" : "outlined"}>
                {settings.brainTrainingReminders ? 'Enabled' : 'Disabled'}
              </Chip>
            )}
          />

          {settings.quietHours?.enabled && (
            <List.Item
              title="Quiet Hours"
              description={`${settings.quietHours.startTime} - ${settings.quietHours.endTime}`}
              left={() => (
                <MaterialCommunityIcons 
                  name="sleep" 
                  size={24} 
                  color={theme.colors.primary} 
                />
              )}
            />
          )}
        </Card.Content>
      </Card>

      {/* Testing Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Notification Testing</Title>
          <Paragraph style={styles.testDescription}>
            Use these tests to verify how notifications work in your current environment:
          </Paragraph>
          
          {testFunctions.map((test, index) => (
            <List.Item
              key={index}
              title={test.title}
              description={test.description}
              left={() => (
                <MaterialCommunityIcons 
                  name={test.icon} 
                  size={24} 
                  color={theme.colors.primary} 
                />
              )}
              right={() => (
                <Button 
                  mode="outlined" 
                  compact 
                  onPress={test.onPress}
                >
                  Test
                </Button>
              )}
              style={styles.testItem}
            />
          ))}
        </Card.Content>
      </Card>

      {/* Help & Information */}
      <Card style={[styles.card, { marginBottom: 24 }]}>
        <Card.Content>
          <Title>Help & Information</Title>
          
          <Paragraph style={styles.helpText}>
            <Text style={styles.boldText}>Expo Go Limitations:</Text>{'\n'}
            • Push notifications don't work in Expo Go (SDK 53+){'\n'}
            • Local notifications have limited support{'\n'}
            • In-app alerts are used as fallback{'\n\n'}
            
            <Text style={styles.boldText}>Production Build:</Text>{'\n'}
            • Full push notification support{'\n'}
            • All notification types work properly{'\n'}
            • Background notifications supported{'\n\n'}
            
            <Text style={styles.boldText}>Family Invitations:</Text>{'\n'}
            • Shown as in-app alerts in Expo Go{'\n'}
            • Push notifications in production{'\n'}
            • Check Family tab for pending invitations
          </Paragraph>
          
          <Button
            mode="contained"
            onPress={() => {
              if (!navigation || typeof navigation.navigate !== 'function') {
                Alert.alert('Navigation Error', 'Navigation is not available.');
                return;
              }
              navigation.navigate('Settings');
            }}
            style={styles.settingsButton}
            icon="cog"
          >
            Go to Notification Settings
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  card: {
    borderRadius: theme.roundness,
    margin: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    elevation: 3,
    backgroundColor: theme.colors.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    marginLeft: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  warningBox: {
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.warning || '#FF9800',
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningText: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  tokenContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  tokenText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: 'monospace',
  },
  testDescription: {
    marginBottom: 12,
    color: theme.colors.text.secondary,
  },
  testItem: {
    marginBottom: 4,
  },
  helpText: {
    lineHeight: 22,
    color: theme.colors.text.secondary,
  },
  boldText: {
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  settingsButton: {
    marginTop: 16,
  },
});

export default NotificationStatusScreen;
