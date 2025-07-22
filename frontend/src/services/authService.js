import supabaseAuthService from './supabaseAuthService';

// Wrapper class to maintain compatibility with existing code
class AuthService {
  constructor() {
    this.supabaseAuth = supabaseAuthService;
  }

  setAuthToken(token) {
    return this.supabaseAuth.setAuthToken(token);
  }

  clearAuthToken() {
    return this.supabaseAuth.clearAuthToken();
  }

  getAuthToken() {
    return this.supabaseAuth.getAuthToken();
  }

  async register(userData) {
    // Call backend API instead of Supabase directly
    try {
      const apiService = (await import('./apiService')).default;
      const response = await apiService.post('/api/auth/register', userData);
      return {
        success: response.success,
        message: response.message,
        data: response.data,
        error: response.error || null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Registration failed. Please try again.'
      };
    }
  }

  async login(email, password) {
    return await this.supabaseAuth.login(email, password);
  }

  async logout() {
    return await this.supabaseAuth.logout();
  }

  async refreshToken(refreshToken) {
    // Supabase handles token refresh automatically
    const session = await this.supabaseAuth.getSession();
    if (session) {
      return {
        success: true,
        data: {
          token: session.access_token,
          refreshToken: session.refresh_token
        }
      };
    }
    return {
      success: false,
      error: 'No active session'
    };
  }

  async getProfile() {
    const user = await this.supabaseAuth.getCurrentUser();
    if (user) {
      return {
        success: true,
        data: user
      };
    }
    return {
      success: false,
      error: 'No authenticated user'
    };
  }

  async updateProfile(profileData) {
    return await this.supabaseAuth.updateProfile(profileData);
  }

  async changePassword(currentPassword, newPassword) {
    // Note: Supabase doesn't require current password for authenticated users
    return await this.supabaseAuth.changePassword(newPassword);
  }

  async forgotPassword(email) {
    return await this.supabaseAuth.forgotPassword(email);
  }

  async resetPassword(token, newPassword, userId) {
    // Pass all arguments to supabaseAuthService
    return await this.supabaseAuth.resetPassword(token, newPassword, userId);
  }

  async resetPasswordWithToken(resetToken, newPassword) {
    return await this.supabaseAuth.resetPasswordWithToken(resetToken, newPassword);
  }

  // New methods specific to Supabase
  async getCurrentUser() {
    return await this.supabaseAuth.getCurrentUser();
  }

  async getSession() {
    return await this.supabaseAuth.getSession();
  }
}

export default new AuthService();
