import { Router } from 'express';
import {
  createReportTemplate,
  getAllReportTemplates,
  getReportTemplateById,
  updateReportTemplate,
  deleteReportTemplate,
  createScheduledReport,
  getAllScheduledReports,
  getScheduledReportById,
  updateScheduledReport,
  deleteScheduledReport,
  getAttendanceMetrics,
  getLeaveMetrics,
  getPayrollMetrics,
  getPerformanceMetrics,
  getStaffMetrics,
  getCalculatedMetrics,
  calculateAllMetrics
} from '../controllers/reporting-analytics.controller';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';

const router = Router();

// Report Templates Routes
router.get('/report-templates', authenticateJWT, checkPermission('report_template:read'), getAllReportTemplates);
router.get('/report-templates/:id', authenticateJWT, checkPermission('report_template:read'), getReportTemplateById);
router.post('/report-templates', authenticateJWT, checkPermission('report_template:create'), createReportTemplate);
router.put('/report-templates/:id', authenticateJWT, checkPermission('report_template:update'), updateReportTemplate);
router.delete('/report-templates/:id', authenticateJWT, checkPermission('report_template:delete'), deleteReportTemplate);

// Scheduled Reports Routes
router.get('/scheduled-reports', authenticateJWT, checkPermission('scheduled_report:read'), getAllScheduledReports);
router.get('/scheduled-reports/:id', authenticateJWT, checkPermission('scheduled_report:read'), getScheduledReportById);
router.post('/scheduled-reports', authenticateJWT, checkPermission('scheduled_report:create'), createScheduledReport);
router.put('/scheduled-reports/:id', authenticateJWT, checkPermission('scheduled_report:update'), updateScheduledReport);
router.delete('/scheduled-reports/:id', authenticateJWT, checkPermission('scheduled_report:delete'), deleteScheduledReport);

// Analytics/Metrics Routes
router.get('/analytics/attendance-metrics', authenticateJWT, checkPermission('analytics:read'), getAttendanceMetrics);
router.get('/analytics/leave-metrics', authenticateJWT, checkPermission('analytics:read'), getLeaveMetrics);
router.get('/analytics/payroll-metrics', authenticateJWT, checkPermission('analytics:read'), getPayrollMetrics);
router.get('/analytics/performance-metrics', authenticateJWT, checkPermission('analytics:read'), getPerformanceMetrics);
router.get('/analytics/staff-metrics', authenticateJWT, checkPermission('analytics:read'), getStaffMetrics);
router.get('/analytics/calculated-metrics', authenticateJWT, checkPermission('analytics:read'), getCalculatedMetrics);
router.post('/analytics/calculate-all', authenticateJWT, checkPermission('analytics:calculate'), calculateAllMetrics);

export default router;