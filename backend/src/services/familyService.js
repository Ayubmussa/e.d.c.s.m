const { supabaseAdmin } = require('../config/database');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');
const pushNotificationService = require('./pushNotificationService');

class FamilyService {
  async inviteFamilyMember(invitingUserId, inviteData) {
    try {
      const { email, phone_number, relationshipType, accessLevel, notes } = inviteData;
      
      // First, get the inviting user's type
      const { data: invitingUser } = await supabaseAdmin
        .from('user_profiles')
        .select('user_type')
        .eq('id', invitingUserId)
        .single();
      
      if (!invitingUser) {
        throw new Error('Inviting user not found');
      }
      
      // Check if target user already exists (by email or phone)
      let existingUser = null;
      
      if (email) {
        // Check in auth.users first by email
        const { data: authUser } = await supabaseAdmin.auth.admin.listUsers();
        const foundAuthUser = authUser.users.find(user => user.email === email);
        
        if (foundAuthUser) {
          // Get their profile
          const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('id, user_type, phone_number')
            .eq('id', foundAuthUser.id)
            .single();
          
          if (profile) {
            existingUser = {
              id: foundAuthUser.id,
              email: foundAuthUser.email,
              ...profile
            };
          }
        }
      } else if (phone_number) {
        const { data: profile } = await supabaseAdmin
          .from('user_profiles')
          .select('id, user_type, phone_number')
          .eq('phone_number', phone_number)
          .single();
        
        if (profile) {
          // Get auth user details
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
          existingUser = {
            id: profile.id,
            email: authUser.user.email,
            ...profile
          };
        }
      }

      let targetUserId = existingUser?.id;
      let targetUserType;

      // Check if the target user exists
      if (!targetUserId) {
        // Instead of creating a new user, throw an error that the user doesn't exist
        throw new Error(`User with ${email ? `email ${email}` : `phone ${phone_number}`} does not exist. They need to register first before being invited.`);
      } else {
        targetUserType = existingUser.user_type;
      }

      // Determine caregiver and elderly IDs based on user types
      // Treat 'caregiver' and 'family' as the same user type
      let caregiverId, elderlyId;
      const isFamilyCaregiver = (invitingUser.user_type === 'caregiver' || invitingUser.user_type === 'family');
      
      if (isFamilyCaregiver) {
        caregiverId = invitingUserId;
        elderlyId = targetUserId;
      } else {
        caregiverId = targetUserId;
        elderlyId = invitingUserId;
      }

      // Check if relationship already exists
      const { data: existingRelationship } = await supabaseAdmin
        .from('family_relationships')
        .select('id, status')
        .eq('caregiver_id', caregiverId)
        .eq('elderly_id', elderlyId)
        .single();

      if (existingRelationship) {
        // If relationship exists but is still pending, we can return it
        if (existingRelationship.status === 'pending') {
          // Resend the notification for this pending invitation
          try {
            // Get inviting user's full name for the notification
            const { data: invitingUserDetails } = await supabaseAdmin
              .from('user_profiles')
              .select('first_name, last_name')
              .eq('id', invitingUserId)
              .single();

            const inviterName = invitingUserDetails 
              ? `${invitingUserDetails.first_name} ${invitingUserDetails.last_name}`
              : 'Someone';

            // Create notification message based on user types
            // Treat 'caregiver' and 'family' as the same type
            const isInviterFamilyCaregiver = (invitingUser.user_type === 'caregiver' || invitingUser.user_type === 'family');
            const notificationTitle = invitingUser.user_type === 'elderly' 
              ? 'New Care Request' 
              : 'New Family Connection';
            
            const notificationBody = invitingUser.user_type === 'elderly'
              ? `${inviterName} has invited you to be their caregiver`
              : `${inviterName} wants to connect with you as ${relationshipType}`;

            // Send push notification to target user
            await pushNotificationService.sendPushNotification(targetUserId, {
              title: notificationTitle,
              body: notificationBody,
              data: {
                type: 'family_invitation',
                relationshipId: existingRelationship.id,
                inviterId: invitingUserId,
                inviterName: inviterName,
                inviterType: invitingUser.user_type,
                relationship: relationshipType,
                screen: 'FamilyManagement'
              }
            });

            // Create an in-app notification record
            await supabaseAdmin
              .from('notification_history')
              .insert([{
                id: uuidv4(),
                user_id: targetUserId,
                title: notificationTitle,
                message: notificationBody,
                type: 'family_invitation',
                data: {
                  relationshipId: existingRelationship.id,
                  inviterId: invitingUserId,
                  inviterName: inviterName,
                  inviterType: invitingUser.user_type,
                  relationship: relationshipType
                },
                is_read: false,
                timestamp: new Date().toISOString()
              }]);
              
            logger.info(`Resent invitation notification for existing relationship ${existingRelationship.id}`);
          } catch (notifError) {
            // Log but don't fail the invitation process if notification fails
            logger.error('Failed to resend invitation notification:', notifError);
          }
          
          return {
            relationship: existingRelationship,
            targetUserId,
            targetUserType,
            invitingUserType: invitingUser.user_type,
            isNewUser: false,
            existingUserType: existingUser?.user_type,
            alreadyInvited: true
          };
        }
        // For other statuses, throw an error
        throw new Error(`A relationship already exists between these users (Status: ${existingRelationship.status})`);
      }

      // Create family relationship
      const relationshipId = uuidv4();
      const { data: relationship, error } = await supabaseAdmin
        .from('family_relationships')
        .insert([{
          id: relationshipId,
          caregiver_id: caregiverId,
          elderly_id: elderlyId,
          relationship_type: relationshipType,
          access_level: accessLevel,
          status: 'pending',
          invited_by: invitingUserId,
          notes
        }])
        .select('*')
        .single();

      if (error) throw error;

      // Create default permissions based on access level
      await this.createDefaultPermissions(relationshipId, accessLevel, invitingUserId);

      // Send notification to the target user about the invitation
      try {
        // Get inviting user's full name for the notification
        const { data: invitingUserDetails } = await supabaseAdmin
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('id', invitingUserId)
          .single();

        const inviterName = invitingUserDetails 
          ? `${invitingUserDetails.first_name} ${invitingUserDetails.last_name}`
          : 'Someone';

        // Create notification message based on user types
        const notificationTitle = invitingUser.user_type === 'elderly' 
          ? 'New Care Request' 
          : 'New Family Connection';
        
        const notificationBody = invitingUser.user_type === 'elderly'
          ? `${inviterName} has invited you to be their caregiver`
          : `${inviterName} wants to connect with you as ${relationshipType}`;

        // Send push notification to target user
        await pushNotificationService.sendPushNotification(targetUserId, {
          title: notificationTitle,
          body: notificationBody,
          data: {
            type: 'family_invitation',
            relationshipId: relationshipId,
            inviterId: invitingUserId,
            inviterName: inviterName,
            inviterType: invitingUser.user_type,
            relationship: relationshipType,
            screen: 'FamilyManagement'
          }
        });

        // Create an in-app notification record
        await supabaseAdmin
          .from('notification_history')
          .insert([{
            id: uuidv4(),
            user_id: targetUserId,
            title: notificationTitle,
            message: notificationBody,
            type: 'family_invitation',
            data: {
              relationshipId: relationshipId,
              inviterId: invitingUserId,
              inviterName: inviterName,
              inviterType: invitingUser.user_type,
              relationship: relationshipType
            },
            is_read: false,
            timestamp: new Date().toISOString()
          }]);
      } catch (notifError) {
        // Log but don't fail the invitation process if notification fails
        logger.error('Failed to send invitation notification:', notifError);
      }

      return {
        relationship,
        targetUserId,
        targetUserType,
        invitingUserType: invitingUser.user_type,
        isNewUser: !existingUser,
        existingUserType: existingUser?.user_type
      };
    } catch (error) {
      logger.error('Invite family member error:', error);
      // Expose real error in development for debugging
      if (process.env.NODE_ENV === 'development') {
        throw new Error('Failed to invite family member: ' + error.message);
      } else {
        throw new Error('Failed to invite family member');
      }
    }
  }

