import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import ShiftExceptionController from '../controllers/shift-exception.controller';

const router = Router();

/**
 * Shift Exception Routes
 * Base URL: /api/shift-scheduling/exceptions
 */

// POST /api/shift-scheduling/exceptions - Create a shift exception
router.post(
  '/',
  authenticateJWT,
  checkPermission('shift-exception:create'),
  ShiftExceptionController.create
);

// GET /api/shift-scheduling/exceptions - Get all shift exceptions
router.get(
  '/',
  authenticateJWT,
  checkPermission('shift-exception:read'),
  ShiftExceptionController.getAll
);

// GET /api/shift-scheduling/exceptions/:userId - Get shift exceptions for a user
router.get(
  '/:userId',
  authenticateJWT,
  checkPermission('shift-exception:read'),
  ShiftExceptionController.getByUserId
);

// GET /api/shift-scheduling/exceptions/:id - Get a specific shift exception
router.get(
  '/:id',
  authenticateJWT,
  checkPermission('shift-exception:read'),
  ShiftExceptionController.getById
);

// PUT /api/shift-scheduling/exceptions/:id - Update a shift exception
router.put(
  '/:id',
  authenticateJWT,
  checkPermission('shift-exception:update'),
  ShiftExceptionController.update
);

// POST /api/shift-scheduling/exceptions/:id/approve - Approve a shift exception
router.post(
  '/:id/approve',
  authenticateJWT,
  checkPermission('shift-exception:approve'),
  ShiftExceptionController.approve
);

// POST /api/shift-scheduling/exceptions/:id/reject - Reject a shift exception
router.post(
  '/:id/reject',
  authenticateJWT,
  checkPermission('shift-exception:approve'),
  ShiftExceptionController.reject
);

// DELETE /api/shift-scheduling/exceptions/:id - Delete a shift exception
router.delete(
  '/:id',
  authenticateJWT,
  checkPermission('shift-exception:delete'),
  ShiftExceptionController.delete
);

export default router;
