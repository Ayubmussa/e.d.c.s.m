
 
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/database');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

// Simple in-memory cache to track password reset requests
const passwordResetCache = new Map();
const RESET_COOLDOWN_MINUTES = 2; // Minimum time between reset requests for same email

class AuthService {
  async register(userData) {
    try {
      const { email, password, firstName, lastName, dateOfBirth, phoneNumber, emergencyContact, userType = 'elderly', ...userInfo } = userData;

      // Step 1: Register user in Supabase Auth
      const supabasePayload = {
        email,
        password,
        email_confirm: true, // Auto-confirm email for admin creation
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          user_type: userType,
          date_of_birth: dateOfBirth,
          phone_number: phoneNumber,
          emergency_contact: emergencyContact,
          full_name: `${firstName} ${lastName}`
        }
      };
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser(supabasePayload);

      if (authError) {
        logger.error('Supabase Auth user creation error:', {
          error: authError,
          payload: supabasePayload
        });
        // If error is a duplicate email, make it explicit
        if (authError.message && authError.message.toLowerCase().includes('duplicate')) {
          throw new Error('A user with this email already exists.');
        }
        throw new Error(authError.message || 'Unknown error creating user in Supabase Auth');
      }

      if (!authData?.user) {
        logger.error('Supabase Auth user creation error: No user returned', { payload: supabasePayload, authData });
        throw new Error('Failed to create user in Supabase Auth');
      }

      const userId = authData.user.id;

      // Step 2: Create user profile in user_profiles table
      const formattedDob = dateOfBirth || (userType === 'elderly' ? '1950-01-01' : '1980-01-01');
      
      const profileData = {
        id: userId,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: formattedDob,
        phone_number: phoneNumber || '',
        emergency_contact: emergencyContact || {},
        address: userInfo.address || null,
        medical_conditions: userInfo.medicalConditions || [],
        user_type: userType,
        is_active: true,
        profile_image: userInfo.profileImage || null
      };

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert([profileData])
        .select('*')
        .single();

      if (profileError) {
        logger.error('User profile creation error:', profileError);
        // Clean up auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(userId);
        throw new Error('Failed to create user profile: ' + profileError.message);
      }

      // Step 3: Create emergency contact entry if provided
      if (emergencyContact && emergencyContact.name && emergencyContact.phoneNumber) {
        try {
          const contactId = uuidv4();
          await supabaseAdmin
            .from('emergency_contacts')
            .insert([{
              id: contactId,
              user_id: userId,
              name: emergencyContact.name,
              relationship: emergencyContact.relationship || 'Emergency Contact',
              phone_number: emergencyContact.phoneNumber,
              email: emergencyContact.email || null,
              is_primary: true,
              is_active: true
            }]);
        } catch (contactError) {
          logger.error('Emergency contact creation error:', contactError);
          // Don't fail the registration if emergency contact creation fails
        }
      }

      // Step 4: Generate JWT token for the user
      const token = this.generateToken(userId);

      // Step 5: Return user data from profile
      const user = {
        id: userId,
        email: email,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: formattedDob,
        phone_number: phoneNumber || '',
        address: userInfo.address || null,
        medical_conditions: userInfo.medicalConditions || [],
        user_type: userType,
        is_active: true,
        created_at: profile.created_at
      };

      return {
        user,
        token
      };
    } catch (error) {
      logger.error('Registration service error:', error);
      throw error;
    }
  }

    // New method: change password for authenticated users by userId (admin privilege)
  async changePasswordByUserId(userId, newPassword) {
    try {
      // Use Supabase Admin API to update password by user ID
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
      if (error) {
        logger.error('Supabase password update error:', error);
        throw new Error('Failed to update password: ' + error.message);
      }
      // Update timestamp in user_profiles table
      await supabaseAdmin
        .from('user_profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', userId);
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      logger.error('Password change error:', error);
      throw error;
    }
  }

   async deleteUserCascade(userId) {
    try {
      // Delete from user_profiles
      await supabaseAdmin.from('user_profiles').delete().eq('id', userId);
      // Delete from emergency_contacts
      await supabaseAdmin.from('emergency_contacts').delete().eq('user_id', userId);
      // Delete from user_notification_settings
      await supabaseAdmin.from('user_notification_settings').delete().eq('user_id', userId);
      // Delete from user_sensor_settings
      await supabaseAdmin.from('user_sensor_settings').delete().eq('user_id', userId);
      // Add more tables as needed (safe zones, family, etc.)
      // Finally, delete from Supabase Auth
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { success: true };
    } catch (error) {
      logger.error('Cascade user deletion error:', error);
      throw new Error('Failed to delete user and all related data');
    }
  }

  async login(email, password) {
    try {
      // Step 1: Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        logger.error('Supabase Auth login error:', authError);
        throw new Error('Invalid credentials');
      }

      if (!authData?.user) {
        throw new Error('Invalid credentials');
      }

      const userId = authData.user.id;

      // Step 2: Get user profile from user_profiles table
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (profileError || !profile) {
        logger.error('User profile fetch error:', profileError);
        throw new Error('User profile not found');
      }

      // Step 3: Update last login timestamp
      await supabaseAdmin
        .from('user_profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);

      // Step 4: Generate JWT token
      const token = this.generateToken(userId);

      // Step 5: Return user data (excluding sensitive fields)
      const user = {
        id: profile.id,
        email: authData.user.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        date_of_birth: profile.date_of_birth,
        phone_number: profile.phone_number,
        address: profile.address,
        medical_conditions: profile.medical_conditions,
        user_type: profile.user_type,
        is_active: profile.is_active,
        created_at: profile.created_at,
        last_login: new Date().toISOString()
      };

      return {
        user,
        token
      };
    } catch (error) {
      logger.error('Login service error:', error);
      throw error;
    }
  }

  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  async getUserById(userId) {
    try {
      // Step 1: Get user from Supabase Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

      if (authError || !authUser?.user) {
        throw new Error('User not found in auth system');
      }

      // Step 2: Get user profile from user_profiles table
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (profileError || !profile) {
        throw new Error('User profile not found');
      }

      // Step 3: Return combined user data
      return {
        id: profile.id,
        email: authUser.user.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        dateOfBirth: profile.date_of_birth,
        phoneNumber: profile.phone_number,
        emergencyContact: profile.emergency_contact,
        address: profile.address,
        medicalConditions: profile.medical_conditions,
        userType: profile.user_type,
        isActive: profile.is_active,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        lastLogin: profile.last_login
      };
    } catch (error) {
      logger.error('Get user by ID error:', error);
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      // Step 1: Map frontend field names to database field names
      const dbUpdateData = {};

      // Accept both camelCase and snake_case from frontend
      if (updateData.firstName !== undefined) dbUpdateData.first_name = updateData.firstName;
      if (updateData.first_name !== undefined) dbUpdateData.first_name = updateData.first_name;

      if (updateData.lastName !== undefined) dbUpdateData.last_name = updateData.lastName;
      if (updateData.last_name !== undefined) dbUpdateData.last_name = updateData.last_name;

      if (updateData.dateOfBirth !== undefined) dbUpdateData.date_of_birth = updateData.dateOfBirth;
      if (updateData.date_of_birth !== undefined) dbUpdateData.date_of_birth = updateData.date_of_birth;

      if (updateData.phoneNumber !== undefined) dbUpdateData.phone_number = updateData.phoneNumber;
      if (updateData.phone_number !== undefined) dbUpdateData.phone_number = updateData.phone_number;

      if (updateData.emergencyContact !== undefined) dbUpdateData.emergency_contact = updateData.emergencyContact;
      if (updateData.emergency_contact !== undefined) dbUpdateData.emergency_contact = updateData.emergency_contact;

      if (updateData.address !== undefined) dbUpdateData.address = updateData.address;

      if (updateData.medicalConditions !== undefined) dbUpdateData.medical_conditions = updateData.medicalConditions;
      if (updateData.medical_conditions !== undefined) dbUpdateData.medical_conditions = updateData.medical_conditions;

      if (updateData.profileImage !== undefined) dbUpdateData.profile_image = updateData.profileImage;
      if (updateData.profile_image !== undefined) dbUpdateData.profile_image = updateData.profile_image;

      if (updateData.userType !== undefined) dbUpdateData.user_type = updateData.userType;
      if (updateData.user_type !== undefined) dbUpdateData.user_type = updateData.user_type;

      // Add updated timestamp
      dbUpdateData.updated_at = new Date().toISOString();

      // Step 2: Update user profile in user_profiles table
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .update(dbUpdateData)
        .eq('id', userId)
        .select('*')
        .single();

      if (profileError) {
        logger.error('Update user profile error:', profileError);
        throw new Error('Failed to update user profile');
      }

      // Step 3: Update Supabase Auth user metadata if name fields changed
      if (updateData.firstName !== undefined || updateData.lastName !== undefined) {
        const metadataUpdate = {};
        if (updateData.firstName !== undefined) {
          metadataUpdate.first_name = updateData.firstName;
        }
        if (updateData.lastName !== undefined) {
          metadataUpdate.last_name = updateData.lastName;
        }
        if (updateData.firstName !== undefined && updateData.lastName !== undefined) {
          metadataUpdate.full_name = `${updateData.firstName} ${updateData.lastName}`;
        }

        try {
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: metadataUpdate
          });
        } catch (authError) {
          logger.error('Update auth metadata error:', authError);
          // Don't fail the update if metadata update fails
        }
      }

      // Step 4: Get updated user data with email from auth
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);

      // Step 5: Return updated user data
      return {
        id: profile.id,
        email: authUser?.user?.email || '',
        firstName: profile.first_name,
        lastName: profile.last_name,
        dateOfBirth: profile.date_of_birth,
        phoneNumber: profile.phone_number,
        emergencyContact: profile.emergency_contact,
        address: profile.address,
        medicalConditions: profile.medical_conditions,
        userType: profile.user_type,
        isActive: profile.is_active,
        updatedAt: profile.updated_at
      };
    } catch (error) {
      logger.error('Update user service error:', error);
      throw error;
    }
  }

  async validateEmailForReset(email) {
    try {
      // Check our cache first to avoid hitting Supabase rate limits
      const now = Date.now();
      const cooldownMs = RESET_COOLDOWN_MINUTES * 60 * 1000;
      const lastRequestTime = passwordResetCache.get(email);
      
      if (lastRequestTime) {
        const timeSinceLastRequest = now - lastRequestTime;
        
        if (timeSinceLastRequest < cooldownMs) {
          const remainingMinutes = Math.ceil((cooldownMs - timeSinceLastRequest) / (60 * 1000));
          logger.info(`Password reset request too soon for ${email}, ${remainingMinutes} minutes remaining`);
          
          // Still verify user exists in auth system
          const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
          const user = authUsers?.users?.find(u => u.email === email);

          if (!user) {
            throw new Error('No account found with this email address');
          }

          return { 
            success: true, 
            message: `Please wait ${remainingMinutes} minute(s) before requesting another password reset. Check your email for the previous reset link.`,
            rateLimited: true
          };
        }
      }

      // Verify user exists in auth system
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const user = authUsers?.users?.find(u => u.email === email);

      if (!user) {
        throw new Error('No account found with this email address');
      }

      // Check if user profile exists and is active
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('id, is_active')
        .eq('id', user.id)
        .single();

      if (!profile || !profile.is_active) {
        throw new Error('Account is not active');
      }

      // Update cache
      passwordResetCache.set(email, now);

      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      });

      if (error) {
        logger.error('Password reset email error:', error);
        throw new Error('Failed to send password reset email');
      }

      return { 
        success: true, 
        message: 'Password reset email sent successfully' 
      };
    } catch (error) {
      logger.error('Validate email for reset error:', error);
      throw error;
    }
  }

  async resetPassword(accessToken, newPassword) {
    try {
      // Use Supabase Auth to update password with access token
      const { data, error } = await supabaseAdmin.auth.updateUser(
        accessToken, 
        { password: newPassword }
      );

      if (error) {
        logger.error('Supabase password update error:', error);
        throw new Error('Failed to update password: ' + error.message);
      }

      // Update the last updated timestamp in user_profiles table
      if (data.user) {
        await supabaseAdmin
          .from('user_profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', data.user.id);
      }

      return { 
        success: true, 
        message: 'Password reset successfully',
        user: data.user
      };
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }

  // Add new method for token-based password reset
  async resetPasswordWithToken(resetToken, newPassword) {
    try {
      // First verify the reset token and get user session
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.verifyOtp({
        token_hash: resetToken,
        type: 'recovery'
      });

      if (sessionError) {
        logger.error('Invalid or expired reset token:', sessionError);
        throw new Error('Invalid or expired reset token');
      }

      // Update password using the verified session
      const { data, error } = await supabaseAdmin.auth.updateUser(
        sessionData.user.id,
        { password: newPassword }
      );

      if (error) {
        logger.error('Password update error:', error);
        throw new Error('Failed to update password');
      }

      // Update timestamp in user_profiles table
      await supabaseAdmin
        .from('user_profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', data.user.id);

      return { 
        success: true, 
        message: 'Password reset successfully'
      };
    } catch (error) {
      logger.error('Token-based password reset error:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();
