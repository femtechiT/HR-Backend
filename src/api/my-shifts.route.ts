import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import {
  getMyShifts,
  getMyUpcomingShifts,
  getTeamShifts,
  getMyTodayShift
} from '../controllers/my-shifts.controller';

const router = Router();

/**
 * My Shifts Routes
 * Base URL: /api/my-shifts
 */

// GET /api/my-shifts/today - Get my today's shift (for dashboard)
router.get(
  '/today',
  authenticateJWT,
  getMyTodayShift
);

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

// GET /api/my-shifts/team - Get team shifts (for managers)
// Note: This was previously /api/team-shifts but moved here for consistency
router.get(
  '/team',
  authenticateJWT,
  getTeamShifts
);

export default router;
