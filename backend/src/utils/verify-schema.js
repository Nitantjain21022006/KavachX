import pool from './db.js';

async function verifySchema() {
  try {
    const { rows } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('--- Database Tables ---');
    if (rows.length === 0) {
      console.log('NO TABLES FOUND! You need to run the schema in my.sql.');
    } else {
      rows.forEach(row => console.log(`- ${row.table_name}`));
    }
    
    console.log('\n--- Checking for users table structure ---');
    try {
      const { rows: columns } = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
      `);
      columns.forEach(col => console.log(`  ${col.column_name}: ${col.data_type}`));
    } catch (usersErr) {
      console.error('Error checking users table:', usersErr.message);
    }

  } catch (err) {
    console.error('DATABASE CONNECTIVITY ERROR:', err.message);
  } finally {
    process.exit();
  }
}

verifySchema();
