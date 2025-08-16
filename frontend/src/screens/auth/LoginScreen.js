import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText, ThemedHeading } from '../../components/common/ThemedText';
import { CustomButton } from '../../components/common/CustomButton';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const BG_IMAGE = require('../../../assets/aa.png');

const LoginScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error, clearError } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    const result = await login(email, password);
    if (!result.success) {
      Alert.alert('Login Failed', result.error);
    } else {
      // Navigate directly to MainTabs after successful login
      const userType = result?.user?.userType || result?.user?.user_type || 'elderly';
      navigation.reset({
        index: 0,
        routes: [
          { name: 'MainTabs', params: { userType } }
        ]
      });
    }
  };

  React.useEffect(() => {
    return () => clearError();
  }, []);

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
          <View style={styles.logoContainer} />
          <View style={styles.formBox}>
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <ThemedText variant="bodyLarge" style={styles.label}>Email</ThemedText>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons 
                    name="email" 
                    size={24} 
                    color={theme.colors.text.secondary} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email address"
                    placeholderTextColor={theme.colors.text.secondary}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessible={true}
                    accessibilityLabel="Email address input"
                    accessibilityHint="Enter your email"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <ThemedText variant="bodyLarge" style={styles.label}>Password</ThemedText>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons 
                    name="lock" 
                    size={24} 
                    color={theme.colors.text.secondary} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor={theme.colors.text.secondary}
                    style={[styles.input, styles.passwordInput]}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessible={true}
                    accessibilityLabel="Password input"
                    accessibilityHint="Enter your password to sign in"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                    accessible={true}
                    accessibilityLabel={showPassword ? "Show password" : "Hide password"}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  >
                    <MaterialCommunityIcons 
                      name={showPassword ? "eye" : "eye-off"} 
                      size={24} 
                      color={theme.colors.text.secondary} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign In Button */}
              <CustomButton
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.signInButton}
                textColor="#ffffff"
              >
                Sign In
              </CustomButton>

              {/* Forgot Password Button */}
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotPasswordButton}
                accessible={true}
                accessibilityLabel="Forgot password"
                accessibilityHint="Tap to reset your password"
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <ThemedText variant="bodyLarge" style={styles.forgotPasswordText}>
                  Forgot Password?
                </ThemedText>
              </TouchableOpacity>

              {/* Create Account Prompt */}
              <View style={styles.signUpPromptContainer}>
                <ThemedText variant="bodyLarge" style={styles.signUpPromptText}>
                  Don't have an account?{' '}
                </ThemedText>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Register')}
                  accessible={true}
                  accessibilityLabel="Create account"
                  accessibilityHint="Tap to create a new account"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <ThemedText variant="bodyLarge" style={styles.signUpPromptLink}>
                    Create Account
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

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32, // increased spacing
  },
  formBox: {
      width: '100%',
      maxWidth: 500,
      backgroundColor: 'rgba(0,0,0,0.0)',
      borderRadius: 24,
      padding: 0,
      alignItems: 'center',
      shadowColor: 'transparent',
      alignSelf: 'center',
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
      paddingHorizontal: theme.spacing.l,
      paddingVertical: 15,
      minHeight: 64,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
      width: 440,
      maxWidth: 500,
      alignSelf: 'center',
    },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
 input: {
      flex: 1,
      fontSize: 20,
      color: theme.colors.text.primary,
      paddingVertical: theme.spacing.l,
      paddingHorizontal: theme.spacing.l,
      minHeight: 32,
      textAlignVertical: 'center',
      width: '100%',
    },
  passwordInput: {
    paddingRight: theme.spacing.sm, // space for toggle button
  },
  passwordToggle: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  signInButton: {
    width: '100%',
    borderRadius: 24,
    marginTop: theme.spacing.xl,
    backgroundColor: '#3BA4F9',
    elevation: 3,
    shadowColor: '#3BA4F9',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    minHeight: 44, // increased height to match input fields
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.s,
     width: 310,
      maxWidth: 200,
      alignSelf: 'center',
  },
  forgotPasswordButton: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  forgotPasswordText: {
    color: '#3BA4F9',
    fontWeight: 'bold',
    fontSize: 18, // increased from 15
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  signUpPromptContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  signUpPromptText: {
    color: '#ffffff',
    fontSize: 16, // increased from 14
  },
  signUpPromptLink: {
    color: '#3BA4F9',
    fontWeight: 'bold',
    fontSize: 16, // increased from 14
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
