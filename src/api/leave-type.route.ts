import { Router, Request, Response } from 'express';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';
import LeaveTypeModel from '../models/leave-type.model';

const router = Router();

// GET /api/leave-types - List all leave types
router.get('/', authenticateJWT, checkPermission('leave_type:read'), async (req: Request, res: Response) => {
  try {
    console.log('GET /api/leave-types - Starting request');
    console.log('User info:', req.currentUser);
    
    console.log('Attempting to fetch all leave types...');
    const leaveTypes = await LeaveTypeModel.findAll();
    console.log('Successfully fetched leave types:', leaveTypes.length);
    
    return res.json({
      success: true,
      message: 'Leave types retrieved successfully',
      data: { leaveTypes }
    });
  } catch (error) {
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

// GET /api/leave-types/:id - Get leave type by ID
router.get('/:id', authenticateJWT, checkPermission('leave_type:read'), async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const leaveTypeId = parseInt(idStr as string);

    if (isNaN(leaveTypeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave type ID'
      });
    }

    const leaveType = await LeaveTypeModel.findById(leaveTypeId);
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
  } catch (error) {
    console.error('Get leave type error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/leave-types - Create new leave type
router.post('/', authenticateJWT, checkPermission('leave:request'), async (req: Request, res: Response) => {
  try {
    const { name, days_per_year, is_paid, allow_carryover, carryover_limit, expiry_rule_id } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Leave type name is required'
      });
    }

    // Check if leave type with this name already exists
    const existingLeaveType = await LeaveTypeModel.findByName(name);
    if (existingLeaveType) {
      return res.status(409).json({
        success: false,
        message: 'A leave type with this name already exists'
      });
    }

    // Create the leave type
    const leaveTypeData = {
      name,
      days_per_year: days_per_year || 0,
      is_paid: is_paid !== undefined ? Boolean(is_paid) : true,
      allow_carryover: allow_carryover !== undefined ? Boolean(allow_carryover) : false,
      carryover_limit: carryover_limit || 0,
      expiry_rule_id: expiry_rule_id || null,
      created_by: req.currentUser?.id || null
    };

    const newLeaveType = await LeaveTypeModel.create(leaveTypeData);

    return res.status(201).json({
      success: true,
      message: 'Leave type created successfully',
      data: { leaveType: newLeaveType }
    });
  } catch (error) {
    console.error('Create leave type error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/leave-types/:id - Update leave type
router.put('/:id', authenticateJWT, checkPermission('leave:approve'), async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const leaveTypeId = parseInt(idStr as string);
    const { name, days_per_year, is_paid, allow_carryover, carryover_limit, expiry_rule_id, is_active } = req.body;

    if (isNaN(leaveTypeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave type ID'
      });
    }

    // Check if leave type exists
    const existingLeaveType = await LeaveTypeModel.findById(leaveTypeId);
    if (!existingLeaveType) {
      return res.status(404).json({
        success: false,
        message: 'Leave type not found'
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (days_per_year !== undefined) updateData.days_per_year = days_per_year;
    if (is_paid !== undefined) updateData.is_paid = Boolean(is_paid);
    if (allow_carryover !== undefined) updateData.allow_carryover = Boolean(allow_carryover);
    if (carryover_limit !== undefined) updateData.carryover_limit = carryover_limit;
    if (expiry_rule_id !== undefined) updateData.expiry_rule_id = expiry_rule_id;
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    const updatedLeaveType = await LeaveTypeModel.update(leaveTypeId, updateData);

    return res.json({
      success: true,
      message: 'Leave type updated successfully',
      data: { leaveType: updatedLeaveType }
    });
  } catch (error) {
    console.error('Update leave type error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/leave-types/:id - Delete (deactivate) leave type
router.delete('/:id', authenticateJWT, checkPermission('leave:approve'), async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const leaveTypeId = parseInt(idStr as string);

    if (isNaN(leaveTypeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave type ID'
      });
    }

    const deleted = await LeaveTypeModel.deactivate(leaveTypeId);
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
  } catch (error) {
    console.error('Deactivate leave type error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;