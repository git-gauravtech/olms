
const express = require('express');
const pool = require('../config/db');
const { auth, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Helper function to check for overlapping bookings
async function checkOverlappingBookings(lab_id, start_time, end_time, exclude_booking_id = null) {
    const startTimeObj = new Date(start_time);
    const endTimeObj = new Date(end_time);

    let query = `
        SELECT booking_id FROM Bookings 
        WHERE lab_id = ? 
        AND (
            (? < end_time AND ? > start_time) OR -- New booking overlaps existing
            (start_time < ? AND end_time > ?) OR -- Existing booking overlaps new
            (start_time = ? AND end_time = ?)    -- Exact same slot
        )
    `;
    const params = [lab_id, startTimeObj, startTimeObj, endTimeObj, endTimeObj, startTimeObj, endTimeObj];

    if (exclude_booking_id) {
        query += ` AND booking_id != ?`;
        params.push(exclude_booking_id);
    }

    const [overlappingBookings] = await pool.query(query, params);
    return overlappingBookings.length > 0;
}


// POST /api/bookings - Create a new booking (Admin only)
router.post('/', auth, authorize(['admin']), async (req, res) => {
    const { lab_id, user_id, section_id, date, start_time_str, end_time_str, purpose, status } = req.body;
    const adminCreatingBookingId = req.user.userId; // Admin who is creating this

    // Validate required fields
    if (!lab_id || !date || !start_time_str || !end_time_str) {
        return res.status(400).json({ message: 'Lab, date, start time, and end time are required.' });
    }

    // Combine date and time strings to create full DATETIME objects
    const start_time = `${date}T${start_time_str}:00`; // Assuming time is HH:mm
    const end_time = `${date}T${end_time_str}:00`;

    // Basic validation for times
    if (new Date(start_time) >= new Date(end_time)) {
        return res.status(400).json({ message: 'End time must be after start time.' });
    }

    try {
        // Check for overlapping bookings
        const isOverlapping = await checkOverlappingBookings(lab_id, start_time, end_time);
        if (isOverlapping) {
            return res.status(409).json({ message: 'This time slot is already booked for the selected lab or overlaps with an existing booking.' });
        }

        const [result] = await pool.query(
            'INSERT INTO Bookings (lab_id, user_id, section_id, start_time, end_time, purpose, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [lab_id, user_id || null, section_id || null, start_time, end_time, purpose || null, status || 'Scheduled']
        );
        
        const newBookingId = result.insertId;
        const [newBooking] = await pool.query(
            `SELECT b.*, l.name as lab_name, l.room_number, 
                    u.full_name as user_name, 
                    s.name as section_name, c.name as course_name, c.course_id as section_course_id
             FROM Bookings b
             LEFT JOIN Labs l ON b.lab_id = l.lab_id
             LEFT JOIN Users u ON b.user_id = u.user_id
             LEFT JOIN Sections s ON b.section_id = s.section_id
             LEFT JOIN Courses c ON s.course_id = c.course_id
             WHERE b.booking_id = ?`, [newBookingId]
        );

        res.status(201).json({ 
            message: 'Booking created successfully!', 
            booking: newBooking[0]
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ message: 'Invalid Lab ID, User ID, or Section ID provided.' });
        }
        res.status(500).json({ message: 'Server error creating booking.' });
    }
});


