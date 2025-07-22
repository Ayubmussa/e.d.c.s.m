const familyService = require('../services/familyService');
const logger = require('../config/logger');

class FamilyController {
  async inviteFamilyMember(req, res) {
    try {
      // Map frontend fields to backend expected format
      const { emailOrPhone, relationship, accessLevel, message, permissions } = req.body;
      
      // Validate that we have either an email or phone number
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      // Improved phone regex: supports international format, requires 7-15 digits
      const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{6,18}$/;
      
      const isEmail = emailRegex.test(emailOrPhone);
      // Clean phone number for validation (remove spaces, dashes, parentheses)
      const cleanPhone = emailOrPhone.replace(/[\s\-\(\)]/g, '');
      const isPhone = phoneRegex.test(emailOrPhone) && cleanPhone.length >= 7 && cleanPhone.length <= 16 && /^\+?[\d]+$/.test(cleanPhone);
      
      if (!isEmail && !isPhone) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid email address or phone number (7-15 digits).'
        });
      }
      
      // Use direct accessLevel if provided, otherwise determine from permissions
      let finalAccessLevel = accessLevel;
      if (!finalAccessLevel && permissions) {
        // Fallback logic for backward compatibility
        if (permissions.manageSettings) {
          finalAccessLevel = 'full';
        } else if (permissions.viewHealth || permissions.viewMedications || permissions.viewLocation) {
          finalAccessLevel = 'manage';
        } else {
          finalAccessLevel = 'view';
        }
      }
      
      // Default to 'view' if no access level is determined
      finalAccessLevel = finalAccessLevel || 'view';
      
      // Validate access level
      const validAccessLevels = ['view', 'manage', 'full'];
      if (!validAccessLevels.includes(finalAccessLevel)) {
        return res.status(400).json({
          success: false,
          error: `Invalid access level. Must be one of: ${validAccessLevels.join(', ')}`
        });
      }
      
      const inviteData = {
        email: isEmail ? emailOrPhone : null,
        phone_number: isPhone ? cleanPhone : null, // Use cleaned phone format
        relationshipType: relationship, // Map relationship to relationshipType
        accessLevel: finalAccessLevel,
        notes: message || req.body.notes || '',
        permissions: permissions || {}
      };
      
      const result = await familyService.inviteFamilyMember(req.user.id, inviteData);
      
      // Check if this was an existing invitation
      if (result.alreadyInvited) {
        return res.status(200).json({
          success: true,
          message: 'Invitation already exists for this family member',
          data: result
        });
      }
      
      res.status(201).json({
        success: true,
        message: 'Family member invited successfully',
        data: result
      });
    } catch (error) {
      logger.error('Invite family member controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getFamilyMembers(req, res) {
    try {
      const { data: user } = await require('../config/database').supabaseAdmin
        .from('user_profiles')
        .select('user_type')
        .eq('id', req.user.id)
        .single();

      const familyMembers = await familyService.getFamilyMembers(req.user.id, user?.user_type || 'elderly');
      // Return camelCase keys for frontend compatibility
      res.json({
        success: true,
        data: familyMembers
      });
    } catch (error) {
      logger.error('Get family members controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getPendingInvites(req, res) {
    try {
      const { data: user } = await require('../config/database').supabaseAdmin
        .from('user_profiles')
        .select('user_type')
        .eq('id', req.user.id)
        .single();

      const result = await familyService.getFamilyMembers(req.user.id, user?.user_type || 'elderly');
      
      res.json({
        success: true,
        data: { 
          pending_invites: result.pendingInvites || [],
          count: (result.pendingInvites || []).length
        }
      });
    } catch (error) {
      logger.error('Get pending invites controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateRelationshipStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const relationship = await familyService.updateRelationshipStatus(id, status, req.user.id);
      
      res.json({
        success: true,
        message: 'Relationship status updated successfully',
        data: { relationship }
      });
    } catch (error) {
      logger.error('Update relationship status controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updatePermissions(req, res) {
    try {
      const { id } = req.params;
      const permissions = req.body;
      
      await familyService.updatePermissions(id, permissions, req.user.id);
      
      res.json({
        success: true,
        message: 'Permissions updated successfully'
      });
    } catch (error) {
      logger.error('Update permissions controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getPermissions(req, res) {
    try {
      const { id } = req.params;
      
      const permissions = await familyService.getPermissions(id);
      
      res.json({
        success: true,
        data: { permissions }
      });
    } catch (error) {
      logger.error('Get permissions controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async removeRelationship(req, res) {
    try {
      const { id } = req.params;
      
      await familyService.removeRelationship(id, req.user.id);
      
      res.json({
        success: true,
        message: 'Relationship removed successfully'
      });
    } catch (error) {
      logger.error('Remove relationship controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getElderlyData(req, res) {
    try {
      const { elderlyId } = req.params;
      
      const data = await familyService.getElderlyDataForCaregiver(req.user.id, elderlyId);
      
      res.json({
        success: true,
        data
      });
    } catch (error) {
      logger.error('Get elderly data controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getCaregiverDashboard(req, res) {
    try {
      // Get all elderly people this caregiver has access to
      const familyData = await familyService.getFamilyMembers(req.user.id, 'caregiver');
      
      // Extract the actual arrays from the returned object
      const familyMembers = familyData.familyMembers || [];
      const pendingInvites = familyData.pendingInvites || [];
      
      const dashboard = {
        total_elderly: familyMembers.length,
        active_relationships: familyMembers.length, // All returned family members are accepted
        pending_invites: pendingInvites.length,
        elderly_list: familyMembers.map(member => ({
          id: member.userId,
          name: member.name,
          relationship: member.relationship,
          status: 'accepted', // All family members are accepted
          access_level: member.accessLevel,
          last_updated: member.createdAt
        }))
      };
      
      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      logger.error('Get caregiver dashboard controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Convenience method for accepting family invites
  async acceptInvite(req, res) {
    try {
      const { inviteId } = req.body;
      
      if (!inviteId) {
        return res.status(400).json({
          success: false,
          error: 'Invite ID is required'
        });
      }
      
      const relationship = await familyService.updateRelationshipStatus(inviteId, 'accepted', req.user.id);
      
      res.json({
        success: true,
        message: 'Family invite accepted successfully',
        data: { relationship }
      });
    } catch (error) {
      logger.error('Accept invite controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Convenience method for declining family invites  
  async declineInvite(req, res) {
    try {
      const { inviteId } = req.body;
      
      if (!inviteId) {
        return res.status(400).json({
          success: false,
          error: 'Invite ID is required'
        });
      }
      
      const relationship = await familyService.updateRelationshipStatus(inviteId, 'declined', req.user.id);
      
      res.json({
        success: true,
        message: 'Family invite declined successfully',
        data: { relationship }
      });
    } catch (error) {
      logger.error('Decline invite controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new FamilyController();
