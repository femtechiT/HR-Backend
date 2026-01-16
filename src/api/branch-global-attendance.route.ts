import express from 'express';
import { 
  updateGlobalAttendanceMode, 
  getGlobalAttendanceMode 
} from '../controllers/branch-global-attendance.controller';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';

const router = express.Router();

// Global attendance mode management routes
// Requires admin-level permissions to change global settings
router.post('/global-attendance-mode', 
  authenticateJWT, 
  checkPermission('branch.global_settings.update'), 
  updateGlobalAttendanceMode
);

// Get current global attendance mode status
router.get('/global-attendance-mode', 
  authenticateJWT, 
  checkPermission('branch.global_settings.read'), 
  getGlobalAttendanceMode
);

export default router;