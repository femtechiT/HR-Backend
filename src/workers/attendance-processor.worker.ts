import { pool } from '../config/database';
import AttendanceModel from '../models/attendance.model';
import HolidayModel from '../models/holiday.model';
import LeaveHistoryModel from '../models/leave-history.model';
import { ShiftSchedulingService } from '../services/shift-scheduling.service';

/**
 * Attendance Processor Worker
 * This worker processes attendance for all staff members for the previous day
 * It should be run daily (e.g., at midnight or early morning)
 */

class AttendanceProcessorWorker {
  /**
   * Process attendance for all staff members for a specific date
   */
  static async processAttendanceForDate(date: Date) {
    console.log(`Starting attendance processing for date: ${date.toISOString().split('T')[0]}`);

    try {
      // Get all active staff members
      const [staffResults] = await pool.execute(
        `SELECT s.user_id FROM staff s 
         JOIN users u ON s.user_id = u.id 
         WHERE s.status = 'active' AND u.status = 'active'`
      ) as [any[], any];

      const userIds = staffResults.map((staff: any) => staff.user_id);
      console.log(`Processing attendance for ${userIds.length} active staff members`);

      // Check if it's a holiday
      const isHoliday = await HolidayModel.isHoliday(date);
      if (isHoliday) {
        console.log(`Date ${date.toISOString().split('T')[0]} is a holiday, marking staff as holiday or holiday-working`);

        let holidayProcessedCount = 0;
        let holidayWorkingCount = 0;

        for (const userId of userIds) {
          // Check if attendance already exists
          const existingAttendance = await AttendanceModel.findByUserIdAndDate(userId, date);
          if (existingAttendance) {
            console.log(`Attendance already exists for user ${userId} on ${date.toISOString().split('T')[0]}, skipping`);
            continue;
          }

          // Check if user is on holiday duty roster
          const [dutyRoster] = await pool.execute(
            `SELECT * FROM holiday_duty_roster WHERE holiday_id = (SELECT id FROM holidays WHERE date = ? LIMIT 1) AND user_id = ?`,
            [date, userId]
          ) as [any[], any];

          if (dutyRoster.length > 0) {
            // User is on holiday duty - mark as holiday-working
            const roster = dutyRoster[0];
            const attendanceData = {
              user_id: userId,
              date: date,
              status: 'holiday-working' as any,
              check_in_time: null,
              check_out_time: null,
              location_coordinates: null,
              location_verified: false,
              location_address: null,
              notes: `Scheduled for holiday duty: ${roster.shift_start_time} - ${roster.shift_end_time}`
            };

            await AttendanceModel.create(attendanceData);
            holidayWorkingCount++;
            console.log(`Holiday-working attendance processed for user ${userId}`);
          } else {
            // User is not on duty - mark as holiday
            const attendanceData = {
              user_id: userId,
              date: date,
              status: 'holiday' as const,
              check_in_time: null,
              check_out_time: null,
              location_coordinates: null,
              location_verified: false,
              location_address: null,
              notes: 'Public holiday - no attendance required'
            };

            await AttendanceModel.create(attendanceData);
            holidayProcessedCount++;
          }
        }

        console.log(`Holiday attendance processed: ${holidayProcessedCount} on holiday, ${holidayWorkingCount} on duty`);
        return;
      }

      // Process attendance for each user individually
      let absentProcessedCount = 0;
      let leaveProcessedCount = 0;
      let skippedCount = 0;
      
      for (const userId of userIds) {
        // Check if attendance already exists
        const existingAttendance = await AttendanceModel.findByUserIdAndDate(userId, date);
        if (existingAttendance) {
          console.log(`Attendance already exists for user ${userId} on ${date.toISOString().split('T')[0]}, skipping`);
          skippedCount++;
          continue;
        }

        // Check if user has approved leave on this date
        const leaveHistory = await LeaveHistoryModel.findByUserIdAndDateRange(userId, date, date);
        if (leaveHistory.length > 0) {
          // Check for approved leave that hasn't been cancelled
          const activeApprovedLeave = leaveHistory.filter(
            leave => leave.status === 'approved' && leave.status !== 'cancelled'
          );

          if (activeApprovedLeave.length > 0) {
            const attendanceData = {
              user_id: userId,
              date: date,
              status: 'leave' as const,
              check_in_time: null,
              check_out_time: null,
              location_coordinates: null,
              location_verified: false,
              location_address: null,
              notes: 'On approved leave'
            };

            await AttendanceModel.create(attendanceData);
            leaveProcessedCount++;
            console.log(`Leave attendance processed for user ${userId}`);
            continue;
          }
        }

        // Also check leave_requests table for approved but not cancelled leave
        const [leaveRequests]: any = await pool.execute(
          `SELECT * FROM leave_requests
           WHERE user_id = ?
             AND ? BETWEEN start_date AND end_date
             AND status = 'approved'
             AND (cancelled_by IS NULL OR cancelled_at IS NULL)`,
          [userId, date]
        );

        if (leaveRequests.length > 0) {
          const attendanceData = {
            user_id: userId,
            date: date,
            status: 'leave' as const,
            check_in_time: null,
            check_out_time: null,
            location_coordinates: null,
            location_verified: false,
            location_address: null,
            notes: 'On approved leave'
          };

          await AttendanceModel.create(attendanceData);
          leaveProcessedCount++;
          console.log(`Leave attendance processed for user ${userId} from leave_requests`);
          continue;
        }

        // Get user's effective schedule for this date using the new shift scheduling system
        const effectiveSchedule = await ShiftSchedulingService.getEffectiveScheduleForDate(userId, date);

        // If no schedule is defined for this user on this date, don't mark attendance (they're not scheduled)
        if (!effectiveSchedule || !effectiveSchedule.start_time || !effectiveSchedule.end_time) {
          skippedCount++;
          console.log(`No shift assigned for user ${userId} on ${date.toISOString().split('T')[0]}, skipping`);
          continue;
        }

        // If shift exists but no check-in time was recorded, mark as absent
        const attendanceData = {
          user_id: userId,
          date: date,
          status: 'absent' as const,
          check_in_time: null,
          check_out_time: null,
          location_coordinates: null,
          location_verified: false,
          location_address: null,
          notes: 'Scheduled shift but no check-in recorded'
        };

        await AttendanceModel.create(attendanceData);
        absentProcessedCount++;
        console.log(`Absent attendance recorded for user ${userId} (scheduled shift but no check-in)`);
      }

      console.log(`Attendance processing completed for ${date.toISOString().split('T')[0]}`);
      console.log(`- Absent marked: ${absentProcessedCount}`);
      console.log(`- Leave marked: ${leaveProcessedCount}`);
      console.log(`- Skipped (already processed or no shift): ${skippedCount}`);

    } catch (error) {
      console.error('Error processing attendance:', error);
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
    
    await this.processAttendanceForDate(yesterday);
  }

  /**
   * Process attendance for today
   */
  static async processTodayAttendance() {
    const today = new Date();
    // Set time to 00:00:00 to get the start of the day
    today.setHours(0, 0, 0, 0);
    
    await this.processAttendanceForDate(today);
  }

  /**
   * Start the attendance processor worker
   * This runs continuously, processing attendance at a specific time each day
   */
  static async start() {
    console.log('Starting Attendance Processor Worker...');

    // Process yesterday's attendance now (in case it wasn't processed)
    try {
      await this.processYesterdayAttendance();
      console.log('Initial yesterday attendance processing completed');
    } catch (error) {
      console.error('Error in initial yesterday attendance processing:', error);
    }

    // Set up interval to process attendance daily
    // Run at 12:05 AM every day (5 minutes after midnight to ensure we're in the new day)
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setDate(nextRun.getDate() + 1); // Tomorrow
    nextRun.setHours(0, 5, 0, 0); // 12:05 AM

    const msUntilNextRun = nextRun.getTime() - now.getTime();
    
    console.log(`Next attendance processing scheduled for: ${nextRun.toISOString()}`);
    
    // Run the first time after the calculated delay
    setTimeout(() => {
      // Process today's attendance (yesterday from the perspective of the scheduled time)
      this.processYesterdayAttendance().catch(error => {
        console.error('Error processing attendance:', error);
      });

      // Set up recurring daily processing
      setInterval(async () => {
        try {
          await this.processYesterdayAttendance();
          console.log('Daily attendance processing completed');
        } catch (error) {
          console.error('Error in daily attendance processing:', error);
        }
      }, 24 * 60 * 60 * 1000); // Every 24 hours
    }, msUntilNextRun);
  }
}

export default AttendanceProcessorWorker;