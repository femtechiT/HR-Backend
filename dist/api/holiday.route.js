"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const holiday_model_1 = __importDefault(require("../models/holiday.model"));
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('holiday:read'), async (req, res) => {
    try {
        const { branchId, date, startDate, endDate } = req.query;
        let holidays;
        if (startDate && endDate) {
            const startDateVal = Array.isArray(startDate) ? startDate[0] : startDate;
            const endDateVal = Array.isArray(endDate) ? endDate[0] : endDate;
            const branchIdVal = Array.isArray(branchId) ? branchId[0] : branchId;
            const startDateStr = typeof startDateVal === 'string' ? startDateVal : '';
            const endDateStr = typeof endDateVal === 'string' ? endDateVal : '';
            const branchIdStr = typeof branchIdVal === 'string' ? branchIdVal : '';
            holidays = await holiday_model_1.default.getHolidaysInRange(new Date(startDateStr), new Date(endDateStr), branchIdStr ? parseInt(branchIdStr) : undefined);
        }
        else if (branchId) {
            const branchIdVal = Array.isArray(branchId) ? branchId[0] : branchId;
            const branchIdStr = typeof branchIdVal === 'string' ? branchIdVal : '';
            holidays = await holiday_model_1.default.findByBranch(parseInt(branchIdStr));
        }
        else if (date) {
            const dateVal = Array.isArray(date) ? date[0] : date;
            const dateStr = typeof dateVal === 'string' ? dateVal : '';
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
router.get('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('holiday:read'), async (req, res) => {
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
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('holiday:create'), async (req, res) => {
    try {
        const { holiday_name, date, branch_id, is_mandatory, description } = req.body;
        if (!holiday_name || !date) {
            return res.status(400).json({
                success: false,
                message: 'Holiday name and date are required'
            });
        }
        const holidayData = {
            holiday_name,
            date: new Date(date),
            branch_id: branch_id || null,
            is_mandatory: is_mandatory !== undefined ? Boolean(is_mandatory) : true,
            description: description || null,
            created_by: req.currentUser?.id || null
        };
        const newHoliday = await holiday_model_1.default.create(holidayData);
        return res.status(201).json({
            success: true,
            message: 'Holiday created successfully',
            data: { holiday: newHoliday }
        });
    }
    catch (error) {
        console.error('Create holiday error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.put('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('holiday:update'), async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const holidayId = parseInt(idStr);
        const { holiday_name, date, branch_id, is_mandatory, description } = req.body;
        if (isNaN(holidayId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid holiday ID'
            });
        }
        const existingHoliday = await holiday_model_1.default.findById(holidayId);
        if (!existingHoliday) {
            return res.status(404).json({
                success: false,
                message: 'Holiday not found'
            });
        }
        const updateData = {};
        if (holiday_name !== undefined)
            updateData.holiday_name = holiday_name;
        if (date !== undefined)
            updateData.date = new Date(date);
        if (branch_id !== undefined)
            updateData.branch_id = branch_id;
        if (is_mandatory !== undefined)
            updateData.is_mandatory = Boolean(is_mandatory);
        if (description !== undefined)
            updateData.description = description;
        const updatedHoliday = await holiday_model_1.default.update(holidayId, updateData);
        return res.json({
            success: true,
            message: 'Holiday updated successfully',
            data: { holiday: updatedHoliday }
        });
    }
    catch (error) {
        console.error('Update holiday error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('holiday:delete'), async (req, res) => {
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
        const deleted = await holiday_model_1.default.delete(holidayId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Holiday not found'
            });
        }
        return res.json({
            success: true,
            message: 'Holiday deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete holiday error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=holiday.route.js.map