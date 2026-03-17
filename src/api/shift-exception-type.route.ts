import { Router, Request, Response } from 'express';
import {
  getAllExceptionTypes,
  getExceptionTypeById,
  createExceptionType,
  updateExceptionType,
  deleteExceptionType,
  toggleExceptionTypeActive
} from '../controllers/exception-type.controller';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// GET /api/shift-exception-types - Get all exception types
router.get('/', checkPermission('shift_exception_type:read'), getAllExceptionTypes);

// GET /api/shift-exception-types/:id - Get exception type by ID
router.get('/:id', checkPermission('shift_exception_type:read'), getExceptionTypeById);

// POST /api/shift-exception-types - Create new exception type
router.post('/', checkPermission('shift_exception_type:create'), createExceptionType);

// PUT /api/shift-exception-types/:id - Update exception type
router.put('/:id', checkPermission('shift_exception_type:update'), updateExceptionType);

// DELETE /api/shift-exception-types/:id - Delete exception type
router.delete('/:id', checkPermission('shift_exception_type:delete'), deleteExceptionType);

// PATCH /api/shift-exception-types/:id/toggle - Toggle active status
router.patch('/:id/toggle', checkPermission('shift_exception_type:update'), toggleExceptionTypeActive);

export default router;
