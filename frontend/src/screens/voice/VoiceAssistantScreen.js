// Helper to extract token from user object and context
function getUserToken(user, token) {
  return (
    token ||
    user?.access_token ||
    user?.token ||
    user?.jwt ||
    user?.session_token ||
    user?.idToken
  );
}
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText, ThemedHeading, ThemedCardTitle } from '../../components/common/ThemedText';
import { CustomButton } from '../../components/common/CustomButton';
import { WellnessCard } from '../../components/common/CustomCards';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import voiceService from '../../services/voiceService';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function VoiceAssistantScreen({ navigation }) {
  const { user, token } = useAuth();
  // Extract token for debug display
  const extractedToken = getUserToken(user, token);
  // Setup Supabase client
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const insets = useSafeAreaInsets();
  const recordingOptions = {
    android: {
      extension: '.wav',
      outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_PCM_16BIT,
      audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM_16BIT,
      sampleRate: 44100,
      numberOfChannels: 1,
      bitRate: 128000,
    },
    ios: {
      extension: '.wav',
      audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
      sampleRate: 44100,
      numberOfChannels: 1,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {
      mimeType: 'audio/wav',
      bitsPerSecond: 128000,
    }
  };

  const startRecording = async () => {
    try {
      console.log('[VoiceAssistantScreen] startRecording called. User:', user);
      if (permissionResponse.status !== 'granted') {
        const permission = await requestPermission();
        if (permission.status !== 'granted') {
          Alert.alert('Permission Required', 'Microphone permission is required for voice commands.');
          return;
        }
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
      setIsListening(true);
      console.log('[VoiceAssistantScreen] Recording started:', recording);
    } catch (error) {
      console.error('[VoiceAssistantScreen] Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start voice recording');
    }
  };

  // Process voice input after recording
const processVoiceInput = async (audioUri) => {
  try {
    console.log('[VoiceAssistantScreen] processVoiceInput called with audioUri:', audioUri);
    setConversation(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      text: '[Voice Input]',
      timestamp: new Date(),
    }]);
    let response;
    try {
      const tokenToUse = getUserToken(user, token);
      console.log('[VoiceAssistantScreen] Extracted token:', tokenToUse);
      if (!tokenToUse) {
        Alert.alert('Authentication Error', 'No authentication token found. Please log in again.');
        setIsProcessing(false);
        return;
      }
      if (!audioUri || typeof audioUri !== 'string' || !audioUri.startsWith('file://')) {
        console.error('[VoiceAssistantScreen] Invalid or missing audio URI:', audioUri);
        Alert.alert('Error', 'Invalid or missing audio file. Please try recording again.');
        setIsProcessing(false);
        return;
      }
      console.log('[VoiceAssistantScreen] Sending audio to backend:', { audioUri, tokenToUse });
      response = await voiceService.processVoiceCommand(audioUri, tokenToUse);
      console.log('[VoiceAssistantScreen] Backend response:', response);
      // Check backend response and notify user
      if (response && response.success) {
        console.log('[VoiceAssistantScreen] Voice successfully processed by backend:', response);
        Alert.alert('Success', 'Voice command sent and processed by backend.');
      } else {
        console.error('[VoiceAssistantScreen] Backend did not process voice:', response);
        Alert.alert('Error', 'Voice command was not processed by backend.');
      }
    } catch (error) {
      console.error('[VoiceAssistantScreen] Error in processVoiceInput:', error);
      // Axios error handling
      if (error.response) {
        // Backend responded with error
        if (error.response.status === 401 || error.response.status === 403) {
          Alert.alert('Authentication Error', 'Access denied. Invalid or missing token. Please log in again.');
        } else {
          const backendMsg = error.response.data?.message || error.response.data?.error || JSON.stringify(error.response.data);
          Alert.alert('Backend Error', backendMsg);
        }
        console.error('[VoiceAssistantScreen] Backend error:', error.response);
      } else if (error.request) {
        // No response from backend
        Alert.alert('Network Error', 'No response from backend. Please check your connection.');
        console.error('[VoiceAssistantScreen] Network error:', error.request);
      } else {
        // Other error
        Alert.alert('Error', error.message || 'Failed to connect to backend.');
        console.error('[VoiceAssistantScreen] General error:', error);
      }
      setIsProcessing(false);
      return;
    }
    if (!response) {
      throw new Error('No response from the backend.');
    }
    // Update the last user message to show the transcription
    if (response.transcription) {
      setConversation(prev => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].type === 'user' && updated[i].text === '[Voice Input]') {
            updated[i] = { ...updated[i], text: response.transcription };
            break;
          }
        }
        // Add assistant message as before
        return [
          ...updated,
          {
            id: Date.now() + 1,
            type: 'assistant',
            text: response.transcription || response.response || 'Command processed successfully',
            timestamp: new Date(),
            action: response.action,
          }
        ];
      });
    } else {
      setConversation(prev => [...prev, {
        id: Date.now() + 1,
        type: 'assistant',
        text: response.response || 'Command processed successfully',
        timestamp: new Date(),
        action: response.action,
      }]);
    }
    if (response.response) {
      Speech.speak(response.response, {
        language: 'en',
        rate: 0.8,
        pitch: 1.0,
      });
    }
    if (response.action) {
      executeVoiceAction(response.action);
    }
    if (response.suggestions?.length > 0) {
      setConversation(prev => [
        ...prev,
        {
          id: Date.now() + 2,
          type: 'assistant',
          text: 'You can also try:',
          timestamp: new Date(),
          suggestions: response.suggestions
        }
      ]);
    }
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  } catch (error) {
    console.error('[VoiceAssistantScreen] Error processing voice input:', error);
    Alert.alert('Error', error.message || 'Failed to process voice input');
  } finally {
    setIsProcessing(false);
  }
};

