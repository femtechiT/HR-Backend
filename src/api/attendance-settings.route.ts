import { Router, Request, Response } from 'express';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';
import BranchModel from '../models/branch.model';
import { pool } from '../config/database';

const router = Router();

// GET /api/attendance/settings - Get attendance settings for a branch
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { branchId } = req.query;

    console.log('[Attendance Settings GET] Query params:', req.query);
    console.log('[Attendance Settings GET] Current user:', req.currentUser);

    // If no branchId provided, get settings for user's branch
    let targetBranchId = req.currentUser?.branch_id;
    if (branchId) {
      const branchIdNum = parseInt(branchId as string);
      if (isNaN(branchIdNum)) {
        console.warn('[Attendance Settings GET] Invalid branch ID:', branchId);
        return res.status(400).json({
          success: false,
          message: 'Invalid branch ID'
        });
      }
      targetBranchId = branchIdNum;
    }

    console.log('[Attendance Settings GET] Target branch ID:', targetBranchId);

    if (!targetBranchId) {
      console.warn('[Attendance Settings GET] No branch ID available');
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required. Please select a branch or ensure your user has a branch assigned.'
      });
    }

    const branch = await BranchModel.findById(targetBranchId);
    if (!branch) {
      console.warn('[Attendance Settings GET] Branch not found:', targetBranchId);
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Get attendance settings from branch configuration
    const attendanceSettings = {
      branch_id: branch.id,
      branch_name: branch.name,
      attendance_mode: branch.attendance_mode,
      location_coordinates: branch.location_coordinates,
      location_radius_meters: branch.location_radius_meters,
      require_check_in: branch.attendance_mode ? true : false, // Default to true
      require_check_out: branch.attendance_mode ? true : false, // Default to true
      auto_checkout_enabled: false, // Default
      auto_checkout_minutes_after_close: 30, // Default
      allow_manual_attendance_entry: true, // Default
      allow_future_attendance_entry: false, // Default
      grace_period_minutes: 0, // Default - no grace period
      enable_location_verification: !!branch.location_coordinates,
      enable_face_recognition: false, // Default
      enable_biometric_verification: false, // Default
      notify_absent_employees: true, // Default
      notify_supervisors_daily_summary: true, // Default
      enable_weekend_attendance: false, // Default
      enable_holiday_attendance: false, // Default
      // Auto-mark absent settings
      auto_mark_absent_enabled: branch.auto_mark_absent_enabled ?? true,
      auto_mark_absent_time: branch.auto_mark_absent_time ?? '12:00',
      auto_mark_absent_timezone: branch.auto_mark_absent_timezone ?? 'Africa/Nairobi',
      attendance_lock_date: branch.attendance_lock_date,
      created_at: branch.created_at,
      updated_at: branch.updated_at
    };

    return res.json({
      success: true,
      message: 'Attendance settings retrieved successfully',
      data: { settings: attendanceSettings }
    });
  } catch (error) {
    console.error('Get attendance settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PATCH /api/attendance/settings - Update attendance settings for a branch
router.patch('/', authenticateJWT, checkPermission('attendance:manage'), async (req: Request, res: Response) => {
  try {
    const { branchId, settings } = req.body;

    // Validate required fields
    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Settings object is required'
      });
    }

    // If no branchId provided, use user's branch
    let targetBranchId = req.currentUser?.branch_id;
    if (branchId) {
      const branchIdNum = parseInt(branchId as string);
      if (isNaN(branchIdNum)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid branch ID'
        });
      }
      targetBranchId = branchIdNum;
    }

    if (!targetBranchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }

    // Check if branch exists
    const branch = await BranchModel.findById(targetBranchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Prepare update data based on provided settings
    const updateData: any = {};

    // Attendance mode
    if (settings.attendance_mode !== undefined) {
      if (!['branch_based', 'multiple_locations', 'flexible'].includes(settings.attendance_mode)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid attendance mode. Valid options: branch_based, multiple_locations, flexible'
        });
      }
      updateData.attendance_mode = settings.attendance_mode;
    }

    // Location settings
    if (settings.location_coordinates !== undefined) {
      updateData.location_coordinates = settings.location_coordinates;
    }
    if (settings.location_radius_meters !== undefined) {
      updateData.location_radius_meters = settings.location_radius_meters;
    }

    // Check-in/out requirements
    if (settings.require_check_in !== undefined) {
      // This would require additional logic to handle the setting
      // For now, we'll store it as part of extended settings
    }
    if (settings.require_check_out !== undefined) {
      // This would require additional logic to handle the setting
      // For now, we'll store it as part of extended settings
    }

    // Auto-checkout settings
    if (settings.auto_checkout_enabled !== undefined) {
      // This would require additional logic to handle the setting
    }
    if (settings.auto_checkout_minutes_after_close !== undefined) {
      // This would require additional logic to handle the setting
    }

    // Other settings
    if (settings.allow_manual_attendance_entry !== undefined) {
      // This would require additional logic to handle the setting
    }
    if (settings.allow_future_attendance_entry !== undefined) {
      // This would require additional logic to handle the setting
    }
    if (settings.grace_period_minutes !== undefined) {
      // This would require additional logic to handle the setting
    }
    if (settings.enable_location_verification !== undefined) {
      // This would require additional logic to handle the setting
    }
    if (settings.enable_face_recognition !== undefined) {
      // This would require additional logic to handle the setting
    }
    if (settings.enable_biometric_verification !== undefined) {
      // This would require additional logic to handle the setting
    }
    if (settings.notify_absent_employees !== undefined) {
      // This would require additional logic to handle the setting
    }
    if (settings.notify_supervisors_daily_summary !== undefined) {
      // This would require additional logic to handle the setting
    }
    if (settings.enable_weekend_attendance !== undefined) {
      // This would require additional logic to handle the setting
    }
    if (settings.enable_holiday_attendance !== undefined) {
      // This would require additional logic to handle the setting
    }

    // Update the branch with the new settings
    if (Object.keys(updateData).length > 0) {
      await BranchModel.update(targetBranchId, updateData);
    }

    // Store additional settings in a separate attendance_settings table
    // First, check if settings record exists
    const [existingSettings] = await pool.execute(
      `SELECT * FROM attendance_settings WHERE branch_id = ?`,
      [targetBranchId]
    ) as [any[], any];

    if (existingSettings.length > 0) {
      // Update existing settings
      const updateFields = [];
      const updateValues = [];
      
      const allowedKeys = [
        'require_check_in', 'require_check_out', 'grace_period_minutes',
        'auto_checkout_enabled', 'auto_checkout_minutes_after_close',
        'enable_location_verification', 'allow_manual_attendance_entry',
        'enable_weekend_attendance', 'notify_absent_employees',
        'notify_supervisors_daily_summary', 'enable_face_recognition',
        'enable_biometric_verification', 'enable_holiday_attendance'
      ];

      for (const [key, value] of Object.entries(settings)) {
        if (allowedKeys.includes(key) && typeof value !== 'undefined') {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      }
      
      if (updateFields.length > 0) {
        updateValues.push(targetBranchId); // For WHERE clause
        await pool.execute(
          `UPDATE attendance_settings SET ${updateFields.join(', ')} WHERE branch_id = ?`,
          updateValues
        );
      }
    } else {
      // Insert new settings
      const columns = [];
      const values = [];
      const placeholders = [];
      
      columns.push('branch_id');
      values.push(targetBranchId);
      placeholders.push('?');
      
      const allowedKeys = [
        'require_check_in', 'require_check_out', 'grace_period_minutes',
        'auto_checkout_enabled', 'auto_checkout_minutes_after_close',
        'enable_location_verification', 'allow_manual_attendance_entry',
        'enable_weekend_attendance', 'notify_absent_employees',
        'notify_supervisors_daily_summary', 'enable_face_recognition',
        'enable_biometric_verification', 'enable_holiday_attendance'
      ];

      for (const [key, value] of Object.entries(settings)) {
        if (allowedKeys.includes(key) && typeof value !== 'undefined') {
          columns.push(key);
          values.push(value);
          placeholders.push('?');
        }
      }
      
      await pool.execute(
        `INSERT INTO attendance_settings (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
        values
      );
    }

    // Return updated settings
    const [updatedSettings] = await pool.execute(
      `SELECT * FROM attendance_settings WHERE branch_id = ?`,
      [targetBranchId]
    ) as [any[], any];

    return res.json({
      success: true,
      message: 'Attendance settings updated successfully',
      data: { settings: updatedSettings[0] || {} }
    });
  } catch (error) {
    console.error('Update attendance settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/attendance/settings/global - Get global attendance settings
router.get('/global', authenticateJWT, checkPermission('attendance:manage'), async (req: Request, res: Response) => {
  try {
    // Get global attendance settings
    const [globalSettings] = await pool.execute(
      `SELECT * FROM global_attendance_settings LIMIT 1`
    ) as [any[], any];

    const settings = globalSettings[0] || {
      id: 1,
      auto_checkout_enabled: false,
      auto_checkout_minutes_after_close: 30,
      allow_manual_attendance_entry: true,
      allow_future_attendance_entry: false,
      grace_period_minutes: 0,
      enable_face_recognition: false,
      enable_biometric_verification: false,
      notify_absent_employees: true,
      notify_supervisors_daily_summary: true,
      enable_weekend_attendance: false,
      enable_holiday_attendance: false,
      created_at: new Date(),
      updated_at: new Date()
    };

    return res.json({
      success: true,
      message: 'Global attendance settings retrieved successfully',
      data: { settings }
    });
  } catch (error) {
    console.error('Get global attendance settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PATCH /api/attendance/settings/global - Update global attendance settings
router.patch('/global', authenticateJWT, checkPermission('attendance:manage'), async (req: Request, res: Response) => {
  try {
    const settings = req.body.settings;

    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Settings object is required'
      });
    }

    // Check if global settings record exists
    const [existingSettings] = await pool.execute(
      `SELECT id FROM global_attendance_settings LIMIT 1`
    ) as [any[], any];

    if (existingSettings.length > 0) {
      // Update existing settings
      const updateFields = [];
      const updateValues = [];
      
      for (const [key, value] of Object.entries(settings)) {
        if (typeof value !== 'undefined') {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      }
      
      if (updateFields.length > 0) {
        updateValues.push(existingSettings[0].id); // For WHERE clause
        await pool.execute(
          `UPDATE global_attendance_settings SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      }
    } else {
      // Insert new settings
      const columns = ['id'];
      const values: any[] = [1]; // Global settings always has ID 1
      const placeholders = ['?'];

      for (const [key, value] of Object.entries(settings)) {
        if (typeof value !== 'undefined' && value !== null) {
          columns.push(key);
          values.push(value);
          placeholders.push('?');
        }
      }

      await pool.execute(
        `INSERT INTO global_attendance_settings (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
        values
      );
    }

    // Return updated settings
    const [updatedSettings] = await pool.execute(
      `SELECT * FROM global_attendance_settings LIMIT 1`
    ) as [any[], any];

    return res.json({
      success: true,
      message: 'Global attendance settings updated successfully',
      data: { settings: updatedSettings[0] }
    });
  } catch (error) {
    console.error('Update global attendance settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;

// ============================================
// NEW ENDPOINTS FOR AUTO-MARK SETTINGS
// ============================================

/**
 * PATCH /api/attendance/settings/auto-mark
 * Update auto-mark absent settings for a branch
 */
router.patch('/auto-mark', authenticateJWT, checkPermission('attendance:manage'), async (req: Request, res: Response) => {
  try {
    const { branchId, auto_mark_absent_enabled, auto_mark_absent_time, auto_mark_absent_timezone } = req.body;

    // If no branchId provided, use user's branch
    let targetBranchId = req.currentUser?.branch_id;
    if (branchId) {
      const branchIdNum = parseInt(branchId as string);
      if (isNaN(branchIdNum)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid branch ID'
        });
      }
      targetBranchId = branchIdNum;
    }

    if (!targetBranchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }

    // Check if branch exists
    const branch = await BranchModel.findById(targetBranchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Validate time format (HH:MM)
    if (auto_mark_absent_time && !/^\d{2}:\d{2}$/.test(auto_mark_absent_time)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Use HH:MM (24-hour format)'
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (auto_mark_absent_enabled !== undefined) {
      updateData.auto_mark_absent_enabled = auto_mark_absent_enabled;
    }
    if (auto_mark_absent_time !== undefined) {
      updateData.auto_mark_absent_time = auto_mark_absent_time;
    }
    if (auto_mark_absent_timezone !== undefined) {
      updateData.auto_mark_absent_timezone = auto_mark_absent_timezone;
    }

    // Update branch if any fields provided
    if (Object.keys(updateData).length > 0) {
      await BranchModel.update(targetBranchId, updateData);
    }

    // Return updated settings
    const updatedBranch = await BranchModel.findById(targetBranchId);
    
    return res.json({
      success: true,
      message: 'Auto-mark settings updated successfully',
      data: {
        settings: {
          branch_id: updatedBranch!.id,
          branch_name: updatedBranch!.name,
          auto_mark_absent_enabled: updatedBranch!.auto_mark_absent_enabled,
          auto_mark_absent_time: updatedBranch!.auto_mark_absent_time,
          auto_mark_absent_timezone: updatedBranch!.auto_mark_absent_timezone,
          attendance_lock_date: updatedBranch!.attendance_lock_date
        }
      }
    });
  } catch (error: any) {
    console.error('Update auto-mark settings error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

/**
 * POST /api/attendance/settings/lock-date
 * Manually lock attendance for a specific date
 */
router.post('/lock-date', authenticateJWT, checkPermission('attendance:manage'), async (req: Request, res: Response) => {
  try {
    const { date, branchId, reason } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // If no branchId provided, use user's branch
    let targetBranchId = req.currentUser?.branch_id;
    if (branchId) {
      const branchIdNum = parseInt(branchId as string);
      if (isNaN(branchIdNum)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid branch ID'
        });
      }
      targetBranchId = branchIdNum;
    }

    if (!targetBranchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }

    const lockDate = new Date(date);
    lockDate.setHours(0, 0, 0, 0);

    // Lock all attendance records for that branch/date
    const [lockResult]: any = await pool.execute(`
      UPDATE attendance a
      JOIN staff s ON a.user_id = s.user_id
      SET
        a.is_locked = TRUE,
        a.locked_at = NOW(),
        a.locked_by = ?,
        a.lock_reason = ?
      WHERE s.branch_id = ?
        AND a.date = ?
        AND a.is_locked = FALSE
    `, [req.currentUser.id, reason || 'Manual lock', targetBranchId, date]);

    // Update branch lock date
    await pool.execute(`
      UPDATE branches
      SET attendance_lock_date = LEAST(IFNULL(attendance_lock_date, ?), ?)
      WHERE id = ?
    `, [date, date, targetBranchId]);

    // Log the action
    await pool.execute(`
      INSERT INTO attendance_lock_log
        (branch_id, lock_date, locked_by, reason, attendance_count)
      VALUES (?, ?, ?, ?, ?)
    `, [targetBranchId, date, req.currentUser.id, reason || 'Manual lock', lockResult.affectedRows]);

    return res.json({
      success: true,
      message: `Locked ${lockResult.affectedRows} attendance records for ${date}`,
      data: {
        branch_id: targetBranchId,
        lock_date: date,
        locked_count: lockResult.affectedRows
      }
    });
  } catch (error: any) {
    console.error('Lock date error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/attendance/settings/lock-status
 * Get lock status for a branch
 */
router.get('/lock-status', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { branchId } = req.query;
    
    // If no branchId provided, use user's branch
    let targetBranchId = req.currentUser?.branch_id;
    if (branchId) {
      const branchIdNum = parseInt(branchId as string);
      if (isNaN(branchIdNum)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid branch ID'
        });
      }
      targetBranchId = branchIdNum;
    }

    if (!targetBranchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }

    const branch = await BranchModel.findById(targetBranchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Get lock log
    const [lockLog]: any = await pool.execute(`
      SELECT 
        l.*,
        u.name as locked_by_name
      FROM attendance_lock_log l
      LEFT JOIN users u ON l.locked_by = u.id
      WHERE l.branch_id = ?
      ORDER BY l.locked_at DESC
      LIMIT 10
    `, [targetBranchId]);

    return res.json({
      success: true,
      data: {
        branch_id: branch.id,
        branch_name: branch.name,
        attendance_lock_date: branch.attendance_lock_date,
        auto_mark_absent_enabled: branch.auto_mark_absent_enabled,
        auto_mark_absent_time: branch.auto_mark_absent_time,
        auto_mark_absent_timezone: branch.auto_mark_absent_timezone,
        recent_locks: lockLog
      }
    });
  } catch (error: any) {
    console.error('Get lock status error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

/**
 * PATCH /api/attendance/:id/unlock
 * Unlock a specific attendance record (admin only)
 */
router.patch('/:id/unlock', authenticateJWT, checkPermission('attendance:admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const [attendance]: any = await pool.execute(`
      SELECT * FROM attendance WHERE id = ?
    `, [id]);

    if (attendance.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    if (!attendance[0].is_locked) {
      return res.status(400).json({
        success: false,
        message: 'Attendance is not locked'
      });
    }

    // Unlock
    await pool.execute(`
      UPDATE attendance
      SET is_locked = FALSE, locked_at = NULL, locked_by = NULL, lock_reason = NULL
      WHERE id = ?
    `, [id]);

    return res.json({
      success: true,
      message: 'Attendance unlocked successfully'
    });
  } catch (error: any) {
    console.error('Unlock attendance error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});