import { pool } from '../config/database';
import crypto from 'crypto';

export interface ApiKey {
  id: number;
  key: string; // The hashed API key
  name: string; // Descriptive name for the key
  user_id: number; // Which user owns this key
  permissions: string[] | string; // Specific permissions granted to this key (stored as JSON string in DB)
  is_active: boolean;
  expires_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ApiKeyInput {
  name: string;
  user_id: number;
  permissions: string[];
  expires_at?: Date | null;
}

export interface ApiKeyUpdate {
  name?: string;
  permissions?: string[];
  is_active?: boolean;
  expires_at?: Date | null;
}

class ApiKeyModel {
  static tableName = 'api_keys';

  /**
   * Create a new API key
   * This generates a random key, hashes it, and stores the hash
   */
  static async create(apiKeyData: ApiKeyInput): Promise<{ apiKey: ApiKey, plainTextKey: string }> {
    // Generate a random API key
    const plainTextKey = 'hr_' + crypto.randomBytes(32).toString('hex');
    
    // Hash the key for secure storage
    const hashedKey = crypto.createHash('sha256').update(plainTextKey).digest('hex');
    
    const [result]: any = await pool.execute(
      `INSERT INTO ${this.tableName} 
       (key, name, user_id, permissions, is_active, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        hashedKey,
        apiKeyData.name,
        apiKeyData.user_id,
        JSON.stringify(apiKeyData.permissions),
        true, // isActive by default
        apiKeyData.expires_at || null
      ]
    );

    const insertedId = result.insertId;
    const apiKey = await this.findById(insertedId);

    if (!apiKey) {
      throw new Error('Failed to create API key');
    }

    return { apiKey, plainTextKey };
  }

  /**
   * Find API key by its ID
   */
  static async findById(id: number): Promise<ApiKey | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    
    const apiKeys = rows as ApiKey[];
    return apiKeys[0] || null;
  }

  /**
   * Find API key by its value (before hashing)
   * This is used for authentication
   */
  static async findByKey(plainTextKey: string): Promise<ApiKey | null> {
    const hashedKey = crypto.createHash('sha256').update(plainTextKey).digest('hex');
    
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE key = ? AND is_active = TRUE`,
      [hashedKey]
    );
    
    const apiKeys = rows as ApiKey[];
    
    // Check if key has expired
    if (apiKeys[0] && apiKeys[0].expires_at && new Date() > new Date(apiKeys[0].expires_at)) {
      // Deactivate expired key
      await this.update(apiKeys[0].id, { is_active: false });
      return null;
    }
    
    return apiKeys[0] || null;
  }

  /**
   * Find all API keys for a specific user
   */
  static async findByUser(userId: number): Promise<ApiKey[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    
    const apiKeys = rows as ApiKey[];
    
    // Filter out expired keys and deactivate them
    const validKeys = [];
    for (const key of apiKeys) {
      if (key.expires_at && new Date() > new Date(key.expires_at)) {
        await this.update(key.id, { is_active: false });
      } else {
        validKeys.push(key);
      }
    }
    
    return validKeys;
  }

  /**
   * Update an API key
   */
  static async update(id: number, updateData: ApiKeyUpdate): Promise<ApiKey | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (updateData.name !== undefined) {
      updates.push('name = ?');
      values.push(updateData.name);
    }

    if (updateData.permissions !== undefined) {
      updates.push('permissions = ?');
      values.push(JSON.stringify(updateData.permissions));
    }

    if (updateData.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(updateData.is_active);
    }

    if (updateData.expires_at !== undefined) {
      updates.push('expires_at = ?');
      values.push(updateData.expires_at);
    }

    // Always update the updated_at field
    updates.push('updated_at = NOW()');
    
    if (updates.length <= 1) { // Only 'updated_at' was added
      return await this.findById(id);
    }

    values.push(id);

    await pool.execute(
      `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }

  /**
   * Delete (deactivate) an API key
   */
  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute(
      `UPDATE ${this.tableName} SET is_active = FALSE WHERE id = ?`,
      [id]
    );

    const updateResult: any = result;
    return updateResult.affectedRows > 0;
  }

  /**
   * Check if an API key has a specific permission
   */
  static async hasPermission(apiKeyId: number, permission: string): Promise<boolean> {
    const apiKey = await this.findById(apiKeyId);
    
    if (!apiKey) {
      return false;
    }

    // Parse permissions from JSON string if it's stored as string
    const permissions = typeof apiKey.permissions === 'string' 
      ? JSON.parse(apiKey.permissions) 
      : apiKey.permissions;

    // Check if key has wildcard permission
    if (permissions.includes('*')) {
      return true;
    }

    // Check if key has the specific permission
    return permissions.includes(permission);
  }
}

export default ApiKeyModel;