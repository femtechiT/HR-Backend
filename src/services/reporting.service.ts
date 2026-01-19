import { pool } from '../config/database';

/**
 * Service for managing report templates
 */
export class ReportTemplateService {
  /**
   * Get all report templates
   */
  static async getAllReportTemplates(category?: string) {
    try {
      let query = 'SELECT * FROM report_templates WHERE is_active = TRUE';
      const params: any[] = [];

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }

      query += ' ORDER BY created_at DESC';

      const [rows]: any = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Error fetching report templates:', error);
      throw error;
    }
  }

  /**
   * Get report template by ID
   */
  static async getReportTemplateById(id: number) {
    try {
      const [rows]: any = await pool.execute(
        'SELECT * FROM report_templates WHERE id = ? AND is_active = TRUE',
        [id]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error fetching report template:', error);
      throw error;
    }
  }

  /**
   * Create a new report template
   */
  static async createReportTemplate(
    name: string,
    description: string,
    category: string,
    queryDefinition: string,
    parametersSchema: any,
    outputFormat: string,
    createdBy: number
  ) {
    try {
      const [result]: any = await pool.execute(
        `INSERT INTO report_templates 
         (name, description, category, query_definition, parameters_schema, output_format, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          description || null,
          category,
          queryDefinition,
          JSON.stringify(parametersSchema),
          outputFormat,
          createdBy
        ]
      );

      return result.insertId;
    } catch (error) {
      console.error('Error creating report template:', error);
      throw error;
    }
  }

  /**
   * Update a report template
   */
  static async updateReportTemplate(
    id: number,
    name?: string,
    description?: string,
    category?: string,
    queryDefinition?: string,
    parametersSchema?: any,
    outputFormat?: string,
    isActive?: boolean
  ) {
    try {
      const updateFields = [];
      const params: any[] = [];

      if (name !== undefined) {
        updateFields.push('name = ?');
        params.push(name);
      }
      if (description !== undefined) {
        updateFields.push('description = ?');
        params.push(description);
      }
      if (category !== undefined) {
        updateFields.push('category = ?');
        params.push(category);
      }
      if (queryDefinition !== undefined) {
        updateFields.push('query_definition = ?');
        params.push(queryDefinition);
      }
      if (parametersSchema !== undefined) {
        updateFields.push('parameters_schema = ?');
        params.push(JSON.stringify(parametersSchema));
      }
      if (outputFormat !== undefined) {
        updateFields.push('output_format = ?');
        params.push(outputFormat);
      }
      if (isActive !== undefined) {
        updateFields.push('is_active = ?');
        params.push(isActive);
      }

      updateFields.push('updated_at = NOW()');
      params.push(id); // For WHERE clause

      const query = `UPDATE report_templates SET ${updateFields.join(', ')} WHERE id = ?`;

      const [result]: any = await pool.execute(query, params);

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating report template:', error);
      throw error;
    }
  }

  /**
   * Delete (deactivate) a report template
   */
  static async deleteReportTemplate(id: number) {
    try {
      const [result]: any = await pool.execute(
        'UPDATE report_templates SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting report template:', error);
      throw error;
    }
  }
}

/**
 * Service for managing scheduled reports
 */
export class ScheduledReportService {
  /**
   * Get all scheduled reports
   */
  static async getAllScheduledReports(userId?: number) {
    try {
      let query = `SELECT sr.*, rt.name as template_name, u.full_name as created_by_name
                   FROM scheduled_reports sr
                   JOIN report_templates rt ON sr.report_template_id = rt.id
                   LEFT JOIN users u ON sr.created_by = u.id
                   WHERE 1=1`;
      const params: any[] = [];

      if (userId) {
        query += ' AND sr.created_by = ?';
        params.push(userId);
      }

      query += ' ORDER BY sr.created_at DESC';

      const [rows]: any = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
      throw error;
    }
  }

  /**
   * Get scheduled report by ID
   */
  static async getScheduledReportById(id: number) {
    try {
      const [rows]: any = await pool.execute(
        `SELECT sr.*, rt.name as template_name, u.full_name as created_by_name
         FROM scheduled_reports sr
         JOIN report_templates rt ON sr.report_template_id = rt.id
         LEFT JOIN users u ON sr.created_by = u.id
         WHERE sr.id = ?`,
        [id]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error fetching scheduled report:', error);
      throw error;
    }
  }

  /**
   * Create a new scheduled report
   */
  static async createScheduledReport(
    reportTemplateId: number,
    name: string,
    description: string,
    scheduleType: string,
    scheduleConfig: any,
    recipients: any[],
    parameters: any,
    createdBy: number
  ) {
    try {
      // Calculate next run date based on schedule type
      const nextRunDate = this.calculateNextRunDate(scheduleType, scheduleConfig);

      const [result]: any = await pool.execute(
        `INSERT INTO scheduled_reports 
         (report_template_id, name, description, schedule_type, schedule_config, recipients, parameters, next_run_date, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reportTemplateId,
          name,
          description,
          scheduleType,
          JSON.stringify(scheduleConfig),
          JSON.stringify(recipients),
          JSON.stringify(parameters),
          nextRunDate,
          createdBy
        ]
      );

      return result.insertId;
    } catch (error) {
      console.error('Error creating scheduled report:', error);
      throw error;
    }
  }

  /**
   * Calculate next run date based on schedule type
   */
  private static calculateNextRunDate(scheduleType: string, scheduleConfig: any): Date {
    const now = new Date();
    
    switch (scheduleType) {
      case 'daily':
        // Next run is tomorrow at the same time
        const nextDay = new Date(now);
        nextDay.setDate(now.getDate() + 1);
        return nextDay;
        
      case 'weekly':
        // Next run is next week on the same day
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + 7);
        return nextWeek;
        
      case 'monthly':
        // Next run is next month on the same day
        const nextMonth = new Date(now);
        nextMonth.setMonth(now.getMonth() + 1);
        return nextMonth;
        
      case 'quarterly':
        // Next run is in 3 months
        const nextQuarter = new Date(now);
        nextQuarter.setMonth(now.getMonth() + 3);
        return nextQuarter;
        
      case 'custom':
        // Use custom schedule configuration
        if (scheduleConfig && scheduleConfig.nextRunDate) {
          return new Date(scheduleConfig.nextRunDate);
        }
        // Default to next day if no custom config
        const defaultNext = new Date(now);
        defaultNext.setDate(now.getDate() + 1);
        return defaultNext;
        
      default:
        // Default to next day
        const defaultReturn = new Date(now);
        defaultReturn.setDate(now.getDate() + 1);
        return defaultReturn;
    }
  }

  /**
   * Update a scheduled report
   */
  static async updateScheduledReport(
    id: number,
    name?: string,
    description?: string,
    scheduleType?: string,
    scheduleConfig?: any,
    recipients?: any[],
    parameters?: any
  ) {
    try {
      const updateFields = [];
      const params: any[] = [];

      if (name !== undefined) {
        updateFields.push('name = ?');
        params.push(name);
      }
      if (description !== undefined) {
        updateFields.push('description = ?');
        params.push(description);
      }
      if (scheduleType !== undefined) {
        updateFields.push('schedule_type = ?');
        params.push(scheduleType);
      }
      if (scheduleConfig !== undefined) {
        updateFields.push('schedule_config = ?');
        params.push(JSON.stringify(scheduleConfig));
      }
      if (recipients !== undefined) {
        updateFields.push('recipients = ?');
        params.push(JSON.stringify(recipients));
      }
      if (parameters !== undefined) {
        updateFields.push('parameters = ?');
        params.push(JSON.stringify(parameters));
      }

      // Recalculate next run date if schedule type or config changed
      if (scheduleType !== undefined || scheduleConfig !== undefined) {
        const newNextRunDate = this.calculateNextRunDate(
          scheduleType !== undefined ? scheduleType : (await this.getScheduledReportById(id))?.schedule_type,
          scheduleConfig !== undefined ? scheduleConfig : (await this.getScheduledReportById(id))?.schedule_config
        );
        updateFields.push('next_run_date = ?');
        params.push(newNextRunDate);
      }

      updateFields.push('updated_at = NOW()');
      params.push(id); // For WHERE clause

      const query = `UPDATE scheduled_reports SET ${updateFields.join(', ')} WHERE id = ?`;

      const [result]: any = await pool.execute(query, params);

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating scheduled report:', error);
      throw error;
    }
  }

  /**
   * Delete a scheduled report
   */
  static async deleteScheduledReport(id: number) {
    try {
      const [result]: any = await pool.execute(
        'DELETE FROM scheduled_reports WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
      throw error;
    }
  }
}