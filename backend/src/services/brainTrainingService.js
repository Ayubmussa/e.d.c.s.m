const { supabaseAdmin } = require('../config/database');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

class BrainTrainingService {
  async createSession(userId, sessionData) {
    try {
      const sessionId = uuidv4();
      const { data: session, error } = await supabaseAdmin
        .from('brain_training_sessions')
        .insert([{
          id: sessionId,
          user_id: userId,
          ...sessionData
        }])
        .select('*')
        .single();

      if (error) {
        logger.error('Create brain training session error:', error);
        throw new Error('Failed to create brain training session');
      }

      return session;
    } catch (error) {
      logger.error('Brain training session service error:', error);
      throw error;
    }
  }

  async completeSession(userId, sessionId, completionData) {
    try {
      const { data: session, error } = await supabaseAdmin
        .from('brain_training_sessions')
        .update({
          ...completionData,
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) {
        logger.error('Complete brain training session error:', error);
        throw new Error('Failed to complete brain training session');
      }

      return session;
    } catch (error) {
      logger.error('Complete brain training session service error:', error);
      throw error;
    }
  }

  async getUserSessions(userId, limit = 20) {
    try {
      const { data: sessions, error } = await supabaseAdmin
        .from('brain_training_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Get brain training sessions error:', error);
        throw new Error('Failed to retrieve brain training sessions');
      }

      return sessions;
    } catch (error) {
      logger.error('Get brain training sessions service error:', error);
      throw error;
    }
  }

