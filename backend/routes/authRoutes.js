
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // For token generation
const pool = require('../config/db');
const { auth } = require('../middleware/authMiddleware');

// @route   POST api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
    const { fullName, email, password, role, department } = req.body;

    if (!fullName || !email || !password || !role) {
        return res.status(400).json({ msg: 'Please enter all required fields' });
    }
    if (password.length < 6) {
        return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
    }

    try {
        let [users] = await pool.query('SELECT email FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(400).json({ msg: 'User already exists with this email' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

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

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials (password incorrect)' });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role // Role from database
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }, // Use JWT_EXPIRES_IN from .env
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
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ msg: 'Please provide current and new passwords.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ msg: 'New password must be at least 6 characters long.' });
    }

    try {
        const [users] = await pool.query('SELECT passwordHash FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ msg: 'User not found.' });
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

// @route   POST api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ msg: 'Email is required.' });
    }

    try {
        const [users] = await pool.query('SELECT id, email FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            // Still send a generic message to prevent email enumeration
            console.log(`Password reset requested for non-existent email: ${email}`);
            return res.json({ msg: 'If an account with that email exists, a password reset link has been sent.' });
        }
        const user = users[0];

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex'); // Store hashed token
        const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

        await pool.query(
            'UPDATE users SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE id = ?',
            [hashedToken, resetTokenExpires, user.id]
        );

        // In a real app, you would send an email here.
        // For this project, we log the token and link.
        const resetUrl = `http://localhost:9002/reset_password.html?token=${resetToken}`; // Port for frontend
        console.log('------------------------------------');
        console.log('PASSWORD RESET REQUESTED');
        console.log(`User: ${user.email} (ID: ${user.id})`);
        console.log(`Reset Token (raw, send this in URL): ${resetToken}`);
        console.log(`Reset URL (for user): ${resetUrl}`);
        console.log('------------------------------------');
        // IMPORTANT: The resetToken in the URL is the raw one. The DB stores the hashed one.

        // Return the raw token for automatic redirection in this simulated environment
        res.json({ 
            msg: 'If an account with that email exists, a password reset link has been sent.',
            resetToken: resetToken // For frontend auto-redirect simulation
        });

    } catch (err) {
        console.error('Forgot password error:', err.message, err.stack);
        res.status(500).json({ msg: 'Server error while processing forgot password request.' });
    }
});


// @route   POST api/auth/reset-password
// @desc    Reset password using token
// @access  Public
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ msg: 'Token and new password are required.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ msg: 'New password must be at least 6 characters long.' });
    }

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const [users] = await pool.query(
            'SELECT id FROM users WHERE resetPasswordToken = ? AND resetPasswordExpires > NOW()',
            [hashedToken]
        );

        if (users.length === 0) {
            return res.status(400).json({ msg: 'Password reset token is invalid or has expired.' });
        }
        const user = users[0];

        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        await pool.query(
            'UPDATE users SET passwordHash = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE id = ?',
            [newPasswordHash, user.id]
        );

        res.json({ msg: 'Password has been reset successfully. You can now login.' });

    } catch (err) {
        console.error('Reset password error:', err.message, err.stack);
        res.status(500).json({ msg: 'Server error while resetting password.' });
    }
});


module.exports = router;