  async createDefaultPermissions(relationshipId, accessLevel, invitingUserId) {
    const permissions = [];
    
    // Base permissions for all access levels
    const basePermissions = ['view_health_data', 'view_emergency_alerts'];
    
    // Additional permissions based on access level
    if (accessLevel === 'manage') {
      basePermissions.push('manage_medications', 'manage_emergency_contacts', 'view_brain_training');
    } else if (accessLevel === 'full') {
      basePermissions.push(
        'manage_medications', 
        'manage_emergency_contacts', 
        'view_brain_training', 
        'manage_notifications', 
        'view_voice_interactions'
      );
    }

    for (const permission of basePermissions) {
      permissions.push({
        id: uuidv4(),
        relationship_id: relationshipId,
        permission_type: permission,
        granted: true,
        granted_at: new Date().toISOString(),
        granted_by: invitingUserId
      });
    }

    if (permissions.length > 0) {
      await supabaseAdmin
        .from('caregiver_permissions')
        .insert(permissions);
    }
  }

  async getFamilyMembers(userId, userType) {
    try {
      // Get all relationships where the user is either caregiver or elderly
      const { data: relationships, error } = await supabaseAdmin
        .from('family_relationships')
        .select('*')
        .or(`caregiver_id.eq.${userId},elderly_id.eq.${userId}`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique user IDs to fetch user profiles
      const userIds = new Set();
      relationships.forEach(rel => {
        userIds.add(rel.caregiver_id);
        userIds.add(rel.elderly_id);
        if (rel.invited_by) userIds.add(rel.invited_by);
      });

      // Fetch user profiles for all involved users
      const { data: userProfiles, error: profilesError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, first_name, last_name, phone_number')
        .in('id', Array.from(userIds));

      if (profilesError) throw profilesError;

      // Create a map for easy lookup
      const profilesMap = {};
      userProfiles.forEach(profile => {
        profilesMap[profile.id] = profile;
      });

      // Also fetch auth user emails
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      const authUsersMap = {};
      if (!authError && authUsers?.users) {
        authUsers.users.forEach(user => {
          authUsersMap[user.id] = user;
        });
      }

      const activeRelationships = [];
      const pendingInvites = [];

      relationships.forEach(rel => {
        const caregiverProfile = profilesMap[rel.caregiver_id] || {};
        const elderlyProfile = profilesMap[rel.elderly_id] || {};
        const caregiverAuth = authUsersMap[rel.caregiver_id] || {};
        const elderlyAuth = authUsersMap[rel.elderly_id] || {};

        if (rel.status === 'accepted') {
          // Determine who the "other person" is from this user's perspective
          const isUserCaregiver = rel.caregiver_id === userId;
          const otherProfile = isUserCaregiver ? elderlyProfile : caregiverProfile;
          const otherAuth = isUserCaregiver ? elderlyAuth : caregiverAuth;
          const otherUserType = isUserCaregiver ? 'elderly' : 'caregiver';
          
          activeRelationships.push({
            id: rel.id,
            relationshipId: rel.id,
            userId: otherProfile.id,
            name: `${otherProfile.first_name || ''} ${otherProfile.last_name || ''}`.trim() || 'Unknown User',
            firstName: otherProfile.first_name,
            lastName: otherProfile.last_name,
            email: otherAuth.email,
            phoneNumber: otherProfile.phone_number,
            relationship: rel.relationship_type,
            accessLevel: rel.access_level,
            userType: otherUserType,
            createdAt: rel.created_at,
            acceptedAt: rel.accepted_at
          });
        } else if (rel.status === 'pending') {
          // Check if this user is the target of the invite (not the sender)
          if (rel.invited_by !== userId) {
            const inviterProfile = profilesMap[rel.invited_by] || {};
            const inviterAuth = authUsersMap[rel.invited_by] || {};
            const inviterUserType = rel.invited_by === rel.caregiver_id ? 'caregiver' : 'elderly';
            
            pendingInvites.push({
              id: rel.id,
              relationshipId: rel.id,
              inviterUserId: inviterProfile.id,
              inviterName: `${inviterProfile.first_name || ''} ${inviterProfile.last_name || ''}`.trim() || 'Unknown User',
              inviterFirstName: inviterProfile.first_name,
              inviterLastName: inviterProfile.last_name,
              inviterEmail: inviterAuth.email,
              inviterUserType,
              relationship: rel.relationship_type,
              accessLevel: rel.access_level,
              createdAt: rel.created_at,
              notes: rel.notes
            });
          }
        }
      });

      return {
        caregivers: activeRelationships, // Keep this name for backward compatibility
        familyMembers: activeRelationships,
        pendingInvites
      };
    } catch (error) {
      logger.error('Get family members error:', error);
      throw new Error('Failed to retrieve family members');
    }
  }

  async updateRelationshipStatus(relationshipId, status, userId) {
    try {
      // Fetch the relationship first
      const { data: relationship, error: fetchError } = await supabaseAdmin
        .from('family_relationships')
        .select('*')
        .eq('id', relationshipId)
        .single();

      if (fetchError) throw fetchError;
      if (!relationship) throw new Error('Relationship not found');

      // Check if the user is authorized (must be either caregiver or elderly in this relationship)
      if (relationship.caregiver_id !== userId && relationship.elderly_id !== userId) {
        throw new Error('Unauthorized to update relationship status');
      }

      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };
      if (status === 'accepted') {
        updateData.accepted_at = new Date().toISOString();
      }

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('family_relationships')
        .update(updateData)
        .eq('id', relationshipId)
        .eq('is_active', true)
        .select('*');

      if (updateError) throw updateError;
      if (!updated || updated.length === 0) {
        throw new Error('Relationship not found, not active, or not updated');
      }
      if (updated.length > 1) {
        throw new Error('Multiple relationships updated, expected only one');
      }
      return updated[0];
    } catch (error) {
      logger.error('Update relationship status error:', error);
      throw new Error('Failed to update relationship status');
    }
  }

  async updatePermissions(relationshipId, permissions, userId) {
    try {
      // Verify user has access to this relationship
      const { data: relationship } = await supabaseAdmin
        .from('family_relationships')
        .select('elderly_id, caregiver_id')
        .eq('id', relationshipId)
        .single();

      if (!relationship || relationship.elderly_id !== userId) {
        throw new Error('Unauthorized to update permissions');
      }

      // Update permissions
      const updates = [];
      for (const [permissionType, granted] of Object.entries(permissions)) {
        updates.push(
          supabaseAdmin
            .from('caregiver_permissions')
            .upsert({
              relationship_id: relationshipId,
              permission_type: permissionType,
              granted,
              granted_at: granted ? new Date().toISOString() : null,
              granted_by: userId
            })
        );
      }

      await Promise.all(updates);

      return { success: true };
    } catch (error) {
      logger.error('Update permissions error:', error);
      throw new Error('Failed to update permissions');
    }
  }

  async getPermissions(relationshipId) {
    try {
      const { data: permissions, error } = await supabaseAdmin
        .from('caregiver_permissions')
        .select('*')
        .eq('relationship_id', relationshipId);

      if (error) throw error;

      // Convert to object format
      const permissionMap = {};
      permissions?.forEach(p => {
        permissionMap[p.permission_type] = p.granted;
      });

      return permissionMap;
    } catch (error) {
      logger.error('Get permissions error:', error);
      throw new Error('Failed to retrieve permissions');
    }
  }

  async removeRelationship(relationshipId, userId) {
    try {
      const { error } = await supabaseAdmin
        .from('family_relationships')
        .update({ is_active: false })
        .eq('id', relationshipId)
        .or(`caregiver_id.eq.${userId},elderly_id.eq.${userId}`);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      logger.error('Remove relationship error:', error);
      throw new Error('Failed to remove relationship');
    }
  }

  async getElderlyDataForCaregiver(caregiverId, elderlyId) {
    try {
      // Check if caregiver has access to this elderly person
      const { data: relationship } = await supabaseAdmin
        .from('family_relationships')
        .select('id, access_level, status')
        .eq('caregiver_id', caregiverId)
        .eq('elderly_id', elderlyId)
        .eq('status', 'accepted')
        .eq('is_active', true)
        .single();

      if (!relationship) {
        throw new Error('Access denied or relationship not found');
      }

      // Get permissions
      const permissions = await this.getPermissions(relationship.id);

      // Build data response based on permissions
      const elderlyData = {
        basic_info: null,
        health_data: null,
        medications: null,
        emergency_contacts: null,
        brain_training: null,
        recent_alerts: null
      };

      // Basic info (always available)
      const { data: basicInfo } = await supabaseAdmin
        .from('user_profiles')
        .select('id, first_name, last_name, date_of_birth, phone_number, address, email')
        .eq('id', elderlyId)
        .single();
      
      elderlyData.basic_info = basicInfo;

      // Health data
      if (permissions.view_health_data) {
        const { data: healthData } = await supabaseAdmin
          .from('health_checkins')
          .select('*')
          .eq('user_id', elderlyId)
          .order('checkin_date', { ascending: false })
          .limit(10);
        
        elderlyData.health_data = healthData;
      }

      // Medications
      if (permissions.manage_medications || permissions.view_health_data) {
        const { data: medications } = await supabaseAdmin
          .from('medications')
          .select('*')
          .eq('user_id', elderlyId)
          .eq('is_active', true);
        
        elderlyData.medications = medications;
      }

      // Emergency contacts
      if (permissions.view_emergency_alerts) {
        const { data: emergencyContacts } = await supabaseAdmin
          .from('emergency_contacts')
          .select('*')
          .eq('user_id', elderlyId)
          .eq('is_active', true);
        
        elderlyData.emergency_contacts = emergencyContacts;

        const { data: recentAlerts } = await supabaseAdmin
          .from('emergency_alerts')
          .select('*')
          .eq('user_id', elderlyId)
          .order('triggered_at', { ascending: false })
          .limit(5);
        
        elderlyData.recent_alerts = recentAlerts;
      }

      // Brain training
      if (permissions.view_brain_training) {
        const { data: brainTraining } = await supabaseAdmin
          .from('brain_training_sessions')
          .select('*')
          .eq('user_id', elderlyId)
          .order('created_at', { ascending: false })
          .limit(10);
        
        elderlyData.brain_training = brainTraining;
      }

      return {
        elderly_data: elderlyData,
        permissions,
        access_level: relationship.access_level
      };
    } catch (error) {
      logger.error('Get elderly data for caregiver error:', error);
      throw new Error('Failed to retrieve elderly data');
    }
  }
}

module.exports = new FamilyService();
