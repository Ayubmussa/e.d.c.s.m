import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const QuickBrainGameScreen = ({ navigation }) => {
  const [gameState, setGameState] = useState('ready'); // ready, playing, completed
  const [currentGame, setCurrentGame] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

  // Quick game types with simple questions
  const quickGames = [
    {
      name: 'Quick Math',
      icon: 'calculator',
      type: 'math',
      generateQuestion: () => {
        const a = Math.floor(Math.random() * 20) + 1;
        const b = Math.floor(Math.random() * 20) + 1;
        const operations = ['+', '-', '×'];
        const op = operations[Math.floor(Math.random() * operations.length)];
        
        let answer;
        switch (op) {
          case '+':
            answer = a + b;
            break;
          case '-':
            answer = a - b;
            break;
          case '×':
            answer = a * b;
            break;
        }
        
        const wrongAnswers = [
          answer + Math.floor(Math.random() * 10) + 1,
          answer - Math.floor(Math.random() * 10) - 1,
          answer + Math.floor(Math.random() * 20) + 10,
        ];
        
        const options = [answer, ...wrongAnswers].sort(() => Math.random() - 0.5);
        
        return {
          question: `${a} ${op} ${b} = ?`,
          options: options.map(String),
          correct: options.indexOf(answer),
        };
      },
    },
    {
      name: 'Memory Colors',
      icon: 'palette',
      type: 'memory',
      generateQuestion: () => {
        const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange'];
        const sequence = [];
        const length = Math.floor(Math.random() * 3) + 3; // 3-5 colors
        
        for (let i = 0; i < length; i++) {
          sequence.push(colors[Math.floor(Math.random() * colors.length)]);
        }
        
        const targetIndex = Math.floor(Math.random() * length);
        const wrongColors = colors.filter(c => c !== sequence[targetIndex]);
        const wrongAnswers = wrongColors.slice(0, 3);
        
        const options = [sequence[targetIndex], ...wrongAnswers].sort(() => Math.random() - 0.5);
        
        return {
          question: `What was the ${targetIndex + 1}${getOrdinalSuffix(targetIndex + 1)} color?\nSequence: ${sequence.join(' → ')}`,
          options,
          correct: options.indexOf(sequence[targetIndex]),
        };
      },
    },
    {
      name: 'Word Recognition',
      icon: 'text-box',
      type: 'words',
      generateQuestion: () => {
        const wordPairs = [
          ['Cat', 'Dog'], ['Sun', 'Moon'], ['Hot', 'Cold'], ['Big', 'Small'],
          ['Happy', 'Sad'], ['Fast', 'Slow'], ['Light', 'Dark'], ['Up', 'Down'],
        ];
        
        const pair = wordPairs[Math.floor(Math.random() * wordPairs.length)];
        const isFirst = Math.random() > 0.5;
        const word = isFirst ? pair[0] : pair[1];
        const answer = isFirst ? pair[1] : pair[0];
        
        const allWords = wordPairs.flat();
        const wrongAnswers = allWords.filter(w => w !== answer).slice(0, 3);
        
        const options = [answer, ...wrongAnswers].sort(() => Math.random() - 0.5);
        
        return {
          question: `What's the opposite of "${word}"?`,
          options,
          correct: options.indexOf(answer),
        };
      },
    },
    {
      name: 'Pattern Logic',
      icon: 'puzzle',
      type: 'pattern',
      generateQuestion: () => {
        const patterns = [
          { sequence: [2, 4, 6, 8], next: 10, rule: '+2' },
          { sequence: [1, 3, 5, 7], next: 9, rule: '+2' },
          { sequence: [5, 10, 15, 20], next: 25, rule: '+5' },
          { sequence: [1, 4, 7, 10], next: 13, rule: '+3' },
          { sequence: [2, 6, 18, 54], next: 162, rule: '×3' },
        ];
        
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        const wrongAnswers = [
          pattern.next + 1,
          pattern.next - 1,
          pattern.next + Math.floor(Math.random() * 10) + 2,
        ];
        
        const options = [pattern.next, ...wrongAnswers].sort(() => Math.random() - 0.5);
        
        return {
          question: `What comes next?\n${pattern.sequence.join(', ')}, ?`,
          options: options.map(String),
          correct: options.indexOf(pattern.next),
        };
      },
    },
  ];

  const getOrdinalSuffix = (num) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const mod = num % 100;
    return suffixes[(mod - 20) % 10] || suffixes[mod] || suffixes[0];
  };

  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0) {
      completeGame();
    }
    return () => clearTimeout(timer);
  }, [gameState, timeLeft]);

  const startGame = () => {
    const randomGame = quickGames[Math.floor(Math.random() * quickGames.length)];
    setCurrentGame(randomGame);
    setGameState('playing');
    setScore(0);
    setQuestionsAnswered(0);
    setTimeLeft(30);
    setSelectedAnswer(null);
    generateNewQuestion(randomGame);
  };

  const generateNewQuestion = (game) => {
    const newQuestion = game.generateQuestion();
    setQuestion(newQuestion);
    fadeAnim.setValue(1);
  };

  const selectAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    
    setTimeout(() => {
      const isCorrect = answerIndex === question.correct;
      if (isCorrect) {
        setScore(score + 10);
      }

      setQuestionsAnswered(prev => prev + 1);

      // Animate transition
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        if (timeLeft > 0) {
          generateNewQuestion(currentGame);
          setSelectedAnswer(null);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }).start();
        } else {
          completeGame();
        }
      });
    }, 1000);
  };

  const completeGame = () => {
    setGameState('completed');
  };

  const restartGame = () => {
    setGameState('ready');
    setCurrentGame(null);
    setScore(0);
    setQuestionsAnswered(0);
    setTimeLeft(30);
    setSelectedAnswer(null);
    setQuestion(null);
    fadeAnim.setValue(1);
  };

  const getScoreMessage = () => {
    if (score >= 100) return 'Amazing! 🌟';
    if (score >= 70) return 'Great job! 👍';
    if (score >= 40) return 'Good work! 👌';
    return 'Keep practicing! 💪';
  };

  const renderReadyState = () => (
    <View style={styles.centeredContent}>
      <View style={styles.quickGameIcon}>
        <MaterialCommunityIcons 
          name="flash" 
          size={80} 
          color={theme.colors.secondary} 
        />
      </View>
      <Text style={styles.quickGameTitle}>Quick Brain Boost</Text>
      <Text style={styles.quickGameDescription}>
        A fast-paced mix of different brain exercises to give you a quick mental workout!
      </Text>

      <View style={styles.quickGameFeatures}>
        <View style={styles.feature}>
          <MaterialCommunityIcons 
            name="clock-fast" 
            size={24} 
            color={theme.colors.secondary} 
          />
          <Text style={styles.featureText}>30 seconds</Text>
        </View>
        <View style={styles.feature}>
          <MaterialCommunityIcons 
            name="shuffle" 
            size={24} 
            color={theme.colors.secondary} 
          />
          <Text style={styles.featureText}>Mixed exercises</Text>
        </View>
        <View style={styles.feature}>
          <MaterialCommunityIcons 
            name="speedometer" 
            size={24} 
            color={theme.colors.secondary} 
          />
          <Text style={styles.featureText}>Quick & fun</Text>
        </View>
      </View>
    </View>
  );

  const renderPlayingState = () => (
    <View style={styles.gameArea}>
      <View style={styles.gameHeader}>
        <View style={styles.gameInfo}>
          <Text style={styles.gameType}>{currentGame?.name}</Text>
          <Text style={styles.questionsCount}>
            Questions: {questionsAnswered}
          </Text>
        </View>
        <View style={styles.gameTimer}>
          <MaterialCommunityIcons 
            name="timer" 
            size={20} 
            color={timeLeft <= 10 ? theme.colors.error : theme.colors.secondary} 
          />
          <Text style={[
            styles.timerText,
            { color: timeLeft <= 10 ? theme.colors.error : theme.colors.secondary }
          ]}>
            {timeLeft}s
          </Text>
        </View>
      </View>

      {question && (
        <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
          <View style={styles.questionHeader}>
            <MaterialCommunityIcons 
              name={currentGame.icon} 
              size={32} 
              color={theme.colors.secondary} 
            />
          </View>
          
          <Text style={styles.questionText}>{question.question}</Text>

          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedAnswer === index && styles.optionSelected,
                  selectedAnswer !== null && index === question.correct && styles.optionCorrect,
                  selectedAnswer !== null && selectedAnswer === index && index !== question.correct && styles.optionIncorrect,
                ]}
                onPress={() => selectAnswer(index)}
                disabled={selectedAnswer !== null}
              >
                <Text style={[
                  styles.optionText,
                  selectedAnswer === index && styles.optionTextSelected,
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}

      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Score: {score}</Text>
      </View>
    </View>
  );

  const renderCompletedState = () => (
    <View style={styles.centeredContent}>
      <View style={styles.resultsIcon}>
        <MaterialCommunityIcons 
          name="trophy" 
          size={80} 
          color={theme.colors.warning} 
        />
      </View>
      <Text style={styles.resultsTitle}>Time's Up!</Text>
      <Text style={styles.resultsMessage}>{getScoreMessage()}</Text>
      
      <View style={styles.finalStats}>
        <View style={styles.finalStat}>
          <Text style={styles.finalStatValue}>{score}</Text>
          <Text style={styles.finalStatLabel}>Points</Text>
        </View>
        <View style={styles.finalStat}>
          <Text style={styles.finalStatValue}>{questionsAnswered}</Text>
          <Text style={styles.finalStatLabel}>Questions</Text>
        </View>
        <View style={styles.finalStat}>
          <Text style={styles.finalStatValue}>
            {questionsAnswered > 0 ? Math.round((score / (questionsAnswered * 10)) * 100) : 0}%
          </Text>
          <Text style={styles.finalStatLabel}>Accuracy</Text>
        </View>
      </View>

      <View style={styles.resultsActions}>
        <TouchableOpacity 
          style={styles.playAgainButton} 
          onPress={restartGame}
        >
          <MaterialCommunityIcons 
            name="refresh" 
            size={20} 
            color={theme.colors.textOnPrimary} 
          />
          <Text style={styles.playAgainText}>Play Again</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Training</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.secondary} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color={theme.colors.textOnPrimary} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quick Brain Game</Text>
      </View>

      {gameState === 'ready' && renderReadyState()}
      {gameState === 'playing' && renderPlayingState()}
      {gameState === 'completed' && renderCompletedState()}

      {/* Start Game Button */}
      {gameState === 'ready' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.startButton} 
            onPress={startGame}
          >
            <MaterialCommunityIcons 
              name="flash" 
              size={20} 
              color={theme.colors.textOnPrimary} 
            />
            <Text style={styles.startButtonText}>Start Quick Game</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.secondary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    fontWeight: 'bold',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  quickGameIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  quickGameTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontFamily: theme.typography.h4.fontFamily,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  quickGameDescription: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  quickGameFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  startButton: {
    backgroundColor: theme.colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.roundness,
  },
  startButtonText: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.typography.button.fontSize,
    fontFamily: theme.typography.button.fontFamily,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
  gameArea: {
    flex: 1,
    padding: 20,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  gameInfo: {
    flex: 1,
  },
  gameType: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  questionsCount: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.text.secondary,
  },
  gameTimer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  questionHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  questionText: {
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  optionButton: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: theme.colors.secondary,
  },
  optionCorrect: {
    backgroundColor: theme.colors.success + '20',
    borderColor: theme.colors.success,
  },
  optionIncorrect: {
    backgroundColor: theme.colors.error + '20',
    borderColor: theme.colors.error,
  },
  optionText: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  optionTextSelected: {
    fontWeight: 'bold',
  },
  scoreContainer: {
    alignItems: 'center',
    padding: 20,
  },
  scoreText: {
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    color: theme.colors.secondary,
    fontWeight: 'bold',
  },
  resultsIcon: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontFamily: theme.typography.h4.fontFamily,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultsMessage: {
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    color: theme.colors.secondary,
    marginBottom: 30,
  },
  finalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
  },
  finalStat: {
    alignItems: 'center',
    flex: 1,
  },
  finalStatValue: {
    fontSize: theme.typography.h5.fontSize,
    fontFamily: theme.typography.h5.fontFamily,
    color: theme.colors.secondary,
    fontWeight: 'bold',
  },
  finalStatLabel: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  resultsActions: {
    width: '100%',
  },
  playAgainButton: {
    backgroundColor: theme.colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.md,
  },
  playAgainText: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.typography.button.fontSize,
    fontFamily: theme.typography.button.fontFamily,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
  backButton: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
  },
  backButtonText: {
    color: theme.colors.secondary,
    fontSize: theme.typography.button.fontSize,
    fontFamily: theme.typography.button.fontFamily,
    fontWeight: 'bold',
  },
});

export default QuickBrainGameScreen;
