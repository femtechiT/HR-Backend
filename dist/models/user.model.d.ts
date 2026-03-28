export interface User {
    id: number;
    email: string;
    password_hash: string;
    full_name: string;
    phone?: string;
    role_id: number;
    branch_id?: number | null;
    status: 'active' | 'inactive' | 'terminated' | 'pending';
    must_change_password: boolean;
    profile_picture?: string;
    created_at: Date;
    updated_at: Date;
}
export interface UserInput {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role_id: number;
    branch_id?: number | null;
    must_change_password?: boolean;
    profile_picture?: string;
}
export interface UserUpdate {
    email?: string;
    password?: string;
    full_name?: string;
    phone?: string;
    role_id?: number;
    branch_id?: number | null;
    status?: 'active' | 'inactive' | 'terminated';
    must_change_password?: boolean;
    profile_picture?: string;
}
declare class UserModel {
    static tableName: string;
    static findAll(): Promise<User[]>;
    static findAllWithFilters(limit?: number, offset?: number, branchId?: number, status?: string, roleId?: number): Promise<{
        users: User[];
        totalCount: number;
    }>;
    static findById(id: number): Promise<User | null>;
    static findByEmail(email: string): Promise<User | null>;
    static create(userData: UserInput): Promise<User>;
    static update(id: number, userData: UserUpdate): Promise<User | null>;
    static delete(id: number): Promise<boolean>;
    static softDelete(id: number): Promise<boolean>;
    static comparePassword(inputPassword: string, hashedPassword: string): Promise<boolean>;
    static setPasswordChangeRequirement(userId: number, mustChange: boolean): Promise<User | null>;
}
export default UserModel;
//# sourceMappingURL=user.model.d.ts.map