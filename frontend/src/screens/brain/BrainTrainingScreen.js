import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  ScrollView,
  Alert,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText, ThemedHeading, ThemedCardTitle } from '../../components/common/ThemedText';
import { WellnessCard, QuickActionCard, HealthMetricCard } from '../../components/common/CustomCards';
import { CustomButton } from '../../components/common/CustomButton';
import brainTrainingService from '../../services/brainTrainingService';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const BrainTrainingScreen = (props) => {
  const navigation = props.navigation || useNavigation();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const [userProgress, setUserProgress] = useState(null);
  const [todaysGames, setTodaysGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBrainTrainingData();
  }, []);

  const loadBrainTrainingData = async () => {
    try {
      setLoading(true);
      const [progressResponse, gamesResponse] = await Promise.all([
        brainTrainingService.getUserProgress(),
        brainTrainingService.getTodaysGames()
      ]);
      
      console.log('Progress response:', progressResponse);
      console.log('Games response:', gamesResponse);
      
      // Set userProgress with safe fallbacks
      const progressData = progressResponse.data || {};
      setUserProgress({
        level: progressData.level || 1,
        streakDays: progressData.streakDays || 0,
        averageScore: progressData.averageScore || 0,
        ...progressData
      });
      
      // Ensure todaysGames is always an array
      const gamesData = gamesResponse.data;
      setTodaysGames(gamesData && Array.isArray(gamesData) ? gamesData : []);
    } catch (error) {
      console.error('Error loading brain training data:', error);
      Alert.alert('Error', 'Failed to load brain training data');
      // Set safe defaults on error
      setUserProgress({
        level: 1,
        streakDays: 0,
        averageScore: 0
      });
      setTodaysGames([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBrainTrainingData();
    setRefreshing(false);
  };

  const gameCategories = [
    {
      id: 'memory',
      type: 'memory',
      name: 'Memory Recall',
      icon: 'brain',
      color: '#2196F3',
      description: 'Test your memory with number sequences',
      games: ['Number Sequence Memory'],
      game: {
        id: 1,
        name: 'Number Sequence Memory',
        description: 'Remember sequences of numbers and recall them in the correct order',
        icon: 'numeric',
        difficulty: 'Medium',
        duration: '3-4 min',
        type: 'memory'
      }
    },
    {
      id: 'attention',
      type: 'attention',
      name: 'Focus Challenge',
      icon: 'eye',
      color: '#FF9800',
      description: 'Find targets among distractors',
      games: ['Focus Finder'],
      game: {
        id: 2,
        name: 'Focus Finder',
        description: 'Find specific objects among distractors to improve your attention',
        icon: 'target',
        difficulty: 'Easy',
        duration: '2-3 min',
        type: 'attention'
      }
    },
    {
      id: 'language',
      type: 'language',
      name: 'Word Puzzle',
      icon: 'alphabetical',
      color: '#4CAF50',
      description: 'Unscramble letters to form words',
      games: ['Anagram Solver'],
      game: {
        id: 3,
        name: 'Anagram Solver',
        description: 'Unscramble letters to form valid words and boost vocabulary',
        icon: 'alphabetical',
        difficulty: 'Medium',
        duration: '3-4 min',
        type: 'language'
      }
    },
    {
      id: 'logic',
      type: 'logic',
      name: 'Logic Puzzle',
      icon: 'puzzle',
      color: '#9C27B0',
      description: 'Solve number puzzles with logic',
      games: ['Sudoku'],
      game: {
        id: 4,
        name: 'Sudoku',
        description: 'Fill the grid with numbers using logical reasoning',
        icon: 'table-large',
        difficulty: 'Hard',
        duration: '5-8 min',
        type: 'logic'
      }
    },
    {
      id: 'processing',
      type: 'processing',
      name: 'Speed Math',
      icon: 'speedometer',
      color: '#F44336',
      description: 'Solve math problems quickly',
      games: ['Quick Math'],
      game: {
        id: 5,
        name: 'Quick Math',
        description: 'Solve arithmetic problems as fast as possible to improve processing speed',
        icon: 'calculator',
        difficulty: 'Easy',
        duration: '2-3 min',
        type: 'processing'
      }
    },
    {
      id: 'spatial',
      type: 'spatial',
      name: 'Spatial Rotation',
      icon: 'cube',
      color: '#607D8B',
      description: 'Visualize object rotations',
      games: ['Mental Rotation'],
      game: {
        id: 6,
        name: 'Mental Rotation',
        description: 'Rotate objects mentally to match target orientations',
        icon: 'cube-outline',
        difficulty: 'Medium',
        duration: '3-5 min',
        type: 'spatial'
      }
    }
  ];



  const renderTodaysGames = () => {
    if (!Array.isArray(todaysGames) || todaysGames.length === 0) return (
      <View style={styles.emptyGamesContainer}>
        <MaterialCommunityIcons 
          name="gamepad-variant" 
          size={48} 
          color={theme.colors.primary} 
        />
        <ThemedText variant="bodyLarge" style={styles.emptyGamesText}>
          No games available today.
        </ThemedText>
      </View>
    );

    return (
      <View style={styles.gamesContainer}>
        {todaysGames
          .filter(game => game && (game.name || game.id)) // Filter out invalid games
          .map((game, index) => (
          <TouchableOpacity
            key={index}
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
            activeOpacity={0.7}
          >
            <View style={styles.gameCardContent}>
              <View style={styles.gameIconContainer}>
                <MaterialCommunityIcons
                  name={game.icon || 'gamepad-variant'}
                  size={32}
                  color={game.color || theme.colors.primary}
                />
              </View>
              <View style={styles.gameInfo}>
                <ThemedCardTitle style={styles.gameName}>
                  {game.name || 'Unknown Game'}
                </ThemedCardTitle>
                <ThemedText variant="bodyMedium" style={styles.gameDetails}>
                  {game.difficulty || 'Medium'} • ~{game.estimatedTime || 5}min
                </ThemedText>
              </View>
              <CustomButton
                mode="contained"
                style={styles.playButton}
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
                Play
              </CustomButton>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderCategoryCard = (category) => (
    <TouchableOpacity
      key={category.id}
      style={styles.categoryCard}
      onPress={() => {
        if (!navigation || typeof navigation.navigate !== 'function') {
          Alert.alert('Navigation Error', 'Navigation is not available.');
          return;
        }
        if (!category) {
          Alert.alert('Error', 'Category data is missing.');
          return;
        }
        navigation.navigate('BrainGameCategory', { category });
      }}
      activeOpacity={0.7}
    >
      <View style={styles.categoryCardContent}>
        <View style={[styles.categoryIconContainer, { backgroundColor: category.color }]}>
          <MaterialCommunityIcons
            name={category.icon}
            size={48}
            color="#fff"
          />
        </View>
        <ThemedCardTitle style={styles.categoryName}>
          {category.name}
        </ThemedCardTitle>
        <ThemedText variant="bodyMedium" style={styles.categoryDescription}>
          {category.description}
        </ThemedText>
        <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
          <ThemedText variant="bodySmall" style={[styles.categoryBadgeText, { color: category.color }]}>
            1 game
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons 
          name="brain" 
          size={48} 
          color={theme.colors.primary} 
        />
        <ThemedText variant="bodyLarge" style={styles.loadingText}>
          Loading brain training...
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <HealthMetricCard
            metric="Level"
            value={userProgress?.level?.toString() || '1'}
            unit="lvl"
            color={theme.colors.primary}
            icon="trophy"
            style={styles.statCard}
          />
          <HealthMetricCard
            metric="Streak"
            value={userProgress?.streakDays?.toString() || '0'}
            unit="days"
            color={theme.colors.secondary}
            icon="fire"
            style={styles.statCard}
          />
          <HealthMetricCard
            metric="Score"
            value={Math.round(userProgress?.averageScore || 0).toString()}
            unit="/ 100"
            color={theme.colors.accent}
            icon="star"
            style={styles.statCard}
          />
        </View>

        {/* Today's Games 
        <View style={styles.todaysGamesSection}>
          <ThemedHeading variant="headlineMedium" style={styles.sectionTitle}>
            Today's Recommended Games
          </ThemedHeading>
          {renderTodaysGames()}
        </View>*/}

        {/* Quick Start Button */}
        <View style={styles.quickStartContainer}>
          <CustomButton
            mode="contained"
            onPress={() => {
              if (!navigation || typeof navigation.navigate !== 'function') {
                Alert.alert('Navigation Error', 'Navigation is not available.');
                return;
              }
              navigation.navigate('QuickBrainGame');
            }}
            style={styles.quickStartButton}
            icon="play"
          >
            Quick Game
          </CustomButton>
        </View>

        {/* Game Categories */}
        <View style={styles.categoriesSection}>
          <ThemedHeading variant="headlineMedium" style={styles.sectionTitle}>
            Game Categories
          </ThemedHeading>
          <View style={styles.categoriesGrid}>
            {gameCategories.map(renderCategoryCard)}
          </View>
        </View>

        {/* Extra spacing for better scrolling */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default BrainTrainingScreen;

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    padding: theme.spacing.md,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  loadingText: {
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
  },
  
  // Today's Games Section
  todaysGamesSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
    color: theme.colors.primary,
  },
  gamesContainer: {
    gap: theme.spacing.md,
  },
  gameCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  gameCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  gameIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    marginBottom: theme.spacing.xs,
  },
  gameDetails: {
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  playButton: {
    minWidth: 80,
    borderRadius: theme.spacing.sm,
  },
  emptyGamesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyGamesText: {
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  
  // Quick Start Button
  quickStartContainer: {
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  quickStartButton: {
    minWidth: 200,
    borderRadius: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  
  // Categories Section
  categoriesSection: {
    marginBottom: theme.spacing.lg,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'center',
  },
  categoryCard: {
    width: (width - theme.spacing.md * 3) / 2,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    minHeight: 180,
  },
  categoryCardContent: {
    padding: theme.spacing.md,
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  categoryName: {
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  categoryDescription: {
    textAlign: 'center',
    color: theme.colors.onSurface,
    opacity: 0.7,
    marginBottom: theme.spacing.md,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.spacing.sm,
  },
  categoryBadgeText: {
    fontWeight: '600',
  },
});
