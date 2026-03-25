"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class BranchModel {
    static tableName = 'branches';
    static async findAll() {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByCode(code) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE code = ?`, [code]);
        return rows[0] || null;
    }
    static async create(branchData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (name, code, address, city, state, country, phone, email, manager_user_id, location_coordinates, location_radius_meters, attendance_mode, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`, [
            branchData.name,
            branchData.code,
            branchData.address,
            branchData.city,
            branchData.state,
            branchData.country,
            branchData.phone,
            branchData.email,
            branchData.manager_user_id || null,
            branchData.location_coordinates || null,
            branchData.location_radius_meters || null,
            branchData.attendance_mode || null
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create branch');
        }
        return createdItem;
    }
    static async update(id, branchData) {
        const updates = [];
        const values = [];
        if (branchData.name !== undefined) {
            updates.push('name = ?');
            values.push(branchData.name);
        }
        if (branchData.code !== undefined) {
            updates.push('code = ?');
            values.push(branchData.code);
        }
        if (branchData.address !== undefined) {
            updates.push('address = ?');
            values.push(branchData.address);
        }
        if (branchData.city !== undefined) {
            updates.push('city = ?');
            values.push(branchData.city);
        }
        if (branchData.state !== undefined) {
            updates.push('state = ?');
            values.push(branchData.state);
        }
        if (branchData.country !== undefined) {
            updates.push('country = ?');
            values.push(branchData.country);
        }
        if (branchData.phone !== undefined) {
            updates.push('phone = ?');
            values.push(branchData.phone);
        }
        if (branchData.email !== undefined) {
            updates.push('email = ?');
            values.push(branchData.email);
        }
        if (branchData.manager_user_id !== undefined) {
            updates.push('manager_user_id = ?');
            values.push(branchData.manager_user_id);
        }
        if (branchData.location_coordinates !== undefined) {
            updates.push('location_coordinates = ?');
            values.push(branchData.location_coordinates);
        }
        if (branchData.location_radius_meters !== undefined) {
            updates.push('location_radius_meters = ?');
            values.push(branchData.location_radius_meters);
        }
        if (branchData.attendance_mode !== undefined) {
            updates.push('attendance_mode = ?');
            values.push(branchData.attendance_mode);
        }
        if (branchData.status !== undefined) {
            updates.push('status = ?');
            values.push(branchData.status);
        }
        if (updates.length === 0) {
            return await this.findById(id);
        }
        values.push(id);
        await database_1.pool.execute(`UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`, values);
        return await this.findById(id);
    }
    static async delete(id) {
        const result = await database_1.pool.execute(`UPDATE ${this.tableName} SET status = 'inactive' WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
    static async findActive() {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE status = 'active' ORDER BY name`);
        return rows;
    }
    static async isWithinBranchLocation(branchId, lat, lng) {
        const [rows] = await database_1.pool.execute(`
      SELECT 
        id,
        ST_Distance_Sphere(
          location_coordinates, 
          ST_PointFromText('POINT(${lng} ${lat})')
        ) AS distance_meters
      FROM ${this.tableName} 
      WHERE id = ? AND location_coordinates IS NOT NULL AND location_radius_meters IS NOT NULL
    `, [branchId]);
        if (rows.length === 0) {
            return false;
        }
        const branch = rows[0];
        const distance = branch.distance_meters;
        const radius = branch.location_radius_meters;
        return distance <= radius;
    }
    static async findNearbyBranches(lat, lng, maxDistanceMeters = 1000) {
        const [rows] = await database_1.pool.execute(`
      SELECT *,
        ST_Distance_Sphere(
          location_coordinates, 
          ST_PointFromText('POINT(${lng} ${lat})')
        ) AS distance_meters
      FROM ${this.tableName} 
      WHERE location_coordinates IS NOT NULL 
        AND location_radius_meters IS NOT NULL
        AND ST_Distance_Sphere(location_coordinates, ST_PointFromText('POINT(${lng} ${lat})')) <= ?
      ORDER BY distance_meters ASC
    `, [maxDistanceMeters]);
        return rows;
    }
}
exports.default = BranchModel;
//# sourceMappingURL=branch.model.js.map