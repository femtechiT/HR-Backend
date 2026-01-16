import express from 'express';
import {
  getAllPayrollRecords,
  getPayrollRecordById,
  getStaffPayrollHistory,
  updatePayrollRecord,
  deletePayrollRecord
} from '../controllers/payroll-record.controller';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';

const router = express.Router();

// Payroll record management routes
router.get('/', authenticateJWT, checkPermission('payroll_record.read'), getAllPayrollRecords);
router.get('/:id', authenticateJWT, checkPermission('payroll_record.read'), getPayrollRecordById);
router.put('/:id', authenticateJWT, checkPermission('payroll_record.update'), updatePayrollRecord);
router.delete('/:id', authenticateJWT, checkPermission('payroll_record.delete'), deletePayrollRecord);

// Staff-specific route for payroll history
router.get('/staff/:id/history', authenticateJWT, getStaffPayrollHistory);

export default router;