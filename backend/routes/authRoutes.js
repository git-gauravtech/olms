
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { auth } = require('../middleware/authMiddleware'); // Import auth middleware

// @route   POST api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
    const { fullName, email, password, role, department } = req.body;

    // Basic validation
    if (!fullName || !email || !password || !role) {
        return res.status(400).json({ msg: 'Please enter all required fields' });
    }
    if (password.length < 6) {
        return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
    }


    try {
        // Check if user already exists
        let [users] = await pool.query('SELECT email FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(400).json({ msg: 'User already exists with this email' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user into database
        const newUser = {
            fullName,
            email,
            passwordHash: hashedPassword,
            role,
            department: department || null
        };
        await pool.query('INSERT INTO users SET ?', newUser);

        res.status(201).json({ msg: 'User registered successfully. Please login.' });

    } catch (err) {
        console.error('Signup error:', err.message, err.stack);
        res.status(500).send('Server error during signup');
    }
});


// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body; 

    if (!email || !password) {
        return res.status(400).json({ msg: 'Please provide email and password' });
    }

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ msg: 'Invalid credentials (user not found)' });
        }

        const user = users[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials (password incorrect)' });
        }

        // User matched, role is taken from DB (user.role)
        const payload = {
            user: {
                id: user.id,
                role: user.role // Use role from database
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }, 
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: { 
                        id: user.id,
                        name: user.fullName,
                        email: user.email,
                        role: user.role, 
                        department: user.department
                    }
                });
            }
        );

    } catch (err) {
        console.error('Login error:', err.message, err.stack);
        res.status(500).send('Server error during login');
    }
});

// @route   PUT api/auth/change-password
// @desc    Change user's password
// @access  Private (requires authentication)
router.put('/change-password', auth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // From JWT payload set by auth middleware

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ msg: 'Please provide current and new passwords.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ msg: 'New password must be at least 6 characters long.' });
    }

    try {
        const [users] = await pool.query('SELECT passwordHash FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ msg: 'User not found.' }); // Should not happen if auth middleware worked
        }
        const user = users[0];

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Incorrect current password.' });
        }

        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET passwordHash = ? WHERE id = ?', [newPasswordHash, userId]);

        res.json({ msg: 'Password updated successfully.' });

    } catch (err) {
        console.error('Change password error:', err.message, err.stack);
        res.status(500).send('Server error while changing password.');
    }
});


module.exports = router;

    