import { pool } from '../config/database';

export interface HolidayDutyRoster {
  id: number;
  holiday_id: number;
  user_id: number;
  shift_start_time: string;
  shift_end_time: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface HolidayDutyRosterInput {
  holiday_id: number;
  user_id: number;
  shift_start_time: string;
  shift_end_time: string;
  notes?: string | null;
}

export interface HolidayDutyRosterUpdate {
  shift_start_time?: string;
  shift_end_time?: string;
  notes?: string | null;
}

class HolidayDutyRosterModel {
  static tableName = 'holiday_duty_roster';

  static async findAll(): Promise<HolidayDutyRoster[]> {
    const [rows] = await pool.execute(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
    return rows as HolidayDutyRoster[];
  }

  static async findById(id: number): Promise<HolidayDutyRoster | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return (rows as HolidayDutyRoster[])[0] || null;
  }

  static async findByHolidayId(holidayId: number): Promise<HolidayDutyRoster[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE holiday_id = ? ORDER BY shift_start_time`,
      [holidayId]
    );
    return rows as HolidayDutyRoster[];
  }

  static async findByUserId(userId: number): Promise<HolidayDutyRoster[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    return rows as HolidayDutyRoster[];
  }

  static async findByHolidayAndUser(holidayId: number, userId: number): Promise<HolidayDutyRoster | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE holiday_id = ? AND user_id = ?`,
      [holidayId, userId]
    );
    return (rows as HolidayDutyRoster[])[0] || null;
  }

  static async create(rosterData: HolidayDutyRosterInput): Promise<HolidayDutyRoster> {
    const [result]: any = await pool.execute(
      `INSERT INTO ${this.tableName} (holiday_id, user_id, shift_start_time, shift_end_time, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [
        rosterData.holiday_id,
        rosterData.user_id,
        rosterData.shift_start_time,
        rosterData.shift_end_time,
        rosterData.notes || null
      ]
    );

    const insertedId = result.insertId;
    const createdItem = await this.findById(insertedId);

    if (!createdItem) {
      throw new Error('Failed to create holiday duty roster record');
    }

    return createdItem;
  }

  static async bulkCreate(rosterDataArray: HolidayDutyRosterInput[]): Promise<HolidayDutyRoster[]> {
    const createdRecords: HolidayDutyRoster[] = [];

    for (const rosterData of rosterDataArray) {
      const record = await this.create(rosterData);
      createdRecords.push(record);
    }

    return createdRecords;
  }

  static async update(id: number, rosterData: HolidayDutyRosterUpdate): Promise<HolidayDutyRoster | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (rosterData.shift_start_time !== undefined) {
      updates.push('shift_start_time = ?');
      values.push(rosterData.shift_start_time);
    }

    if (rosterData.shift_end_time !== undefined) {
      updates.push('shift_end_time = ?');
      values.push(rosterData.shift_end_time);
    }

    if (rosterData.notes !== undefined) {
      updates.push('notes = ?');
      values.push(rosterData.notes);
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

  static async deleteByHolidayId(holidayId: number): Promise<number> {
    const result: any = await pool.execute(
      `DELETE FROM ${this.tableName} WHERE holiday_id = ?`,
      [holidayId]
    );

    return result.affectedRows;
  }
}

export default HolidayDutyRosterModel;
