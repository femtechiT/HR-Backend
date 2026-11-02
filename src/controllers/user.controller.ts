import { Request, Response } from 'express';
import { pool } from '../config/database';
import { getNumberQueryParam, getStringQueryParam } from '../utils/type-utils';
import UserModel, { UserInput, UserUpdate } from '../models/user.model';
import StaffModel from '../models/staff.model';
import UserPermissionModel from '../models/user-permission.model';
import RoleModel from '../models/role.model';
import PermissionService from '../services/permission.service';
import { generateTemporaryPassword } from '../utils/password-utils';
import { sendPasswordResetEmail } from '../services/email.service';

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
    const search = getStringQueryParam(req, 'search');

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

    const { users, totalCount } = await UserModel.findAllWithFilters(limit, offset, branchId, status, roleId, search);

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

export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const userId = parseInt(typeof idStr === 'string' ? idStr : '', 10);

    if (!req.currentUser) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (Number.isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const tempPassword = generateTemporaryPassword();
    await UserModel.update(userId, { password: tempPassword, must_change_password: true });

    const requestedBy = req.currentUser.full_name || req.currentUser.email || `User ${req.currentUser.id}`;
    let emailSent = false;
    try {
      await sendPasswordResetEmail({
        to: user.email,
        fullName: user.full_name,
        loginEmail: user.email,
        temporaryPassword: tempPassword,
        requestedBy
      });
      emailSent = true;
    } catch (emailError) {
      console.error('Password reset email failed to send, but password was changed:', emailError);
    }

    return res.json({
      success: true,
      message: emailSent
        ? 'Temporary password generated and sent successfully'
        : 'Temporary password generated but email failed to send. Please check email settings and try again.',
      data: { user: { id: user.id, email: user.email }, emailSent }
    });
  } catch (error) {
    console.error('Reset user password error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const userId = parseInt(typeof idStr === 'string' ? idStr : '', 10);
    const roleId = parseInt(String((req.body as any)?.role_id ?? ''), 10);

    if (Number.isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    if (Number.isNaN(roleId)) {
      return res.status(400).json({ success: false, message: 'Invalid role ID' });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const role = await RoleModel.findById(roleId);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    const updatedUser = await UserModel.update(userId, { role_id: roleId });
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Invalidate permission cache since role changed
    await PermissionService.invalidateUserPermissionCache(userId);

    const { password_hash, ...userWithoutPassword } = updatedUser as any;
    return res.json({
      success: true,
      message: 'User role updated successfully',
      data: { user: userWithoutPassword }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
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

    // Check if user with this email already exists. A soft-deleted account
    // doesn't block reuse — their email is free for a new hire.
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser && !existingUser.deleted_at) {
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

    // Dropping the DB UNIQUE constraint on email (Migration 126, to let a
    // soft-deleted account's email be reused) means this duplicate check now
    // has to happen here in code — it used to be caught for free at the SQL
    // layer. Only a live (non-deleted) account other than this one counts
    // as a conflict.
    if (email !== undefined && email !== existingUser.email) {
      const emailOwner = await UserModel.findByEmail(email);
      if (emailOwner && !emailOwner.deleted_at && emailOwner.id !== userId) {
        return res.status(409).json({
          success: false,
          message: 'A user with this email already exists'
        });
      }
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

    // Invalidate permission cache if role_id changed
    if (role_id !== undefined) {
      await PermissionService.invalidateUserPermissionCache(userId);
    }

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

    // Keep users.status and staff.status in sync atomically — if the staff-side
    // update fails, the user-side one must not silently stick either.
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const deleted = await UserModel.delete(userId, connection);
      if (!deleted) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const linkedStaff = await StaffModel.findByUserId(userId);
      if (linkedStaff) {
        await StaffModel.deactivate(linkedStaff.id, connection);
      }

      await connection.commit();

      return res.json({
        success: true,
        message: 'User deactivated successfully'
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
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

    // Keep users.status and staff.status in sync atomically.
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const terminated = await UserModel.softDelete(userId, connection);
      if (!terminated) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const linkedStaff = await StaffModel.findByUserId(userId);
      if (linkedStaff) {
        await StaffModel.delete(linkedStaff.id, connection);
      }

      await connection.commit();

      return res.json({
        success: true,
        message: 'User terminated successfully'
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Terminate user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// True soft-delete (Migration 126) — distinct from deleteUser/terminateUser
// above, which only flip `status`. This hides the account+staff record
// everywhere except User Management's "Deleted" filter, and frees their
// email for reuse by a new hire (see createUser's duplicate-email check).
export const softDeleteUser = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const userId = parseInt(typeof idStr === 'string' ? idStr : '');
    const deletedBy = req.currentUser?.id;

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    if (!deletedBy) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No user information'
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Keep users.deleted_at and staff.deleted_at in sync atomically.
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const deleted = await UserModel.markAsDeleted(userId, deletedBy, connection);
      if (!deleted) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const linkedStaff = await StaffModel.findByUserId(userId);
      if (linkedStaff) {
        await StaffModel.markAsDeleted(linkedStaff.id, deletedBy, connection);
      }

      await connection.commit();

      return res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Soft-delete user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Undo softDeleteUser. Leaves `status` as-is — restoring visibility isn't
// the same as reactivating employment, those stay separate admin actions.
export const restoreUser = async (req: Request, res: Response) => {
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

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const restored = await UserModel.restore(userId, connection);
      if (!restored) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const linkedStaff = await StaffModel.findByUserId(userId);
      if (linkedStaff) {
        await StaffModel.restore(linkedStaff.id, connection);
      }

      await connection.commit();

      return res.json({
        success: true,
        message: 'User restored successfully'
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Restore user error:', error);
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

    // Invalidate permission cache so this permission takes effect immediately
    await PermissionService.invalidateUserPermissionCache(userId);

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

    // Invalidate permission cache so removal takes effect immediately
    await PermissionService.invalidateUserPermissionCache(userId);

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
