"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSystemReadiness = exports.initializeCompleteSystem = exports.runMigrations = exports.checkDatabaseSchema = exports.isSystemInitialized = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const promise_1 = __importDefault(require("mysql2/promise"));
const email_service_1 = require("../services/email.service");
const isSystemInitialized = async () => {
    try {
        const [rows] = await database_1.pool.execute('SELECT COUNT(*) as count FROM users');
        const userCount = rows[0].count;
        return userCount > 0;
    }
    catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return false;
        }
        console.error('Error checking system initialization:', error);
        return true;
    }
};
exports.isSystemInitialized = isSystemInitialized;
const checkDatabaseSchema = async () => {
    try {
        const tablesToCheck = ['users', 'roles', 'branches'];
        for (const table of tablesToCheck) {
            try {
                await database_1.pool.execute(`SELECT 1 FROM ${table} LIMIT 1`);
            }
            catch (error) {
                if (error.code === 'ER_NO_SUCH_TABLE') {
                    return false;
                }
                throw error;
            }
        }
        return true;
    }
    catch (error) {
        console.error('Error checking database schema:', error);
        return false;
    }
};
exports.checkDatabaseSchema = checkDatabaseSchema;
const runMigrations = async () => {
    try {
        console.log('========================================');
        console.log('Starting database setup...');
        console.log('========================================');
        const migrationFile = '000_all_migrations.sql';
        const migrationsDir = path_1.default.join(process.cwd(), 'migrations');
        const migrationPath = path_1.default.join(migrationsDir, migrationFile);
        console.log(`Running consolidated migration: ${migrationFile}`);
        console.log('This combines all 100+ migrations into one file for speed...');
        const migrationSql = await promises_1.default.readFile(migrationPath, 'utf8');
        await database_1.pool.execute('SET FOREIGN_KEY_CHECKS = 0');
        console.log('Foreign key checks disabled\n');
        const tempConfig = { ...database_1.dbConfig, namedPlaceholders: false, multipleStatements: true };
        const tempConnection = await promise_1.default.createConnection(tempConfig);
        try {
            await tempConnection.query(migrationSql);
            console.log('✅ Migration executed successfully');
        }
        catch (error) {
            console.warn('Migration warning:', error.message?.substring(0, 200) || error);
        }
        finally {
            await tempConnection.end();
        }
        await database_1.pool.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Foreign key checks re-enabled');
        const [tables] = await database_1.pool.execute('SHOW TABLES');
        console.log(`\n✅ Database setup complete! Tables created: ${tables.length}`);
        console.log('========================================');
    }
    catch (error) {
        console.error('Error running migrations:', error);
        throw error;
    }
};
exports.runMigrations = runMigrations;
const initializeCompleteSystem = async (req, res) => {
    try {
        const systemInitialized = await (0, exports.isSystemInitialized)();
        if (systemInitialized) {
            return res.status(400).json({
                success: false,
                message: 'System is already initialized. Cannot run complete initialization again.'
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
        let schemaExists = await (0, exports.checkDatabaseSchema)();
        if (!schemaExists) {
            console.log('Database schema not found. Running migrations...');
            await (0, exports.runMigrations)();
            console.log('Migrations completed successfully');
        }
        else {
            console.log('Database schema already exists');
        }
        const saltRounds = 10;
        const passwordHash = await bcryptjs_1.default.hash(password, saltRounds);
        const [roleResult] = await database_1.pool.execute('INSERT INTO roles (name, description, permissions, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())', ['Super Admin', 'System super administrator with all privileges', JSON.stringify(['*'])]);
        const superAdminRoleId = roleResult.insertId;
        const [userResult] = await database_1.pool.execute(`INSERT INTO users
       (email, password_hash, full_name, phone, role_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW())`, [email, passwordHash, fullName, phone || null, superAdminRoleId]);
        const userId = userResult.insertId;
        try {
            await database_1.pool.execute('UPDATE users SET must_change_password = 1 WHERE id = ?', [userId]);
        }
        catch (updateError) {
            console.log('Note: must_change_password column not available yet');
        }
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
            message: 'System initialized successfully. Database schema created and Super Admin created.',
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
        console.error('Complete system initialization error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during complete system initialization'
        });
    }
};
exports.initializeCompleteSystem = initializeCompleteSystem;
const checkSystemReadiness = async (req, res) => {
    try {
        const schemaExists = await (0, exports.checkDatabaseSchema)();
        const systemInitialized = await (0, exports.isSystemInitialized)();
        return res.json({
            success: true,
            data: {
                schemaExists,
                systemInitialized,
                readyForInitialization: schemaExists && !systemInitialized,
                readyForCompleteSetup: !schemaExists && !systemInitialized
            }
        });
    }
    catch (error) {
        console.error('Error checking system readiness:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking system readiness'
        });
    }
};
exports.checkSystemReadiness = checkSystemReadiness;
//# sourceMappingURL=complete-system-init.controller.js.map