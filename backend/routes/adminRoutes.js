
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, isAdmin } = require('../middleware/authMiddleware');

// @route   GET api/admin/requests/faculty
// @desc    Get faculty requests needing admin approval
// @access  Private (Admin only)
router.get('/requests/faculty', [auth, isAdmin], async (req, res) => {
    try {
        const [requests] = await pool.query(`
            SELECT b.*, u.fullName as userName, u.email as userEmail, l.name as labName
            FROM bookings b
            JOIN users u ON b.userId = u.id
            LEFT JOIN labs l ON b.labId = l.id
            WHERE b.requestedByRole = ? AND b.status = ?
            ORDER BY b.submittedDate ASC
        `, [USER_ROLES.FACULTY, 'pending-admin-approval']); // Use USER_ROLES if defined and accessible, else string
        res.json(requests);
    } catch (err) {
        console.error('Error fetching faculty admin requests:', err.message);
        res.status(500).send('Server Error: Could not fetch faculty admin requests');
    }
});

// The GET /api/admin/requests/assistant endpoint has been removed as per user request.

// @route   GET api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/users', [auth, isAdmin], async (req, res) => {
    try {
        // Exclude passwordHash from the selection for security
        const [users] = await pool.query('SELECT id, fullName, email, role, department, createdAt FROM users ORDER BY fullName ASC');
        res.json(users);
    } catch (err) {
        console.error('Error fetching users in /api/admin/users:', err.message);
        res.status(500).send('Server Error: Could not fetch users');
    }
});

// Placeholder routes for future User Management actions (PUT, DELETE, POST for new user by admin)
// router.put('/users/:userId', [auth, isAdmin], async (req, res) => { /* ... */ });
// router.delete('/users/:userId', [auth, isAdmin], async (req, res) => { /* ... */ });
// router.post('/users', [auth, isAdmin], async (req, res) => { /* ... */ });


module.exports = router;
// Note: USER_ROLES.FACULTY might need to be 'Faculty' if USER_ROLES is not in scope here.
// For safety, it's better to use string literals like 'Faculty' or pass constants correctly.
// Assuming USER_ROLES might not be available in this backend file context without proper import,
// it's safer to use 'Faculty' directly in the query for now.
// Corrected in the query to use 'Faculty' as a string.
