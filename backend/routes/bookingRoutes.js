
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, isAdmin } = require('../middleware/authMiddleware');

// @route   GET api/bookings
// @desc    Get all bookings (for lab grid display, accessible by authenticated users)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        // Joining with labs to get labName and users to get userName (fullName)
        const [allBookings] = await pool.query(`
            SELECT b.*, l.name as labName, u.fullName as userName
            FROM bookings b
            LEFT JOIN labs l ON b.labId = l.id
            LEFT JOIN users u ON b.userId = u.id
            ORDER BY b.date ASC, b.timeSlotId ASC
        `);
        res.json(allBookings);
    } catch (err) {
        console.error('Error fetching all bookings:', err.message);
        res.status(500).send('Server Error: Could not fetch all bookings');
    }
});

// @route   GET api/bookings/my
// @desc    Get bookings for the currently logged-in user
// @access  Private
router.get('/my', auth, async (req, res) => {
    try {
        const [myBookings] = await pool.query(`
            SELECT b.*, l.name as labName
            FROM bookings b
            JOIN labs l ON b.labId = l.id
            WHERE b.userId = ?
            ORDER BY b.date DESC, b.timeSlotId ASC
        `, [req.user.id]);
        res.json(myBookings);
    } catch (err) {
        console.error('Error fetching user bookings:', err.message);
        res.status(500).send('Server Error: Could not fetch user bookings');
    }
});

// @route   POST api/bookings
// @desc    Create a new booking or booking request
// @access  Private (Faculty, Assistant)
router.post('/', auth, async (req, res) => {
    const { labId, date, timeSlotId, purpose, equipmentIds, batchIdentifier } = req.body;
    const userId = req.user.id;
    const requestedByRole = req.user.role; // Role from JWT

    if (!labId || !date || !timeSlotId || !purpose) {
        return res.status(400).json({ msg: 'Please provide all required booking fields (lab, date, time, purpose)' });
    }

    let status;
    // As per request, Assistants can no longer submit 'pending' requests through this general endpoint.
    // They primarily manage seat statuses. If Assistants need to book, it would be a direct booking.
    // For now, let's assume only Faculty can make direct 'booked' entries.
    // If Assistants *were* to book, their status logic would need to be defined here.
    // For now, this endpoint is primarily for Faculty making direct bookings.
    if (requestedByRole === 'Faculty') {
        status = 'booked'; // Faculty bookings are auto-approved
    } else if (requestedByRole === 'Assistant') {
        // Assistants are no longer making requests that become 'pending' through this mechanism.
        // This part of the logic needs re-evaluation if Assistants are to book directly.
        // For now, reject booking attempts from Assistants via this general route.
        return res.status(403).json({ msg: 'Assistants cannot create bookings through this endpoint. Please use specific interfaces if available.' });
    } else {
        // This case should ideally not be reached if frontend restricts booking creation by role
        return res.status(403).json({ msg: 'Your role is not authorized to create bookings directly.' });
    }

    // This check is relevant if status is 'booked'
    if (status === 'booked') {
        try {
            const [conflictingBookings] = await pool.query(
                'SELECT * FROM bookings WHERE labId = ? AND date = ? AND timeSlotId = ? AND status = ?',
                [parseInt(labId), date, timeSlotId, 'booked']
            );
            if (conflictingBookings.length > 0) {
                return res.status(409).json({ msg: 'This slot is already booked. Please choose another time or lab.'});
            }
        } catch (dbErr) {
            console.error('Error checking for conflicting bookings:', dbErr.message, dbErr.stack);
            return res.status(500).send('Server Error while checking for booking conflicts');
        }
    }

    try {
        const newBooking = {
            labId: parseInt(labId),
            userId,
            date,
            timeSlotId,
            purpose,
            equipmentIds: equipmentIds ? JSON.stringify(equipmentIds) : null,
            status,
            requestedByRole, // Role of the user making the direct booking
            batchIdentifier: requestedByRole === 'Assistant' && batchIdentifier ? batchIdentifier : null, // Retained but Assistant role is blocked above
            submittedDate: new Date()
        };

        const [result] = await pool.query('INSERT INTO bookings SET ?', newBooking);
        const [createdBookingResult] = await pool.query(
            `SELECT b.*, l.name as labName, u.fullName as userName
             FROM bookings b
             JOIN labs l ON b.labId = l.id
             JOIN users u ON b.userId = u.id
             WHERE b.id = ?`, [result.insertId]
        );
        if (createdBookingResult.length === 0) {
            return res.status(500).json({ msg: 'Failed to retrieve created booking details.' });
        }
        res.status(201).json(createdBookingResult[0]);

    } catch (err) {
        console.error('Error creating booking:', err.message, err.stack);
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            if (err.sqlMessage && err.sqlMessage.includes('FOREIGN KEY (`labId`)')) {
                 return res.status(400).json({ msg: 'Invalid Lab ID. The specified lab does not exist.' });
            } else if (err.sqlMessage && err.sqlMessage.includes('FOREIGN KEY (`userId`)')) {
                 return res.status(400).json({ msg: 'Invalid User ID. The specified user does not exist.' });
            }
            return res.status(400).json({ msg: 'Invalid labId or userId reference.' });
        }
        res.status(500).send('Server Error while creating booking');
    }
});


