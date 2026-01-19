import { pool } from '../config/database';
import { ResultSetHeader } from 'mysql2';

/**
 * Service for handling dynamic shift scheduling and attendance logic
 */
export class ShiftSchedulingService {
  /**
   * Get the effective schedule for a user on a specific date
   */
  static async getEffectiveScheduleForDate(userId: number, date: Date): Promise<{
    start_time: string | null;
    end_time: string | null;
    break_duration_minutes: number;
    schedule_type: string;
    schedule_note: string;
  } | null> {
    try {
      // First, check for any shift exceptions on this specific date
      const [exceptions]: any = await pool.execute(
        `SELECT se.new_start_time, se.new_end_time, se.new_break_duration_minutes, se.exception_type, se.reason
         FROM shift_exceptions se
         WHERE se.user_id = ? AND se.exception_date = ? AND se.status = 'active'`,
        [userId, date.toISOString().split('T')[0]]
      );

      if (exceptions.length > 0) {
        const exception = exceptions[0];
        return {
          start_time: exception.new_start_time,
          end_time: exception.new_end_time,
          break_duration_minutes: exception.new_break_duration_minutes,
          schedule_type: `exception_${exception.exception_type}`,
          schedule_note: exception.reason || `Special schedule for ${exception.exception_type}`
        };
      }

      // Next, check for any active shift assignments for this user
      const [assignments]: any = await pool.execute(
        `SELECT esa.custom_start_time, esa.custom_end_time, esa.custom_break_duration_minutes,
                st.start_time as template_start_time, st.end_time as template_end_time, 
                st.break_duration_minutes as template_break_duration_minutes,
                st.recurrence_pattern, st.recurrence_days
         FROM employee_shift_assignments esa
         LEFT JOIN shift_templates st ON esa.shift_template_id = st.id
         WHERE esa.user_id = ? 
           AND esa.status = 'active'
           AND ? BETWEEN esa.effective_from AND COALESCE(esa.effective_to, '9999-12-31')`,
        [userId, date.toISOString().split('T')[0]]
      );

      if (assignments.length > 0) {
        const assignment = assignments[0];
        
        // Check if this date falls within the recurrence pattern
        if (assignment.recurrence_pattern) {
          const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const dayName = dayNames[dayOfWeek];
          
          // If recurrence_days is set, check if this day is included
          if (assignment.recurrence_days) {
            const recurrenceDays = JSON.parse(assignment.recurrence_days);
            if (!recurrenceDays.includes(dayName) && !recurrenceDays.includes(dayOfWeek)) {
              // This day is not part of the recurring schedule
              return {
                start_time: null,
                end_time: null,
                break_duration_minutes: 0,
                schedule_type: 'non_working_day',
                schedule_note: 'Non-working day based on recurrence pattern'
              };
            }
          }
        }

        // Use custom times if set, otherwise use template times
        return {
          start_time: assignment.custom_start_time || assignment.template_start_time,
          end_time: assignment.custom_end_time || assignment.template_end_time,
          break_duration_minutes: assignment.custom_break_duration_minutes || assignment.template_break_duration_minutes || 0,
          schedule_type: assignment.recurrence_pattern || 'standard',
          schedule_note: 'Standard schedule' // Could be expanded with more details
        };
      }

      // If no specific schedule found, return null
      return null;
    } catch (error) {
      console.error('Error getting effective schedule:', error);
      throw error;
    }
  }

