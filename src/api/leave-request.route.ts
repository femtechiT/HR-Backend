import { Router, Request, Response } from 'express';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';
import LeaveHistoryModel from '../models/leave-history.model';
import LeaveTypeModel from '../models/leave-type.model';
import LeaveAllocationModel from '../models/leave-allocation.model';
import UserModel from '../models/user.model';

const router = Router();

// GET /api/leave - Get all leave requests (with filters)
router.get('/', authenticateJWT, checkPermission('leave:read'), async (req: Request, res: Response) => {
  try {
    const { 
      userId, 
      leaveTypeId, 
      status, 
      startDate, 
      endDate, 
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

    // Build filters object
    const filters: any = {};
    if (userId) filters.user_id = parseInt(userId as string);
    if (leaveTypeId) filters.leave_type_id = parseInt(leaveTypeId as string);
    if (status) filters.status = status as string;
    if (startDate) filters.start_date = startDate as string;
    if (endDate) filters.end_date = endDate as string;

    // Get leave requests with pagination
    const result = await LeaveHistoryModel.findAllWithFilters(
      limitNum,
      (pageNum - 1) * limitNum,
      filters
    );

    return res.json({
      success: true,
      message: 'Leave requests retrieved successfully',
      data: {
        leaveRequests: result.leaveRequests,
        pagination: {
          currentPage: pageNum,
          itemsPerPage: limitNum,
          totalItems: result.totalCount,
          totalPages: Math.ceil(result.totalCount / limitNum)
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

// GET /api/leave/:id - Get specific leave request
router.get('/:id', authenticateJWT, checkPermission('leave:read'), async (req: Request, res: Response) => {
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

    const leaveRequest = await LeaveHistoryModel.findById(leaveRequestId);

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
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

    // Create the leave request
    const leaveRequestData = {
      user_id: userId!,
      leave_type_id,
      start_date,
      end_date,
      days_taken: requestedDays,
      reason,
      status: 'pending' as const,
      requested_by: userId!
    };

    const newLeaveRequest = await LeaveHistoryModel.create(leaveRequestData);

    return res.status(201).json({
      success: true,
      message: 'Leave request created successfully',
      data: { leaveRequest: newLeaveRequest }
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
    const existingRequest = await LeaveHistoryModel.findById(leaveRequestId);

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

    // Use the new updateWithStatus method
    const updatedLeaveRequest = await LeaveHistoryModel.updateWithStatus(leaveRequestId, updateData);

    return res.json({
      success: true,
      message: 'Leave request updated successfully',
      data: { leaveRequest: updatedLeaveRequest }
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
    const existingRequest = await LeaveHistoryModel.findById(leaveRequestId);

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Only allow cancellation if status is pending
    if (existingRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel leave request that is already approved or rejected'
      });
    }

    // Update status to cancelled instead of hard deleting
    await LeaveHistoryModel.updateWithStatus(leaveRequestId, { status: 'cancelled' });

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