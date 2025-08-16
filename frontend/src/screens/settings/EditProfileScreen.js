import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { shadows } from '../../utils/shadows';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import mime from 'react-native-mime-types';
import { API_CONFIG } from '../../config/config';

const EditProfileScreen = ({ navigation }) => {
  const { user, token, updateProfile } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    medicalConditions: '',
    medications: '',
    allergies: '',
    bloodType: '',
  });

  // Populate profileData from user context on mount
  // Helper to ensure all values are strings
  const sanitizeProfileData = (data) => {
    const safe = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        safe[key] = '';
      } else if (typeof value === 'object') {
        safe[key] = JSON.stringify(value);
      } else {
        safe[key] = String(value);
      }
    });
    return safe;
  };

  useEffect(() => {
    if (user) {
      setProfileData(sanitizeProfileData({
        firstName: user.firstName || user.first_name || '',
        lastName: user.lastName || user.last_name || '',
        email: user.email || '',
        phone: user.phone || user.phoneNumber || user.phone_number || '',
        dateOfBirth: user.dateOfBirth || user.date_of_birth || '',
        address: user.address || '',
        emergencyContact: user.emergencyContact || user.emergency_contact || '',
        emergencyPhone: user.emergencyPhone || user.emergency_phone || '',
        medicalConditions: user.medicalConditions || user.medical_conditions || '',
        medications: user.medications || '',
        allergies: user.allergies || '',
        bloodType: user.bloodType || user.blood_type || '',
      }));
    }
  }, [user]);

  const [isEditing, setIsEditing] = useState({});
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [saving, setSaving] = useState(false);

  const uploadProfileImageToBackend = async (uri) => {
    try {
      const apiUrl = `${API_CONFIG.BASE_URL}/api/profile/upload-image`;
      const fileType = mime.lookup(uri) || 'image/jpeg';
      
      // Debug logs
      console.log('=== UPLOAD DEBUG START ===');
      console.log('Uploading to:', apiUrl);
      console.log('Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      console.log('Image URI:', uri);
      console.log('File type:', fileType);
      
      // Validate inputs
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      console.log('Validating image URI:', uri);
      console.log('URI type:', typeof uri);
      console.log('URI starts with file://', uri?.startsWith('file://'));
      console.log('URI starts with content://', uri?.startsWith('content://'));
      console.log('URI starts with http://', uri?.startsWith('http://'));
      console.log('URI starts with https://', uri?.startsWith('https://'));
      
      // Accept multiple URI formats for different platforms
      const validUriFormats = ['file://', 'content://', 'http://', 'https://'];
      const isValidUri = uri && validUriFormats.some(format => uri.startsWith(format));
      
      if (!isValidUri) {
        throw new Error(`Invalid image URI format: ${uri}. Expected formats: ${validUriFormats.join(', ')}`);
      }
      
      const formData = new FormData();
      formData.append('profileImage', {
        uri,
        name: `profile.jpg`,
        type: fileType,
      });
      
      console.log('FormData created, making fetch request...');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Do NOT set 'Content-Type' here; let fetch set it automatically
        },
        body: formData,
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response not ok:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Response JSON:', result);
      
      if (result.success) {
        if (result.imageUrl) {
          console.log('=== UPLOAD SUCCESS ===');
          console.log('Image URL received:', result.imageUrl);
          return result.imageUrl;
        } else {
          console.warn('Backend returned success but no imageUrl');
          // Try to construct the URL manually if we have the user ID
          if (user && user.id) {
            const fallbackUrl = `${API_CONFIG.BASE_URL}/api/profile/image/${user.id}.jpg`;
            console.log('Using fallback URL:', fallbackUrl);
            return fallbackUrl;
          } else {
            throw new Error('Upload successful but no image URL received');
          }
        }
      } else {
        console.error('Upload failed:', result);
        throw new Error(result.error || 'Failed to upload image');
      }
    } catch (err) {
      console.error('=== UPLOAD ERROR ===');
      console.error('Error details:', err);
      if (err instanceof TypeError && err.message === 'Network request failed') {
        console.error('Network request failed. This may be due to device/emulator not being able to reach the backend, or an issue with file URI.');
      }
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      Alert.alert('Image Upload Error', err.message);
      return null;
    }
  };

  // Helper to build a valid profile update payload for the backend
  function buildProfileUpdatePayload(profileData, profileImage) {
    return {
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      email: profileData.email,
      phone_number: profileData.phone,
      date_of_birth: profileData.dateOfBirth,
      address: profileData.address,
      emergency_contact: (() => {
        if (typeof profileData.emergencyContact === 'string') {
          // Try to parse as JSON, fallback to object with name
          try {
            return JSON.parse(profileData.emergencyContact);
          } catch {
            return { name: profileData.emergencyContact };
          }
        }
        return profileData.emergencyContact;
      })(),
      medical_conditions: profileData.medicalConditions,
      profile_image: profileImage || profileData.profile_image,
      user_type: user.userType || user.user_type,
    };
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare profile data for update
      const updatePayload = buildProfileUpdatePayload(profileData, profileImage);
      const result = await updateProfile(updatePayload);
      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const toggleEdit = (field) => {
    setIsEditing(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const updateField = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChangeProfileImage = async () => {
    console.log('=== IMAGE PICKER START ===');
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log('Permission result:', permissionResult);
    
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access media library is required!');
      return;
    }
    
    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: false,
      allowsMultipleSelection: false,
    });
    
    console.log('Picker result:', pickerResult);
    console.log('Picker result type:', typeof pickerResult);
    console.log('Picker result cancelled:', pickerResult.cancelled);
    const imageUri = pickerResult.assets?.[0]?.uri;
    console.log('Image selected:', imageUri);
    console.log('Picker result assets:', pickerResult.assets);
    
    if (!pickerResult.cancelled && imageUri) {
      console.log('Full picker result:', JSON.stringify(pickerResult, null, 2));
      console.log('Using image URI:', imageUri);
      setProfileImage(imageUri);
      // Upload to backend and get public URL
      console.log('Starting upload to backend...');
      let publicUrl = await uploadProfileImageToBackend(imageUri);
      if (publicUrl) {
        publicUrl = publicUrl + '?t=' + Date.now() + '_' + Math.floor(Math.random() * 1e8);
      }
      console.log('Upload result:', publicUrl);
      if (publicUrl) {
        console.log('=== PROFILE IMAGE UPDATE START ===');
        console.log('Public URL received:', publicUrl);
        console.log('Current user object:', user);
        console.log('Current profileImage state:', profileImage);
        // Test if the URL is accessible
        try {
          console.log('Testing image URL accessibility...');
          const testResponse = await fetch(publicUrl, { method: 'HEAD' });
          console.log('Image URL test response status:', testResponse.status);
          console.log('Image URL test response headers:', testResponse.headers);
          if (!testResponse.ok) {
            console.warn('Image URL might not be accessible:', testResponse.status);
          }
        } catch (testError) {
          console.error('Image URL test failed:', testError);
        }
        setProfileImage(null); // Clear local preview, rely on context
        // Update user context immediately with the new profile image
        console.log('Updating user context with profile image...');
        const updatePayload = buildProfileUpdatePayload(profileData, publicUrl);
        const updateResult = await updateProfile(updatePayload);
        console.log('Update profile result:', updateResult);
        // Also update the local state to reflect the change immediately
        setProfileData(prev => ({
          ...prev,
          profile_image: publicUrl
        }));
        console.log('=== PROFILE IMAGE UPDATE COMPLETE ===');
      }
    } else {
      console.log('Image picker cancelled or no image URI found');
    }
  };

  const renderEditableField = (label, field, icon, multiline = false, keyboardType = 'default') => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <MaterialCommunityIcons 
          name={icon} 
          size={20} 
          color={theme.colors.primary} 
        />
        <Text style={styles.fieldLabel}>{label}</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => toggleEdit(field)}
        >
          <MaterialCommunityIcons 
            name={isEditing[field] ? "check" : "pencil"} 
            size={18} 
            color={isEditing[field] ? theme.colors.success : theme.colors.primary} 
          />
        </TouchableOpacity>
      </View>
      
      {isEditing[field] ? (
        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          value={profileData[field]}
          onChangeText={(text) => updateField(field, text)}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={theme.colors.text.secondary}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          keyboardType={keyboardType}
          autoFocus
          onBlur={() => toggleEdit(field)}
        />
      ) : (
        <Text style={styles.fieldValue}>
          {typeof profileData[field] === 'string' ? profileData[field] : (profileData[field] ? JSON.stringify(profileData[field]) : 'Not specified')}
        </Text>
      )}
    </View>
  );

  // For display, always use the context unless previewing a new image
  const imageToDisplay = profileImage || user?.profile_image || user?.profileImage;
  console.log('EditProfileScreen: Profile image being displayed:', imageToDisplay);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Box */}
        <View style={[styles.infoBox, { marginTop: 32 }]}>
          <MaterialCommunityIcons 
            name="information" 
            size={50} 
            color={theme.colors.info} 
          />
          <Text style={styles.infoText}>
            Keep your profile information up to date for better health monitoring 
            and emergency assistance. Medical information is kept confidential and secure.
          </Text>
        </View>

        {/* Profile Picture */}
        <View style={[styles.profilePictureSection, styles.card]}>
          <View style={styles.profilePicture}>
            {imageToDisplay ? (
              <Image
                source={{ uri: imageToDisplay }}
                style={styles.profileImage}
                onLoad={() => console.log('Profile image loaded successfully:', imageToDisplay)}
                onError={(error) => console.error('Profile image failed to load:', error.nativeEvent.error, 'URL:', imageToDisplay)}
                onLoadStart={() => console.log('Profile image loading started:', imageToDisplay)}
                onLoadEnd={() => console.log('Profile image loading ended:', imageToDisplay)}
              />
            ) : (
              <MaterialCommunityIcons 
                name="account-circle" 
                size={100} 
                color={theme.colors.primary} 
              />
            )}
          </View>
          <TouchableOpacity style={styles.changePictureButton} onPress={handleChangeProfileImage}>
            <MaterialCommunityIcons 
              name="camera" 
              size={20} 
              color={theme.colors.white} 
            />
            <Text style={styles.changePictureText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Information */}
        <View style={[styles.section, styles.card]}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {renderEditableField('First Name', 'firstName', 'account')}
          {renderEditableField('Last Name', 'lastName', 'account')}
          {renderEditableField('Email', 'email', 'email', false, 'email-address')}
          {renderEditableField('Phone', 'phone', 'phone', false, 'phone-pad')}
          {renderEditableField('Date of Birth', 'dateOfBirth', 'calendar')}
          {renderEditableField('Address', 'address', 'home', true)}
        </View>

        {/* Emergency Contact */}
        <View style={[styles.section, styles.card]}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          {renderEditableField('Contact Name', 'emergencyContact', 'account-alert')}
          {renderEditableField('Contact Phone', 'emergencyPhone', 'phone-ring', false, 'phone-pad')}
        </View>

        {/* Medical Information */}
        <View style={[styles.section, styles.card]}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          {renderEditableField('Medical Conditions', 'medicalConditions', 'medical-bag', true)}
          {renderEditableField('Current Medications', 'medications', 'pill', true)}
          {renderEditableField('Allergies', 'allergies', 'alert-rhombus', true)}
          {renderEditableField('Blood Type', 'bloodType', 'water')}
        </View>

        {/* Save Button at the end */}
        <TouchableOpacity
          style={{
            width: '100%',
            marginTop: 10,
            marginBottom: 30,
            backgroundColor: theme.colors.primary,
            borderRadius: 24,
            paddingHorizontal: 0,
            paddingVertical: 16,
            alignSelf: 'center',
          }}
          onPress={handleSave}
          disabled={saving}
        >
          <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%'}}>
            <MaterialCommunityIcons 
              name="content-save" 
              size={24} 
              color={theme.colors.white} 
              style={{ marginRight: 8 }}
            />
            <Text style={{color: theme.colors.white, fontWeight: 'bold', fontSize: 18, textAlign: 'center'}}>Save</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};


