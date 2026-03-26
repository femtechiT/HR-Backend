import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  terminateUser,
  getUserPermissions,
  addUserPermission,
  removeUserPermission
} from '../controllers/user.controller';
import { changePasswordAfterFirstLogin } from '../controllers/password-change.controller';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';

const router = express.Router();

// User management routes
router.get('/', authenticateJWT, checkPermission('users:read'), getAllUsers);
router.get('/:id', authenticateJWT, checkPermission('users:read'), getUserById);
router.post('/', authenticateJWT, checkPermission('user.create'), createUser);
router.put('/:id', authenticateJWT, checkPermission('user.update'), updateUser);
router.delete('/:id', authenticateJWT, checkPermission('user.delete'), deleteUser);
router.patch('/:id/terminate', authenticateJWT, checkPermission('user.terminate'), terminateUser);

// Password change route
router.put('/:id/password-change', authenticateJWT, changePasswordAfterFirstLogin);

// User permissions management routes
router.get('/:id/permissions', authenticateJWT, checkPermission('user.permissions.view'), getUserPermissions);
router.post('/:id/permissions', authenticateJWT, checkPermission('user.permissions.manage'), addUserPermission);
router.delete('/:id/permissions/:permission', authenticateJWT, checkPermission('user.permissions.manage'), removeUserPermission);

export default router;