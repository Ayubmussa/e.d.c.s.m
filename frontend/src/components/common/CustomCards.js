import React from 'react';
import { View } from 'react-native';
import { Text, Avatar, Surface, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { ThemedCardTitle, ThemedCardContent, ThemedText } from './ThemedText';

// Utility to validate color string (simple hex or rgba)
const isValidColor = (c) =>
  typeof c === 'string' &&
  (/^#[0-9A-Fa-f]{3,6}$/.test(c) || /^rgba?\(/.test(c));

export const WellnessCard = ({
  title,
  score,
  status,
  icon,
  color,
  details = [],
  onPress,
  style,
  children
}) => {
  // Use theme blue as primary color for elderly-friendly design
  const safeColor = isValidColor(color) ? color : theme.colors.primary;
  // Consistent blue theming for all status indicators
  const statusColor = theme.colors.primary;
  
  return (
    <Surface
      style={[{
        marginBottom: theme.spacing.card,
        borderRadius: theme.borderRadius.card,
        backgroundColor: theme.colors.cardBackground,
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, // increased for better definition
        shadowRadius: 12,
        elevation: 6, // increased for elderly users
        borderWidth: 1,
        borderColor: theme.colors.borderColor,
        padding: theme.spacing.card,
        minHeight: 120, // minimum height for easy interaction
      }, style]}
      onTouchEnd={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${title || 'Wellness card'}${score ? ` with score ${score}%` : ''}${status ? ` status ${status}` : ''}`}
    >
      <View style={{ marginBottom: children ? 16 : 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          {icon && (
            <Avatar.Icon
              size={64} // increased from 56 for elderly users
              icon={icon}
              style={{ 
                backgroundColor: safeColor, 
                marginRight: 18, // increased spacing
                borderRadius: 20 // increased radius
              }}
            />
          )}
          <View style={{ flex: 1 }}>
            {title && (
              <ThemedCardTitle style={{ marginBottom: 6, color: '#000000', fontWeight: 'bold' }}>
                {title}
              </ThemedCardTitle>
            )}
            {score !== undefined && (
              <ThemedText 
                variant="headlineSmall" 
                style={{ 
                  fontWeight: 'bold', 
                  marginBottom: 4,
                  fontSize: 28, // larger score display
                  color: '#000000'
                }}
              >
                {score}%
              </ThemedText>
            )}
            {status && (
              <ThemedText 
                variant="bodyLarge" 
                style={{ 
                  textTransform: 'capitalize',
                  fontWeight: 'bold',
                  color: '#000000'
                }}
              >
                {status}
              </ThemedText>
            )}
          </View>
        </View>
        {details.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {details.map((detail, index) => (
              <Chip 
                key={index} 
                compact={false} // larger chips for elderly users
                style={{ 
                  backgroundColor: theme.colors.primarySoft, 
                  marginRight: 8, 
                  marginBottom: 8, 
                  borderRadius: 16,
                  minHeight: 36 // minimum touch target
                }} 
                textStyle={{ 
                  color: theme.colors.primary,
                  fontSize: 16, // increased font size
                  fontWeight: '500'
                }}
              >
                {detail}
              </Chip>
            ))}
          </View>
        )}
      </View>

      {children && (
        <View style={{ marginTop: 8 }}>
          {children}
        </View>
      )}
    </Surface>
  );
};

export const QuickActionCard = ({
  title,
  description,
  icon,
  color,
  badge,
  onPress,
  style,
  children,
  showBadge = false
}) => {
  const safeColor = isValidColor(color) ? color : theme.colors.primary;
  
  return (
    <Surface
      style={[{
        flex: 1,
        margin: 8,
        borderRadius: theme.borderRadius.card,
        backgroundColor: theme.colors.cardBackground,
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: theme.colors.borderColor,
        alignItems: 'center',
        padding: theme.spacing.card,
        minHeight: 100, // increased minimum height
        minWidth: 140, // minimum width for elderly users
        position: 'relative',
      }, style]}
      onTouchEnd={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${title || 'Quick action'}${description ? ` - ${description}` : ''}${badge ? ` with ${badge} notifications` : ''}`}
    >
      <View style={{ position: 'relative', marginBottom: 14 }}>
        {icon && (
          <Avatar.Icon
            size={64} // increased from 56
            icon={icon}
            style={{ 
              backgroundColor: safeColor, 
              borderRadius: 20 
            }}
          />
        )}
        {(badge || showBadge) && (
          <Surface
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              minWidth: 28, // increased minimum size
              minHeight: 28,
              borderRadius: 14,
              backgroundColor: theme.colors.error,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: theme.colors.cardBackground,
              paddingHorizontal: 6,
            }}
          >
            <Text style={{ 
              color: 'white', 
              fontSize: 14, // increased font size
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              {badge || '!'}
            </Text>
          </Surface>
        )}
      </View>
      
      {title && (
        <ThemedCardTitle style={{ 
          textAlign: 'center', 
          marginBottom: 6,
          fontSize: 18 // slightly larger for quick actions
        }}>
          {title}
        </ThemedCardTitle>
      )}
      
      {description && (
        <ThemedText 
          variant="bodyMedium" 
          color="secondary" 
          style={{ 
            textAlign: 'center',
            fontSize: 16 // increased readability
          }}
        >
          {description}
        </ThemedText>
      )}

      {children && (
        <View style={{ marginTop: 8, alignItems: 'center' }}>
          {children}
        </View>
      )}
    </Surface>
  );
};

export const HealthMetricCard = ({
  metric,
  value,
  unit,
  trend,
  icon,
  color,
  style,
  children
}) => {
  const safeColor = isValidColor(color) ? color : theme.colors.primary;
  
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      case 'stable': return 'trending-neutral';
      default: return 'minus';
    }
  };
  
  // Use consistent blue theming for trends
  const getTrendColor = () => theme.colors.primary;
  
  return (
    <Surface style={[{
      padding: theme.spacing.card,
      borderRadius: theme.borderRadius.card,
      flex: 1,
      margin: 8,
      backgroundColor: theme.colors.cardBackground,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
      borderWidth: 1,
      borderColor: theme.colors.borderColor,
      minHeight: 140, // increased for elderly users
    }, style]}>
      <View style={{ alignItems: 'center' }}>
        {icon && (
          <Avatar.Icon
            size={48} // slightly increased
            icon={icon}
            style={{ 
              backgroundColor: safeColor, 
              marginBottom: 14, // increased spacing
              borderRadius: 16 
            }}
          />
        )}
        
        <ThemedText 
          variant="headlineSmall" 
          color="blue" 
          style={{ 
            fontWeight: 'bold', 
            marginBottom: 4,
            textAlign: 'center',
            fontSize: 32 // larger metric value
          }}
        >
          {value}
        </ThemedText>
        
        <ThemedText 
          variant="bodyLarge" 
          color="secondary" 
          style={{ 
            marginBottom: 6,
            textAlign: 'center',
            fontSize: 16
          }}
        >
          {unit}
        </ThemedText>
        
        <ThemedCardTitle style={{ 
          textTransform: 'capitalize',
          textAlign: 'center',
          marginBottom: trend ? 8 : 0
        }}>
          {metric}
        </ThemedCardTitle>
        
        {trend && (
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginTop: 6 
          }}>
            <MaterialCommunityIcons 
              name={getTrendIcon()} 
              size={20} 
              color={getTrendColor()}
              style={{ marginRight: 6 }}
            />
            <ThemedText 
              variant="bodyMedium" 
              color="blue" 
              style={{ 
                textTransform: 'capitalize',
                fontWeight: '500'
              }}
            >
              {trend}
            </ThemedText>
          </View>
        )}

        {children && (
          <View style={{ marginTop: 12, alignItems: 'center' }}>
            {children}
          </View>
        )}
      </View>
    </Surface>
  );
};

