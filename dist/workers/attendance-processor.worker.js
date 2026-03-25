"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const attendance_model_1 = __importDefault(require("../models/attendance.model"));
const holiday_model_1 = __importDefault(require("../models/holiday.model"));
const leave_history_model_1 = __importDefault(require("../models/leave-history.model"));
const shift_scheduling_service_1 = require("../services/shift-scheduling.service");
class AttendanceProcessorWorker {
    static isRunning = false;
    static lastCheckTime = null;
    static processedDates = new Set();
    static async processAttendanceForDate(date, branchId) {
        const dateStr = date.toISOString().split('T')[0];
        const logPrefix = branchId ? `[Branch ${branchId}]` : '[All Branches]';
        console.log(`${logPrefix} Starting attendance processing for date: ${dateStr}`);
        try {
            let query = `
        SELECT s.user_id, s.branch_id 
        FROM staff s
        JOIN users u ON s.user_id = u.id
        WHERE s.status = 'active' AND u.status = 'active'
      `;
            const params = [];
            if (branchId) {
                query += ' AND s.branch_id = ?';
                params.push(branchId);
            }
            const [staffResults] = await database_1.pool.execute(query, params);
            const userIds = staffResults.map((staff) => staff.user_id);
            console.log(`${logPrefix} Processing attendance for ${userIds.length} active staff members`);
            const isHoliday = await holiday_model_1.default.isHoliday(date);
            if (isHoliday) {
                console.log(`${logPrefix} Date ${dateStr} is a holiday, marking staff as holiday or holiday-working`);
                let holidayProcessedCount = 0;
                let holidayWorkingCount = 0;
                for (const userId of userIds) {
                    const existingAttendance = await attendance_model_1.default.findByUserIdAndDate(userId, date);
                    if (existingAttendance) {
                        console.log(`${logPrefix} Attendance already exists for user ${userId} on ${dateStr}, skipping`);
                        continue;
                    }
                    const [dutyRoster] = await database_1.pool.execute(`SELECT * FROM holiday_duty_roster WHERE holiday_id = (SELECT id FROM holidays WHERE date = ? LIMIT 1) AND user_id = ?`, [date, userId]);
                    if (dutyRoster.length > 0) {
                        const roster = dutyRoster[0];
                        const attendanceData = {
                            user_id: userId,
                            date: date,
                            status: 'holiday-working',
                            check_in_time: null,
                            check_out_time: null,
                            location_coordinates: null,
                            location_verified: false,
                            location_address: null,
                            notes: `Scheduled for holiday duty: ${roster.shift_start_time} - ${roster.shift_end_time}`
                        };
                        await attendance_model_1.default.create(attendanceData);
                        holidayWorkingCount++;
                        console.log(`${logPrefix} Holiday-working attendance processed for user ${userId}`);
                    }
                    else {
                        const attendanceData = {
                            user_id: userId,
                            date: date,
                            status: 'holiday',
                            check_in_time: null,
                            check_out_time: null,
                            location_coordinates: null,
                            location_verified: false,
                            location_address: null,
                            notes: 'Public holiday - no attendance required'
                        };
                        await attendance_model_1.default.create(attendanceData);
                        holidayProcessedCount++;
                    }
                }
                console.log(`${logPrefix} Holiday attendance processed: ${holidayProcessedCount} on holiday, ${holidayWorkingCount} on duty`);
                return { processed: holidayProcessedCount + holidayWorkingCount, absent: 0, holiday: holidayProcessedCount, holidayWorking: holidayWorkingCount };
            }
            let absentProcessedCount = 0;
            let leaveProcessedCount = 0;
            let skippedCount = 0;
            for (const userId of userIds) {
                const existingAttendance = await attendance_model_1.default.findByUserIdAndDate(userId, date);
                if (existingAttendance) {
                    console.log(`${logPrefix} Attendance already exists for user ${userId} on ${dateStr}, skipping`);
                    skippedCount++;
                    continue;
                }
                const leaveHistory = await leave_history_model_1.default.findByUserIdAndDateRange(userId, date, date);
                if (leaveHistory.length > 0) {
                    const activeApprovedLeave = leaveHistory.filter(leave => leave.status === 'approved');
                    if (activeApprovedLeave.length > 0) {
                        const attendanceData = {
                            user_id: userId,
                            date: date,
                            status: 'leave',
                            check_in_time: null,
                            check_out_time: null,
                            location_coordinates: null,
                            location_verified: false,
                            location_address: null,
                            notes: 'On approved leave'
                        };
                        await attendance_model_1.default.create(attendanceData);
                        leaveProcessedCount++;
                        console.log(`${logPrefix} Leave attendance processed for user ${userId}`);
                        continue;
                    }
                }
                const [leaveRequests] = await database_1.pool.execute(`SELECT * FROM leave_requests
           WHERE user_id = ?
             AND ? BETWEEN start_date AND end_date
             AND status = 'approved'
             AND (cancelled_by IS NULL OR cancelled_at IS NULL)`, [userId, date]);
                if (leaveRequests.length > 0) {
                    const attendanceData = {
                        user_id: userId,
                        date: date,
                        status: 'leave',
                        check_in_time: null,
                        check_out_time: null,
                        location_coordinates: null,
                        location_verified: false,
                        location_address: null,
                        notes: 'On approved leave'
                    };
                    await attendance_model_1.default.create(attendanceData);
                    leaveProcessedCount++;
                    console.log(`${logPrefix} Leave attendance processed for user ${userId} from leave_requests`);
                    continue;
                }
                const effectiveSchedule = await shift_scheduling_service_1.ShiftSchedulingService.getEffectiveScheduleForDate(userId, date);
                if (!effectiveSchedule || !effectiveSchedule.start_time || !effectiveSchedule.end_time) {
                    skippedCount++;
                    console.log(`${logPrefix} No shift assigned for user ${userId} on ${dateStr}, skipping`);
                    continue;
                }
                const attendanceData = {
                    user_id: userId,
                    date: date,
                    status: 'absent',
                    check_in_time: null,
                    check_out_time: null,
                    location_coordinates: null,
                    location_verified: false,
                    location_address: null,
                    notes: 'Scheduled shift but no check-in recorded'
                };
                await attendance_model_1.default.create(attendanceData);
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
        }
        catch (error) {
            console.error(`${logPrefix} Error processing attendance:`, error);
            throw error;
        }
    }
    static async processYesterdayAttendance() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        return await this.processAttendanceForDate(yesterday);
    }
    static async processTodayAttendance() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return await this.processAttendanceForDate(today);
    }
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
            if (this.processedDates.has(todayStr)) {
                console.log(`[Auto-Mark] Already processed for ${todayStr}, skipping`);
                return;
            }
            console.log(`[Auto-Mark] Checking for branches with auto-mark time: ${currentTime}`);
            const [branches] = await database_1.pool.execute(`
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
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const result = await this.processAttendanceForDate(today, branch.id);
                    await this.lockAttendanceForDate(branch.id, today, 1, 'Auto-mark absent');
                    console.log(`[Auto-Mark] Completed for ${branch.name}: ${result.absent} marked absent`);
                }
                catch (error) {
                    console.error(`[Auto-Mark] Error processing branch ${branch.name}:`, error);
                }
            }
            this.processedDates.add(todayStr);
            this.lastCheckTime = now;
        }
        catch (error) {
            console.error('[Auto-Mark] Error:', error);
        }
        finally {
            this.isRunning = false;
        }
    }
    static async lockAttendanceForDate(branchId, date, lockedBy, reason) {
        const dateStr = date.toISOString().split('T')[0];
        try {
            const [result] = await database_1.pool.execute(`
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
            await database_1.pool.execute(`
        UPDATE branches
        SET attendance_lock_date = LEAST(IFNULL(attendance_lock_date, ?), ?)
        WHERE id = ?
      `, [dateStr, dateStr, branchId]);
            await database_1.pool.execute(`
        INSERT INTO attendance_lock_log
          (branch_id, lock_date, locked_by, reason, attendance_count)
        VALUES (?, ?, ?, ?, ?)
      `, [branchId, dateStr, lockedBy, reason || 'Auto-lock', result.affectedRows]);
            console.log(`[Lock] Locked ${result.affectedRows} attendance records for branch ${branchId} on ${dateStr}`);
            return { lockedCount: result.affectedRows };
        }
        catch (error) {
            console.error(`[Lock] Error locking attendance for branch ${branchId}:`, error);
            throw error;
        }
    }
    static async start() {
        console.log('Starting Attendance Processor Worker...');
        try {
            await this.processYesterdayAttendance();
            console.log('Initial yesterday attendance processing completed');
        }
        catch (error) {
            console.error('Error in initial yesterday attendance processing:', error);
        }
        const todayStr = new Date().toISOString().split('T')[0];
        this.processedDates.add(todayStr);
        console.log('[Auto-Mark] Starting minute-by-minute check...');
        setInterval(async () => {
            try {
                await this.checkAndRunAutoMark();
            }
            catch (error) {
                console.error('[Auto-Mark] Error in check:', error);
            }
        }, 60 * 1000);
        console.log('[Auto-Mark] Scheduler started (checks every minute)');
        console.log('[Auto-Mark] Worker is now running. Configure branch auto-mark times in settings.');
    }
    static getStatus() {
        return {
            isRunning: this.isRunning,
            lastCheckTime: this.lastCheckTime,
            processedDates: Array.from(this.processedDates)
        };
    }
}
exports.default = AttendanceProcessorWorker;
//# sourceMappingURL=attendance-processor.worker.js.map