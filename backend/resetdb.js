const fs = require('fs');
const mysql = require('mysql2/promise');

async function run() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: 'localhost@123',
        multipleStatements: true
    });
    
    try {
        const sql = fs.readFileSync('dbschema.sql', 'utf8');
        console.log("Running schema script...");
        await pool.query(sql);
        console.log("Schema applied successfully.");
    } catch(err) {
        console.error("Schema apply failed:", err);
    }
    process.exit(0);
}
run();