function createStyles(theme) {
  const { shadows } = require('../../utils/shadows');
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.primary,
      paddingTop: 50,
      paddingBottom: 20,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      flex: 1,
    },
    headerTitle: {
      flex: 2,
      color: theme.colors.white,
      fontSize: theme.typography.h6.fontSize,
      fontFamily: theme.typography.h6.fontFamily,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    saveButton: {
      flex: 1,
      alignItems: 'flex-end',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    profilePictureSection: {
      alignItems: 'center',
      marginBottom: 16,
      padding: 12,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    profilePicture: {
      marginBottom: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      resizeMode: 'cover',
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    changePictureButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginTop: 4,
    },
    changePictureText: {
      color: theme.colors.white,
      marginLeft: 6,
      fontWeight: '600',
    },
    section: {
      marginBottom: 30,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 18,
      marginBottom: 18,
      ...shadows.card,
    },
    sectionTitle: {
      fontSize: theme.typography.h6.fontSize,
      fontFamily: theme.typography.h6.fontFamily,
      color: theme.colors.text.primary,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    fieldContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
    },
    fieldHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    fieldLabel: {
      fontSize: theme.typography.body1.fontSize,
      fontFamily: theme.typography.body1.fontFamily,
      color: theme.colors.text.primary,
      fontWeight: '600',
      marginLeft: 8,
      flex: 1,
    },
    editButton: {
      padding: 4,
    },
    fieldValue: {
      fontSize: theme.typography.body1.fontSize,
      fontFamily: theme.typography.body1.fontFamily,
      color: theme.colors.text.secondary,
      lineHeight: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.primary,
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: theme.typography.body1.fontSize,
      fontFamily: theme.typography.body1.fontFamily,
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.white,
    },
    multilineInput: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    infoBox: {
      flexDirection: 'row',
      backgroundColor: theme.colors.info + '20',
      padding: 16,
      borderRadius: 8,
      marginBottom: 20,
    },
    infoText: {
      fontSize: theme.typography.caption.fontSize,
      fontFamily: theme.typography.caption.fontFamily,
      color: theme.colors.text.secondary,
      flex: 1,
      marginLeft: 8,
      lineHeight: 18,
    },
  });
}

export default EditProfileScreen;
