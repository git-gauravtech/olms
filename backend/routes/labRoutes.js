
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, isAdmin } = require('../middleware/authMiddleware');

// @route   GET api/labs
// @desc    Get all labs
// @access  Public (or protected if needed by auth)
router.get('/', async (req, res) => {
    try {
        const [labs] = await pool.query('SELECT * FROM labs ORDER BY name ASC');
        res.json(labs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/labs/:id
// @desc    Get a single lab by ID
// @access  Public (or protected)
router.get('/:id', async (req, res) => {
    try {
        const [labs] = await pool.query('SELECT * FROM labs WHERE id = ?', [req.params.id]);
        if (labs.length === 0) {
            return res.status(404).json({ msg: 'Lab not found' });
        }
        res.json(labs[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/labs
// @desc    Create a new lab
// @access  Private (Admin only)
router.post('/', [auth, isAdmin], async (req, res) => {
    const { name, capacity, roomNumber, location } = req.body;

    // Basic validation
    if (!name || !capacity || !roomNumber) {
        return res.status(400).json({ msg: 'Please include name, capacity, and room number' });
    }
    if (isNaN(parseInt(capacity)) || parseInt(capacity) <= 0) {
        return res.status(400).json({ msg: 'Capacity must be a positive number' });
    }

    try {
        const newLab = { name, capacity: parseInt(capacity), roomNumber, location: location || null };
        const [result] = await pool.query('INSERT INTO labs SET ?', newLab);
        
        const [createdLabs] = await pool.query('SELECT * FROM labs WHERE id = ?', [result.insertId]);
        res.status(201).json(createdLabs[0]);
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

    // Basic validation
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
        
        const [updatedLabs] = await pool.query('SELECT * FROM labs WHERE id = ?', [labId]);
        res.json(updatedLabs[0]);
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

        // Consider implications: what happens to bookings for this lab? 
        // ON DELETE CASCADE for bookings.labId might be an option, or handle here.
        await pool.query('DELETE FROM labs WHERE id = ?', [labId]);
        res.json({ msg: 'Lab deleted successfully' });
    } catch (err) {
        console.error('Error deleting lab:', err.message);
        // Check for foreign key constraint errors if lab is referenced elsewhere
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(400).json({ msg: 'Cannot delete lab. It is referenced by other records (e.g., bookings or equipment). Please remove references first.' });
        }
        res.status(500).send('Server error');
    }
});

module.exports = router;
