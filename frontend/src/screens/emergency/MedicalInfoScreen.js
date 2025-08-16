import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const MedicalInfoScreen = ({ navigation }) => {
  const [medicalInfo, setMedicalInfo] = useState({
    bloodType: '',
    allergies: '',
    medications: '',
    conditions: '',
    emergencyNotes: '',
    organDonor: false,
    insuranceProvider: '',
    policyNumber: '',
    doctorName: '',
    doctorPhone: '',
    hospitalPreference: '',
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    // Here you would typically save to your backend/database
    Alert.alert(
      'Success',
      'Medical information has been saved successfully!',
      [
        {
          text: 'OK',
          onPress: () => setIsEditing(false),
        },
      ]
    );
  };

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const renderInfoField = (label, value, field, multiline = false, keyboardType = 'default') => (
    <View style={styles.infoField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={[styles.fieldInput, multiline && styles.multilineInput]}
          value={value}
          onChangeText={(text) => setMedicalInfo({...medicalInfo, [field]: text})}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={theme.colors.text.secondary}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          keyboardType={keyboardType}
        />
      ) : (
        <Text style={styles.fieldValue}>{value || 'Not specified'}</Text>
      )}
    </View>
  );

  const renderBloodTypeSelector = () => (
    <View style={styles.infoField}>
      <Text style={styles.fieldLabel}>Blood Type</Text>
      {isEditing ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.bloodTypeContainer}
        >
          {bloodTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.bloodTypeChip,
                medicalInfo.bloodType === type && styles.bloodTypeChipSelected
              ]}
              onPress={() => setMedicalInfo({...medicalInfo, bloodType: type})}
            >
              <Text style={[
                styles.bloodTypeText,
                medicalInfo.bloodType === type && styles.bloodTypeTextSelected
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.fieldValue}>{medicalInfo.bloodType || 'Not specified'}</Text>
      )}
    </View>
  );

  const renderSwitchField = (label, value, field, description) => (
    <View style={styles.switchField}>
      <View style={styles.switchFieldLeft}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {description && <Text style={styles.fieldDescription}>{description}</Text>}
      </View>
      {isEditing ? (
        <Switch
          value={value}
          onValueChange={(newValue) => setMedicalInfo({...medicalInfo, [field]: newValue})}
          trackColor={{ false: theme.colors.text.secondary, true: theme.colors.primary }}
          thumbColor={value ? theme.colors.white : theme.colors.white}
        />
      ) : (
        <Text style={styles.fieldValue}>{value ? 'Yes' : 'No'}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.error} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color={theme.colors.white} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical Information</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => isEditing ? handleSave() : setIsEditing(true)}
        >
          <MaterialCommunityIcons 
            name={isEditing ? "content-save" : "pencil"} 
            size={24} 
            color={theme.colors.white} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Emergency Alert */}
        <View style={styles.emergencyAlert}>
          <MaterialCommunityIcons 
            name="alert-circle" 
            size={24} 
            color={theme.colors.error} 
          />
          <Text style={styles.emergencyAlertText}>
            This information will be shared with emergency responders when needed.
          </Text>
        </View>

        {/* Basic Medical Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          {renderBloodTypeSelector()}
          
          {renderInfoField(
            'Allergies', 
            medicalInfo.allergies, 
            'allergies', 
            true
          )}
          
          {renderInfoField(
            'Current Medications', 
            medicalInfo.medications, 
            'medications', 
            true
          )}
          
          {renderInfoField(
            'Medical Conditions', 
            medicalInfo.conditions, 
            'conditions', 
            true
          )}
        </View>

        {/* Emergency Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Details</Text>
          
          {renderInfoField(
            'Emergency Notes', 
            medicalInfo.emergencyNotes, 
            'emergencyNotes', 
            true
          )}
          
          {renderSwitchField(
            'Organ Donor',
            medicalInfo.organDonor,
            'organDonor',
            'Willing to donate organs in case of emergency'
          )}
        </View>

        {/* Insurance & Healthcare */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Healthcare Information</Text>
          
          {renderInfoField(
            'Insurance Provider', 
            medicalInfo.insuranceProvider, 
            'insuranceProvider'
          )}
          
          {renderInfoField(
            'Policy Number', 
            medicalInfo.policyNumber, 
            'policyNumber'
          )}
          
          {renderInfoField(
            'Primary Doctor', 
            medicalInfo.doctorName, 
            'doctorName'
          )}
          
          {renderInfoField(
            'Doctor Phone', 
            medicalInfo.doctorPhone, 
            'doctorPhone',
            false,
            'phone-pad'
          )}
          
          {renderInfoField(
            'Preferred Hospital', 
            medicalInfo.hospitalPreference, 
            'hospitalPreference'
          )}
        </View>

        {/* Important Notice */}
        <View style={styles.noticeBox}>
          <MaterialCommunityIcons 
            name="information" 
            size={20} 
            color={theme.colors.info} 
          />
          <Text style={styles.noticeText}>
            Keep this information up to date. It can be accessed even when your phone is locked 
            through the emergency screen.
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {isEditing && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => setIsEditing(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
          >
            <MaterialCommunityIcons 
              name="content-save" 
              size={20} 
              color={theme.colors.white} 
            />
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.error,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    color: theme.colors.white,
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emergencyAlert: {
    flexDirection: 'row',
    backgroundColor: theme.colors.error + '20',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  emergencyAlertText: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.error,
    flex: 1,
    marginLeft: 8,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.cardBackground,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontFamily: theme.typography.h4.fontFamily,
    color: theme.colors.primary,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  infoField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: theme.typography.body1.fontSize + 1,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.primary,
    marginBottom: 8,
    fontWeight: '600',
  },
  fieldValue: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.secondary,
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 8,
    minHeight: 44,
    textAlignVertical: 'center',
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.white,
    minHeight: 44,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bloodTypeContainer: {
    marginTop: 8,
  },
  bloodTypeChip: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    minWidth: 50,
    alignItems: 'center',
  },
  bloodTypeChipSelected: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
  },
  bloodTypeText: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
  },
  bloodTypeTextSelected: {
    color: theme.colors.white,
  },
  switchField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  switchFieldLeft: {
    flex: 1,
  },
  fieldDescription: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.info + '20',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  noticeText: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.text.secondary,
    flex: 1,
    marginLeft: 8,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.text.secondary,
  },
  cancelButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.button.fontSize,
    fontFamily: theme.typography.button.fontFamily,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.button.fontSize,
    fontFamily: theme.typography.button.fontFamily,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default MedicalInfoScreen;
