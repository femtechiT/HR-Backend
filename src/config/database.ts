import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { redisService } from '../services/redis.service';

dotenv.config();

// Parse connection string if provided (e.g., from TiDB Cloud)
// Format: mysql://user:password@host:port/database
const parseConnectionString = (connectionString?: string) => {
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
      database: url.pathname.slice(1), // Remove leading '/'
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      namedPlaceholders: true,
      multipleStatements: true,
      ssl: {
        rejectUnauthorized: true
      }
    };
  } catch (error) {
    console.error('Failed to parse connection string:', error);
    return null;
  }
};

// Database connection configuration
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
  multipleStatements: true,
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Initialize Redis connection
export async function initializeRedis(): Promise<void> {
  await redisService.connect();
}

// Test database connection
const testConnection = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (error: any) {
    console.warn('Warning: Database connection failed:', error.message);
    console.warn('Some features may not be available until the database is connected.');
  }
};

export { pool, testConnection, dbConfig };