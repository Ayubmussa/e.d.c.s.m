import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText, ThemedHeading } from '../../components/common/ThemedText';
import { CustomButton } from '../../components/common/CustomButton';
import { useTheme } from '../../context/ThemeContext';
import { useLocalization } from '../../context/LocalizationContext';
import authService from '../../services/authService';

const BG_IMAGE = require('../../../assets/aa.png');

const ForgotPasswordScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useLocalization();
  const styles = createStyles(theme);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const emailRef = useRef();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendResetEmail = async () => {
    if (!email.trim()) {
      Alert.alert(t('error'), t('pleaseEnterEmail'));
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert(t('error'), t('pleaseEnterValidEmail'));
      return;
    }

    setLoading(true);

    try {
      // Use the existing forgotPassword method from authService
      const response = await authService.forgotPassword(email);
      
      if (response.success) {
        setEmailSent(true);
        
        // Show appropriate message based on whether it was rate limited
        const alertTitle = response.rateLimited ? 'Rate Limit Notice' : 'Email Sent!';
        const alertMessage = response.rateLimited 
          ? `${response.message}\n\nIf you don't see the email, please check your spam folder or try again in a few minutes.`
          : `A password reset link has been sent to ${email}. Please check your email and click the link to reset your password.`;
        
        // Show success message with clear instructions
        Alert.alert(
          alertTitle,
          alertMessage,
          [
            {
              text: 'Check Email App',
              onPress: async () => {
                // Open the default mail app inbox, not compose
                if (Platform.OS === 'ios') {
                  Linking.openURL('message://'); // Opens Mail app inbox on iOS
                } else if (Platform.OS === 'android') {
                  try {
                    // Try Gmail intent
                    await Linking.openURL('intent://#Intent;scheme=mailto;package=com.google.android.gm;end');
                  } catch (e) {
                    // Fallback to mailto: (may open compose, but at least opens mail app)
                    Linking.openURL('mailto:');
                  }
                } else {
                  Linking.openURL('mailto:'); // Fallback
                }
              }
            },
            {
              text: response.rateLimited ? 'Try Again Later' : 'Resend Email',
              onPress: () => {
                setEmailSent(false);
                // Allow user to send another email (will be rate limited if too soon)
              }
            },
            {
              text: 'Back to Login',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        Alert.alert(t('error'), response.error || t('failedToSendEmail'));
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      Alert.alert(t('error'), t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  const isEmailValid = email.trim() && validateEmail(email);

  return (
    <ImageBackground
      source={BG_IMAGE}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0)' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons 
              name="lock-reset" 
              size={64} 
              color="#ffffff" 
              style={styles.headerIcon}
            />
            <ThemedHeading level={1} style={styles.pageTitle}>
              Reset Password
            </ThemedHeading>
            <ThemedText variant="bodyLarge" style={styles.pageSubtitle}>
              Enter your email address and we'll send you a link to reset your password
            </ThemedText>
          </View>
          
          <View style={styles.formBox}>
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <ThemedText variant="bodyLarge" style={styles.label}>
                  {t('email') || 'Email Address'}
                </ThemedText>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons 
                    name="email" 
                    size={24} 
                    color={theme.colors.text.secondary} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    ref={emailRef}
                    value={email}
                    onChangeText={setEmail}
                    placeholder={t('email') || 'Enter your email address'}
                    placeholderTextColor={theme.colors.text.secondary}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessible={true}
                    accessibilityLabel="Email address input"
                    accessibilityHint="Enter your email address to receive password reset instructions"
                  />
                  {isEmailValid && (
                    <MaterialCommunityIcons 
                      name="check-circle" 
                      size={24} 
                      color={theme.colors.success || '#4CAF50'} 
                      style={styles.validationIcon}
                    />
                  )}
                </View>
                {email.length > 0 && !validateEmail(email) && (
                  <ThemedText variant="bodyMedium" style={styles.errorText}>
                    {t('pleaseEnterValidEmail') || 'Please enter a valid email address'}
                  </ThemedText>
                )}
              </View>

              {/* Send Reset Email Button */}
              <CustomButton
                mode="contained"
                onPress={handleSendResetEmail}
                loading={loading}
                disabled={loading || !isEmailValid}
                style={[
                  styles.resetButton,
                  (!isEmailValid || loading) && styles.resetButtonDisabled
                ]}
                textColor="#ffffff"
              >
                {loading ? 'Sending...' : (t('sendResetEmail') || 'Send Reset Email')}
              </CustomButton>

              {/* Additional Help Text */}
              
              {/* Back to Login */}
              <View style={styles.backToLoginContainer}>
                <ThemedText variant="bodyLarge" style={styles.backToLoginText}>
                  Remember your password?{' '}
                </ThemedText>
                <TouchableOpacity
                  onPress={handleBackToLogin}
                  accessible={true}
                  accessibilityLabel="Back to login"
                  accessibilityHint="Return to the login screen"
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <ThemedText variant="bodyLarge" style={styles.backToLoginLink}>
                    Sign In
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 0,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 32, // increased spacing
    },
    headerIcon: {
      marginBottom: theme.spacing.md,
    },
    pageTitle: {
      color: '#ffffff',
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
      fontWeight: 'bold',
    },
    pageSubtitle: {
      color: '#cccccc',
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
      lineHeight: 24,
    },
    formBox: {
      width: '90%',
      backgroundColor: 'rgba(0,0,0,0.0)',
      borderRadius: 24,
      padding: 0,
      alignItems: 'center',
      shadowColor: 'transparent',
    },
    form: {
      width: '100%',
      alignItems: 'center',
    },
    inputContainer: {
      width: '100%',
      marginBottom: theme.spacing.lg,
    },
    label: {
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: 18, // increased from 16
      alignSelf: 'flex-start',
      marginLeft: 8,
      marginBottom: theme.spacing.sm,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      borderRadius: 24,
      paddingHorizontal: theme.spacing.md,
      minHeight: 56, // increased height for elderly users
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    inputIcon: {
      marginRight: theme.spacing.sm,
    },
    input: {
      flex: 1,
      fontSize: 18, // increased from 16
      color: theme.colors.text.primary,
      paddingVertical: theme.spacing.md,
      minHeight: 24, // ensure text is properly sized
    },
    validationIcon: {
      marginLeft: theme.spacing.sm,
    },
    errorText: {
      color: '#ff4444',
      fontSize: 16, // increased from 13
      marginTop: theme.spacing.sm,
      marginLeft: 8,
      alignSelf: 'flex-start',
    },
    resetButton: {
      width: '100%',
      borderRadius: 24,
      marginTop: theme.spacing.xl,
      backgroundColor: '#3BA4F9',
      elevation: 3,
      shadowColor: '#3BA4F9',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      minHeight: 56, // elderly-friendly height
    },
    resetButtonDisabled: {
      backgroundColor: '#cccccc',
      shadowColor: '#cccccc',
    },
    backToLoginContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: theme.spacing.xl,
      paddingVertical: theme.spacing.sm,
    },
    backToLoginText: {
      color: '#ffffff',
      fontSize: 16, // increased from 14
    },
    backToLoginLink: {
      color: '#3BA4F9',
      fontWeight: 'bold',
      fontSize: 16, // increased from 14
      textDecorationLine: 'underline',
    },
  });

export default ForgotPasswordScreen;
