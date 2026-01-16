import { pool } from '../config/database';

export interface RolePermission {
  id: number;
  role_id: number;
  permission: string;
  allow_deny: 'allow' | 'deny';
  created_at: Date;
}

export interface RolePermissionInput {
  role_id: number;
  permission: string;
  allow_deny?: 'allow' | 'deny';
}

class RolePermissionModel {
  static tableName = 'roles_permissions';

  static async findAll(): Promise<RolePermission[]> {
    const [rows] = await pool.execute(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
    return rows as RolePermission[];
  }

  static async findById(id: number): Promise<RolePermission | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return (rows as RolePermission[])[0] || null;
  }

  static async findByRoleId(roleId: number): Promise<RolePermission[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE role_id = ?`,
      [roleId]
    );
    return rows as RolePermission[];
  }

  static async findByRoleAndPermission(roleId: number, permission: string): Promise<RolePermission | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE role_id = ? AND permission = ?`,
      [roleId, permission]
    );
    return (rows as RolePermission[])[0] || null;
  }

  static async create(permissionData: RolePermissionInput): Promise<RolePermission> {
    const [result]: any = await pool.execute(
      `INSERT INTO ${this.tableName} (role_id, permission, allow_deny)
       VALUES (?, ?, ?)`,
      [
        permissionData.role_id,
        permissionData.permission,
        permissionData.allow_deny || 'allow'
      ]
    );

    const insertedId = result.insertId;
    const createdItem = await this.findById(insertedId);

    if (!createdItem) {
      throw new Error('Failed to create role permission');
    }

    return createdItem;
  }

  static async delete(id: number): Promise<boolean> {
    const result: any = await pool.execute(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }

  static async deleteRolePermission(roleId: number, permission: string): Promise<boolean> {
    const result: any = await pool.execute(
      `DELETE FROM ${this.tableName} WHERE role_id = ? AND permission = ?`,
      [roleId, permission]
    );

    return result.affectedRows > 0;
  }

  // Method to delete multiple permissions for a role
  static async deleteMultipleRolePermissions(roleId: number, permissions: string[]): Promise<boolean> {
    if (permissions.length === 0) {
      return true; // Nothing to delete
    }

    const placeholders = permissions.map(() => '?').join(',');
    const query = `DELETE FROM ${this.tableName} WHERE role_id = ? AND permission IN (${placeholders})`;
    const values = [roleId, ...permissions];

    const result: any = await pool.execute(query, values);

    return result.affectedRows >= 0; // Return true if query executed successfully
  }

  // Method to get all permissions for a specific role
  static async getRolePermissions(roleId: number): Promise<RolePermission[]> {
    return await this.findByRoleId(roleId);
  }

  // Method to check if a role has a specific permission
  static async hasPermission(roleId: number, permission: string): Promise<boolean> {
    const rolePerm = await this.findByRoleAndPermission(roleId, permission);
    return rolePerm ? rolePerm.allow_deny === 'allow' : false;
  }
}

export default RolePermissionModel;