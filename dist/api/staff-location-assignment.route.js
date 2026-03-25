"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff:read'), async (req, res) => {
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
        const params = [];
        if (branchId) {
            query += ' AND s.branch_id = ?';
            params.push(branchId);
        }
        if (locationId) {
            query += ' AND s.assigned_location_id = ?';
            params.push(locationId);
        }
        query += ' ORDER BY s.created_at DESC';
        const [rows] = await database_1.pool.execute(query, params);
        return res.json({
            success: true,
            message: 'Staff location assignments retrieved successfully',
            data: { assignments: rows }
        });
    }
    catch (error) {
        console.error('Get staff location assignments error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/:userId', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff:read'), async (req, res) => {
    try {
        const userIdParam = req.params.userId;
        const userId = typeof userIdParam === 'string' ? parseInt(userIdParam) : parseInt(userIdParam[0]);
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        const [rows] = await database_1.pool.execute(`
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
    `, [userId]);
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
    }
    catch (error) {
        console.error('Get staff location assignment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.put('/:userId', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff:update'), async (req, res) => {
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
        const [staff] = await database_1.pool.execute('SELECT id FROM staff WHERE user_id = ?', [userId]);
        if (staff.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }
        if (assigned_location_id) {
            const [location] = await database_1.pool.execute('SELECT id FROM attendance_locations WHERE id = ?', [assigned_location_id]);
            if (location.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid location ID'
                });
            }
        }
        const updates = [];
        const values = [];
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
        await database_1.pool.execute(`UPDATE staff SET ${updates.join(', ')} WHERE user_id = ?`, values);
        const [updated] = await database_1.pool.execute(`
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
    `, [userId]);
        return res.json({
            success: true,
            message: 'Staff location assignment updated successfully',
            data: { assignment: updated[0] }
        });
    }
    catch (error) {
        console.error('Update staff location assignment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/bulk-update', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff:update'), async (req, res) => {
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
                const updates = [];
                const values = [];
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
                await database_1.pool.execute(`UPDATE staff SET ${updates.join(', ')} WHERE user_id = ?`, values);
                results.push({ user_id, success: true, message: 'Updated successfully' });
            }
            catch (error) {
                results.push({ user_id, success: false, message: error.message });
            }
        }
        return res.json({
            success: true,
            message: 'Bulk update completed',
            data: { results }
        });
    }
    catch (error) {
        console.error('Bulk update staff location assignments error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=staff-location-assignment.route.js.map