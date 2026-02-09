import { Router } from 'express';
import leaveTypeRoutes from './leave-type.route';
import leaveRequestRoutes from './leave-request.route';
import leaveAllocationRoutes from './leave-allocation.route';

const router = Router();

// Mount more specific routes first
// Mount leave type routes
router.use('/types', leaveTypeRoutes);

// Mount leave allocation routes
router.use('/allocations', leaveAllocationRoutes);

// Mount leave request routes (main functionality) - this acts as a catch-all for other leave routes
router.use('/', leaveRequestRoutes);

export default router;