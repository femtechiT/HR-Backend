import { Request, Response } from 'express';
import { pool } from '../config/database';
import { ShiftSchedulingService } from '../services/shift-scheduling.service';

/**
 * Get all schedule requests
 */
export const getAllScheduleRequests = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, requestType, userId } = req.query;
    const currentUser = (req as any).currentUser;

    // Build query based on user role
    let query = `
      SELECT sr.*, u.full_name as user_name, abr.full_name as approved_by_name, rbr.full_name as rejected_by_name, cbr.full_name as created_by_name
      FROM schedule_requests sr
      LEFT JOIN users u ON sr.user_id = u.id
      LEFT JOIN users abr ON sr.approved_by = abr.id
      LEFT JOIN users rbr ON sr.rejected_by = rbr.id
      LEFT JOIN users cbr ON sr.created_by = cbr.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Non-HR users can only see their own requests
    if (currentUser.role_id !== 1 && currentUser.role_id !== 2) { // Assuming role IDs 1 and 2 are admin/HR
      query += ' AND sr.user_id = ?';
      params.push(currentUser.id);
    } else if (userId) {
      // HR can filter by specific user
      query += ' AND sr.user_id = ?';
      params.push(userId);
    }

    if (status) {
      query += ' AND sr.status = ?';
      params.push(status);
    }

    if (requestType) {
      query += ' AND sr.request_type = ?';
      params.push(requestType);
    }

    query += ' ORDER BY sr.created_at DESC';

    // Add pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [rows]: any = await pool.execute(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM schedule_requests sr
      WHERE 1=1
    `;
    const countParams = [];

    if (currentUser.role_id !== 1 && currentUser.role_id !== 2) {
      countQuery += ' AND sr.user_id = ?';
      countParams.push(currentUser.id);
    } else if (userId) {
      countQuery += ' AND sr.user_id = ?';
      countParams.push(userId);
    }

    if (status) {
      countQuery += ' AND sr.status = ?';
      countParams.push(status);
    }

    if (requestType) {
      countQuery += ' AND sr.request_type = ?';
      countParams.push(requestType);
    }

    const [countRows]: any = await pool.execute(countQuery, countParams);

    return res.json({
      success: true,
      data: {
        scheduleRequests: rows,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(countRows[0].total / Number(limit)),
          totalItems: countRows[0].total,
          itemsPerPage: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching schedule requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching schedule requests'
    });
  }
};

/**
 * Get schedule request by ID
 */
