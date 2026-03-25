"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class StaffAddressModel {
    static tableName = 'staff_addresses';
    static async findAll(staffId) {
        let query = `SELECT * FROM ${this.tableName}`;
        const params = [];
        if (staffId) {
            query += ' WHERE staff_id = ?';
            params.push(staffId);
        }
        query += ' ORDER BY is_primary DESC, created_at DESC';
        const [rows] = await database_1.pool.execute(query, params);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByStaffId(staffId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE staff_id = ? ORDER BY is_primary DESC, created_at DESC`, [staffId]);
        return rows;
    }
    static async findByType(staffId, addressType) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE staff_id = ? AND address_type = ? ORDER BY is_primary DESC, created_at DESC`, [staffId, addressType]);
        return rows;
    }
    static async create(addressData) {
        if (addressData.is_primary) {
            await database_1.pool.execute(`UPDATE ${this.tableName} SET is_primary = FALSE WHERE staff_id = ? AND address_type = ?`, [addressData.staff_id, addressData.address_type]);
        }
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (staff_id, address_type, street_address, city, state, zip_code, country, is_primary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            addressData.staff_id,
            addressData.address_type,
            addressData.street_address,
            addressData.city,
            addressData.state,
            addressData.zip_code,
            addressData.country,
            addressData.is_primary || false
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create staff address');
        }
        return createdItem;
    }
    static async update(id, addressData) {
        if (addressData.is_primary) {
            const currentAddress = await this.findById(id);
            if (currentAddress) {
                await database_1.pool.execute(`UPDATE ${this.tableName} SET is_primary = FALSE WHERE staff_id = ? AND address_type = ? AND id != ?`, [currentAddress.staff_id, currentAddress.address_type, id]);
            }
        }
        const updates = [];
        const values = [];
        if (addressData.street_address !== undefined) {
            updates.push('street_address = ?');
            values.push(addressData.street_address);
        }
        if (addressData.city !== undefined) {
            updates.push('city = ?');
            values.push(addressData.city);
        }
        if (addressData.state !== undefined) {
            updates.push('state = ?');
            values.push(addressData.state);
        }
        if (addressData.zip_code !== undefined) {
            updates.push('zip_code = ?');
            values.push(addressData.zip_code);
        }
        if (addressData.country !== undefined) {
            updates.push('country = ?');
            values.push(addressData.country);
        }
        if (addressData.is_primary !== undefined) {
            updates.push('is_primary = ?');
            values.push(addressData.is_primary);
        }
        if (updates.length === 0) {
            return await this.findById(id);
        }
        values.push(id);
        await database_1.pool.execute(`UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`, values);
        return await this.findById(id);
    }
    static async delete(id) {
        const result = await database_1.pool.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
    static async setAsPrimary(id) {
        const currentAddress = await this.findById(id);
        if (!currentAddress) {
            return null;
        }
        await database_1.pool.execute(`UPDATE ${this.tableName} SET is_primary = FALSE WHERE staff_id = ? AND address_type = ? AND id != ?`, [currentAddress.staff_id, currentAddress.address_type, id]);
        const [result] = await database_1.pool.execute(`UPDATE ${this.tableName} SET is_primary = TRUE WHERE id = ?`, [id]);
        if (result.affectedRows > 0) {
            return await this.findById(id);
        }
        return null;
    }
}
exports.default = StaffAddressModel;
//# sourceMappingURL=staff-address.model.js.map