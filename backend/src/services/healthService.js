const { supabaseAdmin } = require('../config/database');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

class HealthService {
  async createHealthCheckin(userId, checkinData) {
    try {
      // Filter out fields that don't exist in the database schema
      const { activities, ...validCheckinData } = checkinData;
      
      // Log if activities were provided but filtered out
      if (activities && activities.length > 0) {
        logger.warn(`Activities field provided but not supported in database schema: ${activities.join(', ')}`);
      }

      // First check if a checkin already exists for this date
      const { data: existingCheckin } = await supabaseAdmin
        .from('health_checkins')
        .select('*')
        .eq('user_id', userId)
        .eq('checkin_date', validCheckinData.checkin_date)
        .single();

      if (existingCheckin) {
        // Update existing checkin instead of creating new one
        const { data: updatedCheckin, error } = await supabaseAdmin
          .from('health_checkins')
          .update({
            ...validCheckinData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCheckin.id)
          .select('*')
          .single();

        if (error) {
          logger.error('Update health checkin error:', error);
          throw new Error('Failed to update health checkin');
        }

        return updatedCheckin;
      } else {
        // Create new checkin
        const checkinId = uuidv4();
        const { data: checkin, error } = await supabaseAdmin
          .from('health_checkins')
          .insert([{
            id: checkinId,
            user_id: userId,
            ...validCheckinData
          }])
          .select('*')
          .single();

        if (error) {
          logger.error('Create health checkin error:', error);
          throw new Error('Failed to create health checkin');
        }

        return checkin;
      }
    } catch (error) {
      logger.error('Health checkin service error:', error);
      throw error;
    }
  }

  async getUserHealthCheckins(userId, limit = 30) {
    try {
      const { data: checkins, error } = await supabaseAdmin
        .from('health_checkins')
        .select('*')
        .eq('user_id', userId)
        .order('checkin_date', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Get health checkins error:', error);
        throw new Error('Failed to retrieve health checkins');
      }

      return checkins;
    } catch (error) {
      logger.error('Get health checkins service error:', error);
      throw error;
    }
  }

  async getHealthCheckinByDate(userId, date) {
    try {
      const { data: checkin, error } = await supabaseAdmin
        .from('health_checkins')
        .select('*')
        .eq('user_id', userId)
        .eq('checkin_date', date)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        logger.error('Get health checkin by date error:', error);
        throw new Error('Failed to retrieve health checkin');
      }

      return checkin || null;
    } catch (error) {
      logger.error('Get health checkin by date service error:', error);
      throw error;
    }
  }

  async updateHealthCheckin(userId, checkinId, updateData) {
    try {
      // Filter out fields that don't exist in the database schema
      const { activities, ...validUpdateData } = updateData;
      
      // Log if activities were provided but filtered out
      if (activities && activities.length > 0) {
        logger.warn(`Activities field provided but not supported in database schema: ${activities.join(', ')}`);
      }

      const { data: checkin, error } = await supabaseAdmin
        .from('health_checkins')
        .update({
          ...validUpdateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', checkinId)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) {
        logger.error('Update health checkin error:', error);
        throw new Error('Failed to update health checkin');
      }

      return checkin;
    } catch (error) {
      logger.error('Update health checkin service error:', error);
      throw error;
    }
  }

  async getHealthTrends(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data: checkins, error } = await supabaseAdmin
        .from('health_checkins')
        .select('checkin_date, mood_rating, energy_level, pain_level, sleep_quality')
        .eq('user_id', userId)
        .gte('checkin_date', startDateStr)
        .order('checkin_date', { ascending: true });

      if (error) {
        logger.error('Get health trends error:', error);
        throw new Error('Failed to retrieve health trends');
      }

      // Calculate averages
      const totals = checkins.reduce((acc, checkin) => {
        acc.mood_rating += checkin.mood_rating;
        acc.energy_level += checkin.energy_level;
        acc.pain_level += checkin.pain_level;
        acc.sleep_quality += checkin.sleep_quality;
        return acc;
      }, { mood_rating: 0, energy_level: 0, pain_level: 0, sleep_quality: 0 });

      const count = checkins.length;
      const averages = count > 0 ? {
        mood_rating: (totals.mood_rating / count).toFixed(1),
        energy_level: (totals.energy_level / count).toFixed(1),
        pain_level: (totals.pain_level / count).toFixed(1),
        sleep_quality: (totals.sleep_quality / count).toFixed(1)
      } : null;

      return {
        checkins,
        averages,
        total_days: count
      };
    } catch (error) {
      logger.error('Get health trends service error:', error);
      throw error;
    }
  }

  async getTodayCheckin(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      return await this.getHealthCheckinByDate(userId, today);
    } catch (error) {
      logger.error('Get today checkin service error:', error);
      throw error;
    }
  }

  async getHealthSummary(userId) {
    try {
      // Get recent checkins for summary
      const recentCheckins = await this.getUserHealthCheckins(userId, 7);
      
      // Get health trends
      const trends = await this.getHealthTrends(userId, 30);
      
      // Check if today's checkin exists
      const todayCheckin = await this.getTodayCheckin(userId);

      return {
        recent_checkins: recentCheckins,
        trends,
        today_checkin: todayCheckin,
        checkin_streak: this.calculateCheckinStreak(recentCheckins)
      };
    } catch (error) {
      logger.error('Get health summary service error:', error);
      throw error;
    }
  }

  calculateCheckinStreak(checkins) {
    if (!checkins || checkins.length === 0) return 0;

    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);

    // Sort checkins by date descending
    const sortedCheckins = checkins.sort((a, b) => 
      new Date(b.checkin_date) - new Date(a.checkin_date)
    );

    for (let i = 0; i < sortedCheckins.length; i++) {
      const checkinDate = new Date(sortedCheckins[i].checkin_date);
      const currentDateStr = currentDate.toISOString().split('T')[0];
      const checkinDateStr = checkinDate.toISOString().split('T')[0];

      if (checkinDateStr === currentDateStr) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }
}

module.exports = new HealthService();
