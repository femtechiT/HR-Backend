"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class AttendanceLocationModel {
    static tableName = 'attendance_locations';
    static async findAll() {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE is_active = TRUE ORDER BY name`);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findActiveLocations() {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE is_active = TRUE ORDER BY name`);
        return rows;
    }
    static async findByBranch(branchId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE branch_id = ? AND is_active = TRUE ORDER BY name`, [branchId]);
        return rows;
    }
    static async create(locationData) {
        console.log('📍 Creating attendance location:', locationData);
        let coordinatesValue = locationData.location_coordinates;
        console.log('📍 Original coordinates:', coordinatesValue, typeof coordinatesValue);
        if (typeof coordinatesValue === 'string' && !coordinatesValue.includes('POINT')) {
            const parts = coordinatesValue.split(/[,\s]+/).filter(p => p.trim());
            console.log('📍 Split parts:', parts);
            if (parts.length === 2) {
                const [lng, lat] = parts.map(p => parseFloat(p));
                coordinatesValue = `POINT(${lng} ${lat})`;
                console.log('📍 Converted to:', coordinatesValue);
            }
        }
        else if (typeof coordinatesValue === 'string' && coordinatesValue.includes('POINT')) {
            console.log('📍 Already in POINT format');
        }
        else {
            console.error('📍 Invalid coordinates format:', coordinatesValue);
            throw new Error('Invalid coordinates format. Expected: "POINT(lng lat)" or "lng,lat"');
        }
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (name, location_coordinates, location_radius_meters, branch_id, is_active, created_by)
       VALUES (?, ST_GeomFromText(?), ?, ?, ?, ?)`, [
            locationData.name,
            coordinatesValue,
            locationData.location_radius_meters || 100,
            locationData.branch_id || null,
            locationData.is_active ?? true,
            locationData.created_by || null
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create attendance location');
        }
        return createdItem;
    }
    static async update(id, locationData) {
        const updates = [];
        const values = [];
        if (locationData.name !== undefined) {
            updates.push('name = ?');
            values.push(locationData.name);
        }
        if (locationData.location_coordinates !== undefined) {
            let coordinatesValue = locationData.location_coordinates;
            if (typeof coordinatesValue === 'string' && !coordinatesValue.includes('POINT')) {
                const parts = coordinatesValue.split(/[,\s]+/).filter(p => p.trim());
                if (parts.length === 2) {
                    const [lng, lat] = parts.map(p => parseFloat(p));
                    coordinatesValue = `POINT(${lng} ${lat})`;
                }
            }
            if (typeof coordinatesValue === 'string' && coordinatesValue.startsWith('POINT')) {
                updates.push('location_coordinates = ST_GeomFromText(?)');
                values.push(coordinatesValue);
            }
            else {
                updates.push('location_coordinates = ?');
                values.push(coordinatesValue);
            }
        }
        if (locationData.location_radius_meters !== undefined) {
            updates.push('location_radius_meters = ?');
            values.push(locationData.location_radius_meters);
        }
        if (locationData.branch_id !== undefined) {
            updates.push('branch_id = ?');
            values.push(locationData.branch_id);
        }
        if (locationData.is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(locationData.is_active);
        }
        if (updates.length === 0) {
            return await this.findById(id);
        }
        values.push(id);
        await database_1.pool.execute(`UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`, values);
        return await this.findById(id);
    }
    static async delete(id) {
        const result = await database_1.pool.execute(`UPDATE ${this.tableName} SET is_active = FALSE WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
    static async isWithinAttendanceLocation(lat, lng, branchId) {
        let query = '';
        const params = [`POINT(${lng} ${lat})`];
        if (branchId !== undefined && branchId !== null) {
            query = `
        SELECT * FROM ${this.tableName}
        WHERE is_active = TRUE
        AND ST_Distance_Sphere(location_coordinates, ST_GeomFromText(?)) <= location_radius_meters
        AND (branch_id = ? OR branch_id IS NULL)
        LIMIT 1`;
            params.push(branchId);
        }
        else {
            query = `
        SELECT * FROM ${this.tableName}
        WHERE is_active = TRUE
        AND ST_Distance_Sphere(location_coordinates, ST_GeomFromText(?)) <= location_radius_meters
        LIMIT 1`;
        }
        const [rows] = await database_1.pool.execute(query, params);
        return rows[0] || null;
    }
    static async getLocationsNearby(lat, lng, maxDistanceMeters = 1000, branchId) {
        let query = '';
        const params = [`POINT(${lng} ${lat})`, maxDistanceMeters];
        if (branchId !== undefined && branchId !== null) {
            query = `
        SELECT *, ST_Distance_Sphere(location_coordinates, ST_GeomFromText(?)) AS distance_meters
        FROM ${this.tableName} 
        WHERE is_active = TRUE 
        AND ST_Distance_Sphere(location_coordinates, ST_GeomFromText(?)) <= ?
        AND (branch_id = ? OR branch_id IS NULL)
        ORDER BY distance_meters ASC`;
            params.push(branchId);
        }
        else {
            query = `
        SELECT *, ST_Distance_Sphere(location_coordinates, ST_GeomFromText(?)) AS distance_meters
        FROM ${this.tableName} 
        WHERE is_active = TRUE 
        AND ST_Distance_Sphere(location_coordinates, ST_GeomFromText(?)) <= ?
        ORDER BY distance_meters ASC`;
        }
        const [rows] = await database_1.pool.execute(query, params);
        return rows;
    }
    static async isWithinSpecificLocation(locationId, lat, lng) {
        const [rows] = await database_1.pool.execute(`
      SELECT id FROM ${this.tableName}
      WHERE id = ?
      AND is_active = TRUE
      AND ST_Distance_Sphere(location_coordinates, ST_PointFromText('POINT(${lng} ${lat})')) <= location_radius_meters
    `, [locationId]);
        return rows.length > 0;
    }
    static async findByActiveStatus(isActive) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE is_active = ? ORDER BY name`, [isActive]);
        return rows;
    }
}
exports.default = AttendanceLocationModel;
//# sourceMappingURL=attendance-location.model.js.map