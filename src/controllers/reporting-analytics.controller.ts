import { Request, Response } from 'express';
import { ReportTemplateService, ScheduledReportService } from '../services/reporting.service';
import { AnalyticsService } from '../services/analytics.service';
import { extractStringParam, extractNumberParam } from '../utils/query-param.util';

/**
 * Controller for report templates
 */
export const createReportTemplate = async (req: Request, res: Response) => {
  try {
    const { name, description, category, query_definition, parameters_schema, output_format } = req.body;
    const createdBy = (req as any).currentUser.id;

    // Validate required fields
    if (!name || !query_definition) {
      return res.status(400).json({
        success: false,
        message: 'Name and query definition are required'
      });
    }

    // Validate category
    const validCategories = ['attendance', 'leave', 'payroll', 'performance', 'staff', 'custom'];
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Valid values are: ${validCategories.join(', ')}`
      });
    }

    // Validate output format
    const validFormats = ['json', 'csv', 'excel', 'pdf'];
    if (output_format && !validFormats.includes(output_format)) {
      return res.status(400).json({
        success: false,
        message: `Invalid output format. Valid values are: ${validFormats.join(', ')}`
      });
    }

    // Create the report template
    const templateId = await ReportTemplateService.createReportTemplate(
      name,
      description,
      category || 'custom',
      query_definition,
      parameters_schema || {},
      output_format || 'json',
      createdBy
    );

    // Get the created template
    const template = await ReportTemplateService.getReportTemplateById(templateId);

    return res.status(201).json({
      success: true,
      message: 'Report template created successfully',
      data: {
        reportTemplate: template
      }
    });
  } catch (error) {
    console.error('Error creating report template:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating report template'
    });
  }
};

export const getAllReportTemplates = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const categoryStr = extractStringParam(category);

    const templates = await ReportTemplateService.getAllReportTemplates(
      categoryStr || undefined
    );

    return res.json({
      success: true,
      data: {
        reportTemplates: templates
      }
    });
  } catch (error) {
    console.error('Error fetching report templates:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching report templates'
    });
  }
};

export const getReportTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = extractStringParam(id);
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

    const template = await ReportTemplateService.getReportTemplateById(templateId);

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
  } catch (error) {
    console.error('Error fetching report template:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching report template'
    });
  }
};

export const updateReportTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = extractStringParam(id);
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

    // Validate category if provided
    if (category) {
      const validCategories = ['attendance', 'leave', 'payroll', 'performance', 'staff', 'custom'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Valid values are: ${validCategories.join(', ')}`
        });
      }
    }

    // Validate output format if provided
    if (output_format) {
      const validFormats = ['json', 'csv', 'excel', 'pdf'];
      if (!validFormats.includes(output_format)) {
        return res.status(400).json({
          success: false,
          message: `Invalid output format. Valid values are: ${validFormats.join(', ')}`
        });
      }
    }

    const updated = await ReportTemplateService.updateReportTemplate(
      templateId,
      name,
      description,
      category,
      query_definition,
      parameters_schema,
      output_format,
      is_active
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Report template not found'
      });
    }

    const updatedTemplate = await ReportTemplateService.getReportTemplateById(templateId);

    return res.json({
      success: true,
      message: 'Report template updated successfully',
      data: {
        reportTemplate: updatedTemplate
      }
    });
  } catch (error) {
    console.error('Error updating report template:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating report template'
    });
  }
};

export const deleteReportTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = extractStringParam(id);
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

    const deleted = await ReportTemplateService.deleteReportTemplate(templateId);

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
  } catch (error) {
    console.error('Error deactivating report template:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deactivating report template'
    });
  }
};

/**
 * Controller for scheduled reports
 */
