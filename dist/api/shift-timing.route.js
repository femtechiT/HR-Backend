"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const shift_timing_model_1 = __importDefault(require("../models/shift-timing.model"));
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('shift_timing:read'), async (req, res) => {
    try {
        const shiftTimings = await shift_timing_model_1.default.findAll();
        return res.json({
            success: true,
            message: 'Shift timings retrieved successfully',
            data: { shiftTimings }
        });
    }
    catch (error) {
        console.error('Get shift timings error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('shift_timing:read'), async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const shiftTimingId = parseInt(idStr);
        if (isNaN(shiftTimingId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid shift timing ID'
            });
        }
        const shiftTiming = await shift_timing_model_1.default.findById(shiftTimingId);
        if (!shiftTiming) {
            return res.status(404).json({
                success: false,
                message: 'Shift timing not found'
            });
        }
        return res.json({
            success: true,
            message: 'Shift timing retrieved successfully',
            data: { shiftTiming }
        });
    }
    catch (error) {
        console.error('Get shift timing error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('shift:create'), async (req, res) => {
    try {
        const { user_id, shift_name, start_time, end_time, effective_from, effective_to, override_branch_id } = req.body;
        if (!shift_name || !start_time || !end_time || !effective_from) {
            return res.status(400).json({
                success: false,
                message: 'Shift name, start time, end time, and effective from are required'
            });
        }
        const shiftTimingData = {
            user_id: user_id || null,
            shift_name,
            start_time,
            end_time,
            effective_from: new Date(effective_from),
            effective_to: effective_to ? new Date(effective_to) : null,
            override_branch_id: override_branch_id || null
        };
        const newShiftTiming = await shift_timing_model_1.default.create(shiftTimingData);
        return res.status(201).json({
            success: true,
            message: 'Shift timing created successfully',
            data: { shiftTiming: newShiftTiming }
        });
    }
    catch (error) {
        console.error('Create shift timing error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.put('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('shift:update'), async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const shiftTimingId = parseInt(idStr);
        const { shift_name, start_time, end_time, effective_from, effective_to, override_branch_id } = req.body;
        if (isNaN(shiftTimingId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid shift timing ID'
            });
        }
        const existingShiftTiming = await shift_timing_model_1.default.findById(shiftTimingId);
        if (!existingShiftTiming) {
            return res.status(404).json({
                success: false,
                message: 'Shift timing not found'
            });
        }
        const updateData = {};
        if (shift_name !== undefined)
            updateData.shift_name = shift_name;
        if (start_time !== undefined)
            updateData.start_time = start_time;
        if (end_time !== undefined)
            updateData.end_time = end_time;
        if (effective_from !== undefined)
            updateData.effective_from = new Date(effective_from);
        if (effective_to !== undefined)
            updateData.effective_to = effective_to ? new Date(effective_to) : null;
        if (override_branch_id !== undefined)
            updateData.override_branch_id = override_branch_id;
        const updatedShiftTiming = await shift_timing_model_1.default.update(shiftTimingId, updateData);
        return res.json({
            success: true,
            message: 'Shift timing updated successfully',
            data: { shiftTiming: updatedShiftTiming }
        });
    }
    catch (error) {
        console.error('Update shift timing error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('shift:delete'), async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const shiftTimingId = parseInt(idStr);
        if (isNaN(shiftTimingId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid shift timing ID'
            });
        }
        const deleted = await shift_timing_model_1.default.delete(shiftTimingId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Shift timing not found'
            });
        }
        return res.json({
            success: true,
            message: 'Shift timing deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete shift timing error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=shift-timing.route.js.map