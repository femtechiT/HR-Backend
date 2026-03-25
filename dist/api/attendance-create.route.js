"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const attendance_model_1 = __importDefault(require("../models/attendance.model"));
const shift_timing_model_1 = __importDefault(require("../models/shift-timing.model"));
const shift_scheduling_service_1 = require("../services/shift-scheduling.service");
const holiday_model_1 = __importDefault(require("../models/holiday.model"));
const attendance_location_model_1 = __importDefault(require("../models/attendance-location.model"));
const branch_model_1 = __importDefault(require("../models/branch.model"));
const staff_model_1 = __importDefault(require("../models/staff.model"));
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.post('/manual', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { date, check_in_time, check_out_time, status, location_coordinates, location_address } = req.body;
        const userId = req.currentUser?.id;
        const requestingUserId = req.body.user_id || userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: No user information'
            });
        }
        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date is required'
            });
        }
        const existingAttendance = await attendance_model_1.default.findByUserIdAndDate(requestingUserId, new Date(date));
        if (existingAttendance) {
            return res.status(409).json({
                success: false,
                message: 'Attendance already marked for this date'
            });
        }
        const isHoliday = await holiday_model_1.default.isHoliday(new Date(date));
        if (isHoliday) {
            const attendanceData = {
                user_id: requestingUserId,
                date: new Date(date),
                status: 'holiday',
                check_in_time: null,
                check_out_time: null,
                location_coordinates: null,
                location_verified: false,
                location_address: null,
                notes: 'Holiday - no attendance required'
            };
            const newAttendance = await attendance_model_1.default.create(attendanceData);
            return res.status(201).json({
                success: true,
                message: 'Holiday attendance recorded successfully',
                data: { attendance: newAttendance }
            });
        }
        const [leaveHistoryRows] = await database_1.pool.execute(`SELECT id, start_date, end_date FROM leave_history WHERE user_id = ? AND ? BETWEEN start_date AND end_date`, [requestingUserId, new Date(date)]);
        if (leaveHistoryRows.length > 0) {
            const attendanceData = {
                user_id: requestingUserId,
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
                message: 'Leave attendance recorded successfully',
                data: { attendance: newAttendance }
            });
        }
        const staffRecord = await staff_model_1.default.findByUserId(requestingUserId);
        if (!staffRecord) {
            return res.status(404).json({
                success: false,
                message: 'Staff record not found for user'
            });
        }
        const branchId = staffRecord.branch_id;
        if (!branchId) {
            return res.status(400).json({
                success: false,
                message: 'Staff record does not have a branch assigned'
            });
        }
        const branch = await branch_model_1.default.findById(branchId);
        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found for staff'
            });
        }
        let gracePeriodMinutes = 0;
        try {
            const [branchSettings] = await database_1.pool.execute(`SELECT * FROM attendance_settings WHERE branch_id = ?`, [branchId]);
            if (branchSettings && branchSettings.length > 0) {
                gracePeriodMinutes = branchSettings[0].grace_period_minutes || 0;
            }
        }
        catch (error) {
            console.log('Using default attendance settings (table may not exist)');
        }
        let locationVerified = false;
        let attendanceStatus = status || 'absent';
        if (branch.attendance_mode === 'branch_based' && location_coordinates) {
            if (branch.location_coordinates) {
                const branchCoords = branch.location_coordinates.match(/POINT\(([-+]?\d*\.\d+) ([-+]?\d*\.\d+)\)/);
                if (branchCoords) {
                    const branchLng = parseFloat(branchCoords[1]);
                    const branchLat = parseFloat(branchCoords[2]);
                    const userCoords = location_coordinates.match(/POINT\(([-+]?\d*\.\d+) ([-+]?\d*\.\d+)\)/);
                    if (userCoords) {
                        const userLng = parseFloat(userCoords[1]);
                        const userLat = parseFloat(userCoords[2]);
                        const distance = Math.sqrt(Math.pow(userLng - branchLng, 2) + Math.pow(userLat - branchLat, 2)) * 111000;
                        const radius = branch.location_radius_meters || 100;
                        if (distance <= radius) {
                            locationVerified = true;
                        }
                    }
                }
            }
        }
        else if (branch.attendance_mode === 'multiple_locations' && location_coordinates) {
            const nearbyLocations = await attendance_location_model_1.default.getLocationsNearby(parseFloat(location_coordinates.latitude), parseFloat(location_coordinates.longitude), branch.location_radius_meters || 100);
            if (nearbyLocations.length > 0) {
                locationVerified = true;
            }
        }
        if (!status) {
            const shift = await shift_timing_model_1.default.findCurrentShiftForUser(requestingUserId, new Date(date));
            if (shift && check_in_time) {
                const shiftStartTime = new Date(`1970-01-01T${shift.start_time}`);
                const checkInTime = new Date(`1970-01-01T${check_in_time}`);
                if (checkInTime.getTime() > shiftStartTime.getTime()) {
                    attendanceStatus = 'late';
                }
                else {
                    attendanceStatus = 'present';
                }
            }
            else if (check_in_time) {
                attendanceStatus = 'present';
            }
        }
        const attendanceData = {
            user_id: requestingUserId,
            date: new Date(date),
            status: attendanceStatus,
            check_in_time: check_in_time ? new Date(`1970-01-01T${check_in_time}`) : null,
            check_out_time: check_out_time ? new Date(`1970-01-01T${check_out_time}`) : null,
            location_coordinates: location_coordinates ?
                `POINT(${location_coordinates.longitude} ${location_coordinates.latitude})` : null,
            location_verified: locationVerified,
            location_address: location_address || null,
            notes: null
        };
        const newAttendance = await attendance_model_1.default.create(attendanceData);
        try {
            await shift_scheduling_service_1.ShiftSchedulingService.updateAttendanceWithScheduleInfo(newAttendance.id, requestingUserId, new Date(date), gracePeriodMinutes);
        }
        catch (shiftError) {
            console.error('Failed to update attendance with shift info:', shiftError);
        }
        return res.status(201).json({
            success: true,
            message: 'Attendance marked successfully',
            data: { attendance: newAttendance }
        });
    }
    catch (error) {
        console.error('Mark attendance error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=attendance-create.route.js.map