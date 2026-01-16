import express, { Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import RolePermissionModel from '../models/role-permission.model';
import RoleModel from '../models/role.model';

const router = express.Router();

// GET /api/permissions/available - Get all possible permissions in the system
router.get('/available', authenticateJWT, checkPermission('permissions.manage'), async (req: Request, res: Response) => {
  try {
    // Define all possible permissions in the system
    const allPermissions = [
      // Staff permissions
      'staff.create', 'staff.read', 'staff.update', 'staff.delete',
      
      // User permissions
      'user.create', 'user.read', 'user.update', 'user.delete',
      
      // Role permissions
      'role.create', 'role.read', 'role.update', 'role.delete',
      'permission.manage',
      
      // Form permissions
      'form.create', 'form.read', 'form.update', 'form.delete',
      'form_submission.read', 'form_submission.update',
      
      // Leave permissions
      'leave.create', 'leave.read', 'leave.update', 'leave.delete',
      'leave.approve',
      
      // Attendance permissions
      'attendance.create', 'attendance.read', 'attendance.update', 'attendance.delete',
      'attendance.manage',
      
      // Payroll permissions
      'payroll.create', 'payroll.read', 'payroll.update', 'payroll.delete',
      'payroll.manage',
      
      // Appraisal system permissions
      'appraisal_template.create', 'appraisal_template.read', 'appraisal_template.update', 'appraisal_template.delete',
      'metric.create', 'metric.read', 'metric.update', 'metric.delete',
      'kpi.create', 'kpi.read', 'kpi.update', 'kpi.delete',
      'target.create', 'target.read', 'target.update', 'target.delete',
      'appraisal.create', 'appraisal.read', 'appraisal.update', 'appraisal.submit',
      'performance.read',
      
      // Branch permissions
      'branch.create', 'branch.read', 'branch.update', 'branch.delete',
      
      // Document permissions
      'document.upload', 'document.download',
      
      // Report permissions
      'report.view', 'report.generate',
      
      // Settings permissions
      'setting.configure',
      
      // Audit permissions
      'audit.read'
    ];

    res.json({
      success: true,
      data: allPermissions
    });
  } catch (error) {
    console.error('Error fetching available permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available permissions',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// GET /api/roles/:roleId/permissions - Get permissions assigned to a specific role
router.get('/roles/:roleId/permissions', authenticateJWT, checkPermission('role.read'), async (req: Request, res: Response) => {
  try {
    const roleIdParam = Array.isArray(req.params.roleId) ? req.params.roleId[0] : req.params.roleId;
    const roleId = parseInt(roleIdParam);
    if (isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role ID'
      });
    }

    // Check if role exists
    const role = await RoleModel.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    const permissions = await RolePermissionModel.findByRoleId(roleId);
    
    res.json({
      success: true,
      data: permissions.map(rp => rp.permission)
    });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch role permissions',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// POST /api/roles/:roleId/permissions - Assign multiple permissions to a role
router.post('/roles/:roleId/permissions', authenticateJWT, checkPermission('permission.manage'), async (req: Request, res: Response) => {
  try {
    const roleIdParam = Array.isArray(req.params.roleId) ? req.params.roleId[0] : req.params.roleId;
    const roleId = parseInt(roleIdParam);
    if (isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role ID'
      });
    }

    const { permissions } = req.body;

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Permissions array is required and cannot be empty'
      });
    }

    // Validate that the role exists
    const role = await RoleModel.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Add each permission to the role (using INSERT IGNORE to avoid duplicates)
    const results = [];
    for (const permission of permissions) {
      try {
        await RolePermissionModel.create({
          role_id: roleId,
          permission: permission,
          allow_deny: 'allow'
        });
        results.push({ permission, status: 'assigned' });
      } catch (err) {
        results.push({ permission, status: 'failed', error: (err as Error).message });
      }
    }

    res.json({
      success: true,
      message: `Permissions assigned to role successfully`,
      data: results
    });
  } catch (error) {
    console.error('Error assigning permissions to role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign permissions to role',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// DELETE /api/roles/:roleId/permissions - Remove specific permissions from a role
router.delete('/roles/:roleId/permissions', authenticateJWT, checkPermission('permission.manage'), async (req: Request, res: Response) => {
  try {
    const roleIdParam = Array.isArray(req.params.roleId) ? req.params.roleId[0] : req.params.roleId;
    const roleId = parseInt(roleIdParam);
    if (isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role ID'
      });
    }

    const { permissions } = req.body;

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Permissions array is required and cannot be empty'
      });
    }

    // Validate that the role exists
    const role = await RoleModel.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Remove multiple permissions from the role at once
    const success = await RolePermissionModel.deleteMultipleRolePermissions(roleId, permissions);

    const results = permissions.map(permission => ({
      permission,
      status: success ? 'removed' : 'failed'
    }));

    res.json({
      success: true,
      message: `Permissions removed from role successfully`,
      data: results
    });
  } catch (error) {
    console.error('Error removing permissions from role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove permissions from role',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

export default router;