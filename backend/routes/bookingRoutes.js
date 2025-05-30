
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, isAdmin, USER_ROLES } = require('../middleware/authMiddleware');

// @route   GET api/bookings
// @desc    Get all bookings (Admin view - with filters if implemented on frontend)
// @access  Private (Admin only)
router.get('/', [auth, isAdmin], async (req, res) => {
    try {
        const [allBookings] = await pool.query(`
            SELECT b.*, l.name as labName, u.fullName as userName
            FROM bookings b
            LEFT JOIN labs l ON b.labId = l.id
            LEFT JOIN users u ON b.userId = u.id
            ORDER BY b.date ASC, b.timeSlotId ASC
        `);
        res.json(allBookings);
    } catch (err) {
        console.error('Error fetching all bookings:', err.message, err.stack);
        res.status(500).json({ msg: 'Server Error: Could not fetch all bookings' });
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
            LEFT JOIN labs l ON b.labId = l.id
            WHERE b.userId = ?
            ORDER BY b.date DESC, b.timeSlotId ASC
        `, [req.user.id]);
        res.json(myBookings);
    } catch (err) {
        console.error('Error fetching user bookings:', err.message, err.stack);
        res.status(500).json({ msg: 'Server Error: Could not fetch user bookings' });
    }
});

// @route   POST api/bookings
// @desc    Create a new booking or booking request
// @access  Private (Faculty, or Admin booking on behalf of someone)
router.post('/', auth, async (req, res) => {
    console.log('[POST /api/bookings] Request received. User:', JSON.stringify(req.user));
    console.log('[POST /api/bookings] Request body:', JSON.stringify(req.body));

    const { labId, date, timeSlotId, purpose, equipmentIds, batchIdentifier } = req.body;
    const userId = req.user.id;
    const requestedByRole = req.user.role;

    if (!labId || !date || !timeSlotId || !purpose) {
        console.error('[POST /api/bookings] Validation Error: Missing required fields.');
        return res.status(400).json({ msg: 'Please provide all required booking fields (lab, date, time, purpose)' });
    }

    let status;
    if (requestedByRole === USER_ROLES.ASSISTANT) {
        // This case should ideally not be reached if frontend prevents Assistants from booking
        console.warn('[POST /api/bookings] Assistant attempted booking via general endpoint. Rejecting.');
        return res.status(403).json({ msg: 'Assistants cannot create bookings through this general endpoint.' });
    } else if (requestedByRole === USER_ROLES.FACULTY || requestedByRole === USER_ROLES.ADMIN) {
        status = 'booked'; // Faculty and Admin bookings are attempted as auto-approved
    } else {
        console.error(`[POST /api/bookings] Unauthorized role attempted booking: ${requestedByRole}`);
        return res.status(403).json({ msg: 'Your role is not authorized to create bookings directly.' });
    }

    try {
        // Conflict Check
        console.log(`[POST /api/bookings] Checking for conflicts: labId=${labId}, date=${date}, timeSlotId=${timeSlotId}`);
        const [conflictingBookings] = await pool.query(
            'SELECT * FROM bookings WHERE labId = ? AND date = ? AND timeSlotId = ? AND status = ?',
            [parseInt(labId), date, timeSlotId, 'booked']
        );
        console.log(`[POST /api/bookings] Found ${conflictingBookings.length} conflicting bookings.`);

        if (conflictingBookings.length > 0) {
            if (requestedByRole === USER_ROLES.FACULTY) {
                status = 'pending-admin-approval'; // Change status for admin review
                const facultyPurpose = `${purpose} (Conflict - Needs Review)`;
                const newBookingPendingAdmin = {
                    labId: parseInt(labId),
                    userId,
                    date,
                    timeSlotId,
                    purpose: facultyPurpose,
                    equipmentIds: equipmentIds && equipmentIds.length > 0 ? JSON.stringify(equipmentIds) : null,
                    status,
                    requestedByRole,
                    batchIdentifier: batchIdentifier || null,
                    submittedDate: new Date()
                };
                console.log('[POST /api/bookings] Faculty conflict. Saving as pending-admin-approval. Data:', JSON.stringify(newBookingPendingAdmin));
                const [pendingResult] = await pool.query('INSERT INTO bookings SET ?', newBookingPendingAdmin);
                const [createdPendingBooking] = await pool.query(
                    `SELECT b.*, l.name as labName, u.fullName as userName
                     FROM bookings b
                     LEFT JOIN labs l ON b.labId = l.id
                     LEFT JOIN users u ON b.userId = u.id
                     WHERE b.id = ?`, [pendingResult.insertId]
                );
                console.log('[POST /api/bookings] Responding 202 for faculty conflict.');
                return res.status(202).json({ 
                    success: false, 
                    conflict: true, 
                    message: "This slot is already booked. Your request has been submitted for admin review. Simulated alternatives: Lab B at 3 PM, Lab C at 4 PM.",
                    booking: createdPendingBooking[0]
                });
            } else if (requestedByRole === USER_ROLES.ADMIN) {
                console.log('[POST /api/bookings] Admin conflict. Responding 409.');
                return res.status(409).json({ msg: 'This slot is already booked. As Admin, please choose another slot, or cancel the existing booking if override is intended.'});
            }
        }

        const newBooking = {
            labId: parseInt(labId),
            userId,
            date,
            timeSlotId,
            purpose,
            equipmentIds: equipmentIds && equipmentIds.length > 0 ? JSON.stringify(equipmentIds) : null,
            status, 
            requestedByRole, 
            batchIdentifier: batchIdentifier || null,
            submittedDate: new Date()
        };
        console.log('[POST /api/bookings] No conflict or resolved. Proceeding to save booking. Data:', JSON.stringify(newBooking));

        const [result] = await pool.query('INSERT INTO bookings SET ?', newBooking);
        const [createdBookingResult] = await pool.query(
            `SELECT b.*, l.name as labName, u.fullName as userName
             FROM bookings b
             LEFT JOIN labs l ON b.labId = l.id
             LEFT JOIN users u ON b.userId = u.id
             WHERE b.id = ?`, [result.insertId]
        );

        if (createdBookingResult.length === 0) {
            console.error('[POST /api/bookings] Failed to retrieve created booking details after insert.');
            return res.status(500).json({ msg: 'Failed to retrieve created booking details.' });
        }
        console.log('[POST /api/bookings] Booking successful. Responding 201 with booking:', JSON.stringify(createdBookingResult[0]));
        res.status(201).json(createdBookingResult[0]);

    } catch (err) {
        console.error('[POST /api/bookings] Error creating booking:', err.message, err.stack);
        if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.sqlState === '23000') {
            if (err.sqlMessage && err.sqlMessage.toLowerCase().includes('foreign key constraint fails')) {
                 if (err.sqlMessage.includes('labId')) return res.status(400).json({ msg: 'Invalid Lab ID. The specified lab does not exist.' });
                 if (err.sqlMessage.includes('userId')) return res.status(400).json({ msg: 'Invalid User ID. The specified user does not exist.' });
            }
            return res.status(400).json({ msg: 'Invalid labId or userId reference.' });
        }
        res.status(500).json({ msg: 'Server Error while creating booking' });
    }
});


// @route   PUT api/bookings/:bookingId/status
// @desc    Update booking status (e.g., approve/reject by Admin)
// @access  Private (Admin only)
router.put('/:bookingId/status', [auth, isAdmin], async (req, res) => {
    const { status } = req.body; 
    const { bookingId } = req.params;

    if (!status) {
        return res.status(400).json({ msg: 'Status is required' });
    }
    const allowedStatuses = ['pending', 'booked', 'rejected', 'cancelled', 'pending-admin-approval', 'approved-by-admin', 'rejected-by-admin', 'under-review']; 
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ msg: 'Invalid status value provided.' });
    }

    try {
        const [bookingResult] = await pool.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
        if(bookingResult.length === 0) {
            return res.status(404).json({ msg: 'Booking not found' });
        }
        const booking = bookingResult[0];

        // If Admin is approving a 'pending-admin-approval' or 'pending' to 'booked'
        if (status === 'booked' && (booking.status === 'pending-admin-approval' || booking.status === 'approved-by-admin' || booking.status === 'pending')) {
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
             LEFT JOIN labs l ON b.labId = l.id
             LEFT JOIN users u ON b.userId = u.id
             WHERE b.id = ?`, [bookingId]
        );
        if (updatedBookingResult.length === 0) {
             return res.status(500).json({ msg: 'Failed to retrieve updated booking details.' });
        }
        res.json(updatedBookingResult[0]);
    } catch (err) {
        console.error('Error updating booking status:', err.message, err.stack);
        res.status(500).json({ msg: 'Server Error while updating booking status' });
    }
});

