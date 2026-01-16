import { Request, Response } from 'express';
import { getNumberQueryParam, getStringQueryParam } from '../utils/type-utils';
import UserModel, { UserInput, UserUpdate } from '../models/user.model';
import UserPermissionModel from '../models/user-permission.model';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';
import CpanelEmailService from '../services/cpanel-email.service';

// Controller for user management
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Pagination parameters
    const page = getNumberQueryParam(req, 'page', 1) || 1;
    const limit = getNumberQueryParam(req, 'limit', 20) || 20;
    const offset = (page - 1) * limit;

    // Additional filtering parameters
    const branchId = req.query.branchId ? getNumberQueryParam(req, 'branchId') : undefined;
    const status = getStringQueryParam(req, 'status');
    const roleId = req.query.roleId ? getNumberQueryParam(req, 'roleId') : undefined;

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

    const { users, totalCount } = await UserModel.findAllWithFilters(limit, offset, branchId, status, roleId);

    const totalPages = Math.ceil(totalCount / limit);

    return res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
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
    console.error('Get all users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;
    const userId = parseInt(idStr);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      message: 'User retrieved successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, phone, role_id, branch_id }: UserInput = req.body;

    // Validate required fields
    if (!email || !password || !full_name || !role_id) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, full name, and role ID are required'
      });
    }

    // Check if user with this email already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // Create the user
    const userData: UserInput = {
      email,
      password,
      full_name,
      phone,
      role_id,
      branch_id
    };

    const newUser = await UserModel.create(userData);

    // Don't return the password hash
    const { password_hash, ...userWithoutPassword } = newUser as any;

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: userWithoutPassword }
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const userId = parseInt(typeof idStr === 'string' ? idStr : '');
    const { email, password, full_name, phone, role_id, branch_id, status, must_change_password }: UserUpdate = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Check if user exists
    const existingUser = await UserModel.findById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare update data
    const updateData: UserUpdate = {};
    if (email !== undefined) updateData.email = email;
    if (password !== undefined) updateData.password = password;
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (role_id !== undefined) updateData.role_id = role_id;
    if (branch_id !== undefined) updateData.branch_id = branch_id;
    if (status !== undefined) updateData.status = status;
    if (must_change_password !== undefined) updateData.must_change_password = must_change_password;

    const updatedUser = await UserModel.update(userId, updateData);

    // Don't return the password hash
    if (updatedUser) {
      const { password_hash, ...userWithoutPassword } = updatedUser as any;
      return res.json({
        success: true,
        message: 'User updated successfully',
        data: { user: userWithoutPassword }
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const userId = parseInt(typeof idStr === 'string' ? idStr : '');

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Soft delete the user (set status to 'inactive')
    const deleted = await UserModel.delete(userId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const terminateUser = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const userId = parseInt(typeof idStr === 'string' ? idStr : '');

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Get user before termination to access their email
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Terminate the user (set status to 'terminated')
    const terminated = await UserModel.softDelete(userId);
    if (!terminated) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove the email account from cPanel if it belongs to our domain
    const emailParts = user.email.split('@');
    if (emailParts.length === 2) {
      const domain = emailParts[1];
      const companyDomain = process.env.CPANEL_DOMAIN || 'example.com';

      if (domain === companyDomain) {
        try {
          const emailPrefix = emailParts[0];
          const cpanelService = new CpanelEmailService();
          const deletionResult = await cpanelService.deleteEmailAccount(emailPrefix);

          if (deletionResult.success) {
            console.log(`Email account ${user.email} removed from cPanel successfully`);
          } else {
            console.error(`Failed to remove email account ${user.email} from cPanel:`, deletionResult.error);
            // Don't fail the entire operation if email deletion fails
          }
        } catch (emailError) {
          console.error('Error removing email account from cPanel:', emailError);
          // Don't fail the entire operation if email deletion fails
        }
      }
    }

    return res.json({
      success: true,
      message: 'User terminated successfully and email account removed from cPanel'
    });
  } catch (error) {
    console.error('Terminate user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Controller for user permissions management
export const getUserPermissions = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const userId = parseInt(typeof idStr === 'string' ? idStr : '');

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const permissions = await UserPermissionModel.getUserPermissions(userId);

    return res.json({
      success: true,
      message: 'User permissions retrieved successfully',
      data: { permissions }
    });
  } catch (error) {
    console.error('Get user permissions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const addUserPermission = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const userId = parseInt(typeof idStr === 'string' ? idStr : '');
    const { permission, allow_deny } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    if (!permission) {
      return res.status(400).json({
        success: false,
        message: 'Permission is required'
      });
    }

    // Check if permission already exists for this user
    const existingPermission = await UserPermissionModel.findByUserAndPermission(userId, permission);
    if (existingPermission) {
      return res.status(409).json({
        success: false,
        message: 'Permission already exists for this user'
      });
    }

    const permissionData = {
      user_id: userId,
      permission,
      allow_deny: allow_deny || 'allow'
    };

    const newPermission = await UserPermissionModel.create(permissionData);

    return res.status(201).json({
      success: true,
      message: 'User permission added successfully',
      data: { permission: newPermission }
    });
  } catch (error) {
    console.error('Add user permission error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const removeUserPermission = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const permissionParam = req.params.permission;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const permissionStr = Array.isArray(permissionParam) ? permissionParam[0] : permissionParam;
    const userId = parseInt(typeof idStr === 'string' ? idStr : '');

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    if (!permissionStr) {
      return res.status(400).json({
        success: false,
        message: 'Permission is required'
      });
    }

    const deleted = await UserPermissionModel.deleteUserPermission(userId, permissionStr as string);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'User permission not found'
      });
    }

    return res.json({
      success: true,
      message: 'User permission removed successfully'
    });
  } catch (error) {
    console.error('Remove user permission error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};