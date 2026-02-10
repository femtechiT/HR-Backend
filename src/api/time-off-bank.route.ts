import { Router, Request, Response } from 'express';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';
import { pool } from '../config/database';

const router = Router();

// GET /api/time-off-banks - Get all time off banks (with optional filters)
router.get('/', authenticateJWT, checkPermission('time_off_bank:read'), async (req: Request, res: Response) => {
  try {
    const { userId, programName, validFrom, validTo, page = 1, limit = 10 } = req.query;

    let query = `
      SELECT tob.*, u.full_name as user_name, cbr.full_name as created_by_name
      FROM time_off_banks tob
      LEFT JOIN users u ON tob.user_id = u.id
      LEFT JOIN users cbr ON tob.created_by = cbr.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (userId) {
      const userIdNum = parseInt(userId as string);
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
      const userIdNum = parseInt(userId as string);
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

    const [countRows]: any = await pool.execute(countQuery, countParams);

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
  } catch (error) {
    console.error('Error fetching time off banks:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching time off banks'
    });
  }
});

// GET /api/time-off-banks/my-balance - Get current user's time off bank balances
router.get('/my-balance', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser?.id;

    const [rows]: any = await pool.execute(
      `SELECT *
       FROM time_off_banks
       WHERE user_id = ? AND valid_to >= CURDATE()`,
      [userId]
    );

    return res.json({
      success: true,
      message: 'Your time off bank balances retrieved successfully',
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
});

// GET /api/time-off-banks/:id - Get specific time off bank by ID
router.get('/:id', authenticateJWT, checkPermission('time_off_bank:read'), async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const bankId = parseInt(idStr as string);

    if (isNaN(bankId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time off bank ID'
      });
    }

    const [rows]: any = await pool.execute(
      `SELECT tob.*, u.full_name as user_name, cbr.full_name as created_by_name
       FROM time_off_banks tob
       LEFT JOIN users u ON tob.user_id = u.id
       LEFT JOIN users cbr ON tob.created_by = cbr.id
       WHERE tob.id = ?`,
      [bankId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Time off bank not found'
      });
    }

    // Check if user can access this time off bank
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
  } catch (error) {
    console.error('Error fetching time off bank:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching time off bank'
    });
  }
});

// POST /api/time-off-banks - Create a new time off bank
router.post('/', authenticateJWT, checkPermission('time_off_bank:create'), async (req: Request, res: Response) => {
  try {
    const { user_id, program_name, description, total_entitled_days, valid_from, valid_to } = req.body;
    const createdBy = req.currentUser?.id;

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
});

// PUT /api/time-off-banks/:id - Update a time off bank
router.put('/:id', authenticateJWT, checkPermission('time_off_bank:update'), async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const bankId = parseInt(idStr as string);
    const { program_name, description, total_entitled_days, valid_from, valid_to } = req.body;

    if (isNaN(bankId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time off bank ID'
      });
    }

    // Check if time off bank exists
    const [existingRows]: any = await pool.execute(
      'SELECT * FROM time_off_banks WHERE id = ?',
      [bankId]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Time off bank not found'
      });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

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
      // Ensure we don't reduce below used days
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
      // Validate date format
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
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(valid_to)) {
        return res.status(400).json({
          success: false,
          message: 'Valid to date must be in YYYY-MM-DD format'
        });
      }
      // Validate that valid_to is after valid_from
      if (valid_from && valid_to < valid_from) {
        return res.status(400).json({
          success: false,
          message: 'Valid to date must be after valid from date'
        });
      } else if (!valid_from && valid_to < existingRows[0].valid_from) {
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

    // Add the ID for the WHERE clause
    params.push(bankId);

    // Perform the update
    await pool.execute(
      `UPDATE time_off_banks SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Get the updated time off bank
    const [updatedRows]: any = await pool.execute(
      `SELECT tob.*, u.full_name as user_name, cbr.full_name as created_by_name
       FROM time_off_banks tob
       LEFT JOIN users u ON tob.user_id = u.id
       LEFT JOIN users cbr ON tob.created_by = cbr.id
       WHERE tob.id = ?`,
      [bankId]
    );

    return res.json({
      success: true,
      message: 'Time off bank updated successfully',
      data: {
        timeOffBank: updatedRows[0]
      }
    });
  } catch (error) {
    console.error('Error updating time off bank:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating time off bank'
    });
  }
});

// DELETE /api/time-off-banks/:id - Delete a time off bank
router.delete('/:id', authenticateJWT, checkPermission('time_off_bank:delete'), async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const bankId = parseInt(idStr as string);

    if (isNaN(bankId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time off bank ID'
      });
    }

    // Check if time off bank exists
    const [existingRows]: any = await pool.execute(
      'SELECT * FROM time_off_banks WHERE id = ?',
      [bankId]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Time off bank not found'
      });
    }

    // Check if any days have been used - if so, prevent deletion
    if (existingRows[0].used_days > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete time off bank that has been partially used'
      });
    }

    // Perform the deletion
    await pool.execute(
      'DELETE FROM time_off_banks WHERE id = ?',
      [bankId]
    );

    return res.json({
      success: true,
      message: 'Time off bank deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting time off bank:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deleting time off bank'
    });
  }
});

// POST /api/time-off-banks/assign - Assign time off bank to multiple employees
router.post('/assign', authenticateJWT, checkPermission('time_off_bank:create'), async (req: Request, res: Response) => {
  try {
    const { user_ids, program_name, description, total_entitled_days, valid_from, valid_to } = req.body;
    const createdBy = req.currentUser?.id;

    // Validate required fields
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

    // Validate all users exist
    const [userRows]: any = await pool.execute(
      `SELECT id FROM users WHERE id IN (${user_ids.map(() => '?').join(',')})`,
      user_ids
    );

    if (userRows.length !== user_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more users not found'
      });
    }

    // Create time off banks for each user
    const createdBanks = [];
    for (const userId of user_ids) {
      const [result]: any = await pool.execute(
        `INSERT INTO time_off_banks
         (user_id, program_name, description, total_entitled_days, used_days, valid_from, valid_to, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
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
      const [bankRow]: any = await pool.execute(
        `SELECT tob.*, u.full_name as user_name, cbr.full_name as created_by_name
         FROM time_off_banks tob
         LEFT JOIN users u ON tob.user_id = u.id
         LEFT JOIN users cbr ON tob.created_by = cbr.id
         WHERE tob.id = ?`,
        [bankId]
      );

      createdBanks.push(bankRow[0]);
    }

    return res.status(201).json({
      success: true,
      message: `${createdBanks.length} time off banks created successfully`,
      data: {
        timeOffBanks: createdBanks
      }
    });
  } catch (error) {
    console.error('Error assigning time off banks:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while assigning time off banks'
    });
  }
});

export default router;