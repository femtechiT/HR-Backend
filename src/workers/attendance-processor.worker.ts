import { pool } from '../config/database';
import AttendanceModel from '../models/attendance.model';
import HolidayModel from '../models/holiday.model';
import LeaveHistoryModel from '../models/leave-history.model';
import LeaveRequestModel from '../models/leave-request.model';
import { ShiftSchedulingService } from '../services/shift-scheduling.service';
import BranchModel from '../models/branch.model';
import BranchWorkingDaysModel from '../models/branch-working-days.model';
import StaffModel from '../models/staff.model';

/**
 * Attendance Processor Worker
 * This worker processes attendance for all staff members for the previous day
 * It runs continuously, checking every minute for branch-specific auto-mark times
 */

class AttendanceProcessorWorker {
  private static isRunning = false;
  private static lastCheckTime: Date | null = null;
  private static processedDates = new Set<string>();

  /**
   * Process attendance for all staff members for a specific date
   */
  static async processAttendanceForDate(date: Date, branchId?: number) {
    const dateStr = date.toISOString().split('T')[0];
    const logPrefix = branchId ? `[Branch ${branchId}]` : '[All Branches]';
    
    console.log(`${logPrefix} Starting attendance processing for date: ${dateStr}`);

    try {
      // Build query based on whether we're processing for a specific branch or all
      let query = `
        SELECT s.user_id, s.branch_id 
        FROM staff s
        JOIN users u ON s.user_id = u.id
        WHERE s.status = 'active' AND u.status = 'active'
      `;
      const params: any[] = [];

      if (branchId) {
        query += ' AND s.branch_id = ?';
        params.push(branchId);
      }

      const [staffResults] = await pool.execute(query, params) as [any[], any];

      const userIds = staffResults.map((staff: any) => staff.user_id);
      console.log(`${logPrefix} Processing attendance for ${userIds.length} active staff members`);

      // Process attendance for each user individually
      let absentProcessedCount = 0;
      let leaveProcessedCount = 0;
      let holidayProcessedCount = 0;
      let skippedCount = 0;

      for (const userId of userIds) {
        // Check if attendance already exists
        const existingAttendance = await AttendanceModel.findByUserIdAndDate(userId, date);
        if (existingAttendance) {
          console.log(`${logPrefix} Attendance already exists for user ${userId} on ${dateStr}, skipping`);
          skippedCount++;
          continue;
        }

        // Get user's effective schedule for this date using the new shift scheduling system
        // This handles exceptions, holidays, custom shifts, and branch defaults
        const effectiveSchedule = await ShiftSchedulingService.getEffectiveScheduleForDate(userId, date);

        if (effectiveSchedule && effectiveSchedule.schedule_type === 'holiday') {
          // Employee has no exception to work, so they get the day off for the holiday
          const attendanceData = {
            user_id: userId,
            date: date,
            status: 'holiday' as const,
            check_in_time: null,
            check_out_time: null,
            location_coordinates: null,
            location_verified: false,
            location_address: null,
            notes: effectiveSchedule.schedule_note
          };
          await AttendanceModel.create(attendanceData);
          holidayProcessedCount++;
          console.log(`${logPrefix} Holiday attendance processed for user ${userId}`);
          continue;
        }

        // Check if user has approved leave on this date
        // Note: leave_history and leave_requests could logically be integrated into ShiftSchedulingService later,
        // but for now we keep the existing leave checks here.
        const leaveHistory = await LeaveHistoryModel.findByUserIdAndDateRange(userId, date, date);
        if (leaveHistory.length > 0) {
          const activeApprovedLeave = leaveHistory.filter(leave => leave.status === 'approved');
          if (activeApprovedLeave.length > 0) {
            const attendanceData = {
              user_id: userId,
              date: date,
              status: 'leave' as any,
              check_in_time: null,
              check_out_time: null,
              location_coordinates: null,
              location_verified: false,
              location_address: null,
              notes: 'On approved leave'
            };
            await AttendanceModel.create(attendanceData);
            leaveProcessedCount++;
            console.log(`${logPrefix} Leave attendance processed for user ${userId}`);
            continue;
          }
        }

        const [leaveRequests]: any = await pool.execute(
          `SELECT * FROM leave_requests WHERE user_id = ? AND ? BETWEEN start_date AND end_date AND status = 'approved' AND (cancelled_by IS NULL OR cancelled_at IS NULL)`,
          [userId, date]
        );

        if (leaveRequests.length > 0) {
          const attendanceData = {
            user_id: userId,
            date: date,
            status: 'leave' as any,
            check_in_time: null,
            check_out_time: null,
            location_coordinates: null,
            location_verified: false,
            location_address: null,
            notes: 'On approved leave'
          };
          await AttendanceModel.create(attendanceData);
          leaveProcessedCount++;
          console.log(`${logPrefix} Leave attendance processed for user ${userId} from leave_requests`);
          continue;
        }

        // If no schedule is defined for this user on this date, it's a weekend or off day
        if (!effectiveSchedule || !effectiveSchedule.start_time || !effectiveSchedule.end_time) {
          // Determine status based on schedule type
          let status: any = 'weekend';
          let notes = effectiveSchedule?.schedule_note || 'Non-working day';

          if (effectiveSchedule?.schedule_type === 'holiday') {
            status = 'holiday';
          }

          const attendanceData = {
            user_id: userId,
            date: date,
            status: status,
            check_in_time: null,
            check_out_time: null,
            location_coordinates: null,
            location_verified: false,
            location_address: null,
            notes: notes
          };
          await AttendanceModel.create(attendanceData);
          skippedCount++; // count weekend as skipped for summary
          console.log(`${logPrefix} Non-working day for user ${userId} on ${dateStr}, marking as ${status}`);
          continue;
        }

        // If a valid working schedule exists but no check-in time was recorded, mark as absent
        const attendanceData = {
          user_id: userId,
          date: date,
          status: 'absent' as any,
          check_in_time: null,
          check_out_time: null,
          location_coordinates: null,
          location_verified: false,
          location_address: null,
          notes: 'Scheduled shift but no check-in recorded'
        };

        await AttendanceModel.create(attendanceData);
        absentProcessedCount++;
        console.log(`${logPrefix} Absent attendance recorded for user ${userId} (scheduled shift but no check-in)`);
      }

      const result = {
        processed: absentProcessedCount + leaveProcessedCount + skippedCount,
        absent: absentProcessedCount,
        leave: leaveProcessedCount,
        skipped: skippedCount
      };

      console.log(`${logPrefix} Attendance processing completed for ${dateStr}`);
      console.log(`${logPrefix} - Absent marked: ${absentProcessedCount}`);
      console.log(`${logPrefix} - Leave marked: ${leaveProcessedCount}`);
      console.log(`${logPrefix} - Skipped (already processed or no shift): ${skippedCount}`);

      return result;

    } catch (error) {
      console.error(`${logPrefix} Error processing attendance:`, error);
      throw error;
    }
  }