export const getScheduleRequestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).currentUser;

    const [rows]: any = await pool.execute(
      `SELECT sr.*, u.full_name as user_name, abr.full_name as approved_by_name, rbr.full_name as rejected_by_name, cbr.full_name as created_by_name
       FROM schedule_requests sr
       LEFT JOIN users u ON sr.user_id = u.id
       LEFT JOIN users abr ON sr.approved_by = abr.id
       LEFT JOIN users rbr ON sr.rejected_by = rbr.id
       LEFT JOIN users cbr ON sr.created_by = cbr.id
       WHERE sr.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule request not found'
      });
    }

    const request = rows[0];

    // Check if user is authorized to view this request
    if (request.user_id !== currentUser.id && currentUser.role_id !== 1 && currentUser.role_id !== 2) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this schedule request'
      });
    }

    return res.json({
      success: true,
      data: {
        scheduleRequest: request
      }
    });
  } catch (error) {
    console.error('Error fetching schedule request:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching schedule request'
    });
  }
};

/**
 * Create a schedule request
 */
export const createScheduleRequest = async (req: Request, res: Response) => {
  try {
    const {
      request_type,
      request_subtype,
      requested_date,
      requested_start_time,
      requested_end_time,
      requested_duration_days,
      reason,
      scheduled_for,
      expires_on
    } = req.body;

    const userId = (req as any).currentUser.id;

    // Validate required fields
    if (!request_type || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Request type and reason are required'
      });
    }

    // Validate request type
    const validRequestTypes = ['time_off_request', 'schedule_change', 'shift_swap', 'flexible_arrangement', 'compensatory_time_use'];
    if (!validRequestTypes.includes(request_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid request type. Valid values are: ${validRequestTypes.join(', ')}`
      });
    }

    // Validate date format if provided
    if (requested_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(requested_date)) {
        return res.status(400).json({
          success: false,
          message: 'Requested date must be in YYYY-MM-DD format'
        });
      }
    }

    if (scheduled_for) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(scheduled_for)) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled for date must be in YYYY-MM-DD format'
        });
      }
    }

    if (expires_on) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(expires_on)) {
        return res.status(400).json({
          success: false,
          message: 'Expires on date must be in YYYY-MM-DD format'
        });
      }
    }

    // Validate time format if provided
    if (requested_start_time) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
      if (!timeRegex.test(requested_start_time)) {
        return res.status(400).json({
          success: false,
          message: 'Requested start time must be in HH:mm:ss format'
        });
      }
    }

    if (requested_end_time) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
      if (!timeRegex.test(requested_end_time)) {
        return res.status(400).json({
          success: false,
          message: 'Requested end time must be in HH:mm:ss format'
        });
      }
    }

    // Validate duration if provided
    if (requested_duration_days !== undefined && requested_duration_days < 0) {
      return res.status(400).json({
        success: false,
        message: 'Requested duration days must be a positive number'
      });
    }

    // Check if user has sufficient time off bank for compensatory time use
    if (request_type === 'compensatory_time_use' && requested_duration_days) {
      const [timeOffBankRows]: any = await pool.execute(
        'SELECT available_days FROM time_off_banks WHERE user_id = ? AND valid_to >= CURDATE()',
        [userId]
      );

      if (timeOffBankRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No available compensatory time for this user'
        });
      }

      const availableDays = timeOffBankRows[0].available_days;
      if (availableDays < requested_duration_days) {
        return res.status(400).json({
          success: false,
          message: `Insufficient compensatory time. Available: ${availableDays}, Requested: ${requested_duration_days}`
        });
      }
    }

    // Create the schedule request
    const [result]: any = await pool.execute(
      `INSERT INTO schedule_requests 
       (user_id, request_type, request_subtype, requested_date, requested_start_time, requested_end_time, 
        requested_duration_days, reason, scheduled_for, expires_on, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        request_type,
        request_subtype || null,
        requested_date || null,
        requested_start_time || null,
        requested_end_time || null,
        requested_duration_days || null,
        reason,
        scheduled_for || null,
        expires_on || null,
        userId
      ]
    );

    const requestId = result.insertId;

    // Get the created schedule request
    const [requestRows]: any = await pool.execute(
      `SELECT sr.*, u.full_name as user_name, abr.full_name as approved_by_name, rbr.full_name as rejected_by_name, cbr.full_name as created_by_name
       FROM schedule_requests sr
       LEFT JOIN users u ON sr.user_id = u.id
       LEFT JOIN users abr ON sr.approved_by = abr.id
       LEFT JOIN users rbr ON sr.rejected_by = rbr.id
       LEFT JOIN users cbr ON sr.created_by = cbr.id
       WHERE sr.id = ?`,
      [requestId]
    );

    return res.status(201).json({
      success: true,
      message: 'Schedule request created successfully',
      data: {
        scheduleRequest: requestRows[0]
      }
    });
  } catch (error) {
    console.error('Error creating schedule request:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating schedule request'
    });
  }
};

/**
 * Update a schedule request
 */
export const updateScheduleRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      request_subtype,
      requested_date,
      requested_start_time,
      requested_end_time,
      requested_duration_days,
      reason,
      scheduled_for,
      expires_on
    } = req.body;

    const userId = (req as any).currentUser.id;

    // Get the existing request
    const [existingRows]: any = await pool.execute(
      'SELECT * FROM schedule_requests WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule request not found'
      });
    }

    const existingRequest = existingRows[0];

    // Check if user is authorized to update this request
    if (existingRequest.user_id !== userId && (req as any).currentUser.role_id !== 1 && (req as any).currentUser.role_id !== 2) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this schedule request'
      });
    }

    // Check if request is already approved/implemented
    if (existingRequest.status === 'approved' || existingRequest.status === 'implemented') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a request that is already approved or implemented'
      });
    }

    // Validate date format if provided
    if (requested_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(requested_date)) {
        return res.status(400).json({
          success: false,
          message: 'Requested date must be in YYYY-MM-DD format'
        });
      }
    }

    if (scheduled_for) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(scheduled_for)) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled for date must be in YYYY-MM-DD format'
        });
      }
    }

    if (expires_on) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(expires_on)) {
        return res.status(400).json({
          success: false,
          message: 'Expires on date must be in YYYY-MM-DD format'
        });
      }
    }

    // Validate time format if provided
    if (requested_start_time) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
      if (!timeRegex.test(requested_start_time)) {
        return res.status(400).json({
          success: false,
          message: 'Requested start time must be in HH:mm:ss format'
        });
      }
    }

    if (requested_end_time) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
      if (!timeRegex.test(requested_end_time)) {
        return res.status(400).json({
          success: false,
          message: 'Requested end time must be in HH:mm:ss format'
        });
      }
    }

    // Validate duration if provided
    if (requested_duration_days !== undefined && requested_duration_days < 0) {
      return res.status(400).json({
        success: false,
        message: 'Requested duration days must be a positive number'
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const params = [];

    if (request_subtype !== undefined) {
      updateFields.push('request_subtype = ?');
      params.push(request_subtype);
    }
    if (requested_date !== undefined) {
      updateFields.push('requested_date = ?');
      params.push(requested_date);
    }
    if (requested_start_time !== undefined) {
      updateFields.push('requested_start_time = ?');
      params.push(requested_start_time);
    }
    if (requested_end_time !== undefined) {
      updateFields.push('requested_end_time = ?');
      params.push(requested_end_time);
    }
    if (requested_duration_days !== undefined) {
      updateFields.push('requested_duration_days = ?');
      params.push(requested_duration_days);
    }
    if (reason !== undefined) {
      updateFields.push('reason = ?');
      params.push(reason);
    }
    if (scheduled_for !== undefined) {
      updateFields.push('scheduled_for = ?');
      params.push(scheduled_for);
    }
    if (expires_on !== undefined) {
      updateFields.push('expires_on = ?');
      params.push(expires_on);
    }

    // Add updated_at field
    updateFields.push('updated_at = NOW()');
    params.push(id); // For WHERE clause

    const query = `UPDATE schedule_requests SET ${updateFields.join(', ')} WHERE id = ?`;

    await pool.execute(query, params);

    // Get the updated schedule request
    const [updatedRows]: any = await pool.execute(
      `SELECT sr.*, u.full_name as user_name, abr.full_name as approved_by_name, rbr.full_name as rejected_by_name, cbr.full_name as created_by_name
       FROM schedule_requests sr
       LEFT JOIN users u ON sr.user_id = u.id
       LEFT JOIN users abr ON sr.approved_by = abr.id
       LEFT JOIN users rbr ON sr.rejected_by = rbr.id
       LEFT JOIN users cbr ON sr.created_by = cbr.id
       WHERE sr.id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: 'Schedule request updated successfully',
      data: {
        scheduleRequest: updatedRows[0]
      }
    });
  } catch (error) {
    console.error('Error updating schedule request:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating schedule request'
    });
  }
};