// GET /api/bookings/my - Get bookings for the logged-in faculty member
router.get('/my', auth, authorize(['faculty', 'admin']), async (req, res) => { // Also allow admin to test this endpoint
    const userId = req.user.userId;

    try {
        const [bookings] = await pool.query(
            `SELECT b.*, l.name as lab_name, l.room_number, 
                    u.full_name as user_name, 
                    s.name as section_name, c.name as course_name, c.course_id as section_course_id
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
        let query = `
            SELECT b.*, l.name as lab_name, l.room_number, 
                   u.full_name as user_name, 
                   s.name as section_name, c.name as course_name, c.course_id as section_course_id
            FROM Bookings b
            LEFT JOIN Labs l ON b.lab_id = l.lab_id
            LEFT JOIN Users u ON b.user_id = u.user_id
            LEFT JOIN Sections s ON b.section_id = s.section_id
            LEFT JOIN Courses c ON s.course_id = c.course_id
        `;
        const params = [];

        if (section_id) {
            // Any authenticated user can fetch by section_id
            query += ` WHERE b.section_id = ? ORDER BY b.start_time ASC`;
            params.push(section_id);
        } else {
            // If no section_id, only admin can see all bookings
            if (userRole !== 'admin') { 
                return res.status(403).json({ message: 'Access forbidden: Admins only for all bookings view.' });
            }
            query += ` ORDER BY b.start_time ASC`;
        }
        
        const [bookings] = await pool.query(query, params);
        return res.json(bookings);

    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ message: 'Server error fetching bookings.' });
    }
});


// PUT /api/bookings/:bookingId - Update an existing booking (Admin only)
router.put('/:bookingId', auth, authorize(['admin']), async (req, res) => {
    const { bookingId } = req.params;
    const { lab_id, user_id, section_id, date, start_time_str, end_time_str, purpose, status } = req.body;

    if (!lab_id || !date || !start_time_str || !end_time_str) {
        return res.status(400).json({ message: 'Lab, date, start time, and end time are required for update.' });
    }
    const start_time = `${date}T${start_time_str}:00`;
    const end_time = `${date}T${end_time_str}:00`;

    if (new Date(start_time) >= new Date(end_time)) {
        return res.status(400).json({ message: 'End time must be after start time.' });
    }

    try {
        // Check for overlapping bookings, excluding the current one
        const isOverlapping = await checkOverlappingBookings(lab_id, start_time, end_time, bookingId);
        if (isOverlapping) {
            return res.status(409).json({ message: 'This time slot is already booked for the selected lab or overlaps with an existing booking.' });
        }

        const [result] = await pool.query(
            'UPDATE Bookings SET lab_id = ?, user_id = ?, section_id = ?, start_time = ?, end_time = ?, purpose = ?, status = ? WHERE booking_id = ?',
            [lab_id, user_id || null, section_id || null, start_time, end_time, purpose || null, status || 'Scheduled', bookingId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Booking not found or no changes made.' });
        }
        
        const [updatedBooking] = await pool.query(
             `SELECT b.*, l.name as lab_name, l.room_number, 
                     u.full_name as user_name, 
                     s.name as section_name, c.name as course_name, c.course_id as section_course_id
             FROM Bookings b
             LEFT JOIN Labs l ON b.lab_id = l.lab_id
             LEFT JOIN Users u ON b.user_id = u.user_id
             LEFT JOIN Sections s ON b.section_id = s.section_id
             LEFT JOIN Courses c ON s.course_id = c.course_id
             WHERE b.booking_id = ?`, [bookingId]
        );

        res.json({ message: 'Booking updated successfully!', booking: updatedBooking[0] });
    } catch (error) {
        console.error('Error updating booking:', error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ message: 'Invalid Lab ID, User ID, or Section ID provided for update.' });
        }
        res.status(500).json({ message: 'Server error updating booking.' });
    }
});

// DELETE /api/bookings/:bookingId - Delete a booking (Admin only)
router.delete('/:bookingId', auth, authorize(['admin']), async (req, res) => {
    const { bookingId } = req.params;

    try {
        // Before deleting booking, check if it's referenced in LabChangeRequests
        const [requests] = await pool.query('SELECT request_id FROM LabChangeRequests WHERE booking_id = ?', [bookingId]);
        if (requests.length > 0) {
            // The schema has ON DELETE CASCADE for LabChangeRequests.booking_id, so this is handled by DB.
            // Optionally, delete explicitly or warn if cascade isn't set.
        }

        const [result] = await pool.query('DELETE FROM Bookings WHERE booking_id = ?', [bookingId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        res.json({ message: 'Booking deleted successfully.' });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ message: 'Server error deleting booking.' });
    }
});


module.exports = router;
