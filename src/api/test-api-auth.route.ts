import { Router, Request, Response } from 'express';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';

const router = Router();

// Test endpoint to verify authentication (API keys temporarily disabled)
router.get('/test', authenticateJWT, checkPermission('api.test'), (req: Request, res: Response) => {
  if (req.currentUser) {
    return res.json({
      success: true,
      message: 'Authenticated successfully with JWT token',
      authType: 'jwt',
      userInfo: {
        id: req.currentUser.id,
        email: req.currentUser.email,
        roleId: req.currentUser.role_id
      }
    });
  } else {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
});

// Get user info for authenticated requests (API keys temporarily disabled)
router.get('/info', authenticateJWT, (req: Request, res: Response) => {
  if (req.currentUser) {
    return res.json({
      success: true,
      message: 'User information retrieved',
      data: {
        authType: 'jwt',
        user: {
          id: req.currentUser.id,
          email: req.currentUser.email,
          roleId: req.currentUser.role_id
        }
      }
    });
  } else {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
});

export default router;