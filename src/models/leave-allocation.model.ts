import { Pool } from 'mysql2/promise';
import { pool } from '../config/database';
import { CacheService } from '../services/cache.service';

export interface LeaveAllocation {
  id: number;
  user_id: number;
  leave_type_id: number;
  cycle_start_date: Date;
  cycle_end_date: Date;
  allocated_days: number;
  used_days: number;
  carried_over_days: number;
  created_at: Date;
  updated_at: Date;
}

export interface LeaveAllocationInput {
  user_id: number;
  leave_type_id: number;
  cycle_start_date: Date;
  cycle_end_date: Date;
  allocated_days: number;
  used_days?: number;
  carried_over_days?: number;
}

export interface LeaveAllocationUpdate {
  allocated_days?: number;
  used_days?: number;
  carried_over_days?: number;
  cycle_start_date?: Date;
  cycle_end_date?: Date;
}

class LeaveAllocationModel {
  static tableName = 'leave_allocations';

  static async findAll(): Promise<LeaveAllocation[]> {
    const [rows] = await pool.execute(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
    return rows as LeaveAllocation[];
  }

  static async findById(id: number, connection?: any): Promise<LeaveAllocation | null> {
    const db = connection || pool;
    const [rows] = await db.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return (rows as LeaveAllocation[])[0] || null;
  }

  static async findByUserId(userId: number): Promise<LeaveAllocation[]> {
    const cacheKey = `leave_allocations:user:${userId}`;

    // Try to get from cache first
    const cachedAllocations = await CacheService.get<LeaveAllocation[]>(cacheKey);
    if (cachedAllocations) {
      return cachedAllocations;
    }

    // If not in cache, fetch from database
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY cycle_start_date DESC`,
      [userId]
    );

    const allocations = rows as LeaveAllocation[];

    // Cache the allocations for 1 hour
    await CacheService.set(cacheKey, allocations, 3600);

    return allocations;
  }

  static async findByUserIdAndTypeId(userId: number, leaveTypeId: number, connection?: any): Promise<LeaveAllocation[]> {
    const db = connection || pool;
    const cacheKey = `leave_allocations:user:${userId}:type:${leaveTypeId}`;

    // Try to get from cache first (only if no connection provided)
    if (!connection) {
      const cachedAllocations = await CacheService.get<LeaveAllocation[]>(cacheKey);
      if (cachedAllocations) {
        return cachedAllocations;
      }
    }

    // If not in cache, fetch from database
    const [rows] = await db.execute(
      `SELECT * FROM ${this.tableName} WHERE user_id = ? AND leave_type_id = ? ORDER BY cycle_start_date DESC`,
      [userId, leaveTypeId]
    );

    const allocations = rows as LeaveAllocation[];

    // Cache the allocations for 1 hour (only if no connection provided)
    if (!connection) {
      await CacheService.set(cacheKey, allocations, 3600);
    }

    return allocations;
  }

  static async findByCycleDates(startDate: Date, endDate: Date): Promise<LeaveAllocation[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE cycle_start_date >= ? AND cycle_end_date <= ?`,
      [startDate, endDate]
    );
    return rows as LeaveAllocation[];
  }

