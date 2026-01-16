import { Request, Response } from 'express';
import UserModel from '../models/user.model';
import bcrypt from 'bcryptjs';

export const changePasswordAfterFirstLogin = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get the current user to verify the current password
    const user = await UserModel.findById(req.currentUser.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify the current password is the temporary one
    const isValidPassword = await UserModel.comparePassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Validate new password strength (optional but recommended)
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    const [result] = await require('../config/database').pool.execute(
      `UPDATE ${UserModel.tableName} SET password_hash = ? WHERE id = ?`,
      [hashedNewPassword, req.currentUser.id]
    );

    // Remove the must_change_password flag
    await UserModel.setPasswordChangeRequirement(req.currentUser.id, false);

    return res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password after first login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const forcePasswordChange = async (req: Request, res: Response) => {
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

    // Set the must_change_password flag to true
    const updatedUser = await UserModel.setPasswordChangeRequirement(userId, true);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      message: 'Password change requirement set successfully',
      data: { user: { id: updatedUser.id, email: updatedUser.email } }
    });
  } catch (error) {
    console.error('Force password change error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};