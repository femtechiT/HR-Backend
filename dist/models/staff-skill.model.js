"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class StaffSkillModel {
    static tableName = 'staff_skills';
    static async findAll(staffId, limit = 20, offset = 0) {
        let query = `SELECT * FROM ${this.tableName}`;
        const params = [];
        if (staffId) {
            query += ' WHERE staff_id = ?';
            params.push(staffId);
        }
        query += ' ORDER BY is_primary DESC, created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        const [rows] = await database_1.pool.execute(query, params);
        let countQuery = `SELECT COUNT(*) as count FROM ${this.tableName}`;
        const countParams = [];
        if (staffId) {
            countQuery += ' WHERE staff_id = ?';
            countParams.push(staffId);
        }
        const [countResult] = await database_1.pool.execute(countQuery, countParams);
        const totalCount = countResult[0].count;
        return {
            skills: rows,
            totalCount
        };
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByStaffAndSkill(staffId, skillName) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE staff_id = ? AND skill_name = ?`, [staffId, skillName]);
        return rows[0] || null;
    }
    static async create(skillData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (staff_id, skill_name, proficiency_level, years_of_experience, certification_status, last_used_date, is_primary)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            skillData.staff_id,
            skillData.skill_name,
            skillData.proficiency_level || 'intermediate',
            skillData.years_of_experience || null,
            skillData.certification_status || 'none',
            skillData.last_used_date || null,
            skillData.is_primary || false
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create staff skill');
        }
        return createdItem;
    }
    static async update(id, skillData) {
        const updates = [];
        const values = [];
        if (skillData.skill_name !== undefined) {
            updates.push('skill_name = ?');
            values.push(skillData.skill_name);
        }
        if (skillData.proficiency_level !== undefined) {
            updates.push('proficiency_level = ?');
            values.push(skillData.proficiency_level);
        }
        if (skillData.years_of_experience !== undefined) {
            updates.push('years_of_experience = ?');
            values.push(skillData.years_of_experience);
        }
        if (skillData.certification_status !== undefined) {
            updates.push('certification_status = ?');
            values.push(skillData.certification_status);
        }
        if (skillData.last_used_date !== undefined) {
            updates.push('last_used_date = ?');
            values.push(skillData.last_used_date);
        }
        if (skillData.is_primary !== undefined) {
            updates.push('is_primary = ?');
            values.push(skillData.is_primary);
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
    static async deleteByStaffAndSkill(staffId, skillName) {
        const result = await database_1.pool.execute(`DELETE FROM ${this.tableName} WHERE staff_id = ? AND skill_name = ?`, [staffId, skillName]);
        return result.affectedRows > 0;
    }
}
exports.default = StaffSkillModel;
//# sourceMappingURL=staff-skill.model.js.map