import { Request, Response, NextFunction } from 'express';
import PermissionService from '../services/permission.service';

// Middleware to check if user has a specific permission
export const checkPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.currentUser) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if the user has the required permission
      const permissionResult = await PermissionService.hasPermission(req.currentUser.id, permission);

      if (!permissionResult.hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Insufficient permissions. Required: ${permission}`,
          requiredPermission: permission,
          permissionSource: permissionResult.source
        });
      }

      return next();
    } catch (error) {
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
      (req.currentUser as any).permissions = permissions;
    }
    return next();
  } catch (error) {
    console.error('Error attaching permissions:', error);
    return next();
  }
};