export const NotificationCard = ({
  title,
  message,
  time,
  type = 'info',
  priority = 'normal',
  onPress,
  onDismiss,
  style,
  children
}) => {
  // Consistent blue theming for all notification types
  const getTypeColor = () => theme.colors.primary;
  const getTypeIcon = () => 'information';
  
  const typeColor = getTypeColor();
  const isHighPriority = priority === 'high';
  
  return (
    <Surface
      style={[{
        marginBottom: theme.spacing.card / 2,
        borderRadius: theme.borderRadius.card,
        backgroundColor: isHighPriority ? 
          theme.colors.primarySoft : 
          theme.colors.cardBackground,
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
        borderLeftWidth: 6,
        borderLeftColor: typeColor,
        borderWidth: 1,
        borderColor: theme.colors.borderColor,
        padding: theme.spacing.card,
        minHeight: 80, // minimum height for easy interaction
      }, style]}
      onTouchEnd={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Notification: ${title}${message ? ` - ${message}` : ''}${time ? ` at ${time}` : ''}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ marginRight: 14 }}>
          <Avatar.Icon
            size={44} // appropriate size for notifications
            icon={getTypeIcon()}
            style={{ 
              backgroundColor: typeColor + '20', // subtle background
            }}
          />
        </View>
        
        <View style={{ flex: 1 }}>
          {title && (
            <ThemedCardTitle style={{ 
              marginBottom: 6,
              fontSize: 18 
            }}>
              {title}
            </ThemedCardTitle>
          )}
          
          {message && (
            <ThemedCardContent style={{ 
              marginBottom: time ? 8 : 0,
              lineHeight: 22
            }}>
              {message}
            </ThemedCardContent>
          )}
          
          {time && (
            <ThemedText 
              variant="bodySmall" 
              color="secondary"
              style={{ fontSize: 14 }}
            >
              {time}
            </ThemedText>
          )}
        </View>
        
        {onDismiss && (
          <View style={{ marginLeft: 8 }}>
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={theme.colors.textSecondary}
              onPress={onDismiss}
              style={{ 
                padding: 4, // increase touch area
                borderRadius: 12,
                backgroundColor: theme.colors.surfaceSecondary
              }}
            />
          </View>
        )}
      </View>

      {children && (
        <View style={{ marginTop: 12 }}>
          {children}
        </View>
      )}
    </Surface>
  );
};