export const createScheduledReport = async (req: Request, res: Response) => {
  try {
    const {
      report_template_id,
      name,
      description,
      schedule_type,
      schedule_config,
      recipients,
      parameters
    } = req.body;

    const createdBy = (req as any).currentUser.id;

    // Validate required fields
    if (!report_template_id || !name || !schedule_type) {
      return res.status(400).json({
        success: false,
        message: 'Report template ID, name, and schedule type are required'
      });
    }

    // Validate report template exists
    const template = await ReportTemplateService.getReportTemplateById(report_template_id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Report template not found'
      });
    }

    // Validate schedule type
    const validScheduleTypes = ['daily', 'weekly', 'monthly', 'quarterly', 'custom'];
    if (!validScheduleTypes.includes(schedule_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid schedule type. Valid values are: ${validScheduleTypes.join(', ')}`
      });
    }

    // Create the scheduled report
    const scheduledReportId = await ScheduledReportService.createScheduledReport(
      report_template_id,
      name,
      description,
      schedule_type,
      schedule_config || {},
      recipients || [],
      parameters || {},
      createdBy
    );

    // Get the created scheduled report
    const scheduledReport = await ScheduledReportService.getScheduledReportById(scheduledReportId);

    return res.status(201).json({
      success: true,
      message: 'Scheduled report created successfully',
      data: {
        scheduledReport
      }
    });
  } catch (error) {
    console.error('Error creating scheduled report:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating scheduled report'
    });
  }
};

export const getAllScheduledReports = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const currentUser = (req as any).currentUser;

    // Only allow users to see their own scheduled reports unless they have admin rights
    let filterUserId: number | undefined;
    if (currentUser.role_id !== 1 && currentUser.role_id !== 2) { // Assuming role IDs 1 and 2 are admin/HR
      filterUserId = currentUser.id;
    } else if (userId) {
      filterUserId = extractNumberParam(userId);
    }

    const scheduledReports = await ScheduledReportService.getAllScheduledReports(filterUserId);

    return res.json({
      success: true,
      data: {
        scheduledReports
      }
    });
  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching scheduled reports'
    });
  }
};

export const getScheduledReportById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = extractStringParam(id);
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

    const scheduledReport = await ScheduledReportService.getScheduledReportById(reportId);

    if (!scheduledReport) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled report not found'
      });
    }

    // Check if user has permission to view this report
    const currentUser = (req as any).currentUser;
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
  } catch (error) {
    console.error('Error fetching scheduled report:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching scheduled report'
    });
  }
};

export const updateScheduledReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = extractStringParam(id);
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

    // Check if user has permission to update this report
    const existingReport = await ScheduledReportService.getScheduledReportById(reportId);
    if (!existingReport) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled report not found'
      });
    }

    const currentUser = (req as any).currentUser;
    if (existingReport.created_by !== currentUser.id && currentUser.role_id !== 1 && currentUser.role_id !== 2) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this scheduled report'
      });
    }

    // Validate schedule type if provided
    if (schedule_type) {
      const validScheduleTypes = ['daily', 'weekly', 'monthly', 'quarterly', 'custom'];
      if (!validScheduleTypes.includes(schedule_type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid schedule type. Valid values are: ${validScheduleTypes.join(', ')}`
        });
      }
    }

    const updated = await ScheduledReportService.updateScheduledReport(
      reportId,
      name,
      description,
      schedule_type,
      schedule_config,
      recipients,
      parameters
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled report not found'
      });
    }

    const updatedReport = await ScheduledReportService.getScheduledReportById(reportId);

    return res.json({
      success: true,
      message: 'Scheduled report updated successfully',
      data: {
        scheduledReport: updatedReport
      }
    });
  } catch (error) {
    console.error('Error updating scheduled report:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating scheduled report'
    });
  }
};

export const deleteScheduledReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = extractStringParam(id);
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

    // Check if user has permission to delete this report
    const existingReport = await ScheduledReportService.getScheduledReportById(reportId);
    if (!existingReport) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled report not found'
      });
    }

    const currentUser = (req as any).currentUser;
    if (existingReport.created_by !== currentUser.id && currentUser.role_id !== 1 && currentUser.role_id !== 2) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this scheduled report'
      });
    }

    const deleted = await ScheduledReportService.deleteScheduledReport(reportId);

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
  } catch (error) {
    console.error('Error deleting scheduled report:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deleting scheduled report'
    });
  }
};

/**
 * Analytics controllers
 */
export const getAttendanceMetrics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, branchId, departmentId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Convert to string if it's an array
    const startDateStr = extractStringParam(startDate) || '';
    const endDateStr = extractStringParam(endDate) || '';

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDateStr) || !dateRegex.test(endDateStr)) {
      return res.status(400).json({
        success: false,
        message: 'Dates must be in YYYY-MM-DD format'
      });
    }

    const branchIdNum = extractNumberParam(branchId);
    const departmentIdNum = extractNumberParam(departmentId);

    const metrics = await AnalyticsService.calculateAttendanceMetrics(
      startDateStr,
      endDateStr,
      branchIdNum,
      departmentIdNum
    );

    return res.json({
      success: true,
      data: {
        attendanceMetrics: metrics
      }
    });
  } catch (error) {
    console.error('Error fetching attendance metrics:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching attendance metrics'
    });
  }
};