/**
 * Cancel a schedule request
 */
export const cancelScheduleRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).currentUser.id;

    // Get the existing request
    const [existingRows]: any = await pool.execute(
      'SELECT * FROM schedule_requests WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule request not found'
      });
    }

    const existingRequest = existingRows[0];

    // Check if user is authorized to cancel this request
    if (existingRequest.user_id !== userId && (req as any).currentUser.role_id !== 1 && (req as any).currentUser.role_id !== 2) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this schedule request'
      });
    }

    // Check if request is already approved/implemented
    if (existingRequest.status === 'approved' || existingRequest.status === 'implemented') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a request that is already approved or implemented'
      });
    }

    // Update the request status to cancelled
    await pool.execute(
      'UPDATE schedule_requests SET status = ?, updated_at = NOW() WHERE id = ?',
      ['cancelled', id]
    );

    return res.json({
      success: true,
      message: 'Schedule request cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling schedule request:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while cancelling schedule request'
    });
  }
};

/**
 * Approve a schedule request
 */
export const approveScheduleRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const approverId = (req as any).currentUser.id;

    // Check if user has permission to approve requests
    if ((req as any).currentUser.role_id !== 1 && (req as any).currentUser.role_id !== 2) { // Assuming role IDs 1 and 2 are admin/HR
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to approve schedule requests'
      });
    }

    // Get the existing request
    const [existingRows]: any = await pool.execute(
      'SELECT * FROM schedule_requests WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule request not found'
      });
    }

    const existingRequest = existingRows[0];

    // Check if request is already approved/implemented/cancelled
    if (existingRequest.status === 'approved' || existingRequest.status === 'implemented' || existingRequest.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve a request with status: ${existingRequest.status}`
      });
    }

    // Update the request status to approved
    await pool.execute(
      'UPDATE schedule_requests SET status = ?, approved_by = ?, approved_at = NOW(), updated_at = NOW() WHERE id = ?',
      ['approved', approverId, id]
    );

    // If this is a compensatory time use request, update the time off bank
    if (existingRequest.request_type === 'compensatory_time_use' && existingRequest.requested_duration_days) {
      await pool.execute(
        `UPDATE time_off_banks 
         SET used_days = used_days + ?, available_days = available_days - ? 
         WHERE user_id = ? AND valid_to >= CURDATE()`,
        [existingRequest.requested_duration_days, existingRequest.requested_duration_days, existingRequest.user_id]
      );
    }

    // Get the updated schedule request
    const [updatedRows]: any = await pool.execute(
      `SELECT sr.*, u.full_name as user_name, abr.full_name as approved_by_name, rbr.full_name as rejected_by_name, cbr.full_name as created_by_name
       FROM schedule_requests sr
       LEFT JOIN users u ON sr.user_id = u.id
       LEFT JOIN users abr ON sr.approved_by = abr.id
       LEFT JOIN users rbr ON sr.rejected_by = rbr.id
       LEFT JOIN users cbr ON sr.created_by = cbr.id
       WHERE sr.id = ?`,
      [id]
    );

    // If the request has a scheduled_for date, create the appropriate shift exception or assignment
    if (updatedRows[0].scheduled_for) {
      try {
        // For time off requests, create an exception marking the day as a day off
        if (updatedRows[0].request_type === 'time_off_request') {
          await pool.execute(
            `INSERT INTO shift_exceptions 
             (user_id, shift_assignment_id, exception_date, exception_type, reason, approved_by, status) 
             VALUES (?, NULL, ?, 'day_off', ?, ?, 'active')`,
            [updatedRows[0].user_id, updatedRows[0].scheduled_for, updatedRows[0].reason, approverId]
          );
        } 
        // For schedule changes, create an exception with the new times
        else if (updatedRows[0].request_type === 'schedule_change') {
          await pool.execute(
            `INSERT INTO shift_exceptions 
             (user_id, shift_assignment_id, exception_date, exception_type, new_start_time, new_end_time, reason, approved_by, status) 
             VALUES (?, NULL, ?, 'special_schedule', ?, ?, ?, ?, 'active')`,
            [
              updatedRows[0].user_id, 
              updatedRows[0].scheduled_for, 
              updatedRows[0].requested_start_time, 
              updatedRows[0].requested_end_time, 
              updatedRows[0].reason, 
              approverId
            ]
          );
        }
      } catch (exceptionError) {
        console.error('Error creating shift exception after approval:', exceptionError);
        // Don't fail the approval if exception creation fails
      }
    }

    // Process attendance for the scheduled date to update with new schedule
    if (updatedRows[0].scheduled_for) {
      try {
        const date = new Date(updatedRows[0].scheduled_for);
        await ShiftSchedulingService.processAttendanceForDate(updatedRows[0].user_id, date);
      } catch (attendanceError) {
        console.error('Error processing attendance after approval:', attendanceError);
        // Don't fail the approval if attendance processing fails
      }
    }

    return res.json({
      success: true,
      message: 'Schedule request approved successfully',
      data: {
        scheduleRequest: updatedRows[0]
      }
    });
  } catch (error) {
    console.error('Error approving schedule request:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while approving schedule request'
    });
  }
};

/**
 * Reject a schedule request
 */
export const rejectScheduleRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const rejectorId = (req as any).currentUser.id;

    // Check if user has permission to reject requests
    if ((req as any).currentUser.role_id !== 1 && (req as any).currentUser.role_id !== 2) { // Assuming role IDs 1 and 2 are admin/HR
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to reject schedule requests'
      });
    }

    // Get the existing request
    const [existingRows]: any = await pool.execute(
      'SELECT * FROM schedule_requests WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule request not found'
      });
    }

    const existingRequest = existingRows[0];

    // Check if request is already approved/implemented/cancelled
    if (existingRequest.status === 'approved' || existingRequest.status === 'implemented' || existingRequest.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a request with status: ${existingRequest.status}`
      });
    }

    // Update the request status to rejected
    await pool.execute(
      'UPDATE schedule_requests SET status = ?, rejected_by = ?, rejected_at = NOW(), rejection_reason = ?, updated_at = NOW() WHERE id = ?',
      ['rejected', rejectorId, rejection_reason || null, id]
    );

    // Get the updated schedule request
    const [updatedRows]: any = await pool.execute(
      `SELECT sr.*, u.full_name as user_name, abr.full_name as approved_by_name, rbr.full_name as rejected_by_name, cbr.full_name as created_by_name
       FROM schedule_requests sr
       LEFT JOIN users u ON sr.user_id = u.id
       LEFT JOIN users abr ON sr.approved_by = abr.id
       LEFT JOIN users rbr ON sr.rejected_by = rbr.id
       LEFT JOIN users cbr ON sr.created_by = cbr.id
       WHERE sr.id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: 'Schedule request rejected successfully',
      data: {
        scheduleRequest: updatedRows[0]
      }
    });
  } catch (error) {
    console.error('Error rejecting schedule request:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while rejecting schedule request'
    });
  }
};

/**
 * Get user's time off bank balance
 */
export const getTimeOffBankBalance = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).currentUser.id;

    const [rows]: any = await pool.execute(
      `SELECT *
       FROM time_off_banks 
       WHERE user_id = ? AND valid_to >= CURDATE()`,
      [userId]
    );

    return res.json({
      success: true,
      data: {
        timeOffBanks: rows
      }
    });
  } catch (error) {
    console.error('Error fetching time off bank balance:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching time off bank balance'
    });
  }
};

/**
 * Get all time off banks (for HR/admin)
 */
export const getAllTimeOffBanks = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).currentUser;

    // Check if user has permission to view all time off banks
    if (currentUser.role_id !== 1 && currentUser.role_id !== 2) { // Assuming role IDs 1 and 2 are admin/HR
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view all time off banks'
      });
    }

    const { userId, page = 1, limit = 10 } = req.query;

    let query = `
      SELECT tob.*, u.full_name as user_name, cbr.full_name as created_by_name
      FROM time_off_banks tob
      LEFT JOIN users u ON tob.user_id = u.id
      LEFT JOIN users cbr ON tob.created_by = cbr.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (userId) {
      query += ' AND tob.user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY tob.created_at DESC';

    // Add pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [rows]: any = await pool.execute(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM time_off_banks tob
      WHERE 1=1
    `;
    const countParams = [];

    if (userId) {
      countQuery += ' AND tob.user_id = ?';
      countParams.push(userId);
    }

    const [countRows]: any = await pool.execute(countQuery, countParams);

    return res.json({
      success: true,
      data: {
        timeOffBanks: rows,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(countRows[0].total / Number(limit)),
          totalItems: countRows[0].total,
          itemsPerPage: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching time off banks:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching time off banks'
    });
  }
};

/**
 * Create a time off bank (for HR/admin)
 */
export const createTimeOffBank = async (req: Request, res: Response) => {
  try {
    const { user_id, program_name, description, total_entitled_days, valid_from, valid_to } = req.body;
    const createdBy = (req as any).currentUser.id;

    // Check if user has permission to create time off banks
    if ((req as any).currentUser.role_id !== 1 && (req as any).currentUser.role_id !== 2) { // Assuming role IDs 1 and 2 are admin/HR
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to create time off banks'
      });
    }

    // Validate required fields
    if (!user_id || !program_name || total_entitled_days === undefined || !valid_from || !valid_to) {
      return res.status(400).json({
        success: false,
        message: 'User ID, program name, total entitled days, valid from and valid to dates are required'
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

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(valid_from) || !dateRegex.test(valid_to)) {
      return res.status(400).json({
        success: false,
        message: 'Valid from and valid to dates must be in YYYY-MM-DD format'
      });
    }

    // Validate that valid_to is after valid_from
    const fromDate = new Date(valid_from);
    const toDate = new Date(valid_to);
    if (toDate < fromDate) {
      return res.status(400).json({
        success: false,
        message: 'Valid to date must be after valid from date'
      });
    }

    // Validate that total_entitled_days is positive
    if (total_entitled_days < 0) {
      return res.status(400).json({
        success: false,
        message: 'Total entitled days must be a positive number'
      });
    }

    // Create the time off bank
    const [result]: any = await pool.execute(
      `INSERT INTO time_off_banks 
       (user_id, program_name, description, total_entitled_days, used_days, valid_from, valid_to, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        program_name,
        description || null,
        total_entitled_days,
        0, // Initially no days used
        valid_from,
        valid_to,
        createdBy
      ]
    );

    const bankId = result.insertId;

    // Get the created time off bank
    const [bankRows]: any = await pool.execute(
      `SELECT tob.*, u.full_name as user_name, cbr.full_name as created_by_name
       FROM time_off_banks tob
       LEFT JOIN users u ON tob.user_id = u.id
       LEFT JOIN users cbr ON tob.created_by = cbr.id
       WHERE tob.id = ?`,
      [bankId]
    );

    return res.status(201).json({
      success: true,
      message: 'Time off bank created successfully',
      data: {
        timeOffBank: bankRows[0]
      }
    });
  } catch (error) {
    console.error('Error creating time off bank:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating time off bank'
    });
  }
};