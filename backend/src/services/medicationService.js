const { supabaseAdmin } = require('../config/database');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

class MedicationService {
  async createMedication(userId, medicationData) {
    try {
      // Filter out fields that don't exist in the database schema and map correctly
      const { notes, times, ...validMedicationData } = medicationData;
      
      // Map 'notes' to 'instructions' if notes is provided and instructions is empty/undefined
      if (notes && !validMedicationData.instructions) {
        validMedicationData.instructions = notes;
        logger.info(`Mapped 'notes' field to 'instructions' field for medication: ${validMedicationData.name}`);
      } else if (notes) {
        logger.warn(`Notes field provided but 'instructions' already exists, notes ignored: ${notes}`);
      }
      
      // Log if times field was provided
      if (times && times.length > 0) {
        logger.warn(`Times field provided but not stored in medications table, use medication_schedules table instead: ${times.join(', ')}`);
      }

      const medicationId = uuidv4();
      const { data: medication, error } = await supabaseAdmin
        .from('medications')
        .insert([{
          id: medicationId,
          user_id: userId,
          ...validMedicationData
        }])
        .select('*')
        .single();

      if (error) {
        logger.error('Create medication error:', error);
        throw new Error('Failed to create medication');
      }

      return medication;
    } catch (error) {
      logger.error('Medication service error:', error);
      throw error;
    }
  }

