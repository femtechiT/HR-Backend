"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTimeOffBank = exports.getAllTimeOffBanks = exports.getTimeOffBankBalance = exports.rejectScheduleRequest = exports.approveScheduleRequest = exports.cancelScheduleRequest = exports.updateScheduleRequest = exports.createScheduleRequest = exports.getScheduleRequestById = exports.getAllScheduleRequests = void 0;
const database_1 = require("../config/database");
const shift_scheduling_service_1 = require("../services/shift-scheduling.service");
const getAllScheduleRequests = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, requestType, userId } = req.query;
        const currentUser = req.currentUser;
        let query = `
      SELECT sr.*, u.full_name as user_name, abr.full_name as approved_by_name, rbr.full_name as rejected_by_name, cbr.full_name as created_by_name
      FROM schedule_requests sr
      LEFT JOIN users u ON sr.user_id = u.id
      LEFT JOIN users abr ON sr.approved_by = abr.id
      LEFT JOIN users rbr ON sr.rejected_by = rbr.id
      LEFT JOIN users cbr ON sr.created_by = cbr.id
      WHERE 1=1
    `;
        const params = [];
        if (currentUser.role_id !== 1 && currentUser.role_id !== 2) {
            query += ' AND sr.user_id = ?';
            params.push(currentUser.id);
        }
        else if (userId) {
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
        const offset = (Number(page) - 1) * Number(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(Number(limit), offset);
        const [rows] = await database_1.pool.execute(query, params);
        let countQuery = `
      SELECT COUNT(*) as total
      FROM schedule_requests sr
      WHERE 1=1
    `;
        const countParams = [];
        if (currentUser.role_id !== 1 && currentUser.role_id !== 2) {
            countQuery += ' AND sr.user_id = ?';
            countParams.push(currentUser.id);
        }
        else if (userId) {
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
        const [countRows] = await database_1.pool.execute(countQuery, countParams);
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
    }
    catch (error) {
        console.error('Error fetching schedule requests:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching schedule requests'
        });
    }
};
exports.getAllScheduleRequests = getAllScheduleRequests;
const getScheduleRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.currentUser;
        const [rows] = await database_1.pool.execute(`SELECT sr.*, u.full_name as user_name, abr.full_name as approved_by_name, rbr.full_name as rejected_by_name, cbr.full_name as created_by_name
       FROM schedule_requests sr
       LEFT JOIN users u ON sr.user_id = u.id
       LEFT JOIN users abr ON sr.approved_by = abr.id
       LEFT JOIN users rbr ON sr.rejected_by = rbr.id
       LEFT JOIN users cbr ON sr.created_by = cbr.id
       WHERE sr.id = ?`, [id]);
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Schedule request not found'
            });
        }
        const request = rows[0];
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
    }
    catch (error) {
        console.error('Error fetching schedule request:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching schedule request'
        });
    }
};
exports.getScheduleRequestById = getScheduleRequestById;
const createScheduleRequest = async (req, res) => {
    try {
        const { request_type, request_subtype, requested_date, requested_start_time, requested_end_time, requested_duration_days, reason, scheduled_for, expires_on } = req.body;
        const userId = req.currentUser.id;
        if (!request_type || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Request type and reason are required'
            });
        }
        const validRequestTypes = ['time_off_request', 'schedule_change', 'shift_swap', 'flexible_arrangement', 'compensatory_time_use'];
        if (!validRequestTypes.includes(request_type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid request type. Valid values are: ${validRequestTypes.join(', ')}`
            });
        }
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
        if (requested_duration_days !== undefined && requested_duration_days < 0) {
            return res.status(400).json({
                success: false,
                message: 'Requested duration days must be a positive number'
            });
        }
        if (request_type === 'compensatory_time_use' && requested_duration_days) {
            const [timeOffBankRows] = await database_1.pool.execute('SELECT available_days FROM time_off_banks WHERE user_id = ? AND valid_to >= CURDATE()', [userId]);
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
        const [result] = await database_1.pool.execute(`INSERT INTO schedule_requests 
       (user_id, request_type, request_subtype, requested_date, requested_start_time, requested_end_time, 
        requested_duration_days, reason, scheduled_for, expires_on, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
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
        ]);
        const requestId = result.insertId;
        const [requestRows] = await database_1.pool.execute(`SELECT sr.*, u.full_name as user_name, abr.full_name as approved_by_name, rbr.full_name as rejected_by_name, cbr.full_name as created_by_name
       FROM schedule_requests sr
       LEFT JOIN users u ON sr.user_id = u.id
       LEFT JOIN users abr ON sr.approved_by = abr.id
       LEFT JOIN users rbr ON sr.rejected_by = rbr.id
       LEFT JOIN users cbr ON sr.created_by = cbr.id
       WHERE sr.id = ?`, [requestId]);
        return res.status(201).json({
            success: true,
            message: 'Schedule request created successfully',
            data: {
                scheduleRequest: requestRows[0]
            }
        });
    }
    catch (error) {
        console.error('Error creating schedule request:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while creating schedule request'
        });
    }
};
exports.createScheduleRequest = createScheduleRequest;
const updateScheduleRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { request_subtype, requested_date, requested_start_time, requested_end_time, requested_duration_days, reason, scheduled_for, expires_on } = req.body;
        const userId = req.currentUser.id;
        const [existingRows] = await database_1.pool.execute('SELECT * FROM schedule_requests WHERE id = ?', [id]);
        if (existingRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Schedule request not found'
            });
        }
        const existingRequest = existingRows[0];
        if (existingRequest.user_id !== userId && req.currentUser.role_id !== 1 && req.currentUser.role_id !== 2) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to update this schedule request'
            });
        }
        if (existingRequest.status === 'approved' || existingRequest.status === 'implemented') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update a request that is already approved or implemented'
            });
        }
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
        if (requested_duration_days !== undefined && requested_duration_days < 0) {
            return res.status(400).json({
                success: false,
                message: 'Requested duration days must be a positive number'
            });
        }
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
        updateFields.push('updated_at = NOW()');
        params.push(id);
        const query = `UPDATE schedule_requests SET ${updateFields.join(', ')} WHERE id = ?`;
        await database_1.pool.execute(query, params);
        const [updatedRows] = await database_1.pool.execute(`SELECT sr.*, u.full_name as user_name, abr.full_name as approved_by_name, rbr.full_name as rejected_by_name, cbr.full_name as created_by_name
       FROM schedule_requests sr
       LEFT JOIN users u ON sr.user_id = u.id
       LEFT JOIN users abr ON sr.approved_by = abr.id
       LEFT JOIN users rbr ON sr.rejected_by = rbr.id
       LEFT JOIN users cbr ON sr.created_by = cbr.id
       WHERE sr.id = ?`, [id]);
        return res.json({
            success: true,
            message: 'Schedule request updated successfully',
            data: {
                scheduleRequest: updatedRows[0]
            }
        });
    }
    catch (error) {
        console.error('Error updating schedule request:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while updating schedule request'
        });
    }
};
exports.updateScheduleRequest = updateScheduleRequest;
const cancelScheduleRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.currentUser.id;
        const [existingRows] = await database_1.pool.execute('SELECT * FROM schedule_requests WHERE id = ?', [id]);
        if (existingRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Schedule request not found'
            });
        }
        const existingRequest = existingRows[0];
        if (existingRequest.user_id !== userId && req.currentUser.role_id !== 1 && req.currentUser.role_id !== 2) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to cancel this schedule request'
            });
        }
        if (existingRequest.status === 'approved' || existingRequest.status === 'implemented') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel a request that is already approved or implemented'
            });
        }
        await database_1.pool.execute('UPDATE schedule_requests SET status = ?, updated_at = NOW() WHERE id = ?', ['cancelled', id]);
        return res.json({
            success: true,
            message: 'Schedule request cancelled successfully'
        });
    }
    catch (error) {
        console.error('Error cancelling schedule request:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while cancelling schedule request'
        });
    }
};
exports.cancelScheduleRequest = cancelScheduleRequest;
const approveScheduleRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const approverId = req.currentUser.id;
        if (req.currentUser.role_id !== 1 && req.currentUser.role_id !== 2) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to approve schedule requests'
            });
        }
        const [existingRows] = await database_1.pool.execute('SELECT * FROM schedule_requests WHERE id = ?', [id]);
        if (existingRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Schedule request not found'
            });
        }
        const existingRequest = existingRows[0];
        if (existingRequest.status === 'approved' || existingRequest.status === 'implemented' || existingRequest.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: `Cannot approve a request with status: ${existingRequest.status}`
            });
        }
        await database_1.pool.execute('UPDATE schedule_requests SET status = ?, approved_by = ?, approved_at = NOW(), updated_at = NOW() WHERE id = ?', ['approved', approverId, id]);
        if (existingRequest.request_type === 'compensatory_time_use' && existingRequest.requested_duration_days) {
            await database_1.pool.execute(`UPDATE time_off_banks 
         SET used_days = used_days + ?, available_days = available_days - ? 
         WHERE user_id = ? AND valid_to >= CURDATE()`, [existingRequest.requested_duration_days, existingRequest.requested_duration_days, existingRequest.user_id]);
        }
        const [updatedRows] = await database_1.pool.execute(`SELECT sr.*, u.full_name as user_name, abr.full_name as approved_by_name, rbr.full_name as rejected_by_name, cbr.full_name as created_by_name
       FROM schedule_requests sr
       LEFT JOIN users u ON sr.user_id = u.id
       LEFT JOIN users abr ON sr.approved_by = abr.id
       LEFT JOIN users rbr ON sr.rejected_by = rbr.id
       LEFT JOIN users cbr ON sr.created_by = cbr.id
       WHERE sr.id = ?`, [id]);
        if (updatedRows[0].scheduled_for) {
            try {
                if (updatedRows[0].request_type === 'time_off_request') {
                    await database_1.pool.execute(`INSERT INTO shift_exceptions 
             (user_id, shift_assignment_id, exception_date, exception_type, reason, approved_by, status) 
             VALUES (?, NULL, ?, 'day_off', ?, ?, 'active')`, [updatedRows[0].user_id, updatedRows[0].scheduled_for, updatedRows[0].reason, approverId]);
                }
                else if (updatedRows[0].request_type === 'schedule_change') {
                    await database_1.pool.execute(`INSERT INTO shift_exceptions 
             (user_id, shift_assignment_id, exception_date, exception_type, new_start_time, new_end_time, reason, approved_by, status) 
             VALUES (?, NULL, ?, 'special_schedule', ?, ?, ?, ?, 'active')`, [
                        updatedRows[0].user_id,
                        updatedRows[0].scheduled_for,
                        updatedRows[0].requested_start_time,
                        updatedRows[0].requested_end_time,
                        updatedRows[0].reason,
                        approverId
                    ]);
                }
            }
            catch (exceptionError) {
                console.error('Error creating shift exception after approval:', exceptionError);
            }
        }
        if (updatedRows[0].scheduled_for) {
            try {
                const date = new Date(updatedRows[0].scheduled_for);
                await shift_scheduling_service_1.ShiftSchedulingService.processAttendanceForDate(updatedRows[0].user_id, date);
            }
            catch (attendanceError) {
                console.error('Error processing attendance after approval:', attendanceError);
            }
        }
        return res.json({
            success: true,
            message: 'Schedule request approved successfully',
            data: {
                scheduleRequest: updatedRows[0]
            }
        });
    }
    catch (error) {
        console.error('Error approving schedule request:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while approving schedule request'
        });
    }
};
exports.approveScheduleRequest = approveScheduleRequest;
const rejectScheduleRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejection_reason } = req.body;
        const rejectorId = req.currentUser.id;
        if (req.currentUser.role_id !== 1 && req.currentUser.role_id !== 2) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to reject schedule requests'
            });
        }
        const [existingRows] = await database_1.pool.execute('SELECT * FROM schedule_requests WHERE id = ?', [id]);
        if (existingRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Schedule request not found'
            });
        }
        const existingRequest = existingRows[0];
        if (existingRequest.status === 'approved' || existingRequest.status === 'implemented' || existingRequest.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: `Cannot reject a request with status: ${existingRequest.status}`
            });
        }
        await database_1.pool.execute('UPDATE schedule_requests SET status = ?, rejected_by = ?, rejected_at = NOW(), rejection_reason = ?, updated_at = NOW() WHERE id = ?', ['rejected', rejectorId, rejection_reason || null, id]);
        const [updatedRows] = await database_1.pool.execute(`SELECT sr.*, u.full_name as user_name, abr.full_name as approved_by_name, rbr.full_name as rejected_by_name, cbr.full_name as created_by_name
       FROM schedule_requests sr
       LEFT JOIN users u ON sr.user_id = u.id
       LEFT JOIN users abr ON sr.approved_by = abr.id
       LEFT JOIN users rbr ON sr.rejected_by = rbr.id
       LEFT JOIN users cbr ON sr.created_by = cbr.id
       WHERE sr.id = ?`, [id]);
        return res.json({
            success: true,
            message: 'Schedule request rejected successfully',
            data: {
                scheduleRequest: updatedRows[0]
            }
        });
    }
    catch (error) {
        console.error('Error rejecting schedule request:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while rejecting schedule request'
        });
    }
};
exports.rejectScheduleRequest = rejectScheduleRequest;
const getTimeOffBankBalance = async (req, res) => {
    try {
        const userId = req.currentUser.id;
        const [rows] = await database_1.pool.execute(`SELECT *
       FROM time_off_banks 
       WHERE user_id = ? AND valid_to >= CURDATE()`, [userId]);
        return res.json({
            success: true,
            data: {
                timeOffBanks: rows
            }
        });
    }
    catch (error) {
        console.error('Error fetching time off bank balance:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching time off bank balance'
        });
    }
};
exports.getTimeOffBankBalance = getTimeOffBankBalance;
const getAllTimeOffBanks = async (req, res) => {
    try {
        const currentUser = req.currentUser;
        if (currentUser.role_id !== 1 && currentUser.role_id !== 2) {
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
        const params = [];
        if (userId) {
            query += ' AND tob.user_id = ?';
            params.push(userId);
        }
        query += ' ORDER BY tob.created_at DESC';
        const offset = (Number(page) - 1) * Number(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(Number(limit), offset);
        const [rows] = await database_1.pool.execute(query, params);
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
        const [countRows] = await database_1.pool.execute(countQuery, countParams);
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
    }
    catch (error) {
        console.error('Error fetching time off banks:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching time off banks'
        });
    }
};
exports.getAllTimeOffBanks = getAllTimeOffBanks;
const createTimeOffBank = async (req, res) => {
    try {
        const { user_id, program_name, description, total_entitled_days, valid_from, valid_to } = req.body;
        const createdBy = req.currentUser.id;
        if (req.currentUser.role_id !== 1 && req.currentUser.role_id !== 2) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to create time off banks'
            });
        }
        if (!user_id || !program_name || total_entitled_days === undefined || !valid_from || !valid_to) {
            return res.status(400).json({
                success: false,
                message: 'User ID, program name, total entitled days, valid from and valid to dates are required'
            });
        }
        const [userRows] = await database_1.pool.execute('SELECT id FROM users WHERE id = ?', [user_id]);
        if (userRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(valid_from) || !dateRegex.test(valid_to)) {
            return res.status(400).json({
                success: false,
                message: 'Valid from and valid to dates must be in YYYY-MM-DD format'
            });
        }
        const fromDate = new Date(valid_from);
        const toDate = new Date(valid_to);
        if (toDate < fromDate) {
            return res.status(400).json({
                success: false,
                message: 'Valid to date must be after valid from date'
            });
        }
        if (total_entitled_days < 0) {
            return res.status(400).json({
                success: false,
                message: 'Total entitled days must be a positive number'
            });
        }
        const [result] = await database_1.pool.execute(`INSERT INTO time_off_banks 
       (user_id, program_name, description, total_entitled_days, used_days, valid_from, valid_to, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            user_id,
            program_name,
            description || null,
            total_entitled_days,
            0,
            valid_from,
            valid_to,
            createdBy
        ]);
        const bankId = result.insertId;
        const [bankRows] = await database_1.pool.execute(`SELECT tob.*, u.full_name as user_name, cbr.full_name as created_by_name
       FROM time_off_banks tob
       LEFT JOIN users u ON tob.user_id = u.id
       LEFT JOIN users cbr ON tob.created_by = cbr.id
       WHERE tob.id = ?`, [bankId]);
        return res.status(201).json({
            success: true,
            message: 'Time off bank created successfully',
            data: {
                timeOffBank: bankRows[0]
            }
        });
    }
    catch (error) {
        console.error('Error creating time off bank:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while creating time off bank'
        });
    }
};
exports.createTimeOffBank = createTimeOffBank;
//# sourceMappingURL=schedule-request.controller.js.map