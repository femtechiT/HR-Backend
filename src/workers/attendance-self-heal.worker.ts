import { ShiftSchedulingService } from '../services/shift-scheduling.service';

/**
 * Attendance Self-Heal Worker
 *
 * The nightly/branch auto-mark worker (attendance-processor.worker.ts) creates
 * an attendance row (status 'absent'/'weekend'/'off') for every active staff
 * member who hasn't checked in. Every endpoint that approves a leave request,
 * floating day, or shift exception already calls
 * ShiftSchedulingService.processAttendanceForDate() synchronously to fix that
 * row the moment the approval happens — but that only covers the single date
 * the approver acted on, and only if that call site is actually hit.
 *
 * This worker is the safety net: on a fixed interval it re-derives status for
 * every attendance row in a rolling recent window that has no real check-in,
 * using today's effective-schedule rules. Anything an approval missed (wrong
 * endpoint, failed call, multi-day request where one date slipped through)
 * gets corrected on the next run instead of staying wrong indefinitely.
 *
 * Both underlying corrections are deliberately narrow: they only ever touch
 * rows with no real check-in time, so a genuine clock-in is never altered.
 */
export class AttendanceSelfHealWorker {
  private static isRunning = false;

  // Approvals can land days after the date they cover (e.g. a leave request
  // approved a week late). Two weeks back comfortably covers normal approval
  // turnaround without scanning the entire attendance history on every run.
  private static readonly LOOKBACK_DAYS = 14;

  static async run(): Promise<void> {
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

      const absenceCorrections = await ShiftSchedulingService.bulkCorrectPastAbsences(startStr, endStr, false);
      const lateCorrections = await ShiftSchedulingService.bulkCorrectLateOnNonWorkingDays(startStr, endStr, false);

      if (absenceCorrections.corrected > 0) {
        console.log(
          `[Attendance Self-Heal] Corrected ${absenceCorrections.corrected} absent/weekend/off/present/late placeholder(s)`,
          absenceCorrections.changes.slice(0, 20)
        );
      }
      if (lateCorrections.corrected > 0) {
        console.log(
          `[Attendance Self-Heal] Corrected ${lateCorrections.corrected} present/late/early-departure record(s) on non-working days`,
          lateCorrections.changes.slice(0, 20)
        );
      }
      if (absenceCorrections.corrected === 0 && lateCorrections.corrected === 0) {
        console.log('[Attendance Self-Heal] Nothing to correct');
      }
    } catch (error) {
      console.error('[Attendance Self-Heal] Error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Runs immediately on startup (so a restart catches anything missed while
   * the server was down), then once every 24 hours — same cadence as the
   * nightly auto-mark worker, just offset to run independently.
   */
  static start(): void {
    console.log('[Attendance Self-Heal] Starting worker...');

    this.run().catch(error => {
      console.error('[Attendance Self-Heal] Error on startup run:', error);
    });

    setInterval(() => {
      this.run().catch(error => {
        console.error('[Attendance Self-Heal] Error:', error);
      });
    }, 24 * 60 * 60 * 1000); // every 24 hours
  }
}
