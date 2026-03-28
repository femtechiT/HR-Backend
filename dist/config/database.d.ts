import mysql from 'mysql2/promise';
declare const dbConfig: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    waitForConnections: boolean;
    connectionLimit: number;
    queueLimit: number;
    enableKeepAlive: boolean;
    keepAliveInitialDelay: number;
    namedPlaceholders: boolean;
    multipleStatements: boolean;
    ssl: {
        rejectUnauthorized: boolean;
    };
} | {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    waitForConnections: true;
    connectionLimit: number;
    queueLimit: number;
    enableKeepAlive: true;
    keepAliveInitialDelay: number;
    namedPlaceholders: true;
    multipleStatements: true;
};
declare const pool: mysql.Pool;
export declare function initializeRedis(): Promise<void>;
declare const testConnection: () => Promise<void>;
export { pool, testConnection, dbConfig };
//# sourceMappingURL=database.d.ts.map