  /**
   * Calculate attendance metrics based on the effective schedule
   */
  static async calculateAttendanceMetrics(
    userId: number,
    date: Date,
    checkInTime: string | null,
    checkOutTime: string | null
  ): Promise<{
    is_late: boolean | null;
    is_early_departure: boolean | null;
    actual_working_hours: number | null;
    scheduled_start_time: string | null;
    scheduled_end_time: string | null;
    scheduled_break_duration_minutes: number;
  }> {
    try {
      // Get the effective schedule for this date
      const schedule = await this.getEffectiveScheduleForDate(userId, date);
      
      if (!schedule || !schedule.start_time || !schedule.end_time) {
        // If no schedule exists for this date, the employee is not expected to work
        return {
          is_late: null,
          is_early_departure: null,
          actual_working_hours: null,
          scheduled_start_time: null,
          scheduled_end_time: null,
          scheduled_break_duration_minutes: 0
        };
      }

      // Parse the scheduled times
      const [schedStartHours, schedStartMinutes] = schedule.start_time.split(':').map(Number);
      const [schedEndHours, schedEndMinutes] = schedule.end_time.split(':').map(Number);
      
      const scheduledStartTime = new Date(date);
      scheduledStartTime.setHours(schedStartHours, schedStartMinutes, 0, 0);
      
      const scheduledEndTime = new Date(date);
      scheduledEndTime.setHours(schedEndHours, schedEndMinutes, 0, 0);

      // Calculate late arrival
      let isLate = false;
      if (checkInTime) {
        const [checkInHours, checkInMinutes] = checkInTime.split(':').map(Number);
        const checkInDateTime = new Date(date);
        checkInDateTime.setHours(checkInHours, checkInMinutes, 0, 0);
        
        // Consider late if arrived after scheduled start time
        isLate = checkInDateTime.getTime() > scheduledStartTime.getTime();
      }

      // Calculate early departure
      let isEarlyDeparture = false;
      if (checkOutTime) {
        const [checkOutHours, checkOutMinutes] = checkOutTime.split(':').map(Number);
        const checkOutDateTime = new Date(date);
        checkOutDateTime.setHours(checkOutHours, checkOutMinutes, 0, 0);
        
        // Consider early departure if left before scheduled end time
        isEarlyDeparture = checkOutDateTime.getTime() < scheduledEndTime.getTime();
      }

      // Calculate actual working hours
      let actualWorkingHours = null;
      if (checkInTime && checkOutTime) {
        const [checkInHours, checkInMinutes] = checkInTime.split(':').map(Number);
        const [checkOutHours, checkOutMinutes] = checkOutTime.split(':').map(Number);
        
        const checkInDateTime = new Date(date);
        checkInDateTime.setHours(checkInHours, checkInMinutes, 0, 0);
        
        const checkOutDateTime = new Date(date);
        checkOutDateTime.setHours(checkOutHours, checkOutMinutes, 0, 0);
        
        // Calculate difference in milliseconds, then convert to hours
        const diffMs = checkOutDateTime.getTime() - checkInDateTime.getTime();
        let diffHours = diffMs / (1000 * 60 * 60);
        
        // Subtract break time
        diffHours -= (schedule.break_duration_minutes / 60);
        
        // Ensure we don't have negative working hours
        actualWorkingHours = Math.max(0, parseFloat(diffHours.toFixed(2)));
      }

      return {
        is_late: isLate,
        is_early_departure: isEarlyDeparture,
        actual_working_hours: actualWorkingHours,
        scheduled_start_time: schedule.start_time,
        scheduled_end_time: schedule.end_time,
        scheduled_break_duration_minutes: schedule.break_duration_minutes
      };
    } catch (error) {
      console.error('Error calculating attendance metrics:', error);
      throw error;
    }
  }

  /**
   * Update attendance record with schedule information
   */
  static async updateAttendanceWithScheduleInfo(
    attendanceId: number,
    userId: number,
    date: Date,
    checkInTime: string | null,
    checkOutTime: string | null
  ): Promise<boolean> {
    try {
      // Calculate attendance metrics based on the effective schedule
      const metrics = await this.calculateAttendanceMetrics(userId, date, checkInTime, checkOutTime);

      // Update the attendance record with schedule information
      const [result]: any = await pool.execute(
        `UPDATE attendance 
         SET scheduled_start_time = ?, scheduled_end_time = ?, 
             scheduled_break_duration_minutes = ?, is_late = ?, 
             is_early_departure = ?, actual_working_hours = ?
         WHERE id = ?`,
        [
          metrics.scheduled_start_time,
          metrics.scheduled_end_time,
          metrics.scheduled_break_duration_minutes,
          metrics.is_late,
          metrics.is_early_departure,
          metrics.actual_working_hours,
          attendanceId
        ]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating attendance with schedule info:', error);
      throw error;
    }
  }

  /**
   * Process attendance for a specific user and date
   */
  static async processAttendanceForDate(userId: number, date: Date): Promise<void> {
    try {
      // Get the attendance record for this user and date
      const [attendanceRecords]: any = await pool.execute(
        `SELECT id, check_in_time, check_out_time
         FROM attendance
         WHERE user_id = ? AND date = ?`,
        [userId, date.toISOString().split('T')[0]]
      );

      if (attendanceRecords.length > 0) {
        const record = attendanceRecords[0];
        
        // Update the attendance record with schedule information
        await this.updateAttendanceWithScheduleInfo(
          record.id,
          userId,
          date,
          record.check_in_time,
          record.check_out_time
        );
      }
    } catch (error) {
      console.error('Error processing attendance for date:', error);
      throw error;
    }
  }
}