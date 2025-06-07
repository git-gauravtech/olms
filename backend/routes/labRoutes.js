
const express = require('express');
const pool = require('../config/db');
const { auth, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/labs - Get all labs (Admin only)
router.get('/', auth, authorize(['admin']), async (req, res) => {
    try {
        const [labs] = await pool.query('SELECT * FROM Labs ORDER BY name ASC');
        res.json(labs);
    } catch (error) {
        console.error('Error fetching labs:', error);
        res.status(500).json({ message: 'Server error fetching labs.' });
    }
});

// GET /api/labs/:labId - Get a single lab by ID (Admin only)
router.get('/:labId', auth, authorize(['admin']), async (req, res) => {
    const { labId } = req.params;
    try {
        const [labs] = await pool.query('SELECT * FROM Labs WHERE lab_id = ?', [labId]);
        if (labs.length === 0) {
            return res.status(404).json({ message: 'Lab not found.' });
        }
        res.json(labs[0]);
    } catch (error) {
        console.error('Error fetching lab:', error);
        res.status(500).json({ message: 'Server error fetching lab.' });
    }
});

// POST /api/labs - Create a new lab (Admin only)
router.post('/', auth, authorize(['admin']), async (req, res) => {
    const { name, room_number, capacity, type, is_available = true } = req.body;

    if (!name || !capacity) {
        return res.status(400).json({ message: 'Lab name and capacity are required.' });
    }
    if (isNaN(parseInt(capacity)) || parseInt(capacity) <= 0) {
        return res.status(400).json({ message: 'Capacity must be a positive number.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO Labs (name, room_number, capacity, type, is_available) VALUES (?, ?, ?, ?, ?)',
            [name, room_number || null, parseInt(capacity), type || null, is_available]
        );
        const newLabId = result.insertId;
        const [newLab] = await pool.query('SELECT * FROM Labs WHERE lab_id = ?', [newLabId]);

        res.status(201).json({ 
            message: 'Lab created successfully!', 
            lab: newLab[0]
        });
    } catch (error) {
        console.error('Error creating lab:', error);
        if (error.code === 'ER_DUP_ENTRY') { // Example: if you have a unique constraint on name or room_number
            return res.status(409).json({ message: 'A lab with this name or room number already exists.' });
        }
        res.status(500).json({ message: 'Server error creating lab.' });
    }
});

// PUT /api/labs/:labId - Update an existing lab (Admin only)
router.put('/:labId', auth, authorize(['admin']), async (req, res) => {
    const { labId } = req.params;
    const { name, room_number, capacity, type, is_available } = req.body;

    if (!name || !capacity) {
        return res.status(400).json({ message: 'Lab name and capacity are required.' });
    }
    if (isNaN(parseInt(capacity)) || parseInt(capacity) <= 0) {
        return res.status(400).json({ message: 'Capacity must be a positive number.' });
    }
    
    try {
        const [result] = await pool.query(
            'UPDATE Labs SET name = ?, room_number = ?, capacity = ?, type = ?, is_available = ? WHERE lab_id = ?',
            [name, room_number || null, parseInt(capacity), type || null, is_available === undefined ? true : is_available, labId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Lab not found or no changes made.' });
        }
        
        const [updatedLab] = await pool.query('SELECT * FROM Labs WHERE lab_id = ?', [labId]);
        res.json({ 
            message: 'Lab updated successfully!',
            lab: updatedLab[0]
        });
    } catch (error) {
        console.error('Error updating lab:', error);
         if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Update failed. A lab with this name or room number might already exist.' });
        }
        res.status(500).json({ message: 'Server error updating lab.' });
    }
});

// DELETE /api/labs/:labId - Delete a lab (Admin only)
router.delete('/:labId', auth, authorize(['admin']), async (req, res) => {
    const { labId } = req.params;

    try {
        // Check for related bookings before deleting if necessary
        const [bookings] = await pool.query('SELECT booking_id FROM Bookings WHERE lab_id = ?', [labId]);
        if (bookings.length > 0) {
            return res.status(400).json({ message: 'Cannot delete lab. It has associated bookings. Please remove related bookings first.' });
        }

        const [result] = await pool.query('DELETE FROM Labs WHERE lab_id = ?', [labId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Lab not found.' });
        }

        res.json({ message: 'Lab deleted successfully.' });
    } catch (error) {
        console.error('Error deleting lab:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') { // Generic foreign key constraint
             return res.status(400).json({ message: 'Cannot delete lab. It is referenced by other records (e.g., bookings). Please remove related records first.' });
        }
        res.status(500).json({ message: 'Server error deleting lab.' });
    }
});


module.exports = router;
