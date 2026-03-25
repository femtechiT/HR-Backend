"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledReportService = exports.ReportTemplateService = void 0;
const database_1 = require("../config/database");
class ReportTemplateService {
    static async getAllReportTemplates(category) {
        try {
            let query = 'SELECT * FROM report_templates WHERE is_active = TRUE';
            const params = [];
            if (category) {
                query += ' AND category = ?';
                params.push(category);
            }
            query += ' ORDER BY created_at DESC';
            const [rows] = await database_1.pool.execute(query, params);
            return rows;
        }
        catch (error) {
            console.error('Error fetching report templates:', error);
            throw error;
        }
    }
    static async getReportTemplateById(id) {
        try {
            const [rows] = await database_1.pool.execute('SELECT * FROM report_templates WHERE id = ? AND is_active = TRUE', [id]);
            return rows.length > 0 ? rows[0] : null;
        }
        catch (error) {
            console.error('Error fetching report template:', error);
            throw error;
        }
    }
    static async createReportTemplate(name, description, category, queryDefinition, parametersSchema, outputFormat, createdBy) {
        try {
            const [result] = await database_1.pool.execute(`INSERT INTO report_templates 
         (name, description, category, query_definition, parameters_schema, output_format, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                name,
                description || null,
                category,
                queryDefinition,
                JSON.stringify(parametersSchema),
                outputFormat,
                createdBy
            ]);
            return result.insertId;
        }
        catch (error) {
            console.error('Error creating report template:', error);
            throw error;
        }
    }
    static async updateReportTemplate(id, name, description, category, queryDefinition, parametersSchema, outputFormat, isActive) {
        try {
            const updateFields = [];
            const params = [];
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
            params.push(id);
            const query = `UPDATE report_templates SET ${updateFields.join(', ')} WHERE id = ?`;
            const [result] = await database_1.pool.execute(query, params);
            return result.affectedRows > 0;
        }
        catch (error) {
            console.error('Error updating report template:', error);
            throw error;
        }
    }
    static async deleteReportTemplate(id) {
        try {
            const [result] = await database_1.pool.execute('UPDATE report_templates SET is_active = FALSE, updated_at = NOW() WHERE id = ?', [id]);
            return result.affectedRows > 0;
        }
        catch (error) {
            console.error('Error deleting report template:', error);
            throw error;
        }
    }
}
exports.ReportTemplateService = ReportTemplateService;
class ScheduledReportService {
    static async getAllScheduledReports(userId) {
        try {
            let query = `SELECT sr.*, rt.name as template_name, u.full_name as created_by_name
                   FROM scheduled_reports sr
                   JOIN report_templates rt ON sr.report_template_id = rt.id
                   LEFT JOIN users u ON sr.created_by = u.id
                   WHERE 1=1`;
            const params = [];
            if (userId) {
                query += ' AND sr.created_by = ?';
                params.push(userId);
            }
            query += ' ORDER BY sr.created_at DESC';
            const [rows] = await database_1.pool.execute(query, params);
            return rows;
        }
        catch (error) {
            console.error('Error fetching scheduled reports:', error);
            throw error;
        }
    }
    static async getScheduledReportById(id) {
        try {
            const [rows] = await database_1.pool.execute(`SELECT sr.*, rt.name as template_name, u.full_name as created_by_name
         FROM scheduled_reports sr
         JOIN report_templates rt ON sr.report_template_id = rt.id
         LEFT JOIN users u ON sr.created_by = u.id
         WHERE sr.id = ?`, [id]);
            return rows.length > 0 ? rows[0] : null;
        }
        catch (error) {
            console.error('Error fetching scheduled report:', error);
            throw error;
        }
    }
    static async createScheduledReport(reportTemplateId, name, description, scheduleType, scheduleConfig, recipients, parameters, createdBy) {
        try {
            const nextRunDate = this.calculateNextRunDate(scheduleType, scheduleConfig);
            const [result] = await database_1.pool.execute(`INSERT INTO scheduled_reports 
         (report_template_id, name, description, schedule_type, schedule_config, recipients, parameters, next_run_date, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                reportTemplateId,
                name,
                description,
                scheduleType,
                JSON.stringify(scheduleConfig),
                JSON.stringify(recipients),
                JSON.stringify(parameters),
                nextRunDate,
                createdBy
            ]);
            return result.insertId;
        }
        catch (error) {
            console.error('Error creating scheduled report:', error);
            throw error;
        }
    }
    static calculateNextRunDate(scheduleType, scheduleConfig) {
        const now = new Date();
        switch (scheduleType) {
            case 'daily':
                const nextDay = new Date(now);
                nextDay.setDate(now.getDate() + 1);
                return nextDay;
            case 'weekly':
                const nextWeek = new Date(now);
                nextWeek.setDate(now.getDate() + 7);
                return nextWeek;
            case 'monthly':
                const nextMonth = new Date(now);
                nextMonth.setMonth(now.getMonth() + 1);
                return nextMonth;
            case 'quarterly':
                const nextQuarter = new Date(now);
                nextQuarter.setMonth(now.getMonth() + 3);
                return nextQuarter;
            case 'custom':
                if (scheduleConfig && scheduleConfig.nextRunDate) {
                    return new Date(scheduleConfig.nextRunDate);
                }
                const defaultNext = new Date(now);
                defaultNext.setDate(now.getDate() + 1);
                return defaultNext;
            default:
                const defaultReturn = new Date(now);
                defaultReturn.setDate(now.getDate() + 1);
                return defaultReturn;
        }
    }
    static async updateScheduledReport(id, name, description, scheduleType, scheduleConfig, recipients, parameters) {
        try {
            const updateFields = [];
            const params = [];
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
            if (scheduleType !== undefined || scheduleConfig !== undefined) {
                const newNextRunDate = this.calculateNextRunDate(scheduleType !== undefined ? scheduleType : (await this.getScheduledReportById(id))?.schedule_type, scheduleConfig !== undefined ? scheduleConfig : (await this.getScheduledReportById(id))?.schedule_config);
                updateFields.push('next_run_date = ?');
                params.push(newNextRunDate);
            }
            updateFields.push('updated_at = NOW()');
            params.push(id);
            const query = `UPDATE scheduled_reports SET ${updateFields.join(', ')} WHERE id = ?`;
            const [result] = await database_1.pool.execute(query, params);
            return result.affectedRows > 0;
        }
        catch (error) {
            console.error('Error updating scheduled report:', error);
            throw error;
        }
    }
    static async deleteScheduledReport(id) {
        try {
            const [result] = await database_1.pool.execute('DELETE FROM scheduled_reports WHERE id = ?', [id]);
            return result.affectedRows > 0;
        }
        catch (error) {
            console.error('Error deleting scheduled report:', error);
            throw error;
        }
    }
}
exports.ScheduledReportService = ScheduledReportService;
//# sourceMappingURL=reporting.service.js.map