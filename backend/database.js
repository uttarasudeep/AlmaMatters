const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'localhost@123',
  database: 'almamatters',
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