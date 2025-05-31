
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db');
const { auth, isAdmin } = require('./middleware/authMiddleware');

const authRoutes = require('./routes/authRoutes');
const labRoutes = require('./routes/labRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const courseRoutes = require('./routes/courseRoutes'); 
const sectionRoutes = require('./routes/sectionRoutes'); 

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

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

app.get('/api/ping', (req, res) => {
    res.json({ message: 'pong from backend OLMS API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/courses', auth, isAdmin, courseRoutes); 
app.use('/api/sections', auth, sectionRoutes); 
app.use('/api/admin', auth, isAdmin, adminRoutes);

app.get(['/', '/index.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'signup.html')));
app.get('/forgot_password.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'forgot_password.html')));
app.get('/reset_password.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'reset_password.html')));

const PORT = process.env.PORT_BACKEND || 5001;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}. OLMS API is active.`);
    console.log(`Frontend is now served from http://localhost:${PORT}`);
});
    