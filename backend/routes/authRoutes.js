
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt =require('jsonwebtoken');
const pool = require('../config/db');
const dotenv = require('dotenv');
const crypto = require('crypto'); // For generating reset tokens

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
        console.error('Signup error:', error); // CRITICAL: Check backend console for this log!
        if (error.code === 'ER_NO_SUCH_TABLE') {
             return res.status(500).json({ message: 'Database table missing (e.g., Users table). Please ensure schema is applied.' });
        }
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return res.status(500).json({ message: 'Database connection refused. Please ensure the database server is running and accessible at the host specified in .env.' });
        }
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            return res.status(500).json({ message: 'Database access denied. Please check your database user and password in the .env file.' });
        }
        if (error.code === 'ER_BAD_DB_ERROR') {
            return res.status(500).json({ message: `Database '${process.env.DB_NAME || 'lablink_db'}' does not exist. Please create it or check DB_NAME in .env.` });
        }
        // Check for other common DB errors during INSERT, e.g., column constraint violations
        if (error.sqlMessage) { // More specific MySQL errors often have sqlMessage
             return res.status(500).json({ message: `Database error during signup: ${error.sqlMessage}. This often indicates a schema mismatch or data issue.`});
        }
        res.status(500).json({ message: 'Server error during signup. Please check the backend console logs for detailed error information.' });
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


// POST /api/auth/request-password-reset
router.post('/request-password-reset', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email address is required.' });
    }

    try {
        const [users] = await pool.query('SELECT user_id, email FROM Users WHERE email = ?', [email]);
        if (users.length === 0) {
            // Important: Do not reveal if an email exists or not for security reasons.
            // Send a generic success message in both cases.
            console.log(`Password reset requested for non-existent email: ${email}`);
            return res.status(200).json({ message: 'If your email address exists in our system, you will receive a password reset link shortly.' });
        }
        const user = users[0];

        // Generate a reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // Token expires in 1 hour

        // Store the token in the PasswordResets table
        // Ensure you have a PasswordResets table:
        // CREATE TABLE PasswordResets (
        //     reset_id INT AUTO_INCREMENT PRIMARY KEY,
        //     user_id INT NOT NULL,
        //     token VARCHAR(255) NOT NULL UNIQUE,
        //     expires_at DATETIME NOT NULL,
        //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        //     FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
        // );
        // Delete any existing tokens for this user to prevent multiple active tokens
        await pool.query('DELETE FROM PasswordResets WHERE user_id = ?', [user.user_id]);
        await pool.query('INSERT INTO PasswordResets (user_id, token, expires_at) VALUES (?, ?, ?)', [user.user_id, resetToken, expiresAt]);

        // Simulate sending email
        // In a real application, you would use an email service (e.g., SendGrid, Nodemailer)
        const resetLink = `http://localhost:8080/reset_password.html?token=${resetToken}`; // Adjust port/URL as needed
        console.log(`Password Reset Link for ${user.email}: ${resetLink}`); // For development/testing

        res.status(200).json({ message: 'If your email address exists in our system, you will receive a password reset link shortly.' });

    } catch (error) {
        console.error('Error requesting password reset:', error);
        // Generic error for client, specific error logged server-side
        if (error.code === 'ER_NO_SUCH_TABLE' && error.message.includes('PasswordResets')) {
            console.error("CRITICAL: PasswordResets table does not exist. Please create it.");
             return res.status(500).json({ message: 'Password reset system configuration error. Please contact support.' });
        }
        res.status(500).json({ message: 'An error occurred while processing your request.' });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    try {
        // Find the token in the PasswordResets table
        const [tokens] = await pool.query('SELECT * FROM PasswordResets WHERE token = ?', [token]);
        if (tokens.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired password reset token. Please request a new one.' });
        }
        const resetRecord = tokens[0];

        // Check if token has expired
        if (new Date(resetRecord.expires_at) < new Date()) {
            // Clean up expired token
            await pool.query('DELETE FROM PasswordResets WHERE reset_id = ?', [resetRecord.reset_id]);
            return res.status(400).json({ message: 'Password reset token has expired. Please request a new one.' });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update user's password
        await pool.query('UPDATE Users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?', [passwordHash, resetRecord.user_id]);

        // Delete the used token from PasswordResets table
        await pool.query('DELETE FROM PasswordResets WHERE reset_id = ?', [resetRecord.reset_id]);

        res.status(200).json({ message: 'Password has been reset successfully. You can now login with your new password.' });

    } catch (error) {
        console.error('Error resetting password:', error);
         if (error.code === 'ER_NO_SUCH_TABLE' && error.message.includes('PasswordResets')) {
            console.error("CRITICAL: PasswordResets table does not exist. Please create it.");
             return res.status(500).json({ message: 'Password reset system configuration error. Please contact support.' });
        }
        res.status(500).json({ message: 'An error occurred while resetting your password.' });
    }
});

module.exports = router;

    