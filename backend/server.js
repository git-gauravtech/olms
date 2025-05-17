
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db'); // Database connection pool

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes (adjust for production)
app.use(express.json()); // Parse JSON request bodies

// Test DB Connection
async function testDbConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('MySQL Connected successfully!');
        connection.release();
    } catch (error) {
        console.error('Error connecting to MySQL:', error.stack);
    }
}
testDbConnection();

// Basic Route
app.get('/', (req, res) => {
    res.send('Optimized Lab Management System Backend API Running!');
});

// API Routes
// Example: app.use('/api/auth', require('./routes/authRoutes'));
// Example: app.use('/api/labs', require('./routes/labRoutes'));


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});

    