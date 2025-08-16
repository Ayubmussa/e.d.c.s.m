import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const BrainGameCategoryScreen = ({ navigation, route }) => {
  const { category } = route.params || {};

  // Defensive: If category or category.type is missing, show error UI
  if (!category || !category.type) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <Text style={{ color: theme.colors.error, fontSize: 18, marginBottom: 12 }}>Category data is missing or invalid.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 12, backgroundColor: theme.colors.primary, borderRadius: 8 }}>
          <Text style={{ color: theme.colors.white, fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Single unique game for each category
  const getGameForCategory = () => {
    switch (category.type) {
      case 'memory':
        return { id: 1, name: 'Number Sequence Memory', description: 'Remember sequences of numbers and recall them in the correct order', icon: 'numeric', difficulty: 'Medium', duration: '3-4 min', type: 'memory' };
      case 'attention':
        return { id: 2, name: 'Focus Finder', description: 'Find specific objects among distractors to improve your attention', icon: 'target', difficulty: 'Easy', duration: '2-3 min', type: 'attention' };
      case 'language':
        return { id: 3, name: 'Anagram Solver', description: 'Unscramble letters to form valid words and boost vocabulary', icon: 'alphabetical', difficulty: 'Medium', duration: '3-4 min', type: 'language' };
      case 'logic':
        return { id: 4, name: 'Sudoku', description: 'Fill the grid with numbers using logical reasoning', icon: 'table-large', difficulty: 'Hard', duration: '5-8 min', type: 'logic' };
      case 'processing':
        return { id: 5, name: 'Quick Math', description: 'Solve arithmetic problems as fast as possible to improve processing speed', icon: 'calculator', difficulty: 'Easy', duration: '2-3 min', type: 'processing' };
      case 'spatial':
        return { id: 6, name: 'Mental Rotation', description: 'Rotate objects mentally to match target orientations', icon: 'cube-outline', difficulty: 'Medium', duration: '3-5 min', type: 'spatial' };
      default:
        return null;
    }
  };

  const [game] = useState(getGameForCategory());

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return theme.colors.success;
      case 'Medium':
        return theme.colors.warning;
      case 'Hard':
        return theme.colors.error;
      default:
        return theme.colors.text.secondary;
    }
  };

  const renderGameCard = (game) => (
    <TouchableOpacity
      key={game.id}
      style={styles.gameCard}
      onPress={() => {
        if (!navigation || typeof navigation.navigate !== 'function') {
          Alert.alert('Navigation Error', 'Navigation is not available.');
          return;
        }
        if (!game) {
          Alert.alert('Error', 'Game data is missing.');
          return;
        }
        navigation.navigate('BrainGame', { game });
      }}
    >
      <View style={styles.gameCardHeader}>
        <View style={styles.gameIconContainer}>
          <MaterialCommunityIcons 
            name={game.icon} 
            size={32} 
            color={theme.colors.primary} 
          />
        </View>
        <View style={styles.gameInfo}>
          <Text style={styles.gameName}>{game.name}</Text>
          <Text style={styles.gameDescription}>{game.description}</Text>
        </View>
      </View>

      <View style={styles.gameCardFooter}>
        <View style={styles.gameMetrics}>
          <View style={styles.metric}>
            <MaterialCommunityIcons 
              name="clock-outline" 
              size={16} 
              color={theme.colors.text.secondary} 
            />
            <Text style={styles.metricText}>{game.duration}</Text>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(game.difficulty) + '20' }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(game.difficulty) }]}>
              {game.difficulty}
            </Text>
          </View>
        </View>
        <MaterialCommunityIcons 
          name="chevron-right" 
          size={24} 
          color={theme.colors.text.secondary} 
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color={theme.colors.textOnPrimary} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category.name}</Text>
      </View>

      {/* Category Info */}
      <View style={styles.categoryInfo}>
        <View style={styles.categoryIconContainer}>
          <MaterialCommunityIcons 
            name={category.icon} 
            size={40} 
            color={theme.colors.primary} 
          />
        </View>
        <View style={styles.categoryDetails}>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.categoryDescription}>{category.description}</Text>
        </View>
      </View>

      {/* Benefits 
      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsTitle}>Benefits:</Text>
        <View style={styles.benefitsList}>
          {category.benefits?.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <MaterialCommunityIcons 
                name="check-circle" 
                size={16} 
                color={theme.colors.success} 
              />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>
      </View>*/}

      {/* Game Display */}
      <ScrollView 
        style={styles.gamesList} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gamesListContent}
      >
        <View style={styles.gamesHeader}>
          <Text style={styles.gamesTitle}>Featured Game</Text>
          <Text style={styles.gamesCount}>1 game</Text>
        </View>

        {game ? renderGameCard(game) : (
          <View style={styles.noGameContainer}>
            <MaterialCommunityIcons 
              name="gamepad-variant" 
              size={48} 
              color={theme.colors.primary} 
            />
            <Text style={styles.noGameText}>No game available for this category</Text>
          </View>
        )}

        {/* Play Game Button */}
        {game && (
          <TouchableOpacity
            style={styles.playGameButton}
            onPress={() => {
              if (!navigation || typeof navigation.navigate !== 'function') {
                Alert.alert('Navigation Error', 'Navigation is not available.');
                return;
              }
              if (!game) {
                Alert.alert('Error', 'No game available.');
                return;
              }
              navigation.navigate('BrainGame', { game });
            }}
          >
            <MaterialCommunityIcons 
              name="play" 
              size={20} 
              color={theme.colors.textOnPrimary} 
            />
            <Text style={styles.playGameText}>Start Game</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    fontWeight: 'bold',
  },
  categoryInfo: {
    backgroundColor: theme.colors.surface,
    margin: 20,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: theme.typography.body2.fontSize,
    fontFamily: theme.typography.body2.fontFamily,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  benefitsContainer: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
  },
  benefitsTitle: {
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: theme.typography.body2.fontSize,
    fontFamily: theme.typography.body2.fontFamily,
    color: theme.colors.text.secondary,
    marginLeft: 8,
    flex: 1,
  },
  gamesList: {
    flex: 1,
  },
  gamesListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  gamesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gamesTitle: {
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
  },
  gamesCount: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.text.secondary,
  },
  gameCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  gameCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gameIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  gameCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    fontWeight: 'bold',
  },
  noGameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  noGameText: {
    fontSize: theme.typography.body2.fontSize,
    fontFamily: theme.typography.body2.fontFamily,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 16,
  },
  playGameButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.roundness,
    marginTop: theme.spacing.lg,
  },
  playGameText: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.typography.button.fontSize,
    fontFamily: theme.typography.button.fontFamily,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
});

export default BrainGameCategoryScreen;
