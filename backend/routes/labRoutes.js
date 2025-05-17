
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, isAdmin } = require('../middleware/authMiddleware');

// @route   GET api/labs
// @desc    Get all labs
// @access  Public (or protected if needed by auth for certain views)
router.get('/', auth, async (req, res) => { // Changed to auth to allow any logged in user to fetch labs
    try {
        const [labs] = await pool.query('SELECT * FROM labs ORDER BY name ASC');
        res.json(labs);
    } catch (err) {
        console.error('Error fetching labs:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/labs/:id
// @desc    Get a single lab by ID
// @access  Public (or protected)
router.get('/:id', auth, async (req, res) => { // Changed to auth
    try {
        const [labs] = await pool.query('SELECT * FROM labs WHERE id = ?', [req.params.id]);
        if (labs.length === 0) {
            return res.status(404).json({ msg: 'Lab not found' });
        }
        res.json(labs[0]);
    } catch (err) {
        console.error('Error fetching single lab:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/labs
// @desc    Create a new lab
// @access  Private (Admin only)
router.post('/', [auth, isAdmin], async (req, res) => {
    const { name, capacity, roomNumber, location } = req.body;

    if (!name || !capacity || !roomNumber) {
        return res.status(400).json({ msg: 'Please include name, capacity, and room number' });
    }
    if (isNaN(parseInt(capacity)) || parseInt(capacity) <= 0) {
        return res.status(400).json({ msg: 'Capacity must be a positive number' });
    }

    try {
        const newLab = { name, capacity: parseInt(capacity), roomNumber, location: location || null };
        const [result] = await pool.query('INSERT INTO labs SET ?', newLab);
        
        const [createdLab] = await pool.query('SELECT * FROM labs WHERE id = ?', [result.insertId]);
        res.status(201).json(createdLab[0]);
    } catch (err) {
        console.error('Error creating lab:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/labs/:id
// @desc    Update an existing lab
// @access  Private (Admin only)
router.put('/:id', [auth, isAdmin], async (req, res) => {
    const { name, capacity, roomNumber, location } = req.body;
    const labId = req.params.id;

    if (!name || !capacity || !roomNumber) {
        return res.status(400).json({ msg: 'Please include name, capacity, and room number' });
    }
    if (isNaN(parseInt(capacity)) || parseInt(capacity) <= 0) {
        return res.status(400).json({ msg: 'Capacity must be a positive number' });
    }

    try {
        const [existingLabs] = await pool.query('SELECT * FROM labs WHERE id = ?', [labId]);
        if (existingLabs.length === 0) {
            return res.status(404).json({ msg: 'Lab not found' });
        }

        const updatedLabData = { 
            name, 
            capacity: parseInt(capacity), 
            roomNumber, 
            location: location || existingLabs[0].location 
        };

        await pool.query('UPDATE labs SET ? WHERE id = ?', [updatedLabData, labId]);
        
        const [updatedLab] = await pool.query('SELECT * FROM labs WHERE id = ?', [labId]);
        res.json(updatedLab[0]);
    } catch (err) {
        console.error('Error updating lab:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/labs/:id
// @desc    Delete a lab
// @access  Private (Admin only)
router.delete('/:id', [auth, isAdmin], async (req, res) => {
    const labId = req.params.id;
    try {
        const [existingLabs] = await pool.query('SELECT * FROM labs WHERE id = ?', [labId]);
        if (existingLabs.length === 0) {
            return res.status(404).json({ msg: 'Lab not found' });
        }

        // Foreign key constraints in MySQL schema (ON DELETE CASCADE for bookings, ON DELETE SET NULL for equipment) will handle related records.
        // However, if other direct references exist without such constraints, this could fail.
        await pool.query('DELETE FROM labs WHERE id = ?', [labId]);
        res.json({ msg: 'Lab deleted successfully' });
    } catch (err) {
        console.error('Error deleting lab:', err.message);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') { // MySQL specific error code for FK constraint violation
             return res.status(400).json({ msg: 'Cannot delete lab. It is referenced by other records (e.g., active bookings or equipment where ON DELETE RESTRICT is set). Please remove or reassign references first.' });
        }
        res.status(500).send('Server error');
    }
});


// @route   GET api/labs/:labId/seats
// @desc    Get all seat statuses for a lab
// @access  Private (Assistant or Admin or Faculty - any authenticated user for now)
router.get('/:labId/seats', auth, async (req, res) => { 
    const { labId } = req.params;
    try {
        const [seatStatuses] = await pool.query(
            'SELECT seatIndex, status FROM lab_seat_statuses WHERE labId = ?',
            [labId]
        );
        // Convert array of {seatIndex, status} to an object { seatIndex1: status1, seatIndex2: status2 }
        const statusesMap = seatStatuses.reduce((acc, seat) => {
            acc[seat.seatIndex] = seat.status;
            return acc;
        }, {});
        res.json(statusesMap);
    } catch (err) {
        console.error('Error fetching seat statuses:', err.message);
        res.status(500).send('Server Error: Could not fetch seat statuses.');
    }
});

// @route   PUT api/labs/:labId/seats/:seatIndex
// @desc    Update status of a specific seat by Assistant or Admin
// @access  Private (Assistant or Admin)
router.put('/:labId/seats/:seatIndex', [auth], async (req, res) => { 
    // Allow Admin to also update seats, in addition to Assistant
    if (req.user.role !== 'Assistant' && req.user.role !== 'Admin') {
        return res.status(403).json({ msg: 'Access denied. Assistant or Admin role required.'});
    }
    const { labId, seatIndex } = req.params;
    const { status } = req.body; // expecting { status: 'working' | 'not-working' }

    if (!status || !['working', 'not-working'].includes(status)) {
        return res.status(400).json({ msg: 'Invalid status provided. Must be "working" or "not-working".' });
    }

    try {
        // Check if lab exists to give a more specific error if labId is wrong.
        const [labExists] = await pool.query('SELECT id FROM labs WHERE id = ?', [labId]);
        if (labExists.length === 0) {
            return res.status(404).json({ msg: 'Lab not found.' });
        }

        // UPSERT logic: Insert if not exists, update if exists
        // Assumes lab_seat_statuses table has a UNIQUE KEY on (labId, seatIndex)
        await pool.query(
            `INSERT INTO lab_seat_statuses (labId, seatIndex, status, updatedAt) 
             VALUES (?, ?, ?, CURRENT_TIMESTAMP) 
             ON DUPLICATE KEY UPDATE status = VALUES(status), updatedAt = CURRENT_TIMESTAMP`,
            [labId, seatIndex, status]
        );
        res.json({ msg: `Seat ${seatIndex} in lab ${labId} updated to ${status}` });
    } catch (err) {
        console.error('Error updating seat status:', err.message);
        // Check for specific foreign key constraint violation on labId if the lab does not exist,
        // though the explicit check above should catch it.
        if (err.code === 'ER_NO_REFERENCED_ROW_2') { // Should not happen due to labExists check but good to have
            return res.status(400).json({ msg: 'Invalid labId. The specified lab does not exist.' });
        }
        res.status(500).send('Server Error: Could not update seat status.');
    }
});

module.exports = router;

    