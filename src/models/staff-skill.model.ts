import { pool } from '../config/database';

export interface StaffSkill {
  id: number;
  staff_id: number;
  skill_name: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_of_experience?: number;
  certification_status: 'none' | 'certified' | 'in_progress';
  last_used_date?: Date;
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface StaffSkillInput {
  staff_id: number;
  skill_name: string;
  proficiency_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_of_experience?: number;
  certification_status?: 'none' | 'certified' | 'in_progress';
  last_used_date?: Date;
  is_primary?: boolean;
}

export interface StaffSkillUpdate {
  skill_name?: string;
  proficiency_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_of_experience?: number;
  certification_status?: 'none' | 'certified' | 'in_progress';
  last_used_date?: Date;
  is_primary?: boolean;
}

class StaffSkillModel {
  static tableName = 'staff_skills';

  static async findAll(staffId?: number, limit: number = 20, offset: number = 0): Promise<{skills: StaffSkill[], totalCount: number}> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];

    if (staffId) {
      query += ' WHERE staff_id = ?';
      params.push(staffId);
    }

    query += ' ORDER BY is_primary DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const countParams: any[] = [];

    if (staffId) {
      countQuery += ' WHERE staff_id = ?';
      countParams.push(staffId);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const totalCount = (countResult as any)[0].count;

    return {
      skills: rows as StaffSkill[],
      totalCount
    };
  }

  static async findById(id: number): Promise<StaffSkill | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return (rows as StaffSkill[])[0] || null;
  }

  static async findByStaffAndSkill(staffId: number, skillName: string): Promise<StaffSkill | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE staff_id = ? AND skill_name = ?`,
      [staffId, skillName]
    );
    return (rows as StaffSkill[])[0] || null;
  }

  static async create(skillData: StaffSkillInput): Promise<StaffSkill> {
    const [result]: any = await pool.execute(
      `INSERT INTO ${this.tableName} (staff_id, skill_name, proficiency_level, years_of_experience, certification_status, last_used_date, is_primary)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        skillData.staff_id,
        skillData.skill_name,
        skillData.proficiency_level || 'intermediate',
        skillData.years_of_experience || null,
        skillData.certification_status || 'none',
        skillData.last_used_date || null,
        skillData.is_primary || false
      ]
    );

    const insertedId = result.insertId;
    const createdItem = await this.findById(insertedId);

    if (!createdItem) {
      throw new Error('Failed to create staff skill');
    }

    return createdItem;
  }

  static async update(id: number, skillData: StaffSkillUpdate): Promise<StaffSkill | null> {
    const updates: string[] = [];
    const values: any[] = [];

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

    await pool.execute(
      `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const result: any = await pool.execute(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }

  static async deleteByStaffAndSkill(staffId: number, skillName: string): Promise<boolean> {
    const result: any = await pool.execute(
      `DELETE FROM ${this.tableName} WHERE staff_id = ? AND skill_name = ?`,
      [staffId, skillName]
    );

    return result.affectedRows > 0;
  }
}

export default StaffSkillModel;