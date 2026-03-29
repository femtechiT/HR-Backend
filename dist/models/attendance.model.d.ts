export interface Attendance {
    id: number;
    user_id: number;
    date: Date;
    status: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'holiday' | 'holiday-working' | 'weekend';
    check_in_time: Date | null;
    check_out_time: Date | null;
    location_coordinates: string | null;
    location_verified: boolean;
    location_address: string | null;
    notes: string | null;
    is_locked: boolean;
    locked_at: Date | null;
    created_at: Date;
    updated_at: Date;
}
export interface AttendanceInput {
    user_id: number;
    date: Date;
    status?: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'holiday' | 'holiday-working' | 'weekend';
    check_in_time?: Date | null;
    check_out_time?: Date | null;
    location_coordinates?: string | null;
    location_verified?: boolean;
    location_address?: string | null;
    notes?: string | null;
    is_locked?: boolean;
    locked_at?: Date | null;
}
export declare function locationToWKT(location: {
    longitude: number;
    latitude: number;
} | string | null): string | null;
export interface AttendanceUpdate {
    status?: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'holiday' | 'weekend';
    check_in_time?: Date | null;
    check_out_time?: Date | null;
    location_coordinates?: string | null;
    location_verified?: boolean;
    location_address?: string | null;
    notes?: string | null;
    is_locked?: boolean;
    locked_at?: Date | null;
}
declare class AttendanceModel {
    static tableName: string;
    static findAll(): Promise<Attendance[]>;
    static findById(id: number): Promise<Attendance | null>;
    static findByUserId(userId: number): Promise<Attendance[]>;
    static findByUserIdAndDate(userId: number, date: Date): Promise<Attendance | null>;
    static findByDate(date: Date): Promise<Attendance[]>;
    static create(attendanceData: AttendanceInput): Promise<Attendance>;
    static update(id: number, attendanceData: AttendanceUpdate): Promise<Attendance | null>;
    static delete(id: number): Promise<boolean>;
    static hasMarkedAttendance(userId: number, date: Date): Promise<boolean>;
    static findByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Attendance[]>;
    static getAttendancePercentage(userId: number, startDate: Date, endDate: Date): Promise<number>;
    static getAttendanceSummary(userId: number, startDate: Date, endDate: Date): Promise<{
        total_days: number;
        present_days: number;
        absent_days: number;
        late_days: number;
        half_day_days: number;
    }>;
}
export default AttendanceModel;
//# sourceMappingURL=attendance.model.d.ts.map