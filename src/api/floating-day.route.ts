import { Router, Request, Response } from 'express';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';
import { pool } from '../config/database';
import FloatingDayRequestModel from '../models/floating-day-request.model';
import { ShiftSchedulingService } from '../services/shift-scheduling.service';

const router = Router();

// GET /api/floating-days/my-balance — Available floating days for current user
router.get('/my-balance', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).currentUser.id;

    const [rows]: any = await pool.execute(
      `SELECT id, program_name, description, total_entitled_days, used_days, available_days, valid_from, valid_to
       FROM time_off_banks
       WHERE user_id = ? AND valid_to >= CURDATE()`,
      [userId]
    );

    return res.json({ success: true, data: { timeOffBanks: rows } });
  } catch (error) {
    console.error('Error fetching floating day balance:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/floating-days — List requests (own or all based on permission)
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).currentUser.id;
    const hasReadAll = await hasPermission(userId, 'floating_day:read');

    if (hasReadAll) {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const requests = await FloatingDayRequestModel.findAll(status);
      return res.json({ success: true, data: { requests } });
    }

    const requests = await FloatingDayRequestModel.findByUserId(userId);
    return res.json({ success: true, data: { requests } });
  } catch (error) {
    console.error('Error fetching floating day requests:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/floating-days/pending-for-me — Requests pending my clearance (manager view)
router.get('/pending-for-me', authenticateJWT, checkPermission('floating_day:clear'), async (req: Request, res: Response) => {
  try {
    const requests = await FloatingDayRequestModel.findPendingForManager();
    return res.json({ success: true, data: { requests } });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/floating-days/cleared — Cleared requests awaiting HR approval
router.get('/cleared', authenticateJWT, checkPermission('floating_day:approve'), async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.execute(
      `SELECT fdr.*, tob.program_name, u.full_name as user_name, clr.full_name as cleared_by_name
       FROM floating_day_requests fdr
       JOIN users u ON fdr.user_id = u.id
       LEFT JOIN time_off_banks tob ON fdr.time_off_bank_id = tob.id
       LEFT JOIN users clr ON fdr.cleared_by = clr.id
       WHERE fdr.status = 'cleared'
       ORDER BY fdr.cleared_at ASC`
    );
    return res.json({ success: true, data: { requests: rows } });
  } catch (error) {
    console.error('Error fetching cleared requests:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/floating-days — Create a new request
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).currentUser.id;
    const { time_off_bank_id, date, reason } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    if (!time_off_bank_id) {
      return res.status(400).json({ success: false, message: 'Day-off type (time_off_bank_id) is required' });
    }

    // Check that date is not in the past
    const dt = new Date(date + 'T00:00:00Z');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dt < today) {
      return res.status(400).json({ success: false, message: 'Cannot request a date in the past' });
    }

    // Verify the selected bank belongs to user and has available days
    const [bankRows]: any = await pool.execute(
      `SELECT id, program_name, available_days
       FROM time_off_banks
       WHERE id = ? AND user_id = ? AND valid_to >= CURDATE()`,
      [time_off_bank_id, userId]
    );

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

    // Check for existing pending/cleared/approved request on same date
    const [existing]: any = await pool.execute(
      `SELECT id FROM floating_day_requests
       WHERE user_id = ? AND date = ? AND status IN ('pending', 'cleared', 'approved')`,
      [userId, date]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You already have a request for this date'
      });
    }

    const request = await FloatingDayRequestModel.create({
      user_id: userId,
      time_off_bank_id,
      date: date,
      reason: reason || null,
      created_by: userId
    });

    // Notify managers who can clear
    try {
      const { NotificationService } = await import('../services/notification.service');
      const notificationService = new NotificationService();

      const [clearers]: any = await pool.execute(
        `SELECT DISTINCT s.reporting_manager_id as id, u.full_name
         FROM staff s
         JOIN users u ON u.id = s.reporting_manager_id
         WHERE s.user_id = ? AND s.reporting_manager_id IS NOT NULL
           AND u.status = 'active' AND u.deleted_at IS NULL
         UNION
         SELECT DISTINCT u.id, u.full_name
         FROM users u
         INNER JOIN roles_permissions rp ON u.role_id = rp.role_id
         WHERE rp.permission = 'floating_day:clear' AND rp.allow_deny = 'allow' AND u.status = 'active' AND u.deleted_at IS NULL`,
        [userId]
      );

      for (const clearer of clearers) {
        await notificationService.queueNotification(
          clearer.id,
          'leave_request_pending',
          {
            approver_name: clearer.full_name,
            staff_name: (req as any).currentUser.full_name || 'A staff member',
            leave_type: 'Floating Day Off',
            start_date: date,
            end_date: date,
            days: 1,
            reason: reason || 'Floating day off',
            company_name: process.env.APP_NAME || 'Our Company'
          },
          // No dedicated mobile "clear requests" screen exists yet — this
          // reuses leave_request_pending's template but must NOT deep-link
          // to LeaveRequestManagement (that's for leave, not floating days).
          { deepLink: { screen: 'Notifications' } }
        );
      }
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Floating day request submitted',
      data: { request }
    });
  } catch (error) {
    console.error('Error creating floating day request:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/floating-days/:id/clear — Manager clears (first approval)
router.put('/:id/clear', authenticateJWT, checkPermission('floating_day:clear'), async (req: Request, res: Response) => {
  try {
    const requestId = parseInt(req.params.id as string);
    const clearerId = (req as any).currentUser.id;
    const request = await FloatingDayRequestModel.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot clear a request with status: ${request.status}`
      });
    }

    await FloatingDayRequestModel.updateStatus(requestId, 'cleared', { cleared_by: clearerId });

    // Notify the employee
    try {
      const { NotificationService } = await import('../services/notification.service');
      const notificationService = new NotificationService();

      const [empRows]: any = await pool.execute(
        'SELECT full_name FROM users WHERE id = ?',
        [request.user_id]
      );

      const [clearerRows]: any = await pool.execute(
        'SELECT full_name FROM users WHERE id = ?',
        [clearerId]
      );

      if (empRows.length > 0) {
        await notificationService.queueNotification(
          request.user_id,
          'leave_request_pending',
          {
            approver_name: clearerRows[0]?.full_name || 'Manager',
            staff_name: empRows[0].full_name,
            leave_type: 'Floating Day Off',
            start_date: request.date instanceof Date ? request.date.toISOString().split('T')[0] : String(request.date).split('T')[0],
            end_date: request.date instanceof Date ? request.date.toISOString().split('T')[0] : String(request.date).split('T')[0],
            days: 1,
            reason: request.reason || 'Floating day off',
            company_name: process.env.APP_NAME || 'Our Company'
          },
          // This reuses leave_request_pending's template but the recipient
          // is the employee, not an approver — send them to their own
          // Time Off screen, not the leave manager screen.
          { deepLink: { screen: 'FloatingDay' } }
        );
      }
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
    }

    return res.json({ success: true, message: 'Request cleared', data: { requestId } });
  } catch (error) {
    console.error('Error clearing request:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/floating-days/:id/approve — HR approves (final approval)
router.put('/:id/approve', authenticateJWT, checkPermission('floating_day:approve'), async (req: Request, res: Response) => {
  try {
    const requestId = parseInt(req.params.id as string);
    const approverId = (req as any).currentUser.id;

    const request = await FloatingDayRequestModel.findById(requestId);
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

    // Deduct from the specific time_off_bank this request was created for
    const [bankResult]: any = await pool.execute(
      `UPDATE time_off_banks
       SET used_days = used_days + 1
       WHERE id = ? AND user_id = ? AND available_days >= 1`,
      [request.time_off_bank_id, request.user_id]
    );

    if (bankResult.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient floating day balance'
      });
    }

    // Update status to approved
    await FloatingDayRequestModel.updateStatus(requestId, 'approved', { approved_by: approverId });

    // Create day_off shift_exception
    try {
      const dateStr = request.date instanceof Date
        ? request.date.toISOString().split('T')[0]
        : String(request.date).split('T')[0];

      await pool.execute(
        `INSERT INTO shift_exceptions
         (user_id, shift_assignment_id, exception_date, exception_type, reason, approved_by, status)
         VALUES (?, NULL, ?, 'day_off', ?, ?, 'active')`,
        [request.user_id, dateStr, request.reason || 'Floating day off', approverId]
      );

      // Re-process attendance — also corrects an existing 'absent' row now that
      // this date has an approved day-off exception (see processAttendanceForDate).
      await ShiftSchedulingService.processAttendanceForDate(
        request.user_id,
        new Date(dateStr + 'T00:00:00Z')
      );
    } catch (excErr) {
      console.error('Error creating exception/processing attendance:', excErr);
    }

    // Notify the employee
    try {
      const { NotificationService } = await import('../services/notification.service');
      const notificationService = new NotificationService();

      const [empRows]: any = await pool.execute(
        'SELECT full_name FROM users WHERE id = ?',
        [request.user_id]
      );

      const [approverRows]: any = await pool.execute(
        'SELECT full_name FROM users WHERE id = ?',
        [approverId]
      );

      if (empRows.length > 0) {
        await notificationService.queueNotification(
          request.user_id,
          'leave_request_approved',
          {
            staff_name: empRows[0].full_name,
            leave_type: 'Floating Day Off',
            start_date: request.date instanceof Date ? request.date.toISOString().split('T')[0] : String(request.date).split('T')[0],
            end_date: request.date instanceof Date ? request.date.toISOString().split('T')[0] : String(request.date).split('T')[0],
            days: 1,
            approver_name: approverRows[0]?.full_name || 'HR',
            approval_date: new Date().toISOString().split('T')[0],
            request_id: String(requestId),
            company_name: process.env.APP_NAME || 'Our Company'
          },
          { deepLink: { screen: 'FloatingDay' } }
        );
      }
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
    }

    return res.json({ success: true, message: 'Request approved', data: { requestId } });
  } catch (error) {
    console.error('Error approving request:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/floating-days/:id/reject — Reject
router.put('/:id/reject', authenticateJWT, checkPermission('floating_day:reject'), async (req: Request, res: Response) => {
  try {
    const requestId = parseInt(req.params.id as string);
    const rejectorId = (req as any).currentUser.id;
    const { rejection_reason } = req.body;

    const request = await FloatingDayRequestModel.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status === 'rejected') {
      return res.status(400).json({ success: false, message: 'Already rejected' });
    }

    if (request.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Cannot reject an already approved request' });
    }

    await FloatingDayRequestModel.updateStatus(requestId, 'rejected', {
      rejected_by: rejectorId,
      rejection_reason: rejection_reason || null
    });

    // Notify the employee
    try {
      const { NotificationService } = await import('../services/notification.service');
      const notificationService = new NotificationService();

      const [empRows]: any = await pool.execute(
        'SELECT full_name FROM users WHERE id = ?',
        [request.user_id]
      );

      const [rejectorRows]: any = await pool.execute(
        'SELECT full_name FROM users WHERE id = ?',
        [rejectorId]
      );

      if (empRows.length > 0) {
        await notificationService.queueNotification(
          request.user_id,
          'leave_request_rejected',
          {
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
          },
          { deepLink: { screen: 'FloatingDay' } }
        );
      }
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
    }

    return res.json({ success: true, message: 'Request rejected', data: { requestId } });
  } catch (error) {
    console.error('Error rejecting request:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/floating-days/:id/cancel — User cancels their own request
router.put('/:id/cancel', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const requestId = parseInt(req.params.id as string);
    const userId = (req as any).currentUser.id;

    const request = await FloatingDayRequestModel.findById(requestId);
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

    await FloatingDayRequestModel.updateStatus(requestId, 'cancelled');

    return res.json({ success: true, message: 'Request cancelled', data: { requestId } });
  } catch (error) {
    console.error('Error cancelling request:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Helper — check if a user has a specific permission
async function hasPermission(userId: number, permission: string): Promise<boolean> {
  try {
    const { default: PermissionService } = await import('../services/permission.service');
    const result = await PermissionService.hasPermissionAny(userId, [permission]);
    return result.hasPermission;
  } catch {
    return false;
  }
}

export default router;
