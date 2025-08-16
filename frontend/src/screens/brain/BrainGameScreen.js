import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const BrainGameScreen = ({ navigation, route }) => {
  const { game } = route.params || {};
  const [gameState, setGameState] = useState('ready'); // ready, playing, completed
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(1));

  // Defensive: If game or game.type is missing, show error UI
  if (!game || !game.type) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <Text style={{ color: theme.colors.error, fontSize: 18, marginBottom: 12 }}>Game data is missing or invalid.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 12, backgroundColor: theme.colors.primary, borderRadius: 8 }}>
          <Text style={{ color: theme.colors.white, fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // List of supported games (by name)
  // Expanded: All games implemented below
  const supportedGames = [
    'Number Sequence',
    'Number Sequence Memory',
    'Color Patterns',
    'Word Pairs',
    'Spatial Memory',
    'Face Recall',
    'Sound Sequence',
    'Focus Finder',
    'Dual Task',
    'Visual Tracking',
    'Selective Attention',
    'Odd One Out',
    'Reaction Tap',
    'Quick Math',
    'Pattern Recognition',
    'Word Processing',
    'Decision Speed',
    'Shape Sorter',
    'Symbol Match',
    'Sudoku',
    'Tower of Hanoi',
    'Logic Grid',
    'Sequence Builder',
    'Word Search',
    'Anagram Solver',
    'Synonym Match',
    'Rhyme Time',
    'Mental Rotation',
  ];

  if (!supportedGames.includes(game.name)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <Text style={{ color: theme.colors.primary, fontSize: 22, marginBottom: 16, textAlign: 'center' }}>{game.name}</Text>
        <Text style={{ color: theme.colors.text.secondary, fontSize: 18, marginBottom: 12, textAlign: 'center' }}>This game is coming soon!</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 12, backgroundColor: theme.colors.primary, borderRadius: 8 }}>
          <Text style={{ color: theme.colors.text.primary, fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Sample questions for each game name
  const getQuestions = () => {
    switch (game.name) {
      case 'Mental Rotation':
        // Each question: show a rotated shape, ask which option matches the rotation
        return [
          {
            question: 'Which image matches the rotated shape?',
            // We'll use emoji for simplicity, but you can replace with images/icons
            shape: '🔺', // triangle
            rotation: 90, // degrees
            options: [
              { shape: '🔺', rotation: 0 },
              { shape: '🔺', rotation: 90 },
              { shape: '🔺', rotation: 180 },
              { shape: '🔺', rotation: 270 },
            ],
            correct: 1,
          },
          {
            question: 'Which image matches the rotated square?',
            shape: '⬆️',
            rotation: 180,
            options: [
              { shape: '⬆️', rotation: 0 },
              { shape: '⬆️', rotation: 90 },
              { shape: '⬆️', rotation: 180 },
              { shape: '⬆️', rotation: 270 },
            ],
            correct: 2,
          },
        ];
      case 'Number Sequence':
        return [
          { question: 'What comes next in the sequence: 2, 4, 6, ?', options: ['7', '8', '9', '10'], correct: 1 },
          { question: 'What is the 4th number in: 3, 6, 9, 12, 15?', options: ['9', '12', '15', '6'], correct: 1 },
        ];
      case 'Number Sequence Memory': {
        // Generate 3 random sequences of 4-7 digits
        const generateSequence = (length) => Array.from({length}, () => Math.floor(Math.random()*9)+1).join(' ');
        return [
          { sequence: generateSequence(4) },
          { sequence: generateSequence(5) },
          { sequence: generateSequence(6) },
        ];
      }
      case 'Color Patterns':
        return [
          { question: 'Which color comes next: Red, Blue, Red, Blue, ?', options: ['Red', 'Blue', 'Green', 'Yellow'], correct: 0 },
          { question: 'Which color is missing: Green, Yellow, __, Green, Yellow?', options: ['Red', 'Blue', 'Green', 'Yellow'], correct: 1 },
        ];
      case 'Word Pairs':
        return [
          { question: 'Which word pairs with "Salt"?', options: ['Pepper', 'Sugar', 'Vinegar', 'Oil'], correct: 0 },
          { question: 'Which word pairs with "Bread"?', options: ['Butter', 'Jam', 'Cheese', 'Egg'], correct: 0 },
        ];
      case 'Spatial Memory':
        // Special handling: show object, then show question
        return [
          {
            object: '[ 1  2  3 ]\n[ 4  *  6 ]\n[ 7  8  9 ]',
            question: 'Where was the * located?',
            options: ['Top Left', 'Center', 'Bottom Right', 'Top Right'],
            correct: 1
          },
          {
            object: 'Apple, Banana, Cherry, Date',
            question: 'Which fruit was third?',
            options: ['Apple', 'Banana', 'Cherry', 'Date'],
            correct: 2
          }
        ];
      case 'Face Recall':
        return [
          { question: 'Who is John?', options: ['Face 1', 'Face 2', 'Face 3', 'Face 4'], correct: 0 },
          { question: 'Who is Mary?', options: ['Face 1', 'Face 2', 'Face 3', 'Face 4'], correct: 1 },
        ];
      case 'Sound Sequence':
        return [
          { question: 'Which sound came second?', options: ['Beep', 'Boop', 'Bop', 'Buzz'], correct: 1 },
          { question: 'Which sound was last?', options: ['Beep', 'Boop', 'Bop', 'Buzz'], correct: 3 },
        ];
      case 'Focus Finder':
        return [
          { question: 'Find the red circle among blue squares.', options: ['1', '2', '3', '4'], correct: 3 },
          { question: 'Which object is different?', options: ['Square', 'Star', 'Circle', 'Triangle'], correct: 2 },
        ];
      case 'Dual Task':
        return [
          { question: 'Tap the number 3 and say "red".', options: ['3/red', '2/blue', '1/green', '4/yellow'], correct: 0 },
          { question: 'Tap the letter A and say "blue".', options: ['A/blue', 'B/red', 'C/green', 'D/yellow'], correct: 0 },
        ];
      case 'Visual Tracking':
        return [
          { question: 'Follow the moving dot. Where did it stop?', options: ['Top', 'Bottom', 'Left', 'Right'], correct: 1 },
          { question: 'Which object moved?', options: ['Circle', 'Square', 'Triangle', 'Star'], correct: 0 },
        ];
      case 'Selective Attention':
        return [
          { question: 'Tap only the green shapes.', options: ['Green', 'Red', 'Blue', 'Yellow'], correct: 0 },
          { question: 'Ignore the odd color.', options: ['Red', 'Red', 'Blue', 'Red'], correct: 2 },
        ];
      case 'Odd One Out':
        return [
          { question: 'Which does not belong: Apple, Banana, Car, Orange?', options: ['Apple', 'Banana', 'Car', 'Orange'], correct: 2 },
          { question: 'Which is different: Cat, Dog, Bird, Table?', options: ['Cat', 'Dog', 'Bird', 'Table'], correct: 3 },
        ];
      case 'Reaction Tap':
        return [
          { question: 'Tap as soon as you see GO!', options: ['GO!', 'WAIT', 'STOP', 'READY'], correct: 0 },
          { question: 'Tap the target quickly.', options: ['Target', 'Circle', 'Square', 'Triangle'], correct: 0 },
        ];
      case 'Quick Math':
        return [
          { question: '15 + 23 - 8 = ?', options: ['28', '30', '32', '35'], correct: 1 },
          { question: '7 x 6 = ?', options: ['36', '42', '48', '56'], correct: 1 },
        ];
      case 'Pattern Recognition':
        return [
          { question: 'What comes next: ▲, ●, ▲, ●, ?', options: ['▲', '●', '■', '◆'], correct: 0 },
          { question: 'Which shape completes the pattern: ■, ■, ▲, ■, ■, ?', options: ['▲', '■', '●', '◆'], correct: 0 },
        ];
      case 'Word Processing':
        return [
          { question: 'Which word is a noun?', options: ['Run', 'Apple', 'Quickly', 'Blue'], correct: 1 },
          { question: 'Which is a verb?', options: ['Eat', 'Table', 'Red', 'Chair'], correct: 0 },
        ];
      case 'Decision Speed':
        return [
          { question: 'If 5 > 3, tap YES.', options: ['YES', 'NO', 'MAYBE', 'SKIP'], correct: 0 },
          { question: 'If 2 + 2 = 5, tap NO.', options: ['YES', 'NO', 'MAYBE', 'SKIP'], correct: 1 },
        ];
      case 'Shape Sorter':
        return [
          { question: 'Sort the shapes: Circle, Square, Triangle. Which is first alphabetically?', options: ['Circle', 'Square', 'Triangle', 'Rectangle'], correct: 0 },
          { question: 'Which shape has 4 sides?', options: ['Circle', 'Triangle', 'Square', 'Oval'], correct: 2 },
        ];
      case 'Symbol Match':
        return [
          { question: 'Which symbol matches: @ ?', options: ['@', '#', '$', '%'], correct: 0 },
          { question: 'Which is a letter: A, 1, #, $ ?', options: ['A', '1', '#', '$'], correct: 0 },
        ];
      case 'Sudoku':
        return [
          { question: 'What number is missing: 1, 2, __, 4, 5?', options: ['2', '3', '4', '5'], correct: 1 },
          { question: 'Which row is correct: [1,2,3,4,5], [1,2,2,4,5], [1,3,4,5,6], [1,2,3,5,6]?', options: ['[1,2,3,4,5]', '[1,2,2,4,5]', '[1,3,4,5,6]', '[1,2,3,5,6]'], correct: 0 },
        ];
      case 'Tower of Hanoi':
        return [
          { question: 'How many moves to solve 3 disks?', options: ['5', '6', '7', '8'], correct: 2 },
          { question: 'What is the goal of Tower of Hanoi?', options: ['Sort disks', 'Move all disks to another peg', 'Stack blocks', 'Remove disks'], correct: 1 },
        ];
      case 'Logic Grid':
        return [
          { question: 'If A is taller than B, and B is taller than C, who is tallest?', options: ['A', 'B', 'C', 'Cannot tell'], correct: 0 },
          { question: 'If only one statement is true, which is it?', options: ['A', 'B', 'C', 'D'], correct: 0 },
        ];
      case 'Sequence Builder':
        return [
          { question: 'What comes next: 2, 4, 8, 16, ?', options: ['18', '20', '24', '32'], correct: 3 },
          { question: 'Build the sequence: 1, 3, 6, 10, ?', options: ['12', '14', '15', '16'], correct: 2 },
        ];
      case 'Word Search':
        return [
          { question: 'Which word is hidden: _AT?', options: ['CAT', 'BAT', 'RAT', 'SAT'], correct: 0 },
          { question: 'Find the word: TREE, DOG, BIRD, FISH. Which is not an animal?', options: ['TREE', 'DOG', 'BIRD', 'FISH'], correct: 0 },
        ];
      case 'Anagram Solver':
        return [
          { question: 'Unscramble: "TCA"', options: ['ACT', 'CAT', 'TAC', 'ATC'], correct: 1 },
          { question: 'Unscramble: "GOD"', options: ['DOG', 'GOD', 'ODG', 'DGO'], correct: 0 },
        ];
      case 'Synonym Match':
        return [
          { question: 'Which is a synonym for "Happy"?', options: ['Sad', 'Joyful', 'Angry', 'Tired'], correct: 1 },
          { question: 'Which is a synonym for "Fast"?', options: ['Quick', 'Slow', 'Late', 'Early'], correct: 0 },
        ];
      case 'Rhyme Time':
        return [
          { question: 'Which word rhymes with "Cat"?', options: ['Dog', 'Hat', 'Bird', 'Fish'], correct: 1 },
          { question: 'Which word rhymes with "Blue"?', options: ['Clue', 'Red', 'Green', 'Yellow'], correct: 0 },
        ];
      default:
        return [
          { question: 'What comes next in the sequence: 2, 4, 6, ?', options: ['7', '8', '9', '10'], correct: 1 },
        ];
    }
  };

  const [questions] = useState(getQuestions());
  // For Number Sequence Memory: track if sequence has been shown and user input
  const [showSequence, setShowSequence] = useState(game.name === 'Number Sequence Memory');
  const [userInput, setUserInput] = useState('');
  // For spatial memory: track if object has been shown
  const [showObject, setShowObject] = useState(
    game.name === 'Spatial Memory' && getQuestions()[0] && getQuestions()[0].object ? true : false
  );

  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0) {
      completeGame();
    }
    return () => clearTimeout(timer);
  }, [gameState, timeLeft]);

  // Handle showing/hiding the memory object for Spatial Memory and Number Sequence Memory
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (game.name === 'Spatial Memory') {
      const q = questions[currentQuestion];
      if (q && q.object) {
        setShowObject(true);
        const hideTimer = setTimeout(() => {
          setShowObject(false);
          if (fadeAnim && typeof fadeAnim.setValue === 'function') fadeAnim.setValue(1);
        }, 3000);
        return () => clearTimeout(hideTimer);
      } else {
        setShowObject(false);
        if (fadeAnim && typeof fadeAnim.setValue === 'function') fadeAnim.setValue(1);
      }
    }
    if (game.name === 'Number Sequence Memory') {
      // Show sequence for 3 seconds only when a new question starts
      if (gameState === 'playing' && showSequence) {
        const hideTimer = setTimeout(() => {
          setShowSequence(false);
          if (fadeAnim && typeof fadeAnim.setValue === 'function') fadeAnim.setValue(1);
        }, 3000);
        return () => clearTimeout(hideTimer);
      }
    }
  }, [gameState, currentQuestion, questions, showSequence]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setCurrentQuestion(0);
    setTimeLeft(60);
    setSelectedAnswer(null);
    setUserInput('');
    setShowSequence(game.name === 'Number Sequence Memory');
  };

  const selectAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    setTimeout(() => {
      const isCorrect = answerIndex === questions[currentQuestion].correct;
      if (isCorrect) {
        setScore(score + 10);
      }

      // Animate transition
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
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

  // For Number Sequence Memory: handle user input and check answer
  const submitSequenceAnswer = () => {
    const correctSequence = questions[currentQuestion].sequence.replace(/\s+/g, '');
    const userSequence = userInput.replace(/\s+/g, '');
    if (userSequence === correctSequence) {
      setScore(score + 10);
    }
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setUserInput('');
        setTimeout(() => setShowSequence(true), 100); // triggers useEffect to show sequence for next question
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();
      } else {
        completeGame();
      }
    });
  };

  const completeGame = () => {
    setGameState('completed');
    // Here you would typically save the score to backend
  };

  const restartGame = () => {
    setGameState('ready');
    setScore(0);
    setCurrentQuestion(0);
    setTimeLeft(60);
    setSelectedAnswer(null);
    fadeAnim.setValue(1);
    setShowObject(game.name === 'Spatial Memory');
    setUserInput('');
    setShowSequence(game.name === 'Number Sequence Memory');
  };

  const getScoreMessage = () => {
    const percentage = (score / (questions.length * 10)) * 100;
    if (percentage >= 80) return 'Excellent! 🌟';
    if (percentage >= 60) return 'Good job! 👍';
    if (percentage >= 40) return 'Nice try! 👌';
    return 'Keep practicing! 💪';
  };

  const renderReadyState = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.gameInfo}>
        <View style={styles.gameIcon}>
          <MaterialCommunityIcons 
            name={game.icon} 
            size={60} 
            color={theme.colors.primary} 
          />
        </View>
        <Text style={styles.gameTitle}>{game.name}</Text>
        <Text style={styles.gameDescription}>{game.description}</Text>
      </View>

      <View style={styles.gameStats}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons 
            name="clock-outline" 
            size={24} 
            color={theme.colors.primary} 
          />
          <Text style={styles.statLabel}>Duration</Text>
          <Text style={styles.statValue}>60 seconds</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons 
            name="help-circle-outline" 
            size={24} 
            color={theme.colors.primary} 
          />
          <Text style={styles.statLabel}>Questions</Text>
          <Text style={styles.statValue}>{questions.length}</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons 
            name="star-outline" 
            size={24} 
            color={theme.colors.primary} 
          />
          <Text style={styles.statLabel}>Best Score</Text>
          <Text style={styles.statValue}>--</Text>
        </View>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>How to Play:</Text>
        <Text style={styles.instructionsText}>
          • Answer questions as quickly and accurately as possible{'\n'}
          • Each correct answer gives you 10 points{'\n'}
          • Complete all questions before time runs out{'\n'}
          • Focus and have fun!
        </Text>
      </View>
    </ScrollView>
  );

  const renderPlayingState = () => {
    // Special handling for Number Sequence Memory
    if (game.name === 'Number Sequence Memory') {
      const q = questions[currentQuestion];
      return (
        <View style={styles.gameArea}>
          <View style={styles.gameHeader}>
            <View style={styles.gameProgress}>
              <Text style={styles.progressText}>
                Sequence {currentQuestion + 1} of {questions.length}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${((currentQuestion + 1) / questions.length) * 100}%` }]} 
                />
              </View>
            </View>
            <View style={styles.gameTimer}>
              <MaterialCommunityIcons 
                name="timer" 
                size={20} 
                color={timeLeft <= 10 ? theme.colors.error : theme.colors.primary} 
              />
              <Text style={[styles.timerText, { color: timeLeft <= 10 ? theme.colors.error : theme.colors.primary }]}> {timeLeft}s </Text>
            </View>
          </View>
          {showSequence ? (
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>{q.sequence}</Text>
              <Text style={{ textAlign: 'center', color: theme.colors.text.secondary, marginTop: 16 }}>
                Memorize the sequence above!
              </Text>
            </View>
          ) : (
            <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}> 
              <Text style={styles.questionText}>Enter the sequence you just saw:</Text>
              <View style={{ alignItems: 'center', marginTop: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 18, color: theme.colors.text.secondary, marginRight: 8 }}>Your Answer:</Text>
                  <View style={{ borderBottomWidth: 2, borderColor: theme.colors.primary, minWidth: 120 }}>
                    <Animated.Text
                      style={{ fontSize: 22, color: theme.colors.text.primary }}
                    >{userInput}</Animated.Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {[1,2,3,4,5,6,7,8,9].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={{
                        backgroundColor: theme.colors.surface,
                        padding: 16,
                        borderRadius: 8,
                        margin: 6,
                        borderWidth: 2,
                        borderColor: 'transparent',
                      }}
                      onPress={() => setUserInput(userInput + num)}
                      disabled={userInput.length >= q.sequence.replace(/\s+/g, '').length}
                    >
                      <Text style={{ fontSize: 22, color: theme.colors.text.primary }}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={{
                      backgroundColor: theme.colors.error + '20',
                      padding: 16,
                      borderRadius: 8,
                      margin: 6,
                      borderWidth: 2,
                      borderColor: theme.colors.error,
                    }}
                    onPress={() => setUserInput(userInput.slice(0, -1))}
                    disabled={userInput.length === 0}
                  >
                    <Text style={{ fontSize: 22, color: theme.colors.error }}>⌫</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: theme.colors.primary,
                    paddingVertical: 12,
                    paddingHorizontal: 32,
                    borderRadius: 8,
                    marginTop: 24,
                    opacity: userInput.length === q.sequence.replace(/\s+/g, '').length ? 1 : 0.5,
                  }}
                  onPress={submitSequenceAnswer}
                  disabled={userInput.length !== q.sequence.replace(/\s+/g, '').length}
                >
                  <Text style={{ color: theme.colors.white, fontWeight: 'bold', fontSize: 18 }}>Submit</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>Score: {score}</Text>
          </View>
        </View>
      );
    }
    // Special handling for Spatial Memory
    if (game.name === 'Spatial Memory') {
      const q = questions[currentQuestion];
      if (q && q.object && showObject) {
        return (
          <View style={styles.gameArea}>
            <View style={styles.gameHeader}>
              <View style={styles.gameProgress}>
                <Text style={styles.progressText}>
                  Question {currentQuestion + 1} of {questions.length}
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[styles.progressFill, { width: `${((currentQuestion + 1) / questions.length) * 100}%` }]} 
                  />
                </View>
              </View>
              <View style={styles.gameTimer}>
                <MaterialCommunityIcons 
                  name="timer" 
                  size={20} 
                  color={timeLeft <= 10 ? theme.colors.error : theme.colors.primary} 
                />
                <Text style={[styles.timerText, { color: timeLeft <= 10 ? theme.colors.error : theme.colors.primary }]}> {timeLeft}s </Text>
              </View>
            </View>
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>{q.object}</Text>
              <Text style={{ textAlign: 'center', color: theme.colors.text.secondary, marginTop: 16 }}>
                Memorize the object above!
              </Text>
            </View>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>Score: {score}</Text>
            </View>
          </View>
        );
      }
      // Show the question after the object, or immediately if no object
      return (
        <View style={styles.gameArea}>
          <View style={styles.gameHeader}>
            <View style={styles.gameProgress}>
              <Text style={styles.progressText}>
                Question {currentQuestion + 1} of {questions.length}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${((currentQuestion + 1) / questions.length) * 100}%` }]} 
                />
              </View>
            </View>
            <View style={styles.gameTimer}>
              <MaterialCommunityIcons 
                name="timer" 
                size={20} 
                color={timeLeft <= 10 ? theme.colors.error : theme.colors.primary} 
              />
              <Text style={[styles.timerText, { color: timeLeft <= 10 ? theme.colors.error : theme.colors.primary }]}> {timeLeft}s </Text>
            </View>
          </View>
          <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}> 
            <Text style={styles.questionText}>{q.question}</Text>
            <View style={styles.optionsContainer}>
              {q.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    selectedAnswer === index && styles.optionSelected,
                    selectedAnswer !== null && index === q.correct && styles.optionCorrect,
                    selectedAnswer !== null && selectedAnswer === index && index !== q.correct && styles.optionIncorrect,
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
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>Score: {score}</Text>
          </View>
        </View>
      );
    }
    // Special handling for Focus Finder
    if (game.name === 'Focus Finder') {
      const q = questions[currentQuestion];
      return (
        <View style={styles.gameArea}>
          <View style={styles.gameHeader}>
            <View style={styles.gameProgress}>
              <Text style={styles.progressText}>
                Question {currentQuestion + 1} of {questions.length}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${((currentQuestion + 1) / questions.length) * 100}%` }]} 
                />
              </View>
            </View>
            <View style={styles.gameTimer}>
              <MaterialCommunityIcons 
                name="timer" 
                size={20} 
                color={timeLeft <= 10 ? theme.colors.error : theme.colors.primary} 
              />
              <Text style={[styles.timerText, { color: timeLeft <= 10 ? theme.colors.error : theme.colors.primary }]}> {timeLeft}s </Text>
            </View>
          </View>
          <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}> 
            <Text style={styles.questionText}>{q.question}</Text>
            {/* Custom visual for first question with answer selection */}
            {currentQuestion === 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 24 }}>
                {[0,1,2,3].map((i) => (
                  <TouchableOpacity
                    key={i}
                    style={{ alignItems: 'center', margin: 8 }}
                    onPress={() => selectedAnswer === null && selectAnswer(i)}
                    disabled={selectedAnswer !== null}
                  >
                    <View style={{
                      width: 40,
                      height: 40,
                      backgroundColor: i === 3 ? '#E53935' : '#2196F3',
                      borderRadius: i === 3 ? 20 : 8,
                      borderWidth: selectedAnswer === i ? 3 : 2,
                      borderColor: selectedAnswer === i ? theme.colors.primary : 'transparent',
                    }} />
                    <Text style={{ textAlign: 'center', marginTop: 4, color: theme.colors.text.primary, fontWeight: 'bold' }}>{i+1}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {/* Custom visual for second question */}
            {currentQuestion === 1 && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 24 }}>
                {["star", "star", "circle", "star"].map((shape, i) => (
                  <View key={i} style={{ alignItems: 'center', margin: 8 }}>
                    <MaterialCommunityIcons 
                      name={shape === "star" ? "star" : "circle"} 
                      size={36} 
                      color={shape === "star" ? theme.colors.warning : theme.colors.primary} 
                    />
                  </View>
                ))}
              </View>
            )}
            {/* Options for second question only */}
            {currentQuestion === 1 && (
              <View style={styles.optionsContainer}>
                {q.options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      selectedAnswer === index && styles.optionSelected,
                      selectedAnswer !== null && index === q.correct && styles.optionCorrect,
                      selectedAnswer !== null && selectedAnswer === index && index !== q.correct && styles.optionIncorrect,
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
            )}
          </Animated.View>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>Score: {score}</Text>
          </View>
        </View>
      );
    }
    // Special handling for Mental Rotation
    if (game.name === 'Mental Rotation') {
      const q = questions[currentQuestion];
      return (
        <View style={styles.gameArea}>
          <View style={styles.gameHeader}>
            <View style={styles.gameProgress}>
              <Text style={styles.progressText}>
                Question {currentQuestion + 1} of {questions.length}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${((currentQuestion + 1) / questions.length) * 100}%` }]} 
                />
              </View>
            </View>
            <View style={styles.gameTimer}>
              <MaterialCommunityIcons 
                name="timer" 
                size={20} 
                color={timeLeft <= 10 ? theme.colors.error : theme.colors.primary} 
              />
              <Text style={[styles.timerText, { color: timeLeft <= 10 ? theme.colors.error : theme.colors.primary }]}> {timeLeft}s </Text>
            </View>
          </View>
          <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}> 
            <Text style={styles.questionText}>{q.question}</Text>
            <View style={{ alignItems: 'center', marginVertical: 24 }}>
              {/* Show the rotated shape (simulate rotation with text) */}
              <Animated.View style={{
                transform: [{ rotate: `${q.rotation}deg` }],
                marginBottom: 16,
              }}>
                <Text style={{ fontSize: 48 }}>{q.shape}</Text>
              </Animated.View>
              <Text style={{ color: theme.colors.text.secondary, marginBottom: 8 }}>Select the matching rotation:</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                {q.options.map((opt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={{ alignItems: 'center', margin: 8 }}
                    onPress={() => selectedAnswer === null && selectAnswer(idx)}
                    disabled={selectedAnswer !== null}
                  >
                    <Animated.View style={{
                      transform: [{ rotate: `${opt.rotation}deg` }],
                      borderWidth: selectedAnswer === idx ? 3 : 2,
                      borderColor: selectedAnswer === idx ? theme.colors.primary : 'transparent',
                      borderRadius: 12,
                      padding: 4,
                      backgroundColor:
                        selectedAnswer !== null && idx === q.correct
                          ? theme.colors.success + '20'
                          : selectedAnswer !== null && selectedAnswer === idx && idx !== q.correct
                          ? theme.colors.error + '20'
                          : theme.colors.surface,
                    }}>
                      <Text style={{ fontSize: 36 }}>{opt.shape}</Text>
                    </Animated.View>
                    <Text style={{ textAlign: 'center', marginTop: 4, color: theme.colors.text.primary }}>{opt.rotation}&deg;</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>Score: {score}</Text>
          </View>
        </View>
      );
    }
    // ...existing code for other games...
    return (
      <View style={styles.gameArea}>
        <View style={styles.gameHeader}>
          <View style={styles.gameProgress}>
            <Text style={styles.progressText}>
              Question {currentQuestion + 1} of {questions.length}
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${((currentQuestion + 1) / questions.length) * 100}%` }
                ]} 
              />
            </View>
          </View>
          <View style={styles.gameTimer}>
            <MaterialCommunityIcons 
              name="timer" 
              size={20} 
              color={timeLeft <= 10 ? theme.colors.error : theme.colors.primary} 
            />
            <Text style={[
              styles.timerText,
              { color: timeLeft <= 10 ? theme.colors.error : theme.colors.primary }
            ]}>
              {timeLeft}s
            </Text>
          </View>
        </View>
        <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}> 
          <Text style={styles.questionText}>{questions[currentQuestion].question}</Text>
          <View style={styles.optionsContainer}>
            {questions[currentQuestion].options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedAnswer === index && styles.optionSelected,
                  selectedAnswer !== null && index === questions[currentQuestion].correct && styles.optionCorrect,
                  selectedAnswer !== null && selectedAnswer === index && index !== questions[currentQuestion].correct && styles.optionIncorrect,
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
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>
      </View>
    );
  };

  const renderCompletedState = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.resultsContainer}>
        <View style={styles.resultsIcon}>
          <MaterialCommunityIcons 
            name="trophy" 
            size={80} 
            color={theme.colors.warning} 
          />
        </View>
        <Text style={styles.resultsTitle}>Game Complete!</Text>
        <Text style={styles.resultsMessage}>{getScoreMessage()}</Text>
        
        <View style={styles.finalStats}>
          <View style={styles.finalStat}>
            <Text style={styles.finalStatValue}>{score}</Text>
            <Text style={styles.finalStatLabel}>Final Score</Text>
          </View>
          <View style={styles.finalStat}>
            <Text style={styles.finalStatValue}>
              {Math.round((score / (questions.length * 10)) * 100)}%
            </Text>
            <Text style={styles.finalStatLabel}>Accuracy</Text>
          </View>
          <View style={styles.finalStat}>
            <Text style={styles.finalStatValue}>{60 - timeLeft}s</Text>
            <Text style={styles.finalStatLabel}>Time Used</Text>
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
              color={theme.colors.white} 
            />
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back to Games</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color={theme.colors.white} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {gameState === 'ready' ? game.name : 
           gameState === 'playing' ? 'Playing...' : 'Results'}
        </Text>
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
              name="play" 
              size={20} 
              color={theme.colors.white} 
            />
            <Text style={styles.startButtonText}>Start Game</Text>
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
    backgroundColor: theme.colors.primary,
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
    color: theme.colors.white,
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  gameInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  gameIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gameTitle: {
    fontSize: theme.typography.h5.fontSize,
    fontFamily: theme.typography.h5.fontFamily,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  gameDescription: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  gameStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  statValue: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    marginTop: 2,
  },
  instructions: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.h6.fontFamily,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  startButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.button.fontSize,
    fontFamily: theme.typography.button.fontFamily,
    fontWeight: 'bold',
    marginLeft: 8,
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
  gameProgress: {
    flex: 1,
    marginRight: 20,
  },
  progressText: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.caption.fontFamily,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.divider,
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  gameTimer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.body1.fontFamily,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
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
    borderColor: theme.colors.primary,
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
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  resultsContainer: {
    alignItems: 'center',
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
    color: theme.colors.primary,
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
    color: theme.colors.primary,
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
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  playAgainText: {
    color: theme.colors.white,
    fontSize: theme.typography.button.fontSize,
    fontFamily: theme.typography.button.fontFamily,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  backButton: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  backButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.button.fontSize,
    fontFamily: theme.typography.button.fontFamily,
    fontWeight: 'bold',
  },
});

export default BrainGameScreen;
