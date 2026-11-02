import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  terminateUser,
  softDeleteUser,
  restoreUser,
  getUserPermissions,
  addUserPermission,
  removeUserPermission,
  resetUserPassword,
  updateUserRole
} from '../controllers/user.controller';
import { changePasswordAfterFirstLogin } from '../controllers/password-change.controller';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';
import { upload, uploadProfilePhoto } from '../controllers/staff-photo.controller';

const router = express.Router();

// User management routes
router.get('/', authenticateJWT, checkPermission('users:read'), getAllUsers);
router.get('/:id', authenticateJWT, checkPermission('users:read'), getUserById);
router.post('/', authenticateJWT, checkPermission('user.create'), createUser);
router.put('/:id', authenticateJWT, checkPermission('user.update'), updateUser);
router.post('/:id/reset-password', authenticateJWT, checkPermission('user.update'), resetUserPassword);
router.put('/:id/role', authenticateJWT, checkPermission('user.update'), updateUserRole);
router.delete('/:id', authenticateJWT, checkPermission('user.delete'), deleteUser);
router.patch('/:id/terminate', authenticateJWT, checkPermission('user.terminate'), terminateUser);
router.patch('/:id/delete', authenticateJWT, checkPermission('user.permanent_delete'), softDeleteUser);
router.patch('/:id/restore', authenticateJWT, checkPermission('user.restore'), restoreUser);

// Profile photo upload (explicitly user-id based; avoids staff.id/user.id ambiguity)
router.post(
  '/me/upload-photo',
  authenticateJWT,
  (req, res, next) => {
    if (!req.currentUser) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    req.params.id = String(req.currentUser.id);
    (req as any).resolvedUserId = req.currentUser.id;
    return next();
  },
  upload.single('profile_picture'),
  uploadProfilePhoto
);

router.post(
  '/:id/upload-photo',
  authenticateJWT,
  async (req, res, next) => {
    const id = parseInt(String(req.params.id ?? ''), 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    if (!req.currentUser) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (req.currentUser.id === id) {
      (req as any).resolvedUserId = id;
      return next();
    }

    // Cross-user upload: require permission (and typically admin roles).
    return checkPermission('user.update')(req, res, () => {
      (req as any).resolvedUserId = id;
      next();
    });
  },
  upload.single('profile_picture'),
  uploadProfilePhoto
);

// Password change route
router.put('/:id/password-change', authenticateJWT, changePasswordAfterFirstLogin);

// User permissions management routes
router.get('/:id/permissions', authenticateJWT, checkPermission('user.permissions.view'), getUserPermissions);
router.post('/:id/permissions', authenticateJWT, checkPermission('user.permissions.manage'), addUserPermission);
router.delete('/:id/permissions/:permission', authenticateJWT, checkPermission('user.permissions.manage'), removeUserPermission);

export default router;
