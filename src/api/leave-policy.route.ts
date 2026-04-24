import { Router, Request, Response } from 'express';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';
import { pool } from '../config/database';

const router = Router();

const getDefaultPolicy = () => ({
  id: 1,
  exclude_sundays_from_leave: false,
  created_at: new Date(),
  updated_at: new Date()
});

router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, exclude_sundays_from_leave, created_at, updated_at
       FROM global_attendance_settings
       LIMIT 1`
    ) as [any[], any];

    const policy = rows[0] || getDefaultPolicy();

    return res.json({
      success: true,
      message: 'Leave policy retrieved successfully',
      data: { settings: policy }
    });
  } catch (error) {
    console.error('Get leave policy error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.patch('/', authenticateJWT, checkPermission('settings:configure'), async (req: Request, res: Response) => {
  try {
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Settings object is required'
      });
    }

    const excludeSundays = settings.exclude_sundays_from_leave;
    if (typeof excludeSundays === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'exclude_sundays_from_leave is required'
      });
    }

    const [existingRows] = await pool.execute(
      `SELECT id FROM global_attendance_settings LIMIT 1`
    ) as [any[], any];

    if (existingRows.length > 0) {
      await pool.execute(
        `UPDATE global_attendance_settings
         SET exclude_sundays_from_leave = ?, updated_at = NOW()
         WHERE id = ?`,
        [Boolean(excludeSundays), existingRows[0].id]
      );
    } else {
      await pool.execute(
        `INSERT INTO global_attendance_settings (id, exclude_sundays_from_leave)
         VALUES (1, ?)`,
        [Boolean(excludeSundays)]
      );
    }

    const [updatedRows] = await pool.execute(
      `SELECT id, exclude_sundays_from_leave, created_at, updated_at
       FROM global_attendance_settings
       LIMIT 1`
    ) as [any[], any];

    return res.json({
      success: true,
      message: 'Leave policy updated successfully',
      data: { settings: updatedRows[0] || getDefaultPolicy() }
    });
  } catch (error) {
    console.error('Update leave policy error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
