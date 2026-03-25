"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRecurringShift = exports.updateRecurringShift = exports.getRecurringShifts = exports.bulkAssignRecurringShiftsByBranch = exports.bulkAssignRecurringShifts = exports.bulkAssignShifts = exports.updateEmployeeShiftAssignment = exports.assignShiftToEmployee = exports.getEmployeeShiftAssignmentById = exports.getAllEmployeeShiftAssignments = exports.deleteShiftTemplate = exports.updateShiftTemplate = exports.createShiftTemplate = exports.getShiftTemplateById = exports.getAllShiftTemplates = void 0;
const database_1 = require("../config/database");
const shift_scheduling_service_1 = require("../services/shift-scheduling.service");
const getAllShiftTemplates = async (req, res) => {
    try {
        const { page = 1, limit = 10, isActive } = req.query;
        let query = 'SELECT * FROM shift_templates WHERE 1=1';
        const params = [];
        if (isActive !== undefined) {
            query += ' AND is_active = ?';
            params.push(isActive === 'true' || isActive === '1');
        }
        query += ' ORDER BY created_at DESC';
        const offset = (Number(page) - 1) * Number(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(Number(limit), offset);
        const [rows] = await database_1.pool.execute(query, params);
        let countQuery = 'SELECT COUNT(*) as total FROM shift_templates WHERE 1=1';
        const countParams = [];
        if (isActive !== undefined) {
            countQuery += ' AND is_active = ?';
            countParams.push(isActive === 'true' || isActive === '1');
        }
        const [countRows] = await database_1.pool.execute(countQuery, countParams);
        return res.json({
            success: true,
            data: {
                shiftTemplates: rows,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(countRows[0].total / Number(limit)),
                    totalItems: countRows[0].total,
                    itemsPerPage: Number(limit)
                }
            }
        });
    }
    catch (error) {
        console.error('Error fetching shift templates:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching shift templates'
        });
    }
};
exports.getAllShiftTemplates = getAllShiftTemplates;
const getShiftTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await database_1.pool.execute('SELECT * FROM shift_templates WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Shift template not found'
            });
        }
        return res.json({
            success: true,
            data: {
                shiftTemplate: rows[0]
            }
        });
    }
    catch (error) {
        console.error('Error fetching shift template:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching shift template'
        });
    }
};
exports.getShiftTemplateById = getShiftTemplateById;
const createShiftTemplate = async (req, res) => {
    try {
        const { name, description, start_time, end_time, break_duration_minutes, effective_from, effective_to, recurrence_pattern, recurrence_days } = req.body;
        const createdBy = req.currentUser.id;
        if (!name || !start_time || !end_time || !effective_from) {
            return res.status(400).json({
                success: false,
                message: 'Name, start time, end time, and effective from date are required'
            });
        }
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
        if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
            return res.status(400).json({
                success: false,
                message: 'Start time and end time must be in HH:mm:ss format'
            });
        }
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(effective_from)) {
            return res.status(400).json({
                success: false,
                message: 'Effective from date must be in YYYY-MM-DD format'
            });
        }
        if (effective_to && !dateRegex.test(effective_to)) {
            return res.status(400).json({
                success: false,
                message: 'Effective to date must be in YYYY-MM-DD format'
            });
        }
        const validPatterns = ['daily', 'weekly', 'monthly', 'custom'];
        if (recurrence_pattern && !validPatterns.includes(recurrence_pattern)) {
            return res.status(400).json({
                success: false,
                message: `Invalid recurrence pattern. Valid values are: ${validPatterns.join(', ')}`
            });
        }
        const [result] = await database_1.pool.execute(`INSERT INTO shift_templates 
       (name, description, start_time, end_time, break_duration_minutes, 
        effective_from, effective_to, recurrence_pattern, recurrence_days, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            name,
            description || null,
            start_time,
            end_time,
            break_duration_minutes || 0,
            effective_from,
            effective_to || null,
            recurrence_pattern || 'weekly',
            recurrence_days ? JSON.stringify(recurrence_days) : null,
            createdBy
        ]);
        const templateId = result.insertId;
        const [templateRows] = await database_1.pool.execute('SELECT * FROM shift_templates WHERE id = ?', [templateId]);
        return res.status(201).json({
            success: true,
            message: 'Shift template created successfully',
            data: {
                shiftTemplate: templateRows[0]
            }
        });
    }
    catch (error) {
        console.error('Error creating shift template:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while creating shift template'
        });
    }
};
exports.createShiftTemplate = createShiftTemplate;
const updateShiftTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, start_time, end_time, break_duration_minutes, effective_from, effective_to, recurrence_pattern, recurrence_days, is_active } = req.body;
        const [existingRows] = await database_1.pool.execute('SELECT * FROM shift_templates WHERE id = ?', [id]);
        if (existingRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Shift template not found'
            });
        }
        const existingTemplate = existingRows[0];
        if (start_time) {
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
            if (!timeRegex.test(start_time)) {
                return res.status(400).json({
                    success: false,
                    message: 'Start time must be in HH:mm:ss format'
                });
            }
        }
        if (end_time) {
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
            if (!timeRegex.test(end_time)) {
                return res.status(400).json({
                    success: false,
                    message: 'End time must be in HH:mm:ss format'
                });
            }
        }
        if (effective_from) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(effective_from)) {
                return res.status(400).json({
                    success: false,
                    message: 'Effective from date must be in YYYY-MM-DD format'
                });
            }
        }
        if (effective_to) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(effective_to)) {
                return res.status(400).json({
                    success: false,
                    message: 'Effective to date must be in YYYY-MM-DD format'
                });
            }
        }
        if (recurrence_pattern) {
            const validPatterns = ['daily', 'weekly', 'monthly', 'custom'];
            if (!validPatterns.includes(recurrence_pattern)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid recurrence pattern. Valid values are: ${validPatterns.join(', ')}`
                });
            }
        }
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
        if (start_time !== undefined) {
            updateFields.push('start_time = ?');
            params.push(start_time);
        }
        if (end_time !== undefined) {
            updateFields.push('end_time = ?');
            params.push(end_time);
        }
        if (break_duration_minutes !== undefined) {
            updateFields.push('break_duration_minutes = ?');
            params.push(break_duration_minutes);
        }
        if (effective_from !== undefined) {
            updateFields.push('effective_from = ?');
            params.push(effective_from);
        }
        if (effective_to !== undefined) {
            updateFields.push('effective_to = ?');
            params.push(effective_to);
        }
        if (recurrence_pattern !== undefined) {
            updateFields.push('recurrence_pattern = ?');
            params.push(recurrence_pattern);
        }
        if (recurrence_days !== undefined) {
            updateFields.push('recurrence_days = ?');
            params.push(JSON.stringify(recurrence_days));
        }
        if (is_active !== undefined) {
            updateFields.push('is_active = ?');
            params.push(Boolean(is_active));
        }
        updateFields.push('updated_at = NOW()');
        params.push(id);
        const query = `UPDATE shift_templates SET ${updateFields.join(', ')} WHERE id = ?`;
        await database_1.pool.execute(query, params);
        const [updatedRows] = await database_1.pool.execute('SELECT * FROM shift_templates WHERE id = ?', [id]);
        return res.json({
            success: true,
            message: 'Shift template updated successfully',
            data: {
                shiftTemplate: updatedRows[0]
            }
        });
    }
    catch (error) {
        console.error('Error updating shift template:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while updating shift template'
        });
    }
};
exports.updateShiftTemplate = updateShiftTemplate;
const deleteShiftTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const [existingRows] = await database_1.pool.execute('SELECT * FROM shift_templates WHERE id = ?', [id]);
        if (existingRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Shift template not found'
            });
        }
        await database_1.pool.execute('UPDATE shift_templates SET is_active = FALSE, updated_at = NOW() WHERE id = ?', [id]);
        return res.json({
            success: true,
            message: 'Shift template deactivated successfully'
        });
    }
    catch (error) {
        console.error('Error deactivating shift template:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while deactivating shift template'
        });
    }
};
exports.deleteShiftTemplate = deleteShiftTemplate;
const getAllEmployeeShiftAssignments = async (req, res) => {
    try {
        console.log('[ShiftManagement Controller] Fetching all employee shift assignments');
        console.log('[ShiftManagement Controller] Query params:', req.query);
        const { userId, status, page = 1, limit = 10 } = req.query;
        let query = `
      SELECT esa.*, st.name as template_name, u.full_name as user_name,
             abr.full_name as assigned_by_name, apr.full_name as approved_by_name
      FROM employee_shift_assignments esa
      LEFT JOIN shift_templates st ON esa.shift_template_id = st.id
      LEFT JOIN users u ON esa.user_id = u.id
      LEFT JOIN users abr ON esa.assigned_by = abr.id
      LEFT JOIN users apr ON esa.approved_by = apr.id
      WHERE 1=1
    `;
        const params = [];
        if (userId) {
            query += ' AND esa.user_id = ?';
            params.push(userId);
        }
        if (status) {
            query += ' AND esa.status = ?';
            params.push(status);
        }
        console.log('[ShiftManagement Controller] Final query:', query);
        console.log('[ShiftManagement Controller] Query params:', params);
        query += ' ORDER BY esa.created_at DESC';
        const offset = (Number(page) - 1) * Number(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(Number(limit), offset);
        console.log('[ShiftManagement Controller] Executing query with params:', params);
        const [rows] = await database_1.pool.execute(query, params);
        console.log('[ShiftManagement Controller] Retrieved', rows.length, 'assignments');
        let countQuery = `
      SELECT COUNT(*) as total
      FROM employee_shift_assignments esa
      WHERE 1=1
    `;
        const countParams = [];
        if (userId) {
            countQuery += ' AND esa.user_id = ?';
            countParams.push(userId);
        }
        if (status) {
            countQuery += ' AND esa.status = ?';
            countParams.push(status);
        }
        const [countRows] = await database_1.pool.execute(countQuery, countParams);
        return res.json({
            success: true,
            data: {
                shiftAssignments: rows,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(countRows[0].total / Number(limit)),
                    totalItems: countRows[0].total,
                    itemsPerPage: Number(limit)
                }
            }
        });
    }
    catch (error) {
        console.error('Error fetching employee shift assignments:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching employee shift assignments'
        });
    }
};
exports.getAllEmployeeShiftAssignments = getAllEmployeeShiftAssignments;
const getEmployeeShiftAssignmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await database_1.pool.execute(`SELECT esa.*, st.name as template_name, u.full_name as user_name, 
              abr.full_name as assigned_by_name, apr.full_name as approved_by_name
       FROM employee_shift_assignments esa
       LEFT JOIN shift_templates st ON esa.shift_template_id = st.id
       LEFT JOIN users u ON esa.user_id = u.id
       LEFT JOIN users abr ON esa.assigned_by = abr.id
       LEFT JOIN users apr ON esa.approved_by = apr.id
       WHERE esa.id = ?`, [id]);
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Employee shift assignment not found'
            });
        }
        return res.json({
            success: true,
            data: {
                shiftAssignment: rows[0]
            }
        });
    }
    catch (error) {
        console.error('Error fetching employee shift assignment:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching employee shift assignment'
        });
    }
};
exports.getEmployeeShiftAssignmentById = getEmployeeShiftAssignmentById;
const assignShiftToEmployee = async (req, res) => {
    try {
        const { user_id, shift_template_id, custom_start_time, custom_end_time, custom_break_duration_minutes, effective_from, effective_to, assignment_type, recurrence_pattern, recurrence_days, recurrence_day_of_week, notes } = req.body;
        const assignedBy = req.currentUser.id;
        if (!user_id || !effective_from) {
            return res.status(400).json({
                success: false,
                message: 'User ID and effective from date are required'
            });
        }
        if (recurrence_pattern === 'weekly' && !recurrence_days && !recurrence_day_of_week) {
            return res.status(400).json({
                success: false,
                message: 'recurrence_days or recurrence_day_of_week is required for weekly pattern'
            });
        }
        const [userRows] = await database_1.pool.execute('SELECT id FROM users WHERE id = ?', [user_id]);
        if (userRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        if (shift_template_id) {
            const [templateRows] = await database_1.pool.execute('SELECT id FROM shift_templates WHERE id = ? AND is_active = TRUE', [shift_template_id]);
            if (templateRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Shift template not found or inactive'
                });
            }
        }
        if (custom_start_time) {
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
            if (!timeRegex.test(custom_start_time)) {
                return res.status(400).json({
                    success: false,
                    message: 'Custom start time must be in HH:mm:ss format'
                });
            }
        }
        if (custom_end_time) {
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
            if (!timeRegex.test(custom_end_time)) {
                return res.status(400).json({
                    success: false,
                    message: 'Custom end time must be in HH:mm:ss format'
                });
            }
        }
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(effective_from)) {
            return res.status(400).json({
                success: false,
                message: 'Effective from date must be in YYYY-MM-DD format'
            });
        }
        if (effective_to && !dateRegex.test(effective_to)) {
            return res.status(400).json({
                success: false,
                message: 'Effective to date must be in YYYY-MM-DD format'
            });
        }
        const validTypes = ['permanent', 'temporary', 'rotating'];
        if (assignment_type && !validTypes.includes(assignment_type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid assignment type. Valid values are: ${validTypes.join(', ')}`
            });
        }
        const [existingActiveRows] = await database_1.pool.execute('SELECT id FROM employee_shift_assignments WHERE user_id = ? AND status = ?', [user_id, 'active']);
        if (existingActiveRows.length > 0) {
            await database_1.pool.execute('UPDATE employee_shift_assignments SET status = ?, updated_at = NOW() WHERE user_id = ? AND status = ?', ['expired', user_id, 'active']);
        }
        const [result] = await database_1.pool.execute(`INSERT INTO employee_shift_assignments
       (user_id, shift_template_id, custom_start_time, custom_end_time, custom_break_duration_minutes,
        effective_from, effective_to, assignment_type, recurrence_pattern, recurrence_days, recurrence_day_of_week,
        assigned_by, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            user_id,
            shift_template_id || null,
            custom_start_time || null,
            custom_end_time || null,
            custom_break_duration_minutes || 0,
            effective_from,
            effective_to || null,
            assignment_type || 'permanent',
            recurrence_pattern || 'none',
            recurrence_days ? JSON.stringify(recurrence_days) : null,
            recurrence_day_of_week || null,
            assignedBy,
            'active',
            notes || null
        ]);
        const assignmentId = result.insertId;
        const [assignmentRows] = await database_1.pool.execute(`SELECT esa.*, st.name as template_name, u.full_name as user_name, 
              abr.full_name as assigned_by_name
       FROM employee_shift_assignments esa
       LEFT JOIN shift_templates st ON esa.shift_template_id = st.id
       LEFT JOIN users u ON esa.user_id = u.id
       LEFT JOIN users abr ON esa.assigned_by = abr.id
       WHERE esa.id = ?`, [assignmentId]);
        try {
            const startDate = new Date(effective_from);
            const endDate = effective_to ? new Date(effective_to) : new Date();
            const date = new Date(startDate);
            while (date <= endDate) {
                await shift_scheduling_service_1.ShiftSchedulingService.processAttendanceForDate(user_id, date);
                date.setDate(date.getDate() + 1);
            }
        }
        catch (attendanceError) {
            console.error('Error processing attendance after shift assignment:', attendanceError);
        }
        return res.status(201).json({
            success: true,
            message: 'Shift assigned to employee successfully',
            data: {
                shiftAssignment: assignmentRows[0]
            }
        });
    }
    catch (error) {
        console.error('Error assigning shift to employee:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while assigning shift to employee'
        });
    }
};
exports.assignShiftToEmployee = assignShiftToEmployee;
const updateEmployeeShiftAssignment = async (req, res) => {
    try {
        console.log('[ShiftManagement Controller] Updating assignment', req.params.id);
        console.log('[ShiftManagement Controller] Request body:', req.body);
        const { id } = req.params;
        const { shift_template_id, custom_start_time, custom_end_time, custom_break_duration_minutes, effective_from, effective_to, assignment_type, recurrence_pattern, recurrence_days, recurrence_day_of_week, status, notes } = req.body;
        console.log('[ShiftManagement Controller] Checking if assignment', id, 'exists');
        const [existingRows] = await database_1.pool.execute('SELECT * FROM employee_shift_assignments WHERE id = ?', [id]);
        if (existingRows.length === 0) {
            console.warn('[ShiftManagement Controller] Assignment not found:', id);
            return res.status(404).json({
                success: false,
                message: 'Employee shift assignment not found'
            });
        }
        const existingAssignment = existingRows[0];
        console.log('[ShiftManagement Controller] Found assignment:', existingAssignment);
        if (recurrence_pattern === 'weekly' && !recurrence_days && !recurrence_day_of_week) {
            return res.status(400).json({
                success: false,
                message: 'recurrence_days or recurrence_day_of_week is required for weekly pattern'
            });
        }
        if (shift_template_id) {
            const [templateRows] = await database_1.pool.execute('SELECT id FROM shift_templates WHERE id = ? AND is_active = TRUE', [shift_template_id]);
            if (templateRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Shift template not found or inactive'
                });
            }
        }
        if (custom_start_time) {
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
            if (!timeRegex.test(custom_start_time)) {
                return res.status(400).json({
                    success: false,
                    message: 'Custom start time must be in HH:mm:ss format'
                });
            }
        }
        if (custom_end_time) {
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
            if (!timeRegex.test(custom_end_time)) {
                return res.status(400).json({
                    success: false,
                    message: 'Custom end time must be in HH:mm:ss format'
                });
            }
        }
        if (effective_from) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(effective_from)) {
                return res.status(400).json({
                    success: false,
                    message: 'Effective from date must be in YYYY-MM-DD format'
                });
            }
        }
        if (effective_to) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(effective_to)) {
                return res.status(400).json({
                    success: false,
                    message: 'Effective to date must be in YYYY-MM-DD format'
                });
            }
        }
        if (assignment_type) {
            const validTypes = ['permanent', 'temporary', 'rotating'];
            if (!validTypes.includes(assignment_type)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid assignment type. Valid values are: ${validTypes.join(', ')}`
                });
            }
        }
        if (status) {
            const validStatuses = ['pending', 'approved', 'active', 'expired', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Valid values are: ${validStatuses.join(', ')}`
                });
            }
        }
        const updateFields = [];
        const params = [];
        if (shift_template_id !== undefined) {
            updateFields.push('shift_template_id = ?');
            params.push(shift_template_id);
        }
        if (custom_start_time !== undefined) {
            updateFields.push('custom_start_time = ?');
            params.push(custom_start_time);
        }
        if (custom_end_time !== undefined) {
            updateFields.push('custom_end_time = ?');
            params.push(custom_end_time);
        }
        if (custom_break_duration_minutes !== undefined) {
            updateFields.push('custom_break_duration_minutes = ?');
            params.push(custom_break_duration_minutes);
        }
        if (effective_from !== undefined) {
            updateFields.push('effective_from = ?');
            params.push(effective_from);
        }
        if (effective_to !== undefined) {
            updateFields.push('effective_to = ?');
            params.push(effective_to);
        }
        if (assignment_type !== undefined) {
            updateFields.push('assignment_type = ?');
            params.push(assignment_type);
        }
        if (recurrence_pattern !== undefined) {
            updateFields.push('recurrence_pattern = ?');
            params.push(recurrence_pattern);
        }
        if (recurrence_days !== undefined) {
            updateFields.push('recurrence_days = ?');
            params.push(JSON.stringify(recurrence_days));
        }
        if (recurrence_day_of_week !== undefined) {
            updateFields.push('recurrence_day_of_week = ?');
            params.push(recurrence_day_of_week);
        }
        if (status !== undefined) {
            updateFields.push('status = ?');
            params.push(status);
        }
        if (notes !== undefined) {
            updateFields.push('notes = ?');
            params.push(notes);
        }
        updateFields.push('updated_at = NOW()');
        params.push(id);
        const query = `UPDATE employee_shift_assignments SET ${updateFields.join(', ')} WHERE id = ?`;
        console.log('[ShiftManagement Controller] Executing update query:', query);
        console.log('[ShiftManagement Controller] With params:', params);
        await database_1.pool.execute(query, params);
        console.log('[ShiftManagement Controller] Update executed successfully');
        const [updatedRows] = await database_1.pool.execute(`SELECT esa.*, st.name as template_name, u.full_name as user_name,
              abr.full_name as assigned_by_name, apr.full_name as approved_by_name
       FROM employee_shift_assignments esa
       LEFT JOIN shift_templates st ON esa.shift_template_id = st.id
       LEFT JOIN users u ON esa.user_id = u.id
       LEFT JOIN users abr ON esa.assigned_by = abr.id
       LEFT JOIN users apr ON esa.approved_by = apr.id
       WHERE esa.id = ?`, [id]);
        console.log('[ShiftManagement Controller] Updated assignment:', updatedRows[0]);
        try {
            const userId = updatedRows[0].user_id;
            const startDate = new Date(updatedRows[0].effective_from);
            const endDate = updatedRows[0].effective_to ? new Date(updatedRows[0].effective_to) : new Date();
            console.log('[ShiftManagement Controller] Processing attendance for user', userId, 'from', startDate, 'to', endDate);
            const date = new Date(startDate);
            while (date <= endDate) {
                await shift_scheduling_service_1.ShiftSchedulingService.processAttendanceForDate(userId, date);
                date.setDate(date.getDate() + 1);
            }
            console.log('[ShiftManagement Controller] Attendance processing completed');
        }
        catch (attendanceError) {
            console.error('[ShiftManagement Controller] Error processing attendance after shift assignment update:', attendanceError);
            console.warn('[ShiftManagement Controller] Continuing despite attendance error - assignment was updated successfully');
        }
        return res.json({
            success: true,
            message: 'Employee shift assignment updated successfully',
            data: {
                shiftAssignment: updatedRows[0]
            }
        });
    }
    catch (error) {
        console.error('[ShiftManagement Controller] Error updating employee shift assignment:', error);
        console.error('[ShiftManagement Controller] Error details:', error.message);
        console.error('[ShiftManagement Controller] Stack trace:', error.stack);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during update',
            error: error.message
        });
    }
};
exports.updateEmployeeShiftAssignment = updateEmployeeShiftAssignment;
const bulkAssignShifts = async (req, res) => {
    try {
        console.log('[ShiftManagement Controller] Bulk assign shifts - Request body:', JSON.stringify(req.body, null, 2));
        const { user_ids, shift_template_id, custom_start_time, custom_end_time, custom_break_duration_minutes, effective_from, effective_to, assignment_type, notes } = req.body;
        const assignedBy = req.currentUser.id;
        console.log('[ShiftManagement Controller] User IDs:', user_ids);
        console.log('[ShiftManagement Controller] Shift template ID:', shift_template_id);
        console.log('[ShiftManagement Controller] Effective from:', effective_from);
        console.log('[ShiftManagement Controller] Assignment type:', assignment_type);
        console.log('[ShiftManagement Controller] Assigned by:', assignedBy);
        if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
            console.warn('[ShiftManagement Controller] Validation failed: User IDs array is required');
            return res.status(400).json({
                success: false,
                message: 'User IDs array is required'
            });
        }
        if (!effective_from) {
            console.warn('[ShiftManagement Controller] Validation failed: Effective from date is required');
            return res.status(400).json({
                success: false,
                message: 'Effective from date is required'
            });
        }
        if (shift_template_id) {
            const [templateRows] = await database_1.pool.execute('SELECT id FROM shift_templates WHERE id = ? AND is_active = TRUE', [shift_template_id]);
            if (templateRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Shift template not found or inactive'
                });
            }
        }
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(effective_from)) {
            return res.status(400).json({
                success: false,
                message: 'Effective from date must be in YYYY-MM-DD format'
            });
        }
        if (effective_to && !dateRegex.test(effective_to)) {
            return res.status(400).json({
                success: false,
                message: 'Effective to date must be in YYYY-MM-DD format'
            });
        }
        if (assignment_type) {
            const validTypes = ['permanent', 'temporary', 'rotating'];
            if (!validTypes.includes(assignment_type)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid assignment type. Valid values are: ${validTypes.join(', ')}`
                });
            }
        }
        const [userRows] = await database_1.pool.execute(`SELECT id FROM users WHERE id IN (${user_ids.map(() => '?').join(',')})`, user_ids);
        if (userRows.length !== user_ids.length) {
            return res.status(404).json({
                success: false,
                message: 'One or more users not found'
            });
        }
        const results = [];
        let successCount = 0;
        let failureCount = 0;
        console.log('[ShiftManagement Controller] Starting to process', user_ids.length, 'users...');
        for (const userId of user_ids) {
            try {
                console.log('[ShiftManagement Controller] Processing user:', userId);
                const [expireResult] = await database_1.pool.execute('UPDATE employee_shift_assignments SET status = ?, updated_at = NOW() WHERE user_id = ? AND status = ?', ['expired', userId, 'active']);
                console.log('[ShiftManagement Controller] Expired existing assignments for user', userId, '- Rows affected:', expireResult.affectedRows);
                const [result] = await database_1.pool.execute(`INSERT INTO employee_shift_assignments
           (user_id, shift_template_id, custom_start_time, custom_end_time, custom_break_duration_minutes,
            effective_from, effective_to, assignment_type, assigned_by, status, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    userId,
                    shift_template_id || null,
                    custom_start_time || null,
                    custom_end_time || null,
                    custom_break_duration_minutes || 0,
                    effective_from,
                    effective_to || null,
                    assignment_type || 'permanent',
                    assignedBy,
                    'active',
                    notes || null
                ]);
                const assignmentId = result.insertId;
                console.log('[ShiftManagement Controller] Created assignment', assignmentId, 'for user', userId);
                const [assignmentRows] = await database_1.pool.execute(`SELECT esa.*, st.name as template_name, u.full_name as user_name, 
                  abr.full_name as assigned_by_name
           FROM employee_shift_assignments esa
           LEFT JOIN shift_templates st ON esa.shift_template_id = st.id
           LEFT JOIN users u ON esa.user_id = u.id
           LEFT JOIN users abr ON esa.assigned_by = abr.id
           WHERE esa.id = ?`, [assignmentId]);
                results.push({
                    user_id: userId,
                    success: true,
                    assignment: assignmentRows[0]
                });
                successCount++;
                try {
                    const startDate = new Date(effective_from);
                    const endDate = effective_to ? new Date(effective_to) : new Date();
                    const date = new Date(startDate);
                    while (date <= endDate) {
                        await shift_scheduling_service_1.ShiftSchedulingService.processAttendanceForDate(userId, date);
                        date.setDate(date.getDate() + 1);
                    }
                }
                catch (attendanceError) {
                    console.error(`Error processing attendance for user ${userId}:`, attendanceError);
                }
            }
            catch (assignmentError) {
                console.error(`Error assigning shift to user ${userId}:`, assignmentError);
                results.push({
                    user_id: userId,
                    success: false,
                    error: assignmentError.message || 'Unknown error occurred'
                });
                failureCount++;
            }
        }
        console.log('[ShiftManagement Controller] Bulk assignment completed - Success:', successCount, 'Failed:', failureCount);
        return res.status(201).json({
            success: true,
            message: `Bulk shift assignment completed. ${successCount} succeeded, ${failureCount} failed.`,
            data: {
                results,
                summary: {
                    total: user_ids.length,
                    successful: successCount,
                    failed: failureCount
                }
            }
        });
    }
    catch (error) {
        console.error('[ShiftManagement Controller] Error in bulk shift assignment:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during bulk shift assignment'
        });
    }
};
exports.bulkAssignShifts = bulkAssignShifts;
const bulkAssignRecurringShifts = async (req, res) => {
    try {
        const { assignments } = req.body;
        if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Assignments array is required and must not be empty'
            });
        }
        const assignedBy = req.currentUser.id;
        for (let i = 0; i < assignments.length; i++) {
            const assignment = assignments[i];
            if (!assignment.user_id || !assignment.shift_template_id || !assignment.day_of_week || !assignment.start_date) {
                return res.status(400).json({
                    success: false,
                    message: `Assignment ${i + 1} is missing required fields (user_id, shift_template_id, day_of_week, start_date)`
                });
            }
            const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            if (!validDays.includes(assignment.day_of_week.toLowerCase())) {
                return res.status(400).json({
                    success: false,
                    message: `Assignment ${i + 1}: Invalid day_of_week. Must be one of: ${validDays.join(', ')}`
                });
            }
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(assignment.start_date)) {
                return res.status(400).json({
                    success: false,
                    message: `Assignment ${i + 1}: start_date must be in YYYY-MM-DD format`
                });
            }
            if (assignment.end_date && !dateRegex.test(assignment.end_date)) {
                return res.status(400).json({
                    success: false,
                    message: `Assignment ${i + 1}: end_date must be in YYYY-MM-DD format`
                });
            }
        }
        const userIds = assignments.map((a) => a.user_id);
        const [userRows] = await database_1.pool.execute(`SELECT id FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`, userIds);
        if (userRows.length !== userIds.length) {
            return res.status(404).json({
                success: false,
                message: 'One or more users not found'
            });
        }
        const templateIds = Array.from(new Set(assignments.map((a) => a.shift_template_id)));
        const [templateRows] = await database_1.pool.execute(`SELECT id FROM shift_templates WHERE id IN (${templateIds.map(() => '?').join(',')}) AND is_active = TRUE`, templateIds);
        if (templateRows.length !== templateIds.length) {
            return res.status(404).json({
                success: false,
                message: 'One or more shift templates not found or inactive'
            });
        }
        const results = [];
        let successCount = 0;
        let failureCount = 0;
        for (const assignment of assignments) {
            try {
                const { user_id, shift_template_id, day_of_week, start_date, end_date = null, notes = null } = assignment;
                await database_1.pool.execute(`UPDATE employee_shift_assignments 
           SET status = 'expired', updated_at = NOW() 
           WHERE user_id = ? 
             AND recurrence_pattern = 'weekly' 
             AND recurrence_day_of_week = ? 
             AND status = 'active'`, [user_id, day_of_week.toLowerCase()]);
                const [result] = await database_1.pool.execute(`INSERT INTO employee_shift_assignments
           (user_id, shift_template_id,
            effective_from, recurrence_end_date,
            recurrence_pattern, recurrence_day_of_week,
            assignment_type, assigned_by, status, notes)
           VALUES (?, ?, ?, ?, 'weekly', ?, 'rotating', ?, 'active', ?)`, [
                    user_id,
                    shift_template_id,
                    start_date,
                    end_date,
                    day_of_week.toLowerCase(),
                    assignedBy,
                    notes
                ]);
                const assignmentId = result.insertId;
                const [assignmentRows] = await database_1.pool.execute(`SELECT esa.*, st.name as template_name, st.start_time, st.end_time, st.type as shift_type,
                  u.full_name as user_name, abr.full_name as assigned_by_name
           FROM employee_shift_assignments esa
           LEFT JOIN shift_templates st ON esa.shift_template_id = st.id
           LEFT JOIN users u ON esa.user_id = u.id
           LEFT JOIN users abr ON esa.assigned_by = abr.id
           WHERE esa.id = ?`, [assignmentId]);
                results.push({
                    user_id,
                    success: true,
                    assignment: assignmentRows[0]
                });
                successCount++;
                try {
                    const startDate = new Date(start_date);
                    const endDate = end_date ? new Date(end_date) : new Date();
                    endDate.setMonth(endDate.getMonth() + 3);
                    const date = new Date(startDate);
                    while (date <= endDate) {
                        await shift_scheduling_service_1.ShiftSchedulingService.processAttendanceForDate(user_id, date);
                        date.setDate(date.getDate() + 1);
                    }
                }
                catch (attendanceError) {
                    console.error(`Error processing attendance for user ${user_id}:`, attendanceError);
                }
            }
            catch (assignmentError) {
                console.error(`Error assigning recurring shift to user ${assignment.user_id}:`, assignmentError);
                results.push({
                    user_id: assignment.user_id,
                    success: false,
                    error: assignmentError.message || 'Unknown error occurred'
                });
                failureCount++;
            }
        }
        return res.status(201).json({
            success: true,
            message: `Bulk recurring shift assignment completed. ${successCount} succeeded, ${failureCount} failed.`,
            data: {
                results,
                summary: {
                    total: assignments.length,
                    successful: successCount,
                    failed: failureCount
                }
            }
        });
    }
    catch (error) {
        console.error('Error in bulk recurring shift assignment:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during bulk recurring shift assignment'
        });
    }
};
exports.bulkAssignRecurringShifts = bulkAssignRecurringShifts;
const bulkAssignRecurringShiftsByBranch = async (req, res) => {
    try {
        const { branch_id, user_ids, shift_template_id, days_of_week, effective_from, effective_to = null, assignment_type = 'permanent' } = req.body;
        if (!shift_template_id || !days_of_week || !effective_from) {
            return res.status(400).json({
                success: false,
                message: 'shift_template_id, days_of_week, and effective_from are required'
            });
        }
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        if (!Array.isArray(days_of_week) || days_of_week.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'days_of_week must be a non-empty array'
            });
        }
        for (const day of days_of_week) {
            if (!validDays.includes(day.toLowerCase())) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid day_of_week: ${day}. Must be one of: ${validDays.join(', ')}`
                });
            }
        }
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(effective_from)) {
            return res.status(400).json({
                success: false,
                message: 'effective_from must be in YYYY-MM-DD format'
            });
        }
        if (effective_to && !dateRegex.test(effective_to)) {
            return res.status(400).json({
                success: false,
                message: 'effective_to must be in YYYY-MM-DD format'
            });
        }
        const [templateRows] = await database_1.pool.execute('SELECT id, name, start_time, end_time FROM shift_templates WHERE id = ? AND is_active = TRUE', [shift_template_id]);
        if (templateRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Shift template not found or inactive'
            });
        }
        const shiftTemplate = templateRows[0];
        let userIdsToAssign = [];
        if (user_ids && Array.isArray(user_ids) && user_ids.length > 0) {
            userIdsToAssign = user_ids;
        }
        else if (branch_id) {
            const [staffRows] = await database_1.pool.execute('SELECT user_id FROM staff WHERE branch_id = ? AND status = "active"', [branch_id]);
            if (staffRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `No active staff found in branch ${branch_id}`
                });
            }
            userIdsToAssign = staffRows.map((row) => row.user_id);
        }
        else {
            return res.status(400).json({
                success: false,
                message: 'Either user_ids array or branch_id is required'
            });
        }
        const [userRows] = await database_1.pool.execute(`SELECT id, full_name FROM users WHERE id IN (${userIdsToAssign.map(() => '?').join(',')}) AND status = 'active'`, userIdsToAssign);
        if (userRows.length !== userIdsToAssign.length) {
            return res.status(404).json({
                success: false,
                message: 'One or more users not found or inactive'
            });
        }
        const assignedBy = req.currentUser.id;
        const normalizedDays = days_of_week.map((d) => d.toLowerCase());
        const results = [];
        let successCount = 0;
        let failureCount = 0;
        for (const userId of userIdsToAssign) {
            try {
                for (const dayOfWeek of normalizedDays) {
                    await database_1.pool.execute(`UPDATE employee_shift_assignments
             SET status = 'expired', updated_at = NOW()
             WHERE user_id = ?
               AND recurrence_pattern = 'weekly'
               AND recurrence_day_of_week = ?
               AND status IN ('active', 'pending')`, [userId, dayOfWeek]);
                }
                for (const dayOfWeek of normalizedDays) {
                    await database_1.pool.execute(`INSERT INTO employee_shift_assignments
             (user_id, shift_template_id,
              effective_from, recurrence_end_date,
              recurrence_pattern, recurrence_day_of_week,
              assignment_type, assigned_by, status, assigned_at)
             VALUES (?, ?, ?, ?, 'weekly', ?, ?, ?, 'active', NOW())`, [
                        userId,
                        shift_template_id,
                        effective_from,
                        effective_to,
                        dayOfWeek,
                        assignment_type,
                        assignedBy
                    ]);
                }
                try {
                    const startDate = new Date(effective_from);
                    const endDate = effective_to ? new Date(effective_to) : new Date();
                    endDate.setMonth(endDate.getMonth() + 3);
                    const date = new Date(startDate);
                    while (date <= endDate) {
                        await shift_scheduling_service_1.ShiftSchedulingService.processAttendanceForDate(userId, date);
                        date.setDate(date.getDate() + 1);
                    }
                }
                catch (attendanceError) {
                    console.error(`Error processing attendance for user ${userId}:`, attendanceError);
                }
                results.push({
                    user_id: userId,
                    success: true,
                    days_assigned: normalizedDays.length
                });
                successCount++;
            }
            catch (assignmentError) {
                console.error(`Error assigning recurring shift to user ${userId}:`, assignmentError);
                results.push({
                    user_id: userId,
                    success: false,
                    error: assignmentError.message || 'Unknown error occurred'
                });
                failureCount++;
            }
        }
        return res.status(201).json({
            success: true,
            message: `Bulk shift assignment completed. ${successCount} users succeeded, ${failureCount} failed.`,
            data: {
                results,
                summary: {
                    total_users: userIdsToAssign.length,
                    successful: successCount,
                    failed: failureCount,
                    days_per_user: normalizedDays.length,
                    total_assignments_created: successCount * normalizedDays.length
                },
                shiftTemplate: {
                    id: shiftTemplate.id,
                    name: shiftTemplate.name,
                    start_time: shiftTemplate.start_time,
                    end_time: shiftTemplate.end_time
                },
                days_of_week: normalizedDays,
                effective_from,
                effective_to
            }
        });
    }
    catch (error) {
        console.error('Error in branch-based bulk shift assignment:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during bulk shift assignment'
        });
    }
};
exports.bulkAssignRecurringShiftsByBranch = bulkAssignRecurringShiftsByBranch;
const getRecurringShifts = async (req, res) => {
    try {
        const { userId, dayOfWeek, page = 1, limit = 50 } = req.query;
        let query = `
      SELECT esa.*, st.name as template_name, st.start_time, st.end_time, st.type as shift_type,
             u.full_name as user_name, abr.full_name as assigned_by_name
      FROM employee_shift_assignments esa
      LEFT JOIN shift_templates st ON esa.shift_template_id = st.id
      LEFT JOIN users u ON esa.user_id = u.id
      LEFT JOIN users abr ON esa.assigned_by = abr.id
      WHERE esa.recurrence_pattern = 'weekly' AND esa.status = 'active'
    `;
        const params = [];
        if (userId) {
            query += ' AND esa.user_id = ?';
            params.push(parseInt(userId));
        }
        if (dayOfWeek) {
            query += ' AND esa.recurrence_day_of_week = ?';
            params.push(dayOfWeek);
        }
        query += ' ORDER BY esa.recurrence_day_of_week, u.full_name';
        const offset = (Number(page) - 1) * Number(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(Number(limit), offset);
        const [rows] = await database_1.pool.execute(query, params);
        let countQuery = `
      SELECT COUNT(*) as total
      FROM employee_shift_assignments esa
      WHERE esa.recurrence_pattern = 'weekly' AND esa.status = 'active'
    `;
        const countParams = [];
        if (userId) {
            countQuery += ' AND esa.user_id = ?';
            countParams.push(parseInt(userId));
        }
        if (dayOfWeek) {
            countQuery += ' AND esa.recurrence_day_of_week = ?';
            countParams.push(dayOfWeek);
        }
        const [countRows] = await database_1.pool.execute(countQuery, countParams);
        return res.json({
            success: true,
            data: {
                recurringShifts: rows,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(countRows[0].total / Number(limit)),
                    totalItems: countRows[0].total,
                    itemsPerPage: Number(limit)
                }
            }
        });
    }
    catch (error) {
        console.error('Error fetching recurring shifts:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching recurring shifts'
        });
    }
};
exports.getRecurringShifts = getRecurringShifts;
const updateRecurringShift = async (req, res) => {
    try {
        const { id } = req.params;
        const { shift_template_id, recurrence_day_of_week, recurrence_end_date, notes } = req.body;
        const [existingRows] = await database_1.pool.execute('SELECT * FROM employee_shift_assignments WHERE id = ?', [id]);
        if (existingRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Shift assignment not found'
            });
        }
        if (recurrence_day_of_week) {
            const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            if (!validDays.includes(recurrence_day_of_week.toLowerCase())) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid day_of_week. Must be one of: ${validDays.join(', ')}`
                });
            }
        }
        const updateFields = [];
        const values = [];
        if (shift_template_id !== undefined) {
            updateFields.push('shift_template_id = ?');
            values.push(shift_template_id);
        }
        if (recurrence_day_of_week !== undefined) {
            updateFields.push('recurrence_day_of_week = ?');
            values.push(recurrence_day_of_week.toLowerCase());
        }
        if (recurrence_end_date !== undefined) {
            updateFields.push('recurrence_end_date = ?');
            values.push(recurrence_end_date);
        }
        if (notes !== undefined) {
            updateFields.push('notes = ?');
            values.push(notes);
        }
        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }
        updateFields.push('updated_at = NOW()');
        values.push(id);
        const query = `UPDATE employee_shift_assignments SET ${updateFields.join(', ')} WHERE id = ?`;
        await database_1.pool.execute(query, values);
        const [updatedRows] = await database_1.pool.execute(`SELECT esa.*, st.name as template_name, st.start_time, st.end_time, st.type as shift_type,
              u.full_name as user_name, abr.full_name as assigned_by_name
       FROM employee_shift_assignments esa
       LEFT JOIN shift_templates st ON esa.shift_template_id = st.id
       LEFT JOIN users u ON esa.user_id = u.id
       LEFT JOIN users abr ON esa.assigned_by = abr.id
       WHERE esa.id = ?`, [id]);
        try {
            const assignment = updatedRows[0];
            const startDate = new Date(assignment.effective_from);
            const endDate = assignment.recurrence_end_date
                ? new Date(assignment.recurrence_end_date)
                : new Date();
            endDate.setMonth(endDate.getMonth() + 3);
            const date = new Date(startDate);
            while (date <= endDate) {
                await shift_scheduling_service_1.ShiftSchedulingService.processAttendanceForDate(assignment.user_id, date);
                date.setDate(date.getDate() + 1);
            }
        }
        catch (attendanceError) {
            console.error('Error processing attendance after recurring shift update:', attendanceError);
        }
        return res.json({
            success: true,
            message: 'Recurring shift assignment updated successfully',
            data: {
                shiftAssignment: updatedRows[0]
            }
        });
    }
    catch (error) {
        console.error('Error updating recurring shift:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while updating recurring shift'
        });
    }
};
exports.updateRecurringShift = updateRecurringShift;
const deleteRecurringShift = async (req, res) => {
    try {
        const { id } = req.params;
        const [existingRows] = await database_1.pool.execute('SELECT * FROM employee_shift_assignments WHERE id = ?', [id]);
        if (existingRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Shift assignment not found'
            });
        }
        await database_1.pool.execute("UPDATE employee_shift_assignments SET status = 'cancelled', updated_at = NOW() WHERE id = ?", [id]);
        return res.json({
            success: true,
            message: 'Recurring shift assignment cancelled successfully'
        });
    }
    catch (error) {
        console.error('Error cancelling recurring shift:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while cancelling recurring shift'
        });
    }
};
exports.deleteRecurringShift = deleteRecurringShift;
//# sourceMappingURL=shift-management.controller.js.map