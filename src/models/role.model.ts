import { pool } from '../config/database';
import { CacheService } from '../services/cache.service';

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: string[]; // JSON field as string array
  created_at: Date;
  updated_at: Date;
}

export interface RoleInput {
  name: string;
  description?: string;
  permissions: string[];
}

export interface RoleUpdate {
  name?: string;
  description?: string;
  permissions?: string[];
}

class RoleModel {
  static tableName = 'roles';

  static async findAll(): Promise<Role[]> {
    const [rows] = await pool.execute(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
    return rows as Role[];
  }

  static async findById(id: number): Promise<Role | null> {
    const cacheKey = `role:${id}`;
    
    // Try cache first
    let role = await CacheService.get<Role>(cacheKey);
    if (role) return role;

    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    role = (rows as Role[])[0] || null;

    if (role) {
      await CacheService.set(cacheKey, role, 3600); // Cache for 1 hour
    }

    return role;
  }

  static async findByName(name: string): Promise<Role | null> {
    const cacheKey = `role:name:${name}`;
    
    // Try cache first
    let role = await CacheService.get<Role>(cacheKey);
    if (role) return role;

    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE name = ?`,
      [name]
    );
    role = (rows as Role[])[0] || null;

    if (role) {
      await CacheService.set(cacheKey, role, 3600);
    }

    return role;
  }

  static async create(roleData: RoleInput): Promise<Role> {
    const [result]: any = await pool.execute(
      `INSERT INTO ${this.tableName} (name, description, permissions)
       VALUES (?, ?, ?)`,
      [
        roleData.name,
        roleData.description,
        JSON.stringify(roleData.permissions)
      ]
    );

    const insertedId = result.insertId;
    const createdItem = await this.findById(insertedId);

    if (!createdItem) {
      throw new Error('Failed to create role');
    }

    return createdItem;
  }

  static async update(id: number, roleData: RoleUpdate): Promise<Role | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (roleData.name !== undefined) {
      updates.push('name = ?');
      values.push(roleData.name);
    }

    if (roleData.description !== undefined) {
      updates.push('description = ?');
      values.push(roleData.description);
    }

    if (roleData.permissions !== undefined) {
      updates.push('permissions = ?');
      values.push(JSON.stringify(roleData.permissions));
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);

    await pool.execute(
      `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Invalidate cache
    await CacheService.del(`role:${id}`);
    const currentRole = await this.findById(id);
    if (currentRole) {
      await CacheService.del(`role:name:${currentRole.name}`);
    }

    return currentRole;
  }

  static async delete(id: number): Promise<boolean> {
    const role = await this.findById(id);
    const result: any = await pool.execute(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );

    if (result.affectedRows > 0) {
      await CacheService.del(`role:${id}`);
      if (role) await CacheService.del(`role:name:${role.name}`);
    }

    return result.affectedRows > 0;
  }

  // Method to get permissions for a specific role
  static async getRolePermissions(roleId: number): Promise<string[]> {
    const role = await this.findById(roleId);
    return role ? role.permissions : [];
  }

  // Method to find all roles with filters and pagination
  static async findAllWithFilters(limit: number, offset: number, name?: string): Promise<{ roles: Role[], totalCount: number }> {
    let query = `SELECT * FROM ${this.tableName}`;
    let countQuery = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params: any[] = [];
    const countParams: any[] = [];

    // Add name filter if provided
    if (name) {
      query += ` WHERE name LIKE ?`;
      countQuery += ` WHERE name LIKE ?`;
      params.push(`%${name}%`);
      countParams.push(`%${name}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // Execute both queries in parallel
    const [rows, countResult]: [any, any] = await Promise.all([
      pool.execute(query, params),
      pool.execute(countQuery, countParams)
    ]);

    const roles = rows[0] as Role[];
    const totalCount = countResult[0][0].count;

    return { roles, totalCount };
  }
}

export default RoleModel;