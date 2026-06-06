import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import {
  createShiftException,
  getAllShiftExceptions,
  getMyShiftExceptions,
  getShiftExceptionById,
  updateShiftException,
  deleteShiftException
} from '../controllers/shift-exception.controller';

const router = Router();

/**
 * Shift Exception Routes
 * Base URL: /api/shift-scheduling/exceptions
 */

// GET /api/shift-scheduling/exceptions/my - Get my shift exceptions
router.get(
  '/my',
  authenticateJWT,
  getMyShiftExceptions
);

// POST /api/shift-scheduling/exceptions - Create a shift exception
router.post(
  '/',
  authenticateJWT,
  checkPermission('shift-exception:create'),
  createShiftException
);

// GET /api/shift-scheduling/exceptions - Get all shift exceptions
router.get(
  '/',
  authenticateJWT,
  checkPermission('shift-exception:read'),
  getAllShiftExceptions
);

// GET /api/shift-scheduling/exceptions/:id - Get a specific shift exception
router.get(
  '/:id',
  authenticateJWT,
  checkPermission('shift-exception:read'),
  getShiftExceptionById
);

// PUT /api/shift-scheduling/exceptions/:id - Update a shift exception
router.put(
  '/:id',
  authenticateJWT,
  checkPermission('shift-exception:update'),
  updateShiftException
);

// DELETE /api/shift-scheduling/exceptions/:id - Delete a shift exception
router.delete(
  '/:id',
  authenticateJWT,
  checkPermission('shift-exception:delete'),
  deleteShiftException
);

export default router;
