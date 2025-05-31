
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db'); // MySQL connection pool
const { auth, isAdmin } = require('./middleware/authMiddleware'); // Auth middleware

// --- Route Imports ---
const authRoutes = require('./routes/authRoutes');
const labRoutes = require('./routes/labRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const courseRoutes = require('./routes/courseRoutes'); 
const sectionRoutes = require('./routes/sectionRoutes'); 

const app = express();

// --- Core Middleware ---
// Enable Cross-Origin Resource Sharing
app.use(cors());
// Parse JSON request bodies
app.use(express.json());
// Serve static files (HTML, CSS, JS) from the project's root directory
app.use(express.static(path.join(__dirname, '..')));

// --- Database Connection Test ---
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

// --- Basic Ping Route ---
app.get('/api/ping', (req, res) => {
    res.json({ message: 'pong from backend OLMS API' });
});

// --- API Route Definitions ---
app.use('/api/auth', authRoutes); // Authentication routes (login, signup, password reset)
app.use('/api/labs', labRoutes); // Lab management routes (CRUD labs, seat statuses)
app.use('/api/equipment', equipmentRoutes); // Equipment management routes
app.use('/api/bookings', bookingRoutes); // Booking management routes
app.use('/api/courses', auth, isAdmin, courseRoutes); // Course management routes (Admin only)
app.use('/api/sections', auth, sectionRoutes); // Section management routes (Admin CRUD, Faculty read)
app.use('/api/admin', auth, isAdmin, adminRoutes); // Admin-specific routes (user management, DAA triggers, etc.)

// --- Frontend Page Serving ---
// Serve the main login page
app.get(['/', '/index.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});
// Serve other auth-related static HTML pages
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'signup.html')));
app.get('/forgot_password.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'forgot_password.html')));
app.get('/reset_password.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'reset_password.html')));

// --- Server Initialization ---
const PORT = process.env.PORT_BACKEND || 5001;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}. OLMS API is active.`);
    console.log(`Frontend is now served from http://localhost:${PORT}`);
});
    