const stopRecording = async () => {
  if (!recording) return;
  try {
    setIsListening(false);
    setIsProcessing(true);
    await recording.stopAndUnloadAsync();
    const status = await recording.getStatusAsync();
    console.log('[VoiceAssistantScreen] Recording duration (ms):', status.durationMillis);
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    const uri = recording.getURI();
    console.log('[VoiceAssistantScreen] Recording URI:', uri, 'Type:', typeof uri);
    setRecording(null);
    if (!uri || typeof uri !== 'string') {
      console.error('[VoiceAssistantScreen] Invalid recording URI:', uri);
      Alert.alert('Error', 'Failed to get valid audio file URI.');
      setIsProcessing(false);
      return;
    }
    await processVoiceInput(uri);
  } catch (error) {
    console.error('[VoiceAssistantScreen] Failed to stop recording:', error);
    Alert.alert('Error', 'Failed to process voice input');
    setIsProcessing(false);
  }
};

  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [recording, setRecording] = useState(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef(null);

  useEffect(() => {
    // Add welcome message on mount
    setConversation([
      {
        id: Date.now(),
        type: 'assistant',
        text: "Hello! I'm your voice assistant. You can ask me about your medications, health check-ins, emergency contacts, or general health questions. How can I help you today?",
        timestamp: new Date(),
      }
    ]);
  }, []);

  const executeVoiceAction = (action) => {
    switch (action) {
      case 'trigger_emergency':
        navigation.navigate && navigation.navigate('Emergency');
        break;
      case 'call_emergency_contact':
        (async () => {
          try {
            const userId = user?.id || user?.user_id;
            if (!userId) {
              Alert.alert('Error', 'User not authenticated.');
              return;
            }
            const { data, error } = await supabase
              .from('emergency_contacts')
              .select('phone')
              .eq('user_id', userId)
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(1);
            if (error || !data || data.length === 0) {
              Alert.alert('Error', 'No emergency contact found.');
              return;
            }
            const emergencyPhone = data[0].phone;
            if (emergencyPhone) {
              Linking.openURL(`tel:${emergencyPhone}`);
            } else {
              Alert.alert('Error', 'Emergency contact does not have a phone number.');
            }
          } catch (err) {
            Alert.alert('Error', 'Failed to fetch emergency contact.');
          }
        })();
        break;
      case 'medication_reminder':
        navigation.navigate && navigation.navigate('MainTabs', { screen: 'Medications' });
        break;
      case 'health_checkin_initiated':
        navigation.navigate && navigation.navigate('HealthCheckin');
        break;
      case 'start_brain_training':
        navigation.navigate && navigation.navigate('MainTabs', { screen: 'Brain' });
        break;
      case 'show_help':
        Alert.alert('Help', 'I can help you with emergencies, medications, health check-ins, and brain training. Try asking about any of these topics!');
        break;
      default:
        // For unknown or general actions, do nothing or show a generic message
        break;
    }
  // Dummy function to get current user ID. Replace with your actual auth logic.
  };

  const quickCommands = [
    {
      text: "What medications do I need to take today?",
      icon: "pill",
      color: theme.colors.primary,
    },
    {
      text: "Show my health history",
      icon: "heart",
      color: theme.colors.secondary,
    },
    {
      text: "Start a health check-in",
      icon: "clipboard-check",
      color: theme.colors.success || theme.colors.primary,
    },
    {
      text: "What's my medication schedule?",
      icon: "clock",
      color: theme.colors.warning || theme.colors.secondary,
    },
    {
      text: "Call my emergency contact",
      icon: "phone",
      color: theme.colors.error,
    },
    {
      text: "Help me with brain training",
      icon: "brain",
      color: theme.colors.primary,
    },
  ];

  const handleQuickCommand = async (commandText) => {
    try {
      setIsProcessing(true);
      
      const userMessage = {
        id: Date.now(),
        type: 'user',
        text: commandText,
        timestamp: new Date(),
      };

      setConversation(prev => [...prev, userMessage]);

      // Always extract token using helper
      const tokenToUse = getUserToken(user, token);
      if (!tokenToUse) {
        Alert.alert('Authentication Error', 'No authentication token found. Please log in again.');
        setIsProcessing(false);
        return;
      }
      const response = await voiceService.processTextCommand({ text: commandText }, tokenToUse);

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        text: response.response,
        timestamp: new Date(),
        action: response.action,
      };

      setConversation(prev => [...prev, assistantMessage]);

      // Speak the response
      Speech.speak(response.response, {
        language: 'en',
        rate: 0.8,
        pitch: 1.0,
      });

      // Execute any actions
      if (response.action) {
        executeVoiceAction(response.action);
      }

      // Navigate to Health tab if quick command is 'Show my health history'
      if (commandText === 'Show my health history') {
        navigation.navigate && navigation.navigate('MainTabs', { screen: 'Health' });
      }
      // Navigate to Brain tab if quick command is 'Help me with brain training'
      if (commandText === 'Help me with brain training') {
        navigation.navigate && navigation.navigate('MainTabs', { screen: 'Brain' });
      }

      // Show suggestions as quick actions if present
      if (response.suggestions && Array.isArray(response.suggestions) && response.suggestions.length > 0) {
        // Add suggestions to conversation as assistant message
        setConversation(prev => [
          ...prev,
          {
            id: Date.now() + 2,
            type: 'assistant',
            text: 'You can also try:',
            timestamp: new Date(),
            suggestions: response.suggestions
          }
        ]);
      }

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Error processing command:', error);
      Alert.alert('Error', 'Failed to process command');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.assistantMessage
        ]}
      >
        <View style={[styles.chatBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <ThemedText
            variant="bodyLarge"
            style={[
              styles.chatText,
              isUser ? styles.userText : styles.assistantText
            ]}
          >
            {message.text}
          </ThemedText>
          <ThemedText
            variant="bodySmall"
            style={[
              styles.timestampText,
              isUser ? styles.userTimestamp : styles.assistantTimestamp
            ]}
          >
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Debug Token Display - Remove in production! 
      <View style={{ padding: 8, backgroundColor: '#fffbe6', borderBottomWidth: 1, borderColor: '#ffe58f' }}>
        <ThemedText variant="bodySmall" style={{ color: '#ad8b00', fontSize: 12 }}>
          <MaterialCommunityIcons name="key" size={16} color="#ad8b00" /> Token: {extractedToken ? extractedToken : 'No token found'}
        </ThemedText>
      </View>*/}
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }] }>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="microphone" size={48} color={theme.colors.primary} style={styles.headerIcon} />
          <View style={styles.headerText}>
            <ThemedHeading level={3} style={styles.headerTitle}>
              Voice Assistant
            </ThemedHeading>
            <ThemedText variant="bodyLarge" color="secondary" style={styles.headerSubtitle}>
              {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Ready to help'}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Conversation */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.conversationContainer}
        contentContainerStyle={styles.conversationContent}
        showsVerticalScrollIndicator={false}
      >
        {conversation.map(renderMessage)}
        
        {isProcessing && (
          <View style={styles.processingContainer}>
            <View style={styles.processingBubble}>
              <ThemedText variant="bodyMedium" style={styles.processingText}>
                Processing your request...
              </ThemedText>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Commands */}
      {conversation.length <= 1 && (
        <View style={styles.quickCommandsContainer}>
          <ThemedHeading level={3} style={styles.quickCommandsTitle}>
            Try saying:
          </ThemedHeading>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.quickCommandsList}>
              {quickCommands.map((command, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleQuickCommand(command.text)}
                  style={[styles.quickCommandChip, { borderColor: command.color }]}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons name={command.icon} size={20} color={command.color} />
                  <ThemedText variant="bodyMedium" style={[styles.quickCommandText, { color: command.color }]}>
                    {command.text}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Voice Control Button */}
      <View style={styles.voiceControlContainer}>
        <Animated.View style={[styles.voiceButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            onPress={isListening ? stopRecording : startRecording}
            disabled={isProcessing}
            style={[
              styles.voiceButton,
              {
                backgroundColor: isListening 
                  ? theme.colors.error 
                  : isProcessing 
                    ? theme.colors.secondary 
                    : theme.colors.primary,
              }
            ]}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons 
              name={isListening ? "microphone" : isProcessing ? "cog" : "microphone"} 
              size={48} 
              color={theme.colors.surface} 
            />
          </TouchableOpacity>
        </Animated.View>
        
        <ThemedText variant="bodyLarge" style={styles.voiceButtonLabel}>
          {isListening 
            ? 'Tap to stop listening' 
            : isProcessing 
              ? 'Processing...' 
              : 'Tap and speak'
          }
        </ThemedText>
      </View>

      {/* Help Text */}
      <WellnessCard style={styles.helpCard}>
        <ThemedText variant="bodyMedium" style={styles.helpText}>
          Voice commands can help you with medications, health check-ins, emergency contacts, and navigation.
        </ThemedText>
      </WellnessCard>
    </SafeAreaView>
  );
}

const createStyles = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 16,
      elevation: 2,
      backgroundColor: theme.colors.surface,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerIcon: {
      marginRight: 12,
    },
    headerText: {
      flex: 1,
    },
    headerTitle: {
      fontWeight: 'bold',
    },
    headerSubtitle: {
      color: theme.colors.text.secondary,
    },
    conversationContainer: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    conversationContent: {
      paddingBottom: theme.spacing.lg,
    },
    messageContainer: {
      marginBottom: theme.spacing.sm,
    },
    userMessage: {
      alignSelf: 'flex-end',
    },
    assistantMessage: {
      alignSelf: 'flex-start',
    },
    chatBubble: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      maxWidth: '80%',
    },
    userBubble: {
      backgroundColor: theme.colors.primary,
      alignSelf: 'flex-end',
    },
    assistantBubble: {
      backgroundColor: theme.colors.surfaceVariant,
      alignSelf: 'flex-start',
    },
    chatText: {
      fontSize: theme.typography.body1.fontSize,
      color: theme.colors.text.primary,
    },
    userText: {
      color: theme.colors.buttonText,
    },
    assistantText: {
      color: theme.colors.text.primary,
    },
    timestampText: {
      marginTop: 4,
      opacity: 0.7,
      color: theme.colors.onSurface,
    },
    userTimestamp: {
      color: theme.colors.onPrimary,
    },
    assistantTimestamp: {
      color: theme.colors.onSurface,
    },
    processingContainer: {
      alignSelf: 'flex-start',
      marginBottom: theme.spacing.lg,
    },
    processingBubble: {
      borderRadius: theme.roundness,
      elevation: 2,
      backgroundColor: theme.colors.surfaceVariant,
      padding: theme.spacing.lg,
    },
    processingText: {
      fontStyle: 'italic',
    },
    quickCommandsContainer: {
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    quickCommandsTitle: {
      fontWeight: 'bold',
      marginBottom: theme.spacing.md,
    },
    quickCommandsList: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    quickCommandChip: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.roundness,
      borderWidth: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderColor: theme.colors.primary,
    },
    quickCommandText: {
      marginLeft: theme.spacing.sm,
    },
    voiceControlContainer: {
      alignItems: 'center',
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    voiceButtonContainer: {
      width: 80,
      height: 80,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 40,
      backgroundColor: theme.colors.primary,
      elevation: 4,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    voiceButton: {
      width: 60,
      height: 60,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 30,
    },
    voiceButtonLabel: {
      marginTop: theme.spacing.sm,
      textAlign: 'center',
      color: theme.colors.onSurface,
    },
    helpCard: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    helpText: {
      textAlign: 'center',
      color: theme.colors.onSurface,
    },
  });
};
