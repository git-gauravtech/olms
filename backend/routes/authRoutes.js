
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt =require('jsonwebtoken');
const pool = require('../config/db');
const dotenv = require('dotenv');

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;


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
    if (password.length < 6) { // Example: Basic password length validation
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
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
            course: (role === 'student') ? course || null : null, // This might store course name or ID. Schema dependent.
            section: (role === 'student') ? section || null : null, // This might store section name or ID. Schema dependent.
        };
        
        // Insert user into database
        const [result] = await pool.query('INSERT INTO Users SET ?', newUser);

        res.status(201).json({ message: 'User registered successfully!', userId: result.insertId });

    } catch (error) {
        console.error('Signup error:', error);
        if (error.code === 'ER_NO_SUCH_TABLE') {
             return res.status(500).json({ message: 'Database table missing. Please ensure schema is applied.' });
        }
        res.status(500).json({ message: 'Server error during signup.' });
    }
});


// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide both email and password.' });
    }

    try {
        const [users] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials. User not found.' });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials. Password incorrect.' });
        }

        // User matched, create JWT
        const payload = {
            userId: user.user_id,
            role: user.role,
            fullName: user.full_name,
            // Add other details you might want in the token, but keep it light
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour

        res.json({
            message: 'Login successful!',
            token,
            user: { // Send back some user info for the frontend
                userId: user.user_id,
                fullName: user.full_name,
                email: user.email,
                role: user.role,
                department: user.department,
                // Add other non-sensitive fields as needed by the frontend
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

module.exports = router;
