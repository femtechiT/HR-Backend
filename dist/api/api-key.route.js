"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const api_key_model_1 = __importDefault(require("../models/api-key.model"));
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('api_key:read'), async (req, res) => {
    try {
        const userId = req.currentUser?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        const apiKeys = await api_key_model_1.default.findByUser(userId);
        return res.json({
            success: true,
            message: 'API keys retrieved successfully',
            data: { apiKeys }
        });
    }
    catch (error) {
        console.error('Get API keys error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('api_key:create'), async (req, res) => {
    try {
        const { name, permissions, expires_at } = req.body;
        const userId = req.currentUser?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        if (!name || !permissions) {
            return res.status(400).json({
                success: false,
                message: 'Name and permissions are required'
            });
        }
        if (!Array.isArray(permissions)) {
            return res.status(400).json({
                success: false,
                message: 'Permissions must be an array of strings'
            });
        }
        const { apiKey, plainTextKey } = await api_key_model_1.default.create({
            name,
            user_id: userId,
            permissions,
            expires_at: expires_at ? new Date(expires_at) : null
        });
        return res.status(201).json({
            success: true,
            message: 'API key created successfully',
            data: {
                apiKey: {
                    id: apiKey.id,
                    name: apiKey.name,
                    user_id: apiKey.user_id,
                    permissions: apiKey.permissions,
                    is_active: apiKey.is_active,
                    expires_at: apiKey.expires_at,
                    created_at: apiKey.created_at
                },
                plainTextKey
            }
        });
    }
    catch (error) {
        console.error('Create API key error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.put('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('api_key:update'), async (req, res) => {
    try {
        const apiKeyId = parseInt(req.params.id);
        const { name, permissions, is_active, expires_at } = req.body;
        const userId = req.currentUser?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        if (isNaN(apiKeyId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid API key ID'
            });
        }
        const existingKey = await api_key_model_1.default.findById(apiKeyId);
        if (!existingKey || existingKey.user_id !== userId) {
            return res.status(404).json({
                success: false,
                message: 'API key not found or does not belong to current user'
            });
        }
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (permissions !== undefined)
            updateData.permissions = permissions;
        if (is_active !== undefined)
            updateData.is_active = is_active;
        if (expires_at !== undefined)
            updateData.expires_at = expires_at;
        const updatedApiKey = await api_key_model_1.default.update(apiKeyId, updateData);
        if (!updatedApiKey) {
            return res.status(404).json({
                success: false,
                message: 'API key not found'
            });
        }
        return res.json({
            success: true,
            message: 'API key updated successfully',
            data: { apiKey: updatedApiKey }
        });
    }
    catch (error) {
        console.error('Update API key error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('api_key:delete'), async (req, res) => {
    try {
        const apiKeyId = parseInt(req.params.id);
        const userId = req.currentUser?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        if (isNaN(apiKeyId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid API key ID'
            });
        }
        const existingKey = await api_key_model_1.default.findById(apiKeyId);
        if (!existingKey || existingKey.user_id !== userId) {
            return res.status(404).json({
                success: false,
                message: 'API key not found or does not belong to current user'
            });
        }
        const success = await api_key_model_1.default.delete(apiKeyId);
        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'API key not found'
            });
        }
        return res.json({
            success: true,
            message: 'API key deactivated successfully'
        });
    }
    catch (error) {
        console.error('Delete API key error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=api-key.route.js.map