"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const branch_working_days_model_1 = __importDefault(require("../models/branch-working-days.model"));
const router = (0, express_1.Router)();
const DAYS_OF_WEEK = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
];
router.get('/:branchId/working-days', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const branchId = parseInt(req.params.branchId);
        if (isNaN(branchId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid branch ID'
            });
        }
        const workingDays = await branch_working_days_model_1.default.findByBranchId(branchId);
        return res.json({
            success: true,
            message: 'Working days retrieved successfully',
            data: {
                branch_id: branchId,
                workingDays
            }
        });
    }
    catch (error) {
        console.error('Get working days error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/:branchId/working-days/:dayOfWeek', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const branchId = parseInt(req.params.branchId);
        const dayOfWeek = req.params.dayOfWeek.toLowerCase();
        if (isNaN(branchId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid branch ID'
            });
        }
        if (!DAYS_OF_WEEK.includes(dayOfWeek)) {
            return res.status(400).json({
                success: false,
                message: `Invalid day of week. Must be one of: ${DAYS_OF_WEEK.join(', ')}`
            });
        }
        const workingDay = await branch_working_days_model_1.default.findByBranchIdAndDay(branchId, dayOfWeek);
        if (!workingDay) {
            return res.status(404).json({
                success: false,
                message: 'Working day configuration not found'
            });
        }
        return res.json({
            success: true,
            data: {
                workingDay
            }
        });
    }
    catch (error) {
        console.error('Get working day error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.put('/:branchId/working-days', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('branches:update'), async (req, res) => {
    try {
        const branchId = parseInt(req.params.branchId);
        const { workingDays } = req.body;
        console.log('[Working Days PUT] Branch ID:', branchId);
        console.log('[Working Days PUT] Request body:', JSON.stringify(req.body, null, 2));
        if (isNaN(branchId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid branch ID'
            });
        }
        if (!workingDays || !Array.isArray(workingDays)) {
            console.error('[Working Days PUT] Invalid workingDays:', workingDays);
            return res.status(400).json({
                success: false,
                message: 'workingDays array is required'
            });
        }
        for (const day of workingDays) {
            if (!day.day_of_week || !DAYS_OF_WEEK.includes(day.day_of_week.toLowerCase())) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid day_of_week: ${day.day_of_week}`
                });
            }
            if (day.is_working_day && (!day.start_time || !day.end_time)) {
                return res.status(400).json({
                    success: false,
                    message: `start_time and end_time are required for working day: ${day.day_of_week}`
                });
            }
        }
        const normalizedDays = workingDays.map((day) => ({
            ...day,
            day_of_week: day.day_of_week.toLowerCase()
        }));
        const updatedWorkingDays = await branch_working_days_model_1.default.bulkUpdate(branchId, normalizedDays);
        return res.json({
            success: true,
            message: 'Working days updated successfully',
            data: {
                workingDays: updatedWorkingDays
            }
        });
    }
    catch (error) {
        console.error('Update working days error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/:branchId/working-days/:dayOfWeek', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('branches:update'), async (req, res) => {
    try {
        const branchId = parseInt(req.params.branchId);
        const dayOfWeek = req.params.dayOfWeek.toLowerCase();
        if (isNaN(branchId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid branch ID'
            });
        }
        if (!DAYS_OF_WEEK.includes(dayOfWeek)) {
            return res.status(400).json({
                success: false,
                message: `Invalid day of week. Must be one of: ${DAYS_OF_WEEK.join(', ')}`
            });
        }
        const { is_working_day, start_time, end_time, break_duration_minutes } = req.body;
        const workingDay = await branch_working_days_model_1.default.upsert({
            branch_id: branchId,
            day_of_week: dayOfWeek,
            is_working_day,
            start_time,
            end_time,
            break_duration_minutes
        });
        return res.json({
            success: true,
            message: 'Working day updated successfully',
            data: {
                workingDay
            }
        });
    }
    catch (error) {
        console.error('Update working day error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/working-days/check', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { branch_id, date } = req.query;
        if (!branch_id || !date) {
            return res.status(400).json({
                success: false,
                message: 'branch_id and date are required'
            });
        }
        const branchId = parseInt(branch_id);
        const dateObj = new Date(date);
        if (isNaN(branchId) || isNaN(dateObj.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid branch_id or date format'
            });
        }
        const dayOfWeek = DAYS_OF_WEEK[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1];
        const isWorkingDay = await branch_working_days_model_1.default.isWorkingDay(branchId, dayOfWeek);
        const workingHours = await branch_working_days_model_1.default.getWorkingHours(branchId, dayOfWeek);
        return res.json({
            success: true,
            data: {
                branch_id: branchId,
                date: date,
                day_of_week: dayOfWeek,
                is_working_day: isWorkingDay,
                working_hours: workingHours
            }
        });
    }
    catch (error) {
        console.error('Check working day error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=branch-working-days.route.js.map