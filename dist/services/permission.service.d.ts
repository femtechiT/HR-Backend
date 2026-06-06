interface PermissionCheckResult {
    hasPermission: boolean;
    source: 'user' | 'role' | 'none';
    allowDeny: 'allow' | 'deny' | null;
}
declare class PermissionService {
    static hasPermission(userId: number, permission: string): Promise<PermissionCheckResult>;
    static hasPermissionAny(userId: number, permissions: string[]): Promise<PermissionCheckResult>;
    static getAllUserPermissions(userId: number): Promise<{
        permission: string;
        source: 'user' | 'role';
        allowDeny: 'allow' | 'deny';
    }[]>;
    static generatePermissionManifest(userId: number): Promise<Record<string, boolean>>;
    static invalidateUserPermissionCache(userId: number): Promise<void>;
    static invalidateAllUserPermissionCaches(): Promise<void>;
}
export default PermissionService;
//# sourceMappingURL=permission.service.d.ts.map