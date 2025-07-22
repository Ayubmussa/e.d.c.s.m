import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, APP_CONFIG } from '../config/config';
import { supabase } from '../config/supabase';

// Simple event emitter for global events
class SimpleEventEmitter {
  constructor() {
    this.events = {};
  }
  on(event, listener) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
  }
  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }
  emit(event, ...args) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(...args));
  }
}

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.eventEmitter = new SimpleEventEmitter();
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, clear storage and emit logout event
          await AsyncStorage.multiRemove([
            APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN,
            APP_CONFIG.STORAGE_KEYS.USER_DATA,
          ]);
          // Emit a global event to trigger navigation to login
          this.eventEmitter.emit('logout');
        }
        return Promise.reject(error);
      }
    );
  }

  async request(method, endpoint, data = null, config = {}) {
    try {
      console.log(`Making ${method} request to:`, `${this.api.defaults.baseURL}${endpoint}`);
      console.log('Request data:', data);

      // Build request config
      const requestConfig = {
        method,
        url: endpoint,
        ...config,
        headers: {
          ...(config.headers || {}),
        },
      };

      // Only include data property if data is not null
      if (data !== null) {
        requestConfig.data = data;
      }

      // Set Authorization header before request
      let token = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        const { data: supaData } = await supabase.auth.getSession();
        token = supaData?.session?.access_token || null;
      }
      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
        console.log('[apiService] Using token for API request:', token);
      } else {
        console.warn('[apiService] No token found for API request');
      }
      // Log the final Authorization header for every request
      console.log('[apiService] Final Authorization header:', requestConfig.headers.Authorization);

      const response = await this.api(requestConfig);

      console.log('Response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('API request failed:', error);
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || 'Server error',
        status: error.response.status,
        data: error.response.data,
      };
    } else if (error.request) {
      // Network error
      return {
        message: 'Network error. Please check your connection.',
        status: 0,
      };
    } else {
      // Other error
      return {
        message: error.message || 'An unexpected error occurred',
        status: -1,
      };
    }
  }

  // HTTP methods
  get(endpoint, config = {}) {
    return this.request('GET', endpoint, null, config);
  }

  post(endpoint, data, config = {}) {
    return this.request('POST', endpoint, data, config);
  }

  put(endpoint, data, config = {}) {
    return this.request('PUT', endpoint, data, config);
  }

  delete(endpoint, config = {}) {
    return this.request('DELETE', endpoint, null, config);
  }

  // Upload file method
  async uploadFile(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    
    // Add file
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'application/octet-stream',
      name: file.name || 'file',
    });

    // Add additional data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    return this.request('POST', endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Generic API call method for compatibility
  makeApiCall(endpoint, method = 'GET', data = null, config = {}) {
    return this.request(method, endpoint, data, config);
  }
}

// Create and export singleton instance
const apiServiceInstance = new ApiService();

// Export both the instance and the makeApiCall function
export default apiServiceInstance;
export const makeApiCall = (endpoint, method = 'GET', data = null, config = {}) => {
  return apiServiceInstance.makeApiCall(endpoint, method, data, config);
};

// Export event emitter for global logout event
export const apiEvents = apiServiceInstance.eventEmitter;

// Example usage:
// import { apiEvents } from '../services/apiService';
// useEffect(() => {
//   const handleLogout = () => {
//     // Redirect to login screen
//     navigation.replace('LoginScreen');
//   };
//   apiEvents.on('logout', handleLogout);
//   return () => apiEvents.off('logout', handleLogout);
// }, []);
