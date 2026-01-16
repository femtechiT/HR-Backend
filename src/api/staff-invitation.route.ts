import express from 'express';
import { inviteNewStaff, deactivateStaff } from '../controllers/staff-invitation.controller';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';

const router = express.Router();

// Staff invitation routes
router.post('/invite', authenticateJWT, checkPermission('staff.invite'), inviteNewStaff);
router.delete('/:id', authenticateJWT, checkPermission('staff.terminate'), deactivateStaff);

export default router;