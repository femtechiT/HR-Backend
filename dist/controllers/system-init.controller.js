"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkInitializationStatus = exports.initializeSystem = exports.isSystemInitialized = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const email_service_1 = require("../services/email.service");
const isSystemInitialized = async () => {
    try {
        const [rows] = await database_1.pool.execute('SELECT COUNT(*) as count FROM users');
        const userCount = rows[0].count;
        return userCount > 0;
    }
    catch (error) {
        console.error('Error checking system initialization:', error);
        return true;
    }
};
exports.isSystemInitialized = isSystemInitialized;
const initializeSystem = async (req, res) => {
    try {
        const systemInitialized = await (0, exports.isSystemInitialized)();
        if (systemInitialized) {
            return res.status(400).json({
                success: false,
                message: 'System is already initialized. Cannot create another Super Admin.'
            });
        }
        const { email, password, fullName, phone } = req.body;
        if (!email || !password || !fullName) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and full name are required'
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }
        const saltRounds = 10;
        const passwordHash = await bcryptjs_1.default.hash(password, saltRounds);
        const [roleResult] = await database_1.pool.execute('INSERT INTO roles (name, description, permissions, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())', ['Super Admin', 'System super administrator with all privileges', JSON.stringify(['*'])]);
        const superAdminRoleId = roleResult.insertId;
        const [userResult] = await database_1.pool.execute(`INSERT INTO users 
       (email, password_hash, full_name, phone, role_id, branch_id, status, must_change_password, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, NULL, 'active', 0, NOW(), NOW())`, [email, passwordHash, fullName, phone || null, superAdminRoleId]);
        const userId = userResult.insertId;
        const tokenPayload = {
            userId: userId,
            email: email,
            role_id: superAdminRoleId
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '24h' });
        try {
            await (0, email_service_1.sendWelcomeEmail)({ to: email, fullName });
        }
        catch (emailError) {
            console.error('Error sending welcome email:', emailError);
        }
        return res.status(201).json({
            success: true,
            message: 'System initialized successfully. Super Admin created.',
            data: {
                user: {
                    id: userId,
                    email,
                    fullName,
                    roleId: superAdminRoleId
                },
                token
            }
        });
    }
    catch (error) {
        console.error('System initialization error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during system initialization'
        });
    }
};
exports.initializeSystem = initializeSystem;
const checkInitializationStatus = async (req, res) => {
    try {
        const systemInitialized = await (0, exports.isSystemInitialized)();
        return res.json({
            success: true,
            data: {
                isInitialized: systemInitialized
            }
        });
    }
    catch (error) {
        console.error('Error checking initialization status:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking initialization status'
        });
    }
};
exports.checkInitializationStatus = checkInitializationStatus;
//# sourceMappingURL=system-init.controller.js.map