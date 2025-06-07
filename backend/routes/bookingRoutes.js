
const express = require('express');
const pool = require('../config/db');
const { auth, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/bookings/my - Get bookings for the logged-in faculty member
router.get('/my', auth, authorize(['faculty', 'admin']), async (req, res) => { // Also allow admin to test this endpoint
    const userId = req.user.userId;

    try {
        const [bookings] = await pool.query(
            `SELECT b.*, l.name as lab_name, l.room_number, u.full_name as user_name, c.name as course_name, s.name as section_name
             FROM Bookings b
             LEFT JOIN Labs l ON b.lab_id = l.lab_id
             LEFT JOIN Users u ON b.user_id = u.user_id
             LEFT JOIN Sections s ON b.section_id = s.section_id
             LEFT JOIN Courses c ON s.course_id = c.course_id
             WHERE b.user_id = ? ORDER BY b.start_time ASC`,
            [userId]
        );
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching faculty-specific bookings:', error);
        res.status(500).json({ message: 'Server error fetching your bookings.' });
    }
});


// GET /api/bookings?section_id= (for student/public to view schedule for a chosen section)
// OR GET /api/bookings (for admin to view all)
router.get('/', auth, async (req, res) => { 
    const { section_id } = req.query;

    if (!req.user) { 
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
            if (userRole !== 'admin') { 
                return res.status(403).json({ message: 'Access forbidden: Admins only for all bookings view.' });
            }
            // Admin fetches all bookings
            const [allBookings] = await pool.query(
                `SELECT b.*, l.name as lab_name, l.room_number, u.full_name as user_name, c.name as course_name, s.name as section_name
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


// POST /api/auth/login - This was a placeholder and should not be in bookingRoutes.js
// It is correctly located in authRoutes.js. I will remove it from here.
// router.post('/login', async (req, res) => {
//     res.status(501).json({ message: 'Login endpoint not yet implemented.' });
// });


// Example of a protected route for POSTING a booking 
// router.post('/', auth, authorize(['faculty', 'admin']), async (req, res) => {
// const { lab_id, section_id, start_time, end_time, purpose, status } = req.body;
// const userId = req.user.userId; // User who is booking
// try {
// // Add validation for overlapping bookings, lab availability, etc.
// const [result] = await pool.query(
// 'INSERT INTO Bookings (lab_id, user_id, section_id, start_time, end_time, purpose, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
// [lab_id, userId, section_id, start_time, end_time, purpose, status || 'Scheduled']
// );
// res.status(201).json({ message: 'Booking created successfully', bookingId: result.insertId });
// } catch (error) {
// console.error('Error creating booking:', error);
// res.status(500).json({ message: 'Server error creating booking.' });
// }
// });

module.exports = router;
