import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URI,
  ssl: {
    rejectUnauthorized: false
  }
});


pool.on('connect', () => {
    console.log('✅ Connected to Neon PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Neon PostgreSQL Pool Error:', err.message);
});

// Helper for single queries
export const query = (text, params) => pool.query(text, params);


export default pool;
