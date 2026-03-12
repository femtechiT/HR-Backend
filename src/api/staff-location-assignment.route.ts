import { Router, Request, Response } from 'express';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';
import { pool } from '../config/database';

const router = Router();

// GET /api/staff-location-assignments - Get all staff location assignments
router.get('/', authenticateJWT, checkPermission('staff:read'), async (req: Request, res: Response) => {
  try {
    const { branchId, locationId } = req.query;
    
    let query = `
      SELECT 
        s.user_id,
        s.employee_id,
        u.full_name,
        u.email,
        s.branch_id,
        b.name AS branch_name,
        s.assigned_location_id,
        al.name AS location_name,
        al.location_coordinates,
        al.location_radius_meters,
        s.location_assignments,
        s.location_notes,
        s.status
      FROM staff s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN branches b ON s.branch_id = b.id
      LEFT JOIN attendance_locations al ON s.assigned_location_id = al.id
      WHERE s.status != 'terminated'
    `;
    
    const params: any[] = [];
    
    if (branchId) {
      query += ' AND s.branch_id = ?';
      params.push(branchId);
    }
    
    if (locationId) {
      query += ' AND s.assigned_location_id = ?';
      params.push(locationId);
    }
    
    query += ' ORDER BY s.created_at DESC';
    
    const [rows] = await pool.execute(query, params) as [any[], any];
    
    return res.json({
      success: true,
      message: 'Staff location assignments retrieved successfully',
      data: { assignments: rows }
    });
  } catch (error) {
    console.error('Get staff location assignments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/staff-location-assignments/:userId - Get location assignments for a specific staff
router.get('/:userId', authenticateJWT, checkPermission('staff:read'), async (req: Request, res: Response) => {
  try {
    const userIdParam = req.params.userId;
    const userId = typeof userIdParam === 'string' ? parseInt(userIdParam) : parseInt(userIdParam[0]);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    const [rows] = await pool.execute(`
      SELECT 
        s.user_id,
        s.employee_id,
        u.full_name,
        u.email,
        s.branch_id,
        b.name AS branch_name,
        s.assigned_location_id,
        al.name AS location_name,
        al.location_coordinates,
        al.location_radius_meters,
        s.location_assignments,
        s.location_notes
      FROM staff s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN branches b ON s.branch_id = b.id
      LEFT JOIN attendance_locations al ON s.assigned_location_id = al.id
      WHERE s.user_id = ?
    `, [userId]) as [any[], any];
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }
    
    return res.json({
      success: true,
      message: 'Staff location assignments retrieved successfully',
      data: { assignment: rows[0] }
    });
  } catch (error) {
    console.error('Get staff location assignment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/staff-location-assignments/:userId - Update staff location assignment
router.put('/:userId', authenticateJWT, checkPermission('staff:update'), async (req: Request, res: Response) => {
  try {
    const userIdParam = req.params.userId;
    const userId = typeof userIdParam === 'string' ? parseInt(userIdParam) : parseInt(userIdParam[0]);
    const { assigned_location_id, location_assignments, location_notes } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    // Check if staff exists
    const [staff] = await pool.execute('SELECT id FROM staff WHERE user_id = ?', [userId]) as [any[], any];
    
    if (staff.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }
    
    // Validate location exists if provided
    if (assigned_location_id) {
      const [location] = await pool.execute('SELECT id FROM attendance_locations WHERE id = ?', [assigned_location_id]) as [any[], any];
      
      if (location.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location ID'
        });
      }
    }
    
    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    
    if (assigned_location_id !== undefined) {
      updates.push('assigned_location_id = ?');
      values.push(assigned_location_id);
    }
    
    if (location_assignments !== undefined) {
      updates.push('location_assignments = ?');
      values.push(JSON.stringify(location_assignments));
    }
    
    if (location_notes !== undefined) {
      updates.push('location_notes = ?');
      values.push(location_notes);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    values.push(userId);
    
    await pool.execute(`UPDATE staff SET ${updates.join(', ')} WHERE user_id = ?`, values);
    
    // Get updated assignment
    const [updated] = await pool.execute(`
      SELECT 
        s.user_id,
        s.employee_id,
        u.full_name,
        s.assigned_location_id,
        al.name AS location_name,
        s.location_assignments,
        s.location_notes
      FROM staff s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN attendance_locations al ON s.assigned_location_id = al.id
      WHERE s.user_id = ?
    `, [userId]) as [any[], any];
    
    return res.json({
      success: true,
      message: 'Staff location assignment updated successfully',
      data: { assignment: updated[0] }
    });
  } catch (error) {
    console.error('Update staff location assignment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/staff-location-assignments/bulk-update - Bulk update staff location assignments
router.post('/bulk-update', authenticateJWT, checkPermission('staff:update'), async (req: Request, res: Response) => {
  try {
    const { assignments } = req.body;
    
    if (!assignments || !Array.isArray(assignments)) {
      return res.status(400).json({
        success: false,
        message: 'Assignments array is required'
      });
    }
    
    const results = [];
    
    for (const assignment of assignments) {
      const { user_id, assigned_location_id, location_assignments, location_notes } = assignment;
      
      if (!user_id) {
        results.push({ user_id: null, success: false, message: 'user_id is required' });
        continue;
      }
      
      try {
        const updates: string[] = [];
        const values: any[] = [];
        
        if (assigned_location_id !== undefined) {
          updates.push('assigned_location_id = ?');
          values.push(assigned_location_id);
        }
        
        if (location_assignments !== undefined) {
          updates.push('location_assignments = ?');
          values.push(JSON.stringify(location_assignments));
        }
        
        if (location_notes !== undefined) {
          updates.push('location_notes = ?');
          values.push(location_notes);
        }
        
        if (updates.length === 0) {
          results.push({ user_id, success: false, message: 'No fields to update' });
          continue;
        }
        
        values.push(user_id);
        
        await pool.execute(`UPDATE staff SET ${updates.join(', ')} WHERE user_id = ?`, values);
        results.push({ user_id, success: true, message: 'Updated successfully' });
      } catch (error: any) {
        results.push({ user_id, success: false, message: error.message });
      }
    }
    
    return res.json({
      success: true,
      message: 'Bulk update completed',
      data: { results }
    });
  } catch (error) {
    console.error('Bulk update staff location assignments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
