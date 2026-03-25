"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const leave_cleanup_worker_1 = __importDefault(require("../workers/leave-cleanup.worker"));
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.post('/trigger', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('leave:manage'), async (req, res) => {
    try {
        console.log('🧹 Leave Cleanup: Manual trigger requested by user', req.currentUser?.email);
        const result = await leave_cleanup_worker_1.default.triggerCleanup();
        console.log('🧹 Leave Cleanup: Result:', result);
        return res.json({
            success: result.success,
            message: result.message,
            data: {
                declinedCount: result.declinedCount,
                errorCount: result.errorCount
            }
        });
    }
    catch (error) {
        console.error('Trigger leave cleanup error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/status', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const [expiredLeaves] = await database_1.pool.execute(`
      SELECT COUNT(*) as count
      FROM leave_requests
      WHERE status IN ('pending', 'submitted')
      AND end_date < CURDATE()
    `);
        const [pendingLeaves] = await database_1.pool.execute(`
      SELECT COUNT(*) as count
      FROM leave_requests
      WHERE status IN ('pending', 'submitted')
    `);
        const lastRunTime = leave_cleanup_worker_1.default.getLastRunTime();
        console.log('🧹 Leave Cleanup Status:', {
            expiredPendingLeaves: expiredLeaves[0]?.count || 0,
            totalPendingLeaves: pendingLeaves[0]?.count || 0,
            workerRunning: true
        });
        return res.json({
            success: true,
            data: {
                expiredPendingLeaves: expiredLeaves[0]?.count || 0,
                totalPendingLeaves: pendingLeaves[0]?.count || 0,
                workerRunning: true,
                lastRunTime: lastRunTime,
                nextRunTime: leave_cleanup_worker_1.default.getNextRunTime()
            }
        });
    }
    catch (error) {
        console.error('Get cleanup status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=leave-cleanup.route.js.map