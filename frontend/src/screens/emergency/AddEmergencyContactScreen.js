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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const AddEmergencyContactScreen = ({ navigation }) => {
  const [contactData, setContactData] = useState({
    name: '',
    phone: '',
    relationship: '',
    email: '',
    isPrimary: false,
  });

  const handleSaveContact = () => {
    if (!contactData.name.trim() || !contactData.phone.trim()) {
      Alert.alert('Error', 'Please fill in at least name and phone number.');
      return;
    }

    // Here you would typically save to your backend/database
    Alert.alert(
      'Success',
      'Emergency contact has been added successfully!',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const relationships = [
    'Family Member',
    'Spouse',
    'Child',
    'Sibling',
    'Friend',
    'Caregiver',
    'Doctor',
    'Neighbor',
    'Other',
  ];

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
        <Text style={styles.headerTitle}>Add Emergency Contact</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={contactData.name}
            onChangeText={(text) => setContactData({...contactData, name: text})}
            placeholder="Enter full name"
            placeholderTextColor={theme.colors.text.secondary}
          />
        </View>

        {/* Phone Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={contactData.phone}
            onChangeText={(text) => setContactData({...contactData, phone: text})}
            placeholder="Enter phone number"
            placeholderTextColor={theme.colors.text.secondary}
            keyboardType="phone-pad"
          />
        </View>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={contactData.email}
            onChangeText={(text) => setContactData({...contactData, email: text})}
            placeholder="Enter email address"
            placeholderTextColor={theme.colors.text.secondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Relationship */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Relationship</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.relationshipContainer}
          >
            {relationships.map((relationship) => (
              <TouchableOpacity
                key={relationship}
                style={[
                  styles.relationshipChip,
                  contactData.relationship === relationship && styles.relationshipChipSelected
                ]}
                onPress={() => setContactData({...contactData, relationship})}
              >
                <Text style={[
                  styles.relationshipText,
                  contactData.relationship === relationship && styles.relationshipTextSelected
                ]}>
                  {relationship}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Primary Contact Toggle */}
        <TouchableOpacity
          style={styles.primaryToggle}
          onPress={() => setContactData({...contactData, isPrimary: !contactData.isPrimary})}
        >
          <View style={styles.primaryToggleLeft}>
            <MaterialCommunityIcons 
              name="star" 
              size={20} 
              color={theme.colors.warning} 
            />
            <Text style={styles.primaryToggleText}>Set as Primary Contact</Text>
          </View>
          <MaterialCommunityIcons 
            name={contactData.isPrimary ? "toggle-switch" : "toggle-switch-off"} 
            size={24} 
            color={contactData.isPrimary ? theme.colors.primary : theme.colors.text.secondary} 
          />
        </TouchableOpacity>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons 
            name="information" 
            size={20} 
            color={theme.colors.info} 
          />
          <Text style={styles.infoText}>
            Primary contacts will be called first in emergency situations. 
            Make sure the phone number is always reachable.
          </Text>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSaveContact}
        >
          <MaterialCommunityIcons 
            name="content-save" 
            size={20} 
            color={theme.colors.white} 
          />
          <Text style={styles.saveButtonText}>Save Contact</Text>
        </TouchableOpacity>
      </View>
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
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: theme.colors.white,
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.primary,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.white,
  },
  relationshipContainer: {
    marginTop: 8,
  },
  relationshipChip: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  relationshipChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  relationshipText: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.text.primary,
  },
  relationshipTextSelected: {
    color: theme.colors.white,
  },
  primaryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  primaryToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  primaryToggleText: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.primary,
    marginLeft: 8,
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
  buttonContainer: {
    padding: 20,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  saveButton: {
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

export default AddEmergencyContactScreen;
