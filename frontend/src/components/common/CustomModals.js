import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { 
  Modal, 
  Portal, 
  Text, 
  Button, 
  Surface,
  IconButton,
  Divider,
} from 'react-native-paper';
import { theme } from '../../theme/theme';

export const ConfirmationModal = ({ 
  visible, 
  onDismiss, 
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  style 
}) => (
  <Portal>
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={[
        {
          backgroundColor: theme.colors.surface,
          margin: 20,
          borderRadius: 8,
          padding: 24,
        },
        style,
      ]}
    >
      <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 16 }}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={{ marginBottom: 24, color: theme.colors.secondary }}>
        {message}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
        <Button mode="outlined" onPress={onDismiss}>
          {typeof cancelText === 'string' ? <Text>{cancelText}</Text> : cancelText}
        </Button>
        <Button 
          mode="contained" 
          onPress={onConfirm}
          buttonColor={confirmVariant === 'error' ? theme.colors.error : theme.colors.primary}
        >
          {typeof confirmText === 'string' ? <Text>{confirmText}</Text> : confirmText}
        </Button>
      </View>
    </Modal>
  </Portal>
);

export const InfoModal = ({ 
  visible, 
  onDismiss,
  title,
  content,
  actions = [],
  style 
}) => (
  <Portal>
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={[
        {
          backgroundColor: theme.colors.surface,
          margin: 20,
          borderRadius: 8,
          maxHeight: '80%',
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 24, paddingBottom: 16 }}>
        <Text variant="headlineSmall" style={{ fontWeight: 'bold', flex: 1 }}>
          {title}
        </Text>
        <IconButton icon="close" onPress={onDismiss} />
      </View>
      
      <Divider />
      
      <ScrollView style={{ padding: 24, paddingTop: 16 }}>
        {content}
      </ScrollView>
      
      {actions.length > 0 && (
        <>
          <Divider />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 24, paddingTop: 16, gap: 12 }}>
            {actions.map((action, index) => (
              <Button
                key={index}
                mode={action.mode || 'outlined'}
                onPress={action.onPress}
                buttonColor={action.color}
              >
                {action.label}
              </Button>
            ))}
          </View>
        </>
      )}
    </Modal>
  </Portal>
);

export const BottomSheetModal = ({ 
  visible, 
  onDismiss,
  title,
  children,
  style 
}) => (
  <Portal>
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={[
        {
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          marginTop: 'auto',
          maxHeight: '90%',
        },
        style,
      ]}
    >
      <Surface style={{ padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <View style={{
            width: 40,
            height: 4,
            backgroundColor: theme.colors.outline,
            borderRadius: 2,
          }} />
        </View>
        
        {title && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>
              {title}
            </Text>
            <IconButton icon="close" onPress={onDismiss} />
          </View>
        )}
      </Surface>
      
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {children}
      </ScrollView>
    </Modal>
  </Portal>
);

export const QuickActionModal = ({ 
  visible, 
  onDismiss,
  title = 'Quick Actions',
  actions = [],
  style 
}) => (
  <Portal>
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={[
        {
          backgroundColor: theme.colors.surface,
          margin: 20,
          borderRadius: 8,
          padding: 16,
        },
        style,
      ]}
    >
      <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
        {title}
      </Text>
      
      <View style={{ gap: 8 }}>
        {actions.map((action, index) => (
          <Button
            key={index}
            mode="outlined"
            icon={action.icon}
            onPress={() => {
              action.onPress();
              onDismiss();
            }}
            style={{ justifyContent: 'flex-start', paddingVertical: 8 }}
            contentStyle={{ paddingHorizontal: 16 }}
          >
            {action.label}
          </Button>
        ))}
      </View>
      
      <Button mode="text" onPress={onDismiss} style={{ marginTop: 16 }}>
        Cancel
      </Button>
    </Modal>
  </Portal>
);

export const LoadingModal = ({ 
  visible, 
  message = 'Loading...',
  style 
}) => (
  <Portal>
    <Modal
      visible={visible}
      dismissable={false}
      contentContainerStyle={[
        {
          backgroundColor: theme.colors.surface,
          margin: 20,
          borderRadius: 8,
          padding: 24,
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Text variant="bodyLarge" style={{ textAlign: 'center' }}>
        {message}
      </Text>
    </Modal>
  </Portal>
);
