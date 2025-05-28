
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // Added for serving static files
const pool = require('./config/db'); // Database connection pool
const { auth, isAdmin } = require('./middleware/authMiddleware'); // Import auth middleware

const authRoutes = require('./routes/authRoutes');
const labRoutes = require('./routes/labRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

// Serve static files from the frontend's root directory
// The '..' moves up from 'backend/' to the project root 'olms-main/'
app.use(express.static(path.join(__dirname, '..')));

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

// Simple Ping Pong for basic backend connectivity test
app.get('/api/ping', (req, res) => {
    console.log('[Backend] Received /api/ping request');
    res.json({ message: 'pong from backend OLMS API' });
});


// API Routes - all prefixed with /api
app.use('/api/auth', authRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/bookings', bookingRoutes);
// Admin routes are already protected with auth and isAdmin middleware within adminRoutes.js
// The base path /api/admin itself is also protected here for an additional layer.
app.use('/api/admin', auth, isAdmin, adminRoutes);

// For any other GET request not handled by static files or API, serve index.html (optional, for SPA-like behavior if needed)
// For a multi-page HTML app, this might not be strictly necessary if all HTML files are directly accessible.
// However, it's good for handling root path or if you evolve towards more client-side routing.
app.get(['/', '/index.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Serve other specific HTML files from the root for direct navigation
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'signup.html')));
app.get('/forgot_password.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'forgot_password.html')));
app.get('/reset_password.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'reset_password.html')));

// Serve dashboard HTML files
// This ensures that if someone types /dashboard/admin.html, it gets served.
// The express.static middleware above should handle paths like /dashboard/admin.html correctly as well
// but explicit routes can be added for clarity or specific handling if needed.
// For now, relying on express.static for these.

const PORT = process.env.PORT_BACKEND || 5001;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}. OLMS API is active.`);
    console.log(`Frontend is now served from http://localhost:${PORT}`);
    console.log(`Try: http://localhost:${PORT}/api/ping (for API) or http://localhost:${PORT} (for frontend app)`);
});

