"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConfig = exports.testConnection = exports.pool = void 0;
exports.initializeRedis = initializeRedis;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
const redis_service_1 = require("../services/redis.service");
dotenv_1.default.config();
const parseConnectionString = (connectionString) => {
    if (!connectionString) {
        return null;
    }
    try {
        const url = new URL(connectionString);
        return {
            host: url.hostname,
            port: parseInt(url.port || '4000'),
            user: url.username,
            password: decodeURIComponent(url.password),
            database: url.pathname.slice(1),
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
            namedPlaceholders: true,
            ssl: {
                rejectUnauthorized: true
            }
        };
    }
    catch (error) {
        console.error('Failed to parse connection string:', error);
        return null;
    }
};
const dbConfig = parseConnectionString(process.env.DATABASE_URL) || {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hr_management_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    namedPlaceholders: true,
};
exports.dbConfig = dbConfig;
const pool = promise_1.default.createPool(dbConfig);
exports.pool = pool;
async function initializeRedis() {
    await redis_service_1.redisService.connect();
}
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully');
        connection.release();
    }
    catch (error) {
        console.warn('Warning: Database connection failed:', error.message);
        console.warn('Some features may not be available until the database is connected.');
    }
};
exports.testConnection = testConnection;
//# sourceMappingURL=database.js.map