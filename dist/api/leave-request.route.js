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
const upload_middleware_1 = require("../middleware/upload.middleware");
const leave_request_model_1 = __importDefault(require("../models/leave-request.model"));
const leave_type_model_1 = __importDefault(require("../models/leave-type.model"));
const leave_allocation_model_1 = __importDefault(require("../models/leave-allocation.model"));
const attachment_service_1 = __importDefault(require("../services/attachment.service"));
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('leave:read'), async (req, res) => {
    try {
        const { userId, status, limit = 20, page = 1 } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pagination parameters'
            });
        }
        const result = await leave_request_model_1.default.findAll(userId ? parseInt(userId) : undefined, status, pageNum, limitNum);
        return res.json({
            success: true,
            message: 'Leave requests retrieved successfully',
            data: {
                leaveRequests: result.data,
                pagination: {
                    currentPage: pageNum,
                    totalPages: result.totalPages,
                    totalItems: result.total,
                    itemsPerPage: limitNum
                }
            }
        });
    }
    catch (error) {
        console.error('Get leave requests error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/my-requests', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { status, limit = 20, page = 1 } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pagination parameters'
            });
        }
        const userId = req.currentUser?.id;
        const result = await leave_request_model_1.default.findAll(userId, status, pageNum, limitNum);
        return res.json({
            success: true,
            message: 'Your leave requests retrieved successfully',
            data: {
                leaveRequests: result.data,
                pagination: {
                    currentPage: pageNum,
                    totalPages: result.totalPages,
                    totalItems: result.total,
                    itemsPerPage: limitNum
                }
            }
        });
    }
    catch (error) {
        console.error('Get my leave requests error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/balance', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.currentUser?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID not found'
            });
        }
        console.log(`[Leave Balance] Fetching balances for user ${userId}`);
        const leaveTypes = await leave_type_model_1.default.findAll();
        console.log(`[Leave Balance] Found ${leaveTypes.length} leave types`);
        const allocations = await leave_allocation_model_1.default.findByUserId(userId);
        console.log(`[Leave Balance] Found ${allocations.length} allocations for user ${userId}`);
        const [pendingRequests] = await database_1.pool.execute(`SELECT leave_type_id, SUM(days_requested) as pending_days
       FROM leave_requests
       WHERE user_id = ? AND status IN ('submitted', 'pending')
       GROUP BY leave_type_id`, [userId]);
        const pendingMap = new Map();
        pendingRequests.forEach((row) => {
            pendingMap.set(row.leave_type_id, parseFloat(row.pending_days) || 0);
        });
        console.log(`[Leave Balance] Pending requests map:`, Object.fromEntries(pendingMap));
        const balances = leaveTypes.map((leaveType) => {
            const typeAllocations = allocations.filter((alloc) => alloc.leave_type_id === leaveType.id && new Date(alloc.cycle_end_date) >= new Date());
            console.log(`[Leave Balance] Leave type "${leaveType.name}": ${typeAllocations.length} active allocations`);
            const allocation = typeAllocations[0];
            const pendingDays = pendingMap.get(leaveType.id) || 0;
            if (allocation) {
                console.log(`[Leave Balance] "${leaveType.name}" allocation:`, {
                    allocated: allocation.allocated_days,
                    used: allocation.used_days,
                    carried: allocation.carried_over_days,
                    pending: pendingDays
                });
                const totalAvailable = parseFloat(String(allocation.allocated_days)) + parseFloat(String(allocation.carried_over_days));
                const usedDays = parseFloat(String(allocation.used_days));
                const remainingDays = totalAvailable - usedDays - pendingDays;
                console.log(`[Leave Balance] "${leaveType.name}" calculation: ${totalAvailable} - ${usedDays} - ${pendingDays} = ${remainingDays}`);
                return {
                    leave_type_id: leaveType.id,
                    leave_type_name: leaveType.name,
                    allocated_days: parseFloat(String(allocation.allocated_days)),
                    used_days: parseFloat(String(allocation.used_days)),
                    carried_over_days: parseFloat(String(allocation.carried_over_days)),
                    pending_days: pendingDays,
                    remaining_days: Math.max(0, remainingDays),
                    cycle_start_date: allocation.cycle_start_date,
                    cycle_end_date: allocation.cycle_end_date
                };
            }
            else {
                console.log(`[Leave Balance] "${leaveType.name}" - No active allocation found`);
                return {
                    leave_type_id: leaveType.id,
                    leave_type_name: leaveType.name,
                    allocated_days: 0,
                    used_days: 0,
                    carried_over_days: 0,
                    pending_days: pendingDays,
                    remaining_days: 0,
                    cycle_start_date: null,
                    cycle_end_date: null
                };
            }
        });
        console.log(`[Leave Balance] Final balances:`, balances);
        return res.json({
            success: true,
            message: 'Leave balances retrieved successfully',
            data: { balances }
        });
    }
    catch (error) {
        console.error('Get leave balance error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/history', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { userId, year, status, limit = 50, page = 1 } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;
        const offset = (pageNum - 1) * limitNum;
        let query = `SELECT lh.*, lt.name as leave_type_name, u.full_name as user_name
                 FROM leave_history lh
                 JOIN leave_types lt ON lh.leave_type_id = lt.id
                 JOIN users u ON lh.user_id = u.id
                 WHERE 1=1`;
        const params = [];
        if (userId) {
            query += ' AND lh.user_id = ?';
            params.push(parseInt(userId));
        }
        if (year) {
            query += ' AND YEAR(lh.start_date) = ?';
            params.push(parseInt(year));
        }
        if (status) {
            query += ' AND lh.status = ?';
            params.push(status);
        }
        query += ' ORDER BY lh.created_at DESC LIMIT ? OFFSET ?';
        params.push(limitNum, offset);
        const [rows] = await database_1.pool.execute(query, params);
        let countQuery = `SELECT COUNT(*) as total FROM leave_history lh WHERE 1=1`;
        const countParams = [];
        if (userId) {
            countQuery += ' AND lh.user_id = ?';
            countParams.push(parseInt(userId));
        }
        if (year) {
            countQuery += ' AND YEAR(lh.start_date) = ?';
            countParams.push(parseInt(year));
        }
        if (status) {
            countQuery += ' AND lh.status = ?';
            countParams.push(status);
        }
        const [countRows] = await database_1.pool.execute(countQuery, countParams);
        return res.json({
            success: true,
            message: 'Leave history retrieved successfully',
            data: {
                leaveHistory: rows,
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
        console.error('Get leave history error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/:id', auth_middleware_1.authenticateJWT, async (req, res, next) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        if (!/^\d+$/.test(idStr)) {
            return next();
        }
        const leaveRequestId = parseInt(idStr);
        if (isNaN(leaveRequestId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid leave request ID'
            });
        }
        const leaveRequest = await leave_request_model_1.default.findById(leaveRequestId);
        if (!leaveRequest) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }
        const currentUserId = req.currentUser?.id;
        const currentUserRole = req.currentUser?.role_id;
        const isOwner = leaveRequest.user_id === currentUserId;
        const isAdmin = currentUserRole === 1 || currentUserRole === 2;
        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this leave request'
            });
        }
        return res.json({
            success: true,
            message: 'Leave request retrieved successfully',
            data: { leaveRequest }
        });
    }
    catch (error) {
        console.error('Get leave request error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/', auth_middleware_1.authenticateJWT, upload_middleware_1.upload.array('files', 5), upload_middleware_1.handleMulterError, async (req, res) => {
    try {
        const { leave_type_id, start_date, end_date, reason } = req.body;
        if (!leave_type_id || !start_date || !end_date || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Leave type ID, start date, end date, and reason are required'
            });
        }
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Attachment is required. Please upload a supporting document (PDF, JPG, PNG, DOC, or DOCX). Maximum 5 files allowed.'
            });
        }
        const startDateObj = new Date(start_date);
        const endDateObj = new Date(end_date);
        const today = new Date();
        if (startDateObj < today) {
            return res.status(400).json({
                success: false,
                message: 'Start date cannot be in the past'
            });
        }
        if (endDateObj < startDateObj) {
            return res.status(400).json({
                success: false,
                message: 'End date cannot be before start date'
            });
        }
        const userId = req.currentUser?.id;
        const leaveType = await leave_type_model_1.default.findById(leave_type_id);
        if (!leaveType) {
            return res.status(404).json({
                success: false,
                message: 'Leave type not found'
            });
        }
        const allocations = await leave_allocation_model_1.default.findByUserIdAndTypeId(userId, leave_type_id);
        if (!allocations || allocations.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No leave allocation found for this user and leave type'
            });
        }
        const allocation = allocations[0];
        const [pendingRows] = await database_1.pool.execute(`SELECT COALESCE(SUM(days_requested), 0) as pending_days
       FROM leave_requests
       WHERE user_id = ? AND leave_type_id = ? AND status IN ('submitted', 'pending') AND id != ?`, [userId, leave_type_id, -1]);
        const pendingDays = parseFloat(pendingRows[0].pending_days);
        const remainingDays = allocation.allocated_days - allocation.used_days + allocation.carried_over_days - pendingDays;
        const timeDiff = endDateObj.getTime() - startDateObj.getTime();
        const requestedDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
        if (remainingDays < requestedDays) {
            return res.status(400).json({
                success: false,
                message: `Insufficient leave balance. Requested: ${requestedDays} days, Available: ${remainingDays} days (excluding ${pendingDays} days in pending requests)`
            });
        }
        const connection = await database_1.pool.getConnection();
        try {
            await connection.beginTransaction();
            const leaveRequest = await leave_request_model_1.default.create({
                user_id: userId,
                leave_type_id,
                start_date,
                end_date,
                days_requested: requestedDays,
                reason,
                attachments: null,
                status: 'submitted'
            });
            await attachment_service_1.default.saveAttachments(files, { entityType: 'leave_request', entityId: leaveRequest.id });
            await connection.commit();
            try {
                const [approverRows] = await database_1.pool.execute(`SELECT DISTINCT u.id, u.full_name, u.email
           FROM users u
           INNER JOIN roles_permissions rp ON u.role_id = rp.role_id
           WHERE rp.permission = 'leave:approve' AND rp.allow_deny = 'allow' AND u.status = 'active'`);
                if (approverRows.length > 0) {
                    const { NotificationService } = await Promise.resolve().then(() => __importStar(require('../services/notification.service')));
                    const notificationService = new NotificationService();
                    for (const approver of approverRows) {
                        await notificationService.queueNotification(approver.id, 'leave_request_pending', {
                            approver_name: approver.full_name,
                            staff_name: req.currentUser?.full_name || 'Employee',
                            leave_type: leaveType.name,
                            start_date: start_date,
                            end_date: end_date,
                            days: requestedDays,
                            reason: reason,
                            company_name: process.env.APP_NAME || 'Our Company'
                        });
                    }
                }
            }
            catch (notificationError) {
                console.error('Error sending leave request notifications:', notificationError);
            }
            return res.status(201).json({
                success: true,
                message: 'Leave request submitted successfully',
                data: { leaveRequest }
            });
        }
        catch (transactionError) {
            await connection.rollback();
            console.error('Transaction error:', transactionError);
            throw transactionError;
        }
        finally {
            connection.release();
        }
    }
    catch (error) {
        console.error('Create leave request error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.put('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('leave:update'), async (req, res, next) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        if (!/^\d+$/.test(idStr)) {
            return next();
        }
        const leaveRequestId = parseInt(idStr);
        const { status, reason } = req.body;
        if (isNaN(leaveRequestId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid leave request ID'
            });
        }
        const existingRequest = await leave_request_model_1.default.findById(leaveRequestId);
        if (!existingRequest) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }
        if (status && !['approved', 'rejected', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }
        const isApproving = status === 'approved' && existingRequest.status !== 'approved';
        const isRefunding = existingRequest.status === 'approved' && (status === 'cancelled' || status === 'rejected');
        const connection = await database_1.pool.getConnection();
        try {
            await connection.beginTransaction();
            const updatedRequest = await leave_request_model_1.default.update(leaveRequestId, {
                status: status,
                notes: reason,
                reviewed_by: status ? req.currentUser?.id : undefined,
                reviewed_at: status ? new Date() : undefined
            }, connection);
            if (isApproving) {
                const allocations = await leave_allocation_model_1.default.findByUserIdAndTypeId(existingRequest.user_id, existingRequest.leave_type_id, connection);
                const activeAllocation = allocations.find(alloc => new Date(alloc.cycle_end_date) >= new Date());
                if (activeAllocation) {
                    await leave_allocation_model_1.default.updateUsedDays(activeAllocation.id, existingRequest.days_requested, connection);
                    const { NotificationService } = await Promise.resolve().then(() => __importStar(require('../services/notification.service')));
                    const notificationService = new NotificationService();
                    await notificationService.queueNotification(existingRequest.user_id, 'leave_request_approved', {
                        staff_name: existingRequest.user_name || 'Employee',
                        leave_type: existingRequest.leave_type_name || 'Leave',
                        start_date: existingRequest.start_date,
                        end_date: existingRequest.end_date,
                        days: existingRequest.days_requested,
                        approver_name: req.currentUser?.full_name || 'Approver',
                        approval_date: new Date().toISOString().split('T')[0],
                        request_id: existingRequest.id,
                        company_name: process.env.APP_NAME || 'Our Company'
                    });
                }
                else {
                    console.warn(`No active allocation found for user ${existingRequest.user_id}, leave type ${existingRequest.leave_type_id}. Cannot deduct days.`);
                }
            }
            if (isRefunding) {
                const allocations = await leave_allocation_model_1.default.findByUserIdAndTypeId(existingRequest.user_id, existingRequest.leave_type_id, connection);
                const activeAllocation = allocations.find(alloc => new Date(alloc.cycle_end_date) >= new Date());
                if (activeAllocation) {
                    await leave_allocation_model_1.default.updateUsedDays(activeAllocation.id, -existingRequest.days_requested, connection);
                    const { NotificationService } = await Promise.resolve().then(() => __importStar(require('../services/notification.service')));
                    const notificationService = new NotificationService();
                    const templateName = status === 'rejected' ? 'leave_request_rejected' : 'leave_request_cancelled';
                    await notificationService.queueNotification(existingRequest.user_id, templateName, {
                        staff_name: existingRequest.user_name || 'Employee',
                        leave_type: existingRequest.leave_type_name || 'Leave',
                        start_date: existingRequest.start_date,
                        end_date: existingRequest.end_date,
                        days: existingRequest.days_requested,
                        approver_name: req.currentUser?.full_name || 'Approver',
                        rejection_date: new Date().toISOString().split('T')[0],
                        rejection_reason: reason || 'No reason provided',
                        request_id: existingRequest.id,
                        company_name: process.env.APP_NAME || 'Our Company'
                    });
                }
            }
            await connection.commit();
            return res.json({
                success: true,
                message: 'Leave request updated successfully',
                data: { leaveRequest: updatedRequest }
            });
        }
        catch (transactionError) {
            await connection.rollback();
            throw transactionError;
        }
        finally {
            connection.release();
        }
    }
    catch (error) {
        console.error('Update leave request error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/:id/cancellation-eligibility', auth_middleware_1.authenticateJWT, async (req, res, next) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        if (!/^\d+$/.test(idStr)) {
            return next();
        }
        const leaveRequestId = parseInt(idStr);
        if (isNaN(leaveRequestId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid leave request ID'
            });
        }
        const existingRequest = await leave_request_model_1.default.findById(leaveRequestId);
        if (!existingRequest) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }
        const currentUserId = req.currentUser?.id;
        const currentUserRole = req.currentUser?.role_id;
        const isOwner = existingRequest.user_id === currentUserId;
        const isAdmin = currentUserRole === 1 || currentUserRole === 2;
        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this leave request'
            });
        }
        const canCancel = ['submitted', 'approved'].includes(existingRequest.status);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(existingRequest.start_date);
        startDate.setHours(0, 0, 0, 0);
        const isPastDate = startDate < today;
        const eligibility = {
            can_cancel: canCancel && !isPastDate,
            reasons: [],
            impact: {
                days_will_be_refunded: 0,
                attendance_will_be_updated: false,
                attendance_records_affected: 0,
                notification_will_be_sent: false
            }
        };
        if (!canCancel) {
            eligibility.reasons.push(`Cannot cancel leave request with status "${existingRequest.status}"`);
        }
        if (isPastDate) {
            eligibility.reasons.push('Cannot cancel leave request for dates that have already passed');
        }
        if (eligibility.can_cancel) {
            if (existingRequest.status === 'approved') {
                const allocations = await leave_allocation_model_1.default.findByUserIdAndTypeId(existingRequest.user_id, existingRequest.leave_type_id);
                const activeAllocation = allocations.find(alloc => new Date(alloc.cycle_end_date) >= new Date());
                if (activeAllocation) {
                    eligibility.impact.days_will_be_refunded = existingRequest.days_requested;
                }
                const [attendanceRecords] = await database_1.pool.execute(`SELECT COUNT(*) as count FROM attendance
           WHERE user_id = ?
             AND date BETWEEN ? AND ?
             AND status = 'leave'`, [existingRequest.user_id, existingRequest.start_date, existingRequest.end_date]);
                eligibility.impact.attendance_will_be_updated = attendanceRecords[0].count > 0;
                eligibility.impact.attendance_records_affected = attendanceRecords[0].count;
                eligibility.impact.notification_will_be_sent = true;
                eligibility.reasons.push('Cancelling approved leave will update attendance records and send notifications');
            }
            else {
                eligibility.impact.notification_will_be_sent = false;
                eligibility.reasons.push('Leave request is still pending approval');
            }
        }
        return res.json({
            success: true,
            message: 'Cancellation eligibility retrieved successfully',
            data: {
                leave_request: {
                    id: existingRequest.id,
                    leave_type: existingRequest.leave_type_name,
                    start_date: existingRequest.start_date,
                    end_date: existingRequest.end_date,
                    days_requested: existingRequest.days_requested,
                    current_status: existingRequest.status
                },
                eligibility
            }
        });
    }
    catch (error) {
        console.error('Get cancellation eligibility error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('leave:delete'), async (req, res, next) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        if (!/^\d+$/.test(idStr)) {
            return next();
        }
        const leaveRequestId = parseInt(idStr);
        if (isNaN(leaveRequestId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid leave request ID'
            });
        }
        const existingRequest = await leave_request_model_1.default.findById(leaveRequestId);
        if (!existingRequest) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }
        if (!['submitted', 'approved'].includes(existingRequest.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel leave request that is already rejected'
            });
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(existingRequest.start_date);
        startDate.setHours(0, 0, 0, 0);
        if (startDate < today) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel leave request for dates that have already passed'
            });
        }
        const { cancellation_reason } = req.body;
        const connection = await database_1.pool.getConnection();
        try {
            await connection.beginTransaction();
            await leave_request_model_1.default.update(leaveRequestId, {
                status: 'cancelled',
                notes: cancellation_reason || 'Cancelled by user',
                cancelled_by: req.currentUser?.id,
                cancelled_at: new Date(),
                cancellation_reason: cancellation_reason || null
            }, connection);
            if (existingRequest.status === 'approved') {
                const allocations = await leave_allocation_model_1.default.findByUserIdAndTypeId(existingRequest.user_id, existingRequest.leave_type_id, connection);
                const activeAllocation = allocations.find(alloc => new Date(alloc.cycle_end_date) >= new Date());
                if (activeAllocation) {
                    await leave_allocation_model_1.default.updateUsedDays(activeAllocation.id, -existingRequest.days_requested, connection);
                    console.log(`Refunded ${existingRequest.days_requested} days for user ${existingRequest.user_id}, leave type ${existingRequest.leave_type_id} (approved leave cancelled)`);
                }
                else {
                    console.warn(`No active allocation found for user ${existingRequest.user_id}, leave type ${existingRequest.leave_type_id}. Cannot refund days.`);
                }
            }
            if (existingRequest.status === 'approved') {
                const [attendanceRecords] = await connection.execute(`SELECT id, date FROM attendance
           WHERE user_id = ?
             AND date BETWEEN ? AND ?
             AND status = 'leave'`, [existingRequest.user_id, existingRequest.start_date, existingRequest.end_date]);
                for (const record of attendanceRecords) {
                    const attendanceDate = new Date(record.date);
                    const dayOfWeek = attendanceDate.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const [holidayRows] = await connection.execute(`SELECT id FROM holidays
             WHERE date = ? AND (branch_id IS NULL OR branch_id = (SELECT branch_id FROM users WHERE id = ?))`, [attendanceDate.toISOString().split('T')[0], existingRequest.user_id]);
                    const isHoliday = holidayRows.length > 0;
                    let newStatus;
                    if (isHoliday) {
                        newStatus = 'holiday';
                    }
                    else if (isWeekend) {
                        const [shiftRows] = await connection.execute(`SELECT esa.id FROM employee_shift_assignments esa
               WHERE esa.user_id = ? AND esa.status = 'active'
                 AND esa.recurrence_day_of_week = ?`, [existingRequest.user_id, ['sunday', 'saturday'][dayOfWeek === 0 ? 0 : 1]]);
                        newStatus = shiftRows.length > 0 ? 'absent' : 'holiday';
                    }
                    else {
                        newStatus = 'absent';
                    }
                    await connection.execute(`UPDATE attendance SET status = ?, notes = CONCAT(COALESCE(notes, ''), ' - Leave cancelled on ', NOW())
             WHERE id = ?`, [newStatus, record.id]);
                }
                console.log(`Updated ${attendanceRecords.length} attendance record(s) for cancelled leave`);
            }
            await connection.commit();
            if (existingRequest.status === 'approved') {
                try {
                    const { NotificationService } = await Promise.resolve().then(() => __importStar(require('../services/notification.service')));
                    const notificationService = new NotificationService();
                    await notificationService.queueNotification(existingRequest.user_id, 'leave_request_cancelled', {
                        staff_name: existingRequest.user_name || 'Employee',
                        leave_type: existingRequest.leave_type_name || 'Leave',
                        start_date: existingRequest.start_date,
                        end_date: existingRequest.end_date,
                        days: existingRequest.days_requested,
                        rejection_reason: cancellation_reason || 'Cancelled by user',
                        company_name: process.env.APP_NAME || 'Our Company'
                    });
                    console.log(`Cancellation notification sent to user ${existingRequest.user_id}`);
                }
                catch (notificationError) {
                    console.error('Error sending cancellation notification:', notificationError);
                }
            }
            return res.json({
                success: true,
                message: 'Leave request cancelled successfully',
                data: {
                    leave_request_id: leaveRequestId,
                    status: 'cancelled',
                    days_refunded: existingRequest.status === 'approved' ? existingRequest.days_requested : 0,
                    attendance_updated: existingRequest.status === 'approved'
                }
            });
        }
        catch (transactionError) {
            await connection.rollback();
            console.error('Transaction error during leave cancellation:', transactionError);
            throw transactionError;
        }
        finally {
            connection.release();
        }
    }
    catch (error) {
        console.error('Cancel leave request error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=leave-request.route.js.map