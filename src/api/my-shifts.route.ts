import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import {
  getMyShifts,
  getMyUpcomingShifts,
  getTeamShifts
} from '../controllers/my-shifts.controller';

const router = Router();

/**
 * My Shifts Routes
 * Base URL: /api/my-shifts
 */

// GET /api/my-shifts - Get my shift assignments
router.get(
  '/',
  authenticateJWT,
  getMyShifts
);

// GET /api/my-shifts/upcoming - Get my upcoming shifts for next N days
router.get(
  '/upcoming',
  authenticateJWT,
  getMyUpcomingShifts
);

// GET /api/team-shifts - Get team shifts (for managers)
router.get(
  '/',
  authenticateJWT,
  getTeamShifts
);

export default router;
