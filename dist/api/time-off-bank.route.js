"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('time_off_bank:read'), async (req, res) => {
    try {
        const { userId, programName, validFrom, validTo, page = 1, limit = 10 } = req.query;
        let query = `
      SELECT tob.*, u.full_name as user_name, cbr.full_name as created_by_name
      FROM time_off_banks tob
      LEFT JOIN users u ON tob.user_id = u.id
      LEFT JOIN users cbr ON tob.created_by = cbr.id
      WHERE 1=1
    `;
        const params = [];
        if (userId) {
            const userIdNum = parseInt(userId);
            if (!isNaN(userIdNum)) {
                query += ' AND tob.user_id = ?';
                params.push(userIdNum);
            }
        }
        if (programName) {
            query += ' AND tob.program_name LIKE ?';
            params.push(`%${programName}%`);
        }
        if (validFrom) {
            query += ' AND tob.valid_to >= ?';
            params.push(validFrom);
        }
        if (validTo) {
            query += ' AND tob.valid_from <= ?';
            params.push(validTo);
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
            const userIdNum = parseInt(userId);
            if (!isNaN(userIdNum)) {
                countQuery += ' AND tob.user_id = ?';
                countParams.push(userIdNum);
            }
        }
        if (programName) {
            countQuery += ' AND tob.program_name LIKE ?';
            countParams.push(`%${programName}%`);
        }
        if (validFrom) {
            countQuery += ' AND tob.valid_to >= ?';
            countParams.push(validFrom);
        }
        if (validTo) {
            countQuery += ' AND tob.valid_from <= ?';
            countParams.push(validTo);
        }
        const [countRows] = await database_1.pool.execute(countQuery, countParams);
        return res.json({
            success: true,
            message: 'Time off banks retrieved successfully',
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
});
router.get('/my-balance', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.currentUser?.id;
        const [rows] = await database_1.pool.execute(`SELECT *
       FROM time_off_banks
       WHERE user_id = ? AND valid_to >= CURDATE()`, [userId]);
        return res.json({
            success: true,
            message: 'Your time off bank balances retrieved successfully',
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
});
router.get('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('time_off_bank:read'), async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const bankId = parseInt(idStr);
        if (isNaN(bankId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid time off bank ID'
            });
        }
        const [rows] = await database_1.pool.execute(`SELECT tob.*, u.full_name as user_name, cbr.full_name as created_by_name
       FROM time_off_banks tob
       LEFT JOIN users u ON tob.user_id = u.id
       LEFT JOIN users cbr ON tob.created_by = cbr.id
       WHERE tob.id = ?`, [bankId]);
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Time off bank not found'
            });
        }
        const currentUserRole = req.currentUser?.role_id;
        const bankUserId = rows[0].user_id;
        const currentUserId = req.currentUser?.id;
        if (currentUserRole !== 1 && currentUserRole !== 2 && currentUserId !== bankUserId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to access this time off bank'
            });
        }
        return res.json({
            success: true,
            message: 'Time off bank retrieved successfully',
            data: {
                timeOffBank: rows[0]
            }
        });
    }
    catch (error) {
        console.error('Error fetching time off bank:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching time off bank'
        });
    }
});
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('time_off_bank:create'), async (req, res) => {
    try {
        const { user_id, program_name, description, total_entitled_days, valid_from, valid_to } = req.body;
        const createdBy = req.currentUser?.id;
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
});
router.put('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('time_off_bank:update'), async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const bankId = parseInt(idStr);
        const { program_name, description, total_entitled_days, valid_from, valid_to } = req.body;
        if (isNaN(bankId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid time off bank ID'
            });
        }
        const [existingRows] = await database_1.pool.execute('SELECT * FROM time_off_banks WHERE id = ?', [bankId]);
        if (existingRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Time off bank not found'
            });
        }
        const updates = [];
        const params = [];
        if (program_name !== undefined) {
            updates.push('program_name = ?');
            params.push(program_name);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            params.push(description);
        }
        if (total_entitled_days !== undefined) {
            if (total_entitled_days < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Total entitled days must be a positive number'
                });
            }
            if (total_entitled_days < existingRows[0].used_days) {
                return res.status(400).json({
                    success: false,
                    message: 'Total entitled days cannot be less than used days'
                });
            }
            updates.push('total_entitled_days = ?');
            params.push(total_entitled_days);
        }
        if (valid_from !== undefined) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(valid_from)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid from date must be in YYYY-MM-DD format'
                });
            }
            updates.push('valid_from = ?');
            params.push(valid_from);
        }
        if (valid_to !== undefined) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(valid_to)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid to date must be in YYYY-MM-DD format'
                });
            }
            if (valid_from && valid_to < valid_from) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid to date must be after valid from date'
                });
            }
            else if (!valid_from && valid_to < existingRows[0].valid_from) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid to date must be after valid from date'
                });
            }
            updates.push('valid_to = ?');
            params.push(valid_to);
        }
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }
        params.push(bankId);
        await database_1.pool.execute(`UPDATE time_off_banks SET ${updates.join(', ')} WHERE id = ?`, params);
        const [updatedRows] = await database_1.pool.execute(`SELECT tob.*, u.full_name as user_name, cbr.full_name as created_by_name
       FROM time_off_banks tob
       LEFT JOIN users u ON tob.user_id = u.id
       LEFT JOIN users cbr ON tob.created_by = cbr.id
       WHERE tob.id = ?`, [bankId]);
        return res.json({
            success: true,
            message: 'Time off bank updated successfully',
            data: {
                timeOffBank: updatedRows[0]
            }
        });
    }
    catch (error) {
        console.error('Error updating time off bank:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while updating time off bank'
        });
    }
});
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('time_off_bank:delete'), async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const bankId = parseInt(idStr);
        if (isNaN(bankId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid time off bank ID'
            });
        }
        const [existingRows] = await database_1.pool.execute('SELECT * FROM time_off_banks WHERE id = ?', [bankId]);
        if (existingRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Time off bank not found'
            });
        }
        if (existingRows[0].used_days > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete time off bank that has been partially used'
            });
        }
        await database_1.pool.execute('DELETE FROM time_off_banks WHERE id = ?', [bankId]);
        return res.json({
            success: true,
            message: 'Time off bank deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting time off bank:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while deleting time off bank'
        });
    }
});
router.post('/assign', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('time_off_bank:create'), async (req, res) => {
    try {
        const { user_ids, program_name, description, total_entitled_days, valid_from, valid_to } = req.body;
        const createdBy = req.currentUser?.id;
        if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User IDs array is required'
            });
        }
        if (!program_name || total_entitled_days === undefined || !valid_from || !valid_to) {
            return res.status(400).json({
                success: false,
                message: 'Program name, total entitled days, valid from and valid to dates are required'
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
        const [userRows] = await database_1.pool.execute(`SELECT id FROM users WHERE id IN (${user_ids.map(() => '?').join(',')})`, user_ids);
        if (userRows.length !== user_ids.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more users not found'
            });
        }
        const createdBanks = [];
        for (const userId of user_ids) {
            const [result] = await database_1.pool.execute(`INSERT INTO time_off_banks
         (user_id, program_name, description, total_entitled_days, used_days, valid_from, valid_to, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                userId,
                program_name,
                description || null,
                total_entitled_days,
                0,
                valid_from,
                valid_to,
                createdBy
            ]);
            const bankId = result.insertId;
            const [bankRow] = await database_1.pool.execute(`SELECT tob.*, u.full_name as user_name, cbr.full_name as created_by_name
         FROM time_off_banks tob
         LEFT JOIN users u ON tob.user_id = u.id
         LEFT JOIN users cbr ON tob.created_by = cbr.id
         WHERE tob.id = ?`, [bankId]);
            createdBanks.push(bankRow[0]);
        }
        return res.status(201).json({
            success: true,
            message: `${createdBanks.length} time off banks created successfully`,
            data: {
                timeOffBanks: createdBanks
            }
        });
    }
    catch (error) {
        console.error('Error assigning time off banks:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while assigning time off banks'
        });
    }
});
exports.default = router;
//# sourceMappingURL=time-off-bank.route.js.map