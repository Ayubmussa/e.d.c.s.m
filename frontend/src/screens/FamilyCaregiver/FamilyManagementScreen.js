import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ThemedText, ThemedHeading, ThemedCardTitle } from '../../components/common/ThemedText';
import { WellnessCard, QuickActionCard, HealthMetricCard } from '../../components/common/CustomCards';
import { CustomButton } from '../../components/common/CustomButton';
import { familyService } from '../../services/familyService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';

const FamilyManagementScreen = (props) => {
  const navigation = props.navigation || useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { loadNotificationHistory } = useNotification();
  const userType = user?.user_type || user?.userType || 'elderly';

  const [familyMembers, setFamilyMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFamilyData = async () => {
    try {
      const result = await familyService.getFamilyMembers();
      console.log('Family data result:', result);
      // Log the full API response for debugging
      if (result && result.data) {
        console.log('Full familyService.getFamilyMembers() response:', JSON.stringify(result.data, null, 2));
      }
      // Fix: extract from nested data
      const apiData = result.data?.data || {};
      const { familyMembers = [], pendingInvites: pending = [] } = apiData;
      
      // Filter out invalid family members
      const validFamilyMembers = familyMembers.filter(member => 
        member && member.id && member.name
      );
      
      // Filter out invalid pending invites
      // Only require id for pending invites
      const validPendingInvites = pending.filter(invite => invite && invite.id);
      
      console.log('Valid family members:', validFamilyMembers);
      console.log('Valid pending invites:', validPendingInvites);
      // Debug: log user id and invited_by for each invite
      if (user && user.id) {
        console.log('Current user id:', user.id);
        validPendingInvites.forEach(invite => {
          console.log(`Invite id: ${invite.id}, invited_by: ${invite.invited_by}, emailOrPhone: ${invite.emailOrPhone || invite.email || invite.phone}, status: ${invite.status}`);
        });
      }
      setFamilyMembers(validFamilyMembers);
      setPendingInvites(validPendingInvites);
    } catch (error) {
      console.error('Error loading family data:', error);
      Alert.alert('Error', 'Failed to load family information');
      // Set default empty arrays on error
      setFamilyMembers([]);
      setPendingInvites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFamilyData();
  };

  const handleAcceptInvite = async (relationshipId) => {
    try {
      const result = await familyService.updateRelationshipStatus(relationshipId, 'accepted');
      if (result.success) {
        Alert.alert('Invite Accepted', 'Family member has been added successfully');
        loadFamilyData();
      } else {
        Alert.alert('Error', result.error || 'Failed to accept invite');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to accept invite');
    }
  };

  const handleDeclineInvite = async (relationshipId) => {
    Alert.alert(
      'Decline Invite',
      'Are you sure you want to decline this invitation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await familyService.updateRelationshipStatus(relationshipId, 'declined');
              if (result.success) {
                Alert.alert('Invite Declined', 'The invitation has been declined');
                loadFamilyData();
              } else {
                Alert.alert('Error', result.error || 'Failed to decline invite');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to decline invite');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadFamilyData();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <HealthMetricCard
            metric="Family"
            value={(familyMembers || []).length.toString()}
            unit="members"
            color={theme.colors.primary}
            icon="account-group"
            style={styles.statCard}
          />
          <HealthMetricCard
            metric="Pending"
            value={(pendingInvites || []).length.toString()}
            unit="invites"
            color={theme.colors.secondary}
            icon="account-clock"
            style={styles.statCard}
          />
          <HealthMetricCard
            metric="Active"
            value={(familyMembers || []).filter(m => m && (m.status === 'active' || m.status === 'accepted' || !m.status)).length.toString()}
            unit="connections"
            color={theme.colors.accent}
            icon="account-check"
            style={styles.statCard}
          />
        </View>

        {/* Family Members Section */}
        <View style={styles.familyMembersSection}>
          <ThemedHeading variant="headlineMedium" style={styles.sectionTitle}>
            Family Members
          </ThemedHeading>
          <View style={styles.familyMembersContainer}>
            {familyMembers.length === 0 ? (
              <View style={styles.emptyMembersContainer}>
                <MaterialCommunityIcons 
                  name="account-plus" 
                  size={48} 
                  color={theme.colors.primary} 
                />
                <ThemedHeading variant="headlineMedium" style={styles.emptyMembersTitle}>
                  No Family Members Yet
                </ThemedHeading>
                <ThemedText variant="bodyLarge" style={styles.emptyMembersText}>
                  Invite family members to connect and stay in touch
                </ThemedText>
              </View>
            ) : (
              <View style={styles.membersList}>
                {familyMembers.map(member => {
                  // Log the member object for debugging
                  console.log('[FamilyMember]', member);
                  // Prefer member.elderlyUserId, fallback to member.userId, then member.id
                  const elderlyId = member.elderlyUserId || member.userId || member.id;
                  // UUID v4 regex (simple, not exhaustive)
                  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
                  if (!elderlyId || elderlyId === 'undefined' || !uuidRegex.test(elderlyId)) {
                    console.warn('Skipping navigation: elderlyId is missing or invalid for member', member, 'Resolved elderlyId:', elderlyId);
                    return null;
                  }
                  return (
                    <TouchableOpacity
                      key={member.id}
                      style={styles.memberCard}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (!elderlyId || elderlyId === 'undefined' || !uuidRegex.test(elderlyId)) {
                          Alert.alert('Error', 'Unable to view details: Missing or invalid elderly user ID.');
                          return;
                        }
                        navigation.navigate('ElderlyDetailsScreen', {
                          elderlyId,
                          elderlyName: member.name
                        });
                      }}
                    >
                      <View style={styles.memberCardContent}>
                        <View style={styles.memberIconContainer}>
                          <MaterialCommunityIcons
                            name="account-circle"
                            size={32}
                            color={theme.colors.primary}
                          />
                        </View>
                        <View style={styles.memberInfo}>
                          <ThemedCardTitle style={styles.memberName}>
                            {member.name}
                          </ThemedCardTitle>
                          <ThemedText variant="bodyMedium" style={styles.memberRole}>
                            {member.role || member.relationship}
                          </ThemedText>
                        </View>
                        <View style={styles.memberStatusBadge}>
                          <ThemedText variant="bodySmall" style={styles.memberStatusText}>
                            Active
                          </ThemedText>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Pending Invites Section */}
        <View style={styles.invitesSection}>
          <ThemedHeading variant="headlineMedium" style={styles.sectionTitle}>
            Pending Invites
          </ThemedHeading>
          <View style={styles.invitesContainer}>
            {pendingInvites.length === 0 ? (
              <View style={styles.emptyInvitesContainer}>
                <MaterialCommunityIcons 
                  name="account-clock" 
                  size={48} 
                  color={theme.colors.primary} 
                />
                <ThemedHeading variant="headlineMedium" style={styles.emptyInvitesTitle}>
                  No Pending Invites
                </ThemedHeading>
                <ThemedText variant="bodyLarge" style={styles.emptyInvitesText}>
                  All family invitations have been processed
                </ThemedText>
              </View>
            ) : (
              <View style={styles.invitesList}>
                {pendingInvites.map(invite => {
                  // Debug: log invite and user id for each render
                  console.log('[Render] Invite id:', invite.id, 'inviterUserId:', invite.inviterUserId, 'user.id:', user?.id);
                  // Only show buttons if the logged-in user is the target (not the inviter)
                  const isTarget = invite.inviterUserId !== user.id;
                  // Display inviter info using correct fields
                  const inviterInfo = invite.inviterName || invite.inviterEmail || invite.inviterUserId || 'Unknown';
                  return (
                    <TouchableOpacity
                      key={invite.id}
                      style={styles.inviteCard}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('InviteAcceptance', { inviteId: invite.id, inviteData: invite })}
                    >
                      <View style={styles.inviteCardContent}>
                        <View style={styles.inviteIconContainer}>
                          <MaterialCommunityIcons
                            name="email"
                            size={32}
                            color={theme.colors.primary}
                          />
                        </View>
                        <View style={styles.inviteInfo}>
                          <ThemedCardTitle style={styles.inviteContact}>
                            {invite.emailOrPhone || invite.email || invite.phone}
                          </ThemedCardTitle>
                          <ThemedText variant="bodyMedium" style={styles.inviteStatus}>
                            Waiting for response
                          </ThemedText>
                          <ThemedText variant="bodySmall" style={{ color: theme.colors.onSurface, opacity: 0.7 }}>
                            {`From: ${inviterInfo}`}
                          </ThemedText>
                        </View>
                        {isTarget && invite.status === 'pending' && (
                          <View style={styles.inviteActions}>
                            <CustomButton 
                              mode="contained" 
                              onPress={() => handleAcceptInvite(invite.id)} 
                              style={styles.acceptButton}
                              textColor="#FFFFFF"
                            >
                              Accept
                            </CustomButton>
                            <CustomButton 
                              mode="outlined" 
                              onPress={() => handleDeclineInvite(invite.id)} 
                              style={styles.declineButton}
                              textColor={theme.colors.primary}
                            >
                              Decline
                            </CustomButton>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Add Family Member Button */}
        <View style={styles.addFamilyContainer}>
          <CustomButton
            mode="contained"
            onPress={() => {
              // Try to use parent navigator for nested navigation
              if (navigation.getParent && navigation.getParent()) {
                navigation.getParent().navigate('InviteFamily');
              } else {
                navigation.navigate('InviteFamily');
              }
            }}
            style={styles.addFamilyButton}
            icon="account-plus"
            textColor="#FFFFFF"
          >
            Invite
          </CustomButton>
        </View>

        {/* Extra spacing for better scrolling */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};


const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    padding: theme.spacing.md,
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
  },
  
  // Section Headers
  sectionTitle: {
    marginBottom: theme.spacing.md,
    color: theme.colors.primary,
  },
  
  // Family Members Section
  familyMembersSection: {
    marginBottom: theme.spacing.lg,
  },
  familyMembersContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  emptyMembersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyMembersTitle: {
    textAlign: 'center',
    color: theme.colors.primary,
  },
  emptyMembersText: {
    textAlign: 'center',
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  membersList: {
    gap: theme.spacing.md,
  },
  memberCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 80,
  },
  memberCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  memberIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    marginBottom: theme.spacing.xs,
  },
  memberRole: {
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  memberStatusBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  memberStatusText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  
  // Pending Invites Section
  invitesSection: {
    marginBottom: theme.spacing.lg,
  },
  invitesContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  emptyInvitesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyInvitesTitle: {
    textAlign: 'center',
    color: theme.colors.primary,
  },
  emptyInvitesText: {
    textAlign: 'center',
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  invitesList: {
    gap: theme.spacing.md,
  },
  inviteCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 80,
  },
  inviteCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  inviteIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteInfo: {
    flex: 1,
  },
  inviteContact: {
    marginBottom: theme.spacing.xs,
  },
  inviteStatus: {
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  acceptButton: {
    minWidth: 80,
    borderRadius: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  declineButton: {
    minWidth: 80,
    borderRadius: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderColor: theme.colors.primary,
  },
  
  // Add Family Button
  addFamilyContainer: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  addFamilyButton: {
    minWidth: 200,
    borderRadius: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
});

export default FamilyManagementScreen;
