export declare class ShiftSchedulingService {
    static getEffectiveScheduleForDate(userId: number, date: Date): Promise<{
        start_time: string | null;
        end_time: string | null;
        break_duration_minutes: number;
        schedule_type: string;
        schedule_note: string;
    } | null>;
    static calculateAttendanceMetrics(userId: number, date: Date, checkInTime: string | null, checkOutTime: string | null, gracePeriodMinutes?: number): Promise<{
        is_late: boolean | null;
        is_early_departure: boolean | null;
        actual_working_hours: number | null;
        scheduled_start_time: string | null;
        scheduled_end_time: string | null;
        scheduled_break_duration_minutes: number;
        status: 'present' | 'late' | 'early_departure' | null;
    }>;
    static updateAttendanceWithScheduleInfo(attendanceId: number, userId: number, date: Date, gracePeriodMinutes?: number): Promise<boolean>;
    static processAttendanceForDate(userId: number, date: Date): Promise<void>;
}
//# sourceMappingURL=shift-scheduling.service.d.ts.map