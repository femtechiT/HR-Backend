"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteShiftException = exports.updateShiftException = exports.getShiftExceptionById = exports.getMyShiftExceptions = exports.getAllShiftExceptions = exports.createShiftException = void 0;
const shift_exception_model_1 = __importDefault(require("../models/shift-exception.model"));
const staff_model_1 = __importDefault(require("../models/staff.model"));
class ShiftExceptionController {
    static async create(req, res) {
        try {
            const { user_id, exception_date, exception_type, new_start_time, new_end_time, new_break_duration_minutes, reason, is_recurring, day_of_week, end_date } = req.body;
            if (!user_id || !exception_date || !exception_type) {
                return res.status(400).json({
                    success: false,
                    message: 'user_id, exception_date, and exception_type are required'
                });
            }
            const staff = await staff_model_1.default.findByUserId(user_id);
            if (!staff) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found or does not have a staff record'
                });
            }
            const exceptionData = {
                user_id,
                exception_date: new Date(exception_date),
                exception_type,
                new_start_time: new_start_time || null,
                new_end_time: new_end_time || null,
                new_break_duration_minutes: new_break_duration_minutes || 0,
                reason: reason || null,
                created_by: req.currentUser?.id || user_id,
                status: 'active'
            };
            const newException = await shift_exception_model_1.default.create(exceptionData);
            return res.status(201).json({
                success: true,
                message: 'Shift exception created successfully',
                data: { exception: newException }
            });
        }
        catch (error) {
            console.error('Create shift exception error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    static async getAll(req, res) {
        try {
            const { startDate, endDate, userId } = req.query;
            let exceptions;
            if (userId) {
                const userIdNum = parseInt(userId);
                if (startDate && endDate) {
                    exceptions = await shift_exception_model_1.default.findByDateRange(userIdNum, new Date(startDate), new Date(endDate));
                }
                else {
                    exceptions = await shift_exception_model_1.default.findByUserId(userIdNum);
                }
            }
            else {
                exceptions = await shift_exception_model_1.default.findAll();
            }
            return res.status(200).json({
                success: true,
                data: { exceptions }
            });
        }
        catch (error) {
            console.error('Get all shift exceptions error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    static async getMyShiftExceptions(req, res) {
        try {
            const userId = req.currentUser?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - User ID not found'
                });
            }
            const { startDate, endDate } = req.query;
            let exceptions;
            if (startDate && endDate) {
                exceptions = await shift_exception_model_1.default.findByDateRange(userId, new Date(startDate), new Date(endDate));
            }
            else {
                exceptions = await shift_exception_model_1.default.findByUserId(userId);
            }
            return res.status(200).json({
                success: true,
                data: { exceptions }
            });
        }
        catch (error) {
            console.error('Get my shift exceptions error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    static async getById(req, res) {
        try {
            const id = parseInt(req.params.id);
            const exception = await shift_exception_model_1.default.findById(id);
            if (!exception) {
                return res.status(404).json({
                    success: false,
                    message: 'Shift exception not found'
                });
            }
            return res.status(200).json({
                success: true,
                data: { exception }
            });
        }
        catch (error) {
            console.error('Get shift exception error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    static async update(req, res) {
        try {
            const id = parseInt(req.params.id);
            const updateData = req.body;
            const existingException = await shift_exception_model_1.default.findById(id);
            if (!existingException) {
                return res.status(404).json({
                    success: false,
                    message: 'Shift exception not found'
                });
            }
            const updatedException = await shift_exception_model_1.default.update(id, updateData);
            return res.status(200).json({
                success: true,
                message: 'Shift exception updated successfully',
                data: { exception: updatedException }
            });
        }
        catch (error) {
            console.error('Update shift exception error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    static async delete(req, res) {
        try {
            const id = parseInt(req.params.id);
            const existingException = await shift_exception_model_1.default.findById(id);
            if (!existingException) {
                return res.status(404).json({
                    success: false,
                    message: 'Shift exception not found'
                });
            }
            await shift_exception_model_1.default.delete(id);
            return res.status(200).json({
                success: true,
                message: 'Shift exception deleted successfully'
            });
        }
        catch (error) {
            console.error('Delete shift exception error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
exports.createShiftException = ShiftExceptionController.create, exports.getAllShiftExceptions = ShiftExceptionController.getAll, exports.getMyShiftExceptions = ShiftExceptionController.getMyShiftExceptions, exports.getShiftExceptionById = ShiftExceptionController.getById, exports.updateShiftException = ShiftExceptionController.update, exports.deleteShiftException = ShiftExceptionController.delete;
exports.default = ShiftExceptionController;
//# sourceMappingURL=shift-exception.controller.js.map