import React, { useState, useEffect } from 'react';
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
  Switch,
  Button,
  Surface,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { familyService } from '../../services/familyService';
import { useTheme } from '../../context/ThemeContext';
import { ThemedText } from '../../components/common/ThemedText';
import { UI_CONFIG } from '../../config/config';

const ManagePermissionsScreen = ({ route, navigation }) => {
  const { relationshipId, elderlyId, elderlyName } = route.params;
  const [permissions, setPermissions] = useState({
    viewHealth: false,
    viewMedications: false,
    viewEmergency: false,
    viewLocation: false,
    manageSettings: false,
    receiveAlerts: false,
  });
  const [originalPermissions, setOriginalPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const loadPermissions = async () => {
    try {
      const result = await familyService.getPermissions(relationshipId);
      if (result.success) {
        const perms = result.data.permissions || {};
        setPermissions(perms);
        setOriginalPermissions(perms);
      } else {
        Alert.alert('Error', 'Failed to load permissions');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = (permission, value) => {
    setPermissions(prev => ({ ...prev, [permission]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await familyService.updatePermissions(relationshipId, permissions);
      if (result.success) {
        Alert.alert('Success', 'Permissions updated successfully');
        setOriginalPermissions(permissions);
      } else {
        Alert.alert('Error', result.error || 'Failed to update permissions');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText variant="bodyMedium">Loading...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Manage Permissions" left={props => <MaterialCommunityIcons name="shield-account" size={28} color={theme.colors.primary} />} />
        <Card.Content>
          {Object.keys(permissions).map(key => (
            <View key={key} style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>{key.replace(/([A-Z])/g, ' $1')}</Text>
              <Switch
                value={permissions[key]}
                onValueChange={value => updatePermission(key, value)}
                color={theme.colors.primary}
              />
            </View>
          ))}
          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            style={styles.button}
            disabled={saving}
          >
            Save Permissions
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  card: {
    borderRadius: 16,
    marginVertical: 12,
    padding: 8,
    backgroundColor: theme.colors.surface,
    elevation: 2,
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

export default ManagePermissionsScreen;
