"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class LeaveCleanupWorker {
    static isRunning = false;
    static intervalId = null;
    static lastRunTime = null;
    static nextRunTime = null;
    static totalProcessed = 0;
    static totalDeclined = 0;
    static totalErrors = 0;
    static start() {
        console.log('🕐 Leave Cleanup Worker: Starting...');
        const now = new Date();
        const nextRun = new Date(now);
        nextRun.setHours(2, 0, 0, 0);
        if (now > nextRun) {
            nextRun.setDate(nextRun.getDate() + 1);
        }
        const msUntilNextRun = nextRun.getTime() - now.getTime();
        this.nextRunTime = nextRun;
        console.log(`🕐 Leave Cleanup Worker: First run scheduled for ${nextRun.toISOString()}`);
        console.log(`🕐 Leave Cleanup Worker: Will run in ${Math.round(msUntilNextRun / 1000 / 60)} minutes`);
        setTimeout(() => {
            this.runCleanup();
            this.intervalId = setInterval(() => {
                this.runCleanup();
            }, 24 * 60 * 60 * 1000);
        }, msUntilNextRun);
    }
    static stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('🕐 Leave Cleanup Worker: Stopped');
        }
    }
    static getLastRunTime() {
        return this.lastRunTime;
    }
    static getNextRunTime() {
        return this.nextRunTime;
    }
    static getStats() {
        return {
            totalProcessed: this.totalProcessed,
            totalDeclined: this.totalDeclined,
            totalErrors: this.totalErrors
        };
    }
    static async runCleanup() {
        if (this.isRunning) {
            console.log('🕐 Leave Cleanup Worker: Already running, skipping...');
            return;
        }
        this.isRunning = true;
        const startTime = Date.now();
        this.lastRunTime = new Date();
        try {
            console.log('🕐 Leave Cleanup Worker: Starting cleanup process...');
            const [pendingLeaves] = await database_1.pool.execute(`
        SELECT id, user_id, start_date, end_date, status
        FROM leave_requests
        WHERE status IN ('pending', 'submitted')
        ORDER BY start_date ASC
      `);
            if (pendingLeaves.length === 0) {
                console.log('🕐 Leave Cleanup Worker: No pending leave requests to process');
                this.totalProcessed = 0;
                this.totalDeclined = 0;
                this.totalErrors = 0;
                return;
            }
            console.log(`🕐 Leave Cleanup Worker: Found ${pendingLeaves.length} pending leave requests`);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let declinedCount = 0;
            let errorCount = 0;
            for (const leave of pendingLeaves) {
                try {
                    const leaveEndDate = new Date(leave.end_date);
                    leaveEndDate.setHours(0, 0, 0, 0);
                    if (leaveEndDate < today) {
                        await database_1.pool.execute(`
              UPDATE leave_requests
              SET
                status = 'rejected',
                notes = 'Automatically declined: Leave dates have passed',
                reviewed_by = NULL,
                reviewed_at = NOW()
              WHERE id = ?
            `, [leave.id]);
                        declinedCount++;
                        console.log(`✓ Leave #${leave.id} declined (ended ${leave.end_date})`);
                    }
                }
                catch (error) {
                    errorCount++;
                    console.error(`✗ Error processing leave #${leave.id}:`, error);
                }
            }
            const duration = Date.now() - startTime;
            this.totalProcessed = pendingLeaves.length;
            this.totalDeclined = declinedCount;
            this.totalErrors = errorCount;
            console.log(`🕐 Leave Cleanup Worker: Completed in ${duration}ms`);
            console.log(`  - Total processed: ${pendingLeaves.length}`);
            console.log(`  - Declined: ${declinedCount}`);
            console.log(`  - Errors: ${errorCount}`);
        }
        catch (error) {
            console.error('🕐 Leave Cleanup Worker: Error during cleanup:', error);
            this.totalErrors++;
        }
        finally {
            this.isRunning = false;
        }
    }
    static async triggerCleanup() {
        if (this.isRunning) {
            return {
                success: false,
                message: 'Cleanup already running',
                declinedCount: 0,
                errorCount: 0
            };
        }
        const startTime = Date.now();
        this.isRunning = true;
        this.lastRunTime = new Date();
        try {
            const [pendingLeaves] = await database_1.pool.execute(`
        SELECT id, user_id, start_date, end_date, status
        FROM leave_requests
        WHERE status IN ('pending', 'submitted')
        ORDER BY start_date ASC
      `);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let declinedCount = 0;
            let errorCount = 0;
            for (const leave of pendingLeaves) {
                try {
                    const leaveEndDate = new Date(leave.end_date);
                    leaveEndDate.setHours(0, 0, 0, 0);
                    if (leaveEndDate < today) {
                        await database_1.pool.execute(`
              UPDATE leave_requests
              SET
                status = 'rejected',
                notes = 'Automatically declined: Leave dates have passed',
                reviewed_by = NULL,
                reviewed_at = NOW()
              WHERE id = ?
            `, [leave.id]);
                        declinedCount++;
                    }
                }
                catch (error) {
                    errorCount++;
                }
            }
            this.totalProcessed = pendingLeaves.length;
            this.totalDeclined = declinedCount;
            this.totalErrors = errorCount;
            return {
                success: true,
                message: `Processed ${pendingLeaves.length} pending requests, declined ${declinedCount}`,
                declinedCount,
                errorCount
            };
        }
        catch (error) {
            this.totalErrors++;
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                declinedCount: 0,
                errorCount: 1
            };
        }
        finally {
            this.isRunning = false;
        }
    }
}
exports.default = LeaveCleanupWorker;
//# sourceMappingURL=leave-cleanup.worker.js.map