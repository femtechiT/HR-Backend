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

/**
 * Bulk assign recurring shifts to multiple employees with different days per employee
 * This is specifically for use cases like:
 * - Staff A: Resume Late every Monday
 * - Staff B: Resume Late every Tuesday
 * - Staff C: Close Early every Wednesday
 */
export const bulkAssignRecurringShifts = async (req: Request, res: Response) => {
  try {
    const { assignments } = req.body;

    // assignments: [{user_id, shift_template_id, day_of_week, start_date, end_date, notes}]
    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Assignments array is required and must not be empty'
      });
    }

    const assignedBy = (req as any).currentUser.id;

    // Validate all assignments have required fields
    for (let i = 0; i < assignments.length; i++) {
      const assignment = assignments[i];
      if (!assignment.user_id || !assignment.shift_template_id || !assignment.day_of_week || !assignment.start_date) {
        return res.status(400).json({
          success: false,
          message: `Assignment ${i + 1} is missing required fields (user_id, shift_template_id, day_of_week, start_date)`
        });
      }

      // Validate day_of_week
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      if (!validDays.includes(assignment.day_of_week.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Assignment ${i + 1}: Invalid day_of_week. Must be one of: ${validDays.join(', ')}`
        });
      }

      // Validate date format
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

    // Validate all users exist
    const userIds = assignments.map((a: any) => a.user_id);
    const [userRows]: any = await pool.execute(
      `SELECT id FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`,
      userIds
    );

    if (userRows.length !== userIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more users not found'
      });
    }

    // Validate all shift templates exist
    const templateIds = Array.from(new Set(assignments.map((a: any) => a.shift_template_id)));
    const [templateRows]: any = await pool.execute(
      `SELECT id FROM shift_templates WHERE id IN (${templateIds.map(() => '?').join(',')}) AND is_active = TRUE`,
      templateIds
    );

    if (templateRows.length !== templateIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more shift templates not found or inactive'
      });
    }

    // Process each assignment
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const assignment of assignments) {
      try {
        const {
          user_id,
          shift_template_id,
          day_of_week,
          start_date,
          end_date = null,
          notes = null
        } = assignment;

        // Check if there's already an active recurring assignment for this user on this day
        await pool.execute(
          `UPDATE employee_shift_assignments 
           SET status = 'expired', updated_at = NOW() 
           WHERE user_id = ? 
             AND recurrence_pattern = 'weekly' 
             AND recurrence_day_of_week = ? 
             AND status = 'active'`,
          [user_id, day_of_week.toLowerCase()]
        );

        // Create the recurring shift assignment
        const [result]: any = await pool.execute(
          `INSERT INTO employee_shift_assignments
           (user_id, shift_template_id,
            effective_from, recurrence_end_date,
            recurrence_pattern, recurrence_day_of_week,
            assignment_type, assigned_by, status, notes)
           VALUES (?, ?, ?, ?, 'weekly', ?, 'rotating', ?, 'active', ?)`,
          [
            user_id,
            shift_template_id,
            start_date,
            end_date,
            day_of_week.toLowerCase(),
            assignedBy,
            notes
          ]
        );

        const assignmentId = result.insertId;

        // Get the created shift assignment with details
        const [assignmentRows]: any = await pool.execute(
          `SELECT esa.*, st.name as template_name, st.start_time, st.end_time, st.type as shift_type,
                  u.full_name as user_name, abr.full_name as assigned_by_name
           FROM employee_shift_assignments esa
           LEFT JOIN shift_templates st ON esa.shift_template_id = st.id
           LEFT JOIN users u ON esa.user_id = u.id
           LEFT JOIN users abr ON esa.assigned_by = abr.id
           WHERE esa.id = ?`,
          [assignmentId]
        );

        results.push({
          user_id,
          success: true,
          assignment: assignmentRows[0]
        });

        successCount++;

        // Process attendance for the effective period to update with new schedule
        try {
          const startDate = new Date(start_date);
          const endDate = end_date ? new Date(end_date) : new Date();
          endDate.setMonth(endDate.getMonth() + 3); // Default to 3 months if no end date

          // Process attendance for each day in the effective period
          const date = new Date(startDate);
          while (date <= endDate) {
            await ShiftSchedulingService.processAttendanceForDate(user_id, date);
            date.setDate(date.getDate() + 1);
          }
        } catch (attendanceError) {
          console.error(`Error processing attendance for user ${user_id}:`, attendanceError);
          // Don't fail the assignment if attendance processing fails
        }
      } catch (assignmentError: unknown) {
        console.error(`Error assigning recurring shift to user ${assignment.user_id}:`, assignmentError);
        results.push({
          user_id: assignment.user_id,
          success: false,
          error: (assignmentError as Error).message || 'Unknown error occurred'
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
  } catch (error) {
    console.error('Error in bulk recurring shift assignment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during bulk recurring shift assignment'
    });
  }
};

/**
 * Bulk assign recurring shifts to all employees in a branch
 * POST /api/shift-scheduling/recurring-shifts/bulk-assign-branch
 */
export const bulkAssignRecurringShiftsByBranch = async (req: Request, res: Response) => {
  try {
    const {
      branch_id,
      user_ids,
      shift_template_id,
      days_of_week,
      effective_from,
      effective_to = null,
      assignment_type = 'permanent'
    } = req.body;

    // Validate required fields
    if (!shift_template_id || !days_of_week || !effective_from) {
      return res.status(400).json({
        success: false,
        message: 'shift_template_id, days_of_week, and effective_from are required'
      });
    }

    // Validate days_of_week
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

    // Validate date format
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

    // Validate shift template exists
    const [templateRows]: any = await pool.execute(
      'SELECT id, name, start_time, end_time FROM shift_templates WHERE id = ? AND is_active = TRUE',
      [shift_template_id]
    );

    if (templateRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shift template not found or inactive'
      });
    }

    const shiftTemplate = templateRows[0];

    // Get user IDs - either from provided list or from branch
    let userIdsToAssign: number[] = [];

    if (user_ids && Array.isArray(user_ids) && user_ids.length > 0) {
      // Use provided user IDs
      userIdsToAssign = user_ids;
    } else if (branch_id) {
      // Get all active staff from the branch
      const [staffRows]: any = await pool.execute(
        'SELECT user_id FROM staff WHERE branch_id = ? AND status = "active"',
        [branch_id]
      );

      if (staffRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No active staff found in branch ${branch_id}`
        });
      }

      userIdsToAssign = staffRows.map((row: any) => row.user_id);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either user_ids array or branch_id is required'
      });
    }

    // Validate all users exist
    const [userRows]: any = await pool.execute(
      `SELECT id, full_name FROM users WHERE id IN (${userIdsToAssign.map(() => '?').join(',')}) AND status = 'active'`,
      userIdsToAssign
    );

    if (userRows.length !== userIdsToAssign.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more users not found or inactive'
      });
    }

    const assignedBy = (req as any).currentUser.id;
    const normalizedDays = days_of_week.map((d: string) => d.toLowerCase());

    // Process each user
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const userId of userIdsToAssign) {
      try {
        // For each day of week
        for (const dayOfWeek of normalizedDays) {
          // Expire existing recurring assignment for this day
          await pool.execute(
            `UPDATE employee_shift_assignments
             SET status = 'expired', updated_at = NOW()
             WHERE user_id = ?
               AND recurrence_pattern = 'weekly'
               AND recurrence_day_of_week = ?
               AND status IN ('active', 'pending')`,
            [userId, dayOfWeek]
          );
        }

        // Create new recurring shift assignments for each day
        for (const dayOfWeek of normalizedDays) {
          await pool.execute(
            `INSERT INTO employee_shift_assignments
             (user_id, shift_template_id,
              effective_from, recurrence_end_date,
              recurrence_pattern, recurrence_day_of_week,
              assignment_type, assigned_by, status, assigned_at)
             VALUES (?, ?, ?, ?, 'weekly', ?, ?, ?, 'active', NOW())`,
            [
              userId,
              shift_template_id,
              effective_from,
              effective_to,
              dayOfWeek,
              assignment_type,
              assignedBy
            ]
          );
        }

        // Process attendance for this user to update with new schedule
        try {
          const startDate = new Date(effective_from);
          const endDate = effective_to ? new Date(effective_to) : new Date();
          endDate.setMonth(endDate.getMonth() + 3); // Default to 3 months if no end date

          const date = new Date(startDate);
          while (date <= endDate) {
            await ShiftSchedulingService.processAttendanceForDate(userId, date);
            date.setDate(date.getDate() + 1);
          }
        } catch (attendanceError) {
          console.error(`Error processing attendance for user ${userId}:`, attendanceError);
          // Don't fail the assignment if attendance processing fails
        }

        results.push({
          user_id: userId,
          success: true,
          days_assigned: normalizedDays.length
        });

        successCount++;
      } catch (assignmentError: unknown) {
        console.error(`Error assigning recurring shift to user ${userId}:`, assignmentError);
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
  } catch (error) {
    console.error('Error in branch-based bulk shift assignment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during bulk shift assignment'
    });
  }
};

