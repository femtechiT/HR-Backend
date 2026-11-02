"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceSelfHealWorker = void 0;
const shift_scheduling_service_1 = require("../services/shift-scheduling.service");
class AttendanceSelfHealWorker {
    static isRunning = false;
    static LOOKBACK_DAYS = 14;
    static async run() {
        if (this.isRunning) {
            console.log('[Attendance Self-Heal] Already running, skipping this cycle');
            return;
        }
        this.isRunning = true;
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - this.LOOKBACK_DAYS);
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];
            console.log(`[Attendance Self-Heal] Re-syncing attendance status for ${startStr}..${endStr}`);
            const absenceCorrections = await shift_scheduling_service_1.ShiftSchedulingService.bulkCorrectPastAbsences(startStr, endStr, false);
            const lateCorrections = await shift_scheduling_service_1.ShiftSchedulingService.bulkCorrectLateOnNonWorkingDays(startStr, endStr, false);
            if (absenceCorrections.corrected > 0) {
                console.log(`[Attendance Self-Heal] Corrected ${absenceCorrections.corrected} absent/weekend/off/present/late placeholder(s)`, absenceCorrections.changes.slice(0, 20));
            }
            if (lateCorrections.corrected > 0) {
                console.log(`[Attendance Self-Heal] Corrected ${lateCorrections.corrected} present/late/early-departure record(s) on non-working days`, lateCorrections.changes.slice(0, 20));
            }
            if (absenceCorrections.corrected === 0 && lateCorrections.corrected === 0) {
                console.log('[Attendance Self-Heal] Nothing to correct');
            }
        }
        catch (error) {
            console.error('[Attendance Self-Heal] Error:', error);
        }
        finally {
            this.isRunning = false;
        }
    }
    static start() {
        console.log('[Attendance Self-Heal] Starting worker...');
        this.run().catch(error => {
            console.error('[Attendance Self-Heal] Error on startup run:', error);
        });
        setInterval(() => {
            this.run().catch(error => {
                console.error('[Attendance Self-Heal] Error:', error);
            });
        }, 24 * 60 * 60 * 1000);
    }
}
exports.AttendanceSelfHealWorker = AttendanceSelfHealWorker;
//# sourceMappingURL=attendance-self-heal.worker.js.map