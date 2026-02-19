import { Router, Request, Response } from 'express';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';
import FormSubmissionModel from '../models/form-submission.model';
import LeaveTypeModel from '../models/leave-type.model';
import LeaveAllocationModel from '../models/leave-allocation.model';
import UserModel from '../models/user.model';
import { pool } from '../config/database';

const router = Router();

// GET /api/leave - Get all leave requests (with filters)
router.get('/', authenticateJWT, checkPermission('leave:read'), async (req: Request, res: Response) => {
  try {
    const {
      userId,
      status,
      limit = 20,
      page = 1
    } = req.query;

    // Validate pagination parameters
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters'
      });
    }

    // Find the "Leave Request" form to get its ID
    const [leaveRequestForms]: any = await pool.execute(
      `SELECT id FROM forms WHERE name = 'Leave Request' OR form_type = 'leave_request' LIMIT 1`
    );

    if (leaveRequestForms.length === 0) {
      return res.json({
        success: true,
        message: 'Leave requests retrieved successfully',
        data: {
          leaveRequests: [],
          pagination: {
            currentPage: pageNum,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limitNum
          }
        }
      });
    }

    const leaveFormId = leaveRequestForms[0].id;

    // Build query based on filters
    let query = `SELECT fs.*, u.full_name as user_name, f.name as form_name
                 FROM form_submissions fs
                 JOIN users u ON fs.user_id = u.id
                 JOIN forms f ON fs.form_id = f.id
                 WHERE fs.form_id = ?`;
    const params: any[] = [leaveFormId];

    if (userId) {
      query += ' AND fs.user_id = ?';
      params.push(parseInt(userId as string));
    }

    if (status) {
      query += ' AND fs.status = ?';
      params.push(status as string);
    }

    query += ' ORDER BY fs.submitted_at DESC';

    // Add pagination
    const offset = (pageNum - 1) * limitNum;
    query += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    // Get the submissions
    const [rows]: any = await pool.execute(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM form_submissions fs WHERE fs.form_id = ?`;
    const countParams = [leaveFormId];

    if (userId) {
      countQuery += ' AND fs.user_id = ?';
      countParams.push(parseInt(userId as string));
    }

    if (status) {
      countQuery += ' AND fs.status = ?';
      countParams.push(status as string);
    }

    const [countRows]: any = await pool.execute(countQuery, countParams);

    return res.json({
      success: true,
      message: 'Leave requests retrieved successfully',
      data: {
        leaveRequests: rows,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(countRows[0].total / limitNum),
          totalItems: countRows[0].total,
          itemsPerPage: limitNum
        }
      }
    });
  } catch (error) {
    console.error('Get leave requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/leave/my-requests - Get current user's own leave requests (no special permission needed)
router.get('/my-requests', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const {
      status,
      limit = 20,
      page = 1
    } = req.query;

    // Validate pagination parameters
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters'
      });
    }

    const userId = req.currentUser?.id;

    // Find the "Leave Request" form to get its ID
    const [leaveRequestForms]: any = await pool.execute(
      `SELECT id FROM forms WHERE name = 'Leave Request' OR form_type = 'leave_request' LIMIT 1`
    );

    if (leaveRequestForms.length === 0) {
      return res.json({
        success: true,
        message: 'Leave requests retrieved successfully',
        data: {
          leaveRequests: [],
          pagination: {
            currentPage: pageNum,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limitNum
          }
        }
      });
    }

    const leaveFormId = leaveRequestForms[0].id;

    // Build query for current user's submissions only
    let query = `SELECT fs.*, u.full_name as user_name, f.name as form_name
                 FROM form_submissions fs
                 JOIN users u ON fs.user_id = u.id
                 JOIN forms f ON fs.form_id = f.id
                 WHERE fs.form_id = ? AND fs.user_id = ?`;
    const params: any[] = [leaveFormId, userId];

    if (status) {
      query += ' AND fs.status = ?';
      params.push(status as string);
    }

    query += ' ORDER BY fs.submitted_at DESC';

    // Add pagination
    const offset = (pageNum - 1) * limitNum;
    query += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    // Get the submissions
    const [rows]: any = await pool.execute(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM form_submissions fs WHERE fs.form_id = ? AND fs.user_id = ?`;
    const countParams = [leaveFormId, userId];

    if (status) {
      countQuery += ' AND fs.status = ?';
      countParams.push(status as string);
    }

    const [countRows]: any = await pool.execute(countQuery, countParams);

    return res.json({
      success: true,
      message: 'Your leave requests retrieved successfully',
      data: {
        leaveRequests: rows,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(countRows[0].total / limitNum),
          totalItems: countRows[0].total,
          itemsPerPage: limitNum
        }
      }
    });
  } catch (error) {
    console.error('Get my leave requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/leave/balance - Get current user's leave balances by leave type (no special permission needed)
router.get('/balance', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found'
      });
    }

    // Get all active leave types
    const leaveTypes = await LeaveTypeModel.findAll();

    // Get all allocations for this user
    const allocations = await LeaveAllocationModel.findByUserId(userId);

    // Calculate balance for each leave type
    const balances = leaveTypes.map((leaveType) => {
      // Find allocations for this leave type
      const typeAllocations = allocations.filter(
        (alloc) => alloc.leave_type_id === leaveType.id && new Date(alloc.cycle_end_date) >= new Date()
      );

      // Use the most recent allocation (first one since it's ordered by cycle_start_date DESC)
      const allocation = typeAllocations[0];

      if (allocation) {
        const remainingDays = allocation.allocated_days - allocation.used_days + allocation.carried_over_days;
        return {
          leave_type_id: leaveType.id,
          leave_type_name: leaveType.name,
          allocated_days: allocation.allocated_days,
          used_days: allocation.used_days,
          carried_over_days: allocation.carried_over_days,
          remaining_days: remainingDays,
          cycle_start_date: allocation.cycle_start_date,
          cycle_end_date: allocation.cycle_end_date
        };
      } else {
        return {
          leave_type_id: leaveType.id,
          leave_type_name: leaveType.name,
          allocated_days: 0,
          used_days: 0,
          carried_over_days: 0,
          remaining_days: 0,
          cycle_start_date: null,
          cycle_end_date: null
        };
      }
    });

    return res.json({
      success: true,
      message: 'Leave balances retrieved successfully',
      data: { balances }
    });
  } catch (error) {
    console.error('Get leave balance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/leave/:id - Get specific leave request
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const leaveRequestId = parseInt(idStr as string);

    if (isNaN(leaveRequestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave request ID'
      });
    }

    const leaveRequest = await FormSubmissionModel.findById(leaveRequestId);

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check if user can access this leave request (owner or has admin permission)
    const currentUserId = req.currentUser?.id;
    const currentUserRole = req.currentUser?.role_id;

    // Allow access if: user is the owner, or user is admin (role 1 or 2)
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
  } catch (error) {
    console.error('Get leave request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/leave - Create new leave request
router.post('/', authenticateJWT, checkPermission('leave:create'), async (req: Request, res: Response) => {
  try {
    const { 
      leave_type_id, 
      start_date, 
      end_date, 
      reason, 
      attachments 
    } = req.body;

    // Validate required fields
    if (!leave_type_id || !start_date || !end_date || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Leave type ID, start date, end date, and reason are required'
      });
    }

    // Validate dates
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

    // Check if user has sufficient leave balance
    const leaveType = await LeaveTypeModel.findById(leave_type_id);
    
    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: 'Leave type not found'
      });
    }

    // Check leave allocation for this user
    const allocations = await LeaveAllocationModel.findByUserIdAndTypeId(userId!, leave_type_id);

    if (!allocations || allocations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No leave allocation found for this user and leave type'
      });
    }

    // Use the first allocation (most recent based on ordering in the model)
    const allocation = allocations[0];

    // Calculate remaining days for this allocation
    const remainingDays = allocation.allocated_days - allocation.used_days + allocation.carried_over_days;

    // Calculate requested days
    const timeDiff = endDateObj.getTime() - startDateObj.getTime();
    const requestedDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // Include both start and end date

    // Check if user has enough balance
    if (remainingDays < requestedDays) {
      return res.status(400).json({
        success: false,
        message: `Insufficient leave balance. Requested: ${requestedDays} days, Available: ${remainingDays} days`
      });
    }

    // Find the "Leave Request" form to submit to
    const [leaveRequestForms]: any = await pool.execute(
      `SELECT id FROM forms WHERE name = 'Leave Request' OR form_type = 'leave_request' LIMIT 1`
    );

    if (leaveRequestForms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leave Request form not found. Please contact system administrator.'
      });
    }

    const leaveFormId = leaveRequestForms[0].id;

    // Create form submission for the leave request
    const formSubmissionData = {
      form_id: leaveFormId,
      user_id: userId!,
      submission_data: {
        leave_type_id,
        start_date,
        end_date,
        days_requested: requestedDays,
        reason,
        requested_by: userId!
      },
      status: 'submitted' as const  // Use 'submitted' as per FormSubmission model
    };

    const newSubmission = await FormSubmissionModel.create(formSubmissionData);

    return res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: { leaveRequest: newSubmission }
    });
  } catch (error) {
    console.error('Create leave request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/leave/:id - Update leave request
router.put('/:id', authenticateJWT, checkPermission('leave:update'), async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const leaveRequestId = parseInt(idStr as string);
    const { status, reason } = req.body;

    if (isNaN(leaveRequestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave request ID'
      });
    }

    // Get existing leave request
    const existingRequest = await FormSubmissionModel.findById(leaveRequestId);

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Only allow status updates (not date changes after submission)
    const updateData: any = {};
    if (status && ['approved', 'rejected', 'cancelled'].includes(status)) {
      updateData.status = status;
    }

    if (reason) {
      updateData.reason = reason;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Update the form submission status instead
    const updatedSubmission = await FormSubmissionModel.update(leaveRequestId, { status: updateData.status, notes: updateData.reason });

    return res.json({
      success: true,
      message: 'Leave request updated successfully',
      data: { leaveRequest: updatedSubmission }
    });
  } catch (error) {
    console.error('Update leave request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/leave/:id - Delete/cancel leave request
router.delete('/:id', authenticateJWT, checkPermission('leave:delete'), async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const leaveRequestId = parseInt(idStr as string);

    if (isNaN(leaveRequestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave request ID'
      });
    }

    // Check if leave request exists
    const existingRequest = await FormSubmissionModel.findById(leaveRequestId);

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Only allow cancellation if status is pending
    if (existingRequest.status !== 'submitted') {  // Changed from 'pending' to 'submitted' as per FormSubmission model
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel leave request that is already approved or rejected'
      });
    }

    // Update status to cancelled instead of hard deleting
    await FormSubmissionModel.update(leaveRequestId, { status: 'rejected', notes: 'Cancelled by user' });

    return res.json({
      success: true,
      message: 'Leave request cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel leave request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;