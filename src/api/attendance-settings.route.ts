import { Router, Request, Response } from 'express';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';
import BranchModel from '../models/branch.model';
import { pool } from '../config/database';

const router = Router();

// GET /api/attendance/settings - Get attendance settings for a branch
router.get('/settings', authenticateJWT, checkPermission('attendance:manage'), async (req: Request, res: Response) => {
  try {
    const { branchId } = req.query;

    // If no branchId provided, get settings for user's branch
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
router.patch('/settings', authenticateJWT, checkPermission('attendance:manage'), async (req: Request, res: Response) => {
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
      
      for (const [key, value] of Object.entries(settings)) {
        if (typeof value !== 'undefined') {
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
      
      for (const [key, value] of Object.entries(settings)) {
        if (typeof value !== 'undefined') {
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
router.get('/settings/global', authenticateJWT, checkPermission('attendance:manage'), async (req: Request, res: Response) => {
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
router.patch('/settings/global', authenticateJWT, checkPermission('attendance:manage'), async (req: Request, res: Response) => {
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
      const values = [1]; // Global settings always has ID 1
      const placeholders = ['?'];
      
      for (const [key, value] of Object.entries(settings)) {
        if (typeof value !== 'undefined') {
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