  static async create(allocationData: LeaveAllocationInput, connection?: any): Promise<LeaveAllocation> {
    const db = connection || pool;
    const [result]: any = await db.execute(
      `INSERT INTO ${this.tableName} (user_id, leave_type_id, cycle_start_date, cycle_end_date, allocated_days, used_days, carried_over_days)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        allocationData.user_id,
        allocationData.leave_type_id,
        allocationData.cycle_start_date,
        allocationData.cycle_end_date,
        allocationData.allocated_days,
        allocationData.used_days || 0,
        allocationData.carried_over_days || 0
      ]
    );

    const insertedId = result.insertId;
    const createdItem = await this.findById(insertedId, connection);

    if (!createdItem) {
      throw new Error('Failed to create leave allocation');
    }

    // Invalidate cache for this user's allocations (only if no connection provided)
    if (!connection) {
      await CacheService.del(`leave_allocations:user:${allocationData.user_id}`);
      await CacheService.del(`leave_allocations:user:${allocationData.user_id}:type:${allocationData.leave_type_id}`);
    }

    return createdItem;
  }

  static async update(id: number, allocationData: LeaveAllocationUpdate, connection?: any): Promise<LeaveAllocation | null> {
    const db = connection || pool;
    
    // First get the existing allocation to know which user and type to invalidate
    const existingAllocation = await this.findById(id, connection);
    if (!existingAllocation) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (allocationData.allocated_days !== undefined) {
      updates.push('allocated_days = ?');
      values.push(allocationData.allocated_days);
    }

    if (allocationData.used_days !== undefined) {
      updates.push('used_days = ?');
      values.push(allocationData.used_days);
    }

    if (allocationData.carried_over_days !== undefined) {
      updates.push('carried_over_days = ?');
      values.push(allocationData.carried_over_days);
    }

    if (allocationData.cycle_start_date !== undefined) {
      updates.push('cycle_start_date = ?');
      values.push(allocationData.cycle_start_date);
    }

    if (allocationData.cycle_end_date !== undefined) {
      updates.push('cycle_end_date = ?');
      values.push(allocationData.cycle_end_date);
    }

    if (updates.length === 0) {
      return await this.findById(id, connection);
    }

    values.push(id);

    await db.execute(
      `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Invalidate cache for this user's allocations (only if no connection provided)
    if (!connection) {
      await CacheService.del(`leave_allocations:user:${existingAllocation.user_id}`);
      await CacheService.del(`leave_allocations:user:${existingAllocation.user_id}:type:${existingAllocation.leave_type_id}`);
    }

    return await this.findById(id, connection);
  }

  static async delete(id: number): Promise<boolean> {
    const result: any = await pool.execute(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }

  // Method to calculate remaining leave balance
  static async getRemainingBalance(userId: number, leaveTypeId: number): Promise<number> {
    const [rows] = await pool.execute(
      `SELECT allocated_days, used_days, carried_over_days FROM ${this.tableName}
       WHERE user_id = ? AND leave_type_id = ? AND cycle_end_date >= CURDATE()
       ORDER BY cycle_end_date DESC LIMIT 1`,
      [userId, leaveTypeId]
    ) as [LeaveAllocation[], any];

    if (rows.length === 0) {
      return 0;
    }

    const allocation = rows[0];
    return allocation.allocated_days - allocation.used_days + allocation.carried_over_days;
  }

  // Method to update used days when leave is taken
  static async updateUsedDays(allocationId: number, daysUsed: number, connection?: any): Promise<boolean> {
    const db = connection || pool;
    
    // First get the existing allocation to know which user and type to invalidate
    const existingAllocation = await this.findById(allocationId, connection);
    if (!existingAllocation) {
      return false;
    }

    const result: any = await db.execute(
      `UPDATE ${this.tableName} SET used_days = used_days + ? WHERE id = ?`,
      [daysUsed, allocationId]
    );

    if (result.affectedRows > 0) {
      // Invalidate cache for this user's allocations (only if no connection provided)
      if (!connection) {
        await CacheService.del(`leave_allocations:user:${existingAllocation.user_id}`);
        await CacheService.del(`leave_allocations:user:${existingAllocation.user_id}:type:${existingAllocation.leave_type_id}`);
      }
    }

    return result.affectedRows > 0;
  }

  // Bulk create allocations for multiple users
  static async bulkCreate(allocationsData: {
    user_id: number;
    leave_type_id: number;
    allocated_days: number;
    cycle_start_date: string;
    cycle_end_date: string;
    carried_over_days?: number;
  }[]): Promise<LeaveAllocation[]> {
    if (allocationsData.length === 0) {
      return [];
    }

    const values: any[] = [];
    const placeholders: string[] = [];

    for (const data of allocationsData) {
      placeholders.push('(?, ?, ?, ?, ?, ?, ?)');
      values.push(
        data.user_id,
        data.leave_type_id,
        data.allocated_days,
        data.cycle_start_date,
        data.cycle_end_date,
        data.carried_over_days || 0,
        0 // used_days
      );
    }

    const query = `INSERT INTO ${this.tableName} 
      (user_id, leave_type_id, allocated_days, cycle_start_date, cycle_end_date, carried_over_days, used_days) 
      VALUES ${placeholders.join(', ')}`;

    await pool.execute(query, values);

    // Invalidate cache for all affected users
    for (const data of allocationsData) {
      await CacheService.del(`leave_allocations:user:${data.user_id}`);
      await CacheService.del(`leave_allocations:user:${data.user_id}:type:${data.leave_type_id}`);
    }

    // Fetch and return the created allocations
    const userIds = allocationsData.map(a => a.user_id);
    const leaveTypeId = allocationsData[0].leave_type_id;
    const inPlaceholders = userIds.map(() => '?').join(',');
    const selectValues = [...userIds, leaveTypeId];
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE user_id IN (${inPlaceholders}) AND leave_type_id = ? ORDER BY created_at DESC`,
      selectValues
    );

    return rows as LeaveAllocation[];
  }

  // Create allocations for all active users for a given leave type
  static async createForAllUsers(
    leaveTypeId: number,
    allocatedDays: number,
    cycleStartDate: string,
    cycleEndDate: string,
    carriedOverDays: number = 0
  ): Promise<{ success: number; failed: number; allocations: LeaveAllocation[] }> {
    // Get all active users
    const [users]: any = await pool.execute(
      `SELECT id FROM users WHERE status = 'active'`
    );

    if (!users || users.length === 0) {
      return { success: 0, failed: 0, allocations: [] };
    }

    const allocationsData = users.map((user: any) => ({
      user_id: user.id,
      leave_type_id: leaveTypeId,
      allocated_days: allocatedDays,
      cycle_start_date: cycleStartDate,
      cycle_end_date: cycleEndDate,
      carried_over_days: carriedOverDays
    }));

    const createdAllocations = await this.bulkCreate(allocationsData);

    return {
      success: createdAllocations.length,
      failed: users.length - createdAllocations.length,
      allocations: createdAllocations
    };
  }
}

export default LeaveAllocationModel;