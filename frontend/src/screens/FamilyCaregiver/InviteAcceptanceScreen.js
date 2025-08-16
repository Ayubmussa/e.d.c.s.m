import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Image
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Surface,
  Chip,
  Avatar,
  HelperText,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { familyService } from '../../services/familyService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemedText } from '../../components/common/ThemedText';
import apiService from '../../services/apiService';

// Unified InviteAcceptanceScreen for FamilyCaregiver
const InviteAcceptanceScreen = ({ navigation, route }) => {
  const { user } = useAuth?.() || {};
  const { theme } = useTheme?.() || {};
  const styles = createStyles(theme);
  const { inviteId, inviteData, invitationId, invitationData } = route?.params || {};

  // Accept both param names for compatibility
  const id = inviteId || invitationId;
  const initialData = inviteData || invitationData;

  const [loading, setLoading] = useState(!initialData);
  const [invite, setInvite] = useState(initialData || null);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [isTestInvitation, setIsTestInvitation] = useState(false);

  useEffect(() => {
    if (!invite && id) {
      loadInviteDetails();
    }
    if (initialData) {
      setInvite(initialData);
      if (initialData.isTest) setIsTestInvitation(true);
    }
  }, [id, initialData]);

  const loadInviteDetails = async () => {
    try {
      setLoading(true);
      // Try both endpoints for compatibility
      let result = await familyService.getFamilyMembers?.();
      let foundInvite = null;
      if (result?.success) {
        const { pendingInvites = [] } = result.data;
        foundInvite = pendingInvites.find(inv => inv.id === id || inv.relationshipId === id);
      }
      if (!foundInvite && apiService) {
        const response = await apiService.get?.('/api/family/pending-invites');
        if (response?.success && response.data) {
          foundInvite = response.data.pending_invites.find(
            invite => invite.id === id || invite.relationshipId === id
          );
        }
      }
      if (foundInvite) {
        setInvite(foundInvite);
      } else {
        throw new Error('Invitation not found or may have expired');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load invitation details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setAccepting(true);
    try {
      // Use the correct service for accepting
      let result = null;
      if (familyService.updateRelationshipStatus) {
        result = await familyService.updateRelationshipStatus(invite.id || invite.relationshipId, 'accepted');
      } else if (apiService) {
        result = await apiService.post?.('/api/family/accept-invite', { id: invite.id || invite.relationshipId });
      }
      if (result?.success) {
        Alert.alert('Success', 'Invitation accepted successfully');
        navigation.goBack();
      } else {
        Alert.alert('Error', result?.error || 'Failed to accept invitation');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    setDeclining(true);
    try {
      let result = null;
      if (familyService.updateRelationshipStatus) {
        result = await familyService.updateRelationshipStatus(invite.id || invite.relationshipId, 'declined');
      } else if (apiService) {
        result = await apiService.post?.('/api/family/decline-invite', { id: invite.id || invite.relationshipId });
      }
      if (result?.success) {
        Alert.alert('Declined', 'Invitation declined');
        navigation.goBack();
      } else {
        Alert.alert('Error', result?.error || 'Failed to decline invitation');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to decline invitation');
    } finally {
      setDeclining(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1, marginTop: 40 }} size="large" color={theme?.colors?.primary || '#007AFF'} />;
  }

  if (!invite) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme?.colors?.background || '#fff' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <ThemedText variant="bodyMedium" style={{ color: theme?.colors?.error || 'red', textAlign: 'center' }}>
            Invitation not found or expired.
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme?.colors?.background || '#fff' }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Card.Title
            title="Invitation Details"
            left={props => (
              <Avatar.Icon size={40} icon="email" color={theme?.colors?.primary || '#007AFF'} style={{ backgroundColor: theme?.colors?.surface || '#fff' }} />
            )}
            titleStyle={{ fontWeight: 'bold', fontSize: 22, color: theme?.colors?.primary || '#007AFF' }}
            style={{ marginBottom: 8 }}
          />
          <Card.Content>
            <Surface style={styles.sectionSurface}>
              <Paragraph style={styles.sectionTitle}>From</Paragraph>
              <View style={styles.infoRow}><Text style={styles.label}>Name:</Text><Text style={styles.value}>{invite.inviterName || invite.inviterEmail || invite.fromName || invite.senderName || 'Unknown'}</Text></View>
            </Surface>
            <Surface style={styles.sectionSurface}>
              <Paragraph style={styles.sectionTitle}>Relationship</Paragraph>
              <View style={styles.infoRow}><Text style={styles.label}>Type:</Text><Text style={styles.value}>{invite.relationship || invite.role || 'N/A'}</Text></View>
            </Surface>
            <Surface style={styles.sectionSurface}>
              <Paragraph style={styles.sectionTitle}>Status</Paragraph>
              <View style={styles.infoRow}><Text style={styles.label}>Current:</Text><Text style={styles.value}>{invite.status || 'pending'}</Text></View>
            </Surface>
            {invite.message ? (
              <Surface style={styles.sectionSurface}>
                <Paragraph style={styles.sectionTitle}>Message</Paragraph>
                <View style={styles.infoRow}><Text style={styles.value}>{invite.message}</Text></View>
              </Surface>
            ) : null}
            {isTestInvitation && <HelperText type="info">This is a test invitation</HelperText>}
          </Card.Content>
          <Card.Actions style={{ justifyContent: 'flex-end' }}>
            <Button mode="contained" onPress={handleAccept} loading={accepting} disabled={accepting || declining} style={styles.button}>
              Accept
            </Button>
            <Button mode="outlined" onPress={handleDecline} loading={declining} disabled={accepting || declining} style={styles.button}>
              Decline
            </Button>
          </Card.Actions>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

// Add modern styles for section surfaces, info rows, labels, and values
const createStyles = (theme) => StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: theme?.colors?.background || '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    marginVertical: 12,
    padding: 8,
    backgroundColor: theme?.colors?.surface || '#fff',
    elevation: 2,
    minWidth: 320,
    maxWidth: 480,
    width: '100%',
  },
  sectionSurface: {
    padding: 12,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: theme?.colors?.surface || '#fff',
    elevation: 1,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 6,
    color: theme?.colors?.primary || '#007AFF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  label: {
    fontWeight: '600',
    color: theme?.colors?.onSurface || '#333',
    marginRight: 6,
    fontSize: 15,
  },
  value: {
    color: theme?.colors?.onSurface || '#333',
    fontSize: 15,
    flexShrink: 1,
  },
  button: {
    marginTop: 12,
    marginRight: 8,
    borderRadius: 8,
    minWidth: 100,
  },
});

export default InviteAcceptanceScreen;
