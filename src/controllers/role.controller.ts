import { Request, Response } from 'express';
import RoleModel from '../models/role.model';
import RolePermissionModel from '../models/role-permission.model';
import PermissionService from '../services/permission.service';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';

// Controller for role management
export const getAllRoles = async (req: Request, res: Response) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Additional filtering parameters
    const name = Array.isArray(req.query.name) ? req.query.name[0] : req.query.name;

    // Validate pagination parameters
    if (page < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page number must be greater than 0'
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100'
      });
    }

    const { roles, totalCount } = await RoleModel.findAllWithFilters(limit, offset, typeof name === 'string' ? name : undefined);

    const totalPages = Math.ceil(totalCount / limit);

    return res.json({
      success: true,
      message: 'Roles retrieved successfully',
      data: {
        roles,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          nextPage: page < totalPages ? page + 1 : null,
          prevPage: page > 1 ? page - 1 : null
        }
      }
    });
  } catch (error) {
    console.error('Get all roles error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getRoleById = async (req: Request, res: Response) => {
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

    const role = await RoleModel.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    return res.json({
      success: true,
      message: 'Role retrieved successfully',
      data: { role }
    });
  } catch (error) {
    console.error('Get role by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

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

    // Check if role with this name already exists
    const existingRole = await RoleModel.findByName(name);
    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: 'A role with this name already exists'
      });
    }

    // Create the role
    const roleData = {
      name,
      description: description || '',
      permissions: permissions || []
    };

    const newRole = await RoleModel.create(roleData);

    return res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: { role: newRole }
    });
  } catch (error) {
    console.error('Create role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const roleIdStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const roleId = parseInt(typeof roleIdStr === 'string' ? roleIdStr : '');
    const { name, description, permissions } = req.body;

    if (isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role ID'
      });
    }

    // Check if role exists
    const existingRole = await RoleModel.findById(roleId);
    if (!existingRole) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (permissions !== undefined) updateData.permissions = permissions;

    const updatedRole = await RoleModel.update(roleId, updateData);

    return res.json({
      success: true,
      message: 'Role updated successfully',
      data: { role: updatedRole }
    });
  } catch (error) {
    console.error('Update role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

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

    const deleted = await RoleModel.delete(roleId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    return res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Delete role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Controller for role permissions management
export const getRolePermissions = async (req: Request, res: Response) => {
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

    const permissions = await RolePermissionModel.getRolePermissions(roleId);

    return res.json({
      success: true,
      message: 'Role permissions retrieved successfully',
      data: { permissions }
    });
  } catch (error) {
    console.error('Get role permissions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const addRolePermission = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const roleIdStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const roleId = parseInt(typeof roleIdStr === 'string' ? roleIdStr : '');
    const { permission, allow_deny } = req.body;

    if (isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role ID'
      });
    }

    if (!permission) {
      return res.status(400).json({
        success: false,
        message: 'Permission is required'
      });
    }

    // Check if permission already exists for this role
    const existingPermission = await RolePermissionModel.findByRoleAndPermission(roleId, permission);
    if (existingPermission) {
      return res.status(409).json({
        success: false,
        message: 'Permission already exists for this role'
      });
    }

    const permissionData = {
      role_id: roleId,
      permission,
      allow_deny: allow_deny || 'allow'
    };

    const newPermission = await RolePermissionModel.create(permissionData);
    await PermissionService.invalidateAllUserPermissionCaches();

    return res.status(201).json({
      success: true,
      message: 'Role permission added successfully',
      data: { permission: newPermission }
    });
  } catch (error) {
    console.error('Add role permission error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const removeRolePermission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const permissionParam = req.params.permission;
    const permissionStr = Array.isArray(permissionParam) ? permissionParam[0] : permissionParam;

    const idParam = req.params.id;
    const roleIdStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const roleId = parseInt(typeof roleIdStr === 'string' ? roleIdStr : '');

    if (isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role ID'
      });
    }

    if (!permissionStr) {
      return res.status(400).json({
        success: false,
        message: 'Permission is required'
      });
    }

    const deleted = await RolePermissionModel.deleteRolePermission(roleId, permissionStr as string);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Role permission not found'
      });
    }

    await PermissionService.invalidateAllUserPermissionCaches();

    return res.json({
      success: true,
      message: 'Role permission removed successfully'
    });
  } catch (error) {
    console.error('Remove role permission error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
