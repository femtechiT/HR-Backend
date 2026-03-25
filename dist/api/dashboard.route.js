"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.get('/stats', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const [staffCount] = await database_1.pool.execute('SELECT COUNT(*) as total, SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active FROM staff');
        const today = new Date().toISOString().split('T')[0];
        const [todayAttendance] = await database_1.pool.execute(`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) as present_count,
        ROUND((SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as attendance_rate
      FROM attendance 
      WHERE DATE(date) = ?
    `, [today]);
        const [pendingLeaves] = await database_1.pool.execute(`
      SELECT COUNT(*) as pending_count 
      FROM leave_requests 
      WHERE status = 'pending' OR status = 'submitted'
    `);
        const [departments] = await database_1.pool.execute(`
      SELECT department, COUNT(*) as count 
      FROM staff 
      WHERE department IS NOT NULL AND department != ''
      GROUP BY department 
      ORDER BY count DESC
    `);
        const [recentLeaves] = await database_1.pool.execute(`
      SELECT lr.*, u.full_name, lt.name as leave_type_name
      FROM leave_requests lr
      LEFT JOIN users u ON lr.user_id = u.id
      LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
      ORDER BY lr.created_at DESC 
      LIMIT 5
    `);
        return res.json({
            success: true,
            message: 'Dashboard statistics retrieved successfully',
            data: {
                totalEmployees: staffCount[0]?.total || 0,
                activeEmployees: staffCount[0]?.active || 0,
                attendanceRate: todayAttendance[0]?.attendance_rate || 0,
                pendingLeaves: pendingLeaves[0]?.pending_count || 0,
                departments: departments || [],
                recentLeaves: recentLeaves || []
            }
        });
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.route.js.map