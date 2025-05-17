
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
        // This assumes faculty requests are also stored in 'bookings' table with a specific status
        // or they might be in a separate table if the structure is very different.
        // For now, let's assume they are in 'bookings' with status 'pending-admin-approval'.
        const [requests] = await pool.query(`
            SELECT b.*, u.fullName as userName, u.email as userEmail, l.name as labName
            FROM bookings b
            JOIN users u ON b.userId = u.id
            LEFT JOIN labs l ON b.labId = l.id  -- Use LEFT JOIN if labId can be null for some faculty requests
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
    // const { additionalParams } = req.body; // If algorithms need params from frontend

    console.log(`Admin triggered algorithm: ${algorithmName}`);

    // In a real system, this is where you'd:
    // 1. Fetch necessary data from MySQL (labs, current bookings, constraints, etc.)
    // 2. Format data for your C++ executable.
    // 3. Spawn the C++ child process:
    //    const { spawn } = require('child_process');
    //    const cppProcess = spawn('./path/to/your_cpp_algo_executable', [/* args for C++ */]);
    //    cppProcess.stdout.on('data', (data) => { /* Handle output from C++ */ });
    //    cppProcess.stderr.on('data', (data) => { /* Handle errors from C++ */ });
    //    cppProcess.on('close', (code) => { /* Handle process exit */ });
    // 4. Receive output from C++ (e.g., the new schedule).
    // 5. Update your MySQL database with the results.

    // Placeholder response:
    try {
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
        
        // Example: Based on algorithmName, update some mock status or data
        let message = `${algorithmName.replace(/-/g, ' ')} algorithm run successfully (simulation).`;
        if (algorithmName === 'run-scheduling') {
            // Potentially, fetch bookings, mark some as 'scheduled-by-algorithm'
            // For now, just a message.
        }
        
        res.json({ success: true, message });
    } catch (error) {
        console.error(`Error running algorithm ${algorithmName}:`, error);
        res.status(500).json({ success: false, message: `Error running ${algorithmName}.` });
    }
});


// Endpoint for Lab Seat Statuses
// @route   GET api/admin/labs/:labId/seats
// @desc    Get all seat statuses for a lab (Admin might also need this)
// @access  Private (Admin only)
router.get('/labs/:labId/seats', [auth, isAdmin], async (req, res) => {
    const { labId } = req.params;
    try {
        // This assumes you have a lab_seat_statuses table
        // CREATE TABLE IF NOT EXISTS lab_seat_statuses (
        //     id INT AUTO_INCREMENT PRIMARY KEY,
        //     labId INT NOT NULL,
        //     seatIndex VARCHAR(50) NOT NULL, -- e.g., "0", "1", "A1", "B2"
        //     status VARCHAR(20) NOT NULL DEFAULT 'working', -- 'working', 'not-working'
        //     updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        //     UNIQUE KEY unique_seat (labId, seatIndex),
        //     FOREIGN KEY (labId) REFERENCES labs(id) ON DELETE CASCADE
        // );
        const [seatStatuses] = await pool.query(
            'SELECT seatIndex, status FROM lab_seat_statuses WHERE labId = ?',
            [labId]
        );
        // Convert array of objects to the format { seatIndex: status, ... }
        const statusesMap = seatStatuses.reduce((acc, seat) => {
            acc[seat.seatIndex] = seat.status;
            return acc;
        }, {});
        res.json(statusesMap);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error: Could not fetch seat statuses.');
    }
});

// @route   PUT api/admin/labs/:labId/seats/:seatIndex
// @desc    Update status of a specific seat (This is primarily Assistant's job, but admin might override)
// @access  Private (Admin or Assistant - might need role check if different logic)
// This duplicates assistant_seat_updater.js functionality but could be admin specific version
// Or, consolidate seat update logic into a shared service if complex.
// For now, keeping it simple. If Assistant has its own /api/assistant/labs/:labId/seats endpoint, this might be redundant.
// Assuming Assistants will have their own dedicated endpoint or this is for Admin overrides.
router.put('/labs/:labId/seats/:seatIndex', [auth, isAdmin], async (req, res) => {
    const { labId, seatIndex } = req.params;
    const { status } = req.body; // expecting { status: 'working' | 'not-working' }

    if (!status || !['working', 'not-working'].includes(status)) {
        return res.status(400).json({ msg: 'Invalid status provided. Must be "working" or "not-working".' });
    }

    try {
        // UPSERT logic: Insert if not exists, update if exists
        await pool.query(
            `INSERT INTO lab_seat_statuses (labId, seatIndex, status) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE status = VALUES(status), updatedAt = CURRENT_TIMESTAMP`,
            [labId, seatIndex, status]
        );
        res.json({ msg: `Seat ${seatIndex} in lab ${labId} updated to ${status}` });
    } catch (err) {
        console.error(err.message);
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ msg: 'Invalid labId. The specified lab does not exist.' });
        }
        res.status(500).send('Server Error: Could not update seat status.');
    }
});


module.exports = router;
