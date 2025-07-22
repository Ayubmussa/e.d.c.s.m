import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Card, Title, TextInput, Button, Chip, HelperText, Switch, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { familyService } from '../../services/familyService';
import { useTheme } from '../../context/ThemeContext';


// Unified InviteFamilyScreen for FamilyCaregiver
const RELATIONSHIP_OPTIONS = [
  { label: 'Child', value: 'child' },
  { label: 'Spouse', value: 'spouse' },
  { label: 'Sibling', value: 'sibling' },
  { label: 'Parent', value: 'parent' },
  { label: 'Friend', value: 'friend' },
  { label: 'Professional Caregiver', value: 'professional_caregiver' },
  { label: 'Other', value: 'other' },
];

const InviteFamilyScreen = ({ navigation, route }) => {
  const { userType } = route?.params || {};
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const isCaregiver = userType === 'caregiver';

  const [formData, setFormData] = useState({
    emailOrPhone: '',
    relationship: RELATIONSHIP_OPTIONS[0].value,
    message: '',
    accessLevel: 'view',
  });
  const [permissions, setPermissions] = useState({
    viewHealth: false,
    viewMedications: false,
    viewEmergency: true,
    viewLocation: false,
    manageSettings: false,
    receiveAlerts: true,
  });
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const togglePermission = (permission) => setPermissions(prev => ({ ...prev, [permission]: !prev[permission] }));

  const validateForm = () => {
    const { emailOrPhone, relationship } = formData;
    if (!emailOrPhone.trim()) {
      Alert.alert('Error', 'Please enter an email address or phone number');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!emailRegex.test(emailOrPhone) && !phoneRegex.test(emailOrPhone.replace(/\D/g, ''))) {
      Alert.alert('Error', 'Please enter a valid email address or phone number');
      return false;
    }
    if (!relationship) {
      Alert.alert('Error', 'Please select a relationship');
      return false;
    }
    return true;
  };

  const handleInvite = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const result = await familyService.inviteFamilyMember(
        formData.emailOrPhone,
        formData.relationship,
        formData.accessLevel,
        formData.message
      );
      if (result.success) {
        Alert.alert('Success', 'Invitation sent successfully');
        navigation.goBack();
      } else {
        Alert.alert('Error', result.error || 'Failed to send invite');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Card.Title title="Invite Family Member or Caregiver" left={props => <MaterialCommunityIcons name="account-plus" size={28} color={theme.colors.primary} />} />
          <Card.Content>
            <TextInput
              label="Email or Phone"
              value={formData.emailOrPhone}
              onChangeText={text => updateField('emailOrPhone', text)}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              left={<TextInput.Icon icon="email" />}
            />
            <HelperText type="info">Enter a valid email or phone number</HelperText>
            
            <Text style={{
              marginBottom: 8,
              color: theme.colors.text,
              fontSize: 18,
              fontWeight: 'bold',
              letterSpacing: 0.5,
            }}>
              Relationships
            </Text>
            <View style={styles.chipContainer}>
              {RELATIONSHIP_OPTIONS.map(opt => (
                <Chip
                  key={opt.value}
                  selected={formData.relationship === opt.value}
                  onPress={() => updateField('relationship', opt.value)}
                  style={styles.chip}
                  mode={formData.relationship === opt.value ? 'flat' : 'outlined'}
                >
                  {opt.label}
                </Chip>
              ))}
            </View>
            <TextInput
              label="Message (optional)"
              value={formData.message}
              onChangeText={text => updateField('message', text)}
              style={styles.input}
              multiline
            />
            <Divider style={{ marginVertical: 12 }} />
            <Title style={styles.sectionTitle}>Permissions</Title>
            {Object.keys(permissions).map(key => (
              <View key={key} style={styles.permissionRow}>
                <Text style={styles.permissionLabel}>{key.replace(/([A-Z])/g, ' $1')}</Text>
                <Switch
                  value={permissions[key]}
                  onValueChange={() => togglePermission(key)}
                  color={theme.colors.primary}
                />
              </View>
            ))}
            <View style={{ alignItems: 'center' }}>
              <Button
                mode="contained"
                onPress={handleInvite}
                loading={loading}
                style={styles.button}
                disabled={loading}
              >
                Send Invite
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
    justifyContent: 'center',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    marginVertical: 12,
    padding: 8,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  input: {
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
    fontSize: 18,
    color: theme.colors.primary,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  permissionLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  button: {
    marginTop: 20,
    borderRadius: 8,
  },
});

export default InviteFamilyScreen;
