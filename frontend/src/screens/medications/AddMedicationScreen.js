import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { 
  TextInput, 
  Button, 
  Card, 
  Title, 
  Paragraph,
  SegmentedButtons,
  Chip,
  Surface,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMedication } from '../../context/MedicationContext';
import { theme } from '../../theme/theme';
import { MEDICATION_CONFIG, UI_CONFIG } from '../../config/config';

const AddMedicationScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'once_daily',
    times: ['08:00'],
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: '',
  });

  const { addMedication, loading } = useMedication();

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateFrequency = (frequency) => {
    let defaultTimes = [];
    switch (frequency) {
      case 'once_daily':
        defaultTimes = ['08:00'];
        break;
      case 'twice_daily':
        defaultTimes = ['08:00', '20:00'];
        break;
      case 'three_times_daily':
        defaultTimes = ['08:00', '14:00', '20:00'];
        break;
      case 'four_times_daily':
        defaultTimes = ['08:00', '12:00', '16:00', '20:00'];
        break;
      default:
        defaultTimes = ['08:00'];
    }
    
    setFormData(prev => ({
      ...prev,
      frequency,
      times: defaultTimes,
    }));
  };

  const updateTime = (index, time) => {
    const newTimes = [...formData.times];
    newTimes[index] = time;
    updateField('times', newTimes);
  };

  const addTimeSlot = () => {
    updateField('times', [...formData.times, '12:00']);
  };

  const removeTimeSlot = (index) => {
    if (formData.times.length > 1) {
      const newTimes = formData.times.filter((_, i) => i !== index);
      updateField('times', newTimes);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter medication name');
      return false;
    }
    
    if (!formData.dosage.trim()) {
      Alert.alert('Error', 'Please enter dosage');
      return false;
    }
    
    if (formData.times.length === 0) {
      Alert.alert('Error', 'Please add at least one time');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const medicationData = {
      ...formData,
      name: formData.name.trim(),
      dosage: formData.dosage.trim(),
      notes: formData.notes.trim(),
    };

    const result = await addMedication(medicationData);
    
    if (result.success) {
      Alert.alert(
        'Success',
        'Medication added successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const timeSlotPresets = [
    { label: 'Morning', value: '08:00' },
    { label: 'Noon', value: '12:00' },
    { label: 'Afternoon', value: '16:00' },
    { label: 'Evening', value: '20:00' },
    { label: 'Night', value: '22:00' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Hero/Intro Section */}
      <View style={styles.heroSectionWrapper}>
        <View style={styles.heroSection}>
          <MaterialCommunityIcons name="pill-plus" size={48} color={theme.colors.primary} style={{ marginBottom: 8 }} />
          <Title style={styles.heroTitle}>Add Medication</Title>
          <Paragraph style={styles.heroSubtitle}>Easily add a new medication and set up reminders</Paragraph>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.modernCard}>
          <Card.Content>
            <View style={styles.form}>
              <TextInput
                label="Medication Name *"
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="pill" />}
                placeholder="e.g., Lisinopril"
              />
              <TextInput
                label="Dosage *"
                value={formData.dosage}
                onChangeText={(value) => updateField('dosage', value)}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="scale" />}
                placeholder="e.g., 10mg, 1 tablet"
              />
              {/* Frequency Section */}
              <View style={styles.section}>
                <Paragraph style={styles.sectionTitle}>Frequency</Paragraph>
                <View style={styles.frequencyContainer}>
                  {MEDICATION_CONFIG.DEFAULT_FREQUENCIES.slice(0, -1).map((freq) => (
                    <Chip
                      key={freq.value}
                      selected={formData.frequency === freq.value}
                      onPress={() => updateFrequency(freq.value)}
                      style={[styles.frequencyChip, formData.frequency === freq.value && styles.chipSelected]}
                      textStyle={styles.chipText}
                    >
                      {freq.label}
                    </Chip>
                  ))}
                </View>
              </View>
              {/* Times Section */}
              <View style={styles.section}>
                <Paragraph style={styles.sectionTitle}>Times</Paragraph>
                {formData.times.map((time, index) => (
                  <View key={index} style={styles.timeRow}>
                    <TextInput
                      label={`Time ${index + 1}`}
                      value={time}
                      onChangeText={(value) => updateTime(index, value)}
                      mode="outlined"
                      style={styles.timeInput}
                      placeholder="HH:MM"
                      keyboardType="numeric"
                      maxLength={5}
                    />
                    <View style={styles.timePresets}>
                      {timeSlotPresets.map((preset) => (
                        <Chip
                          key={preset.value}
                          compact
                          onPress={() => updateTime(index, preset.value)}
                          style={[
                            styles.presetChip,
                            time === preset.value && styles.chipSelected
                          ]}
                          textStyle={styles.chipText}
                        >
                          {preset.label}
                        </Chip>
                      ))}
                    </View>
                    {formData.times.length > 1 && (
                      <Button
                        mode="text"
                        onPress={() => removeTimeSlot(index)}
                        textColor={theme.colors.error}
                        icon="delete"
                        compact
                        style={styles.removeTimeButton}
                      >
                        Remove
                      </Button>
                    )}
                  </View>
                ))}
                <Button
                  mode="outlined"
                  onPress={addTimeSlot}
                  icon="plus"
                  style={styles.addTimeButton}
                >
                  Add Another Time
                </Button>
              </View>
              {/* Dates Section */}
              <View style={styles.dateSection}>
                <View style={styles.dateRow}>
                  <TextInput
                    label="Start Date"
                    value={formData.start_date}
                    onChangeText={(value) => updateField('start_date', value)}
                    mode="outlined"
                    style={styles.dateInput}
                    placeholder="YYYY-MM-DD"
                  />
                  <TextInput
                    label="End Date (Optional)"
                    value={formData.end_date}
                    onChangeText={(value) => updateField('end_date', value)}
                    mode="outlined"
                    style={styles.dateInput}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>
              <TextInput
                label="Notes (Optional)"
                value={formData.notes}
                onChangeText={(value) => updateField('notes', value)}
                mode="outlined"
                style={styles.input}
                multiline
                numberOfLines={3}
                left={<TextInput.Icon icon="note-text" />}
                placeholder="Special instructions, side effects, etc."
              />
              <View style={styles.actionButtons}>
                <Button
                  mode="outlined"
                  onPress={() => navigation.goBack()}
                  style={styles.cancelButton}
                  contentStyle={styles.buttonContent}
                  icon="close"
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSave}
                  loading={loading}
                  disabled={loading}
                  style={styles.saveButton}
                  contentStyle={styles.buttonContent}
                  icon="check"
                >
                  Add Medication
                </Button>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    padding: theme.spacing.md,
  },
  heroSectionWrapper: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.roundness,
    overflow: 'hidden',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2,
    backgroundColor: theme.colors.surface,
  },
  heroSection: {
    width: '100%',
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  heroTitle: {
    fontSize: theme.typography.h5.fontSize,
    fontWeight: theme.typography.h5.fontWeight,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xxs,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.text.secondary,
    marginBottom: 0,
    textAlign: 'center',
  },
  modernCard: {
    borderRadius: theme.roundness,
    elevation: 3,
    backgroundColor: theme.colors.surface,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  form: {
    gap: theme.spacing.lg,
  },
  input: {
    fontSize: theme.typography.body1.fontSize,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    color: theme.colors.text.primary,
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  frequencyChip: {
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.sm,
    elevation: 1,
    borderWidth: 0,
    paddingHorizontal: theme.spacing.md,
    height: 32,
    marginBottom: theme.spacing.sm,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
  },
  chipText: {
    fontWeight: 'bold',
    fontSize: theme.typography.body2.fontSize,
  },
  timeRow: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  timeInput: {
    flex: 1,
  },
  timePresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  presetChip: {
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.xs,
    elevation: 1,
    borderWidth: 0,
    paddingHorizontal: theme.spacing.md,
    height: 28,
    marginBottom: theme.spacing.xs,
  },
  removeTimeButton: {
    borderRadius: 18,
    minWidth: 80,
    marginLeft: 4,
  },
  addTimeButton: {
    borderRadius: 18,
    minWidth: 120,
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  dateSection: {
    gap: theme.spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  dateInput: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  cancelButton: {
    borderRadius: 18,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  saveButton: {
    borderRadius: 18,
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  buttonContent: {
    height: UI_CONFIG.TOUCH_TARGET_SIZE,
  },
});

export default AddMedicationScreen;
