
const express = require('express');
const pool = require('../config/db');
const { auth, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/faculty-requests - Faculty submits a new change request
router.post('/', auth, authorize(['faculty']), async (req, res) => {
    const { booking_id, requested_change_details, reason } = req.body;
    const faculty_user_id = req.user.userId;

    if (!booking_id || !requested_change_details || !reason) {
        return res.status(400).json({ message: 'Booking ID, requested change details, and reason are required.' });
    }

    try {
        // Optional: Check if the booking_id exists and belongs to this faculty or is relevant
        const [bookingCheck] = await pool.query('SELECT user_id FROM Bookings WHERE booking_id = ?', [booking_id]);
        if (bookingCheck.length === 0) {
            return res.status(404).json({ message: 'Original booking not found.' });
        }
        // Add more validation if needed, e.g., ensuring the booking is actually assigned to this faculty if user_id is present in Bookings.
        // For now, we assume faculty can request changes for bookings they are involved with.

        const [result] = await pool.query(
            'INSERT INTO LabChangeRequests (booking_id, faculty_user_id, requested_change_details, reason, status) VALUES (?, ?, ?, ?, ?)',
            [booking_id, faculty_user_id, requested_change_details, reason, 'Pending']
        );
        
        const newRequestId = result.insertId;
        const [newRequest] = await pool.query('SELECT * FROM LabChangeRequests WHERE request_id = ?', [newRequestId]);

        res.status(201).json({ 
            message: 'Lab change request submitted successfully.',
            request: newRequest[0]
        });
    } catch (error) {
        console.error('Error submitting lab change request:', error);
        res.status(500).json({ message: 'Server error submitting lab change request.' });
    }
});

// GET /api/faculty-requests - Admin gets all requests
router.get('/', auth, authorize(['admin']), async (req, res) => {
    try {
        const [requests] = await pool.query(
            `SELECT lcr.*, 
                    u.full_name as faculty_name, 
                    b.start_time as original_start_time, b.end_time as original_end_time,
                    lab.name as original_lab_name, lab.room_number as original_lab_room,
                    s.name as original_section_name, c.name as original_course_name,
                    admin_u.full_name as processed_by_admin_name
             FROM LabChangeRequests lcr
             JOIN Users u ON lcr.faculty_user_id = u.user_id
             JOIN Bookings b ON lcr.booking_id = b.booking_id
             LEFT JOIN Labs lab ON b.lab_id = lab.lab_id
             LEFT JOIN Sections s ON b.section_id = s.section_id
             LEFT JOIN Courses c ON s.course_id = c.course_id
             LEFT JOIN Users admin_u ON lcr.processed_by_user_id = admin_u.user_id
             ORDER BY lcr.request_date DESC`
        );
        res.json(requests);
    } catch (error) {
        console.error('Error fetching lab change requests:', error);
        res.status(500).json({ message: 'Server error fetching lab change requests.' });
    }
});


// PUT /api/faculty-requests/:requestId/process - Admin processes a request (Approve/Deny)
router.put('/:requestId/process', auth, authorize(['admin']), async (req, res) => {
    const { requestId } = req.params;
    const { status, admin_remarks } = req.body; // status should be 'Approved' or 'Denied'
    const processed_by_user_id = req.user.userId;

    if (!status || !['Approved', 'Denied'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided. Must be "Approved" or "Denied".' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE LabChangeRequests SET status = ?, admin_remarks = ?, processed_by_user_id = ?, processed_at = NOW() WHERE request_id = ?',
            [status, admin_remarks || null, processed_by_user_id, requestId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Request not found or no changes made.' });
        }

        // TODO: If 'Approved', potentially trigger logic to attempt to modify the original Booking.
        // This is complex and needs careful implementation (checking new slot availability, etc.)
        // For now, approval only marks the request.

        const [updatedRequest] = await pool.query(
            `SELECT lcr.*, 
                    u.full_name as faculty_name, 
                    b.start_time as original_start_time, b.end_time as original_end_time,
                    lab.name as original_lab_name, lab.room_number as original_lab_room,
                    s.name as original_section_name, c.name as original_course_name,
                    admin_u.full_name as processed_by_admin_name
             FROM LabChangeRequests lcr
             JOIN Users u ON lcr.faculty_user_id = u.user_id
             JOIN Bookings b ON lcr.booking_id = b.booking_id
             LEFT JOIN Labs lab ON b.lab_id = lab.lab_id
             LEFT JOIN Sections s ON b.section_id = s.section_id
             LEFT JOIN Courses c ON s.course_id = c.course_id
             LEFT JOIN Users admin_u ON lcr.processed_by_user_id = admin_u.user_id
             WHERE lcr.request_id = ?`, [requestId]
        );
        
        res.json({ 
            message: `Request ${status.toLowerCase()} successfully.`,
            request: updatedRequest[0]
        });

    } catch (error) {
        console.error('Error processing lab change request:', error);
        res.status(500).json({ message: 'Server error processing lab change request.' });
    }
});


module.exports = router;
