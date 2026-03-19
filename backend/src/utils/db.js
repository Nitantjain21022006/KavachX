import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URI,
  ssl: { rejectUnauthorized: false },
  max: 5,                  // Neon free tier has a low connection limit; keep this small
  idleTimeoutMillis: 30000, // Release idle connections after 30s
  connectionTimeoutMillis: 20000, // Increased to 20s to allow Neon serverless instances to wake up from cold start
});

// Log only ONCE on the very first successful connection, not on every pool checkout.
let _connected = false;
pool.on('connect', () => {
    if (!_connected) {
        _connected = true;
        console.log('✅ Connected to Neon PostgreSQL');
    }
});

pool.on('error', (err) => {
    console.error('❌ Neon PostgreSQL Pool Error:', err.message);
});

// Helper for single queries
export const query = (text, params) => pool.query(text, params);

export default pool;
