"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftSchedulingService = void 0;
const database_1 = require("../config/database");
class ShiftSchedulingService {
    static async getEffectiveScheduleForDate(userId, date) {
        try {
            const dateStr = date.toISOString().split('T')[0];
            const [exceptions] = await database_1.pool.execute(`SELECT se.new_start_time, se.new_end_time, se.new_break_duration_minutes, se.exception_type, se.reason
         FROM shift_exceptions se
         WHERE se.user_id = ? AND se.exception_date = ? AND se.status = 'active'`, [userId, dateStr]);
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
            const [holidays] = await database_1.pool.execute(`SELECT * FROM holidays WHERE date = ? AND (branch_id IS NULL OR branch_id = (SELECT branch_id FROM staff WHERE user_id = ?))`, [dateStr, userId]);
            if (holidays.length > 0) {
                return {
                    start_time: null,
                    end_time: null,
                    break_duration_minutes: 0,
                    schedule_type: 'holiday',
                    schedule_note: `Holiday: ${holidays[0].holiday_name}`
                };
            }
            const [assignments] = await database_1.pool.execute(`SELECT esa.custom_start_time, esa.custom_end_time, esa.custom_break_duration_minutes,
                st.start_time as template_start_time, st.end_time as template_end_time, 
                st.break_duration_minutes as template_break_duration_minutes,
                st.recurrence_pattern, st.recurrence_days
         FROM employee_shift_assignments esa
         LEFT JOIN shift_templates st ON esa.shift_template_id = st.id
         WHERE esa.user_id = ? 
           AND esa.status = 'active'
           AND ? BETWEEN esa.effective_from AND COALESCE(esa.effective_to, '9999-12-31')`, [userId, dateStr]);
            if (assignments.length > 0) {
                const dayOfWeek = date.getDay();
                const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const dayName = dayNames[dayOfWeek];
                for (const assignment of assignments) {
                    if (assignment.recurrence_pattern) {
                        if (assignment.recurrence_days) {
                            const recurrenceDays = JSON.parse(assignment.recurrence_days);
                            if (!recurrenceDays.includes(dayName) && !recurrenceDays.includes(dayOfWeek)) {
                                continue;
                            }
                        }
                    }
                    return {
                        start_time: assignment.custom_start_time || assignment.template_start_time,
                        end_time: assignment.custom_end_time || assignment.template_end_time,
                        break_duration_minutes: assignment.custom_break_duration_minutes || assignment.template_break_duration_minutes || 0,
                        schedule_type: assignment.recurrence_pattern || 'standard',
                        schedule_note: 'Standard schedule'
                    };
                }
                return {
                    start_time: null,
                    end_time: null,
                    break_duration_minutes: 0,
                    schedule_type: 'non_working_day',
                    schedule_note: 'Non-working day based on recurrence patterns'
                };
            }
            const [userBranch] = await database_1.pool.execute(`SELECT branch_id FROM staff WHERE user_id = ?`, [userId]);
            if (userBranch.length > 0 && userBranch[0].branch_id) {
                const branchId = userBranch[0].branch_id;
                const dayOfWeek = date.getDay();
                const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const dayName = dayNames[dayOfWeek];
                const [branchHours] = await database_1.pool.execute(`SELECT start_time, end_time, break_duration_minutes, is_working_day
           FROM branch_working_days
           WHERE branch_id = ? AND day_of_week = ?`, [branchId, dayName]);
                if (branchHours.length > 0 && branchHours[0].is_working_day) {
                    return {
                        start_time: branchHours[0].start_time,
                        end_time: branchHours[0].end_time,
                        break_duration_minutes: branchHours[0].break_duration_minutes || 0,
                        schedule_type: 'branch_default',
                        schedule_note: `Standard ${dayName} hours for branch`
                    };
                }
            }
            return null;
        }
        catch (error) {
            console.error('Error getting effective schedule:', error);
            throw error;
        }
    }
    static async calculateAttendanceMetrics(userId, date, checkInTime, checkOutTime, gracePeriodMinutes = 0) {
        try {
            const schedule = await this.getEffectiveScheduleForDate(userId, date);
            if (!schedule || !schedule.start_time || !schedule.end_time) {
                return {
                    is_late: null,
                    is_early_departure: null,
                    actual_working_hours: null,
                    scheduled_start_time: null,
                    scheduled_end_time: null,
                    scheduled_break_duration_minutes: 0,
                    status: null
                };
            }
            const [schedStartHours, schedStartMinutes] = schedule.start_time.split(':').map(Number);
            const [schedEndHours, schedEndMinutes] = schedule.end_time.split(':').map(Number);
            const scheduledStartTime = new Date(date);
            scheduledStartTime.setHours(schedStartHours, schedStartMinutes, 0, 0);
            const scheduledEndTime = new Date(date);
            scheduledEndTime.setHours(schedEndHours, schedEndMinutes, 0, 0);
            let isLate = false;
            let status = 'present';
            if (checkInTime) {
                const [checkInHours, checkInMinutes] = checkInTime.split(':').map(Number);
                const checkInDateTime = new Date(date);
                checkInDateTime.setHours(checkInHours, checkInMinutes, 0, 0);
                const gracePeriodMs = gracePeriodMinutes * 60 * 1000;
                const adjustedStartTime = new Date(scheduledStartTime.getTime() + gracePeriodMs);
                isLate = checkInDateTime.getTime() > adjustedStartTime.getTime();
                status = isLate ? 'late' : 'present';
            }
            let isEarlyDeparture = false;
            if (checkOutTime) {
                const [checkOutHours, checkOutMinutes] = checkOutTime.split(':').map(Number);
                const checkOutDateTime = new Date(date);
                checkOutDateTime.setHours(checkOutHours, checkOutMinutes, 0, 0);
                isEarlyDeparture = checkOutDateTime.getTime() < scheduledEndTime.getTime();
            }
            let actualWorkingHours = null;
            if (checkInTime && checkOutTime) {
                const [checkInHours, checkInMinutes] = checkInTime.split(':').map(Number);
                const [checkOutHours, checkOutMinutes] = checkOutTime.split(':').map(Number);
                const checkInDateTime = new Date(date);
                checkInDateTime.setHours(checkInHours, checkInMinutes, 0, 0);
                const checkOutDateTime = new Date(date);
                checkOutDateTime.setHours(checkOutHours, checkOutMinutes, 0, 0);
                const diffMs = checkOutDateTime.getTime() - checkInDateTime.getTime();
                let diffHours = diffMs / (1000 * 60 * 60);
                diffHours -= (schedule.break_duration_minutes / 60);
                actualWorkingHours = Math.max(0, parseFloat(diffHours.toFixed(2)));
            }
            return {
                is_late: isLate,
                is_early_departure: isEarlyDeparture,
                actual_working_hours: actualWorkingHours,
                scheduled_start_time: schedule.start_time,
                scheduled_end_time: schedule.end_time,
                scheduled_break_duration_minutes: schedule.break_duration_minutes,
                status
            };
        }
        catch (error) {
            console.error('Error calculating attendance metrics:', error);
            throw error;
        }
    }
    static async updateAttendanceWithScheduleInfo(attendanceId, userId, date, gracePeriodMinutes = 0) {
        try {
            const [attendanceRecords] = await database_1.pool.execute(`SELECT check_in_time, check_out_time FROM attendance WHERE id = ?`, [attendanceId]);
            if (attendanceRecords.length === 0) {
                throw new Error('Attendance record not found');
            }
            const record = attendanceRecords[0];
            const checkInTime = record.check_in_time;
            const checkOutTime = record.check_out_time;
            const metrics = await this.calculateAttendanceMetrics(userId, date, checkInTime, checkOutTime, gracePeriodMinutes);
            const [result] = await database_1.pool.execute(`UPDATE attendance
         SET scheduled_start_time = ?, scheduled_end_time = ?,
             scheduled_break_duration_minutes = ?, is_late = ?,
             is_early_departure = ?, actual_working_hours = ?,
             status = COALESCE(?, status)
         WHERE id = ?`, [
                metrics.scheduled_start_time,
                metrics.scheduled_end_time,
                metrics.scheduled_break_duration_minutes,
                metrics.is_late,
                metrics.is_early_departure,
                metrics.actual_working_hours,
                metrics.status,
                attendanceId
            ]);
            return result.affectedRows > 0;
        }
        catch (error) {
            console.error('Error updating attendance with schedule info:', error);
            throw error;
        }
    }
    static async processAttendanceForDate(userId, date) {
        try {
            const [attendanceRecords] = await database_1.pool.execute(`SELECT id, check_in_time, check_out_time
         FROM attendance
         WHERE user_id = ? AND date = ?`, [userId, date.toISOString().split('T')[0]]);
            if (attendanceRecords.length > 0) {
                const record = attendanceRecords[0];
                await this.updateAttendanceWithScheduleInfo(record.id, userId, date, 0);
            }
        }
        catch (error) {
            console.error('Error processing attendance for date:', error);
            throw error;
        }
    }
}
exports.ShiftSchedulingService = ShiftSchedulingService;
//# sourceMappingURL=shift-scheduling.service.js.map