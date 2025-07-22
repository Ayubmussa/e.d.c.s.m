import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button,
  TextInput,
  Chip,
  Surface,
  ProgressBar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHealth } from '../../context/HealthContext';
import { theme } from '../../theme/theme';
import { HEALTH_CONFIG, UI_CONFIG } from '../../config/config';

const HealthCheckinScreen = ({ navigation, route }) => {
  const { todayCheckin, createHealthCheckin, updateHealthCheckin, loading } = useHealth();
  const isUpdate = route?.params?.isUpdate || false;
  
  const [formData, setFormData] = useState({
    checkin_date: new Date().toISOString().split('T')[0],
    mood_rating: todayCheckin?.mood_rating || 3,
    energy_level: todayCheckin?.energy_level || 3,
    pain_level: todayCheckin?.pain_level || 0,
    sleep_quality: todayCheckin?.sleep_quality || 3,
    symptoms: Array.isArray(todayCheckin?.symptoms) ? todayCheckin.symptoms : [],
    activities: Array.isArray(todayCheckin?.activities) ? todayCheckin.activities : [],
    notes: todayCheckin?.notes || '',
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSymptom = (symptom) => {
    const currentSymptoms = formData.symptoms;
    if (currentSymptoms.includes(symptom)) {
      updateField('symptoms', currentSymptoms.filter(s => s !== symptom));
    } else {
      updateField('symptoms', [...currentSymptoms, symptom]);
    }
  };

  const toggleActivity = (activity) => {
    const currentActivities = formData.activities;
    if (currentActivities.includes(activity)) {
      updateField('activities', currentActivities.filter(a => a !== activity));
    } else {
      updateField('activities', [...currentActivities, activity]);
    }
  };

  const handleSave = async () => {
    const checkinData = {
      ...formData,
      notes: formData.notes.trim(),
    };

    let result;
    if (isUpdate && todayCheckin) {
      result = await updateHealthCheckin(todayCheckin.id, checkinData);
    } else {
      result = await createHealthCheckin(checkinData);
    }

    if (result.success) {
      Alert.alert(
        'Success',
        isUpdate ? 'Health check-in updated!' : 'Health check-in completed!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert('Error', result.error);
    }
  };

  // Define arrays safely with fallbacks
  const commonSymptoms = [
    'headache', 'fatigue', 'nausea', 'dizziness', 'fever',
    'cough', 'shortness_of_breath', 'chest_pain', 'back_pain',
    'joint_pain', 'anxiety', 'depression', 'insomnia',
  ];

  const commonActivities = [
    'walking', 'exercise', 'reading', 'meditation', 'socializing',
    'cooking', 'gardening', 'watching_tv', 'listening_music',
    'phone_calls', 'housework', 'shopping', 'doctor_visit',
  ];

  // Ensure formData has proper fallbacks
  const safeFormData = {
    symptoms: formData.symptoms || [],
    activities: formData.activities || [],
    ...formData
  };

  const getRatingLabel = (rating, type) => {
    if (!rating && rating !== 0) return 'Unknown';
    
    switch (type) {
      case 'mood':
        if (!HEALTH_CONFIG?.MOOD_SCALE?.LABELS) return 'Unknown';
        const moodLabel = HEALTH_CONFIG.MOOD_SCALE.LABELS[rating - 1];
        return moodLabel || 'Unknown';
      case 'pain':
        if (!HEALTH_CONFIG?.PAIN_SCALE?.LABELS) return 'Unknown';
        const painIndex = Math.min(Math.max(0, rating), HEALTH_CONFIG.PAIN_SCALE.LABELS.length - 1);
        const painLabel = HEALTH_CONFIG.PAIN_SCALE.LABELS[painIndex];
        return painLabel || 'Unknown';
      case 'energy':
      case 'sleep':
        return `${rating}/5`;
      default:
        return `${rating}/5`;
    }
  };

  const getRatingColor = (rating, type) => {
    if (type === 'pain') {
      if (rating === 0) return theme.colors.success;
      if (rating <= 3) return theme.colors.warning;
      return theme.colors.error;
    } else {
      if (rating >= 4) return theme.colors.success;
      if (rating >= 3) return theme.colors.primary;
      return theme.colors.warning;
    }
  };

  const ScaleSelector = ({ title, value, min, max, type, onValueChange, icon }) => {
    // Ensure all props are defined with fallbacks
    const safeTitle = title || '';
    const safeValue = typeof value === 'number' ? value : (min || 1);
    const safeMin = typeof min === 'number' ? min : 1;
    const safeMax = typeof max === 'number' ? max : 5;
    const safeType = type || 'default';
    const safeIcon = icon || 'help-circle';
    
    return (
      <Surface style={styles.scaleContainer}>
        <View style={styles.scaleHeader}>
          <MaterialCommunityIcons name={safeIcon} size={24} color={theme.colors.primary} />
          <Text style={styles.scaleTitle}>{safeTitle}</Text>
        </View>
        
        <View style={styles.scaleValue}>
          <Text style={[styles.scaleNumber, { color: getRatingColor(safeValue, safeType) }]}>
            {safeValue}
          </Text>
          <Text style={styles.scaleLabel}>
            {getRatingLabel(safeValue, safeType)}
          </Text>
        </View>
        
        <View style={styles.scaleButtons}>
          {Array.from({ length: safeMax - safeMin + 1 }, (_, i) => i + safeMin).map((num) => (
            <Button
              key={num}
              mode={safeValue === num ? 'contained' : 'outlined'}
              compact
              onPress={() => onValueChange && onValueChange(num)}
              style={styles.scaleButton}
              buttonColor={safeValue === num ? getRatingColor(num, safeType) : undefined}
            >
              {String(num)}
            </Button>
          ))}
        </View>
      </Surface>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      <View style={styles.header}>
        <MaterialCommunityIcons 
          name="heart-pulse" 
          size={48} 
          color={theme.colors.primary} 
        />
        <Title style={styles.title}>
          {isUpdate ? 'Update' : 'Daily'} Health Check-in
        </Title>
        <Paragraph style={styles.subtitle}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Paragraph>
      </View>

      <View style={styles.form}>
        <ScaleSelector
          title="How is your mood today?"
          value={formData.mood_rating}
          min={HEALTH_CONFIG?.MOOD_SCALE?.MIN || 1}
          max={HEALTH_CONFIG?.MOOD_SCALE?.MAX || 5}
          type="mood"
          onValueChange={(value) => updateField('mood_rating', value)}
          icon="emoticon-happy"
        />

        <ScaleSelector
          title="How is your energy level?"
          value={formData.energy_level}
          min={1}
          max={5}
          type="energy"
          onValueChange={(value) => updateField('energy_level', value)}
          icon="battery"
        />

        <ScaleSelector
          title="Rate your pain level"
          value={formData.pain_level}
          min={HEALTH_CONFIG?.PAIN_SCALE?.MIN || 0}
          max={HEALTH_CONFIG?.PAIN_SCALE?.MAX || 10}
          type="pain"
          onValueChange={(value) => updateField('pain_level', value)}
          icon="alert-circle"
        />

        <ScaleSelector
          title="How well did you sleep?"
          value={formData.sleep_quality}
          min={1}
          max={5}
          type="sleep"
          onValueChange={(value) => updateField('sleep_quality', value)}
          icon="sleep"
        />

        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons 
                name="alert-outline" 
                size={24} 
                color={theme.colors.primary} 
              />
              <Text style={styles.sectionTitle}>Symptoms</Text>
            </View>
            <Paragraph style={styles.sectionSubtitle}>
              Select any symptoms you're experiencing today
            </Paragraph>
            <View style={styles.chipContainer}>
              {commonSymptoms.map((symptom) => (
                <Chip
                  key={symptom}
                  selected={safeFormData.symptoms.includes(symptom)}
                  onPress={() => toggleSymptom(symptom)}
                  style={styles.chip}
                >
                  {symptom.replace('_', ' ')}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons 
                name="run" 
                size={24} 
                color={theme.colors.primary} 
              />
              <Text style={styles.sectionTitle}>Activities</Text>
            </View>
            <Paragraph style={styles.sectionSubtitle}>
              What activities did you do today?
            </Paragraph>
            <View style={styles.chipContainer}>
              {commonActivities.map((activity) => (
                <Chip
                  key={activity}
                  selected={safeFormData.activities.includes(activity)}
                  onPress={() => toggleActivity(activity)}
                  style={styles.chip}
                >
                  {activity.replace('_', ' ')}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons 
                name="note-text" 
                size={24} 
                color={theme.colors.primary} 
              />
              <Text style={styles.sectionTitle}>Additional Notes</Text>
            </View>
            <TextInput
              value={formData.notes}
              onChangeText={(value) => updateField('notes', value)}
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder="Anything else you'd like to note about your health today?"
              style={styles.notesInput}
            />
          </Card.Content>
        </Card>

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            contentStyle={styles.buttonContent}
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
          >
            {isUpdate ? 'Update' : 'Complete'} Check-in
          </Button>
        </View>
      </View>
    </ScrollView>
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
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.h3.fontSize,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.primary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: theme.typography.body1.fontSize + 1,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  form: {
    gap: theme.spacing.lg,
  },
  scaleContainer: {
    padding: theme.spacing.lg,
    borderRadius: theme.roundness,
    elevation: 2,
  },
  scaleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  scaleTitle: {
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  scaleValue: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  scaleNumber: {
    fontSize: theme.typography.h2.fontSize,
    fontFamily: theme.typography.h2.fontFamily,
  },
  scaleLabel: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  scaleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  scaleButton: {
    flex: 1,
    minWidth: 40,
  },
  sectionCard: {
    borderRadius: theme.roundness,
    elevation: 3,
    backgroundColor: theme.colors.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  notesInput: {
    fontSize: UI_CONFIG.FONT_SIZES.MEDIUM,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  buttonContent: {
    height: UI_CONFIG.TOUCH_TARGET_SIZE,
  },
});

export default HealthCheckinScreen;
