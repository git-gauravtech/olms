
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, isAdmin } = require('../middleware/authMiddleware');

// @route   GET api/equipment
// @desc    Get all equipment, optionally filter by labId or status
// @access  Authenticated
router.get('/', auth, async (req, res) => {
    const { labId, status } = req.query;
    let query = 'SELECT e.*, l.name as labName FROM equipment e LEFT JOIN labs l ON e.labId = l.id';
    const queryParams = [];
    let conditions = [];

    if (labId) {
        conditions.push('e.labId = ?');
        queryParams.push(labId);
    }
    if (status) {
        conditions.push('e.status = ?');
        queryParams.push(status);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY e.name ASC';

    try {
        const [equipment] = await pool.query(query, queryParams);
        res.json(equipment);
    } catch (err) {
        console.error('Error fetching equipment:', err.message);
        res.status(500).send('Server Error: Could not fetch equipment');
    }
});

// @route   GET api/equipment/:id
// @desc    Get single equipment by ID
// @access  Authenticated
router.get('/:id', auth, async (req, res) => {
    try {
        const [equipment] = await pool.query('SELECT e.*, l.name as labName FROM equipment e LEFT JOIN labs l ON e.labId = l.id WHERE e.id = ?', [req.params.id]);
        if (equipment.length === 0) {
            return res.status(404).json({ msg: 'Equipment not found' });
        }
        res.json(equipment[0]);
    } catch (err) {
        console.error('Error fetching single equipment:', err.message);
        res.status(500).send('Server Error: Could not fetch equipment');
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
            return res.status(400).json({ msg: 'Invalid labId format. Must be a number or null.' });
        }

        const [result] = await pool.query('INSERT INTO equipment SET ?', newEquipment);
        
        const [createdEquipment] = await pool.query('SELECT e.*, l.name as labName FROM equipment e LEFT JOIN labs l ON e.labId = l.id WHERE e.id = ?', [result.insertId]);
        res.status(201).json(createdEquipment[0]);
    } catch (err) {
        console.error('Error creating equipment:', err.message);
        if (err.code === 'ER_NO_REFERENCED_ROW_2' && labId) {
            return res.status(400).json({ msg: 'Invalid labId. The specified lab does not exist.' });
        }
        res.status(500).send('Server error while creating equipment');
    }
});

// @route   PUT api/equipment/:id
// @desc    Update existing equipment
// @access  Private (Admin only)
router.put('/:id', [auth, isAdmin], async (req, res) => {
    const { name, type, status, labId } = req.body;
    const equipmentId = req.params.id;

    // Basic validation for required fields
    if (name === undefined && type === undefined && status === undefined && labId === undefined) {
        return res.status(400).json({ msg: 'At least one field (name, type, status, labId) must be provided for update.' });
    }

    if (status) {
        const validStatuses = ['available', 'in-use', 'maintenance', 'broken'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ msg: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }
    }
    
    let parsedLabId;
    if (labId !== undefined) { // labId can be null to unassign
        if (labId === null || labId === '') {
            parsedLabId = null;
        } else {
            parsedLabId = parseInt(labId);
            if (isNaN(parsedLabId)) {
                return res.status(400).json({ msg: 'Invalid labId format. Must be a number or null/empty.' });
            }
        }
    }


    try {
        const [existingEquipmentResult] = await pool.query('SELECT * FROM equipment WHERE id = ?', [equipmentId]);
        if (existingEquipmentResult.length === 0) {
            return res.status(404).json({ msg: 'Equipment not found' });
        }
        const existingEquipment = existingEquipmentResult[0];

        const updatedEquipmentData = {
            name: name !== undefined ? name : existingEquipment.name,
            type: type !== undefined ? type : existingEquipment.type,
            status: status !== undefined ? status : existingEquipment.status,
            labId: labId !== undefined ? parsedLabId : existingEquipment.labId
        };
        
        await pool.query('UPDATE equipment SET ? WHERE id = ?', [updatedEquipmentData, equipmentId]);
        
        const [updatedEquipment] = await pool.query('SELECT e.*, l.name as labName FROM equipment e LEFT JOIN labs l ON e.labId = l.id WHERE e.id = ?', [equipmentId]);
        res.json(updatedEquipment[0]);
    } catch (err) {
        console.error('Error updating equipment:', err.message);
        if (err.code === 'ER_NO_REFERENCED_ROW_2' && parsedLabId) { // Only if a non-null labId was provided and failed
            return res.status(400).json({ msg: 'Invalid labId. The specified lab does not exist.' });
        }
        res.status(500).send('Server error while updating equipment');
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
        await pool.query('DELETE FROM equipment WHERE id = ?', [equipmentId]);
        res.json({ msg: 'Equipment deleted successfully' });
    } catch (err) {
        console.error('Error deleting equipment:', err.message);
        res.status(500).send('Server error while deleting equipment');
    }
});

module.exports = router;
