import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';
import geofencingService from '../services/geofencingService';
import { supabase } from '../config/supabase';
import { APP_CONFIG } from '../config/config';

const AuthContext = createContext();

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  error: null,
};

const authReducer = (state, action) => {
  // Debug: log every action and payload
  console.log('[AuthContext][Reducer] Action:', action.type, 'Payload:', action.payload);
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  // Debug: log state after every dispatch
  React.useEffect(() => {
    console.log('[AuthContext][Provider] State:', state);
  }, [state]);

  // Listen to Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase auth state changed:', event, session);
      
      if (event === 'SIGNED_IN' && session) {
        // User signed in
        const user = await authService.getCurrentUser();
        if (user) {
          await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN, session.access_token);
          await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
          
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user, token: session.access_token },
          });
          
          // Start geofencing for authenticated users
          try {
            const geofencingResult = await geofencingService.startLocationTracking();
            if (geofencingResult.success) {
              console.log('Geofencing started successfully');
            } else {
              console.warn('Failed to start geofencing:', geofencingResult.error);
            }
          } catch (error) {
            console.warn('Error starting geofencing:', error);
          }
          
          console.log('User signed in, will trigger notification refresh');
          // We don't need to manually load notifications here as the NotificationContext
          // has a useEffect hook that watches for isAuthenticated changes
        }
      } else if (event === 'SIGNED_OUT') {
        // User signed out
        // Stop geofencing before removing token so reset-status has a valid token
        await geofencingService.stopLocationTracking();
        await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
        dispatch({ type: 'LOGOUT' });
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Token refreshed
        await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN, session.access_token);
        dispatch({ type: 'UPDATE_USER', payload: { token: session.access_token } });
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
    });

    // Check for existing session on app start
    checkStoredAuth();

    return () => subscription.unsubscribe();
  }, []);

  const checkStoredAuth = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      // Get current session from Supabase
      const session = await authService.getSession();
      console.log('[AuthContext][checkStoredAuth] Session:', session);
      if (session && session.user) {
        const user = await authService.getCurrentUser();
        console.log('[AuthContext][checkStoredAuth] User:', user);
        if (user) {
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user, token: session.access_token },
          });
          
          // Start geofencing for authenticated users
          try {
            const geofencingResult = await geofencingService.startLocationTracking();
            if (geofencingResult.success) {
              console.log('Geofencing started successfully');
            } else {
              console.warn('Failed to start geofencing:', geofencingResult.error);
            }
          } catch (error) {
            console.warn('Error starting geofencing:', error);
          }
          
          console.log('User restored from stored session, will trigger notification refresh');
          // NotificationContext will refresh notifications due to isAuthenticated change
        }
      }
    } catch (error) {
      console.error('Error checking stored auth:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authService.login(email, password);
      console.log('[AuthContext][login] Response:', response);
      if (response.success) {
        const { user, token } = response.data;
        console.log('[AuthContext][login] User:', user, 'Token:', token);
        // Save token to AsyncStorage for API requests
        if (token) {
          await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
        }
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token },
        });
        
        // Start geofencing for authenticated users
        try {
          const geofencingResult = await geofencingService.startLocationTracking();
          if (geofencingResult.success) {
            console.log('Geofencing started successfully after login');
          } else {
            console.warn('Failed to start geofencing after login:', geofencingResult.error);
          }
        } catch (error) {
          console.warn('Error starting geofencing after login:', error);
        }
        
        console.log('User logged in via credentials, will trigger notification refresh');
        // NotificationContext will refresh notifications due to isAuthenticated change
        
        return { success: true };
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      console.log('AuthContext register called with:', userData);
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('Attempting to call authService.register');
      const response = await authService.register(userData);
      console.log('[AuthContext][register] Response:', response);
      if (response.success) {
        const { user, session, token: backendToken } = response.data;
        // Prefer session token, fallback to backend token
        const token = session?.access_token || backendToken || null;
        console.log('[AuthContext][register] User:', user, 'Token:', token);
        // Store auth data even if token is null (for post-registration navigation)
        await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        if (token) {
          await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
          const storedToken = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
          console.log('[AuthContext] Token stored in AsyncStorage:', storedToken);
        } else {
          console.warn('[AuthContext] No token to store after registration/login');
        }
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token },
        });
        return { success: true };
      } else {
        // Enhanced error handling
        const errorMessage = response.error || 'Registration failed';
        console.error('Registration error in AuthContext:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Registration error:', error);
      // Check for common Supabase errors and provide user-friendly messages
      let userMessage = error.message;
      if (error.message.includes('duplicate key')) {
        userMessage = 'An account with this email already exists. Please try logging in instead.';
      } else if (error.message.includes('password')) {
        userMessage = 'Password error: ' + error.message;
      }
      dispatch({ type: 'SET_ERROR', payload: userMessage });
      return { success: false, error: userMessage };
    }
  };

  const logout = async () => {
    try {
      // Stop geofencing (reset zone status) BEFORE clearing tokens
      await geofencingService.stopLocationTracking();

      // Now clear stored data
      await AsyncStorage.multiRemove([
        APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN,
        APP_CONFIG.STORAGE_KEYS.USER_DATA,
      ]);

      // Clear token from auth service if method exists
      if (authService.clearAuthToken) {
        authService.clearAuthToken();
      }

      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateProfile = async (updates) => {
    try {
      console.log('=== AUTH CONTEXT UPDATE PROFILE START ===');
      console.log('Updates received:', updates);
      console.log('Current user state:', state.user);
      
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authService.updateProfile(updates);
      
      console.log('Auth service response:', response);
      
      if (response.success) {
        const updatedUser = response.data.user;
        console.log('Updated user from service:', updatedUser);
        
        // Update stored user data
        await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
        console.log('User data saved to AsyncStorage');
        
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });
        console.log('UPDATE_USER action dispatched');
        
        console.log('=== AUTH CONTEXT UPDATE PROFILE SUCCESS ===');
        return { success: true };
      } else {
        console.error('Auth service returned error:', response.error);
        throw new Error(response.error || 'Profile update failed');
      }
    } catch (error) {
      console.error('=== AUTH CONTEXT UPDATE PROFILE ERROR ===');
      console.error('Error details:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };
