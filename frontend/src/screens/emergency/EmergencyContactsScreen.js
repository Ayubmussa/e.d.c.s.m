import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  FAB,
  List,
  IconButton,
  Button,
  Title,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const EmergencyContactsScreen = ({ navigation }) => {
  const [contacts, setContacts] = useState([
    {
      id: '1',
      name: 'Dr. Smith',
      phone: '+1-555-0123',
      relationship: 'Primary Doctor',
      isPrimary: true,
    },
    {
      id: '2',
      name: 'Jane Doe',
      phone: '+1-555-0456',
      relationship: 'Daughter',
      isPrimary: false,
    },
    {
      id: '3',
      name: 'Emergency Services',
      phone: '911',
      relationship: 'Emergency',
      isPrimary: false,
    },
  ]);

  const handleCallContact = (contact) => {
    Alert.alert(
      'Call Contact',
      `Call ${contact.name} at ${contact.phone}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Call',
          onPress: () => {
            // In a real app, you would use Linking.openURL(`tel:${contact.phone}`)
            console.log(`Calling ${contact.name} at ${contact.phone}`);
            Alert.alert('Call Initiated', `Calling ${contact.name}...`);
          },
        },
      ]
    );
  };

  const handleEditContact = (contact) => {
    Alert.alert('Edit Contact', `Edit contact ${contact.name}`);
  };

  const handleDeleteContact = (contactId) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this emergency contact?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setContacts(contacts.filter(contact => contact.id !== contactId));
          },
        },
      ]
    );
  };

  const handleAddContact = () => {
    Alert.alert('Add Contact', 'Add new emergency contact functionality would go here');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons 
            name="account-group" 
            size={60} 
            color={theme.colors.primary} 
          />
          <Title style={styles.title}>Emergency Contacts</Title>
          <Text style={styles.subtitle}>
            Manage your emergency contacts for quick access during urgent situations
          </Text>
        </View>

        <View style={styles.contactsList}>
          {contacts.map((contact) => (
            <Card key={contact.id} style={styles.contactCard}>
              <List.Item
                title={contact.name}
                description={`${contact.relationship} • ${contact.phone}`}
                left={(props) => (
                  <List.Icon 
                    {...props} 
                    icon={contact.isPrimary ? "account-star" : "account"} 
                    color={contact.isPrimary ? theme.colors.primary : theme.colors.text.secondary}
                  />
                )}
                right={() => (
                  <View style={styles.contactActions}>
                    <IconButton
                      icon="phone"
                      iconColor={theme.colors.primary}
                      size={24}
                      onPress={() => handleCallContact(contact)}
                    />
                    <IconButton
                      icon="pencil"
                      iconColor={theme.colors.text.secondary}
                      size={20}
                      onPress={() => handleEditContact(contact)}
                    />
                    {!contact.isPrimary && (
                      <IconButton
                        icon="delete"
                        iconColor={theme.colors.error}
                        size={20}
                        onPress={() => handleDeleteContact(contact.id)}
                      />
                    )}
                  </View>
                )}
              />
            </Card>
          ))}
        </View>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.infoTitle}>Quick Access</Text>
            <Text style={styles.infoText}>
              In case of emergency, you can quickly access these contacts from the main emergency screen.
            </Text>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              Back to Emergency
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddContact}
        label="Add Contact"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    paddingBottom: 100, // Space for FAB
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.h4.fontSize,
    fontFamily: theme.typography.h4.fontFamily,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
  },
  contactsList: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  contactCard: {
    elevation: 2,
    borderRadius: theme.roundness,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoCard: {
    elevation: 2,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
  },
  infoTitle: {
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  backButton: {
    borderColor: theme.colors.primary,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default EmergencyContactsScreen;
