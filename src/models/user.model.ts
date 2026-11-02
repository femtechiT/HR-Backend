import { pool } from '../config/database';
import { CacheService } from '../services/cache.service';
import bcrypt from 'bcryptjs';

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
  // Soft delete (Migration 126) — orthogonal to `status`
  deleted_at?: Date | null;
  deleted_by?: number | null;
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

class UserModel {
  static tableName = 'users';

  static async findAll(): Promise<User[]> {
    const [rows] = await pool.execute(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
    return rows as User[];
  }

  static async findAllWithFilters(
    limit: number = 20,
    offset: number = 0,
    branchId?: number,
    status?: string,
    roleId?: number,
    search?: string
  ): Promise<{users: User[], totalCount: number}> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (branchId) {
      conditions.push('branch_id = ?');
      params.push(branchId);
    }

    // 'deleted' is a pseudo-status, not a real `status` enum value — it's
    // the one place in the system allowed to surface a soft-deleted account
    // (User Management's "Deleted" filter). Every other value, including no
    // filter at all, must exclude deleted rows so they never leak into the
    // normal Active/Inactive/Terminated/All views.
    if (status === 'deleted') {
      conditions.push('deleted_at IS NOT NULL');
    } else {
      conditions.push('deleted_at IS NULL');
      if (status) {
        conditions.push('status = ?');
        params.push(status);
      }
    }

    if (roleId) {
      conditions.push('role_id = ?');
      params.push(roleId);
    }

    if (search && search.trim()) {
      conditions.push('(full_name LIKE ? OR email LIKE ?)');
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern);
    }

