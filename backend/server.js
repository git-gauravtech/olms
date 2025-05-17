
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db'); // Database connection pool

const authRoutes = require('./routes/authRoutes');
const labRoutes = require('./routes/labRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const bookingRoutes = require('./routes/bookingRoutes'); // Placeholder
const adminRoutes = require('./routes/adminRoutes'); // Placeholder

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
app.use('/api/auth', authRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/bookings', bookingRoutes); // Placeholder routes
app.use('/api/admin', adminRoutes); // Placeholder routes


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
