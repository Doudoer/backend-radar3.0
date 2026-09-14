import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 8889),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'radar_v3',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    return rows;
  } catch (error) {
    console.warn('No se pudo conectar a MySQL:', error);
    return null;
  }
}

export default pool;
