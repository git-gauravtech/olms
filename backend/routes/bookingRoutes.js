
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, isAdmin, USER_ROLES } = require('../middleware/authMiddleware');

// Consistent with MySQL TIME format: HH:MM:SS
// This array is the backend's source of truth for converting timeSlotId to actual start/end times.
const MOCK_TIME_SLOTS_BACKEND = [
  { id: 'ts_0800_0950', startTime: '08:00:00', endTime: '09:50:00' },
  { id: 'ts_1010_1205', startTime: '10:10:00', endTime: '12:05:00' },
  { id: 'ts_1205_1350', startTime: '12:05:00', endTime: '13:50:00' },
  { id: 'ts_1410_1605', startTime: '14:10:00', endTime: '16:05:00' },
  { id: 'ts_1605_1750', startTime: '16:05:00', endTime: '17:50:00' },
];

function getTimesFromSlotId(timeSlotId) {
    const slot = MOCK_TIME_SLOTS_BACKEND.find(ts => ts.id === timeSlotId);
    return slot ? { startTime: slot.startTime, endTime: slot.endTime } : { startTime: null, endTime: null };
}

// @route   GET api/bookings
// @desc    Get all bookings (Admin only)
// @access  Private (Admin)
router.get('/', [auth, isAdmin], async (req, res) => {
    try {
        const [allBookings] = await pool.query(`
            SELECT b.*, l.name as labName, u.fullName as userName, u.role as userRole,
                   s.section_name as sectionName, crs.name as courseName
            FROM bookings b
            LEFT JOIN labs l ON b.labId = l.id
            LEFT JOIN users u ON b.user_id = u.id
            LEFT JOIN sections s ON b.section_id = s.id
            LEFT JOIN courses crs ON s.course_id = crs.id
            ORDER BY b.date ASC, b.start_time ASC
        `);
        res.json(allBookings);
    } catch (err) {
        console.error('Error fetching all bookings for admin:', err.message, err.stack);
        res.status(500).json({ msg: 'Server Error: Could not fetch all bookings' });
    }
});

// @route   GET api/bookings/my
// @desc    Get bookings for the logged-in user (Faculty, Student, Assistant)
// @access  Private
router.get('/my', auth, async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    let query;
    const queryParams = [];

    try {
        if (userRole === USER_ROLES.FACULTY || userRole === USER_ROLES.ADMIN) { // Admin can also use this to see their own bookings if any
            query = `
                SELECT b.*, l.name as labName, s.section_name as sectionName, crs.name as courseName
                FROM bookings b
                LEFT JOIN labs l ON b.labId = l.id
                LEFT JOIN sections s ON b.section_id = s.id
                LEFT JOIN courses crs ON s.course_id = crs.id
                WHERE b.user_id = ? 
                ORDER BY b.date DESC, b.start_time ASC
            `;
            queryParams.push(userId);
        } else if (userRole === USER_ROLES.STUDENT) {
            // PRD: "Students view schedules for their enrolled sections"
            // For now, this will be an empty array as student_section_enrollments table is not implemented.
            // To show something for demo, it previously fetched all 'booked' bookings.
            // Reverting to PRD intent: should be specific to student, which requires enrollment logic not yet built.
            return res.json([]); 
        } else if (userRole === USER_ROLES.ASSISTANT) {
             // Assistants might see all bookings or bookings for labs they are assigned to.
             // For current PRD, their primary role is seat status. This endpoint might not be directly used by them unless they also book.
             // For demo, allow them to see all 'booked' for general lab visibility if needed, similar to Lab Availability grid.
             query = `
                SELECT b.*, l.name as labName, u.fullName as bookedByUserName, 
                       s.section_name as sectionName, crs.name as courseName
                FROM bookings b
                LEFT JOIN labs l ON b.labId = l.id
                LEFT JOIN users u ON b.user_id = u.id
                LEFT JOIN sections s ON b.section_id = s.id
                LEFT JOIN courses crs ON s.course_id = crs.id
                WHERE b.status = 'booked' OR b.status = 'pending-admin-approval' OR b.status = 'approved-by-admin'
                ORDER BY b.date DESC, b.start_time ASC
            `;
        } else {
            return res.status(403).json({ msg: "User role not authorized for this view." });
        }

        const [myBookings] = await pool.query(query, queryParams);
        res.json(myBookings);
    } catch (err) {
        console.error(`Error fetching bookings for ${userRole}:`, err.message, err.stack);
        res.status(500).json({ msg: `Server Error: Could not fetch bookings for ${userRole}` });
    }
});

