import { Request, Response } from 'express';
import { pool } from '../config/database';
import { 
  PERMISSION_DEFINITIONS, 
  isValidPermission,
  getAllPermissionCategories 
} from '../services/permission-definitions.service';

// Create a new role with selected permissions
export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, description, permissions } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    // Validate permissions if provided
    if (permissions && Array.isArray(permissions)) {
      for (const permission of permissions) {
        if (!isValidPermission(permission)) {
          return res.status(400).json({
            success: false,
            message: `Invalid permission: ${permission}`
          });
        }
      }
    }

    // Check if role with this name already exists
    const [existingRows]: any = await pool.execute(
      'SELECT id FROM roles WHERE name = ?',
      [name]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A role with this name already exists'
      });
    }

    // Create the role in the roles table
    const [roleResult]: any = await pool.execute(
      'INSERT INTO roles (name, description, permissions, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [name, description || '', JSON.stringify(permissions || [])]
    );

    const roleId = roleResult.insertId;

    // If permissions were provided, add them to the roles_permissions table
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      for (const permission of permissions) {
        await pool.execute(
          'INSERT INTO roles_permissions (role_id, permission, allow_deny, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
          [roleId, permission, 'allow']
        );
      }
    }

    // Fetch the created role
    const [newRoleRows]: any = await pool.execute(
      'SELECT * FROM roles WHERE id = ?',
      [roleId]
    );

    const newRole = newRoleRows[0];

    return res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: {
        role: {
          id: newRole.id,
          name: newRole.name,
          description: newRole.description,
          permissions: JSON.parse(newRole.permissions || '[]'),
          created_at: newRole.created_at
        }
      }
    });
  } catch (error) {
    console.error('Create role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during role creation'
    });
  }
};

// Get all available permissions for role creation
export const getAvailablePermissions = async (req: Request, res: Response) => {
  try {
    return res.json({
      success: true,
      data: {
        permissions: PERMISSION_DEFINITIONS,
        categories: getAllPermissionCategories()
      }
    });
  } catch (error) {
    console.error('Get available permissions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching permissions'
    });
  }
};

// Get all roles
export const getAllRoles = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.execute(
      'SELECT id, name, description, permissions, created_at, updated_at FROM roles ORDER BY name'
    );

    // Parse the permissions JSON for each role
    const roles = rows.map((role: any) => ({
      ...role,
      permissions: JSON.parse(role.permissions || '[]')
    }));

    return res.json({
      success: true,
      data: {
        roles
      }
    });
  } catch (error) {
    console.error('Get all roles error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching roles'
    });
  }
};

// Update a role
export const updateRole = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const roleIdStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const roleId = parseInt(typeof roleIdStr === 'string' ? roleIdStr : '');

    if (isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role ID'
      });
    }

    const { name, description, permissions } = req.body;

    // Check if role exists
    const [existingRows]: any = await pool.execute(
      'SELECT id FROM roles WHERE id = ?',
      [roleId]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // NOTE: Permission validation is lenient - accepts any string
    // This allows for dynamic permission addition without backend changes
    // Permissions are just strings stored in JSON format

    // Prepare update data
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      // Check if new name conflicts with existing roles
      const [conflictRows]: any = await pool.execute(
        'SELECT id FROM roles WHERE name = ? AND id != ?',
        [name, roleId]
      );
      
      if (conflictRows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'A role with this name already exists'
        });
      }
      
      updates.push('name = ?');
      values.push(name);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (permissions !== undefined) {
      updates.push('permissions = ?');
      values.push(JSON.stringify(permissions));
    }

    if (updates.length === 0) {
      // No updates to make, return current role
      const [currentRoleRows]: any = await pool.execute(
        'SELECT * FROM roles WHERE id = ?',
        [roleId]
      );
      
      const currentRole = currentRoleRows[0];
      
      return res.json({
        success: true,
        message: 'No updates provided, returning current role',
        data: {
          role: {
            id: currentRole.id,
            name: currentRole.name,
            description: currentRole.description,
            permissions: JSON.parse(currentRole.permissions || '[]'),
            created_at: currentRole.created_at,
            updated_at: currentRole.updated_at
          }
        }
      });
    }

    values.push(roleId);

    // Perform the update
    await pool.execute(
      `UPDATE roles SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // If permissions were updated, update the roles_permissions table
    if (permissions !== undefined) {
      // First, delete all existing permissions for this role
      await pool.execute(
        'DELETE FROM roles_permissions WHERE role_id = ?',
        [roleId]
      );

      // Then, add the new permissions
      if (Array.isArray(permissions) && permissions.length > 0) {
        for (const permission of permissions) {
          await pool.execute(
            'INSERT INTO roles_permissions (role_id, permission, allow_deny, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
            [roleId, permission, 'allow']
          );
        }
      }
    }

    // Fetch the updated role
    const [updatedRoleRows]: any = await pool.execute(
      'SELECT * FROM roles WHERE id = ?',
      [roleId]
    );

    const updatedRole = updatedRoleRows[0];

    return res.json({
      success: true,
      message: 'Role updated successfully',
      data: {
        role: {
          id: updatedRole.id,
          name: updatedRole.name,
          description: updatedRole.description,
          permissions: JSON.parse(updatedRole.permissions || '[]'),
          created_at: updatedRole.created_at,
          updated_at: updatedRole.updated_at
        }
      }
    });
  } catch (error) {
    console.error('Update role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during role update'
    });
  }
};

// Delete a role
export const deleteRole = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const roleIdStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const roleId = parseInt(typeof roleIdStr === 'string' ? roleIdStr : '');

    if (isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role ID'
      });
    }

    // Check if role exists
    const [existingRows]: any = await pool.execute(
      'SELECT id, name FROM roles WHERE id = ?',
      [roleId]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    const roleName = existingRows[0].name;

    // Check if the role is a Super Admin role (typically has wildcard permissions)
    if (roleName === 'Super Admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete Super Admin role'
      });
    }

    // Check if any users are assigned to this role
    const [userRows]: any = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE role_id = ?',
      [roleId]
    );

    if (userRows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete role that has users assigned to it'
      });
    }

    // Delete role permissions first
    await pool.execute(
      'DELETE FROM roles_permissions WHERE role_id = ?',
      [roleId]
    );

    // Delete the role
    await pool.execute(
      'DELETE FROM roles WHERE id = ?',
      [roleId]
    );

    return res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Delete role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during role deletion'
    });
  }
};