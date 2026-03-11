import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import HolidayDutyRosterController from '../controllers/holiday-duty-roster.controller';

const router = Router();

/**
 * Holiday Duty Roster Routes
 * Base URL: /api/holiday-duty-roster
 */

// POST /api/holiday-duty-roster - Add staff member to holiday duty roster
router.post(
  '/',
  authenticateJWT,
  checkPermission('holiday-duty-roster:create'),
  HolidayDutyRosterController.create
);

// POST /api/holiday-duty-roster/bulk - Bulk add staff members to holiday duty roster
router.post(
  '/bulk',
  authenticateJWT,
  checkPermission('holiday-duty-roster:create'),
  HolidayDutyRosterController.bulkCreate
);

// GET /api/holiday-duty-roster - Get all holiday duty rosters
router.get(
  '/',
  authenticateJWT,
  checkPermission('holiday-duty-roster:read'),
  HolidayDutyRosterController.getAll
);

// GET /api/holiday-duty-roster/:holidayId - Get staff assigned to a specific holiday
router.get(
  '/:holidayId',
  authenticateJWT,
  checkPermission('holiday-duty-roster:read'),
  HolidayDutyRosterController.getByHolidayId
);

// GET /api/holiday-duty-roster/user/:userId - Get all holiday assignments for a user
router.get(
  '/user/:userId',
  authenticateJWT,
  checkPermission('holiday-duty-roster:read'),
  HolidayDutyRosterController.getByUserId
);

// PUT /api/holiday-duty-roster/:id - Update a holiday duty roster entry
router.put(
  '/:id',
  authenticateJWT,
  checkPermission('holiday-duty-roster:update'),
  HolidayDutyRosterController.update
);

// DELETE /api/holiday-duty-roster/:id - Remove staff member from holiday duty roster
router.delete(
  '/:id',
  authenticateJWT,
  checkPermission('holiday-duty-roster:delete'),
  HolidayDutyRosterController.delete
);

export default router;
