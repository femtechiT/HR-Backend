import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { testConnection } from './config/database';
import authRoutes from './api/auth.route';
import roleRoutes from './api/role.route';
import userRoutes from './api/user.route';
import staffRoutes from './api/staff.route';
import formRoutes from './api/form.route';
import formSubmissionRoutes from './api/form-submission.route';
import leaveRoutes from './api/leave.route';
import attendanceApiRoutes from './api/attendance-api.route';
import paymentTypeRoutes from './api/payment-type.route';
import staffPaymentStructureRoutes from './api/staff-payment-structure.route';
import payrollRunRoutes from './api/payroll-run.route';
import payrollRecordRoutes from './api/payroll-record.route';
import payslipRoutes from './api/payslip.route';
import branchGlobalAttendanceRoutes from './api/branch-global-attendance.route';
import kpiRoutes from './api/kpi.route';
import appraisalTemplateRoutes from './api/appraisal-template.route';
import metricRoutes from './api/metric.route';
import targetRoutes from './api/target.route';
import performanceRoutes from './api/performance.route';
import appraisalRoutes from './api/appraisal.route';
import employeePerformanceRoutes from './api/employee-performance.route';
import rolePermissionRoutes from './api/role-permission.route';
import kpiAssignmentRoutes from './api/kpi-assignment.route';
import kpiScoreRoutes from './api/kpi-score.route';
import staffInvitationRoutes from './api/staff-invitation.route';
import passwordChangeRoutes from './api/password-change.route';
import systemInitRoutes from './api/system-init.route';
import roleManagementRoutes from './api/role-management.route';
import completeSystemInitRoutes from './api/complete-system-init.route';
import branchManagementRoutes from './api/branch-management.route';
import departmentManagementRoutes from './api/department-management.route';
import notificationRoutes from './api/notification.route';
import jobPostingRoutes from './api/job-posting.route';
import applicationSubmissionRoutes from './api/application-submission.route';
import applicationManagementRoutes from './api/application-management.route';
import shiftSchedulingRoutes from './api/shift-scheduling.route';
import reportingAnalyticsRoutes from './api/reporting-analytics.route';
// import apiKeyRoutes from './api/api-key.route';  // API Keys temporarily disabled
import testApiAuthRoutes from './api/test-api-auth.route';
import { SchedulerService } from './services/scheduler.service';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all requests
app.use(limiter);

// Specific rate limiting for auth endpoints (more restrictive)
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again later.'
  },
  skipSuccessfulRequests: true, // Don't count successful logins towards limit
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable cross-origin requests
app.use(morgan('combined')); // HTTP request logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Test database connection when server starts
testConnection();

// Routes
app.use('/api/auth', authLimiter, authRoutes); // Apply stricter rate limiting to auth endpoints
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/form-submissions', formSubmissionRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/attendance', attendanceApiRoutes);
app.use('/api/payment-types', paymentTypeRoutes);
app.use('/api/staff-payment-structure', staffPaymentStructureRoutes);
app.use('/api/payroll-runs', payrollRunRoutes);
app.use('/api/payroll-records', payrollRecordRoutes);
app.use('/api/payslips', payslipRoutes);
app.use('/api/branches', branchGlobalAttendanceRoutes);
app.use('/api/kpis', kpiRoutes);
app.use('/api/appraisal-templates', appraisalTemplateRoutes);
app.use('/api/metrics', metricRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/appraisals', appraisalRoutes);
app.use('/api/employees', employeePerformanceRoutes);
app.use('/api/permissions', rolePermissionRoutes);
app.use('/api/kpi-assignments', kpiAssignmentRoutes);
app.use('/api/kpi-scores', kpiScoreRoutes);
app.use('/api/staff-invitation', staffInvitationRoutes);
app.use('/api/password-change', passwordChangeRoutes);
app.use('/api/system', systemInitRoutes);
app.use('/api/role-management', roleManagementRoutes);
app.use('/api/system-complete', completeSystemInitRoutes);
app.use('/api/branches', branchManagementRoutes);
app.use('/api/departments', departmentManagementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/job-postings', jobPostingRoutes);
app.use('/api/job-applications', applicationSubmissionRoutes);
app.use('/api/job-application-management', applicationManagementRoutes);
app.use('/api/shift-scheduling', shiftSchedulingRoutes);
app.use('/api/reports', reportingAnalyticsRoutes);
// app.use('/api/api-keys', apiKeyRoutes);  // API Keys temporarily disabled
app.use('/api/test-auth', testApiAuthRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the HR Management System API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

app.listen(PORT, () => {
  console.log(`HR Management System server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Database connected successfully');
});

export default app;