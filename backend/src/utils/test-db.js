import pool from './db.js';

async function testConnection() {
  try {
    console.log('Testing connection to Neon DB...');
    const startTime = Date.now();
    const { rows } = await pool.query('SELECT NOW() as current_time');
    const endTime = Date.now();
    
    console.log('SUCCESS!');
    console.log('Database time:', rows[0].current_time);
    console.log('Query took:', endTime - startTime, 'ms');
    
    console.log('\nChecking tables...');
    const tables = ['users', 'alerts', 'events', 'otp_verifications', 'sectors'];
    for (const table of tables) {
      try {
        const { rowCount } = await pool.query(`SELECT 1 FROM ${table} LIMIT 1`);
        console.log(`- Table '${table}': OK (${rowCount} existing rows or empty)`);
      } catch (e) {
        console.error(`- Table '${table}': FAILED - ${e.message}`);
      }
    }
  } catch (error) {
    console.error('CONNECTION FAILED:', error.message);
  } finally {
    process.exit();
  }
}

testConnection();
