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
   * Get all shift exceptions for a user
   * GET /api/shift-scheduling/exceptions/:userId
   */
  static async getByUserId(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId as string);
      const { startDate, endDate } = req.query;

      let exceptions;

      if (startDate && endDate) {
        exceptions = await ShiftExceptionModel.findByDateRange(
          userId,
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else {
        exceptions = await ShiftExceptionModel.findByUserId(userId);
      }

      return res.status(200).json({
        success: true,
        data: { exceptions }
      });
    } catch (error) {
      console.error('Get user shift exceptions error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get a specific shift exception
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
   * Approve a shift exception
   * POST /api/shift-scheduling/exceptions/:id/approve
   */
  static async approve(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const approvedBy = req.currentUser?.id;

      if (!approvedBy) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // Verify exception exists
      const existingException = await ShiftExceptionModel.findById(id);
      if (!existingException) {
        return res.status(404).json({
          success: false,
          message: 'Shift exception not found'
        });
      }

      // Approve the exception
      const approvedException = await ShiftExceptionModel.approve(id, approvedBy);

      return res.status(200).json({
        success: true,
        message: 'Shift exception approved successfully',
        data: { exception: approvedException }
      });
    } catch (error) {
      console.error('Approve shift exception error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Reject a shift exception
   * POST /api/shift-scheduling/exceptions/:id/reject
   */
  static async reject(req: Request, res: Response) {
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

      // Reject the exception
      const rejectedException = await ShiftExceptionModel.reject(id);

      return res.status(200).json({
        success: true,
        message: 'Shift exception rejected',
        data: { exception: rejectedException }
      });
    } catch (error) {
      console.error('Reject shift exception error:', error);
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

  /**
   * Get all shift exceptions
   * GET /api/shift-scheduling/exceptions
   */
  static async getAll(req: Request, res: Response) {
    try {
      const exceptions = await ShiftExceptionModel.findAll();

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
}

export default ShiftExceptionController;
