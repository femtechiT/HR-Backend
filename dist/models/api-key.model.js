"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const crypto_1 = __importDefault(require("crypto"));
class ApiKeyModel {
    static tableName = 'api_keys';
    static async create(apiKeyData) {
        const plainTextKey = 'hr_' + crypto_1.default.randomBytes(32).toString('hex');
        const hashedKey = crypto_1.default.createHash('sha256').update(plainTextKey).digest('hex');
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName}
       (api_key, name, user_id, permissions, is_active, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`, [
            hashedKey,
            apiKeyData.name,
            apiKeyData.user_id,
            JSON.stringify(apiKeyData.permissions),
            true,
            apiKeyData.expires_at || null
        ]);
        const insertedId = result.insertId;
        const apiKey = await this.findById(insertedId);
        if (!apiKey) {
            throw new Error('Failed to create API key');
        }
        return { apiKey, plainTextKey };
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        const apiKeys = rows;
        const apiKey = apiKeys[0] || null;
        if (apiKey && typeof apiKey.permissions === 'string') {
            try {
                apiKey.permissions = JSON.parse(apiKey.permissions);
            }
            catch (error) {
                console.error('Error parsing API key permissions:', error);
            }
        }
        return apiKey;
    }
    static async findByKey(plainTextKey) {
        const hashedKey = crypto_1.default.createHash('sha256').update(plainTextKey).digest('hex');
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE api_key = ? AND is_active = TRUE`, [hashedKey]);
        const apiKeys = rows;
        if (apiKeys[0] && apiKeys[0].expires_at && new Date() > new Date(apiKeys[0].expires_at)) {
            await this.update(apiKeys[0].id, { is_active: false });
            return null;
        }
        return apiKeys[0] || null;
    }
    static async findByUser(userId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
        const apiKeys = rows;
        const validKeys = [];
        for (const key of apiKeys) {
            if (typeof key.permissions === 'string') {
                try {
                    key.permissions = JSON.parse(key.permissions);
                }
                catch (error) {
                    console.error('Error parsing API key permissions:', error);
                }
            }
            if (key.expires_at && new Date() > new Date(key.expires_at)) {
                await this.update(key.id, { is_active: false });
            }
            else {
                validKeys.push(key);
            }
        }
        return validKeys;
    }
    static async update(id, updateData) {
        const updates = [];
        const values = [];
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
        updates.push('updated_at = NOW()');
        if (updates.length <= 1) {
            return await this.findById(id);
        }
        values.push(id);
        await database_1.pool.execute(`UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`, values);
        return await this.findById(id);
    }
    static async delete(id) {
        const [result] = await database_1.pool.execute(`UPDATE ${this.tableName} SET is_active = FALSE WHERE id = ?`, [id]);
        const updateResult = result;
        return updateResult.affectedRows > 0;
    }
    static async hasPermission(apiKeyId, permission) {
        const apiKey = await this.findById(apiKeyId);
        if (!apiKey) {
            return false;
        }
        let permissions;
        if (typeof apiKey.permissions === 'string') {
            try {
                permissions = JSON.parse(apiKey.permissions);
            }
            catch (error) {
                console.error('Error parsing API key permissions:', error);
                return false;
            }
        }
        else {
            permissions = apiKey.permissions;
        }
        if (permissions.includes('*')) {
            return true;
        }
        return permissions.includes(permission);
    }
}
exports.default = ApiKeyModel;
//# sourceMappingURL=api-key.model.js.map