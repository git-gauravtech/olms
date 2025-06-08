
const express = require('express');
const pool = require('../config/db');
const { auth, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/equipment - Get all equipment (Admin only)
router.get('/', auth, authorize(['admin']), async (req, res) => {
    try {
        const [equipmentList] = await pool.query(
            `SELECT e.*, l.name as lab_name 
             FROM Equipment e 
             LEFT JOIN Labs l ON e.lab_id = l.lab_id 
             ORDER BY e.name ASC`
        );
        res.json(equipmentList);
    } catch (error) {
        console.error('Error fetching equipment:', error);
        res.status(500).json({ message: 'Server error fetching equipment.' });
    }
});

// POST /api/equipment - Create new equipment (Admin only)
router.post('/', auth, authorize(['admin']), async (req, res) => {
    const { name, description, type, quantity, status, lab_id, purchase_date, last_maintenance_date } = req.body;

    if (!name || !type) {
        return res.status(400).json({ message: 'Equipment name and type are required.' });
    }
    if (quantity !== undefined && (isNaN(parseInt(quantity)) || parseInt(quantity) < 0)) {
        return res.status(400).json({ message: 'Quantity must be a non-negative number.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO Equipment (name, description, type, quantity, status, lab_id, purchase_date, last_maintenance_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                name,
                description || null,
                type,
                quantity === undefined ? 1 : parseInt(quantity),
                status || 'Available',
                lab_id || null,
                purchase_date || null,
                last_maintenance_date || null
            ]
        );
        const newEquipmentId = result.insertId;
        const [newEquipment] = await pool.query(
            `SELECT e.*, l.name as lab_name 
             FROM Equipment e 
             LEFT JOIN Labs l ON e.lab_id = l.lab_id 
             WHERE e.equipment_id = ?`,
            [newEquipmentId]
        );
        res.status(201).json({
            message: 'Equipment created successfully!',
            equipment: newEquipment[0]
        });
    } catch (error) {
        console.error('Error creating equipment:', error);
        res.status(500).json({ message: 'Server error creating equipment.' });
    }
});

// PUT /api/equipment/:equipmentId - Update existing equipment (Admin only)
router.put('/:equipmentId', auth, authorize(['admin']), async (req, res) => {
    const { equipmentId } = req.params;
    const { name, description, type, quantity, status, lab_id, purchase_date, last_maintenance_date } = req.body;

    if (!name || !type) {
        return res.status(400).json({ message: 'Equipment name and type are required.' });
    }
     if (quantity !== undefined && (isNaN(parseInt(quantity)) || parseInt(quantity) < 0)) {
        return res.status(400).json({ message: 'Quantity must be a non-negative number.' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE Equipment SET name = ?, description = ?, type = ?, quantity = ?, status = ?, lab_id = ?, purchase_date = ?, last_maintenance_date = ? WHERE equipment_id = ?',
            [
                name,
                description || null,
                type,
                quantity === undefined ? 1 : parseInt(quantity),
                status || 'Available',
                lab_id || null,
                purchase_date || null,
                last_maintenance_date || null,
                equipmentId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Equipment not found or no changes made.' });
        }
        const [updatedEquipment] = await pool.query(
            `SELECT e.*, l.name as lab_name 
             FROM Equipment e 
             LEFT JOIN Labs l ON e.lab_id = l.lab_id 
             WHERE e.equipment_id = ?`,
            [equipmentId]
        );
        res.json({
            message: 'Equipment updated successfully!',
            equipment: updatedEquipment[0]
        });
    } catch (error) {
        console.error('Error updating equipment:', error);
        res.status(500).json({ message: 'Server error updating equipment.' });
    }
});

// DELETE /api/equipment/:equipmentId - Delete equipment (Admin only)
router.delete('/:equipmentId', auth, authorize(['admin']), async (req, res) => {
    const { equipmentId } = req.params;

    try {
        // Add checks here if equipment is part of active bookings or has other dependencies
        // For now, direct delete:
        const [result] = await pool.query('DELETE FROM Equipment WHERE equipment_id = ?', [equipmentId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Equipment not found.' });
        }
        res.json({ message: 'Equipment deleted successfully.' });
    } catch (error)
 {
        console.error('Error deleting equipment:', error);
        // Handle foreign key constraints if any (e.g., ER_ROW_IS_REFERENCED_2)
        res.status(500).json({ message: 'Server error deleting equipment.' });
    }
});

module.exports = router;
