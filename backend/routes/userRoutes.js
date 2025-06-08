
const express = require('express');
const pool = require('../config/db');
const { auth, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/users - Get all users (Admin only)
router.get('/', auth, authorize(['admin']), async (req, res) => {
    try {
        // Select relevant fields. Be careful not to expose password_hash.
        const [users] = await pool.query(
            `SELECT user_id, full_name, email, role, contact_number, 
                    department, employee_id, enrollment_number, course, section, 
                    created_at, updated_at 
             FROM Users 
             ORDER BY full_name ASC`
        );
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error fetching users.' });
    }
});

// Future: Add routes for admin to update user roles/details or deactivate accounts
// PUT /api/users/:userId (Admin only)
// DELETE /api/users/:userId (Admin only) - or a PATCH for deactivation

module.exports = router;
