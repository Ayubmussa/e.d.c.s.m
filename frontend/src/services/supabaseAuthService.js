import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG, API_CONFIG } from '../config/config';

class SupabaseAuthService {
  constructor() {
    this.currentUser = null;
    this.session = null;
    
    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      this.session = session;
      this.currentUser = session?.user || null;
      
      if (event === 'SIGNED_OUT') {
        this.clearLocalData();
      }
    });
  }

  async register(userData) {
    try {
      const { email, password, firstName, lastName, userType, dateOfBirth, phoneNumber, emergencyContact } = userData;
      
      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        throw new Error('Missing required fields: email, password, firstName, and lastName are required');
      }
      
      if (!phoneNumber) {
        throw new Error('Phone number is required for registration');
      }
      
      console.log('Starting Supabase Auth registration process...');
      console.log('Registration data received:', {
        email,
        firstName,
        lastName,
        userType,
        dateOfBirth,
        phoneNumber,
        hasEmergencyContact: !!emergencyContact,
        hasAddress: !!userData.address,
        hasMedicalConditions: !!(userData.medicalConditions && userData.medicalConditions.length > 0)
      });
      
      // Step 1: Register user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            user_type: userType,
            date_of_birth: dateOfBirth,
            phone_number: phoneNumber,
            emergency_contact: emergencyContact,
            address: userData.address || null,
            medical_conditions: userData.medicalConditions || [],
            full_name: `${firstName} ${lastName}`,
            display_name: `${firstName} ${lastName}`
          }
        }
      });

      console.log('Supabase Auth signup result:', authData ? 'Success' : 'Failed');
      
      if (authError) {
        console.error('Supabase Auth signup error details:', authError);
        throw new Error(authError.message);
      }

      if (!authData?.user) {
        console.error('No user data returned from Supabase Auth signup');
        throw new Error('Failed to create user account');
      }
      
      const userId = authData.user.id;
      console.log('User created in Auth successfully. User ID:', userId);
      
      // Step 2: Create user profile in user_profiles table
      try {
        console.log('Creating user profile in user_profiles table...');
        
        // Format emergency contact as JSONB
        let emergencyContactJson = emergencyContact || {};
        if (typeof emergencyContactJson === 'string') {
          try {
            emergencyContactJson = JSON.parse(emergencyContactJson);
          } catch (e) {
            emergencyContactJson = { notes: emergencyContactJson };
          }
        }
        
        const formattedDob = dateOfBirth || (userType === 'elderly' ? '1950-01-01' : '1980-01-01');
        
        const profileData = {
          id: userId, // References auth.users(id)
          first_name: firstName,
          last_name: lastName,
          date_of_birth: formattedDob,
          phone_number: phoneNumber || '',
          emergency_contact: emergencyContactJson,
          address: userData.address || null, // Include address if provided
          medical_conditions: userData.medicalConditions || [], // Include medical conditions if provided
          user_type: userType || 'elderly',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('User profile data being inserted:', profileData);
        
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .insert([profileData])
          .select('*')
          .single();

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          console.error('Profile data that failed to insert:', profileData);
          // If profile creation fails, we should clean up the auth user
          await supabase.auth.signOut();
          throw new Error('Failed to create user profile: ' + profileError.message);
        } else {
          console.log('Successfully created user profile:', profile);
          console.log('All registration data saved successfully to user_profiles table');
        }
      } catch (dbError) {
        console.error('Exception during user_profiles table operation:', dbError);
        // Continue despite this error - we've successfully created the auth user
      }
      
      // Step 3: Create a user object for the app
      const user = {
        id: userId,
        email: email,
        firstName: firstName,
        lastName: lastName,
        fullName: `${firstName} ${lastName}`,
        userType: userType || 'elderly',
        dateOfBirth: dateOfBirth || (userType === 'elderly' ? '1950-01-01' : '1980-01-01'),
        phoneNumber: phoneNumber || '',
        emergencyContact: emergencyContact || {},
        address: userData.address || null,
        medicalConditions: userData.medicalConditions || [],
        isActive: true,
        createdAt: authData.user.created_at || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Registration process completed, returning user data');
      console.log('Session data available:', authData.session ? 'Yes' : 'No');
      
      // Step 4: Handle email confirmation if required
      if (!authData.session) {
        console.log('No session returned - email confirmation likely required');
        return {
          success: true,
          requiresEmailConfirmation: true,
          data: {
            user: user,
            session: null
          }
        };
      }
      
      // Store user data in AsyncStorage
      if (authData.session?.access_token) {
        await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN, authData.session.access_token);
      }
      await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      
      return {
        success: true,
        data: {
          user: user,
          session: authData.session
        }
      };
    } catch (error) {
      console.error('Registration error (detailed):', error);
      
      // Provide more specific error messages for common issues
      let errorMessage = error.message;
      
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        errorMessage = 'This email is already registered. Please use a different email address or try logging in.';
      } else if (error.message.includes('password')) {
        errorMessage = 'Password error: ' + error.message;
      } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (error.message === 'Database error saving new user') {
        // This specific error comes from Supabase when there's an issue with the database trigger
        errorMessage = 'Unable to create user account. Please try again or contact support if the issue persists.';
      }
      
      return {
        success: false,
        error: errorMessage || 'An unexpected error occurred during registration'
      };
    }
  }

  async login(email, password) {
    try {
      console.log('Logging in with Supabase Auth...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase Auth login error:', error);
        throw new Error(error.message);
      }

      console.log('Supabase Auth login successful');
      
      const token = data.session?.access_token;
      if (!token) {
        throw new Error('No auth token received from login');
      }

      // Fetch user profile from user_profiles table if possible, otherwise use metadata
      let userData;
      try {
        console.log('Fetching user profile from user_profiles table...');
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!profileError && userProfile) {
          console.log('User profile found in user_profiles table');
          userData = {
            id: data.user.id,
            email: data.user.email,
            ...userProfile,
            userType: userProfile?.user_type,
            firstName: userProfile?.first_name,
            lastName: userProfile?.last_name,
            dateOfBirth: userProfile?.date_of_birth,
            phoneNumber: userProfile?.phone_number,
          };
        } else {
          console.log('User profile not found in user_profiles table, error:', profileError);
        }
      } catch (profileError) {
        console.error('Error fetching user profile:', profileError);
      }

      // If we couldn't get the profile, create a user object from auth metadata
      if (!userData) {
        console.log('Creating user object from auth metadata');
        const metadata = data.user.user_metadata || {};
        userData = {
          id: data.user.id,
          email: data.user.email,
          firstName: metadata.first_name,
          lastName: metadata.last_name,
          userType: metadata.user_type,
          dateOfBirth: metadata.date_of_birth,
          phoneNumber: metadata.phone_number,
          createdAt: data.user.created_at
        };
        
        // Try to create a user profile if they're not there (migration case)
        try {
          console.log('User profile not found, attempting to create from auth metadata...');
          const profileData = {
            id: data.user.id,
            first_name: metadata.first_name || '',
            last_name: metadata.last_name || '',
            date_of_birth: metadata.date_of_birth || new Date().toISOString().split('T')[0],
            phone_number: metadata.phone_number || '',
            emergency_contact: {},
            user_type: metadata.user_type || 'elderly',
            is_active: true
          };
          
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert([profileData])
            .select('*')
            .single();
          
          if (createError) {
            console.error('Error creating user profile during login:', createError);
          } else {
            console.log('Successfully created user profile during login');
            // Update userData with the new profile
            userData = {
              id: data.user.id,
              email: data.user.email,
              ...newProfile,
              userType: newProfile.user_type
            };
          }
        } catch (createError) {
          console.error('Exception during user profile creation in login:', createError);
        }
      }

      // Store user data locally
      console.log('Storing user data in AsyncStorage');
      await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);

      return {
        success: true,
        data: {
          user: userData,
          token: token,
          session: data.session
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
      }
      
      await this.clearLocalData();
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      await this.clearLocalData(); // Clear local data even if signOut fails
      return { success: false, error: error.message };
    }
  }

  async clearLocalData() {
    try {
      await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
      this.currentUser = null;
      this.session = null;
    } catch (error) {
      console.error('Error clearing local data:', error);
    }
  }

  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw new Error(error.message);
      }
      
      this.session = data.session;
      return data.session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  async getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data.user) {
        // Try to fetch user profile from user_profiles table
        try {
          console.log('=== GET CURRENT USER ===');
          console.log('Fetching user profile for ID:', data.user.id);
          
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (!profileError && userProfile) {
            console.log('User profile found:', userProfile);
            console.log('Profile image from DB:', userProfile.profile_image);
            
            const userObject = {
              id: data.user.id,
              email: data.user.email,
              ...userProfile,
              userType: userProfile?.user_type,
              profileImage: userProfile?.profile_image
            };
            
            console.log('Returning user object:', userObject);
            return userObject;
          } else {
            console.log('Profile error or no profile found:', profileError);
          }
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError);
        }
        
        // If we couldn't get the profile or it doesn't exist, create a user object from auth metadata
        const metadata = data.user.user_metadata || {};
        return {
          id: data.user.id,
          email: data.user.email,
          firstName: metadata.first_name,
          lastName: metadata.last_name,
          userType: metadata.user_type,
          dateOfBirth: metadata.date_of_birth,
          phoneNumber: metadata.phone_number,
          createdAt: data.user.created_at
        };
      }
      
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async updateProfile(profileData) {
    try {
      const user = await this.getCurrentUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      // First update the user metadata in Auth
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: profileData.firstName || user.firstName,
          last_name: profileData.lastName || user.lastName,
          date_of_birth: profileData.dateOfBirth || user.dateOfBirth,
          phone_number: profileData.phoneNumber || user.phoneNumber,
          user_type: profileData.userType || user.userType
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // Update the user_profiles table
      try {
        const updateData = {
          first_name: profileData.firstName || user.firstName,
          last_name: profileData.lastName || user.lastName,
          date_of_birth: profileData.dateOfBirth || user.dateOfBirth,
          phone_number: profileData.phoneNumber || user.phoneNumber,
          user_type: profileData.userType || user.userType,
          updated_at: new Date().toISOString()
        };
        
        // Add profile_image if provided
        if (profileData.profileImage) {
          updateData.profile_image = profileData.profileImage;
        }
        
        console.log('Updating user_profiles table with data:', updateData);
        
        const { data, error } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('id', user.id)
          .select('*')
          .single();

        if (error) {
          console.log('Error updating profile in user_profiles table:', error);
          throw new Error('Failed to update profile: ' + error.message);
        }

        console.log('Successfully updated user_profiles table:', data);

        // Return the updated profile data
        return {
          success: true,
          data: {
            user: {
              id: user.id,
              email: user.email,
              ...data,
              userType: data.user_type,
              profileImage: data.profile_image
            }
          }
        };
      } catch (profileError) {
        console.error('Error updating profile in user_profiles table:', profileError);
        throw profileError;
      }

      // Update local storage with updated user
      const updatedUser = { 
        ...user, 
        ...profileData,
        // Convert fields to match the expected format
        firstName: profileData.firstName || user.firstName,
        lastName: profileData.lastName || user.lastName,
        dateOfBirth: profileData.dateOfBirth || user.dateOfBirth,
        phoneNumber: profileData.phoneNumber || user.phoneNumber,
        userType: profileData.userType || user.userType,
        profileImage: profileData.profileImage || user.profileImage
      };
      
      console.log('Saving updated user to local storage:', updatedUser);
      await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));

      return {
        success: true,
        data: {
          user: updatedUser
        }
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async changePassword(newPassword) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async forgotPassword(email) {
    try {
      console.log('Requesting password reset via backend API for:', email);
      
      // Use the backend API instead of calling Supabase directly
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle rate limit gracefully
        if (response.status === 429 || data.error?.includes('rate limit')) {
          console.log('Rate limit hit, but returning helpful message to user');
          return {
            success: true,
            message: 'If you recently requested a password reset, please check your email for the reset link. Due to security limits, we can only send one reset email every few minutes.',
            rateLimited: true
          };
        }
        throw new Error(data.error || 'Failed to send password reset email');
      }

      if (data.success) {
        console.log('Password reset email request successful');
        return {
          success: true,
          message: data.message || 'Password reset email sent successfully. Please check your email.',
          data: data.data,
          rateLimited: data.rateLimited || false
        };
      } else {
        throw new Error(data.error || 'Failed to send password reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      // If it's a rate limit error, return success anyway
      if (error.message && (error.message.toLowerCase().includes('rate limit') || error.message.includes('429'))) {
        console.log('Rate limit error caught, returning success to user');
        return {
          success: true,
          message: 'If you recently requested a password reset, please check your email for the reset link. Due to security limits, we can only send one reset email every few minutes.',
          rateLimited: true
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async resetPassword(accessToken, newPassword) {
    // Always send accessToken and newPassword for password reset
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }
      if (data.success) {
        return {
          success: true,
          message: data.message || 'Password reset successfully',
          data: data.data
        };
      } else {
        throw new Error(data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Add new method for token-based password reset
  async resetPasswordWithToken(resetToken, newPassword) {
    try {
      console.log('Resetting password with token via backend API...');
      
      // Use the backend API for token-based password reset
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/reset-password-with-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          resetToken, 
          newPassword 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      if (data.success) {
        console.log('Password reset with token successful');
        return {
          success: true,
          message: data.message || 'Password reset successfully',
          data: data.data
        };
      } else {
        throw new Error(data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password with token error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get the current session token
  getAuthToken() {
    return this.session?.access_token || null;
  }

  // Set auth token (for compatibility)
  setAuthToken(token) {
    // This is handled automatically by Supabase
    console.log('Token management is handled by Supabase');
  }

  // Clear auth token (for compatibility)
  clearAuthToken() {
    // This is handled by logout
    this.logout();
  }

  async resetPassword(accessToken, newPassword, userId) {
    // If userId is provided, send only userId and newPassword for admin password change
    if (userId) {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, newPassword }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to reset password');
        }
        if (data.success) {
          return {
            success: true,
            message: data.message || 'Password reset successfully',
            data: data.data
          };
        } else {
          throw new Error(data.error || 'Failed to reset password');
        }
      } catch (error) {
        console.error('Reset password error (admin):', error);
        return {
          success: false,
          error: error.message
        };
      }
    } else {
      // Use accessToken for reset link flow
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accessToken, newPassword }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to reset password');
        }
        if (data.success) {
          return {
            success: true,
            message: data.message || 'Password reset successfully',
            data: data.data
          };
        } else {
          throw new Error(data.error || 'Failed to reset password');
        }
      } catch (error) {
        console.error('Reset password error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    }
  }
}

export default new SupabaseAuthService();
