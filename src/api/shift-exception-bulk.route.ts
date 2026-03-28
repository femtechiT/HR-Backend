import { Router, Request, Response } from 'express';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';
import ShiftExceptionModel from '../models/shift-exception.model';

const router = Router();

/**
 * POST /api/shift-exceptions/bulk
 * Create multiple shift exceptions at once (e.g., for holiday staffing)
 */
router.post('/bulk', authenticateJWT, checkPermission('shift:create'), async (req: Request, res: Response) => {
  try {
    const { exceptions } = req.body;

    // Validate input
    if (!exceptions || !Array.isArray(exceptions) || exceptions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Exceptions array is required and must not be empty'
      });
    }

    console.log(`[Shift Exceptions] Creating ${exceptions.length} bulk exceptions`);

    const createdExceptions = [];
    const errors = [];

    for (const exc of exceptions) {
      try {
        // Validate required fields
        if (!exc.user_id || !exc.exception_date || !exc.exception_type) {
          errors.push({
            exception: exc,
            error: 'Missing required fields: user_id, exception_date, exception_type'
          });
          continue;
        }

        // Validate exception type
        const validTypes = ['early_release', 'late_start', 'day_off', 'special_schedule', 'holiday_work'];
        if (!validTypes.includes(exc.exception_type)) {
          errors.push({
            exception: exc,
            error: `Invalid exception type. Must be one of: ${validTypes.join(', ')}`
          });
          continue;
        }

        // For holiday_work or special_schedule, validate times
        if (['holiday_work', 'special_schedule'].includes(exc.exception_type)) {
          if (!exc.new_start_time || !exc.new_end_time) {
            errors.push({
              exception: exc,
              error: 'new_start_time and new_end_time are required for holiday_work and special_schedule'
            });
            continue;
          }
        }

        // Check if exception already exists for this user on this date
        const existing = await ShiftExceptionModel.findByDate(exc.user_id, new Date(exc.exception_date));
        if (existing) {
          errors.push({
            exception: exc,
            error: `Exception already exists for user ${exc.user_id} on ${exc.exception_date}`
          });
          continue;
        }

        // Create the exception
        const exceptionData = {
          user_id: exc.user_id,
          shift_assignment_id: exc.shift_assignment_id || null,
          exception_date: new Date(exc.exception_date),
          exception_type: exc.exception_type,
          original_start_time: exc.original_start_time || null,
          original_end_time: exc.original_end_time || null,
          new_start_time: exc.new_start_time || null,
          new_end_time: exc.new_end_time || null,
          new_break_duration_minutes: exc.new_break_duration_minutes || 30,
          reason: exc.reason || exc.notes || null,
          approved_by: exc.approved_by || req.currentUser?.id,
          status: exc.status || 'active',
          created_by: req.currentUser?.id || 1
        };

        const created = await ShiftExceptionModel.create(exceptionData);
        createdExceptions.push(created);

      } catch (error: any) {
        console.error('[Shift Exceptions] Error creating exception:', error);
        errors.push({
          exception: exc,
          error: error.message || 'Failed to create exception'
        });
      }
    }

    // Return results
    if (createdExceptions.length === 0 && errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create any exceptions',
        data: { errors }
      });
    }

    return res.status(201).json({
      success: true,
      message: `Created ${createdExceptions.length} exception(s) successfully`,
      data: {
        created: createdExceptions.length,
        failed: errors.length,
        exceptions: createdExceptions,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error: any) {
    console.error('[Shift Exceptions] Bulk create error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /api/shift-exceptions/bulk/holiday
 * Create exceptions for all staff on a specific holiday
 */
router.post('/bulk/holiday', authenticateJWT, checkPermission('shift:create'), async (req: Request, res: Response) => {
  try {
    const { holiday_id, date, staff_ids, work_start_time, work_end_time, reason } = req.body;

    // Validate required fields
    if (!date || !staff_ids || !Array.isArray(staff_ids) || staff_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'date, staff_ids array, work_start_time, and work_end_time are required'
      });
    }

    if (!work_start_time || !work_end_time) {
      return res.status(400).json({
        success: false,
        message: 'work_start_time and work_end_time are required for holiday work'
      });
    }

    console.log(`[Shift Exceptions] Creating holiday exceptions for ${staff_ids.length} staff on ${date}`);

    // Create exceptions for all selected staff
    const exceptions = staff_ids.map((userId: number) => ({
      user_id: userId,
      exception_date: date,
      exception_type: 'holiday_work' as const,
      new_start_time: work_start_time,
      new_end_time: work_end_time,
      new_break_duration_minutes: 30,
      reason: reason || (holiday_id ? `Holiday duty (Holiday ID: ${holiday_id})` : 'Holiday work'),
      status: 'active' as const
    }));

    // Use bulk create endpoint
    const bulkResponse = await createBulkExceptions(exceptions, req.currentUser?.id);

    return res.status(201).json({
      success: true,
      message: `Created ${bulkResponse.created} holiday exception(s) successfully`,
      data: bulkResponse
    });

  } catch (error: any) {
    console.error('[Shift Exceptions] Holiday bulk create error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Helper function to create bulk exceptions
 */
async function createBulkExceptions(exceptions: any[], createdBy?: number) {
  const createdExceptions = [];
  const errors = [];

  for (const exc of exceptions) {
    try {
      const exceptionData = {
        user_id: exc.user_id,
        shift_assignment_id: exc.shift_assignment_id || null,
        exception_date: new Date(exc.exception_date),
        exception_type: exc.exception_type,
        original_start_time: exc.original_start_time || null,
        original_end_time: exc.original_end_time || null,
        new_start_time: exc.new_start_time || null,
        new_end_time: exc.new_end_time || null,
        new_break_duration_minutes: exc.new_break_duration_minutes || 30,
        reason: exc.reason || null,
        approved_by: createdBy,
        status: exc.status || 'active',
        created_by: createdBy || 1
      };

      const created = await ShiftExceptionModel.create(exceptionData);
      createdExceptions.push(created);

    } catch (error: any) {
      errors.push({
        exception: exc,
        error: error.message || 'Failed to create exception'
      });
    }
  }

  return {
    created: createdExceptions.length,
    failed: errors.length,
    exceptions: createdExceptions,
    errors: errors.length > 0 ? errors : undefined
  };
}

export default router;
