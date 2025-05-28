
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, isAdmin } = require('../middleware/authMiddleware'); // Assuming USER_ROLES is exported or defined here

// Define USER_ROLES directly if not importing, for clarity
const USER_ROLES_BACKEND = {
  ADMIN: 'Admin',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
  ASSISTANT: 'Assistant',
};


// @route   GET api/labs
// @desc    Get all labs
// @access  Authenticated users (any logged-in user can view labs)
router.get('/', auth, async (req, res) => {
    try {
        const [labs] = await pool.query('SELECT * FROM labs ORDER BY name ASC');
        res.json(labs);
    } catch (err) {
        console.error('Error fetching labs:', err.message, err.stack);
        res.status(500).send('Server Error: Could not fetch labs');
    }
});

// @route   GET api/labs/:id
// @desc    Get a single lab by ID
// @access  Authenticated users
router.get('/:id', auth, async (req, res) => {
    try {
        const [labs] = await pool.query('SELECT * FROM labs WHERE id = ?', [req.params.id]);
        if (labs.length === 0) {
            return res.status(404).json({ msg: 'Lab not found' });
        }
        res.json(labs[0]);
    } catch (err) {
        console.error('Error fetching single lab:', err.message, err.stack);
        res.status(500).send('Server Error: Could not fetch lab');
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
        if (createdLab.length === 0) {
            return res.status(500).json({ msg: 'Failed to retrieve created lab details.' });
        }
        res.status(201).json(createdLab[0]);
    } catch (err) {
        console.error('Error creating lab:', err.message, err.stack);
        res.status(500).send('Server error while creating lab');
    }
});

// @route   PUT api/labs/:id
// @desc    Update an existing lab
// @access  Private (Admin only)
router.put('/:id', [auth, isAdmin], async (req, res) => {
    const { name, capacity, roomNumber, location } = req.body;
    const labId = req.params.id;

    // Basic validation for required fields
    if (name === undefined && capacity === undefined && roomNumber === undefined && location === undefined) {
        return res.status(400).json({ msg: 'At least one field (name, capacity, roomNumber, location) must be provided for update.' });
    }
    
    const fieldsToUpdate = {};
    if (name !== undefined) fieldsToUpdate.name = name;
    if (roomNumber !== undefined) fieldsToUpdate.roomNumber = roomNumber;
    if (location !== undefined) fieldsToUpdate.location = location === '' ? null : location; // Allow setting location to null

    if (capacity !== undefined) {
        const parsedCapacity = parseInt(capacity);
        if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
            return res.status(400).json({ msg: 'Capacity must be a positive number if provided.' });
        }
        fieldsToUpdate.capacity = parsedCapacity;
    }
    
    if (Object.keys(fieldsToUpdate).length === 0) {
         return res.status(400).json({ msg: 'No valid fields provided for update.' });
    }


    try {
        const [existingLabs] = await pool.query('SELECT * FROM labs WHERE id = ?', [labId]);
        if (existingLabs.length === 0) {
            return res.status(404).json({ msg: 'Lab not found' });
        }
        
        await pool.query('UPDATE labs SET ? WHERE id = ?', [fieldsToUpdate, labId]);
        
        const [updatedLab] = await pool.query('SELECT * FROM labs WHERE id = ?', [labId]);
        if (updatedLab.length === 0) {
            return res.status(500).json({ msg: 'Failed to retrieve updated lab details after update.' });
        }
        res.json(updatedLab[0]);
    } catch (err) {
        console.error('Error updating lab:', err.message, err.stack);
        res.status(500).send('Server error while updating lab');
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

        // MySQL schema has ON DELETE CASCADE for bookings, ON DELETE SET NULL for equipment
        await pool.query('DELETE FROM labs WHERE id = ?', [labId]);
        res.json({ msg: 'Lab deleted successfully' });
    } catch (err) {
        console.error('Error deleting lab:', err.message, err.stack);
        // Check for foreign key constraint violation if ON DELETE RESTRICT was used elsewhere
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || (err.sqlMessage && err.sqlMessage.toLowerCase().includes('foreign key constraint fails'))) {
             return res.status(400).json({ msg: 'Cannot delete lab. It is referenced by other records that do not allow cascading deletion or setting null. Please remove or reassign these references first (e.g., bookings, equipment).' });
        }
        res.status(500).send('Server error while deleting lab');
    }
});


// @route   GET api/labs/:labId/seats
// @desc    Get all seat statuses for a lab
// @access  Authenticated (any authenticated user can view seat statuses, e.g., for dialog)
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
        console.error('Error fetching seat statuses:', err.message, err.stack);
        res.status(500).send('Server Error: Could not fetch seat statuses.');
    }
});

// @route   PUT api/labs/:labId/seats/:seatIndex
// @desc    Update status of a specific seat by Assistant or Admin
// @access  Private (Assistant or Admin)
router.put('/:labId/seats/:seatIndex', auth, async (req, res) => { 
    // Explicit role check within the handler
    if (req.user.role !== USER_ROLES_BACKEND.ASSISTANT && req.user.role !== USER_ROLES_BACKEND.ADMIN) {
        return res.status(403).json({ msg: 'Access denied. Assistant or Admin role required.'});
    }

    const { labId, seatIndex } = req.params;
    const { status } = req.body; // expecting { status: 'working' | 'not-working' }

    if (!status || !['working', 'not-working'].includes(status)) {
        return res.status(400).json({ msg: 'Invalid status provided. Must be "working" or "not-working".' });
    }

    try {
        const [labExists] = await pool.query('SELECT id FROM labs WHERE id = ?', [labId]);
        if (labExists.length === 0) {
            return res.status(404).json({ msg: 'Lab not found.' });
        }

        // UPSERT: Insert if not exists, update if exists
        await pool.query(
            `INSERT INTO lab_seat_statuses (labId, seatIndex, status, updatedAt) 
             VALUES (?, ?, ?, NOW()) 
             ON DUPLICATE KEY UPDATE status = VALUES(status), updatedAt = NOW()`,
            [labId, seatIndex, status]
        );
        res.json({ msg: `Seat ${seatIndex} in lab ${labId} updated to ${status}` });
    } catch (err) {
        console.error('Error updating seat status:', err.message, err.stack);
        if (err.code === 'ER_NO_REFERENCED_ROW_2') { // Should be caught by labExists check, but good fallback
            return res.status(400).json({ msg: 'Invalid labId. The specified lab does not exist.' });
        }
        res.status(500).send('Server Error: Could not update seat status.');
    }
});

module.exports = router;
