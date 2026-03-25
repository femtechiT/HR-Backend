"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const leave_type_model_1 = __importDefault(require("../models/leave-type.model"));
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        console.log('GET /api/leave-types - Starting request');
        console.log('User info:', req.currentUser);
        console.log('Attempting to fetch all leave types...');
        const leaveTypes = await leave_type_model_1.default.findAll();
        console.log('Successfully fetched leave types:', leaveTypes.length);
        return res.json({
            success: true,
            message: 'Leave types retrieved successfully',
            data: { leaveTypes }
        });
    }
    catch (error) {
        console.error('Get leave types error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/:id', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const leaveTypeId = parseInt(idStr);
        if (isNaN(leaveTypeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid leave type ID'
            });
        }
        const leaveType = await leave_type_model_1.default.findById(leaveTypeId);
        if (!leaveType) {
            return res.status(404).json({
                success: false,
                message: 'Leave type not found'
            });
        }
        return res.json({
            success: true,
            message: 'Leave type retrieved successfully',
            data: { leaveType }
        });
    }
    catch (error) {
        console.error('Get leave type error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('leave:request'), async (req, res) => {
    try {
        const { name, days_per_year, is_paid, allow_carryover, carryover_limit, expiry_rule_id } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Leave type name is required'
            });
        }
        const existingLeaveType = await leave_type_model_1.default.findByName(name);
        if (existingLeaveType) {
            return res.status(409).json({
                success: false,
                message: 'A leave type with this name already exists'
            });
        }
        const leaveTypeData = {
            name,
            days_per_year: days_per_year || 0,
            is_paid: is_paid !== undefined ? Boolean(is_paid) : true,
            allow_carryover: allow_carryover !== undefined ? Boolean(allow_carryover) : false,
            carryover_limit: carryover_limit || 0,
            expiry_rule_id: expiry_rule_id || null,
            created_by: req.currentUser?.id || null
        };
        const newLeaveType = await leave_type_model_1.default.create(leaveTypeData);
        return res.status(201).json({
            success: true,
            message: 'Leave type created successfully',
            data: { leaveType: newLeaveType }
        });
    }
    catch (error) {
        console.error('Create leave type error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.put('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('leave:approve'), async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const leaveTypeId = parseInt(idStr);
        const { name, days_per_year, is_paid, allow_carryover, carryover_limit, expiry_rule_id, is_active } = req.body;
        if (isNaN(leaveTypeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid leave type ID'
            });
        }
        const existingLeaveType = await leave_type_model_1.default.findById(leaveTypeId);
        if (!existingLeaveType) {
            return res.status(404).json({
                success: false,
                message: 'Leave type not found'
            });
        }
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (days_per_year !== undefined)
            updateData.days_per_year = days_per_year;
        if (is_paid !== undefined)
            updateData.is_paid = Boolean(is_paid);
        if (allow_carryover !== undefined)
            updateData.allow_carryover = Boolean(allow_carryover);
        if (carryover_limit !== undefined)
            updateData.carryover_limit = carryover_limit;
        if (expiry_rule_id !== undefined)
            updateData.expiry_rule_id = expiry_rule_id;
        if (is_active !== undefined)
            updateData.is_active = Boolean(is_active);
        const updatedLeaveType = await leave_type_model_1.default.update(leaveTypeId, updateData);
        return res.json({
            success: true,
            message: 'Leave type updated successfully',
            data: { leaveType: updatedLeaveType }
        });
    }
    catch (error) {
        console.error('Update leave type error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('leave:approve'), async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const leaveTypeId = parseInt(idStr);
        if (isNaN(leaveTypeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid leave type ID'
            });
        }
        const deleted = await leave_type_model_1.default.deactivate(leaveTypeId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Leave type not found'
            });
        }
        return res.json({
            success: true,
            message: 'Leave type deactivated successfully'
        });
    }
    catch (error) {
        console.error('Deactivate leave type error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=leave-type.route.js.map