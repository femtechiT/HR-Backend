import { Request, Response } from 'express';
import ShiftExceptionModel, { ShiftExceptionInput } from '../models/shift-exception.model';
import StaffModel from '../models/staff.model';

class ShiftExceptionController {
  /**
   * Create a shift exception (one-off or recurring)
   * POST /api/shift-scheduling/exceptions
   */
  static async create(req: Request, res: Response) {
    try {
      const {
        user_id,
        exception_date,
        exception_type,
        new_start_time,
        new_end_time,
        new_break_duration_minutes,
        reason,
        is_recurring,
        day_of_week,
        end_date
      } = req.body;

      // Validate required fields
      if (!user_id || !exception_date || !exception_type) {
        return res.status(400).json({
          success: false,
          message: 'user_id, exception_date, and exception_type are required'
        });
      }

      // Verify user exists and has staff record
      const staff = await StaffModel.findByUserId(user_id);
      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'User not found or does not have a staff record'
        });
      }

      // Verify admin and staff are in the same branch
      const currentUserId = req.currentUser?.id;
      if (currentUserId) {
        const adminStaff = await StaffModel.findByUserId(currentUserId);
        if (adminStaff?.branch_id) {
          const staffBranchId = staff.branch_id;
          if (!staffBranchId || staffBranchId !== adminStaff.branch_id) {
            return res.status(403).json({
              success: false,
              message: 'You can only create exceptions for staff in your branch'
            });
          }
        }
      }

      // Create the shift exception
      const exceptionData: ShiftExceptionInput = {
        user_id,
        exception_date: new Date(exception_date),
        exception_type,
        new_start_time: new_start_time || null,
        new_end_time: new_end_time || null,
        new_break_duration_minutes: new_break_duration_minutes || 0,
        reason: reason || null,
        created_by: req.currentUser?.id || user_id,
        status: 'active' // Auto-approve for now
      };

      const newException = await ShiftExceptionModel.create(exceptionData);

      return res.status(201).json({
        success: true,
        message: 'Shift exception created successfully',
        data: { exception: newException }
      });
    } catch (error) {
      console.error('Create shift exception error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get all shift exceptions
   * GET /api/shift-scheduling/exceptions
   */
  static async getAll(req: Request, res: Response) {
    try {
      const { startDate, endDate, userId } = req.query;
      const currentUserId = req.currentUser?.id;

      // Get current user's branch (if not Super Admin)
      let branchId: number | null = null;
      if (currentUserId) {
        const adminStaff = await StaffModel.findByUserId(currentUserId);
        branchId = adminStaff?.branch_id || null;
      }

      let exceptions;
      const userIdNum = userId ? parseInt(userId as string) : undefined;

      if (branchId) {
        // Branch admin - only see exceptions for staff in their branch
        if (startDate && endDate) {
          exceptions = await ShiftExceptionModel.findByDateRangeByBranch(
            branchId,
            new Date(startDate as string),
            new Date(endDate as string),
            userIdNum
          );
        } else {
          exceptions = await ShiftExceptionModel.findAllByBranch(branchId, userIdNum);
        }
      } else if (userId) {
        // Super Admin or no branch - get exceptions for specific user
        const userIdNum = parseInt(userId as string);
        if (startDate && endDate) {
          exceptions = await ShiftExceptionModel.findByDateRange(
            userIdNum,
            new Date(startDate as string),
            new Date(endDate as string)
          );
        } else {
          exceptions = await ShiftExceptionModel.findByUserId(userIdNum);
        }
      } else {
        // Super Admin - get all exceptions
        exceptions = await ShiftExceptionModel.findAll();
      }

      return res.status(200).json({
        success: true,
        data: { exceptions }
      });
    } catch (error) {
      console.error('Get all shift exceptions error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get my shift exceptions
   * GET /api/shift-scheduling/exceptions/my
   */
  static async getMyShiftExceptions(req: Request, res: Response) {
    try {
      const userId = req.currentUser?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized - User ID not found'
        });
      }

      const { pool } = await import('../config/database');
      const { startDate, endDate } = req.query;

      let exceptions;

      if (startDate && endDate) {
        const [rows]: any = await pool.execute(
          `SELECT * FROM shift_exceptions 
           WHERE user_id = ? 
           AND exception_date BETWEEN ? AND ? 
           AND status IN ('active', 'approved')
           ORDER BY exception_date DESC`,
          [userId, startDate, endDate]
        );
        exceptions = rows;
      } else {
        const [rows]: any = await pool.execute(
          `SELECT * FROM shift_exceptions 
           WHERE user_id = ? AND status IN ('active', 'approved')
           ORDER BY exception_date DESC`,
          [userId]
        );
        exceptions = rows;
      }

      return res.status(200).json({
        success: true,
        data: { exceptions }
      });
    } catch (error) {
      console.error('Get my shift exceptions error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get a specific shift exception by ID
   * GET /api/shift-scheduling/exceptions/:id
   */
  static async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);

      const exception = await ShiftExceptionModel.findById(id);

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
    } catch (error) {
      console.error('Get shift exception error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update a shift exception
   * PUT /api/shift-scheduling/exceptions/:id
   */
  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const updateData = req.body;

      // Verify exception exists
      const existingException = await ShiftExceptionModel.findById(id);
      if (!existingException) {
        return res.status(404).json({
          success: false,
          message: 'Shift exception not found'
        });
      }

      // Verify branch access
      const currentUserId = req.currentUser?.id;
      if (currentUserId) {
        const adminStaff = await StaffModel.findByUserId(currentUserId);
        if (adminStaff?.branch_id) {
          const targetStaff = await StaffModel.findByUserId(existingException.user_id);
          if (!targetStaff || targetStaff.branch_id !== adminStaff.branch_id) {
            return res.status(403).json({
              success: false,
              message: 'You can only update exceptions for staff in your branch'
            });
          }
        }
      }

      // Update the exception
      const updatedException = await ShiftExceptionModel.update(id, updateData);

      return res.status(200).json({
        success: true,
        message: 'Shift exception updated successfully',
        data: { exception: updatedException }
      });
    } catch (error) {
      console.error('Update shift exception error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Delete a shift exception
   * DELETE /api/shift-scheduling/exceptions/:id
   */
  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);

      // Verify exception exists
      const existingException = await ShiftExceptionModel.findById(id);
      if (!existingException) {
        return res.status(404).json({
          success: false,
          message: 'Shift exception not found'
        });
      }

      // Verify branch access
      const currentUserId = req.currentUser?.id;
      if (currentUserId) {
        const adminStaff = await StaffModel.findByUserId(currentUserId);
        if (adminStaff?.branch_id) {
          const targetStaff = await StaffModel.findByUserId(existingException.user_id);
          if (!targetStaff || targetStaff.branch_id !== adminStaff.branch_id) {
            return res.status(403).json({
              success: false,
              message: 'You can only delete exceptions for staff in your branch'
            });
          }
        }
      }

      // Delete the exception
      await ShiftExceptionModel.delete(id);

      return res.status(200).json({
        success: true,
        message: 'Shift exception deleted successfully'
      });
    } catch (error) {
      console.error('Delete shift exception error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

// Export individual functions for use in routes
export const {
  create: createShiftException,
  getAll: getAllShiftExceptions,
  getMyShiftExceptions,
  getById: getShiftExceptionById,
  update: updateShiftException,
  delete: deleteShiftException
} = ShiftExceptionController;

export default ShiftExceptionController;
