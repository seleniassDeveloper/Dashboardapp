import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function clearLocks() {
  try {
    await client.connect();
    console.log("Connected to Neon DB. Clearing advisory locks...");
    
    // Find processes holding advisory locks
    const res = await client.query(`
      SELECT pid FROM pg_locks WHERE locktype = 'advisory';
    `);
    
    console.log(`Found ${res.rows.length} processes holding advisory locks.`);
    
    for (const row of res.rows) {
      console.log(`Terminating process ${row.pid}...`);
      await client.query(`SELECT pg_terminate_backend(${row.pid});`);
    }
    
    console.log("Advisory locks cleared successfully!");
  } catch (err) {
    console.error("Error clearing locks:", err);
  } finally {
    await client.end();
  }
}

clearLocks();
