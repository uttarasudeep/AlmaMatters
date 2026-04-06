require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'localhost@123',
  database: process.env.DB_NAME || 'almamatters',
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
});

// Test the connection
pool.getConnection((err, conn) => {
  if (err) {
    console.error('MySQL pool connection failed:', err.message);
  } else {
    console.log('MySQL Pool Connected');
    conn.release();
  }
});

// Export the promise pool
module.exports = pool.promise();