
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env file

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lablink_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection (optional, but good for diagnostics)
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Successfully connected to the database.');
        connection.release();
    } catch (error) {
        console.error('Error connecting to the database:', error.message);
        if (error.code === 'ER_BAD_DB_ERROR') {
            console.error(`Database '${process.env.DB_NAME}' does not exist. Please create it.`);
        } else if (error.code === 'ECONNREFUSED') {
            console.error('Database connection refused. Is the MySQL server running and accessible?');
        }
    }
}

// testConnection(); // Uncomment to test connection on server start

module.exports = pool;
