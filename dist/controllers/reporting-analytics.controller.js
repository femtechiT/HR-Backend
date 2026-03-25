"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAllMetrics = exports.getCalculatedMetrics = exports.getStaffMetrics = exports.getPerformanceMetrics = exports.getPayrollMetrics = exports.getLeaveMetrics = exports.getAttendanceMetrics = exports.deleteScheduledReport = exports.updateScheduledReport = exports.getScheduledReportById = exports.getAllScheduledReports = exports.createScheduledReport = exports.deleteReportTemplate = exports.updateReportTemplate = exports.getReportTemplateById = exports.getAllReportTemplates = exports.createReportTemplate = void 0;
const reporting_service_1 = require("../services/reporting.service");
const analytics_service_1 = require("../services/analytics.service");
const query_param_util_1 = require("../utils/query-param.util");
const createReportTemplate = async (req, res) => {
    try {
        const { name, description, category, query_definition, parameters_schema, output_format } = req.body;
        const createdBy = req.currentUser.id;
        if (!name || !query_definition) {
            return res.status(400).json({
                success: false,
                message: 'Name and query definition are required'
            });
        }
        const validCategories = ['attendance', 'leave', 'payroll', 'performance', 'staff', 'custom'];
        if (category && !validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: `Invalid category. Valid values are: ${validCategories.join(', ')}`
            });
        }
        const validFormats = ['json', 'csv', 'excel', 'pdf'];
        if (output_format && !validFormats.includes(output_format)) {
            return res.status(400).json({
                success: false,
                message: `Invalid output format. Valid values are: ${validFormats.join(', ')}`
            });
        }
        const templateId = await reporting_service_1.ReportTemplateService.createReportTemplate(name, description, category || 'custom', query_definition, parameters_schema || {}, output_format || 'json', createdBy);
        const template = await reporting_service_1.ReportTemplateService.getReportTemplateById(templateId);
        return res.status(201).json({
            success: true,
            message: 'Report template created successfully',
            data: {
                reportTemplate: template
            }
        });
    }
    catch (error) {
        console.error('Error creating report template:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while creating report template'
        });
    }
};
exports.createReportTemplate = createReportTemplate;
const getAllReportTemplates = async (req, res) => {
    try {
        const { category } = req.query;
        const categoryStr = (0, query_param_util_1.extractStringParam)(category);
        const templates = await reporting_service_1.ReportTemplateService.getAllReportTemplates(categoryStr || undefined);
        return res.json({
            success: true,
            data: {
                reportTemplates: templates
            }
        });
    }
    catch (error) {
        console.error('Error fetching report templates:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching report templates'
        });
    }
};
exports.getAllReportTemplates = getAllReportTemplates;
const getReportTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const idStr = (0, query_param_util_1.extractStringParam)(id);
        if (!idStr) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report template ID'
            });
        }
        const templateId = parseInt(idStr);
        if (isNaN(templateId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report template ID'
            });
        }
        const template = await reporting_service_1.ReportTemplateService.getReportTemplateById(templateId);
        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Report template not found'
            });
        }
        return res.json({
            success: true,
            data: {
                reportTemplate: template
            }
        });
    }
    catch (error) {
        console.error('Error fetching report template:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching report template'
        });
    }
};
exports.getReportTemplateById = getReportTemplateById;
const updateReportTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const idStr = (0, query_param_util_1.extractStringParam)(id);
        if (!idStr) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report template ID'
            });
        }
        const templateId = parseInt(idStr);
        const { name, description, category, query_definition, parameters_schema, output_format, is_active } = req.body;
        if (isNaN(templateId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report template ID'
            });
        }
        if (category) {
            const validCategories = ['attendance', 'leave', 'payroll', 'performance', 'staff', 'custom'];
            if (!validCategories.includes(category)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid category. Valid values are: ${validCategories.join(', ')}`
                });
            }
        }
        if (output_format) {
            const validFormats = ['json', 'csv', 'excel', 'pdf'];
            if (!validFormats.includes(output_format)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid output format. Valid values are: ${validFormats.join(', ')}`
                });
            }
        }
        const updated = await reporting_service_1.ReportTemplateService.updateReportTemplate(templateId, name, description, category, query_definition, parameters_schema, output_format, is_active);
        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Report template not found'
            });
        }
        const updatedTemplate = await reporting_service_1.ReportTemplateService.getReportTemplateById(templateId);
        return res.json({
            success: true,
            message: 'Report template updated successfully',
            data: {
                reportTemplate: updatedTemplate
            }
        });
    }
    catch (error) {
        console.error('Error updating report template:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while updating report template'
        });
    }
};
exports.updateReportTemplate = updateReportTemplate;
const deleteReportTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const idStr = (0, query_param_util_1.extractStringParam)(id);
        if (!idStr) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report template ID'
            });
        }
        const templateId = parseInt(idStr);
        if (isNaN(templateId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report template ID'
            });
        }
        const deleted = await reporting_service_1.ReportTemplateService.deleteReportTemplate(templateId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Report template not found'
            });
        }
        return res.json({
            success: true,
            message: 'Report template deactivated successfully'
        });
    }
    catch (error) {
        console.error('Error deactivating report template:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while deactivating report template'
        });
    }
};
exports.deleteReportTemplate = deleteReportTemplate;
const createScheduledReport = async (req, res) => {
    try {
        const { report_template_id, name, description, schedule_type, schedule_config, recipients, parameters } = req.body;
        const createdBy = req.currentUser.id;
        if (!report_template_id || !name || !schedule_type) {
            return res.status(400).json({
                success: false,
                message: 'Report template ID, name, and schedule type are required'
            });
        }
        const template = await reporting_service_1.ReportTemplateService.getReportTemplateById(report_template_id);
        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Report template not found'
            });
        }
        const validScheduleTypes = ['daily', 'weekly', 'monthly', 'quarterly', 'custom'];
        if (!validScheduleTypes.includes(schedule_type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid schedule type. Valid values are: ${validScheduleTypes.join(', ')}`
            });
        }
        const scheduledReportId = await reporting_service_1.ScheduledReportService.createScheduledReport(report_template_id, name, description, schedule_type, schedule_config || {}, recipients || [], parameters || {}, createdBy);
        const scheduledReport = await reporting_service_1.ScheduledReportService.getScheduledReportById(scheduledReportId);
        return res.status(201).json({
            success: true,
            message: 'Scheduled report created successfully',
            data: {
                scheduledReport
            }
        });
    }
    catch (error) {
        console.error('Error creating scheduled report:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while creating scheduled report'
        });
    }
};
exports.createScheduledReport = createScheduledReport;
const getAllScheduledReports = async (req, res) => {
    try {
        const { userId } = req.query;
        const currentUser = req.currentUser;
        let filterUserId;
        if (currentUser.role_id !== 1 && currentUser.role_id !== 2) {
            filterUserId = currentUser.id;
        }
        else if (userId) {
            filterUserId = (0, query_param_util_1.extractNumberParam)(userId);
        }
        const scheduledReports = await reporting_service_1.ScheduledReportService.getAllScheduledReports(filterUserId);
        return res.json({
            success: true,
            data: {
                scheduledReports
            }
        });
    }
    catch (error) {
        console.error('Error fetching scheduled reports:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching scheduled reports'
        });
    }
};
exports.getAllScheduledReports = getAllScheduledReports;
const getScheduledReportById = async (req, res) => {
    try {
        const { id } = req.params;
        const idStr = (0, query_param_util_1.extractStringParam)(id);
        if (!idStr) {
            return res.status(400).json({
                success: false,
                message: 'Invalid scheduled report ID'
            });
        }
        const reportId = parseInt(idStr);
        if (isNaN(reportId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid scheduled report ID'
            });
        }
        const scheduledReport = await reporting_service_1.ScheduledReportService.getScheduledReportById(reportId);
        if (!scheduledReport) {
            return res.status(404).json({
                success: false,
                message: 'Scheduled report not found'
            });
        }
        const currentUser = req.currentUser;
        if (scheduledReport.created_by !== currentUser.id && currentUser.role_id !== 1 && currentUser.role_id !== 2) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to view this scheduled report'
            });
        }
        return res.json({
            success: true,
            data: {
                scheduledReport
            }
        });
    }
    catch (error) {
        console.error('Error fetching scheduled report:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching scheduled report'
        });
    }
};
exports.getScheduledReportById = getScheduledReportById;
const updateScheduledReport = async (req, res) => {
    try {
        const { id } = req.params;
        const idStr = (0, query_param_util_1.extractStringParam)(id);
        if (!idStr) {
            return res.status(400).json({
                success: false,
                message: 'Invalid scheduled report ID'
            });
        }
        const reportId = parseInt(idStr);
        const { name, description, schedule_type, schedule_config, recipients, parameters } = req.body;
        if (isNaN(reportId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid scheduled report ID'
            });
        }
        const existingReport = await reporting_service_1.ScheduledReportService.getScheduledReportById(reportId);
        if (!existingReport) {
            return res.status(404).json({
                success: false,
                message: 'Scheduled report not found'
            });
        }
        const currentUser = req.currentUser;
        if (existingReport.created_by !== currentUser.id && currentUser.role_id !== 1 && currentUser.role_id !== 2) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to update this scheduled report'
            });
        }
        if (schedule_type) {
            const validScheduleTypes = ['daily', 'weekly', 'monthly', 'quarterly', 'custom'];
            if (!validScheduleTypes.includes(schedule_type)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid schedule type. Valid values are: ${validScheduleTypes.join(', ')}`
                });
            }
        }
        const updated = await reporting_service_1.ScheduledReportService.updateScheduledReport(reportId, name, description, schedule_type, schedule_config, recipients, parameters);
        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Scheduled report not found'
            });
        }
        const updatedReport = await reporting_service_1.ScheduledReportService.getScheduledReportById(reportId);
        return res.json({
            success: true,
            message: 'Scheduled report updated successfully',
            data: {
                scheduledReport: updatedReport
            }
        });
    }
    catch (error) {
        console.error('Error updating scheduled report:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while updating scheduled report'
        });
    }
};
exports.updateScheduledReport = updateScheduledReport;
const deleteScheduledReport = async (req, res) => {
    try {
        const { id } = req.params;
        const idStr = (0, query_param_util_1.extractStringParam)(id);
        if (!idStr) {
            return res.status(400).json({
                success: false,
                message: 'Invalid scheduled report ID'
            });
        }
        const reportId = parseInt(idStr);
        if (isNaN(reportId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid scheduled report ID'
            });
        }
        const existingReport = await reporting_service_1.ScheduledReportService.getScheduledReportById(reportId);
        if (!existingReport) {
            return res.status(404).json({
                success: false,
                message: 'Scheduled report not found'
            });
        }
        const currentUser = req.currentUser;
        if (existingReport.created_by !== currentUser.id && currentUser.role_id !== 1 && currentUser.role_id !== 2) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to delete this scheduled report'
            });
        }
        const deleted = await reporting_service_1.ScheduledReportService.deleteScheduledReport(reportId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Scheduled report not found'
            });
        }
        return res.json({
            success: true,
            message: 'Scheduled report deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting scheduled report:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while deleting scheduled report'
        });
    }
};
exports.deleteScheduledReport = deleteScheduledReport;
const getAttendanceMetrics = async (req, res) => {
    try {
        const { startDate, endDate, branchId, departmentId } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }
        const startDateStr = (0, query_param_util_1.extractStringParam)(startDate) || '';
        const endDateStr = (0, query_param_util_1.extractStringParam)(endDate) || '';
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDateStr) || !dateRegex.test(endDateStr)) {
            return res.status(400).json({
                success: false,
                message: 'Dates must be in YYYY-MM-DD format'
            });
        }
        const branchIdNum = (0, query_param_util_1.extractNumberParam)(branchId);
        const departmentIdNum = (0, query_param_util_1.extractNumberParam)(departmentId);
        const metrics = await analytics_service_1.AnalyticsService.calculateAttendanceMetrics(startDateStr, endDateStr, branchIdNum, departmentIdNum);
        return res.json({
            success: true,
            data: {
                attendanceMetrics: metrics
            }
        });
    }
    catch (error) {
        console.error('Error fetching attendance metrics:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching attendance metrics'
        });
    }
};
exports.getAttendanceMetrics = getAttendanceMetrics;
const getLeaveMetrics = async (req, res) => {
    try {
        const { startDate, endDate, branchId, departmentId } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }
        const startDateStr = (0, query_param_util_1.extractStringParam)(startDate) || '';
        const endDateStr = (0, query_param_util_1.extractStringParam)(endDate) || '';
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDateStr) || !dateRegex.test(endDateStr)) {
            return res.status(400).json({
                success: false,
                message: 'Dates must be in YYYY-MM-DD format'
            });
        }
        const branchIdNum = (0, query_param_util_1.extractNumberParam)(branchId);
        const departmentIdNum = (0, query_param_util_1.extractNumberParam)(departmentId);
        const metrics = await analytics_service_1.AnalyticsService.calculateLeaveMetrics(startDateStr, endDateStr, branchIdNum, departmentIdNum);
        return res.json({
            success: true,
            data: {
                leaveMetrics: metrics
            }
        });
    }
    catch (error) {
        console.error('Error fetching leave metrics:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching leave metrics'
        });
    }
};
exports.getLeaveMetrics = getLeaveMetrics;
const getPayrollMetrics = async (req, res) => {
    try {
        const { startDate, endDate, branchId, departmentId } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }
        const startDateStr = (0, query_param_util_1.extractStringParam)(startDate) || '';
        const endDateStr = (0, query_param_util_1.extractStringParam)(endDate) || '';
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDateStr) || !dateRegex.test(endDateStr)) {
            return res.status(400).json({
                success: false,
                message: 'Dates must be in YYYY-MM-DD format'
            });
        }
        const branchIdNum = (0, query_param_util_1.extractNumberParam)(branchId);
        const departmentIdNum = (0, query_param_util_1.extractNumberParam)(departmentId);
        const metrics = await analytics_service_1.AnalyticsService.calculatePayrollMetrics(startDateStr, endDateStr, branchIdNum, departmentIdNum);
        return res.json({
            success: true,
            data: {
                payrollMetrics: metrics
            }
        });
    }
    catch (error) {
        console.error('Error fetching payroll metrics:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching payroll metrics'
        });
    }
};
exports.getPayrollMetrics = getPayrollMetrics;
const getPerformanceMetrics = async (req, res) => {
    try {
        const { startDate, endDate, branchId, departmentId } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }
        const startDateStr = (0, query_param_util_1.extractStringParam)(startDate) || '';
        const endDateStr = (0, query_param_util_1.extractStringParam)(endDate) || '';
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDateStr) || !dateRegex.test(endDateStr)) {
            return res.status(400).json({
                success: false,
                message: 'Dates must be in YYYY-MM-DD format'
            });
        }
        const branchIdNum = (0, query_param_util_1.extractNumberParam)(branchId);
        const departmentIdNum = (0, query_param_util_1.extractNumberParam)(departmentId);
        const metrics = await analytics_service_1.AnalyticsService.calculatePerformanceMetrics(startDateStr, endDateStr, branchIdNum, departmentIdNum);
        return res.json({
            success: true,
            data: {
                performanceMetrics: metrics
            }
        });
    }
    catch (error) {
        console.error('Error fetching performance metrics:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching performance metrics'
        });
    }
};
exports.getPerformanceMetrics = getPerformanceMetrics;
const getStaffMetrics = async (req, res) => {
    try {
        const { startDate, endDate, branchId, departmentId } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }
        const startDateStr = (0, query_param_util_1.extractStringParam)(startDate) || '';
        const endDateStr = (0, query_param_util_1.extractStringParam)(endDate) || '';
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDateStr) || !dateRegex.test(endDateStr)) {
            return res.status(400).json({
                success: false,
                message: 'Dates must be in YYYY-MM-DD format'
            });
        }
        const branchIdNum = (0, query_param_util_1.extractNumberParam)(branchId);
        const departmentIdNum = (0, query_param_util_1.extractNumberParam)(departmentId);
        const metrics = await analytics_service_1.AnalyticsService.calculateStaffMetrics(startDateStr, endDateStr, branchIdNum, departmentIdNum);
        return res.json({
            success: true,
            data: {
                staffMetrics: metrics
            }
        });
    }
    catch (error) {
        console.error('Error fetching staff metrics:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching staff metrics'
        });
    }
};
exports.getStaffMetrics = getStaffMetrics;
const getCalculatedMetrics = async (req, res) => {
    try {
        const { category, startDate, endDate, branchId, departmentId } = req.query;
        const categoryStr = (0, query_param_util_1.extractStringParam)(category);
        const startDateStr = (0, query_param_util_1.extractStringParam)(startDate);
        const endDateStr = (0, query_param_util_1.extractStringParam)(endDate);
        const branchIdNum = (0, query_param_util_1.extractNumberParam)(branchId);
        const departmentIdNum = (0, query_param_util_1.extractNumberParam)(departmentId);
        const metrics = await analytics_service_1.AnalyticsService.getCalculatedMetrics(categoryStr || undefined, startDateStr || undefined, endDateStr || undefined, branchIdNum, departmentIdNum);
        return res.json({
            success: true,
            data: {
                calculatedMetrics: metrics
            }
        });
    }
    catch (error) {
        console.error('Error fetching calculated metrics:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching calculated metrics'
        });
    }
};
exports.getCalculatedMetrics = getCalculatedMetrics;
const calculateAllMetrics = async (req, res) => {
    try {
        const { startDate, endDate, branchId, departmentId } = req.body;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
            return res.status(400).json({
                success: false,
                message: 'Dates must be in YYYY-MM-DD format'
            });
        }
        const result = await analytics_service_1.AnalyticsService.calculateAndStoreAllMetrics(startDate, endDate, branchId ? parseInt(branchId) : undefined, departmentId ? parseInt(departmentId) : undefined);
        return res.json({
            success: true,
            message: result.message,
            data: {
                calculatedMetrics: result.calculatedMetrics
            }
        });
    }
    catch (error) {
        console.error('Error calculating all metrics:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while calculating metrics'
        });
    }
};
exports.calculateAllMetrics = calculateAllMetrics;
//# sourceMappingURL=reporting-analytics.controller.js.map