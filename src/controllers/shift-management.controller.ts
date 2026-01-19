import { Request, Response } from 'express';
import { pool } from '../config/database';
import { ShiftSchedulingService } from '../services/shift-scheduling.service';

/**
 * Get all shift templates
 */
export const getAllShiftTemplates = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;

    let query = 'SELECT * FROM shift_templates WHERE 1=1';
    const params: any[] = [];

    if (isActive !== undefined) {
      query += ' AND is_active = ?';
      params.push(isActive === 'true' || isActive === '1');
    }

    query += ' ORDER BY created_at DESC';

    // Add pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [rows]: any = await pool.execute(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM shift_templates WHERE 1=1';
    const countParams = [];

    if (isActive !== undefined) {
      countQuery += ' AND is_active = ?';
      countParams.push(isActive === 'true' || isActive === '1');
    }

    const [countRows]: any = await pool.execute(countQuery, countParams);

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
  } catch (error) {
    console.error('Error fetching shift templates:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching shift templates'
    });
  }
};

/**
 * Get shift template by ID
 */
export const getShiftTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [rows]: any = await pool.execute(
      'SELECT * FROM shift_templates WHERE id = ?',
      [id]
    );

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
  } catch (error) {
    console.error('Error fetching shift template:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching shift template'
    });
  }
};

/**
 * Create a new shift template
 */
