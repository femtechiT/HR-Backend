import { pool } from '../config/database';

export interface RolePermission {
  id?: number;
  role_id: number;
  permission: string; // e.g., "appraisal_template.create"
  granted_by: number;
  granted_at: Date;
  created_at?: Date;
  updated_at?: Date;
}

export const RolePermissionModel = {
  tableName: 'role_permissions',

  async findAll(): Promise<RolePermission[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} ORDER BY granted_at DESC`
    );
    connection.release();
    return rows as RolePermission[];
  },

  async findById(id: number): Promise<RolePermission | null> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    connection.release();
    return (rows as RolePermission[])[0] || null;
  },

  async findByRoleId(roleId: number): Promise<RolePermission[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE role_id = ? ORDER BY granted_at DESC`,
      [roleId]
    );
    connection.release();
    return rows as RolePermission[];
  },

  async findByPermission(permission: string): Promise<RolePermission[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE permission = ? ORDER BY granted_at DESC`,
      [permission]
    );
    connection.release();
    return rows as RolePermission[];
  },

  async create(rolePermission: Omit<RolePermission, 'id' | 'granted_at' | 'created_at' | 'updated_at'>): Promise<RolePermission> {
    const connection = await pool.getConnection();
    const [result]: any = await connection.execute(
      `INSERT INTO ${this.tableName}
       (role_id, permission, granted_by, granted_at, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW(), NOW())`,
      [
        rolePermission.role_id,
        rolePermission.permission,
        rolePermission.granted_by
      ]
    );
    connection.release();

    return {
      id: result.insertId,
      ...rolePermission,
      granted_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };
  },

  async update(id: number, rolePermission: Partial<Omit<RolePermission, 'id' | 'granted_at' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    const connection = await pool.getConnection();

    // Build dynamic query based on provided fields
    const fields = [];
    const values = [];

    if (rolePermission.role_id !== undefined) {
      fields.push('role_id = ?');
      values.push(rolePermission.role_id);
    }
    if (rolePermission.permission !== undefined) {
      fields.push('permission = ?');
      values.push(rolePermission.permission);
    }
    if (rolePermission.granted_by !== undefined) {
      fields.push('granted_by = ?');
      values.push(rolePermission.granted_by);
    }

    fields.push('updated_at = NOW()');

    if (fields.length === 0) {
      return false;
    }

    values.push(id);

    const [result]: any = await connection.execute(
      `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    connection.release();

    return result.affectedRows > 0;
  },

  async delete(id: number): Promise<boolean> {
    const connection = await pool.getConnection();
    const [result]: any = await connection.execute(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    connection.release();
    return result.affectedRows > 0;
  }
};