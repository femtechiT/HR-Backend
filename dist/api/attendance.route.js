"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const attendance_model_1 = __importDefault(require("../models/attendance.model"));
const shift_timing_model_1 = __importDefault(require("../models/shift-timing.model"));
const holiday_model_1 = __importDefault(require("../models/holiday.model"));
const leave_history_model_1 = __importDefault(require("../models/leave-history.model"));
const attendance_processor_worker_1 = __importDefault(require("../workers/attendance-processor.worker"));
const attendance_process_route_1 = __importDefault(require("./attendance-process.route"));
const attendance_settings_route_1 = __importDefault(require("./attendance-settings.route"));
const attendance_check_route_1 = __importDefault(require("./attendance-check.route"));
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.get('/history/user/:userId', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:read'), async (req, res) => {
    try {
        const userIdParam = req.params.userId;
        const userIdStr = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
        const userId = parseInt(userIdStr);
        const currentUserId = req.currentUser?.id;
        const currentUserRole = req.currentUser?.role_id;
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        if (currentUserId !== userId && currentUserRole !== 1 && currentUserRole !== 3) {
            return res.status(403).json({
                success: false,
                message: 'Cannot access other users\' attendance records'
            });
        }
        const attendanceRecords = await attendance_model_1.default.findByUserId(userId);
        return res.json({
            success: true,
            message: 'Attendance history retrieved successfully',
            data: { attendance: attendanceRecords }
        });
    }
    catch (error) {
        console.error('Get attendance history error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:read'), async (req, res) => {
    try {
        const { userId, date, startDate, endDate, status } = req.query;
        const currentUserId = req.currentUser?.id;
        const currentUserRole = req.currentUser?.role_id;
        let targetUserId = currentUserId;
        if (currentUserRole === 1 || currentUserRole === 3) {
            const userIdStr = Array.isArray(userId) ? userId[0] : typeof userId === 'string' ? userId : '';
            targetUserId = userId ? parseInt(userIdStr) : currentUserId;
        }
        else if (userId) {
            const userIdStr = Array.isArray(userId) ? userId[0] : typeof userId === 'string' ? userId : '';
            if (parseInt(userIdStr) !== currentUserId) {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot view other users\' attendance records'
                });
            }
        }
        let attendanceRecords;
        if (date) {
            const singleAttendance = await attendance_model_1.default.findByUserIdAndDate(targetUserId, new Date(date));
            attendanceRecords = singleAttendance ? [singleAttendance] : [];
        }
        else if (startDate && endDate) {
            attendanceRecords = await attendance_model_1.default.findByDateRange(targetUserId, new Date(startDate), new Date(endDate));
        }
        else {
            attendanceRecords = await attendance_model_1.default.findByUserId(targetUserId);
        }
        if (status) {
            attendanceRecords = attendanceRecords.filter(record => record.status === status);
        }
        return res.json({
            success: true,
            message: 'Attendance records retrieved successfully',
            data: { attendance: attendanceRecords }
        });
    }
    catch (error) {
        console.error('Get attendance error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/my', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { date, startDate, endDate, status } = req.query;
        const currentUserId = req.currentUser?.id;
        let attendanceRecords;
        if (date) {
            const singleAttendance = await attendance_model_1.default.findByUserIdAndDate(currentUserId, new Date(date));
            attendanceRecords = singleAttendance ? [singleAttendance] : [];
        }
        else if (startDate && endDate) {
            attendanceRecords = await attendance_model_1.default.findByDateRange(currentUserId, new Date(startDate), new Date(endDate));
        }
        else {
            attendanceRecords = await attendance_model_1.default.findByUserId(currentUserId);
        }
        if (status) {
            attendanceRecords = attendanceRecords.filter(record => record.status === status);
        }
        return res.json({
            success: true,
            message: 'Your attendance records retrieved successfully',
            data: { attendance: attendanceRecords }
        });
    }
    catch (error) {
        console.error('Get my attendance error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/summary', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:read'), async (req, res) => {
    try {
        const { userId, startDate, endDate } = req.query;
        const currentUserId = req.currentUser?.id;
        const currentUserRole = req.currentUser?.role_id;
        let targetUserId = currentUserId;
        if (currentUserRole === 1 || currentUserRole === 3) {
            const userIdStr = Array.isArray(userId) ? userId[0] : typeof userId === 'string' ? userId : '';
            targetUserId = userId ? parseInt(userIdStr) : currentUserId;
        }
        else if (userId) {
            const userIdStr = Array.isArray(userId) ? userId[0] : typeof userId === 'string' ? userId : '';
            if (parseInt(userIdStr) !== currentUserId) {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot view other users\' attendance summary'
                });
            }
        }
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'startDate and endDate are required for summary'
            });
        }
        const summary = await attendance_model_1.default.getAttendanceSummary(targetUserId, new Date(startDate), new Date(endDate));
        const percentage = await attendance_model_1.default.getAttendancePercentage(targetUserId, new Date(startDate), new Date(endDate));
        return res.json({
            success: true,
            message: 'Attendance summary retrieved successfully',
            data: {
                summary: {
                    ...summary,
                    attendance_percentage: percentage
                }
            }
        });
    }
    catch (error) {
        console.error('Get attendance summary error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/my/summary', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const currentUserId = req.currentUser?.id;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'startDate and endDate are required for summary'
            });
        }
        const summary = await attendance_model_1.default.getAttendanceSummary(currentUserId, new Date(startDate), new Date(endDate));
        const percentage = await attendance_model_1.default.getAttendancePercentage(currentUserId, new Date(startDate), new Date(endDate));
        return res.json({
            success: true,
            message: 'Your attendance summary retrieved successfully',
            data: {
                summary: {
                    ...summary,
                    attendance_percentage: percentage
                }
            }
        });
    }
    catch (error) {
        console.error('Get my attendance summary error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/reports/monthly', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:read'), async (req, res) => {
    try {
        const { year, month, userId } = req.query;
        const currentUserId = req.currentUser?.id;
        const currentUserRole = req.currentUser?.role_id;
        if (!year || !month) {
            return res.status(400).json({
                success: false,
                message: 'Year and month are required for monthly report'
            });
        }
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return res.status(400).json({
                success: false,
                message: 'Valid year and month (1-12) are required'
            });
        }
        let targetUserId = currentUserId;
        if (currentUserRole === 1 || currentUserRole === 3) {
            const userIdStr = Array.isArray(userId) ? userId[0] : typeof userId === 'string' ? userId : '';
            targetUserId = userId ? parseInt(userIdStr) : currentUserId;
        }
        else if (userId) {
            const userIdStr = Array.isArray(userId) ? userId[0] : typeof userId === 'string' ? userId : '';
            if (parseInt(userIdStr) !== currentUserId) {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot view other users\' attendance reports'
                });
            }
        }
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0);
        const attendanceRecords = await attendance_model_1.default.findByDateRange(targetUserId, startDate, endDate);
        const monthlySummary = await attendance_model_1.default.getAttendanceSummary(targetUserId, startDate, endDate);
        const monthlyPercentage = await attendance_model_1.default.getAttendancePercentage(targetUserId, startDate, endDate);
        return res.json({
            success: true,
            message: 'Monthly attendance report generated successfully',
            data: {
                report: {
                    year: yearNum,
                    month: monthNum,
                    user_id: targetUserId,
                    attendance_records: attendanceRecords,
                    summary: {
                        ...monthlySummary,
                        attendance_percentage: monthlyPercentage
                    }
                }
            }
        });
    }
    catch (error) {
        console.error('Get monthly attendance report error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/records', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:read'), async (req, res) => {
    try {
        const { page, limit, userId, date, startDate, endDate, status } = req.query;
        const currentPage = parseInt(page) || 1;
        const perPage = parseInt(limit) || 20;
        const offset = (currentPage - 1) * perPage;
        let query = `SELECT a.*, u.full_name, s.employee_id
                 FROM attendance a
                 LEFT JOIN staff s ON a.user_id = s.user_id
                 LEFT JOIN users u ON a.user_id = u.id
                 WHERE 1=1`;
        const params = [];
        if (userId) {
            const userIdNum = parseInt(userId);
            if (!isNaN(userIdNum)) {
                query += ' AND a.user_id = ?';
                params.push(userIdNum);
            }
        }
        if (date) {
            query += ' AND DATE(a.date) = ?';
            params.push(date);
        }
        else if (startDate && endDate) {
            query += ' AND a.date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }
        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }
        query += ' ORDER BY a.date DESC, a.created_at DESC LIMIT ? OFFSET ?';
        params.push(perPage, offset);
        console.log('Attendance records query:', query);
        console.log('Params:', params);
        let countQuery = `SELECT COUNT(*) as total FROM attendance a WHERE 1=1`;
        const countParams = [];
        if (userId) {
            const userIdNum = parseInt(userId);
            if (!isNaN(userIdNum)) {
                countQuery += ' AND a.user_id = ?';
                countParams.push(userIdNum);
            }
        }
        if (date) {
            countQuery += ' AND DATE(a.date) = ?';
            countParams.push(date);
        }
        else if (startDate && endDate) {
            countQuery += ' AND a.date BETWEEN ? AND ?';
            countParams.push(startDate, endDate);
        }
        if (status) {
            countQuery += ' AND a.status = ?';
            countParams.push(status);
        }
        const [countResult] = await database_1.pool.execute(countQuery, countParams);
        const totalRecords = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalRecords / perPage);
        const [rows] = await database_1.pool.execute(query, params);
        return res.json({
            success: true,
            message: 'Attendance records retrieved successfully',
            data: {
                attendance: rows,
                pagination: {
                    current_page: currentPage,
                    per_page: perPage,
                    total_records: totalRecords,
                    total_pages: totalPages
                }
            }
        });
    }
    catch (error) {
        console.error('Get attendance records error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sql: error.sql,
            sqlMessage: error.sqlMessage
        });
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});
router.get('/staff-data', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:read'), async (req, res) => {
    try {
        const { startDate, endDate, branchId, departmentId } = req.query;
        let query = `
      SELECT
        s.id,
        s.user_id,
        u.full_name,
        s.employee_id,
        d.name as department,
        b.name as branch,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN a.status = 'early' THEN 1 END) as early_count,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN a.status = 'leave' THEN 1 END) as leave_count,
        COUNT(CASE WHEN a.status = 'holiday' THEN 1 END) as holiday_count
      FROM staff s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN branches b ON s.branch_id = b.id
      LEFT JOIN attendance a ON s.user_id = a.user_id
      WHERE s.status = 'active' AND u.status = 'active'
    `;
        const params = [];
        if (branchId) {
            query += ' AND s.branch_id = ?';
            params.push(branchId);
        }
        if (departmentId) {
            query += ' AND s.department_id = ?';
            params.push(departmentId);
        }
        if (startDate && endDate) {
            query += ' AND a.date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }
        query += `
      GROUP BY s.id, s.user_id, u.full_name, s.employee_id, d.name, b.name
      ORDER BY u.full_name
    `;
        const [results] = await database_1.pool.execute(query, params);
        return res.json({
            success: true,
            message: 'Staff attendance data retrieved successfully',
            data: { staff: results, staffAttendanceData: results }
        });
    }
    catch (error) {
        console.error('Get staff attendance data error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/monthly-stats', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:read'), async (req, res) => {
    try {
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
            const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            const [rows] = await database_1.pool.execute(`SELECT
          COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
          COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
          COUNT(CASE WHEN status = 'late' THEN 1 END) as late,
          COUNT(CASE WHEN status = 'leave' THEN 1 END) as leaves
         FROM attendance
         WHERE date BETWEEN ? AND ?`, [startDate, endDate]);
            const monthName = date.toLocaleString('default', { month: 'short' });
            months.push({
                month: `${monthName} ${date.getFullYear()}`,
                ...(rows[0] || { present: 0, absent: 0, late: 0, leaves: 0 })
            });
        }
        return res.json({
            success: true,
            message: 'Monthly attendance statistics retrieved successfully',
            data: { monthlyStats: months }
        });
    }
    catch (error) {
        console.error('Get monthly stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:delete'), async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const attendanceId = parseInt(idStr);
        if (isNaN(attendanceId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid attendance ID'
            });
        }
        const existingAttendance = await attendance_model_1.default.findById(attendanceId);
        if (!existingAttendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }
        await attendance_model_1.default.delete(attendanceId);
        return res.json({
            success: true,
            message: 'Attendance record deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete attendance error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.put('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:update'), async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const attendanceId = parseInt(idStr);
        const { status, check_in_time, check_out_time, location_verified } = req.body;
        if (isNaN(attendanceId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid attendance ID'
            });
        }
        const existingAttendance = await attendance_model_1.default.findById(attendanceId);
        if (!existingAttendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }
        const updateData = {};
        if (status !== undefined)
            updateData.status = status;
        if (check_in_time !== undefined)
            updateData.check_in_time = check_in_time;
        if (check_out_time !== undefined)
            updateData.check_out_time = check_out_time;
        if (location_verified !== undefined)
            updateData.location_verified = location_verified;
        const updatedAttendance = await attendance_model_1.default.update(attendanceId, updateData);
        return res.json({
            success: true,
            message: 'Attendance record updated successfully',
            data: { attendance: updatedAttendance }
        });
    }
    catch (error) {
        console.error('Update attendance error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:read'), async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const attendanceId = parseInt(idStr);
        if (isNaN(attendanceId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid attendance ID'
            });
        }
        const attendanceRecord = await attendance_model_1.default.findById(attendanceId);
        if (!attendanceRecord) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }
        const currentUserId = req.currentUser?.id;
        const currentUserRole = req.currentUser?.role_id;
        if (attendanceRecord.user_id !== currentUserId && currentUserRole !== 1 && currentUserRole !== 3) {
            return res.status(403).json({
                success: false,
                message: 'Cannot access other users\' attendance records'
            });
        }
        return res.json({
            success: true,
            message: 'Attendance record retrieved successfully',
            data: { attendance: attendanceRecord }
        });
    }
    catch (error) {
        console.error('Get attendance by ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/records/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:read'), async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const attendanceId = parseInt(idStr);
        if (isNaN(attendanceId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid attendance ID'
            });
        }
        const attendanceRecord = await attendance_model_1.default.findById(attendanceId);
        if (!attendanceRecord) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }
        const currentUserId = req.currentUser?.id;
        const currentUserRole = req.currentUser?.role_id;
        if (attendanceRecord.user_id !== currentUserId && currentUserRole !== 1 && currentUserRole !== 3) {
            return res.status(403).json({
                success: false,
                message: 'Cannot access other users\' attendance records'
            });
        }
        return res.json({
            success: true,
            message: 'Attendance record retrieved successfully',
            data: { attendance: attendanceRecord }
        });
    }
    catch (error) {
        console.error('Get attendance record by ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/my/:id', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const attendanceId = parseInt(idStr);
        if (isNaN(attendanceId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid attendance ID'
            });
        }
        const attendanceRecord = await attendance_model_1.default.findById(attendanceId);
        if (!attendanceRecord) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }
        const currentUserId = req.currentUser?.id;
        if (attendanceRecord.user_id !== currentUserId) {
            return res.status(403).json({
                success: false,
                message: 'Cannot access other users\' attendance records'
            });
        }
        return res.json({
            success: true,
            message: 'Your attendance record retrieved successfully',
            data: { attendance: attendanceRecord }
        });
    }
    catch (error) {
        console.error('Get my attendance by ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/holidays', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:view'), async (req, res) => {
    try {
        const { branchId, date, startDate, endDate } = req.query;
        let holidays;
        if (startDate && endDate) {
            const startDateStr = Array.isArray(startDate) ? startDate[0] : startDate;
            const endDateStr = Array.isArray(endDate) ? endDate[0] : endDate;
            if (typeof startDateStr !== 'string' || typeof endDateStr !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'startDate and endDate must be valid date strings'
                });
            }
            const branchIdStr = Array.isArray(branchId) ? branchId[0] : branchId;
            const branchIdNum = branchIdStr ? parseInt(branchIdStr) : undefined;
            holidays = await holiday_model_1.default.getHolidaysInRange(new Date(startDateStr), new Date(endDateStr), branchIdNum);
        }
        else if (branchId) {
            const branchIdStr = Array.isArray(branchId) ? branchId[0] : branchId;
            const branchIdNum = parseInt(branchIdStr);
            if (isNaN(branchIdNum)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid branch ID'
                });
            }
            holidays = await holiday_model_1.default.findByBranch(branchIdNum);
        }
        else if (date) {
            const dateStr = Array.isArray(date) ? date[0] : date;
            if (typeof dateStr !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'date must be a valid date string'
                });
            }
            holidays = await holiday_model_1.default.findByDate(new Date(dateStr));
        }
        else {
            holidays = await holiday_model_1.default.findAll();
        }
        return res.json({
            success: true,
            message: 'Holidays retrieved successfully',
            data: { holidays }
        });
    }
    catch (error) {
        console.error('Get holidays error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/holidays/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:view'), async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const holidayId = parseInt(idStr);
        if (isNaN(holidayId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid holiday ID'
            });
        }
        const holiday = await holiday_model_1.default.findById(holidayId);
        if (!holiday) {
            return res.status(404).json({
                success: false,
                message: 'Holiday not found'
            });
        }
        return res.json({
            success: true,
            message: 'Holiday retrieved successfully',
            data: { holiday }
        });
    }
    catch (error) {
        console.error('Get holiday error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/process-daily', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:manage'), async (req, res) => {
    try {
        const { date } = req.body;
        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date is required'
            });
        }
        const [staffResults] = await database_1.pool.execute(`SELECT s.user_id FROM staff s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.status = 'active' AND u.status = 'active'`);
        const userIds = staffResults.map((staff) => staff.user_id);
        const isHoliday = await holiday_model_1.default.isHoliday(new Date(date));
        if (isHoliday) {
            const results = [];
            for (const userId of userIds) {
                const existingAttendance = await attendance_model_1.default.findByUserIdAndDate(userId, new Date(date));
                if (existingAttendance) {
                    results.push({
                        user_id: userId,
                        status: 'skipped',
                        message: 'Attendance already exists for this date'
                    });
                    continue;
                }
                const attendanceData = {
                    user_id: userId,
                    date: new Date(date),
                    status: 'holiday',
                    check_in_time: null,
                    check_out_time: null,
                    location_coordinates: null,
                    location_verified: false,
                    location_address: null,
                    notes: 'Public holiday - no attendance required'
                };
                const newAttendance = await attendance_model_1.default.create(attendanceData);
                results.push({
                    user_id: userId,
                    status: 'success',
                    attendance: newAttendance
                });
            }
            return res.status(201).json({
                success: true,
                message: 'Holiday attendance processed for all active staff',
                data: { results }
            });
        }
        const results = [];
        for (const userId of userIds) {
            const existingAttendance = await attendance_model_1.default.findByUserIdAndDate(userId, new Date(date));
            if (existingAttendance) {
                results.push({
                    user_id: userId,
                    status: 'skipped',
                    message: 'Attendance already exists for this date'
                });
                continue;
            }
            const leaveHistory = await leave_history_model_1.default.findByUserIdAndDateRange(userId, new Date(date), new Date(date));
            if (leaveHistory.length > 0) {
                const attendanceData = {
                    user_id: userId,
                    date: new Date(date),
                    status: 'leave',
                    check_in_time: null,
                    check_out_time: null,
                    location_coordinates: null,
                    location_verified: false,
                    location_address: null,
                    notes: 'On approved leave'
                };
                const newAttendance = await attendance_model_1.default.create(attendanceData);
                results.push({
                    user_id: userId,
                    status: 'success',
                    attendance: newAttendance
                });
                continue;
            }
            const shift = await shift_timing_model_1.default.findCurrentShiftForUser(userId, new Date(date));
            if (!shift) {
                results.push({
                    user_id: userId,
                    status: 'skipped',
                    message: 'No shift assigned for this date'
                });
                continue;
            }
            const attendanceData = {
                user_id: userId,
                date: new Date(date),
                status: 'absent',
                check_in_time: null,
                check_out_time: null,
                location_coordinates: null,
                location_verified: false,
                location_address: null,
                notes: 'Scheduled shift but no check-in recorded'
            };
            const newAttendance = await attendance_model_1.default.create(attendanceData);
            results.push({
                user_id: userId,
                status: 'success',
                attendance: newAttendance
            });
        }
        return res.status(201).json({
            success: true,
            message: 'Daily attendance processing completed for all active staff',
            data: { results }
        });
    }
    catch (error) {
        console.error('Process daily attendance error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/process-range', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:manage'), async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'startDate and endDate are required'
            });
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dates = [];
        for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d));
        }
        let totalProcessed = 0;
        const results = [];
        for (const date of dates) {
            try {
                await attendance_processor_worker_1.default.processAttendanceForDate(date);
                totalProcessed++;
                results.push({
                    date: date.toISOString().split('T')[0],
                    success: true
                });
            }
            catch (error) {
                results.push({
                    date: date.toISOString().split('T')[0],
                    success: false,
                    error: error.message
                });
            }
        }
        return res.json({
            success: true,
            message: `Processed attendance for ${totalProcessed} days`,
            data: {
                daysProcessed: totalProcessed,
                dateRange: { startDate, endDate },
                results
            }
        });
    }
    catch (error) {
        console.error('Process range error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to process attendance'
        });
    }
});
router.use('/process', attendance_process_route_1.default);
router.use('/settings', attendance_settings_route_1.default);
router.use(attendance_check_route_1.default);
exports.default = router;
//# sourceMappingURL=attendance.route.js.map