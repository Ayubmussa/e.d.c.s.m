import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import UnifiedHeader from './UnifiedHeader';

const ScreenWithHeader = ({ 
  children, 
  title, 
  showBackButton = true,
  backgroundColor,
  titleColor,
}) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const userType = user?.userType || user?.user_type || 'elderly';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <UnifiedHeader
        title={title}
        navigation={navigation}
        userType={userType}
        showBackButton={showBackButton}
        backgroundColor={backgroundColor}
        titleColor={titleColor}
      />
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
};

export default ScreenWithHeader; 