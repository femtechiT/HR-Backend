import { Router, Request, Response } from 'express';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';
import { pool } from '../config/database';
import LeaveAllocationModel from '../models/leave-allocation.model';
import LeaveTypeModel from '../models/leave-type.model';
import UserModel from '../models/user.model';

const router = Router();

// GET /api/leave/allocations/my-allocations - Get current user's own leave allocations (no special permission needed)
router.get('/my-allocations', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found'
      });
    }

    // Get all allocations for the current user
    const allocations = await LeaveAllocationModel.findByUserId(userId);

    // Format the response with leave type names
    const allocationsWithDetails = await Promise.all(
      allocations.map(async (allocation) => {
        const leaveType = await LeaveTypeModel.findById(allocation.leave_type_id);
        return {
          ...allocation,
          leave_type_name: leaveType ? leaveType.name : 'Unknown',
          remaining_days: allocation.allocated_days - allocation.used_days + allocation.carried_over_days
        };
      })
    );

    return res.json({
      success: true,
      message: 'Your leave allocations retrieved successfully',
      data: { allocations: allocationsWithDetails }
    });
  } catch (error) {
    console.error('Get my leave allocations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/leave/allocations - Get all leave allocations (with filters)
router.get('/', authenticateJWT, checkPermission('leave_allocation:read'), async (req: Request, res: Response) => {
  try {
    const {
      userId,
      leaveTypeId,
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

    // Build query based on filters
    let query = `SELECT la.*, lt.name as leave_type_name, u.full_name as user_name
                 FROM leave_allocations la
                 LEFT JOIN leave_types lt ON la.leave_type_id = lt.id
                 LEFT JOIN users u ON la.user_id = u.id
                 WHERE 1=1`;
    const params: any[] = [];

    if (userId) {
      query += ' AND la.user_id = ?';
      params.push(parseInt(userId as string));
    }

    if (leaveTypeId) {
      query += ' AND la.leave_type_id = ?';
      params.push(parseInt(leaveTypeId as string));
    }

    query += ' ORDER BY la.created_at DESC';

    // Add pagination
    const offset = (pageNum - 1) * limitNum;
    query += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    // Get the allocations
    const [rows]: any = await pool.execute(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM leave_allocations la WHERE 1=1`;
    const countParams = [];

    if (userId) {
      countQuery += ' AND la.user_id = ?';
      countParams.push(parseInt(userId as string));
    }

    if (leaveTypeId) {
      countQuery += ' AND la.leave_type_id = ?';
      countParams.push(parseInt(leaveTypeId as string));
    }

    const [countRows]: any = await pool.execute(countQuery, countParams);

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
  } catch (error) {
    console.error('Get leave allocations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/leave/allocations/:id - Get specific leave allocation
router.get('/:id', authenticateJWT, checkPermission('leave_allocation:read'), async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const allocationId = parseInt(idStr as string);

    if (isNaN(allocationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid allocation ID'
      });
    }

    const allocation = await LeaveAllocationModel.findById(allocationId);

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
  } catch (error) {
    console.error('Get leave allocation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/leave/allocations - Create new leave allocation
router.post('/', authenticateJWT, checkPermission('leave_allocation:create'), async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      leave_type_id,
      allocated_days,
      cycle_start_date,
      cycle_end_date,
      carried_over_days = 0
    } = req.body;

    // Validate required fields
    if (!user_id || !leave_type_id || allocated_days === undefined || !cycle_start_date || !cycle_end_date) {
      return res.status(400).json({
        success: false,
        message: 'User ID, leave type ID, allocated days, cycle start date, and cycle end date are required'
      });
    }

    // Validate that user exists
    const user = await UserModel.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate that leave type exists
    const leaveType = await LeaveTypeModel.findById(leave_type_id);
    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: 'Leave type not found'
      });
    }

    // Validate dates
    const fromDate = new Date(cycle_start_date);
    const toDate = new Date(cycle_end_date);

    if (fromDate > toDate) {
      return res.status(400).json({
        success: false,
        message: 'Cycle start date cannot be after cycle end date'
      });
    }

    // Create the leave allocation
    const allocationData = {
      user_id,
      leave_type_id,
      allocated_days,
      used_days: 0, // Initially no days used
      carried_over_days: carried_over_days || 0,
      cycle_start_date: cycle_start_date,
      cycle_end_date: cycle_end_date
    };

    const newAllocation = await LeaveAllocationModel.create(allocationData);

    return res.status(201).json({
      success: true,
      message: 'Leave allocation created successfully',
      data: { leaveAllocation: newAllocation }
    });
  } catch (error: any) {
    console.error('Create leave allocation error:', error);
    
    // Handle duplicate allocation error
    if (error.message === 'Leave allocation already exists for this user, leave type, and cycle period') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    
    // Handle MySQL unique constraint violation
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

// PUT /api/leave/allocations/:id - Update leave allocation
router.put('/:id', authenticateJWT, checkPermission('leave_allocation:update'), async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const allocationId = parseInt(idStr as string);
    const { allocated_days, used_days, carried_over_days, cycle_start_date, cycle_end_date } = req.body;

    if (isNaN(allocationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid allocation ID'
      });
    }

    // Get existing allocation
    const existingAllocation = await LeaveAllocationModel.findById(allocationId);

    if (!existingAllocation) {
      return res.status(404).json({
        success: false,
        message: 'Leave allocation not found'
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (allocated_days !== undefined) updateData.allocated_days = allocated_days;
    if (used_days !== undefined) updateData.used_days = used_days;
    if (carried_over_days !== undefined) updateData.carried_over_days = carried_over_days;
    if (cycle_start_date !== undefined) updateData.cycle_start_date = cycle_start_date;
    if (cycle_end_date !== undefined) updateData.cycle_end_date = cycle_end_date;

    // Validate that used days don't exceed allocated days
    if (updateData.used_days !== undefined && updateData.allocated_days !== undefined) {
      if (updateData.used_days > updateData.allocated_days + (updateData.carried_over_days || existingAllocation.carried_over_days)) {
        return res.status(400).json({
          success: false,
          message: 'Used days cannot exceed allocated days plus carried over days'
        });
      }
    } else if (updateData.used_days !== undefined) {
      const totalAvailable = existingAllocation.allocated_days + (updateData.carried_over_days !== undefined ? updateData.carried_over_days : existingAllocation.carried_over_days);
      if (updateData.used_days > totalAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Used days cannot exceed allocated days plus carried over days'
        });
      }
    }

    const updatedAllocation = await LeaveAllocationModel.update(allocationId, updateData);

    return res.json({
      success: true,
      message: 'Leave allocation updated successfully',
      data: { leaveAllocation: updatedAllocation }
    });
  } catch (error) {
    console.error('Update leave allocation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/leave/allocations/:id - Delete/cancel leave allocation
router.delete('/:id', authenticateJWT, checkPermission('leave_allocation:delete'), async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const allocationId = parseInt(idStr as string);

    if (isNaN(allocationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid allocation ID'
      });
    }

    // Check if allocation exists
    const existingAllocation = await LeaveAllocationModel.findById(allocationId);

    if (!existingAllocation) {
      return res.status(404).json({
        success: false,
        message: 'Leave allocation not found'
      });
    }

    // Delete the allocation
    await LeaveAllocationModel.delete(allocationId);

    return res.json({
      success: true,
      message: 'Leave allocation deleted successfully'
    });
  } catch (error) {
    console.error('Delete leave allocation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/leave/allocations/bulk - Bulk create allocations for selected users
router.post('/bulk', authenticateJWT, checkPermission('leave_allocation:create'), async (req: Request, res: Response) => {
  try {
    const {
      leave_type_id,
      allocated_days,
      cycle_start_date,
      cycle_end_date,
      carried_over_days = 0,
      user_ids = []
    } = req.body;

    // Validate required fields
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

    // Validate that leave type exists
    const leaveType = await LeaveTypeModel.findById(leave_type_id);
    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: 'Leave type not found'
      });
    }

    // Validate dates
    const fromDate = new Date(cycle_start_date);
    const toDate = new Date(cycle_end_date);

    if (fromDate > toDate) {
      return res.status(400).json({
        success: false,
        message: 'Cycle start date cannot be after cycle end date'
      });
    }

    // Validate that all users exist and are active
    const placeholders = user_ids.map(() => '?').join(',');
    const [users]: any = await pool.execute(
      `SELECT id, full_name, email FROM users WHERE id IN (${placeholders}) AND status = 'active'`,
      user_ids
    );

    if (users.length !== user_ids.length) {
      const foundIds = users.map((u: any) => u.id);
      const invalidIds = user_ids.filter(id => !foundIds.includes(id));
      return res.status(400).json({
        success: false,
        message: `Invalid or inactive user IDs: ${invalidIds.join(', ')}`
      });
    }

    // Prepare allocation data for all users
    const allocationsData = users.map((user: any) => ({
      user_id: user.id,
      leave_type_id,
      allocated_days,
      cycle_start_date,
      cycle_end_date,
      carried_over_days
    }));

    // Create allocations
    const createdAllocations = await LeaveAllocationModel.bulkCreate(allocationsData);

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
  } catch (error) {
    console.error('Bulk create leave allocations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/leave/allocations/allocate-all - Create allocations for ALL active users
router.post('/allocate-all', authenticateJWT, checkPermission('leave_allocation:create'), async (req: Request, res: Response) => {
  try {
    const {
      leave_type_id,
      allocated_days,
      cycle_start_date,
      cycle_end_date,
      carried_over_days = 0
    } = req.body;

    // Validate required fields
    if (!leave_type_id || allocated_days === undefined || !cycle_start_date || !cycle_end_date) {
      return res.status(400).json({
        success: false,
        message: 'Leave type ID, allocated days, cycle start date, and cycle end date are required'
      });
    }

    // Validate that leave type exists
    const leaveType = await LeaveTypeModel.findById(leave_type_id);
    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: 'Leave type not found'
      });
    }

    // Validate dates
    const fromDate = new Date(cycle_start_date);
    const toDate = new Date(cycle_end_date);

    if (fromDate > toDate) {
      return res.status(400).json({
        success: false,
        message: 'Cycle start date cannot be after cycle end date'
      });
    }

    // Create allocations for all active users
    const result = await LeaveAllocationModel.createForAllUsers(
      leave_type_id,
      allocated_days,
      cycle_start_date,
      cycle_end_date,
      carried_over_days
    );

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
  } catch (error) {
    console.error('Allocate-all leave allocations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;