import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  Chip,
  IconButton,
  Surface,
  FAB,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { familyService } from '../../services/familyService';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemedText } from '../../components/common/ThemedText';
import { UI_CONFIG } from '../../config/config';

const CaregiverDashboardScreen = ({ navigation }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = createStyles(theme);

  // Debug logging for user data
  console.log('=== CAREGIVER DASHBOARD USER DATA ===');
  console.log('User object:', user);
  console.log('User profile_image:', user?.profile_image);
  console.log('User profileImage:', user?.profileImage);

  const loadDashboardData = async () => {
    try {
      const [dashboardResult, membersResult, invitesResult] = await Promise.all([
        familyService.getCaregiverDashboard?.(),
        familyService.getFamilyMembers(),
        familyService.getPendingInvites?.()
      ]);
      if (dashboardResult?.success) {
        setDashboardData(dashboardResult?.data?.data || dashboardResult?.data || {});
      }
      // Fix: extract from nested data for family members
      let apiMembers = membersResult?.data?.data || membersResult?.data || {};
      setFamilyMembers((apiMembers.familyMembers || []).filter(m => m && m.id && m.name));
      // Fix: extract from nested data for pending invites
      let apiInvites = invitesResult?.data?.data || invitesResult?.data || {};
      const pending = apiInvites.pendingInvites || apiInvites.pending_invites || [];
      setPendingInvites(pending.filter(invite => invite && (invite.id || invite.relationshipId)));
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText variant="bodyMedium">Loading...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Card style={styles.card}>
        <Card.Title title="Caregiver Dashboard" left={props => <MaterialCommunityIcons name="account-tie" size={28} color={theme.colors.primary} />} />
        <Card.Content>
          <Title style={styles.sectionTitle}>Welcome, Caregiver!</Title>
          <Paragraph style={styles.welcomeText}>Here is an overview of your family connections and invitations.</Paragraph>

          {/* Dashboard Stats */}
          {dashboardData && (
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <MaterialCommunityIcons name="account-group" size={28} color={theme.colors.primary} />
                <Paragraph style={styles.statLabel}>Total Elderly</Paragraph>
                <Title style={styles.statValue}>{dashboardData.total_elderly}</Title>
              </View>
              <View style={styles.statBox}>
                <MaterialCommunityIcons name="account-check" size={28} color={theme.colors.secondary} />
                <Paragraph style={styles.statLabel}>Active</Paragraph>
                <Title style={styles.statValue}>{dashboardData.active_relationships}</Title>
              </View>
              <View style={styles.statBox}>
                <MaterialCommunityIcons name="account-clock" size={28} color={theme.colors.primary} />
                <Paragraph style={styles.statLabel}>Pending</Paragraph>
                <Title style={styles.statValue}>{dashboardData.pending_invites}</Title>
              </View>
            </View>
          )}

          {/* Family Members Section */}
          <Title style={styles.sectionTitle}>Family Members</Title>
          {familyMembers.length === 0 ? (
            <View style={styles.emptySection}>
              <MaterialCommunityIcons name="account-group" size={40} color={theme.colors.primary} />
              <Paragraph>No family members found.</Paragraph>
            </View>
          ) : (
            <View>
              {familyMembers.map(member => (
                <Surface key={member.relationshipId} style={styles.memberCard}>
                  <View style={styles.memberRow}>
                    <Avatar.Icon size={40} icon="account" style={{ backgroundColor: theme.colors.primary }} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Paragraph style={styles.memberName}>{member.name}</Paragraph>
                      <Paragraph style={styles.memberDetail}>Relationship: {member.relationship}</Paragraph>
                      <Paragraph style={styles.memberDetail}>Access Level: {member.accessLevel}</Paragraph>
                      <Chip style={styles.statusChip} icon="check" textStyle={{ color: '#fff' }}>
                        Accepted
                      </Chip>
                    </View>
                  </View>
                </Surface>
              ))}
            </View>
          )}

          {/* Pending Invitations Section */}
          <Title style={styles.sectionTitle}>Pending Invitations</Title>
          {pendingInvites.length === 0 ? (
            <View style={styles.emptySection}>
              <MaterialCommunityIcons name="account-clock" size={40} color={theme.colors.primary} />
              <Paragraph>No pending invitations.</Paragraph>
            </View>
          ) : (
            <View>
              {pendingInvites.map(invite => (
                <TouchableOpacity
                  key={invite.relationshipId || invite.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    // Normalize inviter fields for InviteAcceptanceScreen
                    const inviterName = invite.inviterName || invite.inviter_name || invite.inviterEmail || invite.inviter_email || invite.inviterUserId || 'Unknown';
                    const inviterEmail = invite.inviterEmail || invite.inviter_email || '';
                    navigation.navigate('InviteAcceptance', {
                      inviteId: invite.id || invite.relationshipId,
                      inviteData: {
                        ...invite,
                        inviterName,
                        inviterEmail,
                      },
                    });
                  }}
                >
                  <Surface style={styles.inviteCard}>
                    <View style={styles.inviteRow}>
                      <Avatar.Icon size={40} icon="email" style={{ backgroundColor: theme.colors.accent }} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Paragraph style={styles.inviteName}>
                          Inviter: {invite.inviterName || invite.inviterEmail || invite.inviterUserId || 'Unknown'}
                        </Paragraph>
                        <Paragraph style={styles.inviteDetail}>Relationship: {invite.relationship}</Paragraph>
                        <Paragraph style={styles.inviteDetail}>Access Level: {invite.accessLevel}</Paragraph>
                        <Chip style={styles.statusChipPending} icon="clock" textStyle={{ color: '#fff' }}>
                          Pending
                        </Chip>
                      </View>
                    </View>
                  </Surface>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  card: {
    borderRadius: 16,
    marginVertical: 12,
    padding: 8,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  welcomeText: {
    marginBottom: 16,
    color: theme.colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginHorizontal: 4,
    padding: 10,
    elevation: 1,
  },
  statLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text.primary,
    marginTop: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 2,
  },
  emptySection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  memberCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginVertical: 6,
    padding: 10,
    elevation: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: theme.colors.primary,
  },
  memberDetail: {
    fontSize: 13,
    color: theme.colors.text,
    marginTop: 2,
  },
  statusChip: {
    marginTop: 8,
    backgroundColor: theme.colors.primary,
  },
  inviteCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginVertical: 6,
    padding: 10,
    elevation: 1,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: theme.colors.accent,
  },
  inviteDetail: {
    fontSize: 13,
    color: theme.colors.text,
    marginTop: 2,
  },
  statusChipPending: {
    marginTop: 8,
    backgroundColor: theme.colors.accent,
  },
});

export default CaregiverDashboardScreen;
