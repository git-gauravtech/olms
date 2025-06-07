
const express = require('express');
const pool = require('../config/db');
const { auth, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/bookings?section_id= (for student to view schedule for a chosen section)
// OR GET /api/bookings (for admin to view all)
router.get('/', auth, async (req, res) => { // auth middleware populates req.user if token is valid
    const { section_id } = req.query;

    if (!req.user) { // If token was missing or invalid, auth middleware won't set req.user
        return res.status(401).json({ message: 'Authentication required to view bookings.' });
    }
    const userRole = req.user.role;

    try {
        if (section_id) {
            // Any authenticated user can fetch by section_id
            const [bookings] = await pool.query(
                `SELECT b.*, l.name as lab_name, l.room_number, u.full_name as user_name, c.name as course_name, s.name as section_name
                 FROM Bookings b
                 LEFT JOIN Labs l ON b.lab_id = l.lab_id
                 LEFT JOIN Users u ON b.user_id = u.user_id
                 LEFT JOIN Sections s ON b.section_id = s.section_id
                 LEFT JOIN Courses c ON s.course_id = c.course_id
                 WHERE b.section_id = ? ORDER BY b.start_time ASC`,
                [section_id]
            );
            return res.json(bookings);
        } else {
            // If no section_id, only admin can see all bookings
            if (userRole !== 'admin') { // Direct string comparison
                return res.status(403).json({ message: 'Access forbidden: Admins only for all bookings.' });
            }
            // Admin fetches all bookings
            const [allBookings] = await pool.query(
                `SELECT b.*, l.name as lab_name, u.full_name as user_name, c.name as course_name, s.name as section_name
                 FROM Bookings b
                 LEFT JOIN Labs l ON b.lab_id = l.lab_id
                 LEFT JOIN Users u ON b.user_id = u.user_id
                 LEFT JOIN Sections s ON b.section_id = s.section_id
                 LEFT JOIN Courses c ON s.course_id = c.course_id
                 ORDER BY b.start_time ASC`
            );
            return res.json(allBookings);
        }
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ message: 'Server error fetching bookings.' });
    }
});


// POST /api/auth/login - Placeholder for now
router.post('/login', async (req, res) => {
    // Login logic will be added here in a future step
    res.status(501).json({ message: 'Login endpoint not yet implemented.' });
});


// Example of a protected route for POSTING a booking (would need more fields from req.body)
// router.post('/', authorize(['faculty', 'admin']), async (req, res) => {
//     // ... logic to create a booking ...
//     // const { lab_id, section_id, start_time, end_time, purpose } = req.body;
//     // const userId = req.user.userId; 
//     // ...
// });

module.exports = router;
