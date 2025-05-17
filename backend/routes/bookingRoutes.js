
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, isAdmin } = require('../middleware/authMiddleware');

// @route   GET api/bookings
// @desc    Get all bookings (Admin view, with filters)
// @access  Private (Admin only)
router.get('/', [auth, isAdmin], async (req, res) => {
    // TODO: Implement filtering by date, labId, status
    // const { date, labId, status } = req.query;
    try {
        // Placeholder: Fetch all bookings, join with users and labs for more info
        const [bookings] = await pool.query(`
            SELECT b.*, u.fullName as userName, u.email as userEmail, l.name as labName 
            FROM bookings b
            JOIN users u ON b.userId = u.id
            JOIN labs l ON b.labId = l.id
            ORDER BY b.date DESC, b.timeSlotId ASC
        `);
        res.json(bookings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error: Could not fetch bookings');
    }
});

// @route   GET api/bookings/my
// @desc    Get bookings for the currently logged-in user
// @access  Private
router.get('/my', auth, async (req, res) => {
    try {
        // Placeholder: Fetch bookings for req.user.id
        const [myBookings] = await pool.query(`
            SELECT b.*, l.name as labName 
            FROM bookings b
            JOIN labs l ON b.labId = l.id
            WHERE b.userId = ? 
            ORDER BY b.date DESC, b.timeSlotId ASC
        `, [req.user.id]);
        res.json(myBookings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error: Could not fetch user bookings');
    }
});

// @route   POST api/bookings
// @desc    Create a new booking or booking request
// @access  Private (Faculty, Assistant)
router.post('/', auth, async (req, res) => {
    const { labId, date, timeSlotId, purpose, equipmentIds, batchIdentifier } = req.body;
    const userId = req.user.id;
    const requestedByRole = req.user.role; // Role from JWT payload

    // Basic validation
    if (!labId || !date || !timeSlotId || !purpose) {
        return res.status(400).json({ msg: 'Please provide all required booking fields (lab, date, time, purpose)' });
    }

    // TODO: Add more validation (date format, time slot validity, lab existence, equipment existence)
    // TODO: Check for booking conflicts before inserting

    let status = 'pending'; // Default status
    if (requestedByRole === 'Faculty') { // Assuming 'Faculty' role can book directly
        status = 'booked';
    } else if (requestedByRole === 'Assistant') { // Assistants submit requests
        status = 'pending';
        if (!batchIdentifier) {
             // return res.status(400).json({ msg: 'Batch identifier is required for Assistant requests' });
             // For now, let's make it optional to align with frontend flexibility
        }
    } else {
        // Other roles might not be allowed to create bookings directly this way
        return res.status(403).json({ msg: 'Your role is not authorized to create bookings directly.' });
    }
    
    try {
        const newBooking = {
            labId: parseInt(labId),
            userId,
            date,
            timeSlotId,
            purpose,
            equipmentIds: equipmentIds ? JSON.stringify(equipmentIds) : null, // Store as JSON string
            status,
            requestedByRole,
            batchIdentifier: batchIdentifier || null,
            submittedDate: new Date()
        };

        // Check for existing booked slot
        const [conflictingBookings] = await pool.query(
            'SELECT * FROM bookings WHERE labId = ? AND date = ? AND timeSlotId = ? AND status = ?',
            [newBooking.labId, newBooking.date, newBooking.timeSlotId, 'booked']
        );

        if (conflictingBookings.length > 0 && status === 'booked') {
            return res.status(409).json({ msg: 'This slot is already booked. Please choose another time or lab.'});
        }
        
        const [result] = await pool.query('INSERT INTO bookings SET ?', newBooking);
        
        const [createdBooking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [result.insertId]);
        res.status(201).json(createdBooking[0]);

    } catch (err) {
        console.error('Error creating booking:', err.message);
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ msg: 'Invalid labId or userId. Referenced lab or user does not exist.' });
        }
        res.status(500).send('Server Error');
    }
});


// @route   PUT api/bookings/:bookingId/status
// @desc    Update booking status (e.g., approve/reject by Admin)
// @access  Private (Admin only)
router.put('/:bookingId/status', [auth, isAdmin], async (req, res) => {
    const { status } = req.body;
    const bookingId = req.params.bookingId;

    if (!status) {
        return res.status(400).json({ msg: 'Status is required' });
    }
    // TODO: Validate status against allowed values ('booked', 'rejected', 'cancelled', etc.)

    try {
        const [booking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
        if(booking.length === 0) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        // Logic for approving a pending request - check for conflicts if status is 'booked'
        if (status === 'booked' && booking[0].status === 'pending') {
             const [conflictingBookings] = await pool.query(
                'SELECT * FROM bookings WHERE labId = ? AND date = ? AND timeSlotId = ? AND status = ? AND id != ?',
                [booking[0].labId, booking[0].date, booking[0].timeSlotId, 'booked', bookingId]
            );
            if (conflictingBookings.length > 0) {
                return res.status(409).json({ msg: 'Cannot approve: This slot is already booked by another user. Please resolve the conflict.' });
            }
        }

        await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingId]);
        
        const [updatedBooking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
        res.json(updatedBooking[0]);
    } catch (err) {
        console.error('Error updating booking status:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/bookings/:bookingId
// @desc    Cancel/delete a booking
// @access  Private (Owner or Admin)
router.delete('/:bookingId', auth, async (req, res) => {
    const bookingId = req.params.bookingId;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const [booking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
        if (booking.length === 0) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        // Allow owner or Admin to delete/cancel
        if (booking[0].userId !== userId && userRole !== 'Admin') {
            return res.status(403).json({ msg: 'Not authorized to cancel this booking' });
        }

        // Instead of deleting, maybe change status to 'cancelled'
        // await pool.query('DELETE FROM bookings WHERE id = ?', [bookingId]);
        await pool.query('UPDATE bookings SET status = ? WHERE id = ?', ['cancelled', bookingId]);
        
        // res.json({ msg: 'Booking deleted successfully' });
        res.json({ msg: 'Booking cancelled successfully' });

    } catch (err) {
        console.error('Error cancelling booking:', err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
