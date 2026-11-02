export interface LeaveType {
    id: number;
    name: string;
    days_per_year: number;
    is_paid: boolean;
    allow_carryover: boolean;
    carryover_limit: number;
    expiry_rule_id: number | null;
    created_by: number | null;
    is_active: boolean;
    bypasses_leave_cap: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface LeaveTypeInput {
    name: string;
    days_per_year: number;
    is_paid: boolean;
    allow_carryover: boolean;
    carryover_limit: number;
    expiry_rule_id?: number | null;
    created_by?: number | null;
    is_active?: boolean;
    bypasses_leave_cap?: boolean;
}
export interface LeaveTypeUpdate {
    name?: string;
    days_per_year?: number;
    is_paid?: boolean;
    allow_carryover?: boolean;
    carryover_limit?: number;
    expiry_rule_id?: number | null;
    is_active?: boolean;
    bypasses_leave_cap?: boolean;
}
declare class LeaveTypeModel {
    static tableName: string;
    static findAll(): Promise<LeaveType[]>;
    static findById(id: number): Promise<LeaveType | null>;
    static findByName(name: string): Promise<LeaveType | null>;
    static create(leaveTypeData: LeaveTypeInput): Promise<LeaveType>;
    static update(id: number, leaveTypeData: LeaveTypeUpdate): Promise<LeaveType | null>;
    static delete(id: number): Promise<boolean>;
    static activate(id: number): Promise<boolean>;
    static deactivate(id: number): Promise<boolean>;
}
export default LeaveTypeModel;
//# sourceMappingURL=leave-type.model.d.ts.map