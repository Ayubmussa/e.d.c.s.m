import React from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Animated, Dimensions, PanResponder } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { height } = Dimensions.get('window');

export default function BottomSheet({ visible, onClose, children, heightRatio = 0.45 }) {
  const { theme } = useTheme();
  const sheetHeight = height * heightRatio;
  const translateY = React.useRef(new Animated.Value(sheetHeight)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: sheetHeight,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // PanResponder for swipe down to close
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.background} />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            shadowColor: theme.colors.shadow,
            transform: [{ translateY }],
            height: sheetHeight,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.handle} />
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    justifyContent: 'flex-end',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheet: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    elevation: 10,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginBottom: 12,
  },
});
