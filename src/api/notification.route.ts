import { Router } from 'express';
import { 
  getUserNotifications,
  markNotificationAsRead,
  updateUserNotificationPreferences,
  getNotificationPreferences,
  registerDevice,
  unregisterDevice
} from '../controllers/notification.controller';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';

const router = Router();

// Require authentication for all notification routes
router.use(authenticateJWT);

// Get user's notifications
router.get('/my-notifications', getUserNotifications);

// Mark notification as read
router.patch('/notifications/:id/read', markNotificationAsRead);

// Get user's notification preferences
router.get('/preferences', getNotificationPreferences);

// Update user's notification preferences
router.put('/preferences', updateUserNotificationPreferences);

// Register device for push notifications
router.post('/devices/register', registerDevice);

// Unregister device for push notifications
router.delete('/devices/unregister', unregisterDevice);

export default router;