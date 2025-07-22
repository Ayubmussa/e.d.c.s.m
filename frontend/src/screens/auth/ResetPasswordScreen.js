import React, { useState, useRef } from 'react';
import { CommonActions } from '@react-navigation/native';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText, ThemedHeading } from '../../components/common/ThemedText';
import { CustomButton } from '../../components/common/CustomButton';
import { useTheme } from '../../context/ThemeContext';
import { useLocalization } from '../../context/LocalizationContext';
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';

const BG_IMAGE = require('../../../assets/forgotpassword.png');

const ResetPasswordScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { t } = useLocalization();
  const styles = createStyles(theme);
  // Extract token from navigation params or from URL (web)
  let { accessToken, email, fromDeepLink, fromSettings } = route?.params || {};
  if (Platform.OS === 'web' && !accessToken) {
    try {
      const params = new URLSearchParams(window.location.search);
      accessToken = params.get('access_token');
      fromDeepLink = params.get('type') === 'recovery';
    } catch (e) {
      // ignore
    }
  }
  // If user is authenticated and no token, allow direct password reset
  const { user } = useAuth();
  const canDirectReset = user && user.email && !accessToken && !fromDeepLink;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef();
  const confirmPasswordRef = useRef();

  const validatePassword = (password) => {
    return password && password.length >= 6;
  };

  const handleResetPassword = async () => {
    let tokenToUse = accessToken;
    // Always get Supabase session token for authenticated users
    if (canDirectReset) {
      const session = await supabase.auth.getSession();
      tokenToUse = session?.data?.session?.access_token;
      // For web, try to get token from localStorage if still missing
      if (!tokenToUse && Platform.OS === 'web') {
        try {
          const data = window.localStorage.getItem('supabase.auth.token');
          if (data) {
            const parsed = JSON.parse(data);
            tokenToUse = parsed?.currentSession?.access_token;
          }
        } catch (e) {
          // ignore
        }
      }
    }
    console.log('ResetPasswordScreen: tokenToUse =', tokenToUse);
    if (!tokenToUse) {
      Alert.alert(t('error'), 'No valid session found. Please log out and log in again.');
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert(t('error'), 'Please enter a new password');
      return;
    }
    if (!validatePassword(newPassword)) {
      Alert.alert(t('error'), 'Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('error'), 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      // Always send accessToken and newPassword, never userId
      console.log('Resetting password via backend API...');
      const response = await authService.resetPassword(tokenToUse, newPassword);
      if (response.success) {
        if (fromSettings) {
          Alert.alert(
            'Success!',
            'Your password has been reset successfully.',
            [
              {
                text: 'OK',
                onPress: () => {},
              },
            ]
          );
        } else {
          Alert.alert(
            'Success!',
            'Your password has been reset successfully. You can now log in with your new password.',
            [
              {
                text: 'Go to Login',
                onPress: () => navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  })
                ),
              },
            ]
          );
        }
      } else {
        // If session expired, provide helpful guidance
        if (response.error.includes('expired')) {
          Alert.alert(
            'Session Expired',
            'Your password reset link has expired. Please request a new password reset email.',
            [
              {
                text: 'Request New Email',
                onPress: () => navigation.navigate('ForgotPassword'),
              },
              {
                text: 'Back to Login',
                onPress: () => navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  })
                ),
              },
            ]
          );
        } else {
          Alert.alert(t('error'), response.error || 'Failed to reset password');
        }
      }
    } catch (error) {
      console.error('Reset password error:', error);
      Alert.alert(t('error'), 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  };

  const isFormValid = newPassword.trim() && 
                     confirmPassword.trim() && 
                     validatePassword(newPassword) &&
                     newPassword === confirmPassword;

  return (
    <ImageBackground
      source={BG_IMAGE}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.25)' }]}
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
            {accessToken || fromDeepLink || canDirectReset ? (
              <ThemedText variant="bodyLarge" style={styles.pageSubtitle}>
                {fromDeepLink ? 
                  'Great! You clicked the reset link. Now enter your new password below.' :
                  'Enter your new password below'
                }
              </ThemedText>
            ) : (
              <ThemedText variant="bodyLarge" style={styles.pageSubtitle}>
                To reset your password, please click the reset link in your email first. If you haven't received the email, you can request a new one.
              </ThemedText>
            )}
          </View>
          
          <View style={styles.formBox}>
            <View style={styles.form}>
              {(accessToken || fromDeepLink || canDirectReset) ? (
                <>
                  {/* New Password Input */}
                  <View style={styles.inputContainer}>
                    <ThemedText variant="bodyLarge" style={styles.label}>
                      New Password
                    </ThemedText>
                    <View style={styles.inputWrapper}>
                      <MaterialCommunityIcons 
                        name="lock" 
                        size={24} 
                        color={theme.colors.text.secondary} 
                        style={styles.inputIcon} 
                      />
                      <TextInput
                        ref={passwordRef}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="Enter new password"
                        placeholderTextColor={theme.colors.text.secondary}
                        style={styles.input}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                        returnKeyType="next"
                        accessible={true}
                        accessibilityLabel="New password input"
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                        accessible={true}
                        accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                      >
                        <MaterialCommunityIcons 
                          name={showPassword ? "eye-off" : "eye"} 
                          size={24} 
                          color={theme.colors.text.secondary}
                        />
                      </TouchableOpacity>
                    </View>
                    {newPassword && !validatePassword(newPassword) && (
                      <ThemedText variant="bodyMedium" style={styles.errorText}>
                        Password must be at least 6 characters long
                      </ThemedText>
                    )}
                  </View>

                  {/* Confirm Password Input */}
                  <View style={styles.inputContainer}>
                    <ThemedText variant="bodyLarge" style={styles.label}>
                      Confirm Password
                    </ThemedText>
                    <View style={styles.inputWrapper}>
                      <MaterialCommunityIcons 
                        name="lock" 
                        size={24} 
                        color={theme.colors.text.secondary} 
                        style={styles.inputIcon} 
                      />
                      <TextInput
                        ref={confirmPasswordRef}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm new password"
                        placeholderTextColor={theme.colors.text.secondary}
                        style={styles.input}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        onSubmitEditing={handleResetPassword}
                        returnKeyType="done"
                        accessible={true}
                        accessibilityLabel="Confirm password input"
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeIcon}
                        accessible={true}
                        accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        <MaterialCommunityIcons 
                          name={showConfirmPassword ? "eye-off" : "eye"} 
                          size={24} 
                          color={theme.colors.text.secondary}
                        />
                      </TouchableOpacity>
                    </View>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <ThemedText variant="bodyMedium" style={styles.errorText}>
                        Passwords do not match
                      </ThemedText>
                    )}
                  </View>

                  {/* Reset Password Button */}
                  <CustomButton
                    mode="contained"
                    onPress={handleResetPassword}
                    loading={loading}
                    disabled={loading || !isFormValid}
                    style={[
                      styles.resetButton,
                      (!isFormValid || loading) && styles.resetButtonDisabled
                    ]}
                    textColor="#ffffff"
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </CustomButton>
                </>
              ) : (
                <>
                  {/* No access - show guidance */}
                  <ThemedText variant="bodyLarge" style={styles.noAccessText}>
                    You need to click the password reset link in your email to access this page.
                  </ThemedText>
                </>
              )}

              {/* Additional Options */}
              {!(accessToken || fromDeepLink || canDirectReset) && (
                <View style={styles.additionalOptions}>
                  <ThemedText variant="bodyMedium" style={styles.helpText}>
                    Haven't received the email? Check your spam folder or wait a few minutes before requesting another.
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ForgotPassword')}
                    style={styles.linkButton}
                    accessible={true}
                    accessibilityLabel="Request new reset email"
                  >
                    <ThemedText variant="bodyLarge" style={styles.linkText}>
                      Request New Reset Email
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              )}

              {/* Back to Login */}
              {!fromSettings && (
                <View style={styles.backToLoginContainer}>
                  <ThemedText variant="bodyLarge" style={styles.backToLoginText}>
                    Remember your password?{' '}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={handleBackToLogin}
                    accessible={true}
                    accessibilityLabel="Back to login"
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  >
                    <ThemedText variant="bodyLarge" style={styles.backToLoginLink}>
                      Sign In
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              )}
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
      marginBottom: 32,
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
      fontSize: 18,
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
      minHeight: 56,
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
      fontSize: 18,
      color: theme.colors.text.primary,
      paddingVertical: theme.spacing.md,
      minHeight: 24,
    },
    eyeIcon: {
      padding: 4,
    },
    errorText: {
      color: '#ff4444',
      fontSize: 16,
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
      minHeight: 56,
    },
    resetButtonDisabled: {
      backgroundColor: '#cccccc',
      shadowColor: '#cccccc',
    },
    additionalOptions: {
      marginTop: theme.spacing.lg,
      alignItems: 'center',
    },
    helpText: {
      color: '#cccccc',
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
    },
    linkButton: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    linkText: {
      color: '#3BA4F9',
      fontWeight: 'bold',
      fontSize: 16,
      textDecorationLine: 'underline',
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
      fontSize: 16,
    },
    backToLoginLink: {
      color: '#3BA4F9',
      fontWeight: 'bold',
      fontSize: 16,
      textDecorationLine: 'underline',
    },
    noAccessText: {
      color: '#cccccc',
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
      lineHeight: 24,
    },
  });

export default ResetPasswordScreen;
