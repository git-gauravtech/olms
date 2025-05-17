
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, isAdmin } = require('../middleware/authMiddleware');

// @route   GET api/admin/requests/assistant
// @desc    Get pending requests from Assistants (for Admin to review)
// @access  Private (Admin only)
router.get('/requests/assistant', [auth, isAdmin], async (req, res) => {
    try {
        const [requests] = await pool.query(`
            SELECT b.*, u.fullName as userName, u.email as userEmail, l.name as labName
            FROM bookings b
            JOIN users u ON b.userId = u.id
            JOIN labs l ON b.labId = l.id
            WHERE b.requestedByRole = 'Assistant' AND b.status = 'pending'
            ORDER BY b.submittedDate ASC
        `);
        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error: Could not fetch assistant requests');
    }
});

// @route   GET api/admin/requests/faculty
// @desc    Get faculty requests needing admin approval
// @access  Private (Admin only)
router.get('/requests/faculty', [auth, isAdmin], async (req, res) => {
    try {
        const [requests] = await pool.query(`
            SELECT b.*, u.fullName as userName, u.email as userEmail, l.name as labName
            FROM bookings b
            JOIN users u ON b.userId = u.id
            LEFT JOIN labs l ON b.labId = l.id
            WHERE b.requestedByRole = 'Faculty' AND b.status = 'pending-admin-approval' 
            ORDER BY b.submittedDate ASC
        `);
        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error: Could not fetch faculty admin requests');
    }
});


// @route   POST api/admin/algorithms/:algorithmName
// @desc    Trigger a specific scheduling/optimization algorithm
// @access  Private (Admin only)
router.post('/algorithms/:algorithmName', [auth, isAdmin], async (req, res) => {
    const { algorithmName } = req.params;
    console.log(`Admin triggered algorithm: ${algorithmName}`);
    // Placeholder for actual C++ algorithm execution via child_process or other means
    try {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        res.json({ 
            success: true, 
            message: `${algorithmName.replace(/-/g, ' ')} algorithm run successfully (simulation). Results would be applied to the database.` 
        });
    } catch (error) {
        console.error(`Error running algorithm ${algorithmName}:`, error);
        res.status(500).json({ success: false, message: `Error running ${algorithmName}.` });
    }
});

module.exports = router;

