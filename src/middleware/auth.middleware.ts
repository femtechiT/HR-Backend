import { Request, Response, NextFunction } from 'express';
import JwtUtil from '../utils/jwt.util';
import UserModel from '../models/user.model';
import PermissionService from '../services/permission.service';
// import ApiKeyModel from '../models/api-key.model';  // API Keys temporarily disabled

declare global {
  namespace Express {
    interface Request {
      currentUser?: any;
      numericId?: number;
      // apiKey?: any; // API key information when authenticated via API key (disabled)
    }
  }
}

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Authentication middleware called for URL:', req.url);
    console.log('Authorization header present:', !!req.headers.authorization);
    
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log('No authorization header found');
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    console.log('Authorization header value:', authHeader.substring(0, 20) + '...');

    // Check if it's a JWT token (starts with "Bearer ")
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]; // Get the token part after "Bearer "

      console.log('Extracted token length:', token ? token.length : 0);

      if (!token) {
        console.log('No token found after Bearer prefix');
        return res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
      }

      let decoded;
      try {
        decoded = JwtUtil.verifyAccessToken(token);
        console.log('Token decoded successfully, user ID:', decoded.userId);
      } catch (verifyError) {
        console.error('Token verification failed:', verifyError);
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      // Fetch user from database to ensure they exist and are active
      const user = await UserModel.findById(decoded.userId);
      console.log('Fetched user from DB:', user ? { id: user.id, email: user.email, status: user.status } : 'User not found');

      if (!user || user.status !== 'active') {
        console.log('User not found or not active');
        return res.status(401).json({
          success: false,
          message: 'Invalid or inactive user'
        });
      }

      // Attach user info to request object
      req.currentUser = {
        id: user.id,
        email: user.email,
        role_id: user.role_id,
        branch_id: user.branch_id
      };
      console.log('Attached current user to request:', req.currentUser);

      return next();
    } else {
      console.log('Invalid authentication header format');
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication header format. Use "Bearer <token>" for JWT authentication.'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Higher-order function to create permission check middleware
export const checkPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Permission check middleware called for:', permission);
      console.log('Current user:', req.currentUser);
      
      // Check JWT authentication
      if (req.currentUser) {
        console.log('Checking permission:', permission, 'for user ID:', req.currentUser.id);
        
        // Check if the user has the required permission
        const permissionResult = await PermissionService.hasPermission(req.currentUser.id, permission);
        console.log('Permission check result:', permissionResult);

        if (!permissionResult.hasPermission) {
          console.log('Permission denied for user:', req.currentUser.id, 'and permission:', permission);
          return res.status(403).json({
            success: false,
            message: `Insufficient permissions. Required: ${permission}`,
            requiredPermission: permission,
            permissionSource: permissionResult.source
          });
        }

        console.log('Permission granted, proceeding to next middleware');
        return next();
      }
      else {
        console.log('No current user found in request');
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
    } catch (error) {
      console.error('Permission check error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return res.status(500).json({
        success: false,
        message: 'Internal server error during permission check'
      });
    }
  };
};

// Middleware to attach user permissions manifest to the request
export const attachPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.currentUser) {
      const permissions = await PermissionService.generatePermissionManifest(req.currentUser.id);
      req.currentUser.permissions = permissions;
    }
    return next();
  } catch (error) {
    console.error('Error attaching permissions:', error);
    return next();
  }
};