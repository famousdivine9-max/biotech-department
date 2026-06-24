import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'biotech_portal',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: '+00:00',
  charset: 'utf8mb4',
});

export const testConnection = async (): Promise<void> => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL database connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection error:', err);
    process.exit(1);
  }
};

export default pool;
