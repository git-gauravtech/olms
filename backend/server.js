
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db'); // Database connection pool
const { auth, isAdmin } = require('./middleware/authMiddleware'); // Import auth middleware

const authRoutes = require('./routes/authRoutes');
const labRoutes = require('./routes/labRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes (adjust for production)
app.use(express.json()); // Parse JSON request bodies

// Test DB Connection
async function testDbConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('MySQL Connected successfully to database:', connection.config.database);
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

// Simple Ping Pong for basic backend connectivity test
app.get('/api/ping', (req, res) => {
    console.log('[Backend] Received /api/ping request');
    res.json({ message: 'pong from backend OLMS API' });
});


// API Routes
app.use('/api/auth', authRoutes); 

// Labs
app.use('/api/labs', labRoutes); 

// Equipment
app.use('/api/equipment', equipmentRoutes); 

// Bookings
app.use('/api/bookings', bookingRoutes); 

// Admin: All routes need Admin role
app.use('/api/admin', auth, isAdmin, adminRoutes);


const PORT = process.env.PORT_BACKEND || 5001; 
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}. OLMS API is active.`);
    console.log(`Try: http://localhost:${PORT}/api/ping`);
});