// @route   PUT api/bookings/:bookingId/purpose
// @desc    Update booking purpose (Admin only)
// @access  Private (Admin only)
router.put('/:bookingId/purpose', [auth, isAdmin], async (req, res) => {
    const { purpose } = req.body;
    const { bookingId } = req.params;

    if (!purpose || typeof purpose !== 'string' || purpose.trim() === '') {
        return res.status(400).json({ msg: 'Purpose is required and cannot be empty.' });
    }

    try {
        const [bookingResult] = await pool.query('SELECT id FROM bookings WHERE id = ?', [bookingId]);
        if (bookingResult.length === 0) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        await pool.query('UPDATE bookings SET purpose = ? WHERE id = ?', [purpose.trim(), bookingId]);

        const [updatedBookingResult] = await pool.query(
            `SELECT b.*, l.name as labName, u.fullName as userName
             FROM bookings b
             LEFT JOIN labs l ON b.labId = l.id
             LEFT JOIN users u ON b.userId = u.id
             WHERE b.id = ?`, [bookingId]
        );
        if (updatedBookingResult.length === 0) {
            return res.status(500).json({ msg: 'Failed to retrieve updated booking details.' });
        }
        res.json(updatedBookingResult[0]);

    } catch (err) {
        console.error('Error updating booking purpose:', err.message, err.stack);
        res.status(500).json({ msg: 'Server Error while updating booking purpose' });
    }
});


// @route   DELETE api/bookings/:bookingId
// @desc    Cancel/delete a booking (changes status to 'cancelled')
// @access  Private (Owner or Admin)
router.delete('/:bookingId', auth, async (req, res) => {
    const { bookingId } = req.params;
    const userIdFromToken = req.user.id;
    const userRoleFromToken = req.user.role;

    try {
        const [bookingResult] = await pool.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
        if (bookingResult.length === 0) {
            return res.status(404).json({ msg: 'Booking not found' });
        }
        const booking = bookingResult[0];

        // Allow user to cancel their own booking, or Admin to cancel any booking
        if (String(booking.userId) !== String(userIdFromToken) && userRoleFromToken !== USER_ROLES.ADMIN) {
            return res.status(403).json({ msg: 'Not authorized to cancel this booking' });
        }

        // Instead of deleting, change status to 'cancelled'
        await pool.query('UPDATE bookings SET status = ? WHERE id = ?', ['cancelled', bookingId]);

        res.json({ msg: 'Booking cancelled successfully' });

    } catch (err) {
        console.error('Error cancelling booking:', err.message, err.stack);
        res.status(500).json({ msg: 'Server Error while cancelling booking' });
    }
});


module.exports = router;

    