import express from 'express';
import { generatePayslip, downloadPayslip } from '../controllers/payslip.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = express.Router();

// Payslip generation routes
router.get('/view/:staffId/:payrollRunId', authenticateJWT, generatePayslip);
router.get('/download/:staffId/:payrollRunId', authenticateJWT, downloadPayslip);

export default router;