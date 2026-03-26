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
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Check if it's a JWT token (starts with "Bearer ")
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]; // Get the token part after "Bearer "

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
      }

      let decoded;
      try {
        decoded = JwtUtil.verifyAccessToken(token);
      } catch (verifyError) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      // Fetch user from database to ensure they exist and are active
      const user = await UserModel.findById(decoded.userId);

      if (!user || user.status !== 'active') {
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

      return next();
    } else {
      console.log('Invalid authentication header format');
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication header format. Use "Bearer <token>" for JWT authentication.'
      });
    }
  } catch (error: any) {
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
      // Check JWT authentication
      if (req.currentUser) {
        // Try both permission formats (dots and colons) for backwards compatibility
        const permissionFormats = [
          permission,
          permission.replace('.', ':'),  // staff.update -> staff:update
          permission.replace(':', '.')   // staff:read -> staff.read
        ];
        
        let hasAccess = false;
        let permissionResult;
        
        // Check each format
        for (const permFormat of permissionFormats) {
          permissionResult = await PermissionService.hasPermission(req.currentUser.id, permFormat);
          if (permissionResult.hasPermission) {
            hasAccess = true;
            break;
          }
        }

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: `Insufficient permissions. Required: ${permission}`,
            requiredPermission: permission,
            permissionSource: permissionResult?.source || 'none'
          });
        }

        return next();
      }
      else {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
    } catch (error: any) {
      console.error('Permission check error:', error);
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