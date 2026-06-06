export interface ShiftException {
    id: number;
    user_id: number;
    shift_assignment_id: number | null;
    exception_date: Date;
    exception_type: 'early_release' | 'late_start' | 'day_off' | 'special_schedule' | 'holiday_work';
    original_start_time: string | null;
    original_end_time: string | null;
    new_start_time: string | null;
    new_end_time: string | null;
    new_break_duration_minutes: number;
    reason: string | null;
    approved_by: number | null;
    approved_at: Date | null;
    status: 'pending' | 'approved' | 'rejected' | 'active' | 'expired';
    created_by: number;
    created_at: Date;
    updated_at: Date;
}
export interface ShiftExceptionInput {
    user_id: number;
    shift_assignment_id?: number | null;
    exception_date: Date;
    exception_type: 'early_release' | 'late_start' | 'day_off' | 'special_schedule' | 'holiday_work';
    original_start_time?: string | null;
    original_end_time?: string | null;
    new_start_time?: string | null;
    new_end_time?: string | null;
    new_break_duration_minutes?: number;
    reason?: string | null;
    approved_by?: number | null;
    status?: 'pending' | 'approved' | 'rejected' | 'active' | 'expired';
    created_by: number;
}
export interface ShiftExceptionUpdate {
    shift_assignment_id?: number | null;
    exception_date?: Date;
    exception_type?: 'early_release' | 'late_start' | 'day_off' | 'special_schedule' | 'holiday_work';
    original_start_time?: string | null;
    original_end_time?: string | null;
    new_start_time?: string | null;
    new_end_time?: string | null;
    new_break_duration_minutes?: number;
    reason?: string | null;
    approved_by?: number | null;
    status?: 'pending' | 'approved' | 'rejected' | 'active' | 'expired';
}
declare class ShiftExceptionModel {
    static tableName: string;
    static findAll(): Promise<any[]>;
    static findById(id: number): Promise<ShiftException | null>;
    static findAllByBranch(branchId: number, userId?: number): Promise<any[]>;
    static findByDateRangeByBranch(branchId: number, startDate: Date, endDate: Date, userId?: number): Promise<any[]>;
    static findByUserId(userId: number): Promise<any[]>;
    static findByDate(userId: number, date: Date): Promise<ShiftException | null>;
    static findByDateRange(userId: number, startDate: Date, endDate: Date): Promise<any[]>;
    static create(exceptionData: ShiftExceptionInput): Promise<ShiftException>;
    static update(id: number, exceptionData: ShiftExceptionUpdate): Promise<ShiftException | null>;
    static delete(id: number): Promise<boolean>;
    static approve(id: number, approvedBy: number): Promise<ShiftException | null>;
    static reject(id: number): Promise<ShiftException | null>;
}
export default ShiftExceptionModel;
//# sourceMappingURL=shift-exception.model.d.ts.map