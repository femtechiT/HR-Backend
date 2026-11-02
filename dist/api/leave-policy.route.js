"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
const getDefaultPolicy = () => ({
    id: 1,
    exclude_sundays_from_leave: false,
    daily_leave_cap: null,
    created_at: new Date(),
    updated_at: new Date()
});
router.get('/', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const [rows] = await database_1.pool.execute(`SELECT id, exclude_sundays_from_leave, daily_leave_cap, created_at, updated_at
       FROM global_attendance_settings
       LIMIT 1`);
        const policy = rows[0] || getDefaultPolicy();
        return res.json({
            success: true,
            message: 'Leave policy retrieved successfully',
            data: { settings: policy }
        });
    }
    catch (error) {
        console.error('Get leave policy error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.patch('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('settings:configure'), async (req, res) => {
    try {
        const { settings } = req.body;
        if (!settings) {
            return res.status(400).json({
                success: false,
                message: 'Settings object is required'
            });
        }
        const excludeSundays = settings.exclude_sundays_from_leave;
        const dailyLeaveCapProvided = Object.prototype.hasOwnProperty.call(settings, 'daily_leave_cap');
        let dailyLeaveCap = null;
        if (dailyLeaveCapProvided) {
            const rawCap = settings.daily_leave_cap;
            if (rawCap === null || rawCap === '' || rawCap === undefined) {
                dailyLeaveCap = null;
            }
            else {
                const parsed = Number(rawCap);
                if (!Number.isInteger(parsed) || parsed < 1) {
                    return res.status(400).json({
                        success: false,
                        message: 'daily_leave_cap must be a positive whole number, or null to disable it'
                    });
                }
                dailyLeaveCap = parsed;
            }
        }
        if (typeof excludeSundays === 'undefined' && !dailyLeaveCapProvided) {
            return res.status(400).json({
                success: false,
                message: 'At least one setting (exclude_sundays_from_leave or daily_leave_cap) is required'
            });
        }
        const [existingRows] = await database_1.pool.execute(`SELECT id FROM global_attendance_settings LIMIT 1`);
        if (existingRows.length > 0) {
            const updates = [];
            const values = [];
            if (typeof excludeSundays !== 'undefined') {
                updates.push('exclude_sundays_from_leave = ?');
                values.push(Boolean(excludeSundays));
            }
            if (dailyLeaveCapProvided) {
                updates.push('daily_leave_cap = ?');
                values.push(dailyLeaveCap);
            }
            updates.push('updated_at = NOW()');
            values.push(existingRows[0].id);
            await database_1.pool.execute(`UPDATE global_attendance_settings SET ${updates.join(', ')} WHERE id = ?`, values);
        }
        else {
            await database_1.pool.execute(`INSERT INTO global_attendance_settings (id, exclude_sundays_from_leave, daily_leave_cap)
         VALUES (1, ?, ?)`, [Boolean(excludeSundays), dailyLeaveCapProvided ? dailyLeaveCap : null]);
        }
        const [updatedRows] = await database_1.pool.execute(`SELECT id, exclude_sundays_from_leave, daily_leave_cap, created_at, updated_at
       FROM global_attendance_settings
       LIMIT 1`);
        return res.json({
            success: true,
            message: 'Leave policy updated successfully',
            data: { settings: updatedRows[0] || getDefaultPolicy() }
        });
    }
    catch (error) {
        console.error('Update leave policy error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=leave-policy.route.js.map