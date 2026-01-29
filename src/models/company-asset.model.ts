import { pool } from '../config/database';

export interface CompanyAsset {
  id: number;
  asset_tag: string;
  asset_name: string;
  asset_type: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  specifications?: string;
  purchase_date?: Date;
  warranty_expiry_date?: Date;
  asset_condition: 'excellent' | 'good' | 'fair' | 'poor';
  asset_status: 'available' | 'assigned' | 'maintenance' | 'disposed';
  assigned_to_staff_id?: number;
  assigned_date?: Date;
  returned_date?: Date;
  asset_image?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CompanyAssetInput {
  asset_tag: string;
  asset_name: string;
  asset_type: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  specifications?: string;
  purchase_date?: Date;
  warranty_expiry_date?: Date;
  asset_condition?: 'excellent' | 'good' | 'fair' | 'poor';
  asset_status?: 'available' | 'assigned' | 'maintenance' | 'disposed';
  assigned_to_staff_id?: number;
  assigned_date?: Date;
  asset_image?: string;
  notes?: string;
}

export interface CompanyAssetUpdate {
  asset_name?: string;
  asset_type?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  specifications?: string;
  warranty_expiry_date?: Date;
  asset_condition?: 'excellent' | 'good' | 'fair' | 'poor';
  asset_status?: 'available' | 'assigned' | 'maintenance' | 'disposed';
  assigned_to_staff_id?: number;
  assigned_date?: Date;
  returned_date?: Date;
  asset_image?: string;
  notes?: string;
}

class CompanyAssetModel {
  static tableName = 'company_assets';

  static async findAll(limit: number = 20, offset: number = 0, assetStatus?: 'available' | 'assigned' | 'maintenance' | 'disposed'): Promise<{assets: CompanyAsset[], totalCount: number}> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];

    if (assetStatus) {
      query += ' WHERE asset_status = ?';
      params.push(assetStatus);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const countParams: any[] = [];

    if (assetStatus) {
      countQuery += ' WHERE asset_status = ?';
      countParams.push(assetStatus);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const totalCount = (countResult as any)[0].count;

    return {
      assets: rows as CompanyAsset[],
      totalCount
    };
  }

  static async findById(id: number): Promise<CompanyAsset | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return (rows as CompanyAsset[])[0] || null;
  }

  static async findByTag(assetTag: string): Promise<CompanyAsset | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE asset_tag = ?`,
      [assetTag]
    );
    return (rows as CompanyAsset[])[0] || null;
  }

  static async findByStaff(staffId: number): Promise<CompanyAsset[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE assigned_to_staff_id = ?`,
      [staffId]
    );
    return rows as CompanyAsset[];
  }

  static async create(assetData: CompanyAssetInput): Promise<CompanyAsset> {
    const [result]: any = await pool.execute(
      `INSERT INTO ${this.tableName} (asset_tag, asset_name, asset_type, brand, model, serial_number, specifications, purchase_date, warranty_expiry_date, asset_condition, asset_status, assigned_to_staff_id, assigned_date, asset_image, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        assetData.asset_tag,
        assetData.asset_name,
        assetData.asset_type,
        assetData.brand || null,
        assetData.model || null,
        assetData.serial_number || null,
        assetData.specifications || null,
        assetData.purchase_date || null,
        assetData.warranty_expiry_date || null,
        assetData.asset_condition || 'good',
        assetData.asset_status || 'available',
        assetData.assigned_to_staff_id || null,
        assetData.assigned_date || null,
        assetData.asset_image || null,
        assetData.notes || null
      ]
    );

    const insertedId = result.insertId;
    const createdItem = await this.findById(insertedId);

    if (!createdItem) {
      throw new Error('Failed to create company asset');
    }

    return createdItem;
  }

  static async update(id: number, assetData: CompanyAssetUpdate): Promise<CompanyAsset | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (assetData.asset_name !== undefined) {
      updates.push('asset_name = ?');
      values.push(assetData.asset_name);
    }

    if (assetData.asset_type !== undefined) {
      updates.push('asset_type = ?');
      values.push(assetData.asset_type);
    }

    if (assetData.brand !== undefined) {
      updates.push('brand = ?');
      values.push(assetData.brand);
    }

    if (assetData.model !== undefined) {
      updates.push('model = ?');
      values.push(assetData.model);
    }

    if (assetData.serial_number !== undefined) {
      updates.push('serial_number = ?');
      values.push(assetData.serial_number);
    }

    if (assetData.specifications !== undefined) {
      updates.push('specifications = ?');
      values.push(assetData.specifications);
    }

    if (assetData.warranty_expiry_date !== undefined) {
      updates.push('warranty_expiry_date = ?');
      values.push(assetData.warranty_expiry_date);
    }

    if (assetData.asset_condition !== undefined) {
      updates.push('asset_condition = ?');
      values.push(assetData.asset_condition);
    }

    if (assetData.asset_status !== undefined) {
      updates.push('asset_status = ?');
      values.push(assetData.asset_status);
    }

    if (assetData.assigned_to_staff_id !== undefined) {
      updates.push('assigned_to_staff_id = ?');
      values.push(assetData.assigned_to_staff_id);
    }

    if (assetData.assigned_date !== undefined) {
      updates.push('assigned_date = ?');
      values.push(assetData.assigned_date);
    }

    if (assetData.returned_date !== undefined) {
      updates.push('returned_date = ?');
      values.push(assetData.returned_date);
    }

    if (assetData.asset_image !== undefined) {
      updates.push('asset_image = ?');
      values.push(assetData.asset_image);
    }

    if (assetData.notes !== undefined) {
      updates.push('notes = ?');
      values.push(assetData.notes);
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

  static async assignToStaff(assetId: number, staffId: number, assignedDate?: Date): Promise<CompanyAsset | null> {
    const updateData: CompanyAssetUpdate = {
      asset_status: 'assigned',
      assigned_to_staff_id: staffId,
      assigned_date: assignedDate || new Date()
    };

    return await this.update(assetId, updateData);
  }

  static async returnFromStaff(assetId: number, returnedDate?: Date): Promise<CompanyAsset | null> {
    const updateData: CompanyAssetUpdate = {
      asset_status: 'available',
      assigned_to_staff_id: null,
      returned_date: returnedDate || new Date()
    };

    return await this.update(assetId, updateData);
  }

  static async delete(id: number): Promise<boolean> {
    const result: any = await pool.execute(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }
}

export default CompanyAssetModel;