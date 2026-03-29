"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyTodayShift = exports.getTeamShifts = exports.getMyUpcomingShifts = exports.getMyShifts = void 0;
const database_1 = require("../config/database");
const shift_scheduling_service_1 = require("../services/shift-scheduling.service");
const getMyShifts = async (req, res) => {
    try {
        const userId = req.currentUser?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - User ID not found'
            });
        }
        const { startDate, endDate, status } = req.query;
        let query = `
      SELECT
        esa.id,
        esa.user_id,
        esa.shift_template_id,
        esa.effective_from,
        esa.effective_to,
        esa.assignment_type,
        esa.status,
        esa.recurrence_pattern,
        esa.recurrence_days,
        esa.recurrence_day_of_week,
        st.name as template_name,
        st.start_time,
        st.end_time,
        st.break_duration_minutes,
        u.full_name as user_name,
        u.email as user_email,
        s.department,
        s.branch_id
      FROM employee_shift_assignments esa
      LEFT JOIN shift_templates st ON esa.shift_template_id = st.id
      LEFT JOIN users u ON esa.user_id = u.id
      LEFT JOIN staff s ON esa.user_id = s.user_id
      WHERE esa.user_id = ?
    `;
        const params = [userId];
        if (status && status !== 'all') {
            query += ' AND esa.status = ?';
            params.push(status);
        }
        if (startDate) {
            query += ' AND esa.effective_from >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND (esa.effective_to IS NULL OR esa.effective_to <= ?)';
            params.push(endDate);
        }
        query += ' ORDER BY esa.effective_from DESC, esa.created_at DESC';
        const [rows] = await database_1.pool.execute(query, params);
        const exceptionsQuery = `
      SELECT 
        se.id,
        se.exception_date,
        se.exception_type,
        se.new_start_time,
        se.new_end_time,
        se.reason,
        se.status as exception_status
      FROM shift_exceptions se
      WHERE se.user_id = ?
      AND se.status IN ('active', 'approved')
      ORDER BY se.exception_date DESC
    `;
        const [exceptions] = await database_1.pool.execute(exceptionsQuery, [userId]);
        const formattedAssignments = rows.map((assignment) => {
            let recurrenceDaysArray = [];
            if (assignment.recurrence_days) {
                try {
                    recurrenceDaysArray = JSON.parse(assignment.recurrence_days);
                }
                catch (e) {
                    recurrenceDaysArray = assignment.recurrence_day_of_week ? [assignment.recurrence_day_of_week] : [];
                }
            }
            const shiftType = getShiftTypeFromTimes(assignment.start_time, assignment.end_time);
            return {
                id: assignment.id,
                templateName: assignment.template_name || 'Custom Shift',
                startTime: assignment.start_time,
                endTime: assignment.end_time,
                breakDuration: assignment.break_duration_minutes,
                effectiveFrom: assignment.effective_from,
                effectiveTo: assignment.effective_to,
                assignmentType: assignment.assignment_type,
                status: assignment.status,
                recurrencePattern: assignment.recurrence_pattern,
                recurrenceDays: recurrenceDaysArray,
                shiftType: shiftType,
                department: assignment.department,
                branchId: assignment.branch_id
            };
        });
        return res.status(200).json({
            success: true,
            message: 'Shift assignments retrieved successfully',
            data: {
                assignments: formattedAssignments,
                exceptions: exceptions,
                total: formattedAssignments.length,
                activeCount: formattedAssignments.filter((a) => a.status === 'active').length
            }
        });
    }
    catch (error) {
        console.error('Error fetching my shifts:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching shift assignments'
        });
    }
};
exports.getMyShifts = getMyShifts;
const getMyUpcomingShifts = async (req, res) => {
    try {
        const userId = req.currentUser?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - User ID not found'
            });
        }
        const { days = 30 } = req.query;
        const numDays = parseInt(days);
        const assignmentsQuery = `
      SELECT 
        esa.id,
        esa.shift_template_id,
        esa.effective_from,
        esa.effective_to,
        esa.recurrence_pattern,
        esa.recurrence_days,
        esa.recurrence_day_of_week,
        st.name as template_name,
        st.start_time,
        st.end_time,
        st.break_duration_minutes
      FROM employee_shift_assignments esa
      LEFT JOIN shift_templates st ON esa.shift_template_id = st.id
      WHERE esa.user_id = ? AND esa.status = 'active'
      AND esa.effective_from <= CURDATE()
      AND (esa.effective_to IS NULL OR esa.effective_to >= CURDATE())
    `;
        const [assignments] = await database_1.pool.execute(assignmentsQuery, [userId]);
        const exceptionsQuery = `
      SELECT 
        exception_date,
        exception_type,
        new_start_time,
        new_end_time
      FROM shift_exceptions
      WHERE user_id = ?
      AND exception_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
      AND status IN ('active', 'approved')
    `;
        const [exceptions] = await database_1.pool.execute(exceptionsQuery, [userId, numDays]);
        const exceptionMap = new Map();
        exceptions.forEach((ex) => {
            const dateKey = ex.exception_date.toISOString().split('T')[0];
            exceptionMap.set(dateKey, ex);
        });
        const upcomingShifts = [];
        const today = new Date();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        for (let i = 0; i < numDays; i++) {
            const currentDate = new Date(today);
            currentDate.setDate(currentDate.getDate() + i);
            const dateKey = currentDate.toISOString().split('T')[0];
            const dayName = dayNames[currentDate.getDay()];
            const exception = exceptionMap.get(dateKey);
            if (exception) {
                upcomingShifts.push({
                    date: dateKey,
                    dayOfWeek: dayName,
                    startTime: exception.new_start_time,
                    endTime: exception.new_end_time,
                    templateName: `Exception: ${exception.exception_type}`,
                    isException: true,
                    exceptionType: exception.exception_type
                });
            }
            else {
                assignments.forEach((assignment) => {
                    const shouldWork = checkIfWorkingDay(assignment, dayName, currentDate);
                    if (shouldWork) {
                        upcomingShifts.push({
                            date: dateKey,
                            dayOfWeek: dayName,
                            startTime: assignment.start_time,
                            endTime: assignment.end_time,
                            breakDuration: assignment.break_duration_minutes,
                            templateName: assignment.template_name,
                            isException: false
                        });
                    }
                });
            }
        }
        return res.status(200).json({
            success: true,
            message: 'Upcoming shifts retrieved successfully',
            data: {
                shifts: upcomingShifts,
                days: numDays
            }
        });
    }
    catch (error) {
        console.error('Error fetching upcoming shifts:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching upcoming shifts'
        });
    }
};
exports.getMyUpcomingShifts = getMyUpcomingShifts;
const getTeamShifts = async (req, res) => {
    try {
        const userId = req.currentUser?.id;
        const { department, branchId, startDate, endDate } = req.query;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - User ID not found'
            });
        }
        const userQuery = `
      SELECT department, branch_id, role_id 
      FROM staff s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ?
    `;
        const [userRows] = await database_1.pool.execute(userQuery, [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User staff record not found'
            });
        }
        const user = userRows[0];
        let teamFilter = 'WHERE 1=1';
        const params = [];
        if (user.role_id >= 3) {
            if (department) {
                teamFilter += ' AND s.department = ?';
                params.push(department);
            }
            else if (user.department) {
                teamFilter += ' AND s.department = ?';
                params.push(user.department);
            }
        }
        if (branchId) {
            teamFilter += ' AND s.branch_id = ?';
            params.push(branchId);
        }
        const query = `
      SELECT
        esa.id,
        esa.user_id,
        esa.shift_template_id,
        esa.effective_from,
        esa.effective_to,
        esa.assignment_type,
        esa.status,
        st.name as template_name,
        st.start_time,
        st.end_time,
        u.full_name as user_name,
        u.email as user_email,
        s.department,
        s.branch_id
      FROM employee_shift_assignments esa
      LEFT JOIN shift_templates st ON esa.shift_template_id = st.id
      LEFT JOIN users u ON esa.user_id = u.id
      LEFT JOIN staff s ON esa.user_id = s.user_id
      ${teamFilter}
      AND esa.status = 'active'
      ORDER BY s.department, u.full_name, esa.effective_from DESC
    `;
        const [rows] = await database_1.pool.execute(query, params);
        const shiftsByDepartment = {};
        rows.forEach((row) => {
            if (!shiftsByDepartment[row.department]) {
                shiftsByDepartment[row.department] = [];
            }
            shiftsByDepartment[row.department].push({
                id: row.id,
                userId: row.user_id,
                userName: row.user_name,
                userEmail: row.user_email,
                templateName: row.template_name,
                startTime: row.start_time,
                endTime: row.end_time,
                effectiveFrom: row.effective_from,
                effectiveTo: row.effective_to,
                assignmentType: row.assignment_type,
                status: row.status,
                department: row.department,
                branchId: row.branch_id
            });
        });
        return res.status(200).json({
            success: true,
            message: 'Team shifts retrieved successfully',
            data: {
                shiftsByDepartment,
                totalMembers: rows.length
            }
        });
    }
    catch (error) {
        console.error('Error fetching team shifts:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching team shifts'
        });
    }
};
exports.getTeamShifts = getTeamShifts;
function getShiftTypeFromTimes(startTime, endTime) {
    if (!startTime || !endTime)
        return 'Custom';
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    if (startHour >= 5 && startHour < 12)
        return 'Morning';
    if (startHour >= 12 && startHour < 17)
        return 'Afternoon';
    if (startHour >= 17 || startHour < 5)
        return 'Night';
    return 'Custom';
}
function checkIfWorkingDay(assignment, dayName, currentDate) {
    if (!assignment.recurrence_pattern || assignment.recurrence_pattern === 'none') {
        const effectiveFrom = new Date(assignment.effective_from);
        const effectiveTo = assignment.effective_to ? new Date(assignment.effective_to) : null;
        return currentDate >= effectiveFrom && (!effectiveTo || currentDate <= effectiveTo);
    }
    if (assignment.recurrence_pattern === 'weekly') {
        let recurrenceDays = [];
        if (assignment.recurrence_days) {
            try {
                recurrenceDays = JSON.parse(assignment.recurrence_days);
            }
            catch (e) {
                recurrenceDays = assignment.recurrence_day_of_week ? [assignment.recurrence_day_of_week] : [];
            }
        }
        else if (assignment.recurrence_day_of_week) {
            recurrenceDays = [assignment.recurrence_day_of_week];
        }
        return recurrenceDays.includes(dayName.toLowerCase());
    }
    const effectiveFrom = new Date(assignment.effective_from);
    const effectiveTo = assignment.effective_to ? new Date(assignment.effective_to) : null;
    return currentDate >= effectiveFrom && (!effectiveTo || currentDate <= effectiveTo);
}
const getMyTodayShift = async (req, res) => {
    try {
        const userId = req.currentUser?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const today = new Date();
        const schedule = await shift_scheduling_service_1.ShiftSchedulingService.getEffectiveScheduleForDate(userId, today);
        return res.status(200).json({
            success: true,
            data: {
                schedule,
                date: today.toISOString().split('T')[0]
            }
        });
    }
    catch (error) {
        console.error('Error fetching today\'s shift:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getMyTodayShift = getMyTodayShift;
//# sourceMappingURL=my-shifts.controller.js.map