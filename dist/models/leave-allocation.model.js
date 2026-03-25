"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const cache_service_1 = require("../services/cache.service");
class LeaveAllocationModel {
    static tableName = 'leave_allocations';
    static async findAll() {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
        return rows;
    }
    static async findById(id, connection) {
        const db = connection || database_1.pool;
        const [rows] = await db.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByUserId(userId) {
        const cacheKey = `leave_allocations:user:${userId}`;
        const cachedAllocations = await cache_service_1.CacheService.get(cacheKey);
        if (cachedAllocations) {
            return cachedAllocations;
        }
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY cycle_start_date DESC`, [userId]);
        const allocations = rows;
        await cache_service_1.CacheService.set(cacheKey, allocations, 3600);
        return allocations;
    }
    static async findByUserIdAndTypeId(userId, leaveTypeId, connection) {
        const db = connection || database_1.pool;
        const cacheKey = `leave_allocations:user:${userId}:type:${leaveTypeId}`;
        if (!connection) {
            const cachedAllocations = await cache_service_1.CacheService.get(cacheKey);
            if (cachedAllocations) {
                return cachedAllocations;
            }
        }
        const [rows] = await db.execute(`SELECT * FROM ${this.tableName} WHERE user_id = ? AND leave_type_id = ? ORDER BY cycle_start_date DESC`, [userId, leaveTypeId]);
        const allocations = rows;
        if (!connection) {
            await cache_service_1.CacheService.set(cacheKey, allocations, 3600);
        }
        return allocations;
    }
    static async findByCycleDates(startDate, endDate) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE cycle_start_date >= ? AND cycle_end_date <= ?`, [startDate, endDate]);
        return rows;
    }
    static async create(allocationData, connection) {
        const db = connection || database_1.pool;
        const existingAllocations = await this.findByUserIdAndTypeId(allocationData.user_id, allocationData.leave_type_id, connection);
        const newCycleStart = allocationData.cycle_start_date instanceof Date
            ? allocationData.cycle_start_date
            : new Date(allocationData.cycle_start_date);
        const newCycleEnd = allocationData.cycle_end_date instanceof Date
            ? allocationData.cycle_end_date
            : new Date(allocationData.cycle_end_date);
        const newCycleYear = newCycleEnd.getFullYear();
        const hasOverlappingCycle = existingAllocations.some(allocation => {
            const existingEnd = allocation.cycle_end_date instanceof Date
                ? allocation.cycle_end_date
                : new Date(allocation.cycle_end_date);
            const existingYear = existingEnd.getFullYear();
            return existingYear === newCycleYear;
        });
        if (hasOverlappingCycle) {
            throw new Error(`Leave allocation already exists for this user and leave type for year ${newCycleYear}. Each leave type can only be allocated once per year.`);
        }
        const [result] = await db.execute(`INSERT INTO ${this.tableName} (user_id, leave_type_id, cycle_start_date, cycle_end_date, allocated_days, used_days, carried_over_days)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            allocationData.user_id,
            allocationData.leave_type_id,
            allocationData.cycle_start_date,
            allocationData.cycle_end_date,
            allocationData.allocated_days,
            allocationData.used_days || 0,
            allocationData.carried_over_days || 0
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId, connection);
        if (!createdItem) {
            throw new Error('Failed to create leave allocation');
        }
        if (!connection) {
            await cache_service_1.CacheService.del(`leave_allocations:user:${allocationData.user_id}`);
            await cache_service_1.CacheService.del(`leave_allocations:user:${allocationData.user_id}:type:${allocationData.leave_type_id}`);
        }
        return createdItem;
    }
    static async update(id, allocationData, connection) {
        const db = connection || database_1.pool;
        const existingAllocation = await this.findById(id, connection);
        if (!existingAllocation) {
            return null;
        }
        const updates = [];
        const values = [];
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
        await db.execute(`UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`, values);
        if (!connection) {
            await cache_service_1.CacheService.del(`leave_allocations:user:${existingAllocation.user_id}`);
            await cache_service_1.CacheService.del(`leave_allocations:user:${existingAllocation.user_id}:type:${existingAllocation.leave_type_id}`);
        }
        return await this.findById(id, connection);
    }
    static async delete(id) {
        const result = await database_1.pool.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
    static async getRemainingBalance(userId, leaveTypeId) {
        const [rows] = await database_1.pool.execute(`SELECT allocated_days, used_days, carried_over_days FROM ${this.tableName}
       WHERE user_id = ? AND leave_type_id = ? AND cycle_end_date >= CURDATE()
       ORDER BY cycle_end_date DESC LIMIT 1`, [userId, leaveTypeId]);
        if (rows.length === 0) {
            return 0;
        }
        const allocation = rows[0];
        return allocation.allocated_days - allocation.used_days + allocation.carried_over_days;
    }
    static async updateUsedDays(allocationId, daysUsed, connection) {
        const db = connection || database_1.pool;
        const existingAllocation = await this.findById(allocationId, connection);
        if (!existingAllocation) {
            return false;
        }
        const result = await db.execute(`UPDATE ${this.tableName} SET used_days = used_days + ? WHERE id = ?`, [daysUsed, allocationId]);
        if (result.affectedRows > 0) {
            if (!connection) {
                await cache_service_1.CacheService.del(`leave_allocations:user:${existingAllocation.user_id}`);
                await cache_service_1.CacheService.del(`leave_allocations:user:${existingAllocation.user_id}:type:${existingAllocation.leave_type_id}`);
            }
        }
        return result.affectedRows > 0;
    }
    static async bulkCreate(allocationsData) {
        if (allocationsData.length === 0) {
            return [];
        }
        const values = [];
        const placeholders = [];
        for (const data of allocationsData) {
            placeholders.push('(?, ?, ?, ?, ?, ?, ?)');
            values.push(data.user_id, data.leave_type_id, data.allocated_days, data.cycle_start_date, data.cycle_end_date, data.carried_over_days || 0, 0);
        }
        const query = `INSERT INTO ${this.tableName} 
      (user_id, leave_type_id, allocated_days, cycle_start_date, cycle_end_date, carried_over_days, used_days) 
      VALUES ${placeholders.join(', ')}`;
        await database_1.pool.execute(query, values);
        for (const data of allocationsData) {
            await cache_service_1.CacheService.del(`leave_allocations:user:${data.user_id}`);
            await cache_service_1.CacheService.del(`leave_allocations:user:${data.user_id}:type:${data.leave_type_id}`);
        }
        const userIds = allocationsData.map(a => a.user_id);
        const leaveTypeId = allocationsData[0].leave_type_id;
        const inPlaceholders = userIds.map(() => '?').join(',');
        const selectValues = [...userIds, leaveTypeId];
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE user_id IN (${inPlaceholders}) AND leave_type_id = ? ORDER BY created_at DESC`, selectValues);
        return rows;
    }
    static async createForAllUsers(leaveTypeId, allocatedDays, cycleStartDate, cycleEndDate, carriedOverDays = 0) {
        const [users] = await database_1.pool.execute(`SELECT id FROM users WHERE status = 'active'`);
        if (!users || users.length === 0) {
            return { success: 0, failed: 0, allocations: [] };
        }
        const allocationsData = users.map((user) => ({
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
exports.default = LeaveAllocationModel;
//# sourceMappingURL=leave-allocation.model.js.map