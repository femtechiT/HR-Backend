import express from 'express';
import {
  getStaffPaymentStructure,
  addPaymentToStaff,
  updateStaffPayment,
  removePaymentFromStaff
} from '../controllers/staff-payment-structure.controller';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';

const router = express.Router();

// Staff payment structure routes
router.get('/:id', authenticateJWT, checkPermission('staff_payment_structure.read'), getStaffPaymentStructure);
router.post('/:id/payment', authenticateJWT, checkPermission('staff_payment_structure.create'), addPaymentToStaff);
router.put('/:staffId/payment/:paymentId', authenticateJWT, checkPermission('staff_payment_structure.update'), updateStaffPayment);
router.delete('/:staffId/payment/:paymentId', authenticateJWT, checkPermission('staff_payment_structure.delete'), removePaymentFromStaff);

export default router;