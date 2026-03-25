"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const attendance_model_1 = __importStar(require("../models/attendance.model"));
const shift_scheduling_service_1 = require("../services/shift-scheduling.service");
const holiday_model_1 = __importDefault(require("../models/holiday.model"));
const branch_model_1 = __importDefault(require("../models/branch.model"));
const staff_model_1 = __importDefault(require("../models/staff.model"));
const attendance_location_model_1 = __importDefault(require("../models/attendance-location.model"));
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.post('/check-in', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { date, check_in_time, location_coordinates, location_address, status: providedStatus } = req.body;
        const userId = req.currentUser?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: No user information'
            });
        }
        if (!date || !check_in_time) {
            return res.status(400).json({
                success: false,
                message: 'Date and check_in_time are required'
            });
        }
        let attendanceRecord = await attendance_model_1.default.findByUserIdAndDate(userId, new Date(date));
        if (attendanceRecord) {
            if (attendanceRecord.is_locked) {
                return res.status(403).json({
                    success: false,
                    message: 'Attendance for this date has been locked by your branch. You cannot check in after the auto-mark time has passed.',
                    data: { locked: true, locked_at: attendanceRecord.locked_at }
                });
            }
            if (attendanceRecord.check_in_time) {
                return res.status(409).json({
                    success: false,
                    message: 'You have already checked in today. Multiple check-ins are not allowed.'
                });
            }
            let locationVerified = false;
            const staffRecord = await staff_model_1.default.findByUserId(userId);
            if (!staffRecord) {
                return res.status(404).json({ success: false, message: 'Staff record not found' });
            }
            const branchId = staffRecord.branch_id;
            if (!branchId) {
                return res.status(400).json({ success: false, message: 'No branch assigned' });
            }
            const branch = await branch_model_1.default.findById(branchId);
            if (!branch) {
                return res.status(404).json({ success: false, message: 'Branch not found' });
            }
            let settings = {
                require_check_in: true,
                require_check_out: true,
                grace_period_minutes: 0,
                enable_location_verification: false,
                strict_location_mode: false
            };
            try {
                const [branchSettings] = await database_1.pool.execute(`SELECT * FROM attendance_settings WHERE branch_id = ?`, [branchId]);
                if (branchSettings && branchSettings.length > 0) {
                    settings = { ...settings, ...branchSettings[0] };
                }
            }
            catch (error) {
                console.log('Using default attendance settings');
            }
            if (location_coordinates && typeof location_coordinates === 'object') {
                const userLng = parseFloat(location_coordinates.longitude);
                const userLat = parseFloat(location_coordinates.latitude);
                if (!isNaN(userLng) && !isNaN(userLat)) {
                    const hasAssignedLocation = staffRecord.assigned_location_id || staffRecord.location_assignments;
                    if (settings.strict_location_mode && hasAssignedLocation) {
                        let assignedLocationIds = [];
                        if (staffRecord.assigned_location_id) {
                            assignedLocationIds.push(staffRecord.assigned_location_id);
                        }
                        if (staffRecord.location_assignments && staffRecord.location_assignments.secondary_locations) {
                            const secondary = JSON.parse(staffRecord.location_assignments.secondary_locations);
                            if (Array.isArray(secondary)) {
                                assignedLocationIds = [...assignedLocationIds, ...secondary];
                            }
                        }
                        console.log('📍 Staff assigned locations:', assignedLocationIds);
                        const nearbyLocations = await attendance_location_model_1.default.getLocationsNearby(userLat, userLng, 1000);
                        const isWithinAssignedLocation = nearbyLocations.some(loc => assignedLocationIds.includes(loc.id));
                        if (isWithinAssignedLocation) {
                            locationVerified = true;
                            console.log('✅ Staff checked in at assigned location');
                        }
                        else {
                            locationVerified = false;
                            console.log('❌ Staff NOT at assigned location');
                        }
                    }
                    else {
                        if (branch.attendance_mode === 'branch_based') {
                            if (branch.location_coordinates) {
                                const branchCoords = branch.location_coordinates.match(/POINT\(([-+]?\d*\.?\d*) ([-+]?\d*\.?\d*)\)/i);
                                if (branchCoords) {
                                    const branchLng = parseFloat(branchCoords[1]);
                                    const branchLat = parseFloat(branchCoords[2]);
                                    const latDiff = (userLat - branchLat) * 111320;
                                    const lngDiff = (userLng - branchLng) * 111320 * Math.cos(branchLat * (Math.PI / 180));
                                    const distance = Math.sqrt(Math.pow(latDiff, 2) + Math.pow(lngDiff, 2));
                                    const radius = branch.location_radius_meters || 100;
                                    if (distance <= radius)
                                        locationVerified = true;
                                }
                            }
                        }
                        else if (branch.attendance_mode === 'multiple_locations') {
                            const nearbyLocations = await attendance_location_model_1.default.getLocationsNearby(userLat, userLng, branch.location_radius_meters || 100);
                            if (nearbyLocations.length > 0)
                                locationVerified = true;
                        }
                    }
                }
            }
            if (settings.enable_location_verification && !locationVerified) {
                return res.status(403).json({
                    success: false,
                    message: 'Location verification failed. You must be within the allowed radius of the branch to check in.',
                    data: { distance_check_failed: true }
                });
            }
            const updateData = {
                check_in_time: new Date(`1970-01-01T${check_in_time}`),
                location_coordinates: (0, attendance_model_1.locationToWKT)(location_coordinates),
                location_verified: locationVerified,
                location_address: location_address || null
            };
            if (providedStatus) {
                updateData.status = providedStatus;
            }
            const updatedAttendance = await attendance_model_1.default.update(attendanceRecord.id, updateData);
            return res.status(200).json({
                success: true,
                message: 'Check-in time recorded successfully',
                data: { attendance: updatedAttendance }
            });
        }
        else {
            const isHoliday = await holiday_model_1.default.isHoliday(new Date(date));
            if (isHoliday) {
                const [dutyRoster] = await database_1.pool.execute(`SELECT * FROM holiday_duty_roster WHERE holiday_id = (SELECT id FROM holidays WHERE date = ? LIMIT 1) AND user_id = ?`, [new Date(date), userId]);
                if (dutyRoster.length > 0) {
                    const roster = dutyRoster[0];
                    const attendanceData = {
                        user_id: userId,
                        date: new Date(date),
                        status: 'holiday-working',
                        check_in_time: null,
                        check_out_time: null,
                        location_coordinates: null,
                        location_verified: false,
                        location_address: null,
                        notes: `Holiday duty: ${roster.shift_start_time} - ${roster.shift_end_time}`
                    };
                    const newAttendance = await attendance_model_1.default.create(attendanceData);
                    return res.status(201).json({
                        success: true,
                        message: 'Holiday duty attendance recorded successfully',
                        data: { attendance: newAttendance }
                    });
                }
                else {
                    const attendanceData = {
                        user_id: userId,
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
            }
            const [leaveHistory] = await database_1.pool.execute(`SELECT id, start_date, end_date FROM leave_history WHERE user_id = ? AND ? BETWEEN start_date AND end_date`, [userId, new Date(date)]);
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
                return res.status(201).json({
                    success: true,
                    message: 'Leave attendance recorded successfully',
                    data: { attendance: newAttendance }
                });
            }
            const staffRecord = await staff_model_1.default.findByUserId(userId);
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
            if (branch.attendance_lock_date) {
                const today = new Date().toISOString().split('T')[0];
                const lockDate = new Date(branch.attendance_lock_date).toISOString().split('T')[0];
                if (lockDate >= today) {
                    return res.status(403).json({
                        success: false,
                        message: 'Attendance for today has been locked by your branch. You cannot check in after the auto-mark time has passed.',
                        data: { locked: true, lock_date: branch.attendance_lock_date }
                    });
                }
            }
            let settings = {
                require_check_in: true,
                require_check_out: true,
                grace_period_minutes: 0,
                enable_location_verification: false
            };
            try {
                const [branchSettings] = await database_1.pool.execute(`SELECT * FROM attendance_settings WHERE branch_id = ?`, [branchId]);
                if (branchSettings && branchSettings.length > 0) {
                    settings = { ...settings, ...branchSettings[0] };
                }
            }
            catch (error) {
                console.log('Using default attendance settings (table may not exist)');
            }
            if (settings.require_check_in === false) {
                return res.status(400).json({
                    success: false,
                    message: 'Check-in is not required for this branch'
                });
            }
            let locationVerified = false;
            let status = 'absent';
            if (location_coordinates) {
                if (branch.attendance_mode === 'branch_based' && location_coordinates) {
                    if (branch.location_coordinates) {
                        const branchCoords = branch.location_coordinates.match(/POINT\(([-+]?\d*\.\d+) ([-+]?\d*\.\d+)\)/);
                        if (branchCoords) {
                            const branchLng = parseFloat(branchCoords[1]);
                            const branchLat = parseFloat(branchCoords[2]);
                            const userLng = parseFloat(location_coordinates.longitude);
                            const userLat = parseFloat(location_coordinates.latitude);
                            const distance = Math.sqrt(Math.pow(userLng - branchLng, 2) + Math.pow(userLat - branchLat, 2)) * 111000;
                            const radius = branch.location_radius_meters || 100;
                            if (distance <= radius) {
                                locationVerified = true;
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
            }
            const attendanceData = {
                user_id: userId,
                date: new Date(date),
                status: 'present',
                check_in_time: new Date(`1970-01-01T${check_in_time}`),
                check_out_time: null,
                location_coordinates: (0, attendance_model_1.locationToWKT)(location_coordinates),
                location_verified: locationVerified,
                location_address: location_address || null,
                notes: null
            };
            const newAttendance = await attendance_model_1.default.create(attendanceData);
            try {
                await shift_scheduling_service_1.ShiftSchedulingService.updateAttendanceWithScheduleInfo(newAttendance.id, userId, new Date(date), settings.grace_period_minutes || 0);
            }
            catch (shiftError) {
                console.error('Failed to update attendance with shift info:', shiftError);
            }
            return res.status(201).json({
                success: true,
                message: 'Check-in recorded successfully',
                data: { attendance: newAttendance }
            });
        }
    }
    catch (error) {
        console.error('Check-in error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/check-out', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { date, check_out_time, location_coordinates, location_address } = req.body;
        const userId = req.currentUser?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: No user information'
            });
        }
        if (!date || !check_out_time) {
            return res.status(400).json({
                success: false,
                message: 'Date and check_out_time are required'
            });
        }
        const attendanceRecord = await attendance_model_1.default.findByUserIdAndDate(userId, new Date(date));
        if (!attendanceRecord) {
            return res.status(404).json({
                success: false,
                message: 'No attendance record found for this date. Please check in first.'
            });
        }
        if (attendanceRecord.is_locked) {
            return res.status(403).json({
                success: false,
                message: 'Attendance for this date has been locked by your branch. You cannot check out after the auto-mark time has passed.',
                data: { locked: true, locked_at: attendanceRecord.locked_at }
            });
        }
        if (attendanceRecord.check_out_time) {
            return res.status(409).json({
                success: false,
                message: 'You have already checked out today. Multiple check-outs are not allowed.'
            });
        }
        const staffRecord = await staff_model_1.default.findByUserId(userId);
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
        let settings = {
            require_check_in: true,
            require_check_out: true,
            grace_period_minutes: 0,
            enable_location_verification: false,
            strict_location_mode: false
        };
        try {
            const [branchSettings] = await database_1.pool.execute(`SELECT * FROM attendance_settings WHERE branch_id = ?`, [branchId]);
            if (branchSettings && branchSettings.length > 0) {
                settings = { ...settings, ...branchSettings[0] };
            }
        }
        catch (error) {
            console.log('Using default attendance settings (table may not exist)');
        }
        if (settings.require_check_out === false) {
            return res.status(400).json({
                success: false,
                message: 'Check-out is not required for this branch'
            });
        }
        const branch = await branch_model_1.default.findById(branchId);
        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found for staff'
            });
        }
        let locationVerified = attendanceRecord.location_verified;
        if (location_coordinates && typeof location_coordinates === 'object') {
            const userLng = parseFloat(location_coordinates.longitude);
            const userLat = parseFloat(location_coordinates.latitude);
            if (!isNaN(userLng) && !isNaN(userLat)) {
                const hasAssignedLocation = staffRecord.assigned_location_id || staffRecord.location_assignments;
                if (settings.strict_location_mode && hasAssignedLocation) {
                    let assignedLocationIds = [];
                    if (staffRecord.assigned_location_id) {
                        assignedLocationIds.push(staffRecord.assigned_location_id);
                    }
                    if (staffRecord.location_assignments && staffRecord.location_assignments.secondary_locations) {
                        const secondary = JSON.parse(staffRecord.location_assignments.secondary_locations);
                        if (Array.isArray(secondary)) {
                            assignedLocationIds = [...assignedLocationIds, ...secondary];
                        }
                    }
                    const nearbyLocations = await attendance_location_model_1.default.getLocationsNearby(userLat, userLng, 1000);
                    const isWithinAssignedLocation = nearbyLocations.some(loc => assignedLocationIds.includes(loc.id));
                    if (isWithinAssignedLocation) {
                        locationVerified = true;
                        console.log('✅ Staff checked out at assigned location');
                    }
                    else {
                        locationVerified = false;
                        console.log('❌ Staff NOT at assigned location for check-out');
                    }
                }
                else {
                    if (branch.attendance_mode === 'branch_based') {
                        if (branch.location_coordinates) {
                            const branchCoords = branch.location_coordinates.match(/POINT\(([-+]?\d*\.?\d*) ([-+]?\d*\.?\d*)\)/i);
                            if (branchCoords) {
                                const branchLng = parseFloat(branchCoords[1]);
                                const branchLat = parseFloat(branchCoords[2]);
                                const latDiff = (userLat - branchLat) * 111320;
                                const lngDiff = (userLng - branchLng) * 111320 * Math.cos(branchLat * (Math.PI / 180));
                                const distance = Math.sqrt(Math.pow(latDiff, 2) + Math.pow(lngDiff, 2));
                                const radius = branch.location_radius_meters || 100;
                                if (distance <= radius) {
                                    locationVerified = true;
                                }
                            }
                        }
                    }
                    else if (branch.attendance_mode === 'multiple_locations') {
                        const nearbyLocations = await attendance_location_model_1.default.getLocationsNearby(userLat, userLng, branch.location_radius_meters || 100);
                        if (nearbyLocations.length > 0) {
                            locationVerified = true;
                        }
                    }
                }
            }
            if (settings.enable_location_verification && !locationVerified) {
                return res.status(403).json({
                    success: false,
                    message: 'Location verification failed. You must be within the allowed radius of the branch to check out.',
                    data: { distance_check_failed: true }
                });
            }
        }
        const updateData = {
            check_out_time: new Date(`1970-01-01T${check_out_time}`),
            location_coordinates: (0, attendance_model_1.locationToWKT)(location_coordinates),
            location_verified: locationVerified,
            location_address: location_address || null
        };
        const updatedAttendance = await attendance_model_1.default.update(attendanceRecord.id, updateData);
        try {
            await shift_scheduling_service_1.ShiftSchedulingService.updateAttendanceWithScheduleInfo(attendanceRecord.id, userId, new Date(date), settings.grace_period_minutes || 0);
        }
        catch (shiftError) {
            console.error('Failed to update attendance with shift info:', shiftError);
        }
        return res.status(200).json({
            success: true,
            message: 'Check-out time recorded successfully',
            data: { attendance: updatedAttendance }
        });
    }
    catch (error) {
        console.error('Check-out error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=attendance-check.route.js.map