/**
 * Get recurring shifts for a specific user or all users (HR view)
 */
export const getRecurringShifts = async (req: Request, res: Response) => {
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
    const params: any[] = [];

    if (userId) {
      query += ' AND esa.user_id = ?';
      params.push(parseInt(userId as string));
    }

    if (dayOfWeek) {
      query += ' AND esa.recurrence_day_of_week = ?';
      params.push(dayOfWeek);
    }

    query += ' ORDER BY esa.recurrence_day_of_week, u.full_name';

    // Add pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [rows]: any = await pool.execute(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM employee_shift_assignments esa
      WHERE esa.recurrence_pattern = 'weekly' AND esa.status = 'active'
    `;
    const countParams: any[] = [];

    if (userId) {
      countQuery += ' AND esa.user_id = ?';
      countParams.push(parseInt(userId as string));
    }

    if (dayOfWeek) {
      countQuery += ' AND esa.recurrence_day_of_week = ?';
      countParams.push(dayOfWeek);
    }

    const [countRows]: any = await pool.execute(countQuery, countParams);

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
  } catch (error) {
    console.error('Error fetching recurring shifts:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching recurring shifts'
    });
  }
};

/**
 * Update a recurring shift assignment
 */
export const updateRecurringShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      shift_template_id,
      recurrence_day_of_week,
      recurrence_end_date,
      notes
    } = req.body;

    // Check if assignment exists
    const [existingRows]: any = await pool.execute(
      'SELECT * FROM employee_shift_assignments WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shift assignment not found'
      });
    }

    // Validate recurrence_day_of_week if provided
    if (recurrence_day_of_week) {
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      if (!validDays.includes(recurrence_day_of_week.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid day_of_week. Must be one of: ${validDays.join(', ')}`
        });
      }
    }

    // Build update query
    const updateFields = [];
    const values: any[] = [];

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
    await pool.execute(query, values);

    // Get the updated assignment
    const [updatedRows]: any = await pool.execute(
      `SELECT esa.*, st.name as template_name, st.start_time, st.end_time, st.type as shift_type,
              u.full_name as user_name, abr.full_name as assigned_by_name
       FROM employee_shift_assignments esa
       LEFT JOIN shift_templates st ON esa.shift_template_id = st.id
       LEFT JOIN users u ON esa.user_id = u.id
       LEFT JOIN users abr ON esa.assigned_by = abr.id
       WHERE esa.id = ?`,
      [id]
    );

    // Process attendance update for the affected period
    try {
      const assignment = updatedRows[0];
      const startDate = new Date(assignment.effective_from);
      const endDate = assignment.recurrence_end_date 
        ? new Date(assignment.recurrence_end_date) 
        : new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      const date = new Date(startDate);
      while (date <= endDate) {
        await ShiftSchedulingService.processAttendanceForDate(assignment.user_id, date);
        date.setDate(date.getDate() + 1);
      }
    } catch (attendanceError) {
      console.error('Error processing attendance after recurring shift update:', attendanceError);
    }

    return res.json({
      success: true,
      message: 'Recurring shift assignment updated successfully',
      data: {
        shiftAssignment: updatedRows[0]
      }
    });
  } catch (error) {
    console.error('Error updating recurring shift:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating recurring shift'
    });
  }
};

/**
 * Delete (deactivate) a recurring shift assignment
 */
export const deleteRecurringShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if assignment exists
    const [existingRows]: any = await pool.execute(
      'SELECT * FROM employee_shift_assignments WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shift assignment not found'
      });
    }

    // Deactivate the assignment
    await pool.execute(
      "UPDATE employee_shift_assignments SET status = 'cancelled', updated_at = NOW() WHERE id = ?",
      [id]
    );

    return res.json({
      success: true,
      message: 'Recurring shift assignment cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling recurring shift:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while cancelling recurring shift'
    });
  }
};