export const getLeaveMetrics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, branchId, departmentId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Convert to string if it's an array
    const startDateStr = extractStringParam(startDate) || '';
    const endDateStr = extractStringParam(endDate) || '';

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDateStr) || !dateRegex.test(endDateStr)) {
      return res.status(400).json({
        success: false,
        message: 'Dates must be in YYYY-MM-DD format'
      });
    }

    const branchIdNum = extractNumberParam(branchId);
    const departmentIdNum = extractNumberParam(departmentId);

    const metrics = await AnalyticsService.calculateLeaveMetrics(
      startDateStr,
      endDateStr,
      branchIdNum,
      departmentIdNum
    );

    return res.json({
      success: true,
      data: {
        leaveMetrics: metrics
      }
    });
  } catch (error) {
    console.error('Error fetching leave metrics:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching leave metrics'
    });
  }
};

export const getPayrollMetrics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, branchId, departmentId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Convert to string if it's an array
    const startDateStr = extractStringParam(startDate) || '';
    const endDateStr = extractStringParam(endDate) || '';

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDateStr) || !dateRegex.test(endDateStr)) {
      return res.status(400).json({
        success: false,
        message: 'Dates must be in YYYY-MM-DD format'
      });
    }

    const branchIdNum = extractNumberParam(branchId);
    const departmentIdNum = extractNumberParam(departmentId);

    const metrics = await AnalyticsService.calculatePayrollMetrics(
      startDateStr,
      endDateStr,
      branchIdNum,
      departmentIdNum
    );

    return res.json({
      success: true,
      data: {
        payrollMetrics: metrics
      }
    });
  } catch (error) {
    console.error('Error fetching payroll metrics:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching payroll metrics'
    });
  }
};

export const getPerformanceMetrics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, branchId, departmentId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Convert to string if it's an array
    const startDateStr = extractStringParam(startDate) || '';
    const endDateStr = extractStringParam(endDate) || '';

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDateStr) || !dateRegex.test(endDateStr)) {
      return res.status(400).json({
        success: false,
        message: 'Dates must be in YYYY-MM-DD format'
      });
    }

    const branchIdNum = extractNumberParam(branchId);
    const departmentIdNum = extractNumberParam(departmentId);

    const metrics = await AnalyticsService.calculatePerformanceMetrics(
      startDateStr,
      endDateStr,
      branchIdNum,
      departmentIdNum
    );

    return res.json({
      success: true,
      data: {
        performanceMetrics: metrics
      }
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching performance metrics'
    });
  }
};

export const getStaffMetrics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, branchId, departmentId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Convert to string if it's an array
    const startDateStr = extractStringParam(startDate) || '';
    const endDateStr = extractStringParam(endDate) || '';

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDateStr) || !dateRegex.test(endDateStr)) {
      return res.status(400).json({
        success: false,
        message: 'Dates must be in YYYY-MM-DD format'
      });
    }

    const branchIdNum = extractNumberParam(branchId);
    const departmentIdNum = extractNumberParam(departmentId);

    const metrics = await AnalyticsService.calculateStaffMetrics(
      startDateStr,
      endDateStr,
      branchIdNum,
      departmentIdNum
    );

    return res.json({
      success: true,
      data: {
        staffMetrics: metrics
      }
    });
  } catch (error) {
    console.error('Error fetching staff metrics:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching staff metrics'
    });
  }
};

export const getCalculatedMetrics = async (req: Request, res: Response) => {
  try {
    const { category, startDate, endDate, branchId, departmentId } = req.query;

    const categoryStr = extractStringParam(category);
    const startDateStr = extractStringParam(startDate);
    const endDateStr = extractStringParam(endDate);
    const branchIdNum = extractNumberParam(branchId);
    const departmentIdNum = extractNumberParam(departmentId);

    const metrics = await AnalyticsService.getCalculatedMetrics(
      categoryStr || undefined,
      startDateStr || undefined,
      endDateStr || undefined,
      branchIdNum,
      departmentIdNum
    );

    return res.json({
      success: true,
      data: {
        calculatedMetrics: metrics
      }
    });
  } catch (error) {
    console.error('Error fetching calculated metrics:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching calculated metrics'
    });
  }
};

export const calculateAllMetrics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, branchId, departmentId } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Dates must be in YYYY-MM-DD format'
      });
    }

    const result = await AnalyticsService.calculateAndStoreAllMetrics(
      startDate,
      endDate,
      branchId ? parseInt(branchId as string) : undefined,
      departmentId ? parseInt(departmentId as string) : undefined
    );

    return res.json({
      success: true,
      message: result.message,
      data: {
        calculatedMetrics: result.calculatedMetrics
      }
    });
  } catch (error) {
    console.error('Error calculating all metrics:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while calculating metrics'
    });
  }
};