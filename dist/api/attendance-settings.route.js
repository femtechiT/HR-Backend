"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const branch_model_1 = __importDefault(require("../models/branch.model"));
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.get('/settings', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:manage'), async (req, res) => {
    try {
        const { branchId } = req.query;
        let targetBranchId = req.currentUser?.branch_id;
        if (branchId) {
            const branchIdNum = parseInt(branchId);
            if (isNaN(branchIdNum)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid branch ID'
                });
            }
            targetBranchId = branchIdNum;
        }
        if (!targetBranchId) {
            return res.status(400).json({
                success: false,
                message: 'Branch ID is required'
            });
        }
        const branch = await branch_model_1.default.findById(targetBranchId);
        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }
        const attendanceSettings = {
            branch_id: branch.id,
            branch_name: branch.name,
            attendance_mode: branch.attendance_mode,
            location_coordinates: branch.location_coordinates,
            location_radius_meters: branch.location_radius_meters,
            require_check_in: branch.attendance_mode ? true : false,
            require_check_out: branch.attendance_mode ? true : false,
            auto_checkout_enabled: false,
            auto_checkout_minutes_after_close: 30,
            allow_manual_attendance_entry: true,
            allow_future_attendance_entry: false,
            grace_period_minutes: 0,
            enable_location_verification: !!branch.location_coordinates,
            enable_face_recognition: false,
            enable_biometric_verification: false,
            notify_absent_employees: true,
            notify_supervisors_daily_summary: true,
            enable_weekend_attendance: false,
            enable_holiday_attendance: false,
            auto_mark_absent_enabled: branch.auto_mark_absent_enabled ?? true,
            auto_mark_absent_time: branch.auto_mark_absent_time ?? '12:00',
            auto_mark_absent_timezone: branch.auto_mark_absent_timezone ?? 'Africa/Nairobi',
            attendance_lock_date: branch.attendance_lock_date,
            created_at: branch.created_at,
            updated_at: branch.updated_at
        };
        return res.json({
            success: true,
            message: 'Attendance settings retrieved successfully',
            data: { settings: attendanceSettings }
        });
    }
    catch (error) {
        console.error('Get attendance settings error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.patch('/settings', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:manage'), async (req, res) => {
    try {
        const { branchId, settings } = req.body;
        if (!settings) {
            return res.status(400).json({
                success: false,
                message: 'Settings object is required'
            });
        }
        let targetBranchId = req.currentUser?.branch_id;
        if (branchId) {
            const branchIdNum = parseInt(branchId);
            if (isNaN(branchIdNum)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid branch ID'
                });
            }
            targetBranchId = branchIdNum;
        }
        if (!targetBranchId) {
            return res.status(400).json({
                success: false,
                message: 'Branch ID is required'
            });
        }
        const branch = await branch_model_1.default.findById(targetBranchId);
        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }
        const updateData = {};
        if (settings.attendance_mode !== undefined) {
            if (!['branch_based', 'multiple_locations', 'flexible'].includes(settings.attendance_mode)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid attendance mode. Valid options: branch_based, multiple_locations, flexible'
                });
            }
            updateData.attendance_mode = settings.attendance_mode;
        }
        if (settings.location_coordinates !== undefined) {
            updateData.location_coordinates = settings.location_coordinates;
        }
        if (settings.location_radius_meters !== undefined) {
            updateData.location_radius_meters = settings.location_radius_meters;
        }
        if (settings.require_check_in !== undefined) {
        }
        if (settings.require_check_out !== undefined) {
        }
        if (settings.auto_checkout_enabled !== undefined) {
        }
        if (settings.auto_checkout_minutes_after_close !== undefined) {
        }
        if (settings.allow_manual_attendance_entry !== undefined) {
        }
        if (settings.allow_future_attendance_entry !== undefined) {
        }
        if (settings.grace_period_minutes !== undefined) {
        }
        if (settings.enable_location_verification !== undefined) {
        }
        if (settings.enable_face_recognition !== undefined) {
        }
        if (settings.enable_biometric_verification !== undefined) {
        }
        if (settings.notify_absent_employees !== undefined) {
        }
        if (settings.notify_supervisors_daily_summary !== undefined) {
        }
        if (settings.enable_weekend_attendance !== undefined) {
        }
        if (settings.enable_holiday_attendance !== undefined) {
        }
        if (Object.keys(updateData).length > 0) {
            await branch_model_1.default.update(targetBranchId, updateData);
        }
        const [existingSettings] = await database_1.pool.execute(`SELECT * FROM attendance_settings WHERE branch_id = ?`, [targetBranchId]);
        if (existingSettings.length > 0) {
            const updateFields = [];
            const updateValues = [];
            const allowedKeys = [
                'require_check_in', 'require_check_out', 'grace_period_minutes',
                'auto_checkout_enabled', 'auto_checkout_minutes_after_close',
                'enable_location_verification', 'allow_manual_attendance_entry',
                'enable_weekend_attendance', 'notify_absent_employees',
                'notify_supervisors_daily_summary', 'enable_face_recognition',
                'enable_biometric_verification', 'enable_holiday_attendance'
            ];
            for (const [key, value] of Object.entries(settings)) {
                if (allowedKeys.includes(key) && typeof value !== 'undefined') {
                    updateFields.push(`${key} = ?`);
                    updateValues.push(value);
                }
            }
            if (updateFields.length > 0) {
                updateValues.push(targetBranchId);
                await database_1.pool.execute(`UPDATE attendance_settings SET ${updateFields.join(', ')} WHERE branch_id = ?`, updateValues);
            }
        }
        else {
            const columns = [];
            const values = [];
            const placeholders = [];
            columns.push('branch_id');
            values.push(targetBranchId);
            placeholders.push('?');
            const allowedKeys = [
                'require_check_in', 'require_check_out', 'grace_period_minutes',
                'auto_checkout_enabled', 'auto_checkout_minutes_after_close',
                'enable_location_verification', 'allow_manual_attendance_entry',
                'enable_weekend_attendance', 'notify_absent_employees',
                'notify_supervisors_daily_summary', 'enable_face_recognition',
                'enable_biometric_verification', 'enable_holiday_attendance'
            ];
            for (const [key, value] of Object.entries(settings)) {
                if (allowedKeys.includes(key) && typeof value !== 'undefined') {
                    columns.push(key);
                    values.push(value);
                    placeholders.push('?');
                }
            }
            await database_1.pool.execute(`INSERT INTO attendance_settings (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`, values);
        }
        const [updatedSettings] = await database_1.pool.execute(`SELECT * FROM attendance_settings WHERE branch_id = ?`, [targetBranchId]);
        return res.json({
            success: true,
            message: 'Attendance settings updated successfully',
            data: { settings: updatedSettings[0] || {} }
        });
    }
    catch (error) {
        console.error('Update attendance settings error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/settings/global', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:manage'), async (req, res) => {
    try {
        const [globalSettings] = await database_1.pool.execute(`SELECT * FROM global_attendance_settings LIMIT 1`);
        const settings = globalSettings[0] || {
            id: 1,
            auto_checkout_enabled: false,
            auto_checkout_minutes_after_close: 30,
            allow_manual_attendance_entry: true,
            allow_future_attendance_entry: false,
            grace_period_minutes: 0,
            enable_face_recognition: false,
            enable_biometric_verification: false,
            notify_absent_employees: true,
            notify_supervisors_daily_summary: true,
            enable_weekend_attendance: false,
            enable_holiday_attendance: false,
            created_at: new Date(),
            updated_at: new Date()
        };
        return res.json({
            success: true,
            message: 'Global attendance settings retrieved successfully',
            data: { settings }
        });
    }
    catch (error) {
        console.error('Get global attendance settings error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.patch('/settings/global', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:manage'), async (req, res) => {
    try {
        const settings = req.body.settings;
        if (!settings) {
            return res.status(400).json({
                success: false,
                message: 'Settings object is required'
            });
        }
        const [existingSettings] = await database_1.pool.execute(`SELECT id FROM global_attendance_settings LIMIT 1`);
        if (existingSettings.length > 0) {
            const updateFields = [];
            const updateValues = [];
            for (const [key, value] of Object.entries(settings)) {
                if (typeof value !== 'undefined') {
                    updateFields.push(`${key} = ?`);
                    updateValues.push(value);
                }
            }
            if (updateFields.length > 0) {
                updateValues.push(existingSettings[0].id);
                await database_1.pool.execute(`UPDATE global_attendance_settings SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
            }
        }
        else {
            const columns = ['id'];
            const values = [1];
            const placeholders = ['?'];
            for (const [key, value] of Object.entries(settings)) {
                if (typeof value !== 'undefined' && value !== null) {
                    columns.push(key);
                    values.push(value);
                    placeholders.push('?');
                }
            }
            await database_1.pool.execute(`INSERT INTO global_attendance_settings (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`, values);
        }
        const [updatedSettings] = await database_1.pool.execute(`SELECT * FROM global_attendance_settings LIMIT 1`);
        return res.json({
            success: true,
            message: 'Global attendance settings updated successfully',
            data: { settings: updatedSettings[0] }
        });
    }
    catch (error) {
        console.error('Update global attendance settings error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
router.patch('/settings/auto-mark', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:manage'), async (req, res) => {
    try {
        const { branchId, auto_mark_absent_enabled, auto_mark_absent_time, auto_mark_absent_timezone } = req.body;
        let targetBranchId = req.currentUser?.branch_id;
        if (branchId) {
            const branchIdNum = parseInt(branchId);
            if (isNaN(branchIdNum)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid branch ID'
                });
            }
            targetBranchId = branchIdNum;
        }
        if (!targetBranchId) {
            return res.status(400).json({
                success: false,
                message: 'Branch ID is required'
            });
        }
        const branch = await branch_model_1.default.findById(targetBranchId);
        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }
        if (auto_mark_absent_time && !/^\d{2}:\d{2}$/.test(auto_mark_absent_time)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid time format. Use HH:MM (24-hour format)'
            });
        }
        const updateData = {};
        if (auto_mark_absent_enabled !== undefined) {
            updateData.auto_mark_absent_enabled = auto_mark_absent_enabled;
        }
        if (auto_mark_absent_time !== undefined) {
            updateData.auto_mark_absent_time = auto_mark_absent_time;
        }
        if (auto_mark_absent_timezone !== undefined) {
            updateData.auto_mark_absent_timezone = auto_mark_absent_timezone;
        }
        if (Object.keys(updateData).length > 0) {
            await branch_model_1.default.update(targetBranchId, updateData);
        }
        const updatedBranch = await branch_model_1.default.findById(targetBranchId);
        return res.json({
            success: true,
            message: 'Auto-mark settings updated successfully',
            data: {
                settings: {
                    branch_id: updatedBranch.id,
                    branch_name: updatedBranch.name,
                    auto_mark_absent_enabled: updatedBranch.auto_mark_absent_enabled,
                    auto_mark_absent_time: updatedBranch.auto_mark_absent_time,
                    auto_mark_absent_timezone: updatedBranch.auto_mark_absent_timezone,
                    attendance_lock_date: updatedBranch.attendance_lock_date
                }
            }
        });
    }
    catch (error) {
        console.error('Update auto-mark settings error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
});
router.post('/settings/lock-date', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:manage'), async (req, res) => {
    try {
        const { date, branchId, reason } = req.body;
        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date is required'
            });
        }
        let targetBranchId = req.currentUser?.branch_id;
        if (branchId) {
            const branchIdNum = parseInt(branchId);
            if (isNaN(branchIdNum)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid branch ID'
                });
            }
            targetBranchId = branchIdNum;
        }
        if (!targetBranchId) {
            return res.status(400).json({
                success: false,
                message: 'Branch ID is required'
            });
        }
        const lockDate = new Date(date);
        lockDate.setHours(0, 0, 0, 0);
        const [lockResult] = await database_1.pool.execute(`
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
    `, [req.currentUser.id, reason || 'Manual lock', targetBranchId, date]);
        await database_1.pool.execute(`
      UPDATE branches
      SET attendance_lock_date = LEAST(IFNULL(attendance_lock_date, ?), ?)
      WHERE id = ?
    `, [date, date, targetBranchId]);
        await database_1.pool.execute(`
      INSERT INTO attendance_lock_log
        (branch_id, lock_date, locked_by, reason, attendance_count)
      VALUES (?, ?, ?, ?, ?)
    `, [targetBranchId, date, req.currentUser.id, reason || 'Manual lock', lockResult.affectedRows]);
        return res.json({
            success: true,
            message: `Locked ${lockResult.affectedRows} attendance records for ${date}`,
            data: {
                branch_id: targetBranchId,
                lock_date: date,
                locked_count: lockResult.affectedRows
            }
        });
    }
    catch (error) {
        console.error('Lock date error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
});
router.get('/settings/lock-status', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { branchId } = req.query;
        let targetBranchId = req.currentUser?.branch_id;
        if (branchId) {
            const branchIdNum = parseInt(branchId);
            if (isNaN(branchIdNum)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid branch ID'
                });
            }
            targetBranchId = branchIdNum;
        }
        if (!targetBranchId) {
            return res.status(400).json({
                success: false,
                message: 'Branch ID is required'
            });
        }
        const branch = await branch_model_1.default.findById(targetBranchId);
        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }
        const [lockLog] = await database_1.pool.execute(`
      SELECT 
        l.*,
        u.name as locked_by_name
      FROM attendance_lock_log l
      LEFT JOIN users u ON l.locked_by = u.id
      WHERE l.branch_id = ?
      ORDER BY l.locked_at DESC
      LIMIT 10
    `, [targetBranchId]);
        return res.json({
            success: true,
            data: {
                branch_id: branch.id,
                branch_name: branch.name,
                attendance_lock_date: branch.attendance_lock_date,
                auto_mark_absent_enabled: branch.auto_mark_absent_enabled,
                auto_mark_absent_time: branch.auto_mark_absent_time,
                auto_mark_absent_timezone: branch.auto_mark_absent_timezone,
                recent_locks: lockLog
            }
        });
    }
    catch (error) {
        console.error('Get lock status error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
});
router.patch('/:id/unlock', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance:admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const [attendance] = await database_1.pool.execute(`
      SELECT * FROM attendance WHERE id = ?
    `, [id]);
        if (attendance.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }
        if (!attendance[0].is_locked) {
            return res.status(400).json({
                success: false,
                message: 'Attendance is not locked'
            });
        }
        await database_1.pool.execute(`
      UPDATE attendance
      SET is_locked = FALSE, locked_at = NULL, locked_by = NULL, lock_reason = NULL
      WHERE id = ?
    `, [id]);
        return res.json({
            success: true,
            message: 'Attendance unlocked successfully'
        });
    }
    catch (error) {
        console.error('Unlock attendance error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
});
//# sourceMappingURL=attendance-settings.route.js.map