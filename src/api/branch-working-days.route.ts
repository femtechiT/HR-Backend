import { Router, Request, Response } from 'express';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';
import BranchWorkingDaysModel from '../models/branch-working-days.model';

const router = Router();

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

/**
 * GET /api/branches/:branchId/working-days
 * Get working days configuration for a branch
 */
router.get('/:branchId/working-days', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const branchId = parseInt(req.params.branchId as string);

    if (isNaN(branchId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch ID'
      });
    }

    const workingDays = await BranchWorkingDaysModel.findByBranchId(branchId);

    return res.json({
      success: true,
      message: 'Working days retrieved successfully',
      data: {
        branch_id: branchId,
        workingDays
      }
    });
  } catch (error) {
    console.error('Get working days error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/branches/:branchId/working-days/:dayOfWeek
 * Get working day configuration for a specific day
 */
router.get('/:branchId/working-days/:dayOfWeek', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const branchId = parseInt(req.params.branchId as string);
    const dayOfWeek = (req.params.dayOfWeek as string).toLowerCase();

    if (isNaN(branchId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch ID'
      });
    }

    if (!DAYS_OF_WEEK.includes(dayOfWeek)) {
      return res.status(400).json({
        success: false,
        message: `Invalid day of week. Must be one of: ${DAYS_OF_WEEK.join(', ')}`
      });
    }

    const workingDay = await BranchWorkingDaysModel.findByBranchIdAndDay(branchId, dayOfWeek);

    if (!workingDay) {
      return res.status(404).json({
        success: false,
        message: 'Working day configuration not found'
      });
    }

    return res.json({
      success: true,
      data: {
        workingDay
      }
    });
  } catch (error) {
    console.error('Get working day error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/branches/:branchId/working-days
 * Bulk update all working days for a branch
 */
router.put('/:branchId/working-days', authenticateJWT, checkPermission('branches:update'), async (req: Request, res: Response) => {
  try {
    const branchId = parseInt(req.params.branchId as string);

    if (isNaN(branchId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch ID'
      });
    }

    const { workingDays } = req.body;

    if (!workingDays || !Array.isArray(workingDays)) {
      return res.status(400).json({
        success: false,
        message: 'workingDays array is required'
      });
    }

    // Validate input
    for (const day of workingDays) {
      if (!day.day_of_week || !DAYS_OF_WEEK.includes(day.day_of_week.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid day_of_week: ${day.day_of_week}`
        });
      }

      if (day.is_working_day && (!day.start_time || !day.end_time)) {
        return res.status(400).json({
          success: false,
          message: `start_time and end_time are required for working day: ${day.day_of_week}`
        });
      }
    }

    // Normalize day names to lowercase
    const normalizedDays = workingDays.map((day: any) => ({
      ...day,
      day_of_week: day.day_of_week.toLowerCase()
    }));

    const updatedWorkingDays = await BranchWorkingDaysModel.bulkUpdate(branchId, normalizedDays);

    return res.json({
      success: true,
      message: 'Working days updated successfully',
      data: {
        workingDays: updatedWorkingDays
      }
    });
  } catch (error) {
    console.error('Update working days error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/branches/:branchId/working-days/:dayOfWeek
 * Update working day for a specific day
 */
router.post('/:branchId/working-days/:dayOfWeek', authenticateJWT, checkPermission('branches:update'), async (req: Request, res: Response) => {
  try {
    const branchId = parseInt(req.params.branchId as string);
    const dayOfWeek = (req.params.dayOfWeek as string).toLowerCase();

    if (isNaN(branchId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch ID'
      });
    }

    if (!DAYS_OF_WEEK.includes(dayOfWeek)) {
      return res.status(400).json({
        success: false,
        message: `Invalid day of week. Must be one of: ${DAYS_OF_WEEK.join(', ')}`
      });
    }

    const { is_working_day, start_time, end_time, break_duration_minutes } = req.body;

    const workingDay = await BranchWorkingDaysModel.upsert({
      branch_id: branchId,
      day_of_week: dayOfWeek,
      is_working_day,
      start_time,
      end_time,
      break_duration_minutes
    });

    return res.json({
      success: true,
      message: 'Working day updated successfully',
      data: {
        workingDay
      }
    });
  } catch (error) {
    console.error('Update working day error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/branches/working-days/check
 * Check if a specific date is a working day for a branch
 */
router.get('/working-days/check', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { branch_id, date } = req.query;

    if (!branch_id || !date) {
      return res.status(400).json({
        success: false,
        message: 'branch_id and date are required'
      });
    }

    const branchId = parseInt(branch_id as string);
    const dateObj = new Date(date as string);

    if (isNaN(branchId) || isNaN(dateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch_id or date format'
      });
    }

    const dayOfWeek = DAYS_OF_WEEK[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1];
    const isWorkingDay = await BranchWorkingDaysModel.isWorkingDay(branchId, dayOfWeek);
    const workingHours = await BranchWorkingDaysModel.getWorkingHours(branchId, dayOfWeek);

    return res.json({
      success: true,
      data: {
        branch_id: branchId,
        date: date,
        day_of_week: dayOfWeek,
        is_working_day: isWorkingDay,
        working_hours: workingHours
      }
    });
  } catch (error) {
    console.error('Check working day error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
