import { pool } from '../src/config/database';

async function checkSchema() {
  try {
    console.log('Checking indexes for leave_allocations...');
    const [indexes]: any = await pool.execute(`SHOW INDEX FROM leave_allocations`);
    console.table(indexes);

    console.log('\nChecking for duplicates (user_id, leave_type_id)...');
    const [rows]: any = await pool.execute(`
      SELECT user_id, leave_type_id, COUNT(*) as count 
      FROM leave_allocations 
      GROUP BY user_id, leave_type_id 
      HAVING count > 1
    `);

    if (rows.length > 0) {
      console.log(`Found ${rows.length} user/type combinations with duplicates.`);
    } else {
      console.log('No duplicates found.');
    }
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();
