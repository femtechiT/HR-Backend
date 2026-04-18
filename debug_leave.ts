import { pool } from './src/config/database';
import { CacheService } from './src/services/cache.service';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  try {
    const userId = 1;
    console.log(`--- Checking User ${userId} ---`);

    // 1. Check Database
    const [rows]: any = await pool.execute('SELECT * FROM leave_allocations WHERE user_id = ?', [userId]);
    console.log('Database Allocations:', JSON.stringify(rows, null, 2));

    // 2. Check Cache
    const cacheKey = `leave_allocations:user:${userId}`;
    const cached = await CacheService.get(cacheKey);
    console.log('Cached Allocations:', JSON.stringify(cached, null, 2));

    // 3. Check Leave Types
    const [types]: any = await pool.execute('SELECT id, name FROM leave_types');
    console.log('Leave Types:', JSON.stringify(types, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
