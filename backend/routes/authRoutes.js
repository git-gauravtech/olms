
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// @route   POST api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
    const { fullName, email, password, role, department } = req.body;

    // Basic validation (can be expanded with a library like Joi or express-validator)
    if (!fullName || !email || !password || !role) {
        return res.status(400).json({ msg: 'Please enter all required fields' });
    }

    try {
        // Check if user already exists
        let [users] = await pool.query('SELECT email FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(400).json({ msg: 'User already exists with this email' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10); // process.env.BCRYPT_SALT_ROUNDS
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

        // For simplicity, not returning JWT on signup, user should login after.
        res.status(201).json({ msg: 'User registered successfully. Please login.' });

    } catch (err) {
        console.error('Signup error:', err.message);
        res.status(500).send('Server error during signup');
    }
});


// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ msg: 'Please provide email, password, and role' });
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

        // Check role (important: frontend sends role, backend should verify if it matches stored role)
        if (user.role !== role) {
             return res.status(400).json({ msg: `Login role (${role}) does not match stored role for this user (${user.role}).` });
        }

        // User matched, create JWT payload
        const payload = {
            user: {
                id: user.id,
                role: user.role
                // Add other fields you might want in the token, but keep it minimal
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 3600 * 24 }, // 24 hours (adjust as needed)
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: { // Send back some user info for the frontend
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
        console.error('Login error:', err.message);
        res.status(500).send('Server error during login');
    }
});

module.exports = router;

    