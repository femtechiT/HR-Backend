"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const database_1 = require("../config/database");
const leave_allocation_model_1 = __importDefault(require("../models/leave-allocation.model"));
const leave_type_model_1 = __importDefault(require("../models/leave-type.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const router = (0, express_1.Router)();
router.get('/my-allocations', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.currentUser?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID not found'
            });
        }
        const allocations = await leave_allocation_model_1.default.findByUserId(userId);
        const allocationsWithDetails = await Promise.all(allocations.map(async (allocation) => {
            const leaveType = await leave_type_model_1.default.findById(allocation.leave_type_id);
            return {
                ...allocation,
                leave_type_name: leaveType ? leaveType.name : 'Unknown',
                remaining_days: allocation.allocated_days - allocation.used_days + allocation.carried_over_days
            };
        }));
        return res.json({
            success: true,
            message: 'Your leave allocations retrieved successfully',
            data: { allocations: allocationsWithDetails }
        });
    }
    catch (error) {
        console.error('Get my leave allocations error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('leave_allocation:read'), async (req, res) => {
    try {
        const { userId, leaveTypeId, limit = 20, page = 1 } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pagination parameters'
            });
        }
        let query = `SELECT la.*, lt.name as leave_type_name, u.full_name as user_name
                 FROM leave_allocations la
                 LEFT JOIN leave_types lt ON la.leave_type_id = lt.id
                 LEFT JOIN users u ON la.user_id = u.id
                 WHERE 1=1`;
        const params = [];
        if (userId) {
            query += ' AND la.user_id = ?';
            params.push(parseInt(userId));
        }
        if (leaveTypeId) {
            query += ' AND la.leave_type_id = ?';
            params.push(parseInt(leaveTypeId));
        }
        query += ' ORDER BY la.created_at DESC';
        const offset = (pageNum - 1) * limitNum;
        query += ' LIMIT ? OFFSET ?';
        params.push(limitNum, offset);
        const [rows] = await database_1.pool.execute(query, params);
        let countQuery = `SELECT COUNT(*) as total FROM leave_allocations la WHERE 1=1`;
        const countParams = [];
        if (userId) {
            countQuery += ' AND la.user_id = ?';
            countParams.push(parseInt(userId));
        }
        if (leaveTypeId) {
            countQuery += ' AND la.leave_type_id = ?';
            countParams.push(parseInt(leaveTypeId));
        }
        const [countRows] = await database_1.pool.execute(countQuery, countParams);
        return res.json({
            success: true,
            message: 'Leave allocations retrieved successfully',
            data: {
                leaveAllocations: rows,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(countRows[0].total / limitNum),
                    totalItems: countRows[0].total,
                    itemsPerPage: limitNum
                }
            }
        });
    }
    catch (error) {
        console.error('Get leave allocations error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('leave_allocation:read'), async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const allocationId = parseInt(idStr);
        if (isNaN(allocationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid allocation ID'
            });
        }
        const allocation = await leave_allocation_model_1.default.findById(allocationId);
        if (!allocation) {
            return res.status(404).json({
                success: false,
                message: 'Leave allocation not found'
            });
        }
        return res.json({
            success: true,
            message: 'Leave allocation retrieved successfully',
            data: { leaveAllocation: allocation }
        });
    }
    catch (error) {
        console.error('Get leave allocation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('leave_allocation:create'), async (req, res) => {
    try {
        const { user_id, leave_type_id, allocated_days, cycle_start_date, cycle_end_date, carried_over_days = 0 } = req.body;
        console.log('[Leave Allocation] Creating allocation:', {
            user_id,
            leave_type_id,
            allocated_days,
            cycle_start_date,
            cycle_end_date
        });
        if (!user_id || !leave_type_id || allocated_days === undefined || !cycle_start_date || !cycle_end_date) {
            return res.status(400).json({
                success: false,
                message: 'User ID, leave type ID, allocated days, cycle start date, and cycle end date are required'
            });
        }
        const user = await user_model_1.default.findById(user_id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const leaveType = await leave_type_model_1.default.findById(leave_type_id);
        if (!leaveType) {
            return res.status(404).json({
                success: false,
                message: 'Leave type not found'
            });
        }
        const cycleYear = new Date(cycle_end_date).getFullYear();
        const existingAllocations = await leave_allocation_model_1.default.findByUserId(user_id);
        const duplicateAllocation = existingAllocations.find((alloc) => {
            const allocCycleYear = new Date(alloc.cycle_end_date).getFullYear();
            return alloc.leave_type_id === leave_type_id && allocCycleYear === cycleYear;
        });
        if (duplicateAllocation) {
            console.log('[Leave Allocation] Duplicate detected for year:', {
                user_id,
                leave_type_id,
                cycleYear,
                existingAllocation: duplicateAllocation
            });
            return res.status(409).json({
                success: false,
                message: `User already has ${leaveType.name} allocated for ${cycleYear}. Each leave type can only be allocated once per year.`
            });
        }
        const fromDate = new Date(cycle_start_date);
        const toDate = new Date(cycle_end_date);
        if (fromDate > toDate) {
            return res.status(400).json({
                success: false,
                message: 'Cycle start date cannot be after cycle end date'
            });
        }
        const allocationData = {
            user_id,
            leave_type_id,
            allocated_days,
            used_days: 0,
            carried_over_days: carried_over_days || 0,
            cycle_start_date: cycle_start_date,
            cycle_end_date: cycle_end_date
        };
        const newAllocation = await leave_allocation_model_1.default.create(allocationData);
        console.log('[Leave Allocation] Created successfully:', newAllocation.id);
        return res.status(201).json({
            success: true,
            message: 'Leave allocation created successfully',
            data: { leaveAllocation: newAllocation }
        });
    }
    catch (error) {
        console.error('[Leave Allocation] Create error:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sql: error.sql
        });
        if (error.message === 'Leave allocation already exists for this user, leave type, and cycle period') {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
            return res.status(409).json({
                success: false,
                message: 'A leave allocation already exists for this user, leave type, and cycle period'
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.put('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('leave_allocation:update'), async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const allocationId = parseInt(idStr);
        const { allocated_days, used_days, carried_over_days, cycle_start_date, cycle_end_date } = req.body;
        if (isNaN(allocationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid allocation ID'
            });
        }
        const existingAllocation = await leave_allocation_model_1.default.findById(allocationId);
        if (!existingAllocation) {
            return res.status(404).json({
                success: false,
                message: 'Leave allocation not found'
            });
        }
        const updateData = {};
        if (allocated_days !== undefined)
            updateData.allocated_days = allocated_days;
        if (used_days !== undefined)
            updateData.used_days = used_days;
        if (carried_over_days !== undefined)
            updateData.carried_over_days = carried_over_days;
        if (cycle_start_date !== undefined)
            updateData.cycle_start_date = cycle_start_date;
        if (cycle_end_date !== undefined)
            updateData.cycle_end_date = cycle_end_date;
        if (updateData.used_days !== undefined && updateData.allocated_days !== undefined) {
            if (updateData.used_days > updateData.allocated_days + (updateData.carried_over_days || existingAllocation.carried_over_days)) {
                return res.status(400).json({
                    success: false,
                    message: 'Used days cannot exceed allocated days plus carried over days'
                });
            }
        }
        else if (updateData.used_days !== undefined) {
            const totalAvailable = existingAllocation.allocated_days + (updateData.carried_over_days !== undefined ? updateData.carried_over_days : existingAllocation.carried_over_days);
            if (updateData.used_days > totalAvailable) {
                return res.status(400).json({
                    success: false,
                    message: 'Used days cannot exceed allocated days plus carried over days'
                });
            }
        }
        const updatedAllocation = await leave_allocation_model_1.default.update(allocationId, updateData);
        return res.json({
            success: true,
            message: 'Leave allocation updated successfully',
            data: { leaveAllocation: updatedAllocation }
        });
    }
    catch (error) {
        console.error('Update leave allocation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('leave_allocation:delete'), async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const allocationId = parseInt(idStr);
        if (isNaN(allocationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid allocation ID'
            });
        }
        const existingAllocation = await leave_allocation_model_1.default.findById(allocationId);
        if (!existingAllocation) {
            return res.status(404).json({
                success: false,
                message: 'Leave allocation not found'
            });
        }
        await leave_allocation_model_1.default.delete(allocationId);
        return res.json({
            success: true,
            message: 'Leave allocation deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete leave allocation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/bulk', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('leave_allocation:create'), async (req, res) => {
    try {
        const { leave_type_id, allocated_days, cycle_start_date, cycle_end_date, carried_over_days = 0, user_ids = [] } = req.body;
        if (!leave_type_id || allocated_days === undefined || !cycle_start_date || !cycle_end_date) {
            return res.status(400).json({
                success: false,
                message: 'Leave type ID, allocated days, cycle start date, and cycle end date are required'
            });
        }
        if (!Array.isArray(user_ids) || user_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one user ID must be provided'
            });
        }
        const leaveType = await leave_type_model_1.default.findById(leave_type_id);
        if (!leaveType) {
            return res.status(404).json({
                success: false,
                message: 'Leave type not found'
            });
        }
        const fromDate = new Date(cycle_start_date);
        const toDate = new Date(cycle_end_date);
        if (fromDate > toDate) {
            return res.status(400).json({
                success: false,
                message: 'Cycle start date cannot be after cycle end date'
            });
        }
        const placeholders = user_ids.map(() => '?').join(',');
        const [users] = await database_1.pool.execute(`SELECT id, full_name, email FROM users WHERE id IN (${placeholders}) AND status = 'active'`, user_ids);
        if (users.length !== user_ids.length) {
            const foundIds = users.map((u) => u.id);
            const invalidIds = user_ids.filter(id => !foundIds.includes(id));
            return res.status(400).json({
                success: false,
                message: `Invalid or inactive user IDs: ${invalidIds.join(', ')}`
            });
        }
        const allocationsData = users.map((user) => ({
            user_id: user.id,
            leave_type_id,
            allocated_days,
            cycle_start_date,
            cycle_end_date,
            carried_over_days
        }));
        const createdAllocations = await leave_allocation_model_1.default.bulkCreate(allocationsData);
        return res.status(201).json({
            success: true,
            message: `Leave allocations created successfully for ${createdAllocations.length} users`,
            data: {
                allocations: createdAllocations,
                summary: {
                    totalAllocated: createdAllocations.length,
                    leaveTypeName: leaveType.name,
                    daysPerUser: allocated_days,
                    cyclePeriod: `${cycle_start_date} to ${cycle_end_date}`
                }
            }
        });
    }
    catch (error) {
        console.error('Bulk create leave allocations error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/allocate-all', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('leave_allocation:create'), async (req, res) => {
    try {
        const { leave_type_id, allocated_days, cycle_start_date, cycle_end_date, carried_over_days = 0 } = req.body;
        if (!leave_type_id || allocated_days === undefined || !cycle_start_date || !cycle_end_date) {
            return res.status(400).json({
                success: false,
                message: 'Leave type ID, allocated days, cycle start date, and cycle end date are required'
            });
        }
        const leaveType = await leave_type_model_1.default.findById(leave_type_id);
        if (!leaveType) {
            return res.status(404).json({
                success: false,
                message: 'Leave type not found'
            });
        }
        const fromDate = new Date(cycle_start_date);
        const toDate = new Date(cycle_end_date);
        if (fromDate > toDate) {
            return res.status(400).json({
                success: false,
                message: 'Cycle start date cannot be after cycle end date'
            });
        }
        const result = await leave_allocation_model_1.default.createForAllUsers(leave_type_id, allocated_days, cycle_start_date, cycle_end_date, carried_over_days);
        return res.status(201).json({
            success: true,
            message: `Leave allocations created for ${result.success} users`,
            data: {
                allocations: result.allocations,
                summary: {
                    totalAllocated: result.success,
                    failed: result.failed,
                    leaveTypeName: leaveType.name,
                    daysPerUser: allocated_days,
                    cyclePeriod: `${cycle_start_date} to ${cycle_end_date}`
                }
            }
        });
    }
    catch (error) {
        console.error('Allocate-all leave allocations error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=leave-allocation.route.js.map