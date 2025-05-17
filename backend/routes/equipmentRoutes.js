
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, isAdmin } = require('../middleware/authMiddleware');

// @route   GET api/equipment
// @desc    Get all equipment, optionally filter by labId or status
// @access  Public (or protected)
router.get('/', async (req, res) => {
    const { labId, status } = req.query;
    let query = 'SELECT e.*, l.name as labName FROM equipment e LEFT JOIN labs l ON e.labId = l.id';
    const queryParams = [];

    if (labId && status) {
        query += ' WHERE e.labId = ? AND e.status = ?';
        queryParams.push(labId, status);
    } else if (labId) {
        query += ' WHERE e.labId = ?';
        queryParams.push(labId);
    } else if (status) {
        query += ' WHERE e.status = ?';
        queryParams.push(status);
    }
    query += ' ORDER BY e.name ASC';

    try {
        const [equipment] = await pool.query(query, queryParams);
        res.json(equipment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/equipment/:id
// @desc    Get single equipment by ID
// @access  Public (or protected)
router.get('/:id', async (req, res) => {
    try {
        const [equipment] = await pool.query('SELECT e.*, l.name as labName FROM equipment e LEFT JOIN labs l ON e.labId = l.id WHERE e.id = ?', [req.params.id]);
        if (equipment.length === 0) {
            return res.status(404).json({ msg: 'Equipment not found' });
        }
        res.json(equipment[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   POST api/equipment
// @desc    Create new equipment
// @access  Private (Admin only)
router.post('/', [auth, isAdmin], async (req, res) => {
    const { name, type, status, labId } = req.body;

    if (!name || !type || !status) {
        return res.status(400).json({ msg: 'Please include name, type, and status for equipment' });
    }
    // Validate status against a predefined list if necessary
    const validStatuses = ['available', 'in-use', 'maintenance', 'broken'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ msg: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    try {
        const newEquipment = { 
            name, 
            type, 
            status, 
            labId: labId ? parseInt(labId) : null 
        };
        if (labId && isNaN(newEquipment.labId)) {
            return res.status(400).json({ msg: 'Invalid labId format' });
        }

        const [result] = await pool.query('INSERT INTO equipment SET ?', newEquipment);
        
        const [createdEquipment] = await pool.query('SELECT e.*, l.name as labName FROM equipment e LEFT JOIN labs l ON e.labId = l.id WHERE e.id = ?', [result.insertId]);
        res.status(201).json(createdEquipment[0]);
    } catch (err) {
        console.error('Error creating equipment:', err.message);
        // Check for foreign key constraint violation if labId is invalid
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ msg: 'Invalid labId. The specified lab does not exist.' });
        }
        res.status(500).send('Server error');
    }
});

// @route   PUT api/equipment/:id
// @desc    Update existing equipment
// @access  Private (Admin only)
router.put('/:id', [auth, isAdmin], async (req, res) => {
    const { name, type, status, labId } = req.body;
    const equipmentId = req.params.id;

    if (!name || !type || !status) {
        return res.status(400).json({ msg: 'Please include name, type, and status' });
    }
    const validStatuses = ['available', 'in-use', 'maintenance', 'broken'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ msg: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    
    let parsedLabId = null;
    if (labId !== undefined && labId !== null && labId !== '') { // Check if labId is explicitly provided
        parsedLabId = parseInt(labId);
        if (isNaN(parsedLabId)) {
            return res.status(400).json({ msg: 'Invalid labId format. Must be a number or null/empty.' });
        }
    }


    try {
        const [existingEquipment] = await pool.query('SELECT * FROM equipment WHERE id = ?', [equipmentId]);
        if (existingEquipment.length === 0) {
            return res.status(404).json({ msg: 'Equipment not found' });
        }

        const updatedEquipmentData = {
            name,
            type,
            status,
            labId: parsedLabId // This can be null if labId is empty string or null
        };
        
        await pool.query('UPDATE equipment SET ? WHERE id = ?', [updatedEquipmentData, equipmentId]);
        
        const [updatedEquipment] = await pool.query('SELECT e.*, l.name as labName FROM equipment e LEFT JOIN labs l ON e.labId = l.id WHERE e.id = ?', [equipmentId]);
        res.json(updatedEquipment[0]);
    } catch (err) {
        console.error('Error updating equipment:', err.message);
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ msg: 'Invalid labId. The specified lab does not exist.' });
        }
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/equipment/:id
// @desc    Delete equipment
// @access  Private (Admin only)
router.delete('/:id', [auth, isAdmin], async (req, res) => {
    const equipmentId = req.params.id;
    try {
        const [existingEquipment] = await pool.query('SELECT * FROM equipment WHERE id = ?', [equipmentId]);
        if (existingEquipment.length === 0) {
            return res.status(404).json({ msg: 'Equipment not found' });
        }
        // Consider implications if equipment is part of active bookings (equipmentIds JSON field)
        await pool.query('DELETE FROM equipment WHERE id = ?', [equipmentId]);
        res.json({ msg: 'Equipment deleted successfully' });
    } catch (err) {
        console.error('Error deleting equipment:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