  async getSessionsByType(userId, exerciseType, limit = 10) {
    try {
      const { data: sessions, error } = await supabaseAdmin
        .from('brain_training_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_type', exerciseType)
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Get brain training sessions by type error:', error);
        throw new Error('Failed to retrieve brain training sessions');
      }

      return sessions;
    } catch (error) {
      logger.error('Get brain training sessions by type service error:', error);
      throw error;
    }
  }

  async getProgressStats(userId) {
    try {
      // Get all completed sessions
      const { data: sessions, error } = await supabaseAdmin
        .from('brain_training_sessions')
        .select('exercise_type, score, max_score, duration_seconds, completed_at')
        .eq('user_id', userId)
        .eq('completed', true)
        .order('completed_at', { ascending: false });

      if (error) {
        logger.error('Get progress stats error:', error);
        throw new Error('Failed to retrieve progress stats');
      }

      // Group by exercise type
      const statsByType = {};
      let totalSessions = 0;
      let totalScore = 0;
      let totalMaxScore = 0;

      sessions.forEach(session => {
        const type = session.exercise_type;
        
        if (!statsByType[type]) {
          statsByType[type] = {
            sessions_count: 0,
            total_score: 0,
            total_max_score: 0,
            best_score: 0,
            average_score: 0,
            latest_session: null
          };
        }

        statsByType[type].sessions_count++;
        statsByType[type].total_score += session.score || 0;
        statsByType[type].total_max_score += session.max_score || 0;
        statsByType[type].best_score = Math.max(statsByType[type].best_score, session.score || 0);
        
        if (!statsByType[type].latest_session || 
            new Date(session.completed_at) > new Date(statsByType[type].latest_session)) {
          statsByType[type].latest_session = session.completed_at;
        }

        totalSessions++;
        totalScore += session.score || 0;
        totalMaxScore += session.max_score || 0;
      });

      // Calculate averages
      Object.keys(statsByType).forEach(type => {
        const stats = statsByType[type];
        stats.average_score = stats.sessions_count > 0 ? 
          (stats.total_score / stats.sessions_count).toFixed(1) : 0;
      });

      return {
        overall: {
          total_sessions: totalSessions,
          average_score: totalSessions > 0 ? (totalScore / totalSessions).toFixed(1) : 0,
          overall_percentage: totalMaxScore > 0 ? ((totalScore / totalMaxScore) * 100).toFixed(1) : 0
        },
        by_type: statsByType,
        recent_sessions: sessions.slice(0, 5)
      };
    } catch (error) {
      logger.error('Get progress stats service error:', error);
      throw error;
    }
  }

  async getAvailableExercises() {
    return [
      {
        type: 'memory_cards',
        name: 'Memory Cards',
        description: 'Match pairs of cards to improve memory',
        difficulty_levels: ['easy', 'medium', 'hard'],
        estimated_duration: 300 // 5 minutes
      },
      {
        type: 'word_recall',
        name: 'Word Recall',
        description: 'Remember and recall lists of words',
        difficulty_levels: ['easy', 'medium', 'hard'],
        estimated_duration: 240
      },
      {
        type: 'pattern_recognition',
        name: 'Pattern Recognition',
        description: 'Identify and complete visual patterns',
        difficulty_levels: ['easy', 'medium', 'hard'],
        estimated_duration: 180
      },
      {
        type: 'number_sequence',
        name: 'Number Sequence',
        description: 'Complete numerical sequences and patterns',
        difficulty_levels: ['easy', 'medium', 'hard'],
        estimated_duration: 200
      },
      {
        type: 'attention_focus',
        name: 'Attention Focus',
        description: 'Focus on specific targets while ignoring distractions',
        difficulty_levels: ['easy', 'medium', 'hard'],
        estimated_duration: 300
      }
    ];
  }

  async generateExerciseData(exerciseType, difficulty = 'medium') {
    try {
      switch (exerciseType) {
        case 'memory_cards':
          return this.generateMemoryCardsData(difficulty);
        case 'word_recall':
          return this.generateWordRecallData(difficulty);
        case 'pattern_recognition':
          return this.generatePatternRecognitionData(difficulty);
        case 'number_sequence':
          return this.generateNumberSequenceData(difficulty);
        case 'attention_focus':
          return this.generateAttentionFocusData(difficulty);
        default:
          throw new Error('Unknown exercise type');
      }
    } catch (error) {
      logger.error('Generate exercise data error:', error);
      throw error;
    }
  }

  generateMemoryCardsData(difficulty) {
    const cardCounts = { easy: 8, medium: 12, hard: 16 };
    const cardCount = cardCounts[difficulty];
    
    const symbols = ['🍎', '🍌', '🍊', '🍇', '🥕', '🌸', '🌺', '🌻', '⭐', '🌙', '☀️', '🌈', '🎈', '🎁', '🎵', '🎨'];
    const selectedSymbols = symbols.slice(0, cardCount / 2);
    const cards = [...selectedSymbols, ...selectedSymbols].sort(() => Math.random() - 0.5);
    
    return {
      cards,
      target_pairs: cardCount / 2,
      max_score: cardCount / 2 * 10,
      time_limit: difficulty === 'easy' ? 180 : difficulty === 'medium' ? 120 : 90
    };
  }

  generateWordRecallData(difficulty) {
    const wordCounts = { easy: 5, medium: 8, hard: 12 };
    const wordCount = wordCounts[difficulty];
    
    const words = [
      'apple', 'house', 'car', 'tree', 'book', 'phone', 'chair', 'water',
      'flower', 'music', 'friend', 'family', 'garden', 'kitchen', 'window', 'door'
    ];
    
    const selectedWords = words.sort(() => Math.random() - 0.5).slice(0, wordCount);
    
    return {
      words: selectedWords,
      display_time: difficulty === 'easy' ? 3000 : difficulty === 'medium' ? 2000 : 1500,
      max_score: wordCount * 10,
      recall_time_limit: 60
    };
  }

  generatePatternRecognitionData(difficulty) {
    const sizes = { easy: 3, medium: 4, hard: 5 };
    const size = sizes[difficulty];
    
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    const pattern = Array(size).fill().map(() => colors[Math.floor(Math.random() * colors.length)]);
    
    return {
      pattern,
      grid_size: size,
      max_score: size * 5,
      time_limit: difficulty === 'easy' ? 120 : difficulty === 'medium' ? 90 : 60
    };
  }

  generateNumberSequenceData(difficulty) {
    const lengths = { easy: 5, medium: 7, hard: 10 };
    const length = lengths[difficulty];
    
    const start = Math.floor(Math.random() * 10) + 1;
    const step = Math.floor(Math.random() * 3) + 1;
    const sequence = Array(length - 1).fill().map((_, i) => start + i * step);
    
    return {
      sequence,
      missing_positions: [length - 1], // Last number is missing
      correct_answer: start + (length - 1) * step,
      max_score: 20,
      time_limit: 60
    };
  }

  generateAttentionFocusData(difficulty) {
    const targetCounts = { easy: 5, medium: 8, hard: 12 };
    const distractorCounts = { easy: 10, medium: 20, hard: 30 };
    
    const targetCount = targetCounts[difficulty];
    const distractorCount = distractorCounts[difficulty];
    
    return {
      target_symbol: '⭐',
      distractor_symbols: ['🔴', '🔵', '🟢', '🟡'],
      target_count: targetCount,
      total_items: targetCount + distractorCount,
      max_score: targetCount * 5,
      time_limit: difficulty === 'easy' ? 90 : difficulty === 'medium' ? 60 : 45
    };
  }
}

module.exports = new BrainTrainingService();
