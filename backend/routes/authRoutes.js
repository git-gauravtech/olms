
const express = require('express');
const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken'); // Not used for signup, but for login
const pool = require('../config/db');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    const {
        fullName, email, password, role, contactNumber,
        department, employeeId, enrollmentNumber, course, section
    } = req.body;

    // Basic validation
    if (!fullName || !email || !password || !role) {
        return res.status(400).json({ message: 'Please fill in all required fields (Full Name, Email, Password, Role).' });
    }

    try {
        // Check if user already exists
        const [existingUsers] = await pool.query('SELECT email FROM Users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Prepare data for insertion
        const newUser = {
            full_name: fullName,
            email: email,
            password_hash: passwordHash,
            role: role,
            contact_number: contactNumber || null,
            department: (role === 'faculty' || role === 'assistant') ? department || null : null,
            employee_id: (role === 'faculty' || role === 'assistant') ? employeeId || null : null,
            enrollment_number: (role === 'student') ? enrollmentNumber || null : null,
            course: (role === 'student') ? course || null : null,
            section: (role === 'student') ? section || null : null,
        };
        
        // Insert user into database
        const [result] = await pool.query('INSERT INTO Users SET ?', newUser);

        res.status(201).json({ message: 'User registered successfully!', userId: result.insertId });

    } catch (error) {
        console.error('Signup error:', error);
        // Check for specific SQL errors if needed, e.g., ER_NO_SUCH_TABLE
        if (error.code === 'ER_NO_SUCH_TABLE') {
             return res.status(500).json({ message: 'Database table missing. Please ensure schema is applied.' });
        }
        res.status(500).json({ message: 'Server error during signup.' });
    }
});


// POST /api/auth/login - Placeholder for now
router.post('/login', async (req, res) => {
    // Login logic will be added here in a future step
    res.status(501).json({ message: 'Login endpoint not yet implemented.' });
});

module.exports = router;
