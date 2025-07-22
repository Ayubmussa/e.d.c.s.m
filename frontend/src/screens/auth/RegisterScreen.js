import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ImageBackground,
  TouchableOpacity,
  Text, // Ensure Text is imported
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Custom components
import { ThemedText, ThemedHeading } from '../../components/common/ThemedText';
import { CustomButton } from '../../components/common/CustomButton';

// Context
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// Assets
const BG_IMAGE = require('../../../assets/registration.png');

const RegisterScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    dateOfBirth: '',
    userType: 'elderly',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateParts, setDateParts] = useState({ year: '', month: '', day: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState({ code: '+1', name: 'US', digits: 10 });
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [emergencyCountry, setEmergencyCountry] = useState({ code: '+1', name: 'US', digits: 10 });
  const [showEmergencyCountryPicker, setShowEmergencyCountryPicker] = useState(false);

  const { register, loading, clearError } = useAuth();

  const countryCodes = [
    { code: '+1', name: 'US/CA', country: 'United States/Canada', digits: 10 },
    { code: '+44', name: 'UK', country: 'United Kingdom', digits: 10 },
    { code: '+33', name: 'FR', country: 'France', digits: 9 },
    { code: '+49', name: 'DE', country: 'Germany', digits: 11 },
    { code: '+39', name: 'IT', country: 'Italy', digits: 10 },
    { code: '+34', name: 'ES', country: 'Spain', digits: 9 },
    { code: '+31', name: 'NL', country: 'Netherlands', digits: 9 },
    { code: '+32', name: 'BE', country: 'Belgium', digits: 9 },
    { code: '+41', name: 'CH', country: 'Switzerland', digits: 9 },
    { code: '+43', name: 'AT', country: 'Austria', digits: 11 },
    { code: '+45', name: 'DK', country: 'Denmark', digits: 8 },
    { code: '+46', name: 'SE', country: 'Sweden', digits: 9 },
    { code: '+47', name: 'NO', country: 'Norway', digits: 8 },
    { code: '+358', name: 'FI', country: 'Finland', digits: 9 },
    { code: '+351', name: 'PT', country: 'Portugal', digits: 9 },
    { code: '+30', name: 'GR', country: 'Greece', digits: 10 },
    { code: '+48', name: 'PL', country: 'Poland', digits: 9 },
    { code: '+420', name: 'CZ', country: 'Czech Republic', digits: 9 },
    { code: '+36', name: 'HU', country: 'Hungary', digits: 9 },
    { code: '+7', name: 'RU', country: 'Russia', digits: 10 },
    { code: '+86', name: 'CN', country: 'China', digits: 11 },
    { code: '+81', name: 'JP', country: 'Japan', digits: 10 },
    { code: '+82', name: 'KR', country: 'South Korea', digits: 10 },
    { code: '+91', name: 'IN', country: 'India', digits: 10 },
    { code: '+61', name: 'AU', country: 'Australia', digits: 9 },
    { code: '+55', name: 'BR', country: 'Brazil', digits: 11 },
    { code: '+52', name: 'MX', country: 'Mexico', digits: 10 },
    { code: '+54', name: 'AR', country: 'Argentina', digits: 10 },
    { code: '+27', name: 'ZA', country: 'South Africa', digits: 9 },
    { code: '+20', name: 'EG', country: 'Egypt', digits: 10 },
    { code: '+971', name: 'AE', country: 'UAE', digits: 9 },
    { code: '+966', name: 'SA', country: 'Saudi Arabia', digits: 9 },
  ];

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneNumberChange = (value) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (cleanValue.length <= selectedCountry.digits) {
      updateField('phoneNumber', cleanValue);
    }
  };

  const validateStep1 = () => {
    const { firstName, lastName, email, password, confirmPassword, phoneNumber } = formData;
    if (!firstName || !lastName || !email || !password || !phoneNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    const phoneRegex = /^[0-9]+$/;
    if (!phoneRegex.test(phoneNumber) || phoneNumber.length !== selectedCountry.digits) {
      Alert.alert('Error', `Please enter a valid ${selectedCountry.name} phone number (${selectedCountry.digits} digits)`);
      return false;
    }
    return true;
  };

  const validateStep2 = () => true;

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;
    let dateOfBirth = formData.dateOfBirth;
    if (dateParts.year && dateParts.month && dateParts.day) {
      dateOfBirth = `${dateParts.year}-${dateParts.month.padStart(2, '0')}-${dateParts.day.padStart(2, '0')}`;
    }
    const userData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      phoneNumber: selectedCountry.code + formData.phoneNumber,
      userType: formData.userType,
      dateOfBirth: dateOfBirth || (formData.userType === 'elderly' ? '1975-01-01' : '1985-01-01'),
      emergencyContact: formData.userType === 'elderly' ? {
        name: formData.emergencyContactName || 'Emergency Contact',
        phoneNumber: formData.emergencyContactPhone
          ? (emergencyCountry.code + formData.emergencyContactPhone)
          : (selectedCountry.code + formData.phoneNumber),
        relationship: formData.emergencyContactRelationship || 'family',
      } : null,
    };
    try {
      Alert.alert('Creating Account', 'Please wait while we set up your account...');
      const result = await register(userData);
      if (!result.success) {
        let errorMessage = result.error || 'There was a problem creating your account. Please try again.';
        if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
          errorMessage = 'An account with this email already exists.';
        }
        Alert.alert('Registration Failed', errorMessage);
      } else {
        Alert.alert('Registration Successful', result.message || 'Your account has been created successfully!', [
          { text: 'Continue', onPress: () => {
            navigation.reset({
              index: 0,
              routes: [
                { name: 'MainTabs' }
              ]
            });
          }}
        ]);
      }
    } catch (error) {
      Alert.alert('Registration Error', error.message || 'An unexpected error occurred. Please try again.');
    }
  };

  React.useEffect(() => {
    return () => clearError();
  }, []);

  const renderPhoneInput = () => (
    <View style={styles.inputContainer}>
      <ThemedText variant="bodyLarge" style={styles.label}>Phone Number</ThemedText>
      <View style={styles.phoneInputWrapper}>
        <TouchableOpacity 
          style={styles.countryCodeSelector}
          onPress={() => setShowCountryPicker(!showCountryPicker)}
          accessible={true}
          accessibilityLabel="Select country code"
          accessibilityHint="Tap to choose your country"
        >
          <MaterialCommunityIcons 
            name="flag" 
            size={20} 
            color={theme.colors.text.secondary} 
          />
          <ThemedText variant="bodyMedium" style={styles.countryCodeText}>
            {selectedCountry.code}
          </ThemedText>
          <MaterialCommunityIcons 
            name={showCountryPicker ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={theme.colors.text.secondary} 
          />
        </TouchableOpacity>
        <View style={styles.phoneNumberInput}>
          <MaterialCommunityIcons 
            name="phone" 
            size={24} 
            color={theme.colors.text.secondary} 
            style={styles.inputIcon} 
          />
          <TextInput
            value={formData.phoneNumber}
            onChangeText={handlePhoneNumberChange}
            placeholder={`Enter ${selectedCountry.digits} digits`}
            placeholderTextColor={theme.colors.text.secondary}
            style={styles.input}
            keyboardType="phone-pad"
            maxLength={selectedCountry.digits}
            accessible={true}
            accessibilityLabel="Phone number input"
            accessibilityHint={`Enter your ${selectedCountry.digits} digit phone number`}
          />
        </View>
      </View>
      {showCountryPicker && (
        <View style={styles.countryPickerModal}>
          <ScrollView style={styles.countryList} showsVerticalScrollIndicator={false}>
            {countryCodes.map((country, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.countryOption,
                  selectedCountry.code === country.code && styles.selectedCountryOption
                ]}
                onPress={() => {
                  setSelectedCountry(country);
                  setShowCountryPicker(false);
                  updateField('phoneNumber', '');
                }}
                accessible={true}
                accessibilityLabel={`Select ${country.country}`}
              >
                <View style={styles.countryOptionContent}>
                  <ThemedText variant="bodyMedium" style={styles.countryCodeInList}>
                    {country.code}
                  </ThemedText>
                  <ThemedText variant="bodyMedium" style={styles.countryName}>
                    {country.country}
                  </ThemedText>
                  <ThemedText variant="bodySmall" style={styles.countryDigits}>
                    {country.digits} digits
                  </ThemedText>
                </View>
                {selectedCountry.code === country.code && (
                  <MaterialCommunityIcons 
                    name="check" 
                    size={20} 
                    color={theme.colors.primary} 
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderInputField = (label, value, onChangeText, placeholder, iconName, options = {}) => (
    <View style={styles.inputContainer}>
      <ThemedText variant="bodyLarge" style={styles.label}>{label}</ThemedText>
      <View style={styles.inputWrapper}>
        <MaterialCommunityIcons 
          name={iconName} 
          size={24} 
          color={theme.colors.text.secondary} 
          style={styles.inputIcon} 
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.secondary}
          style={[styles.input, options.passwordInput && styles.passwordInput]}
          keyboardType={options.keyboardType || 'default'}
          autoCapitalize={options.autoCapitalize || 'words'}
          autoCorrect={options.autoCorrect !== false}
          secureTextEntry={options.secureTextEntry || false}
          accessible={true}
          accessibilityLabel={`${label} input`}
          accessibilityHint={`Enter your ${label.toLowerCase()}`}
          {...options.extraProps}
        />
        {options.rightIcon && (
          <TouchableOpacity
            onPress={options.rightIcon.onPress}
            style={styles.passwordToggle}
            accessible={true}
            accessibilityLabel={options.rightIcon.accessibilityLabel}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <MaterialCommunityIcons 
              name={options.rightIcon.name} 
              size={24} 
              color={theme.colors.text.secondary} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderUserTypeSelector = () => (
    <View style={styles.inputContainer}>
      <ThemedText variant="bodyLarge" style={styles.label}>User Type</ThemedText>
      <View style={styles.userTypeContainer}>
        <TouchableOpacity
          style={[
            styles.userTypeOption,
            formData.userType === 'elderly' && styles.userTypeOptionSelected
          ]}
          onPress={() => updateField('userType', 'elderly')}
          accessible={true}
          accessibilityLabel="Select elderly user type"
          accessibilityHint="Choose this if you are an elderly person using the app"
        >
          <MaterialCommunityIcons 
            name="account" 
            size={24} 
            color={formData.userType === 'elderly' ? '#ffffff' : theme.colors.primary} 
          />
          <ThemedText 
            variant="bodyLarge" 
            style={[
              styles.userTypeText,
              formData.userType === 'elderly' && styles.userTypeTextSelected
            ]}
          >
            Elderly
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.userTypeOption,
            formData.userType === 'caregiver' && styles.userTypeOptionSelected
          ]}
          onPress={() => updateField('userType', 'caregiver')}
          accessible={true}
          accessibilityLabel="Select caregiver user type"
          accessibilityHint="Choose this if you are a caregiver helping an elderly person"
        >
          <MaterialCommunityIcons 
            name="account-heart" 
            size={24} 
            color={formData.userType === 'caregiver' ? '#ffffff' : theme.colors.primary} 
          />
          <ThemedText 
            variant="bodyLarge" 
            style={[
              styles.userTypeText,
              formData.userType === 'caregiver' && styles.userTypeTextSelected
            ]}
          >
            Caregiver
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
      <ImageBackground
        source={BG_IMAGE}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.25)' }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.logoContainer}>
              <ThemedHeading level={1} style={styles.stepTitle}>
                {step === 1 ? 'Create Account - Step 1' : 'Create Account - Step 2'}
              </ThemedHeading>
              <ThemedText variant="bodyLarge" style={styles.stepSubtitle}>
                {step === 1 ? 'Enter your basic information' : 'Additional details and emergency contact'}
              </ThemedText>
            </View>
            <View style={styles.formBox}>
              <View style={styles.form}>
                {step === 1 && (
                  <>
                    {renderInputField(
                      'First Name',
                      formData.firstName,
                      (value) => updateField('firstName', value),
                      'Enter your first name',
                      'account',
                      { autoCapitalize: 'words' }
                    )}
                    {renderInputField(
                      'Last Name',
                      formData.lastName,
                      (value) => updateField('lastName', value),
                      'Enter your last name',
                      'account',
                      { autoCapitalize: 'words' }
                    )}
                    {renderInputField(
                      'Email',
                      formData.email,
                      (value) => updateField('email', value),
                      'Enter your email address',
                      'email',
                      { 
                        keyboardType: 'email-address',
                        autoCapitalize: 'none',
                        autoCorrect: false
                      }
                    )}
                    {renderPhoneInput()}
                    {renderInputField(
                      'Password',
                      formData.password,
                      (value) => updateField('password', value),
                      'Enter your password',
                      'lock',
                      {
                        secureTextEntry: !showPassword,
                        autoCapitalize: 'none',
                        autoCorrect: false,
                        passwordInput: true,
                        rightIcon: {
                          name: showPassword ? "eye" : "eye-off",
                          onPress: () => setShowPassword(!showPassword),
                          accessibilityLabel: showPassword ? "Show password" : "Hide password"
                        }
                      }
                    )}
                    {renderInputField(
                      'Confirm Password',
                      formData.confirmPassword,
                      (value) => updateField('confirmPassword', value),
                      'Confirm your password',
                      'lock-check',
                      {
                        secureTextEntry: !showConfirmPassword,
                        autoCapitalize: 'none',
                        autoCorrect: false,
                        passwordInput: true,
                        rightIcon: {
                          name: showConfirmPassword ? "eye" : "eye-off",
                          onPress: () => setShowConfirmPassword(!showConfirmPassword),
                          accessibilityLabel: showConfirmPassword ? "Show confirm password" : "Hide confirm password"
                        }
                      }
                    )}
                    <View style={[styles.buttonContainer, { justifyContent: 'center' }]}> 
                      <CustomButton
                        mode="contained"
                        onPress={handleNext}
                        style={[styles.actionButton, { alignSelf: 'center', minHeight: 44, paddingVertical: 0, width: 220 }]}
                        textColor="#ffffff"
                      >
                        Next Step
                      </CustomButton>
                    </View>
                    <View style={styles.signInPromptContainer}>
                      <ThemedText variant="bodyLarge" style={styles.signInPromptText}>
                        Already have an account?{' '}
                      </ThemedText>
                      <TouchableOpacity
                        onPress={() => navigation.navigate('Login')}
                        accessible={true}
                        accessibilityLabel="Sign in to existing account"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <ThemedText variant="bodyLarge" style={styles.signInPromptLink}>
                          Sign In
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
                {step === 2 && (
                  <>
                    <View style={styles.inputContainer}>
                      <ThemedText variant="bodyLarge" style={styles.label}>Date of Birth</ThemedText>
                      <TouchableOpacity
                        style={styles.inputWrapper}
                        onPress={() => setShowDatePicker(true)}
                        accessible={true}
                        accessibilityLabel="Select date of birth"
                        accessibilityHint="Tap to choose your date of birth"
                      >
                        <MaterialCommunityIcons name="calendar" size={24} color={theme.colors.text.secondary} style={styles.inputIcon} />
                        <ThemedText variant="bodyLarge" style={styles.input}>
                          {formData.dateOfBirth ? formData.dateOfBirth : 'Select your date of birth'}
                        </ThemedText>
                      </TouchableOpacity>
                      {showDatePicker && (
                        <>
                          <View style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            top: undefined,
                            height: '50%',
                            backgroundColor: 'rgba(0, 0, 0, 0)',
                            zIndex: 99,
                          }} pointerEvents="box-none" />
                          <View style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0)',
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            padding: 24,
                            shadowColor:  'rgba(0, 0, 0, 0)',
                            shadowOffset: { width: 0, height: -2 },
                            shadowOpacity: 0.15,
                            shadowRadius: 10,
                            elevation: 10,
                            zIndex: 100,
                          }}>
                            <DateTimePicker
                              value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date('1980-01-01')}
                              mode="date"
                              display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                              maximumDate={new Date()}
                              onChange={(event, selectedDate) => {
                                if (Platform.OS === 'android') {
                                  setShowDatePicker(false);
                                }
                                if (selectedDate) {
                                  const year = selectedDate.getFullYear();
                                  const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                  const day = String(selectedDate.getDate()).padStart(2, '0');
                                  updateField('dateOfBirth', `${year}-${month}-${day}`);
                                }
                              }}
                            />
                          </View>
                        </>
                      )}
                    </View>
                    {renderUserTypeSelector()}
                    {formData.userType === 'elderly' && (
                      <>
                        {renderInputField(
                          'Emergency Contact Name',
                          formData.emergencyContactName,
                          (value) => updateField('emergencyContactName', value),
                          'Enter emergency contact name (optional)',
                          'account-plus',
                          { autoCapitalize: 'words' }
                        )}
                        <View style={styles.inputContainer}>
                          <ThemedText variant="bodyLarge" style={styles.label}>Emergency Contact Phone</ThemedText>
                          <View style={styles.phoneInputWrapper}>
                            <TouchableOpacity 
                              style={styles.countryCodeSelector}
                              onPress={() => setShowEmergencyCountryPicker(!showEmergencyCountryPicker)}
                              accessible={true}
                              accessibilityLabel="Select emergency contact country code"
                              accessibilityHint="Tap to choose emergency contact's country"
                            >
                              <MaterialCommunityIcons 
                                name="flag" 
                                size={20} 
                                color={theme.colors.text.secondary} 
                              />
                              <ThemedText variant="bodyMedium" style={styles.countryCodeText}>
                                {emergencyCountry.code}
                              </ThemedText>
                              <MaterialCommunityIcons 
                                name={showEmergencyCountryPicker ? "chevron-up" : "chevron-down"} 
                                size={20} 
                                color={theme.colors.text.secondary} 
                              />
                            </TouchableOpacity>
                            <View style={styles.phoneNumberInput}>
                              <MaterialCommunityIcons 
                                name="phone" 
                                size={24} 
                                color={theme.colors.text.secondary} 
                                style={styles.inputIcon} 
                              />
                              <TextInput
                                value={formData.emergencyContactPhone}
                                onChangeText={(value) => {
                                  const cleanValue = value.replace(/[^0-9]/g, '');
                                  if (cleanValue.length <= emergencyCountry.digits) {
                                    updateField('emergencyContactPhone', cleanValue);
                                  }
                                }}
                                placeholder={`Enter ${emergencyCountry.digits} digits`}
                                placeholderTextColor={theme.colors.text.secondary}
                                style={styles.input}
                                keyboardType="phone-pad"
                                maxLength={emergencyCountry.digits}
                                accessible={true}
                                accessibilityLabel="Emergency contact phone number input"
                                accessibilityHint={`Enter your emergency contact's ${emergencyCountry.digits} digit phone number`}
                              />
                            </View>
                          </View>
                          {showEmergencyCountryPicker && (
                            <View style={styles.countryPickerModal}>
                              <ScrollView style={styles.countryList} showsVerticalScrollIndicator={false}>
                                {countryCodes.map((country, index) => (
                                  <TouchableOpacity
                                    key={index}
                                    style={[
                                      styles.countryOption,
                                      emergencyCountry.code === country.code && styles.selectedCountryOption
                                    ]}
                                    onPress={() => {
                                      setEmergencyCountry(country);
                                      setShowEmergencyCountryPicker(false);
                                      updateField('emergencyContactPhone', '');
                                    }}
                                    accessible={true}
                                    accessibilityLabel={`Select ${country.country}`}
                                  >
                                    <View style={styles.countryOptionContent}>
                                      <ThemedText variant="bodyMedium" style={styles.countryCodeInList}>
                                        {country.code}
                                      </ThemedText>
                                      <ThemedText variant="bodyMedium" style={styles.countryName}>
                                        {country.country}
                                      </ThemedText>
                                      <ThemedText variant="bodySmall" style={styles.countryDigits}>
                                        {country.digits} digits
                                      </ThemedText>
                                    </View>
                                    {emergencyCountry.code === country.code && (
                                      <MaterialCommunityIcons 
                                        name="check" 
                                        size={20} 
                                        color={theme.colors.primary} 
                                      />
                                    )}
                                  </TouchableOpacity>
                                ))}
                              </ScrollView>
                            </View>
                          )}
                        </View>
                        {renderInputField(
                          'Relationship',
                          formData.emergencyContactRelationship,
                          (value) => updateField('emergencyContactRelationship', value),
                          'e.g., Family, Friend (optional)',
                          'heart',
                          { autoCapitalize: 'words' }
                        )}
                      </>
                    )}
                    <View style={[styles.buttonContainer, { flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }]}> 
                      <CustomButton
                        mode="contained"
                        onPress={() => setStep(1)}
                        style={[styles.actionButton, { alignSelf: 'center', minHeight: 44, paddingVertical: 0, width: 220, marginBottom: theme.spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
                        textColor="#ffffff"
                        icon={() => (
                          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" style={{ marginRight: 8 }} />
                        )}
                        accessibilityLabel="Go back to previous step"
                      >
                        Back
                      </CustomButton>
                      <CustomButton
                        mode="contained"
                        onPress={handleRegister}
                        loading={loading}
                        disabled={loading}
                        style={[styles.actionButton, { alignSelf: 'center', minHeight: 44, paddingVertical: 0, width: 220 }]}
                        textColor="#ffffff"
                      >
                        Create
                      </CustomButton>
                    </View>
                    <View style={styles.signInPromptContainer}>
                      <ThemedText variant="bodyLarge" style={styles.signInPromptText}>
                        Already have an account?{' '}
                      </ThemedText>
                      <TouchableOpacity
                        onPress={() => navigation.navigate('Login')}
                        accessible={true}
                        accessibilityLabel="Sign in to existing account"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <ThemedText variant="bodyLarge" style={styles.signInPromptLink}>
                          Sign In
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
};

const createStyles = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 20,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 22,
    },
    stepTitle: {
      color: '#ffffff',
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
      fontWeight: 'bold',
    },
    stepSubtitle: {
      color: '#cccccc',
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    formBox: {
      width: '100%',
      maxWidth: 480,
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
      paddingHorizontal: theme.spacing.l,
      paddingVertical: 6,
      minHeight: 54,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
      width: '100%',
    },
    inputIcon: {
      marginRight: theme.spacing.sm,
    },
    input: {
      flex: 1,
      fontSize: 18,
      color: theme.colors.text.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.ms,
      minHeight: 22,
      textAlignVertical: 'center',
      width: '100%',
    },
    passwordInput: {
      paddingRight: theme.spacing.sm,
    },
    passwordToggle: {
      padding: theme.spacing.sm,
      marginLeft: theme.spacing.sm,
    },
    userTypeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      backgroundColor: '#ffffff',
      borderRadius: 24,
      padding: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    userTypeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: 20,
      flex: 1,
      marginHorizontal: 2,
      minHeight: 56,
      minWidth: 120,
    },
    userTypeOptionSelected: {
      backgroundColor: '#3BA4F9',
    },
    userTypeText: {
      marginLeft: theme.spacing.sm,
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
      flex: 1,
    },
    userTypeTextSelected: {
      color: '#ffffff',
    },
    actionButton: {
      width: '100%',
      borderRadius: 24,
      backgroundColor: '#3BA4F9',
      elevation: 3,
      shadowColor: '#3BA4F9',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      minHeight: 44,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
    },
    buttonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      marginTop: theme.spacing.lg,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xl,
      paddingHorizontal: theme.spacing.ms,
      borderRadius: 44,
      backgroundColor: '#ffffff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
      minHeight: 44,
    },
    backButtonText: {
      color: '#3BA4F9',
      marginLeft: theme.spacing.sm,
      fontSize: 18,
      fontWeight: 'bold',
    },
    signInPromptContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
    signInPromptText: {
      color: '#ffffff',
      fontSize: 16,
    },
    signInPromptLink: {
      color: '#3BA4F9',
      fontWeight: 'bold',
      fontSize: 16,
      textDecorationLine: 'underline',
    },
    phoneInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      borderRadius: 24,
      paddingHorizontal: theme.spacing.l,
      paddingVertical: 6,
      minHeight: 54,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
      width: '100%',
      marginBottom: theme.spacing.lg,
    },
    countryCodeSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.s,
      borderRadius: 20,
      backgroundColor: '#f0f0f0',
      marginRight: theme.spacing.ms,
      minWidth: 100,
    },
    countryCodeText: {
      marginHorizontal: theme.spacing.ms,
      fontSize: 16,
      fontWeight: 'bold',
    },
    phoneNumberInput: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    countryPickerModal: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: '#ffffff',
      borderRadius: 24,
      padding: theme.spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
      zIndex: 10,
    },
    countryList: {
      maxHeight: 200,
    },
    countryOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: 15,
      marginVertical: theme.spacing.xs,
    },
    selectedCountryOption: {
      backgroundColor: '#e0e0e0',
    },
    countryOptionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    countryCodeInList: {
      fontSize: 16,
      fontWeight: 'bold',
      marginRight: theme.spacing.sm,
    },
    countryName: {
      fontSize: 16,
      fontWeight: 'bold',
      marginRight: theme.spacing.sm,
    },
    countryDigits: {
      fontSize: 14,
      color:'rgba(224, 224, 224, 0)',
    },
  });
};

export default RegisterScreen;