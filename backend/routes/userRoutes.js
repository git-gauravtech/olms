
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { auth, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/users - Get all users (Admin only)
router.get('/', auth, authorize(['admin']), async (req, res) => {
    try {
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

// PUT /api/users/:userId - Update user details (Admin only)
router.put('/:userId', auth, authorize(['admin']), async (req, res) => {
    const { userId } = req.params;
    const { 
        fullName, role, contactNumber, department, employeeId, 
        enrollmentNumber, course, section 
    } = req.body;

    // Basic validation
    if (!fullName || !role) {
        return res.status(400).json({ message: 'Full name and role are required.' });
    }

    try {
        // Ensure email and password are not updated here for security by admin
        const fieldsToUpdate = {
            full_name: fullName,
            role: role,
            contact_number: contactNumber || null,
            department: (role === 'faculty' || role === 'assistant') ? department || null : null,
            employee_id: (role === 'faculty' || role === 'assistant') ? employeeId || null : null,
            enrollment_number: (role === 'student') ? enrollmentNumber || null : null,
            course: (role === 'student') ? course || null : null,
            section: (role === 'student') ? section || null : null,
            updated_at: new Date()
        };

        const [result] = await pool.query('UPDATE Users SET ? WHERE user_id = ?', [fieldsToUpdate, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found or no changes made.' });
        }

        const [updatedUser] = await pool.query('SELECT user_id, full_name, email, role, contact_number, department, employee_id, enrollment_number, course, section, created_at, updated_at FROM Users WHERE user_id = ?', [userId]);
        res.json({ message: 'User updated successfully!', user: updatedUser[0] });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error updating user.' });
    }
});

// DELETE /api/users/:userId - Delete a user (Admin only)
router.delete('/:userId', auth, authorize(['admin']), async (req, res) => {
    const { userId } = req.params;

    if (req.user.userId == userId) {
        return res.status(400).json({ message: 'Admin cannot delete their own account through this interface.' });
    }

    try {
        // Consider implications: what happens to bookings by this user?
        // For now, direct delete. Schema might need ON DELETE SET NULL or CASCADE for bookings.user_id
        const [result] = await pool.query('DELETE FROM Users WHERE user_id = ?', [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Error deleting user:', error);
        // Check for foreign key constraint errors if any
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(400).json({ message: 'Cannot delete user. They have associated records (e.g., bookings). Please reassign or delete related records first.' });
        }
        res.status(500).json({ message: 'Server error deleting user.' });
    }
});


// POST /api/users/change-password - Change current user's password
router.post('/change-password', auth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    try {
        const [users] = await pool.query('SELECT password_hash FROM Users WHERE user_id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found.' }); // Should not happen if auth middleware works
        }
        const user = users[0];

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password.' });
        }

        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE Users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?', [newPasswordHash, userId]);

        res.json({ message: 'Password changed successfully.' });

    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Server error changing password.' });
    }
});


module.exports = router;
