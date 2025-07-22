import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration - Multiple fallback sources
let supabaseUrl, supabaseAnonKey;

try {
  // Try expo-constants first (for production builds)
  const Constants = require('expo-constants').default;
  supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
  supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;
} catch (error) {
  console.log('expo-constants not available, using environment variables');
}

// Fallback to environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  supabaseUrl = 
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL; // Hardcoded fallback for development

  supabaseAnonKey = 
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY }

console.log('Supabase Config Debug:');
console.log('URL:', supabaseUrl);
console.log('Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration!');
  console.error('Available env keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  throw new Error('Missing required Supabase configuration');
}

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Enable this for deep link handling
  },
});

console.log('✅ Supabase client created successfully');

export default supabase;