    const paramsForConditions = params.length;

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);

    // Get total count with same filters
    let countQuery = `SELECT COUNT(*) as count FROM ${this.tableName}`;

    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const [countResult] = await pool.execute(countQuery, params.slice(0, paramsForConditions));
    const totalCount = (countResult as any)[0].count;

    return {
      users: rows as User[],
      totalCount
    };
  }

  static async findById(id: number): Promise<User | null> {
    const cacheKey = `user:${id}`;

    // Try to get from cache first
    let user = await CacheService.get<User>(cacheKey);
    if (user) {
      return user;
    }

    // If not in cache, fetch from database
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );

    user = (rows as User[])[0] || null;

    // Cache the user for 30 minutes if found
    if (user) {
      await CacheService.set(cacheKey, user, 1800); // 30 minutes
    }

    return user;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const cacheKey = `user:email:${email}`;

    // Try to get from cache first
    let user = await CacheService.get<User>(cacheKey);
    if (user) {
      return user;
    }

    // If not in cache, fetch from database
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE email = ?`,
      [email]
    );

    user = (rows as User[])[0] || null;

    // Cache the user for 30 minutes if found
    if (user) {
      await CacheService.set(cacheKey, user, 1800); // 30 minutes
      // Also cache by ID for consistency
      await CacheService.set(`user:${user.id}`, user, 1800);
    }

    return user;
  }

  static async create(userData: UserInput): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const [result]: any = await pool.execute(
      `INSERT INTO ${this.tableName} (email, password_hash, full_name, phone, role_id, branch_id, status, must_change_password)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
      [
        userData.email,
        hashedPassword,
        userData.full_name,
        userData.phone || null,  // Convert undefined to null
        userData.role_id,
        userData.branch_id || null,  // Convert undefined to null
        userData.must_change_password !== undefined ? userData.must_change_password : true
      ]
    );

    const insertedId = result.insertId;
    const createdItem = await this.findById(insertedId);

    if (!createdItem) {
      throw new Error('Failed to create user');
    }

    return createdItem;
  }

  static async update(id: number, userData: UserUpdate): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (userData.email !== undefined) {
      updates.push('email = ?');
      values.push(userData.email);
    }

    if (userData.password !== undefined) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      updates.push('password_hash = ?');
      values.push(hashedPassword);
    }

    if (userData.full_name !== undefined) {
      updates.push('full_name = ?');
      values.push(userData.full_name);
    }

    if (userData.phone !== undefined) {
      updates.push('phone = ?');
      values.push(userData.phone);
    }

    if (userData.role_id !== undefined) {
      updates.push('role_id = ?');
      values.push(userData.role_id);
    }

    if (userData.branch_id !== undefined) {
      updates.push('branch_id = ?');
      values.push(userData.branch_id);
    }

    if (userData.status !== undefined) {
      updates.push('status = ?');
      values.push(userData.status);
    }

    if (userData.profile_picture !== undefined) {
      updates.push('profile_picture = ?');
      values.push(userData.profile_picture);
    }

    if (userData.must_change_password !== undefined) {
      updates.push('must_change_password = ?');
      values.push(userData.must_change_password ? 1 : 0);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await pool.execute(
      `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Invalidate cache for this user
    await CacheService.del(`user:${id}`);
    if (userData.email) {
      await CacheService.del(`user:email:${userData.email}`);
    }

    return this.findById(id);
  }

  static async delete(id: number, connection?: any): Promise<boolean> {
    const db = connection || pool;
    // Fetch current user data to know email for cache invalidation
    const user = await this.findById(id);
    const result: any = await db.execute(
      `UPDATE ${this.tableName} SET status = 'inactive' WHERE id = ?`,
      [id]
    );

    if (result.affectedRows > 0) {
      await CacheService.del(`user:${id}`);
      if (user?.email) {
        await CacheService.del(`user:email:${user.email}`);
      }
    }

    return result.affectedRows > 0;
  }

  static async reactivate(id: number, connection?: any): Promise<boolean> {
    const db = connection || pool;
    const user = await this.findById(id);
    const result: any = await db.execute(
      `UPDATE ${this.tableName} SET status = 'active' WHERE id = ?`,
      [id]
    );

    if (result.affectedRows > 0) {
      await CacheService.del(`user:${id}`);
      if (user?.email) {
        await CacheService.del(`user:email:${user.email}`);
      }
    }

    return result.affectedRows > 0;
  }

  static async softDelete(id: number, connection?: any): Promise<boolean> {
    const db = connection || pool;
    // Fetch current user data to know email for cache invalidation
    const user = await this.findById(id);
    const result: any = await db.execute(
      `UPDATE ${this.tableName} SET status = 'terminated' WHERE id = ?`,
      [id]
    );

    if (result.affectedRows > 0) {
      await CacheService.del(`user:${id}`);
      if (user?.email) {
        await CacheService.del(`user:email:${user.email}`);
      }
    }

    return result.affectedRows > 0;
  }

  // Real soft-delete (Migration 126) — distinct from delete()/softDelete()
  // above, which (despite the name) only flip `status` to inactive/terminated
  // and never hid the row from findAllWithFilters. This is the one that
  // actually hides the account everywhere except User Management's "Deleted"
  // filter, while keeping the row for history. Forcing status to 'inactive'
  // means the existing login gate (`status !== 'active'`) also blocks the
  // account automatically — no auth code changes needed.
  static async markAsDeleted(id: number, deletedBy: number, connection?: any): Promise<boolean> {
    const db = connection || pool;
    const user = await this.findById(id);
    const result: any = await db.execute(
      `UPDATE ${this.tableName}
       SET deleted_at = NOW(), deleted_by = ?, status = IF(status = 'active', 'inactive', status)
       WHERE id = ?`,
      [deletedBy, id]
    );

    if (result.affectedRows > 0) {
      await CacheService.del(`user:${id}`);
      if (user?.email) {
        await CacheService.del(`user:email:${user.email}`);
      }
    }

    return result.affectedRows > 0;
  }

  // Undo markAsDeleted. Leaves `status` as-is — restoring visibility isn't
  // the same as reactivating employment, those stay separate admin actions.
  static async restore(id: number, connection?: any): Promise<boolean> {
    const db = connection || pool;
    const user = await this.findById(id);
    const result: any = await db.execute(
      `UPDATE ${this.tableName} SET deleted_at = NULL, deleted_by = NULL WHERE id = ?`,
      [id]
    );

    if (result.affectedRows > 0) {
      await CacheService.del(`user:${id}`);
      if (user?.email) {
        await CacheService.del(`user:email:${user.email}`);
      }
    }

    return result.affectedRows > 0;
  }

  static async comparePassword(inputPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(inputPassword, hashedPassword);
  }

  // Method to update password change requirement
  static async setPasswordChangeRequirement(userId: number, mustChange: boolean): Promise<User | null> {
    // Invalidate cache before/after to avoid stale reads
    await CacheService.del(`user:${userId}`);
    const result: any = await pool.execute(
      `UPDATE ${this.tableName} SET must_change_password = ? WHERE id = ?`,
      [mustChange, userId]
    );

    if (result.affectedRows > 0) {
      await CacheService.del(`user:${userId}`);
      return this.findById(userId);
    }
    return null;
  }
}

export default UserModel;
