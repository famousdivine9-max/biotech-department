import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export const testConnection = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL database connected successfully');
    client.release();
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err);
    process.exit(1);
  }
};

export default pool;
