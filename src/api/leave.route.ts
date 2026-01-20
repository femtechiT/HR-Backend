import { Router } from 'express';
import leaveTypeRoutes from './leave-type.route';
import leaveRequestRoutes from './leave-request.route';

const router = Router();

// Mount leave request routes (main functionality)
router.use('/', leaveRequestRoutes);

// Mount leave type routes
router.use('/types', leaveTypeRoutes);

export default router;