// @route   POST api/bookings
// @desc    Create a new booking or booking request
// @access  Private (Faculty or Admin)
router.post('/', auth, async (req, res) => {
    console.log('[POST /api/bookings] User making request:', JSON.stringify(req.user));
    console.log('[POST /api/bookings] Request body received:', JSON.stringify(req.body));

    const { labId, date, timeSlotId, purpose, equipmentIds, section_id } = req.body;
    const userId = req.user.id;
    const requestedByRole = req.user.role;

    if (!labId || !date || !timeSlotId || !section_id) {
        return res.status(400).json({ msg: 'Lab, Date, Time Slot, and Section are required fields.' });
    }
    if (requestedByRole !== USER_ROLES.FACULTY && requestedByRole !== USER_ROLES.ADMIN) {
        return res.status(403).json({ msg: 'Only Faculty or Admin can create bookings.' });
    }
    
    const { startTime, endTime } = getTimesFromSlotId(timeSlotId);
    if (!startTime || !endTime) {
        return res.status(400).json({ msg: 'Invalid timeSlotId provided.' });
    }

    let status = 'booked'; // Default to booked for both Admin and Faculty initial attempt
    console.log(`[POST /api/bookings] Initial status for ${requestedByRole} role: ${status}`);


    try {
        // Conflict Check: Check if the lab is booked for the exact same date and overlapping time with status 'booked'
        const [conflictingBookings] = await pool.query(
            `SELECT * FROM bookings 
             WHERE labId = ? AND date = ? 
             AND (
                 (start_time < ? AND end_time > ?) OR 
                 (start_time >= ? AND start_time < ?) 
             ) AND status = 'booked'`,
            [labId, date, endTime, startTime, startTime, endTime] 
        );
        console.log(`[POST /api/bookings] Conflict check query params: labId=${labId}, date=${date}, endTime=${endTime}, startTime=${startTime}`);
        console.log(`[POST /api/bookings] Found ${conflictingBookings.length} conflicting 'booked' bookings.`);

        let conflictOccurred = conflictingBookings.length > 0;

        if (conflictOccurred) {
             if (requestedByRole === USER_ROLES.FACULTY) {
                status = 'pending-admin-approval'; // Faculty request goes to admin review on conflict
                // The original purpose is maintained. Admin sees conflict by checking grid.
                console.log("[POST /api/bookings] Faculty request HAS CONFLICT with a 'booked' slot. Status changed to 'pending-admin-approval'.");
             } else if (requestedByRole === USER_ROLES.ADMIN) {
                // Admin using the form directly and encountering a conflict
                console.log("[POST /api/bookings] Admin booking via form HAS CONFLICT with an existing 'booked' slot. Returning 409.");
                return res.status(409).json({
                    success: false, conflict: true, 
                    message: "This slot is already booked. As Admin, please use the Lab Availability Grid to check availability or manage existing bookings."
                });
             }
        } else {
            console.log("[POST /api/bookings] No conflict with existing 'booked' slots found. Status remains 'booked'.");
        }

        const newBooking = {
            user_id: userId, 
            section_id: parseInt(section_id),
            labId: parseInt(labId),
            date,
            timeSlotId,
            start_time: startTime, // HH:MM:SS from getTimesFromSlotId
            end_time: endTime,     // HH:MM:SS from getTimesFromSlotId
            purpose: purpose || null,
            equipmentIds: equipmentIds && equipmentIds.length > 0 ? JSON.stringify(equipmentIds) : null,
            status, 
            submittedDate: new Date()
        };
        console.log('[POST /api/bookings] Preparing to save booking. Data:', JSON.stringify(newBooking));

        const [result] = await pool.query('INSERT INTO bookings SET ?', newBooking);
        const [createdBookingResult] = await pool.query(
            `SELECT b.*, l.name as labName, u.fullName as userName, u.role as userRole,
                    s.section_name as sectionName, crs.name as courseName
             FROM bookings b
             LEFT JOIN labs l ON b.labId = l.id
             LEFT JOIN users u ON b.user_id = u.id
             LEFT JOIN sections s ON b.section_id = s.id
             LEFT JOIN courses crs ON s.course_id = crs.id
             WHERE b.id = ?`, [result.insertId]
        );

        if (createdBookingResult.length === 0) {
            console.error('[POST /api/bookings] Failed to retrieve created booking details after insert.');
            return res.status(500).json({ msg: 'Failed to retrieve created booking details.' });
        }
        
        const responsePayload = { 
            success: true, 
            conflict: status === 'pending-admin-approval' && conflictOccurred, // True if faculty request resulted in pending status
            message: status === 'booked' ? "Booking created successfully!" : "Booking request submitted for admin approval due to conflict.",
            booking: createdBookingResult[0] 
        };
        
        const responseStatus = status === 'booked' ? 201 : 202; // 201 for created, 202 for accepted (pending)
        console.log(`[POST /api/bookings] Booking successful. Responding with status ${responseStatus}:`, JSON.stringify(responsePayload));
        res.status(responseStatus).json(responsePayload);


    } catch (err) {
        console.error('[POST /api/bookings] Error creating booking:', err.message, err.stack);
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            if (err.sqlMessage && err.sqlMessage.toLowerCase().includes('foreign key constraint')) {
                 if (err.sqlMessage.includes('labId')) return res.status(400).json({ msg: 'Invalid Lab ID. The specified lab does not exist.' });
                 if (err.sqlMessage.includes('user_id')) return res.status(400).json({ msg: 'Invalid User ID. The specified user does not exist.' });
                 if (err.sqlMessage.includes('section_id')) return res.status(400).json({ msg: 'Invalid Section ID. The specified section does not exist.' });
            }
            return res.status(400).json({ msg: 'Invalid labId, userId, or sectionId reference.' });
        }
        res.status(500).json({ msg: 'Server Error while creating booking' });
    }
});

