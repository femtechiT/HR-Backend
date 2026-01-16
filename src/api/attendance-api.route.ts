import { Router } from 'express';
import attendanceRoutes from './attendance.route';
import shiftTimingRoutes from './shift-timing.route';
import holidayRoutes from './holiday.route';
import attendanceLocationRoutes from './attendance-location.route';

const router = Router();

// Mount attendance-related routes - attendanceRoutes handles the base / route
// So when mounted at /api/attendance in index.ts, these become /api/attendance/*
router.use('/', attendanceRoutes);
// Other routes need their own prefixes since they're mounted under /api/attendance
router.use('/shift-timings', shiftTimingRoutes);
router.use('/holidays', holidayRoutes);
router.use('/attendance-locations', attendanceLocationRoutes);

export default router;