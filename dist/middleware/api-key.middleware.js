"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireApiKey = exports.checkApiKeyPermission = exports.authenticateApiKey = void 0;
const api_key_model_1 = __importDefault(require("../models/api-key.model"));
const authenticateApiKey = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const apiKeyValue = authHeader.substring(7).trim();
        const apiKey = await api_key_model_1.default.findByKey(apiKeyValue);
        if (!apiKey) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired API key'
            });
        }
        req.apiKey = apiKey;
        return next();
    }
    catch (error) {
        console.error('API key authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during API key authentication'
        });
    }
};
exports.authenticateApiKey = authenticateApiKey;
const checkApiKeyPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            if (!req.apiKey) {
                return next();
            }
            const hasPermission = await api_key_model_1.default.hasPermission(req.apiKey.id, requiredPermission);
            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: `Insufficient permissions. API key lacks required permission: ${requiredPermission}`
                });
            }
            return next();
        }
        catch (error) {
            console.error('API key permission check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during API key permission check'
            });
        }
    };
};
exports.checkApiKeyPermission = checkApiKeyPermission;
const requireApiKey = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'API key is required. Use Authorization: Bearer <api_key>'
            });
        }
        const apiKeyValue = authHeader.substring(7).trim();
        const apiKey = await api_key_model_1.default.findByKey(apiKeyValue);
        if (!apiKey) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired API key'
            });
        }
        req.apiKey = apiKey;
        return next();
    }
    catch (error) {
        console.error('Required API key authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during API key authentication'
        });
    }
};
exports.requireApiKey = requireApiKey;
//# sourceMappingURL=api-key.middleware.js.map