// @route   PUT api/bookings/:bookingId/status
// @desc    Update booking status (e.g., approve/reject by Admin)
// @access  Private (Admin only)
router.put('/:bookingId/status', [auth, isAdmin], async (req, res) => {
    const { status } = req.body; // new status
    const { bookingId } = req.params;

    if (!status) {
        return res.status(400).json({ msg: 'Status is required' });
    }
    const allowedStatuses = ['booked', 'rejected', 'cancelled', 'pending-admin-approval', 'approved-by-admin', 'rejected-by-admin', 'pending']; // Added 'pending'
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ msg: 'Invalid status value provided.' });
    }

    try {
        const [bookingResult] = await pool.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
        if(bookingResult.length === 0) {
            return res.status(404).json({ msg: 'Booking not found' });
        }
        const booking = bookingResult[0];

        // If Admin is approving a 'pending' or 'pending-admin-approval' to 'booked'
        if (status === 'booked' && (booking.status === 'pending' || booking.status === 'pending-admin-approval')) {
             const [conflictingBookings] = await pool.query(
                'SELECT * FROM bookings WHERE labId = ? AND date = ? AND timeSlotId = ? AND status = ? AND id != ?',
                [booking.labId, booking.date, booking.timeSlotId, 'booked', bookingId]
            );
            if (conflictingBookings.length > 0) {
                return res.status(409).json({ msg: 'Cannot approve: This slot is already booked by another user. Please resolve the conflict.' });
            }
        }

        await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingId]);

        const [updatedBookingResult] = await pool.query(
            `SELECT b.*, l.name as labName, u.fullName as userName
             FROM bookings b
             JOIN labs l ON b.labId = l.id
             JOIN users u ON b.userId = u.id
             WHERE b.id = ?`, [bookingId]
        );
        res.json(updatedBookingResult[0]);
    } catch (err) {
        console.error('Error updating booking status:', err.message);
        res.status(500).send('Server Error while updating booking status');
    }
});

// @route   DELETE api/bookings/:bookingId
// @desc    Cancel/delete a booking (changes status to 'cancelled')
// @access  Private (Owner or Admin)
router.delete('/:bookingId', auth, async (req, res) => {
    const { bookingId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const [bookingResult] = await pool.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
        if (bookingResult.length === 0) {
            return res.status(404).json({ msg: 'Booking not found' });
        }
        const booking = bookingResult[0];

        // Allow user to cancel their own booking, or Admin to cancel any booking
        if (booking.userId !== userId && userRole !== 'Admin') {
            return res.status(403).json({ msg: 'Not authorized to cancel this booking' });
        }

        // Instead of deleting, change status to 'cancelled'
        await pool.query('UPDATE bookings SET status = ? WHERE id = ?', ['cancelled', bookingId]);

        res.json({ msg: 'Booking cancelled successfully' });

    } catch (err) {
        console.error('Error cancelling booking:', err.message);
        res.status(500).send('Server Error while cancelling booking');
    }
});


module.exports = router;
