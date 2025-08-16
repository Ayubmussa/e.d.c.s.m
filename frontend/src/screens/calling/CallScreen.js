import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import {
  Surface,
  IconButton,
  Text,
  Avatar,
  Card,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useTheme } from '../../context/ThemeContext';
import { callingService } from '../../services/callingService';

const { width, height } = Dimensions.get('window');

const CallScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { callData, callType = 'voice' } = route.params || {};
  
  const [callStatus, setCallStatus] = useState(callData?.status || 'connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [currentCall, setCurrentCall] = useState(callData);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const callStartTime = useRef(null);
  const durationInterval = useRef(null);

  useEffect(() => {
    initializeCall();
    setupCallListeners();
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (callStatus === 'active') {
      startCallTimer();
      startPulseAnimation();
    } else {
      stopCallTimer();
      stopPulseAnimation();
    }
  }, [callStatus]);

  const initializeCall = async () => {
    try {
      // Request audio permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Audio permission is required for calls.');
        navigation.goBack();
        return;
      }

      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: !isSpeakerOn,
      });

    } catch (error) {
      console.error('Error initializing call:', error);
      Alert.alert('Call Error', 'Failed to initialize call');
    }
  };

  const setupCallListeners = () => {
    callingService.addCallListener(handleCallEvent);
  };

  const handleCallEvent = (event, data) => {
    switch (event) {
      case 'callAccepted':
        setCallStatus('active');
        setCurrentCall(data);
        break;
      case 'callEnded':
        setCallStatus('ended');
        setTimeout(() => navigation.goBack(), 2000);
        break;
      case 'callDeclined':
        setCallStatus('declined');
        setTimeout(() => navigation.goBack(), 2000);
        break;
      case 'callMuteToggled':
        setIsMuted(data.muted);
        break;
      case 'callVideoToggled':
        setIsVideoEnabled(data.videoEnabled);
        break;
    }
  };

  const cleanup = () => {
    callingService.removeCallListener(handleCallEvent);
    stopCallTimer();
    stopPulseAnimation();
  };

  const startCallTimer = () => {
    callStartTime.current = Date.now();
    durationInterval.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartTime.current) / 1000);
      setCallDuration(elapsed);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    try {
      if (currentCall?.id) {
        await callingService.endCall(currentCall.id);
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error ending call:', error);
      navigation.goBack();
    }
  };

  const handleToggleMute = async () => {
    try {
      const newMutedState = !isMuted;
      if (currentCall?.id) {
        await callingService.toggleMute(currentCall.id, newMutedState);
      }
      setIsMuted(newMutedState);
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const handleToggleVideo = async () => {
    try {
      const newVideoState = !isVideoEnabled;
      if (currentCall?.id) {
        await callingService.toggleVideo(currentCall.id, newVideoState);
      }
      setIsVideoEnabled(newVideoState);
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  };

  const handleToggleSpeaker = async () => {
    try {
      const newSpeakerState = !isSpeakerOn;
      setIsSpeakerOn(newSpeakerState);
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: !newSpeakerState,
      });
    } catch (error) {
      console.error('Error toggling speaker:', error);
    }
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'connecting':
        return 'Connecting...';
      case 'ringing':
        return 'Ringing...';
      case 'active':
        return formatDuration(callDuration);
      case 'ended':
        return 'Call Ended';
      case 'declined':
        return 'Call Declined';
      default:
        return 'Connecting...';
    }
  };

  const getStatusColor = () => {
    switch (callStatus) {
      case 'active':
        return theme.colors.success;
      case 'ended':
      case 'declined':
        return theme.colors.error;
      default:
        return theme.colors.warning;
    }
  };

  const contactName = currentCall?.contactInfo?.name || 'Unknown Contact';
  const contactPhone = currentCall?.contactInfo?.phone || '';
  const isEmergencyCall = currentCall?.type === 'emergency';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <Surface style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.callType, { color: theme.colors.onPrimary }]}>
            {isEmergencyCall ? 'Emergency Call' : callType === 'video' ? 'Video Call' : 'Voice Call'}
          </Text>
          <Chip 
            mode="outlined" 
            style={[styles.statusChip, { borderColor: getStatusColor() }]}
            textStyle={{ color: getStatusColor() }}
          >
            {getStatusText()}
          </Chip>
        </View>
      </Surface>

      {/* Contact Info */}
      <View style={styles.contactSection}>
        <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Avatar.Icon
            size={120}
            icon={isEmergencyCall ? 'phone-alert' : 'account'}
            style={[
              styles.contactAvatar,
              { 
                backgroundColor: isEmergencyCall ? theme.colors.error : theme.colors.primary,
              }
            ]}
          />
        </Animated.View>
        
        <Text style={[styles.contactName, { color: theme.colors.text.primary }]}>
          {contactName}
        </Text>
        
        {contactPhone && (
          <Text style={[styles.contactPhone, { color: theme.colors.text.secondary }]}>
            {contactPhone}
          </Text>
        )}

        {isEmergencyCall && (
          <Card style={[styles.emergencyCard, { backgroundColor: theme.colors.errorContainer }]}>
            <Card.Content>
              <View style={styles.emergencyInfo}>
                <MaterialCommunityIcons 
                  name="alert" 
                  size={24} 
                  color={theme.colors.error} 
                />
                <Text style={[styles.emergencyText, { color: theme.colors.error }]}>
                  Emergency assistance is being contacted
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}
      </View>

      {/* Video Area (if video call) */}
      {callType === 'video' && (
        <View style={styles.videoContainer}>
          <Surface style={[styles.videoSurface, { backgroundColor: theme.colors.surfaceVariant }]}>
            <MaterialCommunityIcons
              name={isVideoEnabled ? 'video' : 'video-off'}
              size={60}
              color={theme.colors.outline}
            />
            <Text style={[styles.videoText, { color: theme.colors.text.secondary }]}>
              {isVideoEnabled ? 'Video Active' : 'Video Disabled'}
            </Text>
          </Surface>
        </View>
      )}

      {/* Call Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          {/* Mute Button */}
          <IconButton
            icon={isMuted ? 'microphone-off' : 'microphone'}
            size={32}
            iconColor={isMuted ? theme.colors.error : theme.colors.onSurface}
            style={[
              styles.controlButton,
              {
                backgroundColor: isMuted ? theme.colors.errorContainer : theme.colors.surface,
              }
            ]}
            onPress={handleToggleMute}
          />

          {/* Speaker Button */}
          <IconButton
            icon={isSpeakerOn ? 'volume-high' : 'volume-medium'}
            size={32}
            iconColor={isSpeakerOn ? theme.colors.primary : theme.colors.onSurface}
            style={[
              styles.controlButton,
              {
                backgroundColor: isSpeakerOn ? theme.colors.primaryContainer : theme.colors.surface,
              }
            ]}
            onPress={handleToggleSpeaker}
          />

          {/* Video Toggle (for video calls) */}
          {callType === 'video' && (
            <IconButton
              icon={isVideoEnabled ? 'video' : 'video-off'}
              size={32}
              iconColor={isVideoEnabled ? theme.colors.primary : theme.colors.error}
              style={[
                styles.controlButton,
                {
                  backgroundColor: isVideoEnabled ? theme.colors.primaryContainer : theme.colors.errorContainer,
                }
              ]}
              onPress={handleToggleVideo}
            />
          )}
        </View>

        {/* End Call Button */}
        <IconButton
          icon="phone-hangup"
          size={40}
          iconColor={theme.colors.onError}
          style={[styles.endCallButton, { backgroundColor: theme.colors.error }]}
          onPress={handleEndCall}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  callType: {
    fontSize: theme.typography.bodyLarge.fontSize,
    fontWeight: '600',
  },
  statusChip: {
    backgroundColor: 'transparent',
  },
  contactSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  contactAvatar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  contactName: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  contactPhone: {
    fontSize: theme.typography.bodyMedium.fontSize,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  emergencyCard: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.roundness,
  },
  emergencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  videoContainer: {
    height: 200,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  videoSurface: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.bodyMedium.fontSize,
  },
  controlsContainer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  controlButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  endCallButton: {
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default CallScreen;
