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
const router = (0, express_1.Router)();
router.post('/process', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:manage'), async (req, res) => {
    try {
        const { date, userId } = req.body;
        const currentUserId = req.currentUser?.id;
        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date is required'
            });
        }
        let targetUserId = currentUserId;
        if (userId) {
            const currentUserRole = req.currentUser?.role_id;
            if (currentUserRole !== 1 && currentUserRole !== 3) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to process attendance for other users'
                });
            }
            targetUserId = userId;
        }
        const existingAttendance = await attendance_model_1.default.findByUserIdAndDate(targetUserId, new Date(date));
        if (existingAttendance) {
            return res.status(409).json({
                success: false,
                message: 'Attendance already processed for this date'
            });
        }
        const isHoliday = await holiday_model_1.default.isHoliday(new Date(date));
        if (isHoliday) {
            const attendanceData = {
                user_id: targetUserId,
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
            return res.status(201).json({
                success: true,
                message: 'Holiday attendance processed successfully',
                data: { attendance: newAttendance }
            });
        }
        const leaveHistory = await leave_history_model_1.default.findByUserIdAndDateRange(targetUserId, new Date(date), new Date(date));
        if (leaveHistory.length > 0) {
            const attendanceData = {
                user_id: targetUserId,
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
            return res.status(201).json({
                success: true,
                message: 'Leave attendance processed successfully',
                data: { attendance: newAttendance }
            });
        }
        const shift = await shift_timing_model_1.default.findCurrentShiftForUser(targetUserId, new Date(date));
        if (!shift) {
            const attendanceData = {
                user_id: targetUserId,
                date: new Date(date),
                status: 'absent',
                check_in_time: null,
                check_out_time: null,
                location_coordinates: null,
                location_verified: false,
                location_address: null,
                notes: 'No shift assigned for this date'
            };
            const newAttendance = await attendance_model_1.default.create(attendanceData);
            return res.status(201).json({
                success: true,
                message: 'Absence recorded (no shift assigned)',
                data: { attendance: newAttendance }
            });
        }
        const attendanceData = {
            user_id: targetUserId,
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
        return res.status(201).json({
            success: true,
            message: 'Absence recorded (shift scheduled but no check-in)',
            data: { attendance: newAttendance }
        });
    }
    catch (error) {
        console.error('Process attendance error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/process-batch', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:manage'), async (req, res) => {
    try {
        const { date, userIds } = req.body;
        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date is required'
            });
        }
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User IDs array is required'
            });
        }
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
                message: 'Holiday attendance processed for all users',
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
                const attendanceData = {
                    user_id: userId,
                    date: new Date(date),
                    status: 'absent',
                    check_in_time: null,
                    check_out_time: null,
                    location_coordinates: null,
                    location_verified: false,
                    location_address: null,
                    notes: 'No shift assigned for this date'
                };
                const newAttendance = await attendance_model_1.default.create(attendanceData);
                results.push({
                    user_id: userId,
                    status: 'success',
                    attendance: newAttendance
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
            message: 'Batch attendance processing completed',
            data: { results }
        });
    }
    catch (error) {
        console.error('Batch process attendance error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=attendance-process.route.js.map