  async getUserMedications(userId) {
    try {
      const { data: medications, error } = await supabaseAdmin
        .from('medications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Get medications error:', error);
        throw new Error('Failed to retrieve medications');
      }

      return medications;
    } catch (error) {
      logger.error('Get medications service error:', error);
      throw error;
    }
  }

  async getMedicationById(userId, medicationId) {
    try {
      const { data: medication, error } = await supabaseAdmin
        .from('medications')
        .select('*')
        .eq('id', medicationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        logger.error('Get medication by ID error:', error);
        throw new Error('Failed to retrieve medication');
      }

      return medication;
    } catch (error) {
      logger.error('Get medication by ID service error:', error);
      throw error;
    }
  }

  async updateMedication(userId, medicationId, updateData) {
    try {
      // Filter out fields that don't exist in the database schema
      const { notes, times, ...validUpdateData } = updateData;
      
      // Map 'notes' to 'instructions' if notes is provided and instructions is empty/undefined
      if (notes && !validUpdateData.instructions) {
        validUpdateData.instructions = notes;
        logger.info(`Mapped 'notes' field to 'instructions' field for medication update`);
      } else if (notes) {
        logger.warn(`Notes field provided but 'instructions' already exists, notes ignored: ${notes}`);
      }
      
      // Log if times field was provided
      if (times && times.length > 0) {
        logger.warn(`Times field provided but not stored in medications table, use medication_schedules table instead: ${times.join(', ')}`);
      }

      const { data: medication, error } = await supabaseAdmin
        .from('medications')
        .update({
          ...validUpdateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', medicationId)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) {
        logger.error('Update medication error:', error);
        throw new Error('Failed to update medication');
      }

      return medication;
    } catch (error) {
      logger.error('Update medication service error:', error);
      throw error;
    }
  }

  async deleteMedication(userId, medicationId) {
    try {
      const { error } = await supabaseAdmin
        .from('medications')
        .update({ is_active: false })
        .eq('id', medicationId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Delete medication error:', error);
        throw new Error('Failed to delete medication');
      }

      return true;
    } catch (error) {
      logger.error('Delete medication service error:', error);
      throw error;
    }
  }

  /**
   * Log medication taken/missed status
   * Maps frontend fields to database schema:
   * 
   * Frontend → Database:
   * - taken: boolean → status: 'taken'|'missed'|'pending'|'skipped'
   * - taken_at: timestamp → taken_time: timestamp
   * - scheduled_time: timestamp → scheduled_time: timestamp (required)
   * - notes: string → notes: string
   */
  async logMedication(userId, medicationId, logData) {
    try {
      // Map frontend fields to database schema
      const { taken, taken_at, ...otherData } = logData;
      
      // Convert frontend data to database format
      const dbLogData = {
        ...otherData,
        // Map 'taken' boolean to 'status' field
        status: taken === true ? 'taken' : taken === false ? 'missed' : (logData.status || 'pending'),
        // Map 'taken_at' to 'taken_time' 
        taken_time: taken_at || logData.taken_time || (taken === true ? new Date().toISOString() : null)
      };

      // Ensure required scheduled_time is present
      if (!dbLogData.scheduled_time) {
        dbLogData.scheduled_time = new Date().toISOString();
      }

      // Log the field mapping for debugging
      if (taken !== undefined) {
        logger.info(`Mapped 'taken: ${taken}' to 'status: ${dbLogData.status}'`);
      }
      if (taken_at) {
        logger.info(`Mapped 'taken_at' to 'taken_time' for medication log`);
      }

      const logId = uuidv4();
      const { data: log, error } = await supabaseAdmin
        .from('medication_logs')
        .insert([{
          id: logId,
          user_id: userId,
          medication_id: medicationId,
          ...dbLogData
        }])
        .select('*')
        .single();

      if (error) {
        logger.error('Log medication error:', error);
        throw new Error('Failed to log medication');
      }

      // Map database response back to frontend-expected format for consistency
      const frontendLog = {
        ...log,
        taken: log.status === 'taken',
        taken_at: log.taken_time
      };

      return frontendLog;
    } catch (error) {
      logger.error('Log medication service error:', error);
      throw error;
    }
  }

  async getMedicationLogs(userId, medicationId = null, limit = 50) {
    try {
      let query = supabaseAdmin
        .from('medication_logs')
        .select(`
          *,
          medication:medications(name, dosage)
        `)
        .eq('user_id', userId)
        .order('scheduled_time', { ascending: false })
        .limit(limit);

      if (medicationId) {
        query = query.eq('medication_id', medicationId);
      }

      const { data: logs, error } = await query;

      if (error) {
        logger.error('Get medication logs error:', error);
        throw new Error('Failed to retrieve medication logs');
      }

      // Map database fields to frontend-expected format for consistency
      const mappedLogs = logs.map(log => ({
        ...log,
        taken: log.status === 'taken',
        taken_at: log.taken_time
      }));

      return mappedLogs;
    } catch (error) {
      logger.error('Get medication logs service error:', error);
      throw error;
    }
  }

  async getTodaysMedications(userId) {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Get active medications
      const { data: medications, error: medError } = await supabaseAdmin
        .from('medications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .lte('start_date', todayStr)
        .or(`end_date.is.null,end_date.gte.${todayStr}`);

      if (medError) {
        logger.error('Get today medications error:', medError);
        throw new Error('Failed to retrieve today\'s medications');
      }

      // Get today's logs for these medications
      const medicationIds = medications.map(med => med.id);
      
      let logs = [];
      if (medicationIds.length > 0) {
        const { data: todayLogs, error: logError } = await supabaseAdmin
          .from('medication_logs')
          .select('*')
          .eq('user_id', userId)
          .in('medication_id', medicationIds)
          .gte('scheduled_time', `${todayStr}T00:00:00.000Z`)
          .lt('scheduled_time', `${todayStr}T23:59:59.999Z`);

        if (!logError) {
          logs = todayLogs;
        }
      }

      // Combine medications with their logs (map log fields for frontend compatibility)
      const medicationsWithLogs = medications.map(medication => ({
        ...medication,
        logs: logs
          .filter(log => log.medication_id === medication.id)
          .map(log => ({
            ...log,
            taken: log.status === 'taken',
            taken_at: log.taken_time
          }))
      }));

      return medicationsWithLogs;
    } catch (error) {
      logger.error('Get today medications service error:', error);
      throw error;
    }
  }

  async getMedicationHistory(userId, options = {}) {
    try {
      const { days = 30, medicationId } = options;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      let query = supabaseAdmin
        .from('medication_logs')
        .select(`
          *,
          medications!inner(name, dosage, frequency)
        `)
        .eq('user_id', userId)
        .gte('created_at', startDateStr)
        .order('created_at', { ascending: false });

      if (medicationId) {
        query = query.eq('medication_id', medicationId);
      }

      const { data: history, error } = await query;

      if (error) {
        logger.error('Get medication history error:', error);
        throw new Error('Failed to retrieve medication history');
      }

      // Map database fields to frontend-expected format for consistency
      const mappedHistory = history.map(log => ({
        ...log,
        taken: log.status === 'taken',
        taken_at: log.taken_time
      }));

      return mappedHistory;
    } catch (error) {
      logger.error('Get medication history service error:', error);
      throw error;
    }
  }

  async getMedicationReminders(userId) {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

      // Get active medications with reminders that are due
      const { data: medications, error } = await supabaseAdmin
        .from('medications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .lte('start_date', today)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .not('reminder_times', 'is', null);

      if (error) {
        logger.error('Get medication reminders error:', error);
        throw new Error('Failed to retrieve medication reminders');
      }

      // Filter medications that have reminder times due
      const dueReminders = medications.filter(medication => {
        if (!medication.reminder_times) return false;
        
        const reminderTimes = Array.isArray(medication.reminder_times) 
          ? medication.reminder_times 
          : [medication.reminder_times];
        
        return reminderTimes.some(time => time <= currentTime);
      });

      return dueReminders;
    } catch (error) {
      logger.error('Get medication reminders service error:', error);
      throw error;
    }
  }

  async snoozeMedicationReminder(userId, medicationId, snoozeMinutes) {
    try {
      // For now, we'll just log the snooze action
      // In a real implementation, you'd store this in a reminders table
      const snoozeUntil = new Date();
      snoozeUntil.setMinutes(snoozeUntil.getMinutes() + snoozeMinutes);
      
      logger.info(`Medication reminder snoozed for user ${userId}, medication ${medicationId} until ${snoozeUntil}`);
      
      return {
        medicationId,
        snoozedUntil: snoozeUntil.toISOString(),
        snoozeMinutes
      };
    } catch (error) {
      logger.error('Snooze medication reminder service error:', error);
      throw error;
    }
  }

  async getMedicationStats(userId, period = '30') {
    try {
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      // Get medication logs for the period
      const { data: logs, error: logsError } = await supabaseAdmin
        .from('medication_logs')
        .select(`
          *,
          medications!inner(name, frequency)
        `)
        .eq('user_id', userId)
        .gte('created_at', startDateStr)
        .order('created_at', { ascending: false });

      if (logsError) {
        logger.error('Get medication stats logs error:', logsError);
        throw new Error('Failed to retrieve medication statistics');
      }

      // Get active medications count
      const { data: medications, error: medError } = await supabaseAdmin
        .from('medications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (medError) {
        logger.error('Get medication stats medications error:', medError);
        throw new Error('Failed to retrieve medication statistics');
      }

      // Calculate statistics
      const totalMedications = medications.length;
      const totalLogs = logs.length;
      const takenLogs = logs.filter(log => log.status === 'taken').length;
      const missedLogs = logs.filter(log => log.status === 'missed').length;
      const adherenceRate = totalLogs > 0 ? (takenLogs / totalLogs) * 100 : 0;

      // Group by medication frequency
      const medicationFrequencies = medications.reduce((acc, med) => {
        acc[med.frequency] = (acc[med.frequency] || 0) + 1;
        return acc;
      }, {});

      // Daily adherence trend
      const dailyStats = logs.reduce((acc, log) => {
        const date = log.created_at.split('T')[0];
        if (!acc[date]) {
          acc[date] = { taken: 0, missed: 0, total: 0 };
        }
        acc[date].total++;
        if (log.status === 'taken') {
          acc[date].taken++;
        } else if (log.status === 'missed') {
          acc[date].missed++;
        }
        return acc;
      }, {});

      return {
        totalMedications,
        totalLogs,
        takenLogs,
        missedLogs,
        adherenceRate: Math.round(adherenceRate * 100) / 100,
        medicationFrequencies,
        dailyStats,
        period: `${days} days`
      };
    } catch (error) {
      logger.error('Get medication stats service error:', error);
      throw error;
    }
  }
}

module.exports = new MedicationService();
