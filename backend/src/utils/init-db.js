import fs from 'fs';
import path from 'path';
import pool from './db.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDb() {
    try {
        console.log('🚀 Starting Database Initialization...');
        
        const sqlPath = path.join(__dirname, '../../..', 'my.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon, but filter out empty statements
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`Executing ${statements.length} SQL statements...`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            const snippet = statement.substring(0, 50).replace(/\n/g, ' ') + '...';
            console.log(`[${i+1}/${statements.length}] Executing: ${snippet}`);
            await pool.query(statement);
        }
        
        console.log('✅ Database initialized successfully!');
        
        const { rows } = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        console.log('\nFinal Table List:');
        rows.forEach(row => console.log(`- ${row.table_name}`));

    } catch (err) {
        console.error('❌ Database Initialization Failed:', err.message);
        if (err.detail) console.error('Detail:', err.detail);
    } finally {
        // Ensure pool is closed before exiting
        await pool.end();
        process.exit();
    }
}


initDb();
