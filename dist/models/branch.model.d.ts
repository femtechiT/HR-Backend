export interface Branch {
    id: number;
    name: string;
    code: string;
    address: string;
    city: string;
    state: string;
    country: string;
    phone: string;
    email: string;
    manager_user_id: number | null;
    location_coordinates: string | null;
    location_radius_meters: number | null;
    attendance_mode: 'branch_based' | 'multiple_locations' | null;
    status: 'active' | 'inactive';
    auto_mark_absent_enabled: boolean;
    auto_mark_absent_time: string;
    auto_mark_absent_timezone: string;
    attendance_lock_date: string | null;
    created_at: Date;
    updated_at: Date;
}
export interface BranchInput {
    name: string;
    code: string;
    address: string;
    city: string;
    state: string;
    country: string;
    phone: string;
    email: string;
    manager_user_id?: number | null;
    location_coordinates?: string | null;
    location_radius_meters?: number;
    attendance_mode?: 'branch_based' | 'multiple_locations';
}
export interface BranchUpdate {
    name?: string;
    code?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    email?: string;
    manager_user_id?: number | null;
    location_coordinates?: string | null;
    location_radius_meters?: number;
    attendance_mode?: 'branch_based' | 'multiple_locations';
    status?: 'active' | 'inactive';
    auto_mark_absent_enabled?: boolean;
    auto_mark_absent_time?: string;
    auto_mark_absent_timezone?: string;
    attendance_lock_date?: string | null;
}
declare class BranchModel {
    static tableName: string;
    static findAll(): Promise<Branch[]>;
    static findById(id: number): Promise<Branch | null>;
    static findByCode(code: string): Promise<Branch | null>;
    static create(branchData: BranchInput): Promise<Branch>;
    static update(id: number, branchData: BranchUpdate): Promise<Branch | null>;
    static delete(id: number): Promise<boolean>;
    static findActive(): Promise<Branch[]>;
    static isWithinBranchLocation(branchId: number, lat: number, lng: number): Promise<boolean>;
    static findNearbyBranches(lat: number, lng: number, maxDistanceMeters?: number): Promise<(Branch & {
        distance_meters: number;
    })[]>;
}
export default BranchModel;
//# sourceMappingURL=branch.model.d.ts.map