
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, isAdmin, USER_ROLES } = require('../middleware/authMiddleware');


router.get('/', auth, async (req, res) => {
    try {
        const [labs] = await pool.query('SELECT * FROM labs ORDER BY name ASC');
        res.json(labs);
    } catch (err) {
        console.error('Error fetching labs:', err.message, err.stack);
        res.status(500).send('Server Error: Could not fetch labs');
    }
});

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

router.put('/:id', [auth, isAdmin], async (req, res) => {
    const { name, capacity, roomNumber, location } = req.body;
    const labId = req.params.id;

    if (name === undefined && capacity === undefined && roomNumber === undefined && location === undefined) {
        return res.status(400).json({ msg: 'At least one field (name, capacity, roomNumber, location) must be provided for update.' });
    }
    
    const fieldsToUpdate = {};
    if (name !== undefined) fieldsToUpdate.name = name;
    if (roomNumber !== undefined) fieldsToUpdate.roomNumber = roomNumber;
    if (location !== undefined) fieldsToUpdate.location = location === '' ? null : location;

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

router.delete('/:id', [auth, isAdmin], async (req, res) => {
    const labId = req.params.id;
    try {
        const [existingLabs] = await pool.query('SELECT * FROM labs WHERE id = ?', [labId]);
        if (existingLabs.length === 0) {
            return res.status(404).json({ msg: 'Lab not found' });
        }
        await pool.query('DELETE FROM labs WHERE id = ?', [labId]);
        res.json({ msg: 'Lab deleted successfully' });
    } catch (err) {
        console.error('Error deleting lab:', err.message, err.stack);
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || (err.sqlMessage && err.sqlMessage.toLowerCase().includes('foreign key constraint fails'))) {
             return res.status(400).json({ msg: 'Cannot delete lab. It is referenced by other records (e.g., bookings, equipment, seats). Please remove or reassign these references first.' });
        }
        res.status(500).send('Server error while deleting lab');
    }
});

router.get('/:labId/seats', auth, async (req, res) => { 
    const { labId } = req.params;
    try {
        const [seatStatuses] = await pool.query(
            'SELECT seat_number, status FROM seats WHERE lab_id = ?',
            [labId]
        );
        const statusesMap = seatStatuses.reduce((acc, seat) => {
            acc[seat.seat_number] = seat.status;
            return acc;
        }, {});
        res.json(statusesMap);
    } catch (err) {
        console.error('Error fetching seat statuses:', err.message, err.stack);
        res.status(500).send('Server Error: Could not fetch seat statuses.');
    }
});

router.put('/:labId/seats/:seatNumber', auth, async (req, res) => { 
    if (req.user.role !== USER_ROLES.ASSISTANT && req.user.role !== USER_ROLES.ADMIN) {
        return res.status(403).json({ msg: 'Access denied. Assistant or Admin role required.'});
    }

    const { labId, seatNumber } = req.params;
    const { status } = req.body;

    if (!status || !['working', 'not-working'].includes(status)) {
        return res.status(400).json({ msg: 'Invalid status provided. Must be "working" or "not-working".' });
    }

    try {
        const [labExists] = await pool.query('SELECT id, capacity FROM labs WHERE id = ?', [labId]);
        if (labExists.length === 0) {
            return res.status(404).json({ msg: 'Lab not found.' });
        }
        const labCapacity = labExists[0].capacity;
        if (parseInt(seatNumber) < 0 || parseInt(seatNumber) >= labCapacity) {
            return res.status(400).json({ msg: `Invalid seat number. Must be between 0 and ${labCapacity - 1}.`})
        }

        await pool.query(
            `INSERT INTO seats (lab_id, seat_number, status) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE status = VALUES(status), updatedAt = NOW()`,
            [labId, seatNumber, status]
        );
        res.json({ msg: `Seat ${seatNumber} in lab ${labId} updated to ${status}` });
    } catch (err) {
        console.error('Error updating seat status:', err.message, err.stack);
        if (err.code === 'ER_NO_REFERENCED_ROW_2') { 
            return res.status(400).json({ msg: 'Invalid labId. The specified lab does not exist.' });
        }
        res.status(500).send('Server Error: Could not update seat status.');
    }
});

module.exports = router;
    