  /**
   * Process attendance for yesterday
   */
  static async processYesterdayAttendance() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1); // Set to yesterday

    // Set time to 00:00:00 to get the start of the day
    yesterday.setHours(0, 0, 0, 0);

    return await this.processAttendanceForDate(yesterday);
  }

  /**
   * Process attendance for today
   */
  static async processTodayAttendance() {
    const today = new Date();
    // Set time to 00:00:00 to get the start of the day
    today.setHours(0, 0, 0, 0);

    return await this.processAttendanceForDate(today);
  }

  /**
   * Check and run auto-mark for branches whose scheduled time has arrived
   * Called every minute by the main loop
   */
  static async checkAndRunAutoMark() {
    if (this.isRunning) {
      console.log('[Auto-Mark] Already running, skipping this check');
      return;
    }

    try {
      this.isRunning = true;
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const todayStr = now.toISOString().split('T')[0];

      // Skip if we already processed today
      if (this.processedDates.has(todayStr)) {
        console.log(`[Auto-Mark] Already processed for ${todayStr}, skipping`);
        return;
      }

      console.log(`[Auto-Mark] Checking for branches with auto-mark time: ${currentTime}`);

      // Get all branches with auto-mark enabled for this time
      const [branches]: any = await pool.execute(`
        SELECT id, name, code, auto_mark_absent_time, auto_mark_absent_timezone
        FROM branches
        WHERE auto_mark_absent_enabled = TRUE
          AND auto_mark_absent_time = ?
      `, [currentTime]);

      if (branches.length === 0) {
        this.isRunning = false;
        return;
      }

      console.log(`[Auto-Mark] Found ${branches.length} branch(es) scheduled for auto-mark at ${currentTime}`);

      for (const branch of branches) {
        try {
          console.log(`[Auto-Mark] Processing branch: ${branch.name} (${branch.code})`);

          // Process today's attendance for this branch
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const result = await this.processAttendanceForDate(today, branch.id);

          // Lock the attendance immediately after processing
          await this.lockAttendanceForDate(branch.id, today, 1, 'Auto-mark absent');

          console.log(`[Auto-Mark] Completed for ${branch.name}: ${result.absent} marked absent`);
        } catch (error) {
          console.error(`[Auto-Mark] Error processing branch ${branch.name}:`, error);
        }
      }

      // Mark today as processed
      this.processedDates.add(todayStr);
      this.lastCheckTime = now;

    } catch (error) {
      console.error('[Auto-Mark] Error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Lock attendance for a specific branch and date
   */
  static async lockAttendanceForDate(branchId: number, date: Date, lockedBy: number, reason?: string) {
    const dateStr = date.toISOString().split('T')[0];

    try {
      // Lock all attendance records for that branch/date
      const [result]: any = await pool.execute(`
        UPDATE attendance a
        JOIN staff s ON a.user_id = s.user_id
        SET
          a.is_locked = TRUE,
          a.locked_at = NOW(),
          a.locked_by = ?,
          a.lock_reason = ?
        WHERE s.branch_id = ?
          AND a.date = ?
          AND a.is_locked = FALSE
      `, [lockedBy, reason || 'Auto-lock', branchId, dateStr]);

      // Update branch lock date
      await pool.execute(`
        UPDATE branches
        SET attendance_lock_date = LEAST(IFNULL(attendance_lock_date, ?), ?)
        WHERE id = ?
      `, [dateStr, dateStr, branchId]);

      // Log the action
      await pool.execute(`
        INSERT INTO attendance_lock_log
          (branch_id, lock_date, locked_by, reason, attendance_count)
        VALUES (?, ?, ?, ?, ?)
      `, [branchId, dateStr, lockedBy, reason || 'Auto-lock', result.affectedRows]);

      console.log(`[Lock] Locked ${result.affectedRows} attendance records for branch ${branchId} on ${dateStr}`);
      
      return { lockedCount: result.affectedRows };
    } catch (error) {
      console.error(`[Lock] Error locking attendance for branch ${branchId}:`, error);
      throw error;
    }
  }

  /**
   * Start the attendance processor worker
   * This runs continuously, checking every minute for branch-specific auto-mark times
   */
  static async start() {
    console.log('Starting Attendance Processor Worker...');

    // Process yesterday's attendance immediately on startup
    try {
      await this.processYesterdayAttendance();
      console.log('Initial yesterday attendance processing completed');
    } catch (error) {
      console.error('Error in initial yesterday attendance processing:', error);
    }

    // Mark today as processed if we're starting mid-day (to avoid immediate processing)
    const todayStr = new Date().toISOString().split('T')[0];
    this.processedDates.add(todayStr);

    // Start the minute-by-minute check for auto-mark times
    console.log('[Auto-Mark] Starting minute-by-minute check...');
    setInterval(async () => {
      try {
        await this.checkAndRunAutoMark();
      } catch (error) {
        console.error('[Auto-Mark] Error in check:', error);
      }
    }, 60 * 1000); // Every minute

    console.log('[Auto-Mark] Scheduler started (checks every minute)');
    console.log('[Auto-Mark] Worker is now running. Configure branch auto-mark times in settings.');
  }

  /**
   * Get worker status
   */
  static getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheckTime: this.lastCheckTime,
      processedDates: Array.from(this.processedDates)
    };
  }
}

export default AttendanceProcessorWorker;