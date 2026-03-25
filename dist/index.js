"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv = __importStar(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./config/database");
const system_init_service_1 = require("./services/system-init.service");
const auth_route_1 = __importDefault(require("./api/auth.route"));
const role_route_1 = __importDefault(require("./api/role.route"));
const user_route_1 = __importDefault(require("./api/user.route"));
const staff_route_1 = __importDefault(require("./api/staff.route"));
const form_route_1 = __importDefault(require("./api/form.route"));
const form_submission_route_1 = __importDefault(require("./api/form-submission.route"));
const leave_route_1 = __importDefault(require("./api/leave.route"));
const attendance_route_1 = __importDefault(require("./api/attendance.route"));
const holiday_route_1 = __importDefault(require("./api/holiday.route"));
const payment_type_route_1 = __importDefault(require("./api/payment-type.route"));
const staff_payment_structure_route_1 = __importDefault(require("./api/staff-payment-structure.route"));
const payroll_run_route_1 = __importDefault(require("./api/payroll-run.route"));
const payroll_record_route_1 = __importDefault(require("./api/payroll-record.route"));
const payslip_route_1 = __importDefault(require("./api/payslip.route"));
const branch_global_attendance_route_1 = __importDefault(require("./api/branch-global-attendance.route"));
const kpi_route_1 = __importDefault(require("./api/kpi.route"));
const appraisal_template_route_1 = __importDefault(require("./api/appraisal-template.route"));
const metric_route_1 = __importDefault(require("./api/metric.route"));
const target_route_1 = __importDefault(require("./api/target.route"));
const performance_route_1 = __importDefault(require("./api/performance.route"));
const appraisal_route_1 = __importDefault(require("./api/appraisal.route"));
const employee_performance_route_1 = __importDefault(require("./api/employee-performance.route"));
const role_permission_route_1 = __importDefault(require("./api/role-permission.route"));
const kpi_assignment_route_1 = __importDefault(require("./api/kpi-assignment.route"));
const kpi_score_route_1 = __importDefault(require("./api/kpi-score.route"));
const staff_invitation_route_1 = __importDefault(require("./api/staff-invitation.route"));
const time_off_bank_route_1 = __importDefault(require("./api/time-off-bank.route"));
const password_change_route_1 = __importDefault(require("./api/password-change.route"));
const system_route_1 = __importDefault(require("./api/system.route"));
const role_management_route_1 = __importDefault(require("./api/role-management.route"));
const complete_system_init_route_1 = __importDefault(require("./api/complete-system-init.route"));
const branch_management_route_1 = __importDefault(require("./api/branch-management.route"));
const department_management_route_1 = __importDefault(require("./api/department-management.route"));
const notification_route_1 = __importDefault(require("./api/notification.route"));
const job_posting_route_1 = __importDefault(require("./api/job-posting.route"));
const application_submission_route_1 = __importDefault(require("./api/application-submission.route"));
const application_management_route_1 = __importDefault(require("./api/application-management.route"));
const shift_scheduling_route_1 = __importDefault(require("./api/shift-scheduling.route"));
const shift_exception_route_1 = __importDefault(require("./api/shift-exception.route"));
const shift_exception_type_route_1 = __importDefault(require("./api/shift-exception-type.route"));
const my_shifts_route_1 = __importDefault(require("./api/my-shifts.route"));
const holiday_duty_roster_route_1 = __importDefault(require("./api/holiday-duty-roster.route"));
const reporting_analytics_route_1 = __importDefault(require("./api/reporting-analytics.route"));
const branch_working_days_route_1 = __importDefault(require("./api/branch-working-days.route"));
const shift_timing_route_1 = __importDefault(require("./api/shift-timing.route"));
const attendance_location_route_1 = __importDefault(require("./api/attendance-location.route"));
const staff_document_route_1 = __importDefault(require("./api/staff-document.route"));
const staff_location_assignment_route_1 = __importDefault(require("./api/staff-location-assignment.route"));
const dashboard_route_1 = __importDefault(require("./api/dashboard.route"));
const guarantor_route_1 = __importDefault(require("./api/guarantor.route"));
const health_route_1 = __importDefault(require("./api/health.route"));
const attendance_processor_worker_1 = __importDefault(require("./workers/attendance-processor.worker"));
const auto_checkout_worker_1 = __importDefault(require("./workers/auto-checkout.worker"));
const leave_cleanup_worker_1 = __importDefault(require("./workers/leave-cleanup.worker"));
const leave_cleanup_route_1 = __importDefault(require("./api/leave-cleanup.route"));
dotenv.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again later.'
    },
    skipSuccessfulRequests: true,
});
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
(0, database_1.testConnection)();
(0, database_1.initializeRedis)();
system_init_service_1.SystemInitService.initialize();
attendance_processor_worker_1.default.start();
auto_checkout_worker_1.default.start();
leave_cleanup_worker_1.default.start();
app.use('/api/auth', authLimiter, auth_route_1.default);
app.use('/api/roles', role_route_1.default);
app.use('/api/users', user_route_1.default);
app.use('/api/staff', staff_route_1.default);
app.use('/api/forms', form_route_1.default);
app.use('/api/form-submissions', form_submission_route_1.default);
app.use('/api/leave', leave_route_1.default);
app.use('/api/uploads/leave-requests', express_1.default.static(path_1.default.join(process.cwd(), 'uploads', 'leave-requests')));
app.use('/api/uploads/attachments', express_1.default.static(path_1.default.join(process.cwd(), 'uploads', 'attachments')));
app.use('/api/attendance', attendance_route_1.default);
app.use('/api/holidays', holiday_route_1.default);
app.use('/api/payment-types', payment_type_route_1.default);
app.use('/api/staff-payment-structure', staff_payment_structure_route_1.default);
app.use('/api/payroll-runs', payroll_run_route_1.default);
app.use('/api/payroll-records', payroll_record_route_1.default);
app.use('/api/payslips', payslip_route_1.default);
app.use('/api/branches', branch_management_route_1.default);
app.use('/api/attendance-settings', branch_global_attendance_route_1.default);
app.use('/api/kpis', kpi_route_1.default);
app.use('/api/appraisal-templates', appraisal_template_route_1.default);
app.use('/api/metrics', metric_route_1.default);
app.use('/api/targets', target_route_1.default);
app.use('/api/performance', performance_route_1.default);
app.use('/api/appraisals', appraisal_route_1.default);
app.use('/api/employees', employee_performance_route_1.default);
app.use('/api/permissions', role_permission_route_1.default);
app.use('/api/kpi-assignments', kpi_assignment_route_1.default);
app.use('/api/kpi-scores', kpi_score_route_1.default);
app.use('/api/staff-invitation', staff_invitation_route_1.default);
app.use('/api/time-off-banks', time_off_bank_route_1.default);
app.use('/api/password-change', password_change_route_1.default);
app.use('/api/system', system_route_1.default);
app.use('/api/role-management', role_management_route_1.default);
app.use('/api/system-complete', complete_system_init_route_1.default);
app.use('/api/departments', department_management_route_1.default);
app.use('/api/branch-working-days', branch_working_days_route_1.default);
app.use('/api/shift-timings', shift_timing_route_1.default);
app.use('/api/notifications', notification_route_1.default);
app.use('/api/job-postings', job_posting_route_1.default);
app.use('/api/job-applications', application_submission_route_1.default);
app.use('/api/job-application-management', application_management_route_1.default);
app.use('/api/shift-scheduling', shift_scheduling_route_1.default);
app.use('/api/shift-scheduling/exceptions', shift_exception_route_1.default);
app.use('/api/shift-exception-types', shift_exception_type_route_1.default);
app.use('/api/my-shifts', my_shifts_route_1.default);
app.use('/api/holiday-duty-roster', holiday_duty_roster_route_1.default);
app.use('/api/reports', reporting_analytics_route_1.default);
app.use('/api/attendance-locations', attendance_location_route_1.default);
app.use('/api/staff-documents', staff_document_route_1.default);
app.use('/api/staff-location-assignments', staff_location_assignment_route_1.default);
app.use('/api/guarantors', guarantor_route_1.default);
app.use('/api/dashboard', dashboard_route_1.default);
app.use('/api/leave-cleanup', leave_cleanup_route_1.default);
app.use('/api/health', health_route_1.default);
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the HR Management System API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});
app.use((err, req, res, next) => {
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
exports.default = app;
//# sourceMappingURL=index.js.map