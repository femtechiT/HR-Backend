import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import JwtUtil from '../utils/jwt.util';
import UserModel from '../models/user.model';
import PermissionService from '../services/permission.service';

interface LoginRequestBody {
  email: string;
  password: string;
  rememberMe?: boolean | string;
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Optional: Validate company email domain (configure via environment variable)
    const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;
    if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
      return res.status(403).json({
        success: false,
        message: `Only ${allowedDomain} email addresses are allowed`
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

    // Check if user wants persistent login (remember me)
    const { rememberMe } = req.body;
    const usePersistentLogin = rememberMe === true || rememberMe === 'true';
    
    // Generate tokens with appropriate expiration
    const accessToken = JwtUtil.generateAccessToken(payload);
    const refreshToken = JwtUtil.generateRefreshToken(payload);
    
    // Set cookie expiration based on remember me
    const cookieMaxAge = usePersistentLogin 
      ? 90 * 24 * 60 * 60 * 1000  // 90 days
      : 7 * 24 * 60 * 60 * 1000;  // 7 days

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: cookieMaxAge,
      path: '/'
    });

    // Get user permissions manifest
    const permissions = await PermissionService.generatePermissionManifest(user.id);

    // NOTE: We do NOT block login based on permissions
    // - All authenticated users can access the mobile app
    // - HR Admin Dashboard access is controlled by frontend permissions
    // - Users without permissions can still use self-service features

    // Check if user must change password and if profile is complete
    const needsPasswordChange = !!user.must_change_password;
    const needsProfileCompletion = !user.phone;

    // Track invitation metrics for users who came from invitations
    // Auto-accept pending invitations + track first login
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    try {
      const { pool } = await import('../config/database');

      // Step 1: Auto-accept any pending invitation for this user
      const [pendingRows]: any = await pool.execute(
        `SELECT si.id FROM staff_invitations si
         WHERE si.user_id = ? AND si.status = 'pending'
         LIMIT 1`,
        [user.id]
      );

      if (pendingRows.length > 0) {
        await pool.execute(
          `UPDATE staff_invitations
           SET status = 'accepted',
               accepted_at = NOW(),
               first_login_at = NOW(),
               first_login_ip = ?,
               profile_completed = ?
           WHERE id = ?`,
          [ip, !!user.phone ? 1 : 0, pendingRows[0].id]
        );
        console.log(`[Invite Tracking] Auto-accepted invitation for user ${user.id} (${user.email}) on first login`);
      } else {
        // Step 2: Track first login for already-accepted invitations
        const [acceptedRows]: any = await pool.execute(
          `SELECT si.id FROM staff_invitations si
           WHERE si.user_id = ? AND si.status = 'accepted' AND si.first_login_at IS NULL
           LIMIT 1`,
          [user.id]
        );

        if (acceptedRows.length > 0) {
          await pool.execute(
            `UPDATE staff_invitations
             SET first_login_at = NOW(),
                 first_login_ip = ?,
                 profile_completed = ?
             WHERE id = ?`,
            [ip, !!user.phone ? 1 : 0, acceptedRows[0].id]
          );
          console.log(`[Invite Tracking] Recorded first login for user ${user.id} (${user.email})`);
        } else if (!needsPasswordChange) {
          // Step 3: Update last_activity for returning users
          await pool.execute(
            `UPDATE staff_invitations SET last_activity_at = NOW()
             WHERE user_id = ? AND status = 'accepted'`,
            [user.id]
          );
        }
      }
    } catch (trackingError) {
      // Don't fail login if tracking fails
      console.error('Invitation tracking error (non-critical):', trackingError);
    }

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
          profile_picture: user.profile_picture,
          needs_password_change: needsPasswordChange,
          needs_profile_completion: needsProfileCompletion
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