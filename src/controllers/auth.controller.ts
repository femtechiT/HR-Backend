import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import JwtUtil from '../utils/jwt.util';
import UserModel from '../models/user.model';
import PermissionService from '../services/permission.service';

interface LoginRequestBody {
  email: string;
  password: string;
}

interface RefreshTokenRequestBody {
  refreshToken: string;
}

export const login = async (req: Request<{}, {}, LoginRequestBody>, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Compare passwords
    const isValidPassword = await UserModel.comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role_id
    };

    const accessToken = JwtUtil.generateAccessToken(payload);
    const refreshToken = JwtUtil.generateRefreshToken(payload);

    // Get user permissions manifest
    const permissions = await PermissionService.generatePermissionManifest(user.id);

    // Check if user must change password
    const mustChangePassword = user.must_change_password;

    // Return success response with tokens and user data
    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          roleId: user.role_id,
          branchId: user.branch_id,
          status: user.status,
          mustChangePassword: mustChangePassword
        },
        permissions,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '2h'
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    // In a real implementation, you might want to blacklist the refresh token
    // For now, we'll just return a success response
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const refreshToken = async (req: Request<{}, {}, RefreshTokenRequestBody>, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    try {
      // Verify refresh token
      const decoded = JwtUtil.verifyRefreshToken(refreshToken);

      // Check if user still exists and is active
      const user = await UserModel.findById(decoded.userId);
      if (!user || user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'Invalid or inactive user'
        });
      }

      // Generate new access token
      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role_id
      };

      const newAccessToken = JwtUtil.generateAccessToken(payload);
      const newRefreshToken = JwtUtil.generateRefreshToken(payload);

      return res.json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          tokens: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN || '2h'
          }
        }
      });
    } catch (error) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getPermissions = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get user permissions manifest
    const permissions = await PermissionService.generatePermissionManifest(req.currentUser.id);

    return res.json({
      success: true,
      message: 'Permissions retrieved successfully',
      data: {
        permissions
      }
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};