export const createShiftTemplate = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      start_time,
      end_time,
      break_duration_minutes,
      effective_from,
      effective_to,
      recurrence_pattern,
      recurrence_days
    } = req.body;

    const createdBy = (req as any).currentUser.id;

    // Validate required fields
    if (!name || !start_time || !end_time || !effective_from) {
      return res.status(400).json({
        success: false,
        message: 'Name, start time, end time, and effective from date are required'
      });
    }

    // Validate time format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return res.status(400).json({
        success: false,
        message: 'Start time and end time must be in HH:mm:ss format'
      });
    }

    // Validate date format
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

    // Validate recurrence pattern
    const validPatterns = ['daily', 'weekly', 'monthly', 'custom'];
    if (recurrence_pattern && !validPatterns.includes(recurrence_pattern)) {
      return res.status(400).json({
        success: false,
        message: `Invalid recurrence pattern. Valid values are: ${validPatterns.join(', ')}`
      });
    }

    // Create the shift template
    const [result]: any = await pool.execute(
      `INSERT INTO shift_templates 
       (name, description, start_time, end_time, break_duration_minutes, 
        effective_from, effective_to, recurrence_pattern, recurrence_days, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      ]
    );

    const templateId = result.insertId;

    // Get the created shift template
    const [templateRows]: any = await pool.execute(
      'SELECT * FROM shift_templates WHERE id = ?',
      [templateId]
    );

    return res.status(201).json({
      success: true,
      message: 'Shift template created successfully',
      data: {
        shiftTemplate: templateRows[0]
      }
    });
  } catch (error) {
    console.error('Error creating shift template:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating shift template'
    });
  }
};

/**
 * Update a shift template
 */
export const updateShiftTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      start_time,
      end_time,
      break_duration_minutes,
      effective_from,
      effective_to,
      recurrence_pattern,
      recurrence_days,
      is_active
    } = req.body;

    // Check if shift template exists
    const [existingRows]: any = await pool.execute(
      'SELECT * FROM shift_templates WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shift template not found'
      });
    }

    const existingTemplate = existingRows[0];

    // Validate time format if provided
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

    // Validate date format if provided
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

    // Validate recurrence pattern if provided
    if (recurrence_pattern) {
      const validPatterns = ['daily', 'weekly', 'monthly', 'custom'];
      if (!validPatterns.includes(recurrence_pattern)) {
        return res.status(400).json({
          success: false,
          message: `Invalid recurrence pattern. Valid values are: ${validPatterns.join(', ')}`
        });
      }
    }

    // Build update query dynamically
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

    // Add updated_at field
    updateFields.push('updated_at = NOW()');
    params.push(id); // For WHERE clause

    const query = `UPDATE shift_templates SET ${updateFields.join(', ')} WHERE id = ?`;

    await pool.execute(query, params);

    // Get the updated shift template
    const [updatedRows]: any = await pool.execute(
      'SELECT * FROM shift_templates WHERE id = ?',
      [id]
    );

    return res.json({
      success: true,
      message: 'Shift template updated successfully',
      data: {
        shiftTemplate: updatedRows[0]
      }
    });
  } catch (error) {
    console.error('Error updating shift template:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating shift template'
    });
  }
};

/**
 * Delete a shift template
 */
export const deleteShiftTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if shift template exists
    const [existingRows]: any = await pool.execute(
      'SELECT * FROM shift_templates WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shift template not found'
      });
    }

    // Instead of hard deleting, deactivate the template
    await pool.execute(
      'UPDATE shift_templates SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
      [id]
    );

    return res.json({
      success: true,
      message: 'Shift template deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating shift template:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deactivating shift template'
    });
  }
};

/**
 * Get all employee shift assignments
 */
export const getAllEmployeeShiftAssignments = async (req: Request, res: Response) => {
  try {
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
    const params: any[] = [];

    if (userId) {
      query += ' AND esa.user_id = ?';
      params.push(userId);
    }

    if (status) {
      query += ' AND esa.status = ?';
      params.push(status);
    }

    query += ' ORDER BY esa.created_at DESC';

    // Add pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [rows]: any = await pool.execute(query, params);

    // Get total count for pagination
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

    const [countRows]: any = await pool.execute(countQuery, countParams);

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
  } catch (error) {
    console.error('Error fetching employee shift assignments:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching employee shift assignments'
    });
  }
};

/**
 * Get employee shift assignment by ID
 */
export const getEmployeeShiftAssignmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [rows]: any = await pool.execute(
      `SELECT esa.*, st.name as template_name, u.full_name as user_name, 
              abr.full_name as assigned_by_name, apr.full_name as approved_by_name
       FROM employee_shift_assignments esa
       LEFT JOIN shift_templates st ON esa.shift_template_id = st.id
       LEFT JOIN users u ON esa.user_id = u.id
       LEFT JOIN users abr ON esa.assigned_by = abr.id
       LEFT JOIN users apr ON esa.approved_by = apr.id
       WHERE esa.id = ?`,
      [id]
    );

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
  } catch (error) {
    console.error('Error fetching employee shift assignment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching employee shift assignment'
    });
  }
};

/**
 * Assign shift to employee
 */
export const assignShiftToEmployee = async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      shift_template_id,
      custom_start_time,
      custom_end_time,
      custom_break_duration_minutes,
      effective_from,
      effective_to,
      assignment_type,
      notes
    } = req.body;

    const assignedBy = (req as any).currentUser.id;

    // Validate required fields
    if (!user_id || !effective_from) {
      return res.status(400).json({
        success: false,
        message: 'User ID and effective from date are required'
      });
    }

    // Validate user exists
    const [userRows]: any = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [user_id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate shift template exists if provided
    if (shift_template_id) {
      const [templateRows]: any = await pool.execute(
        'SELECT id FROM shift_templates WHERE id = ? AND is_active = TRUE',
        [shift_template_id]
      );

      if (templateRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Shift template not found or inactive'
        });
      }
    }

    // Validate time format if provided
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

    // Validate date format
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

    // Validate assignment type
    const validTypes = ['permanent', 'temporary', 'rotating'];
    if (assignment_type && !validTypes.includes(assignment_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid assignment type. Valid values are: ${validTypes.join(', ')}`
      });
    }

    // Check if there's already an active assignment for this user
    const [existingActiveRows]: any = await pool.execute(
      'SELECT id FROM employee_shift_assignments WHERE user_id = ? AND status = ?',
      [user_id, 'active']
    );

    if (existingActiveRows.length > 0) {
      // Deactivate the existing assignment before creating a new one
      await pool.execute(
        'UPDATE employee_shift_assignments SET status = ?, updated_at = NOW() WHERE user_id = ? AND status = ?',
        ['expired', user_id, 'active']
      );
    }

    // Create the shift assignment
    const [result]: any = await pool.execute(
      `INSERT INTO employee_shift_assignments 
       (user_id, shift_template_id, custom_start_time, custom_end_time, custom_break_duration_minutes,
        effective_from, effective_to, assignment_type, assigned_by, status, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        shift_template_id || null,
        custom_start_time || null,
        custom_end_time || null,
        custom_break_duration_minutes || 0,
        effective_from,
        effective_to || null,
        assignment_type || 'permanent',
        assignedBy,
        'active', // Initially set to active
        notes || null
      ]
    );

    const assignmentId = result.insertId;

    // Get the created shift assignment
    const [assignmentRows]: any = await pool.execute(
      `SELECT esa.*, st.name as template_name, u.full_name as user_name, 
              abr.full_name as assigned_by_name
       FROM employee_shift_assignments esa
       LEFT JOIN shift_templates st ON esa.shift_template_id = st.id
       LEFT JOIN users u ON esa.user_id = u.id
       LEFT JOIN users abr ON esa.assigned_by = abr.id
       WHERE esa.id = ?`,
      [assignmentId]
    );

    // Process attendance for the effective period to update with new schedule
    try {
      const startDate = new Date(effective_from);
      const endDate = effective_to ? new Date(effective_to) : new Date();
      
      // Process attendance for each day in the effective period
      const date = new Date(startDate);
      while (date <= endDate) {
        await ShiftSchedulingService.processAttendanceForDate(user_id, date);
        date.setDate(date.getDate() + 1);
      }
    } catch (attendanceError) {
      console.error('Error processing attendance after shift assignment:', attendanceError);
      // Don't fail the assignment if attendance processing fails
    }

    return res.status(201).json({
      success: true,
      message: 'Shift assigned to employee successfully',
      data: {
        shiftAssignment: assignmentRows[0]
      }
    });
  } catch (error) {
    console.error('Error assigning shift to employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while assigning shift to employee'
    });
  }
};

/**
 * Update employee shift assignment
 */
export const updateEmployeeShiftAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      shift_template_id,
      custom_start_time,
      custom_end_time,
      custom_break_duration_minutes,
      effective_from,
      effective_to,
      assignment_type,
      status,
      notes
    } = req.body;

    // Check if shift assignment exists
    const [existingRows]: any = await pool.execute(
      'SELECT * FROM employee_shift_assignments WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee shift assignment not found'
      });
    }

    const existingAssignment = existingRows[0];

    // Validate shift template exists if provided
    if (shift_template_id) {
      const [templateRows]: any = await pool.execute(
        'SELECT id FROM shift_templates WHERE id = ? AND is_active = TRUE',
        [shift_template_id]
      );

      if (templateRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Shift template not found or inactive'
        });
      }
    }

    // Validate time format if provided
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

    // Validate date format if provided
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

    // Validate assignment type if provided
    if (assignment_type) {
      const validTypes = ['permanent', 'temporary', 'rotating'];
      if (!validTypes.includes(assignment_type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid assignment type. Valid values are: ${validTypes.join(', ')}`
        });
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['pending', 'approved', 'active', 'expired', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Valid values are: ${validStatuses.join(', ')}`
        });
      }
    }

    // Build update query dynamically
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
    if (status !== undefined) {
      updateFields.push('status = ?');
      params.push(status);
    }
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      params.push(notes);
    }

    // Add updated_at field
    updateFields.push('updated_at = NOW()');
    params.push(id); // For WHERE clause

    const query = `UPDATE employee_shift_assignments SET ${updateFields.join(', ')} WHERE id = ?`;

    await pool.execute(query, params);

    // Get the updated shift assignment
    const [updatedRows]: any = await pool.execute(
      `SELECT esa.*, st.name as template_name, u.full_name as user_name, 
              abr.full_name as assigned_by_name, apr.full_name as approved_by_name
       FROM employee_shift_assignments esa
       LEFT JOIN shift_templates st ON esa.shift_template_id = st.id
       LEFT JOIN users u ON esa.user_id = u.id
       LEFT JOIN users abr ON esa.assigned_by = abr.id
       LEFT JOIN users apr ON esa.approved_by = apr.id
       WHERE esa.id = ?`,
      [id]
    );

    // Process attendance for the effective period to update with new schedule
    try {
      const userId = updatedRows[0].user_id;
      const startDate = new Date(updatedRows[0].effective_from);
      const endDate = updatedRows[0].effective_to ? new Date(updatedRows[0].effective_to) : new Date();
      
      // Process attendance for each day in the effective period
      const date = new Date(startDate);
      while (date <= endDate) {
        await ShiftSchedulingService.processAttendanceForDate(userId, date);
        date.setDate(date.getDate() + 1);
      }
    } catch (attendanceError) {
      console.error('Error processing attendance after shift assignment update:', attendanceError);
      // Don't fail the update if attendance processing fails
    }

    return res.json({
      success: true,
      message: 'Employee shift assignment updated successfully',
      data: {
        shiftAssignment: updatedRows[0]
      }
    });
  } catch (error) {
    console.error('Error updating employee shift assignment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating employee shift assignment'
    });
  }
};

/**
 * Bulk assign shifts to multiple employees
 */
export const bulkAssignShifts = async (req: Request, res: Response) => {
  try {
    const { user_ids, shift_template_id, custom_start_time, custom_end_time, 
            custom_break_duration_minutes, effective_from, effective_to, 
            assignment_type, notes } = req.body;

    const assignedBy = (req as any).currentUser.id;

    // Validate required fields
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    if (!effective_from) {
      return res.status(400).json({
        success: false,
        message: 'Effective from date is required'
      });
    }

    // Validate shift template exists if provided
    if (shift_template_id) {
      const [templateRows]: any = await pool.execute(
        'SELECT id FROM shift_templates WHERE id = ? AND is_active = TRUE',
        [shift_template_id]
      );

      if (templateRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Shift template not found or inactive'
        });
      }
    }

    // Validate date format
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

    // Validate assignment type
    if (assignment_type) {
      const validTypes = ['permanent', 'temporary', 'rotating'];
      if (!validTypes.includes(assignment_type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid assignment type. Valid values are: ${validTypes.join(', ')}`
        });
      }
    }

    // Validate all users exist
    const [userRows]: any = await pool.execute(
      `SELECT id FROM users WHERE id IN (${user_ids.map(() => '?').join(',')})`,
      user_ids
    );

    if (userRows.length !== user_ids.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more users not found'
      });
    }

    // Process each user assignment
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const userId of user_ids) {
      try {
        // Check if there's already an active assignment for this user
        await pool.execute(
          'UPDATE employee_shift_assignments SET status = ?, updated_at = NOW() WHERE user_id = ? AND status = ?',
          ['expired', userId, 'active']
        );

        // Create the shift assignment
        const [result]: any = await pool.execute(
          `INSERT INTO employee_shift_assignments 
           (user_id, shift_template_id, custom_start_time, custom_end_time, custom_break_duration_minutes,
            effective_from, effective_to, assignment_type, assigned_by, status, notes) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            shift_template_id || null,
            custom_start_time || null,
            custom_end_time || null,
            custom_break_duration_minutes || 0,
            effective_from,
            effective_to || null,
            assignment_type || 'permanent',
            assignedBy,
            'active', // Initially set to active
            notes || null
          ]
        );

        const assignmentId = result.insertId;

        // Get the created shift assignment
        const [assignmentRows]: any = await pool.execute(
          `SELECT esa.*, st.name as template_name, u.full_name as user_name, 
                  abr.full_name as assigned_by_name
           FROM employee_shift_assignments esa
           LEFT JOIN shift_templates st ON esa.shift_template_id = st.id
           LEFT JOIN users u ON esa.user_id = u.id
           LEFT JOIN users abr ON esa.assigned_by = abr.id
           WHERE esa.id = ?`,
          [assignmentId]
        );

        results.push({
          user_id: userId,
          success: true,
          assignment: assignmentRows[0]
        });

        successCount++;

        // Process attendance for the effective period to update with new schedule
        try {
          const startDate = new Date(effective_from);
          const endDate = effective_to ? new Date(effective_to) : new Date();
          
          // Process attendance for each day in the effective period
          const date = new Date(startDate);
          while (date <= endDate) {
            await ShiftSchedulingService.processAttendanceForDate(userId, date);
            date.setDate(date.getDate() + 1);
          }
        } catch (attendanceError) {
          console.error(`Error processing attendance for user ${userId}:`, attendanceError);
          // Don't fail the assignment if attendance processing fails
        }
      } catch (assignmentError: unknown) {
        console.error(`Error assigning shift to user ${userId}:`, assignmentError);
        results.push({
          user_id: userId,
          success: false,
          error: (assignmentError as Error).message || 'Unknown error occurred'
        });
        failureCount++;
      }
    }

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
  } catch (error) {
    console.error('Error in bulk shift assignment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during bulk shift assignment'
    });
  }
};