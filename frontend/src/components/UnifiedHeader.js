import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from './common/ThemedText';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';

// Get status bar height safely
const getStatusBarHeight = () => {
  if (Platform.OS === 'ios') {
    return 44; // Standard iOS status bar height
  } else {
    return StatusBar.currentHeight || 24; // Android status bar height
  }
};

const NAV_OPTIONS = [
  { key: 'Home', icon: 'home', labelKey: 'home', color: '#ffffff' },
  { key: 'Dashboard', icon: 'view-dashboard', labelKey: 'dashboard', color: '#ffffff' },
  { key: 'Medications', icon: 'pill', labelKey: 'medications', color: '#ffffff' },
  { key: 'Health', icon: 'heart-pulse', labelKey: 'health', color: '#ffffff' },
  { key: 'Brain', icon: 'brain', labelKey: 'brainTraining', color: '#ffffff' },
  { key: 'Emergency', icon: 'alert-circle', labelKey: 'emergency', color: '#ffeb3b' },
  { key: 'Family', icon: 'account-group', labelKey: 'family', color: '#ffffff' },
];

const UnifiedHeader = ({ 
  title = 'ElderCare', 
  navigation, 
  userType = 'elderly', 
  showBackButton = false,
  backgroundColor,
  titleColor,
  activeScreen = 'Home',
  onScreenChange,
}) => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const { t } = useLocalization();

  // Debug logging for profile image
  console.log('=== UNIFIED HEADER USER DATA ===');
  console.log('User object:', user);
  console.log('User profile_image:', user?.profile_image);
  console.log('User profileImage:', user?.profileImage);
  console.log('User first_name:', user?.first_name);
  console.log('User last_name:', user?.last_name);

  // Ensure we have a valid theme object
  const safeTheme = theme || {
    colors: {
      primary: '#2563eb',
      primaryDark: '#1e40af',
      textOnPrimary: '#ffffff',
      surface: '#ffffff',
      textSecondary: '#666666',
      error: '#dc2626',
      background: '#f8fafc',
    },
  };

  // Safe translation function
  const safeTranslate = (key, fallback) => {
    try {
      return t && typeof t === 'function' ? t(key) : fallback || key;
    } catch (error) {
      console.warn('Translation error:', error);
      return fallback || key;
    }
  };

  // Safety check for required dependencies
  if (!navigation) {
    console.warn('UnifiedHeader: navigation prop is required');
    return null;
  };

  const handleNavigation = (key) => {
    try {
      if (onScreenChange && typeof onScreenChange === 'function') {
        // Use local screen changing for main navigation
        onScreenChange(key);
      } else {
        // Fallback to regular navigation for other cases
        if (!navigation || typeof navigation.navigate !== 'function') {
          console.error('Navigation function is not available');
          return;
        }
        
        if (key === 'Home') {
          navigation.navigate('MainTabs');
        } else {
          navigation.navigate(key);
        }
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleActionPress = (action) => {
    try {
      if (!navigation || typeof navigation.navigate !== 'function') {
        console.error('Navigation function is not available');
        return;
      }

      switch (action) {
        case 'voice':
          navigation.navigate('VoiceAssistant');
          break;
        case 'profile':
          navigation.navigate('EditProfile');
          break;
        case 'settings':
          navigation.navigate('Settings');
          break;
        case 'logout':
          if (logout && typeof logout === 'function') {
            logout();
          } else {
            console.error('Logout function is not available');
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Action error:', error);
    }
  };

  const handleBackPress = () => {
    try {
      if (navigation && typeof navigation.goBack === 'function') {
        navigation.goBack();
      } else {
        console.error('GoBack function is not available');
      }
    } catch (error) {
      console.error('Back navigation error:', error);
    }
  };

  const headerBackgroundColor = backgroundColor || safeTheme.colors.primary;
  const textColor = titleColor || safeTheme.colors.textOnPrimary;

  const filteredNavOptions = NAV_OPTIONS.filter(opt => {
    if (userType === 'elderly') {
      // Elderly users see Home, but not Dashboard
      return opt.key !== 'Dashboard';
    } else {
      // Caregivers see Dashboard, but not Home or Brain
      return opt.key !== 'Home' && opt.key !== 'Brain';
    }
  });

  // Greeting logic
  const getGreeting = () => {
    const hour = new Date().getHours();
    let greeting = '';
    if (hour < 12) greeting = safeTranslate('morning', 'Good morning');
    else if (hour < 17) greeting = safeTranslate('afternoon', 'Good afternoon');
    else greeting = safeTranslate('evening', 'Good evening');
    return greeting;
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={headerBackgroundColor}
        translucent={true}
      />
      
      {/* Unified Header with Fixed Navigation */}
      <LinearGradient
        colors={[
          headerBackgroundColor,
          safeTheme.colors.primaryDark || headerBackgroundColor,
        ]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* User Info Row - Always Visible */}
          <View style={styles.userInfoSection}>
            <View style={styles.userInfoRow}>
              <View style={styles.userAvatar}>
                {(() => {
                  const profileImageUrl = user?.profile_image || user?.profileImage;
                  console.log('UnifiedHeader: Profile image being displayed:', profileImageUrl);
                  console.log('User profile_image:', user?.profile_image);
                  console.log('User profileImage:', user?.profileImage);
                  
                  if (profileImageUrl && profileImageUrl.trim() !== '') {
                    console.log('UnifiedHeader: Showing profile image:', profileImageUrl);
                    return (
                      <Image 
                        source={{ uri: profileImageUrl }} 
                        style={styles.profileImage}
                        onLoad={() => console.log('UnifiedHeader: Profile image loaded successfully:', profileImageUrl)}
                        onError={(error) => console.error('UnifiedHeader: Profile image failed to load:', error.nativeEvent.error, 'URL:', profileImageUrl)}
                        onLoadStart={() => console.log('UnifiedHeader: Profile image loading started:', profileImageUrl)}
                        onLoadEnd={() => console.log('UnifiedHeader: Profile image loading ended:', profileImageUrl)}
                      />
                    );
                  } else {
                    console.log('UnifiedHeader: No profile image available, showing default icon');
                    return (
                      <MaterialCommunityIcons 
                        name="account-circle" 
                        size={40} 
                        color={textColor} 
                      />
                    );
                  }
                })()}
              </View>
              <View style={styles.userDetails}>
                <ThemedText 
                  variant="titleLarge" 
                  style={[styles.greetingText, { color: textColor }]}
                >
                  {user?.first_name ? `${getGreeting()}, ${user.first_name}!` : getGreeting()}
                </ThemedText>
                <ThemedText 
                  variant="bodyLarge" 
                  style={[styles.greetingSubText, { color: textColor + 'DD' }]}
                >
                  {user?.first_name ? 'How are you feeling today?' : 'Welcome to your health companion'}
                </ThemedText>
              </View>
              
              {/* Action Buttons */}
              <View style={styles.headerActions}>
                {showBackButton && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleBackPress}
                    accessible={true}
                    accessibilityLabel="Go back"
                  >
                    <MaterialCommunityIcons 
                      name="arrow-left" 
                      size={24} 
                      color={textColor} 
                    />
                  </TouchableOpacity>
                )}
                
                {userType === 'elderly' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleActionPress('voice')}
                    accessible={true}
                    accessibilityLabel="Voice Assistant"
                  >
                    <MaterialCommunityIcons 
                      name="microphone" 
                      size={24} 
                      color={textColor} 
                    />
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleActionPress('settings')}
                  accessible={true}
                  accessibilityLabel="Settings"
                >
                  <MaterialCommunityIcons 
                    name="cog" 
                    size={24} 
                    color={textColor} 
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleActionPress('logout')}
                  accessible={true}
                  accessibilityLabel="Logout"
                >
                  <MaterialCommunityIcons 
                    name="logout" 
                    size={24} 
                    color={textColor} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Navigation Section - Always Visible */}
          <View style={styles.navigationSection}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.navScrollContainer}
              contentContainerStyle={styles.navScrollContent}
            >
              {filteredNavOptions.map((option) => {
                const isActive = activeScreen === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.navItem,
                      isActive && styles.navItemActive,
                      isActive && { backgroundColor: 'transparent' }
                    ]}
                    onPress={() => handleNavigation(option.key)}
                    accessible={true}
                    accessibilityLabel={`Navigate to ${safeTranslate(option.labelKey, option.labelKey)}`}
                  >
                    <View style={[
                      styles.navIconCircle,
                      isActive && styles.navIconCircleActive,
                      isActive && { backgroundColor: 'transparent' },
                      option.key === 'Emergency' && !isActive && { backgroundColor: 'rgba(255, 255, 255, 0)' }
                    ]}>
                      <MaterialCommunityIcons 
                        name={option.icon} 
                        size={32} 
                        color={isActive ? '#ffffff' : (option.key === 'Emergency' ? '#ffffff' : '#ffffff')} 
                      />
                    </View>
                    <ThemedText 
                      variant="bodySmall" 
                      style={[
                        styles.navLabel, 
                        { color: isActive ? '#ffffff' : textColor },
                        isActive && styles.navLabelActive
                      ]}
                    >
                      {safeTranslate(option.labelKey, option.labelKey)}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  headerGradient: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  safeArea: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  userInfoSection: {
    marginBottom: 16,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
  },
  userAvatar: {
    marginRight: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userDetails: {
    flex: 1,
  },
  greetingText: {
    fontWeight: '700',
    marginBottom: 4,
    fontSize: 20,
    lineHeight: 28,
  },
  greetingSubText: {
    fontSize: 16,
    lineHeight: 22,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0)',
    borderRadius: 20,
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationSection: {
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0)',
    paddingBottom: 20,
    minHeight: 140,
  },
  navScrollContainer: {
    flexGrow: 0,
    backgroundColor: 'rgba(255, 255, 255, 0)',
    flexShrink: 0,
    height: 120,
  },
  navScrollContent: {
    paddingHorizontal:-40,
    backgroundColor: 'rgba(255, 255, 255, 0)',
    alignItems: 'center',
    gap: 10,
  },
  navItem: {
    backgroundColor: 'rgba(255, 255, 255, 0)',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    minHeight: 100,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0)',
  },
  navItemActive: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    transform: [{ scale: 1.05 }],
  },
  navIconCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0)',
    borderRadius: 22,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0)',
  },
  navIconCircleActive: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  navLabel: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  navLabelActive: {
    fontWeight: '800',
  },
});

export default UnifiedHeader; 