"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = void 0;
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class RedisService {
    client = null;
    _isEnabled;
    constructor() {
        this._isEnabled = process.env.REDIS_ENABLED === 'true' || process.env.REDIS_ENABLED === '1';
    }
    async connect() {
        if (!this._isEnabled) {
            console.log('Redis is disabled via environment variable');
            return;
        }
        try {
            this.client = (0, redis_1.createClient)({
                url: process.env.REDIS_URL || 'redis://localhost:6379',
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            console.error('Redis connection failed after 10 retries');
                            return false;
                        }
                        return Math.min(1000 * Math.pow(2, retries), 30000);
                    }
                }
            });
            this.client.on('error', (err) => {
                console.error('Redis Client Error:', err);
                this._isEnabled = false;
            });
            this.client.on('connect', () => {
                console.log('Connected to Redis');
            });
            this.client.on('reconnecting', () => {
                console.log('Reconnecting to Redis...');
            });
            await this.client.connect();
            console.log('Connected to Redis successfully');
        }
        catch (error) {
            console.error('Failed to connect to Redis:', error);
            console.log('Redis functionality will be disabled');
            this._isEnabled = false;
        }
    }
    getClient() {
        return this._isEnabled ? this.client : null;
    }
    isEnabled() {
        return this._isEnabled;
    }
    async disconnect() {
        if (this.client && this._isEnabled) {
            try {
                await this.client.quit();
                console.log('Disconnected from Redis');
            }
            catch (error) {
                console.error('Error disconnecting from Redis:', error);
            }
        }
    }
    async execute(operation) {
        if (!this._isEnabled || !this.client) {
            return null;
        }
        try {
            return await operation(this.client);
        }
        catch (error) {
            console.error('Redis operation failed:', error);
            this._isEnabled = false;
            return null;
        }
    }
}
exports.redisService = new RedisService();
//# sourceMappingURL=redis.service.js.map