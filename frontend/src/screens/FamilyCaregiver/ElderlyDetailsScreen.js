import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  Chip,
  Surface,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { familyService } from '../../services/familyService';
import { useTheme } from '../../context/ThemeContext';
import { ThemedText } from '../../components/common/ThemedText';
import { UI_CONFIG } from '../../config/config';

const ElderlyDetailsScreen = ({ route, navigation }) => {
  const { elderlyId, elderlyName } = route.params;
  const [elderlyData, setElderlyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const loadElderlyData = async () => {
    try {
      const result = await familyService.getElderlyData(elderlyId);
      if (result.success) {
        setElderlyData(result.data);
      } else {
        Alert.alert('Error', 'Failed to load data. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadElderlyData();
  };

  useEffect(() => {
    loadElderlyData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText variant="bodyMedium">Loading...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Debug: log the full elderlyData object
  if (elderlyData) {
    console.log('[ElderlyDetailsScreen] elderlyData:', elderlyData);
  }
  if (!elderlyData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <ThemedText variant="bodyMedium" style={{ color: theme.colors.error, textAlign: 'center' }}>
            No data found.
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Extract elderly data from the nested structure
  const elderly = elderlyData.data?.elderly_data || {};

  return (
    <View style={styles.centeredContainer}>
      <ScrollView
        contentContainerStyle={styles.centeredScroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <Card.Title
            title={elderlyName || 'Elderly Details'}
            left={props => (
              <Avatar.Icon size={40} icon="account" color={theme.colors.primary} style={{ backgroundColor: theme.colors.surface }} />
            )}
            titleStyle={{ fontWeight: 'bold', fontSize: 22, color: theme.colors.primary }}
            style={{ marginBottom: 8 }}
          />
          <Card.Content>
            {/* Basic Info */}
            <Surface style={styles.sectionSurface}>
              <Paragraph style={styles.sectionTitle}>Basic Info</Paragraph>
              {elderly.basic_info ? (
                <View style={styles.infoRowGroup}>
                  <View style={styles.infoRow}><Text style={styles.label}>Name:</Text><Text style={styles.value}>{elderly.basic_info.first_name} {elderly.basic_info.last_name}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.label}>Date of Birth:</Text><Text style={styles.value}>{formatDate(elderly.basic_info.date_of_birth)}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.label}>Phone:</Text><Text style={styles.value}>{elderly.basic_info.phone_number || 'N/A'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.label}>Email:</Text><Text style={styles.value}>{elderly.basic_info.email || 'N/A'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.label}>Address:</Text><Text style={styles.value}>{elderly.basic_info.address || 'N/A'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.label}>User ID:</Text><Text style={styles.value}>{elderly.basic_info.id}</Text></View>
                </View>
              ) : <Paragraph>No basic info available.</Paragraph>}
            </Surface>

            {/* Health Data */}
            <Surface style={styles.sectionSurface}>
              <Paragraph style={styles.sectionTitle}>Recent Health Check-ins</Paragraph>
              {elderly.health_data && elderly.health_data.length > 0 ? (
                elderly.health_data.map((checkin, idx) => (
                  <View key={idx} style={styles.infoRow}>
                    <Text style={styles.label}>{formatDate(checkin.checkin_date)}:</Text>
                    <Text style={styles.value}>{checkin.status || 'N/A'}
                      {checkin.blood_pressure ? ` | BP: ${checkin.blood_pressure}` : ''}
                      {checkin.heart_rate ? ` | HR: ${checkin.heart_rate}` : ''}
                      {checkin.temperature ? ` | Temp: ${checkin.temperature}°C` : ''}
                      {checkin.notes ? ` | Notes: ${checkin.notes}` : ''}
                    </Text>
                  </View>
                ))
              ) : <Paragraph>No health data available.</Paragraph>}
            </Surface>

            {/* Medications */}
            <Surface style={styles.sectionSurface}>
              <Paragraph style={styles.sectionTitle}>Medications</Paragraph>
              {elderly.medications && elderly.medications.length > 0 ? (
                elderly.medications.map((med, idx) => (
                  <View key={idx} style={styles.infoRow}>
                    <Text style={styles.label}>{med.name}:</Text>
                    <Text style={styles.value}>{med.dosage} ({med.frequency})
                      {med.start_date ? ` | Start: ${formatDate(med.start_date)}` : ''}
                      {med.end_date ? ` | End: ${formatDate(med.end_date)}` : ''}
                      {med.instructions ? ` | Instructions: ${med.instructions}` : ''}
                    </Text>
                  </View>
                ))
              ) : <Paragraph>No medications listed.</Paragraph>}
            </Surface>

            {/* Emergency Contacts */}
            <Surface style={styles.sectionSurface}>
              <Paragraph style={styles.sectionTitle}>Emergency Contacts</Paragraph>
              {elderly.emergency_contacts && elderly.emergency_contacts.length > 0 ? (
                elderly.emergency_contacts.map((contact, idx) => (
                  <View key={idx} style={styles.infoRow}>
                    <Text style={styles.label}>{contact.name}:</Text>
                    <Text style={styles.value}>{contact.phone_number}
                      {contact.relationship ? ` | Relationship: ${contact.relationship}` : ''}
                      {contact.email ? ` | Email: ${contact.email}` : ''}
                    </Text>
                  </View>
                ))
              ) : <Paragraph>No emergency contacts listed.</Paragraph>}
            </Surface>

            {/* Brain Training */}
            <Surface style={styles.sectionSurface}>
              <Paragraph style={styles.sectionTitle}>Brain Training</Paragraph>
              {elderly.brain_training && elderly.brain_training.length > 0 ? (
                elderly.brain_training.map((session, idx) => (
                  <View key={idx} style={styles.infoRow}>
                    <Text style={styles.label}>{formatDate(session.date)}:</Text>
                    <Text style={styles.value}>{session.type} - Score: {session.score}
                      {session.duration ? ` | Duration: ${session.duration} min` : ''}
                      {session.notes ? ` | Notes: ${session.notes}` : ''}
                    </Text>
                  </View>
                ))
              ) : <Paragraph>No brain training data.</Paragraph>}
            </Surface>

            {/* Recent Alerts */}
            <Surface style={styles.sectionSurface}>
              <Paragraph style={styles.sectionTitle}>Recent Alerts</Paragraph>
              {elderly.recent_alerts && elderly.recent_alerts.length > 0 ? (
                elderly.recent_alerts.map((alert, idx) => (
                  <View key={idx} style={styles.infoRow}>
                    <Text style={styles.label}>{formatDate(alert.date)}:</Text>
                    <Text style={styles.value}>{alert.type} - {alert.message}
                      {alert.level ? ` | Level: ${alert.level}` : ''}
                      {alert.status ? ` | Status: ${alert.status}` : ''}
                    </Text>
                  </View>
                ))
              ) : <Paragraph>No recent alerts.</Paragraph>}
            </Surface>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

// Add modern styles for section surfaces, info rows, labels, and values
const createStyles = (theme) => StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  centeredScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    minWidth: '100%',
  },
  card: {
    borderRadius: 16,
    marginVertical: 12,
    padding: 8,
    backgroundColor: theme.colors.surface,
    elevation: 2,
    minWidth: 320,
    maxWidth: 480,
    width: '100%',
  },
  sectionSurface: {
    padding: 12,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    elevation: 1,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 6,
    color: theme.colors.primary,
  },
  infoRowGroup: {
    gap: 6,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  label: {
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginRight: 6,
    fontSize: 15,
  },
  value: {
    color: theme.colors.onSurface,
    fontSize: 15,
    flexShrink: 1,
  },
});

export default ElderlyDetailsScreen;
