import { pool } from '../config/database';

export interface Branch {
  id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  manager_user_id: number | null;
  location_coordinates: string | null; // POINT data stored as WKT string: "POINT(longitude latitude)"
  location_radius_meters: number | null;
  attendance_mode: 'branch_based' | 'multiple_locations' | null;
  status: 'active' | 'inactive';
  // Auto-mark absent settings
  auto_mark_absent_enabled: boolean;
  auto_mark_absent_time: string;
  auto_mark_absent_timezone: string;
  // Attendance lock tracking
  attendance_lock_date: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface BranchInput {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  manager_user_id?: number | null;
  location_coordinates?: string | null; // WKT format: "POINT(longitude latitude)"
  location_radius_meters?: number;
  attendance_mode?: 'branch_based' | 'multiple_locations';
}

export interface BranchUpdate {
  name?: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  manager_user_id?: number | null;
  location_coordinates?: string | null;
  location_radius_meters?: number;
  attendance_mode?: 'branch_based' | 'multiple_locations';
  status?: 'active' | 'inactive';
  // Auto-mark absent settings
  auto_mark_absent_enabled?: boolean;
  auto_mark_absent_time?: string;
  auto_mark_absent_timezone?: string;
  // Attendance lock tracking
  attendance_lock_date?: string | null;
}

class BranchModel {
  static tableName = 'branches';

  static async findAll(): Promise<Branch[]> {
    const [rows] = await pool.execute(`SELECT id, name, code, address, city, state, country, phone, email, manager_user_id, ST_AsText(location_coordinates) AS location_coordinates, location_radius_meters, attendance_mode, status, auto_mark_absent_enabled, auto_mark_absent_time, auto_mark_absent_timezone, attendance_lock_date, created_at, updated_at FROM ${this.tableName} ORDER BY created_at DESC`);
    return rows as Branch[];
  }

  static async findById(id: number): Promise<Branch | null> {
    const [rows] = await pool.execute(
      `SELECT id, name, code, address, city, state, country, phone, email, manager_user_id, ST_AsText(location_coordinates) AS location_coordinates, location_radius_meters, attendance_mode, status, auto_mark_absent_enabled, auto_mark_absent_time, auto_mark_absent_timezone, attendance_lock_date, created_at, updated_at FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return (rows as Branch[])[0] || null;
  }

  static async findByCode(code: string): Promise<Branch | null> {
    const [rows] = await pool.execute(
      `SELECT id, name, code, address, city, state, country, phone, email, manager_user_id, ST_AsText(location_coordinates) AS location_coordinates, location_radius_meters, attendance_mode, status, auto_mark_absent_enabled, auto_mark_absent_time, auto_mark_absent_timezone, attendance_lock_date, created_at, updated_at FROM ${this.tableName} WHERE code = ?`,
      [code]
    );
    return (rows as Branch[])[0] || null;
  }

  static async create(branchData: BranchInput): Promise<Branch> {
    const [result]: any = await pool.execute(
      `INSERT INTO ${this.tableName} (name, code, address, city, state, country, phone, email, manager_user_id, location_coordinates, location_radius_meters, attendance_mode, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ST_GeomFromText(?), ?, ?, 'active')`,
      [
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
      ]
    );

    const insertedId = result.insertId;
    const createdItem = await this.findById(insertedId);

    if (!createdItem) {
      throw new Error('Failed to create branch');
    }

    return createdItem;
  }

  static async update(id: number, branchData: BranchUpdate): Promise<Branch | null> {
    const updates: string[] = [];
    const values: any[] = [];

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
      if (branchData.location_coordinates && branchData.location_coordinates.startsWith('POINT')) {
        updates.push('location_coordinates = ST_GeomFromText(?)');
        values.push(branchData.location_coordinates);
      } else {
        updates.push('location_coordinates = ?');
        values.push(branchData.location_coordinates);
      }
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

    await pool.execute(
      `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const result: any = await pool.execute(
      `UPDATE ${this.tableName} SET status = 'inactive' WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }

  // Method to get branches with active status
  static async findActive(): Promise<Branch[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE status = 'active' ORDER BY name`
    );
    return rows as Branch[];
  }

  // Method to check if coordinates are within branch location
  static async isWithinBranchLocation(branchId: number, lat: number, lng: number): Promise<boolean> {
    const [rows] = await pool.execute(`
      SELECT 
        id,
        ST_Distance_Sphere(
          location_coordinates, 
          ST_PointFromText('POINT(${lng} ${lat})')
        ) AS distance_meters
      FROM ${this.tableName} 
      WHERE id = ? AND location_coordinates IS NOT NULL AND location_radius_meters IS NOT NULL
    `, [branchId]) as [any[], any];

    if (rows.length === 0) {
      return false; // Branch doesn't have location coordinates set
    }

    const branch = rows[0];
    const distance = branch.distance_meters;
    const radius = branch.location_radius_meters;

    return distance <= radius;
  }

  // Method to find branches near a location
  static async findNearbyBranches(lat: number, lng: number, maxDistanceMeters: number = 1000): Promise<(Branch & { distance_meters: number })[]> {
    const [rows] = await pool.execute(`
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
    `, [maxDistanceMeters]) as [any[], any];

    return rows;
  }
}

export default BranchModel;