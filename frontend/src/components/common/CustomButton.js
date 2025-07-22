import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { shadows } from '../../utils/shadows';

export const CustomButton = ({ 
  children, 
  mode = 'contained', 
  size = 'medium',
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  onPress,
  style,
  contentStyle,
  labelStyle,
  ...props 
}) => {
  // Elderly-friendly: Extra large, high-contrast, rounded, accessible with minimum 44px touch targets
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          button: { 
            minHeight: 44, // WCAG minimum touch target
            borderRadius: theme.borderRadius.button, 
            paddingHorizontal: 20 // increased padding
          },
          content: { paddingVertical: 12, paddingHorizontal: 20 },
          label: { fontSize: 18 } // increased from 16
        };
      case 'large':
        return {
          button: { 
            minHeight: 56, // increased for elderly users
            borderRadius: theme.borderRadius.button, 
            paddingHorizontal: 36 // increased padding
          },
          content: { paddingVertical: 18, paddingHorizontal: 36 },
          label: { fontSize: 24, fontWeight: '700' } // increased from 22
        };
      default: // medium
        return {
          button: { 
            minHeight: 50, // increased from 52 for better elderly access
            borderRadius: theme.borderRadius.button, 
            paddingHorizontal: 28 // increased padding
          },
          content: { paddingVertical: 16, paddingHorizontal: 28 },
          label: { fontSize: 20, fontWeight: '700' } // increased from 18
        };
    }
  };

  // Elderly-friendly blue variants with high contrast
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: theme.colors.buttonBgSecondary,
          textColor: theme.colors.buttonTextSecondary,
          borderColor: theme.colors.primary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          textColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        };
      case 'emergency':
        return {
          backgroundColor: theme.colors.emergencyPrimary,
          textColor: '#ffffff',
          borderColor: theme.colors.emergencyPrimary,
        };
      default: // primary
        return {
    backgroundColor: theme.colors.buttonBg,
    textColor: theme.colors.buttonText,
    borderColor: theme.colors.buttonBg,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  return (
    <PaperButton
      mode={mode}
      disabled={disabled}
      loading={loading}
      icon={icon}
      onPress={onPress}
      buttonColor={
        disabled
          ? theme.colors.buttonBgDisabled
          : mode === 'contained'
            ? variantStyles.backgroundColor
            : mode === 'outlined'
              ? 'transparent'
              : variantStyles.backgroundColor
      }
      textColor={
        disabled
          ? theme.colors.buttonTextDisabled
          : variantStyles.textColor
      }
      style={[
        sizeStyles.button,
        {
          borderRadius: theme.borderRadius.button,
          borderWidth: mode === 'outlined' ? 2 : 0,
          borderColor: disabled ? theme.colors.buttonBgDisabled : variantStyles.borderColor,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 3 }, // increased shadow
          shadowOpacity: 0.15, // increased opacity for better definition
          shadowRadius: 10, // increased radius
          elevation: 4, // increased elevation
        },
        style,
      ]}
      contentStyle={[
        sizeStyles.content,
        { minHeight: sizeStyles.button.minHeight },
        contentStyle,
      ]}
      labelStyle={[
        sizeStyles.label,
        { 
          fontFamily: theme.fonts.medium.fontFamily, 
          fontWeight: theme.typography.button.fontWeight,
          letterSpacing: 0.5, // improved readability
        },
        labelStyle,
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityHint={disabled ? 'Button is disabled' : 'Tap to activate'}
      {...props}
    >
      {children}
    </PaperButton>
  );
};

export const ActionButton = ({ 
  title, 
  description, 
  icon, 
  color = theme.colors.primary,
  onPress,
  style,
  showBadge = false,
}) => (
  <View style={[{ flex: 1, margin: 6 }, style]}> {/* increased margin */}
    <CustomButton
      mode="outlined"
      size="medium"
      onPress={onPress}
      style={{ 
        borderColor: color, 
        backgroundColor: color + '12', // lighter background
        paddingVertical: 20, // increased padding
        minHeight: 80, // increased height for elderly users
        position: 'relative',
      }}
      contentStyle={{ 
        flexDirection: 'column', 
        paddingVertical: 16, // increased padding
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 76, // ensure content area is large enough
      }}
      icon={icon}
      labelStyle={{ 
        color: color, 
        fontSize: 16, // increased from 12
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 6, // increased spacing
        lineHeight: 20, // improved readability
      }}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${title}${description ? ` - ${description}` : ''}`}
    >
      {title}
      {showBadge && (
        <View style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: theme.colors.error,
          borderWidth: 2,
          borderColor: '#ffffff',
        }} />
      )}
    </CustomButton>
  </View>
);

export const EmergencyButton = ({ onPress, style }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      {
        borderRadius: 35, // circular button
        width: 70,
        height: 70,
        backgroundColor: theme.colors.emergencyPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.large,
        // Enhanced shadow for emergency button
        shadowColor: theme.colors.emergencyPrimary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
      },
      style,
    ]}
    accessible={true}
    accessibilityRole="button"
    accessibilityLabel="Emergency call button"
    accessibilityHint="Double tap to make emergency call"
    activeOpacity={0.8}
  >
    <MaterialCommunityIcons 
      name="phone-alert" 
      size={32} 
      color="#ffffff" 
    />
  </TouchableOpacity>
);

// New elderly-friendly quick action card component
export const QuickActionCard = ({
  title,
  subtitle,
  icon,
  color = theme.colors.primary,
  onPress,
  style,
  showBadge = false,
}) => (
  <TouchableOpacity 
    style={[
      {
        backgroundColor: '#ffffff',
        borderRadius: theme.borderRadius.card,
        padding: theme.spacing.card,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 140, // increased minimum width
        maxWidth: 160, // increased maximum width
        minHeight: 100, // increased height for elderly users
        marginHorizontal: 6,
        marginVertical: 4,
        borderWidth: 1,
        borderColor: theme.colors.borderColor,
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 4,
        position: 'relative',
      },
      style
    ]}
    onPress={onPress}
    accessible={true}
    accessibilityRole="button"
    accessibilityLabel={`${title}${subtitle ? ` - ${subtitle}` : ''}`}
    activeOpacity={0.8}
  >
    {/* Icon container */}
    <View style={{
      width: 52, // increased icon container size
      height: 52,
      borderRadius: 26,
      backgroundColor: color + '15', // subtle background
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10, // increased spacing
    }}>
      <MaterialCommunityIcons 
        name={icon} 
        size={28} 
        color={color} 
      />
      
      {/* Badge indicator */}
      {showBadge && (
        <View style={{
          position: 'absolute',
          top: -2,
          right: -2,
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: theme.colors.error,
          borderWidth: 2,
          borderColor: '#ffffff',
          zIndex: 2,
        }} />
      )}
    </View>
    
    {/* Title */}
    {title && (
      <Text style={{
        fontSize: 16, // increased from 15
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 4,
      }}>
        {title}
      </Text>
    )}
    
    {/* Subtitle */}
    {subtitle && (
      <Text style={{
        fontSize: 14, // increased from 12
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
        marginTop: 2,
      }}>
        {subtitle}
      </Text>
    )}
  </TouchableOpacity>
);
