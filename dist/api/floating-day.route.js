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
const database_1 = require("../config/database");
const floating_day_request_model_1 = __importDefault(require("../models/floating-day-request.model"));
const shift_scheduling_service_1 = require("../services/shift-scheduling.service");
const router = (0, express_1.Router)();
router.get('/my-balance', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.currentUser.id;
        const [rows] = await database_1.pool.execute(`SELECT id, program_name, description, total_entitled_days, used_days, available_days, valid_from, valid_to
       FROM time_off_banks
       WHERE user_id = ? AND valid_to >= CURDATE()`, [userId]);
        return res.json({ success: true, data: { timeOffBanks: rows } });
    }
    catch (error) {
        console.error('Error fetching floating day balance:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.get('/', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.currentUser.id;
        const hasReadAll = await hasPermission(userId, 'floating_day:read');
        if (hasReadAll) {
            const status = typeof req.query.status === 'string' ? req.query.status : undefined;
            const requests = await floating_day_request_model_1.default.findAll(status);
            return res.json({ success: true, data: { requests } });
        }
        const requests = await floating_day_request_model_1.default.findByUserId(userId);
        return res.json({ success: true, data: { requests } });
    }
    catch (error) {
        console.error('Error fetching floating day requests:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.get('/pending-for-me', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('floating_day:clear'), async (req, res) => {
    try {
        const requests = await floating_day_request_model_1.default.findPendingForManager();
        return res.json({ success: true, data: { requests } });
    }
    catch (error) {
        console.error('Error fetching pending requests:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.get('/cleared', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('floating_day:approve'), async (req, res) => {
    try {
        const [rows] = await database_1.pool.execute(`SELECT fdr.*, tob.program_name, u.full_name as user_name, clr.full_name as cleared_by_name
       FROM floating_day_requests fdr
       JOIN users u ON fdr.user_id = u.id
       LEFT JOIN time_off_banks tob ON fdr.time_off_bank_id = tob.id
       LEFT JOIN users clr ON fdr.cleared_by = clr.id
       WHERE fdr.status = 'cleared'
       ORDER BY fdr.cleared_at ASC`);
        return res.json({ success: true, data: { requests: rows } });
    }
    catch (error) {
        console.error('Error fetching cleared requests:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.post('/', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.currentUser.id;
        const { time_off_bank_id, date, reason } = req.body;
        if (!date) {
            return res.status(400).json({ success: false, message: 'Date is required' });
        }
        if (!time_off_bank_id) {
            return res.status(400).json({ success: false, message: 'Day-off type (time_off_bank_id) is required' });
        }
        const dt = new Date(date + 'T00:00:00Z');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dt < today) {
            return res.status(400).json({ success: false, message: 'Cannot request a date in the past' });
        }
        const [bankRows] = await database_1.pool.execute(`SELECT id, program_name, available_days
       FROM time_off_banks
       WHERE id = ? AND user_id = ? AND valid_to >= CURDATE()`, [time_off_bank_id, userId]);
        if (bankRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Selected day-off type not found or expired'
            });
        }
        if (Number(bankRows[0].available_days) < 1) {
            return res.status(400).json({
                success: false,
                message: `No days available for ${bankRows[0].program_name}`
            });
        }
        const [existing] = await database_1.pool.execute(`SELECT id FROM floating_day_requests
       WHERE user_id = ? AND date = ? AND status IN ('pending', 'cleared', 'approved')`, [userId, date]);
        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'You already have a request for this date'
            });
        }
        const request = await floating_day_request_model_1.default.create({
            user_id: userId,
            time_off_bank_id,
            date: date,
            reason: reason || null,
            created_by: userId
        });
        try {
            const { NotificationService } = await Promise.resolve().then(() => __importStar(require('../services/notification.service')));
            const notificationService = new NotificationService();
            const [clearers] = await database_1.pool.execute(`SELECT DISTINCT s.reporting_manager_id as id, u.full_name
         FROM staff s
         JOIN users u ON u.id = s.reporting_manager_id
         WHERE s.user_id = ? AND s.reporting_manager_id IS NOT NULL
           AND u.status = 'active' AND u.deleted_at IS NULL
         UNION
         SELECT DISTINCT u.id, u.full_name
         FROM users u
         INNER JOIN roles_permissions rp ON u.role_id = rp.role_id
         WHERE rp.permission = 'floating_day:clear' AND rp.allow_deny = 'allow' AND u.status = 'active' AND u.deleted_at IS NULL`, [userId]);
            for (const clearer of clearers) {
                await notificationService.queueNotification(clearer.id, 'leave_request_pending', {
                    approver_name: clearer.full_name,
                    staff_name: req.currentUser.full_name || 'A staff member',
                    leave_type: 'Floating Day Off',
                    start_date: date,
                    end_date: date,
                    days: 1,
                    reason: reason || 'Floating day off',
                    company_name: process.env.APP_NAME || 'Our Company'
                }, { deepLink: { screen: 'Notifications' } });
            }
        }
        catch (notifErr) {
            console.error('Notification error:', notifErr);
        }
        return res.status(201).json({
            success: true,
            message: 'Floating day request submitted',
            data: { request }
        });
    }
    catch (error) {
        console.error('Error creating floating day request:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.put('/:id/clear', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('floating_day:clear'), async (req, res) => {
    try {
        const requestId = parseInt(req.params.id);
        const clearerId = req.currentUser.id;
        const request = await floating_day_request_model_1.default.findById(requestId);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot clear a request with status: ${request.status}`
            });
        }
        await floating_day_request_model_1.default.updateStatus(requestId, 'cleared', { cleared_by: clearerId });
        try {
            const { NotificationService } = await Promise.resolve().then(() => __importStar(require('../services/notification.service')));
            const notificationService = new NotificationService();
            const [empRows] = await database_1.pool.execute('SELECT full_name FROM users WHERE id = ?', [request.user_id]);
            const [clearerRows] = await database_1.pool.execute('SELECT full_name FROM users WHERE id = ?', [clearerId]);
            if (empRows.length > 0) {
                await notificationService.queueNotification(request.user_id, 'leave_request_pending', {
                    approver_name: clearerRows[0]?.full_name || 'Manager',
                    staff_name: empRows[0].full_name,
                    leave_type: 'Floating Day Off',
                    start_date: request.date instanceof Date ? request.date.toISOString().split('T')[0] : String(request.date).split('T')[0],
                    end_date: request.date instanceof Date ? request.date.toISOString().split('T')[0] : String(request.date).split('T')[0],
                    days: 1,
                    reason: request.reason || 'Floating day off',
                    company_name: process.env.APP_NAME || 'Our Company'
                }, { deepLink: { screen: 'FloatingDay' } });
            }
        }
        catch (notifErr) {
            console.error('Notification error:', notifErr);
        }
        return res.json({ success: true, message: 'Request cleared', data: { requestId } });
    }
    catch (error) {
        console.error('Error clearing request:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.put('/:id/approve', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('floating_day:approve'), async (req, res) => {
    try {
        const requestId = parseInt(req.params.id);
        const approverId = req.currentUser.id;
        const request = await floating_day_request_model_1.default.findById(requestId);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        if (request.status === 'approved') {
            return res.status(400).json({ success: false, message: 'Already approved' });
        }
        if (request.status !== 'cleared' && request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot approve a request with status: ${request.status}`
            });
        }
        const [bankResult] = await database_1.pool.execute(`UPDATE time_off_banks
       SET used_days = used_days + 1
       WHERE id = ? AND user_id = ? AND available_days >= 1`, [request.time_off_bank_id, request.user_id]);
        if (bankResult.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient floating day balance'
            });
        }
        await floating_day_request_model_1.default.updateStatus(requestId, 'approved', { approved_by: approverId });
        try {
            const dateStr = request.date instanceof Date
                ? request.date.toISOString().split('T')[0]
                : String(request.date).split('T')[0];
            await database_1.pool.execute(`INSERT INTO shift_exceptions
         (user_id, shift_assignment_id, exception_date, exception_type, reason, approved_by, status)
         VALUES (?, NULL, ?, 'day_off', ?, ?, 'active')`, [request.user_id, dateStr, request.reason || 'Floating day off', approverId]);
            await shift_scheduling_service_1.ShiftSchedulingService.processAttendanceForDate(request.user_id, new Date(dateStr + 'T00:00:00Z'));
        }
        catch (excErr) {
            console.error('Error creating exception/processing attendance:', excErr);
        }
        try {
            const { NotificationService } = await Promise.resolve().then(() => __importStar(require('../services/notification.service')));
            const notificationService = new NotificationService();
            const [empRows] = await database_1.pool.execute('SELECT full_name FROM users WHERE id = ?', [request.user_id]);
            const [approverRows] = await database_1.pool.execute('SELECT full_name FROM users WHERE id = ?', [approverId]);
            if (empRows.length > 0) {
                await notificationService.queueNotification(request.user_id, 'leave_request_approved', {
                    staff_name: empRows[0].full_name,
                    leave_type: 'Floating Day Off',
                    start_date: request.date instanceof Date ? request.date.toISOString().split('T')[0] : String(request.date).split('T')[0],
                    end_date: request.date instanceof Date ? request.date.toISOString().split('T')[0] : String(request.date).split('T')[0],
                    days: 1,
                    approver_name: approverRows[0]?.full_name || 'HR',
                    approval_date: new Date().toISOString().split('T')[0],
                    request_id: String(requestId),
                    company_name: process.env.APP_NAME || 'Our Company'
                }, { deepLink: { screen: 'FloatingDay' } });
            }
        }
        catch (notifErr) {
            console.error('Notification error:', notifErr);
        }
        return res.json({ success: true, message: 'Request approved', data: { requestId } });
    }
    catch (error) {
        console.error('Error approving request:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.put('/:id/reject', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('floating_day:reject'), async (req, res) => {
    try {
        const requestId = parseInt(req.params.id);
        const rejectorId = req.currentUser.id;
        const { rejection_reason } = req.body;
        const request = await floating_day_request_model_1.default.findById(requestId);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        if (request.status === 'rejected') {
            return res.status(400).json({ success: false, message: 'Already rejected' });
        }
        if (request.status === 'approved') {
            return res.status(400).json({ success: false, message: 'Cannot reject an already approved request' });
        }
        await floating_day_request_model_1.default.updateStatus(requestId, 'rejected', {
            rejected_by: rejectorId,
            rejection_reason: rejection_reason || null
        });
        try {
            const { NotificationService } = await Promise.resolve().then(() => __importStar(require('../services/notification.service')));
            const notificationService = new NotificationService();
            const [empRows] = await database_1.pool.execute('SELECT full_name FROM users WHERE id = ?', [request.user_id]);
            const [rejectorRows] = await database_1.pool.execute('SELECT full_name FROM users WHERE id = ?', [rejectorId]);
            if (empRows.length > 0) {
                await notificationService.queueNotification(request.user_id, 'leave_request_rejected', {
                    staff_name: empRows[0].full_name,
                    leave_type: 'Floating Day Off',
                    start_date: request.date instanceof Date ? request.date.toISOString().split('T')[0] : String(request.date).split('T')[0],
                    end_date: request.date instanceof Date ? request.date.toISOString().split('T')[0] : String(request.date).split('T')[0],
                    days: 1,
                    approver_name: rejectorRows[0]?.full_name || 'HR',
                    rejection_date: new Date().toISOString().split('T')[0],
                    rejection_reason: rejection_reason || 'No reason provided',
                    request_id: String(requestId),
                    company_name: process.env.APP_NAME || 'Our Company'
                }, { deepLink: { screen: 'FloatingDay' } });
            }
        }
        catch (notifErr) {
            console.error('Notification error:', notifErr);
        }
        return res.json({ success: true, message: 'Request rejected', data: { requestId } });
    }
    catch (error) {
        console.error('Error rejecting request:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.put('/:id/cancel', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const requestId = parseInt(req.params.id);
        const userId = req.currentUser.id;
        const request = await floating_day_request_model_1.default.findById(requestId);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        if (request.user_id !== userId) {
            const hasApprove = await hasPermission(userId, 'floating_day:approve');
            if (!hasApprove) {
                return res.status(403).json({ success: false, message: 'Unauthorized' });
            }
        }
        if (request.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Already cancelled' });
        }
        if (request.status === 'approved') {
            return res.status(400).json({ success: false, message: 'Cannot cancel an approved request' });
        }
        await floating_day_request_model_1.default.updateStatus(requestId, 'cancelled');
        return res.json({ success: true, message: 'Request cancelled', data: { requestId } });
    }
    catch (error) {
        console.error('Error cancelling request:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
async function hasPermission(userId, permission) {
    try {
        const { default: PermissionService } = await Promise.resolve().then(() => __importStar(require('../services/permission.service')));
        const result = await PermissionService.hasPermissionAny(userId, [permission]);
        return result.hasPermission;
    }
    catch {
        return false;
    }
}
exports.default = router;
//# sourceMappingURL=floating-day.route.js.map