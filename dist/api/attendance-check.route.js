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
const parseLocationCoordinates = (location) => {
    if (!location) {
        return null;
    }
    if (typeof location === 'string') {
        const pointMatch = location.match(/POINT\(([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\)/i);
        if (!pointMatch) {
            return null;
        }
        const longitude = Number(pointMatch[1]);
        const latitude = Number(pointMatch[2]);
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
            return { latitude, longitude };
        }
        return null;
    }
    const rawLatitude = location.latitude ?? location.lat ?? location.y;
    const rawLongitude = location.longitude ?? location.lng ?? location.x;
    const latitude = Number(rawLatitude);
    const longitude = Number(rawLongitude);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return { latitude, longitude };
    }
    return null;
};
const parseSecondaryLocations = (value) => {
    if (!value) {
        return [];
    }
    if (Array.isArray(value)) {
        return value
            .map((item) => Number(item))
            .filter((item) => Number.isFinite(item));
    }
    if (typeof value === 'string') {
        try {
            return parseSecondaryLocations(JSON.parse(value));
        }
        catch (error) {
            console.error('Failed to parse secondary_locations:', error);
            return [];
        }
    }
    if (typeof value === 'object' && value !== null && 'secondary_locations' in value) {
        return parseSecondaryLocations(value.secondary_locations);
    }
    return [];
};
const getAssignedLocationIds = (staffRecord) => {
    const assignedLocationIds = new Set();
    if (staffRecord?.assigned_location_id) {
        assignedLocationIds.add(Number(staffRecord.assigned_location_id));
    }
    for (const locationId of parseSecondaryLocations(staffRecord?.location_assignments)) {
        assignedLocationIds.add(locationId);
    }
    return [...assignedLocationIds].filter((locationId) => Number.isFinite(locationId));
};
const isOnApprovedLeave = async (userId, date) => {
    const dateStr = date.toISOString().split('T')[0];
    const [leaveHistory] = await database_1.pool.execute(`SELECT id
     FROM leave_history
     WHERE user_id = ?
       AND ? BETWEEN start_date AND end_date
       AND status = 'approved'
     LIMIT 1`, [userId, dateStr]);
    if (leaveHistory.length > 0)
        return true;
    const [leaveRequests] = await database_1.pool.execute(`SELECT id
     FROM leave_requests
     WHERE user_id = ?
       AND ? BETWEEN start_date AND end_date
       AND status = 'approved'
       AND (cancelled_by IS NULL OR cancelled_at IS NULL)
     LIMIT 1`, [userId, dateStr]);
    return leaveRequests.length > 0;
};
const verifyUserLocation = async (args) => {
    const { branch, staffRecord, userCoords, strictLocationMode } = args;
    if (!userCoords) {
        return { verified: false, reason: 'no_coords' };
    }
    const { latitude: userLat, longitude: userLng } = userCoords;
    if (branch?.attendance_mode === 'multiple_locations' || strictLocationMode) {
        const assignedLocationIds = getAssignedLocationIds(staffRecord);
        if (assignedLocationIds.length === 0) {
            return { verified: false, reason: 'no_assignment' };
        }
        const matches = await attendance_location_model_1.default.getAssignedLocationsWithinRadius(assignedLocationIds, userLat, userLng, null);
        if (matches.length > 0) {
            return {
                verified: true,
                method: 'assigned_locations',
                matched_location_id: matches[0].id
            };
        }
        return { verified: false, reason: 'outside_allowed_area' };
    }
    if (branch?.attendance_mode === 'branch_based') {
        if (!branch.location_coordinates) {
            return { verified: false, reason: 'outside_allowed_area' };
        }
        const branchCoords = String(branch.location_coordinates).match(/POINT\(([-+]?\d*\.?\d*) ([-+]?\d*\.?\d*)\)/i);
        if (!branchCoords) {
            return { verified: false, reason: 'outside_allowed_area' };
        }
        const branchLng = parseFloat(branchCoords[1]);
        const branchLat = parseFloat(branchCoords[2]);
        const latDiff = (userLat - branchLat) * 111320;
        const lngDiff = (userLng - branchLng) * 111320 * Math.cos(branchLat * (Math.PI / 180));
        const distance = Math.sqrt(Math.pow(latDiff, 2) + Math.pow(lngDiff, 2));
        const radius = branch.location_radius_meters || 100;
        if (distance <= radius) {
            return { verified: true, method: 'branch_based' };
        }
        return { verified: false, reason: 'outside_allowed_area' };
    }
    return { verified: true, method: 'multiple_locations_any' };
};
router.get('/my-locations', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.currentUser?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const staffRecord = await staff_model_1.default.findByUserId(userId);
        if (!staffRecord) {
            return res.status(404).json({ success: false, message: 'Staff record not found' });
        }
        const assignedIds = getAssignedLocationIds(staffRecord);
        if (assignedIds.length === 0) {
            return res.json({
                success: true,
                message: 'No attendance locations assigned',
                data: { locations: [], assigned_location_ids: [] }
            });
        }
        const placeholders = assignedIds.map(() => '?').join(', ');
        const [rows] = await database_1.pool.execute(`
        SELECT
          id,
          name,
          ST_AsText(location_coordinates) AS location_coordinates,
          location_radius_meters,
          branch_id,
          is_active
        FROM attendance_locations
        WHERE is_active = TRUE
          AND id IN (${placeholders})
        ORDER BY name
      `, assignedIds);
        return res.json({
            success: true,
            message: 'Assigned attendance locations retrieved successfully',
            data: { locations: rows, assigned_location_ids: assignedIds }
        });
    }
    catch (error) {
        console.error('Get my attendance locations error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.post('/check-in', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { date, check_in_time, location_coordinates, location_address, status: providedStatus } = req.body;
        const userId = req.currentUser?.id;
        const userCoords = parseLocationCoordinates(location_coordinates);
        const debug = process.env.ATTENDANCE_DEBUG === 'true';
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
        const requestedDate = new Date(date);
        const effectiveSchedule = await shift_scheduling_service_1.ShiftSchedulingService.getEffectiveScheduleForDate(userId, requestedDate);
        if (effectiveSchedule?.schedule_type === 'leave' || (await isOnApprovedLeave(userId, requestedDate))) {
            return res.status(403).json({
                success: false,
                message: 'You are on approved leave for this date. Clock-in is not allowed.',
                data: { on_leave: true }
            });
        }
        if (!effectiveSchedule || !effectiveSchedule.start_time) {
            if (effectiveSchedule?.schedule_type !== 'holiday') {
                const leaveCheck = await database_1.pool.execute(`SELECT id FROM leave_history WHERE user_id = ? AND ? BETWEEN start_date AND end_date AND status = 'approved'`, [userId, new Date(date)]);
                if (leaveCheck[0].length === 0) {
                    const scheduleNote = effectiveSchedule?.schedule_note || 'Scheduled Day Off';
                    return res.status(403).json({
                        success: false,
                        message: `Today is a non-working day (${scheduleNote}). You do not have an active shift assigned for this date.`,
                        data: { non_working_day: true }
                    });
                }
            }
        }
        else {
            const [startHours, startMinutes] = effectiveSchedule.start_time.split(':').map(Number);
            const scheduledStart = new Date(date);
            scheduledStart.setHours(startHours, startMinutes, 0, 0);
            const cutoffTime = new Date(scheduledStart.getTime() + (4 * 60 * 60 * 1000));
            const serverTime = new Date();
            const isToday = new Date(date).toISOString().split('T')[0] === serverTime.toISOString().split('T')[0];
            if (isToday && serverTime > cutoffTime) {
                return res.status(403).json({
                    success: false,
                    message: `Your scheduled shift started at ${effectiveSchedule.start_time}, and the 4-hour check-in window has now closed. Please contact your supervisor.`,
                    data: { cutoff_exceeded: true, scheduled_start: effectiveSchedule.start_time }
                });
            }
        }
        let attendanceRecord = await attendance_model_1.default.findByUserIdAndDate(userId, requestedDate);
        if (attendanceRecord) {
            if (attendanceRecord.status === 'leave' || attendanceRecord.status === 'holiday') {
                return res.status(403).json({
                    success: false,
                    message: attendanceRecord.status === 'leave'
                        ? 'Attendance is marked as leave for this date. Clock-in is not allowed.'
                        : 'Attendance is marked as holiday for this date. Clock-in is not allowed.',
                    data: { status: attendanceRecord.status }
                });
            }
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
            let branchId = staffRecord.branch_id;
            if (!branchId) {
                return res.status(400).json({ success: false, message: 'No branch assigned' });
            }
            if (userCoords) {
                const nearbyLocations = await attendance_location_model_1.default.getLocationsNearby(userCoords.latitude, userCoords.longitude, 1000);
                const assignedLocationIds = getAssignedLocationIds(staffRecord);
                if (assignedLocationIds.length > 0 && nearbyLocations.length > 0) {
                    const atAssignedLocation = nearbyLocations.some(loc => assignedLocationIds.includes(loc.id) && loc.branch_id);
                    if (atAssignedLocation) {
                        const locationBranch = nearbyLocations.find(loc => loc.branch_id)?.branch_id;
                        if (locationBranch) {
                            branchId = locationBranch;
                            console.log(`✅ Using location's branch ${branchId} for attendance verification`);
                        }
                    }
                }
            }
            const branch = await branch_model_1.default.findById(branchId);
            if (!branch) {
                return res.status(404).json({ success: false, message: 'Branch not found' });
            }
            let settings = {
                require_check_in: true,
                require_check_out: true,
                grace_period_minutes: 0,
                enable_location_verification: branch.attendance_mode === 'multiple_locations'
                    ? true
                    : branch.attendance_mode === 'branch_based'
                        ? !!branch.location_coordinates
                        : false,
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
            const strictMode = !!settings.strict_location_mode;
            if (debug) {
                console.log('[Attendance][CheckIn] Verify start', {
                    userId,
                    date,
                    branchId,
                    attendance_mode: branch.attendance_mode,
                    enable_location_verification: settings.enable_location_verification,
                    strict_location_mode: strictMode,
                    assigned_location_id: staffRecord.assigned_location_id,
                    location_assignments: staffRecord.location_assignments,
                    userCoords
                });
            }
            const verifyResult = await verifyUserLocation({ branch, staffRecord, userCoords, strictLocationMode: strictMode });
            locationVerified = verifyResult.verified;
            if (debug) {
                console.log('[Attendance][CheckIn] Verify result', verifyResult);
            }
            if (settings.enable_location_verification && !locationVerified) {
                let locationRequiredMessage = 'Location verification failed.';
                if (verifyResult.verified === false) {
                    if (verifyResult.reason === 'no_coords') {
                        locationRequiredMessage =
                            'Location permission is required to check in. Please allow location access in your browser or app settings and try again.';
                    }
                    else if (verifyResult.reason === 'no_assignment') {
                        locationRequiredMessage =
                            'No attendance location has been assigned to you yet. Please contact HR to assign your check-in location(s).';
                    }
                    else {
                        locationRequiredMessage =
                            'Location verification failed. You must be within the allowed radius of your assigned location to check in.';
                    }
                }
                return res.status(403).json({
                    success: false,
                    message: locationRequiredMessage,
                    data: {
                        distance_check_failed: !!userCoords,
                        location_permission_required: !userCoords
                    }
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
            const [leaveHistory] = await database_1.pool.execute(`SELECT id, start_date, end_date, status FROM leave_history WHERE user_id = ? AND ? BETWEEN start_date AND end_date`, [userId, requestedDate]);
            const approvedLeaves = leaveHistory.filter((l) => l.status === 'approved');
            if (approvedLeaves.length > 0) {
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
            const [leaveRequests] = await database_1.pool.execute(`SELECT id, start_date, end_date, status, cancelled_by, cancelled_at FROM leave_requests
         WHERE user_id = ?
           AND ? BETWEEN start_date AND end_date
           AND status = 'approved'
           AND (cancelled_by IS NULL OR cancelled_at IS NULL)`, [userId, requestedDate]);
            if (leaveRequests.length > 0) {
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
                enable_location_verification: branch.attendance_mode === 'multiple_locations'
                    ? true
                    : branch.attendance_mode === 'branch_based'
                        ? !!branch.location_coordinates
                        : false,
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
            if (settings.require_check_in === false) {
                return res.status(400).json({
                    success: false,
                    message: 'Check-in is not required for this branch'
                });
            }
            const strictMode = !!settings.strict_location_mode;
            if (debug) {
                console.log('[Attendance][CheckIn] (create) Verify start', {
                    userId,
                    date,
                    branchId,
                    attendance_mode: branch.attendance_mode,
                    enable_location_verification: settings.enable_location_verification,
                    strict_location_mode: strictMode,
                    assigned_location_id: staffRecord.assigned_location_id,
                    location_assignments: staffRecord.location_assignments,
                    userCoords
                });
            }
            const verifyResult = await verifyUserLocation({ branch, staffRecord, userCoords, strictLocationMode: strictMode });
            const locationVerified = verifyResult.verified;
            if (debug) {
                console.log('[Attendance][CheckIn] (create) Verify result', verifyResult);
            }
            if (settings.enable_location_verification && !locationVerified) {
                let locationRequiredMessage = 'Location verification failed.';
                if (verifyResult.verified === false) {
                    if (verifyResult.reason === 'no_coords') {
                        locationRequiredMessage =
                            'Location permission is required to check in. Please allow location access in your browser or app settings and try again.';
                    }
                    else if (verifyResult.reason === 'no_assignment') {
                        locationRequiredMessage =
                            'No attendance location has been assigned to you yet. Please contact HR to assign your check-in location(s).';
                    }
                    else {
                        locationRequiredMessage =
                            'Location verification failed. You must be within the allowed radius of your assigned location to check in.';
                    }
                }
                return res.status(403).json({
                    success: false,
                    message: locationRequiredMessage,
                    data: {
                        distance_check_failed: !!userCoords,
                        location_permission_required: !userCoords
                    }
                });
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
        const userCoords = parseLocationCoordinates(location_coordinates);
        const debug = process.env.ATTENDANCE_DEBUG === 'true';
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
        const requestedDate = new Date(date);
        if (await isOnApprovedLeave(userId, requestedDate)) {
            return res.status(403).json({
                success: false,
                message: 'You are on approved leave for this date. Clock-out is not allowed.',
                data: { on_leave: true }
            });
        }
        const attendanceRecord = await attendance_model_1.default.findByUserIdAndDate(userId, requestedDate);
        if (!attendanceRecord) {
            return res.status(404).json({
                success: false,
                message: 'No attendance record found for this date. Please check in first.'
            });
        }
        if (attendanceRecord.status === 'leave' || attendanceRecord.status === 'holiday') {
            return res.status(403).json({
                success: false,
                message: attendanceRecord.status === 'leave'
                    ? 'Attendance is marked as leave for this date. Clock-out is not allowed.'
                    : 'Attendance is marked as holiday for this date. Clock-out is not allowed.',
                data: { status: attendanceRecord.status }
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
        let branchId = staffRecord.branch_id;
        if (!branchId) {
            return res.status(400).json({
                success: false,
                message: 'Staff record does not have a branch assigned'
            });
        }
        if (userCoords) {
            const nearbyLocations = await attendance_location_model_1.default.getLocationsNearby(userCoords.latitude, userCoords.longitude, 1000);
            const assignedLocationIds = getAssignedLocationIds(staffRecord);
            if (assignedLocationIds.length > 0 && nearbyLocations.length > 0) {
                const atAssignedLocation = nearbyLocations.some(loc => assignedLocationIds.includes(loc.id) && loc.branch_id);
                if (atAssignedLocation) {
                    const locationBranch = nearbyLocations.find(loc => loc.branch_id)?.branch_id;
                    if (locationBranch) {
                        branchId = locationBranch;
                        console.log(`✅ Using location's branch ${branchId} for check-out verification`);
                    }
                }
            }
        }
        let settings = {
            require_check_in: true,
            require_check_out: true,
            grace_period_minutes: 0,
            enable_location_verification: null,
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
        if (settings.enable_location_verification === undefined || settings.enable_location_verification === null) {
            settings.enable_location_verification =
                branch.attendance_mode === 'multiple_locations'
                    ? true
                    : branch.attendance_mode === 'branch_based'
                        ? !!branch.location_coordinates
                        : false;
        }
        const strictMode = !!settings.strict_location_mode;
        if (debug) {
            console.log('[Attendance][CheckOut] Verify start', {
                userId,
                date,
                branchId,
                attendance_mode: branch.attendance_mode,
                enable_location_verification: settings.enable_location_verification,
                strict_location_mode: strictMode,
                assigned_location_id: staffRecord.assigned_location_id,
                location_assignments: staffRecord.location_assignments,
                userCoords
            });
        }
        const verifyResult = await verifyUserLocation({ branch, staffRecord, userCoords, strictLocationMode: strictMode });
        const locationVerified = verifyResult.verified;
        if (debug) {
            console.log('[Attendance][CheckOut] Verify result', verifyResult);
        }
        if (settings.enable_location_verification && !locationVerified) {
            let locationRequiredMessage = 'Location verification failed.';
            if (verifyResult.verified === false) {
                if (verifyResult.reason === 'no_coords') {
                    locationRequiredMessage =
                        'Location permission is required to check out. Please allow location access in your browser or app settings and try again.';
                }
                else if (verifyResult.reason === 'no_assignment') {
                    locationRequiredMessage =
                        'No attendance location has been assigned to you yet. Please contact HR to assign your check-in location(s).';
                }
                else {
                    locationRequiredMessage =
                        'Location verification failed. You must be within the allowed radius of your assigned location to check out.';
                }
            }
            return res.status(403).json({
                success: false,
                message: locationRequiredMessage,
                data: {
                    distance_check_failed: !!userCoords,
                    location_permission_required: !userCoords
                }
            });
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