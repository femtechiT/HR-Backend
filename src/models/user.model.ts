import { pool } from '../config/database';
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
    roleId?: number
  ): Promise<{users: User[], totalCount: number}> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (branchId) {
      conditions.push('branch_id = ?');
      params.push(branchId);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (roleId) {
      conditions.push('role_id = ?');
      params.push(roleId);
    }

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

    const [countResult] = await pool.execute(countQuery, params.slice(0, conditions.length));
    const totalCount = (countResult as any)[0].count;

    return {
      users: rows as User[],
      totalCount
    };
  }

  static async findById(id: number): Promise<User | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return (rows as User[])[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE email = ?`,
      [email]
    );
    return (rows as User[])[0] || null;
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

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await pool.execute(
      `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const result: any = await pool.execute(
      `UPDATE ${this.tableName} SET status = 'inactive' WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }

  static async softDelete(id: number): Promise<boolean> {
    const result: any = await pool.execute(
      `UPDATE ${this.tableName} SET status = 'terminated' WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }

  static async comparePassword(inputPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(inputPassword, hashedPassword);
  }

  // Method to update password change requirement
  static async setPasswordChangeRequirement(userId: number, mustChange: boolean): Promise<User | null> {
    const result: any = await pool.execute(
      `UPDATE ${this.tableName} SET must_change_password = ? WHERE id = ?`,
      [mustChange, userId]
    );

    if (result.affectedRows > 0) {
      return this.findById(userId);
    }
    return null;
  }
}

export default UserModel;