// @route   PUT api/bookings/:bookingId/status
// @desc    Update booking status (Admin only)
// @access  Private (Admin)
router.put('/:bookingId/status', [auth, isAdmin], async (req, res) => {
    const { status: newStatus } = req.body; 
    const { bookingId } = req.params;

    if (!newStatus) {
        return res.status(400).json({ msg: 'Status is required' });
    }
    const allowedStatuses = ['pending', 'booked', 'rejected', 'cancelled', 'pending-admin-approval', 'approved-by-admin', 'rejected-by-admin']; 
    if (!allowedStatuses.includes(newStatus)) {
        return res.status(400).json({ msg: 'Invalid status value provided.' });
    }

    try {
        const [bookingResult] = await pool.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
        if(bookingResult.length === 0) {
            return res.status(404).json({ msg: 'Booking not found' });
        }
        const booking = bookingResult[0];

        // If admin is trying to change status to 'booked', perform a conflict check
        if (newStatus === 'booked') { 
             const [conflictingBookings] = await pool.query(
                `SELECT * FROM bookings 
                 WHERE labId = ? AND date = ? 
                 AND (
                     (start_time < ? AND end_time > ?) OR 
                     (start_time >= ? AND start_time < ?) 
                 ) AND status = 'booked' AND id != ?`, // Exclude the current booking being updated
                [booking.labId, booking.date, booking.end_time, booking.start_time, booking.start_time, booking.end_time, bookingId]
            );
            if (conflictingBookings.length > 0) {
                return res.status(409).json({ msg: 'Cannot approve to "booked": This slot is already booked by another user. Please resolve the conflict.' });
            }
        }

        await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [newStatus, bookingId]);

        const [updatedBookingResult] = await pool.query(
            `SELECT b.*, l.name as labName, u.fullName as userName, u.role as userRole,
                    s.section_name as sectionName, crs.name as courseName
             FROM bookings b
             LEFT JOIN labs l ON b.labId = l.id
             LEFT JOIN users u ON b.user_id = u.id
             LEFT JOIN sections s ON b.section_id = s.id
             LEFT JOIN courses crs ON s.course_id = crs.id
             WHERE b.id = ?`, [bookingId]
        );
        if (updatedBookingResult.length === 0) {
             return res.status(500).json({ msg: 'Failed to retrieve updated booking details.' });
        }
        res.json(updatedBookingResult[0]); // Send back the updated booking object
    } catch (err) {
        console.error('Error updating booking status:', err.message, err.stack);
        res.status(500).json({ msg: 'Server Error while updating booking status' });
    }
});

// @route   PUT api/bookings/:bookingId/purpose
// @desc    Update booking purpose (Admin only)
// @access  Private (Admin)
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
            `SELECT b.*, l.name as labName, u.fullName as userName, u.role as userRole,
                    s.section_name as sectionName, crs.name as courseName
             FROM bookings b
             LEFT JOIN labs l ON b.labId = l.id
             LEFT JOIN users u ON b.user_id = u.id
             LEFT JOIN sections s ON b.section_id = s.id
             LEFT JOIN courses crs ON s.course_id = crs.id
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
// @desc    Cancel a booking (Owner or Admin)
// @access  Private
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

        // Allow cancellation if user is admin OR if user is the one who made the booking
        if (String(booking.user_id) !== String(userIdFromToken) && userRoleFromToken !== USER_ROLES.ADMIN) {
            return res.status(403).json({ msg: 'Not authorized to cancel this booking' });
        }

        // Instead of deleting, update status to 'cancelled'
        await pool.query('UPDATE bookings SET status = ? WHERE id = ?', ['cancelled', bookingId]);
        res.json({ msg: 'Booking cancelled successfully' });

    } catch (err) {
        console.error('Error cancelling booking:', err.message, err.stack);
        res.status(500).json({ msg: 'Server Error while cancelling booking' });
    }
});

module.exports = router;
    
