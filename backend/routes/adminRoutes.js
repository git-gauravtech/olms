
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, isAdmin } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');

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
            WHERE b.status = ? AND b.requestedByRole = ?
            ORDER BY b.submittedDate ASC
        `, ['pending-admin-approval', 'Faculty']);
        res.json(requests);
    } catch (err) {
        console.error('Error fetching faculty admin requests:', err.message);
        res.status(500).send('Server Error: Could not fetch faculty admin requests');
    }
});

// GET /api/admin/requests/assistant endpoint has been removed

// @route   POST api/admin/algorithms/:algorithmName
// @desc    Trigger a specific DAA algorithm (simulation)
// @access  Private (Admin only)
router.post('/algorithms/:algorithmName', [auth, isAdmin], async (req, res) => {
    const { algorithmName } = req.params;
    console.log(`[Backend] Admin triggered algorithm: ${algorithmName}`);

    try {
        // Simulate fetching data based on algorithm
        console.log(`[Backend] Preparing data for ${algorithmName}...`);
        if (algorithmName === 'run-scheduling') {
            console.log("[Backend] Would fetch: labs, booking requests, constraints, time slots for Graph Coloring.");
            // const labs = await pool.query("SELECT * FROM labs");
            // const pendingRequests = await pool.query("SELECT * FROM bookings WHERE status='pending'");
        } else if (algorithmName === 'run-resource-allocation') {
            console.log("[Backend] Would fetch: scarce equipment, availability, requesting sessions, priorities for 0/1 Knapsack.");
        } else if (algorithmName === 'optimize-lab-usage') {
            console.log("[Backend] Would fetch: current schedule, empty slots, pending requests for Greedy Algorithm.");
        } else if (algorithmName === 'assign-nearest-labs') {
            console.log("[Backend] Would fetch: lab locations, user location, available labs for Dijkstra's.");
        }

        // Simulate calling C++ executable
        console.log(`[Backend] Simulating call to C++ executable for ${algorithmName}...`);
        // In a real scenario:
        // const cppProcess = spawn('path/to/cpp_executable_${algorithmName}', [JSON.stringify(inputData)]);
        // ... handle stdout, stderr, close events ...
        const simulatedOutput = {
            status: "success",
            message: `Algorithm ${algorithmName} simulated successfully.`,
            details: `Processed X items, updated Y records. (Simulated)`
        };

        // Simulate updating database with results
        console.log(`[Backend] Simulating database update with results from ${algorithmName}...`);

        res.json({
            success: true,
            message: `Algorithm '${algorithmName}' triggered successfully (simulation).`,
            algorithmOutput: simulatedOutput
        });

    } catch (error) {
        console.error(`[Backend] Error triggering algorithm ${algorithmName}:`, error.message, error.stack);
        res.status(500).json({ success: false, message: `Server error while triggering ${algorithmName}.` });
    }
});

// @route   GET api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/users', [auth, isAdmin], async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, fullName, email, role, department, createdAt FROM users ORDER BY fullName ASC');
        res.json(users);
    } catch (err) {
        console.error('Error fetching users in /api/admin/users:', err.message);
        res.status(500).send('Server Error: Could not fetch users');
    }
});

// @route   POST api/admin/users
// @desc    Admin creates a new user
// @access  Private (Admin only)
router.post('/users', [auth, isAdmin], async (req, res) => {
    const { fullName, email, password, role, department } = req.body;

    if (!fullName || !email || !password || !role) {
        return res.status(400).json({ msg: 'Please enter all required fields' });
    }
    if (password.length < 6) {
        return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
    }

    try {
        let [users] = await pool.query('SELECT email FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(400).json({ msg: 'User already exists with this email' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            fullName,
            email,
            passwordHash: hashedPassword,
            role,
            department: department || null
        };
        const [result] = await pool.query('INSERT INTO users SET ?', newUser);
        const [createdUser] = await pool.query('SELECT id, fullName, email, role, department, createdAt FROM users WHERE id = ?', [result.insertId]);
        
        res.status(201).json(createdUser[0]);
    } catch (err) {
        console.error('Admin create user error:', err.message, err.stack);
        res.status(500).send('Server error during user creation by admin');
    }
});

// @route   PUT api/admin/users/:userId
// @desc    Admin updates a user
// @access  Private (Admin only)
router.put('/users/:userId', [auth, isAdmin], async (req, res) => {
    const { fullName, email, role, department } = req.body;
    const { userId } = req.params;

    if (!fullName || !email || !role ) { // Email and role are critical
        return res.status(400).json({ msg: 'FullName, email, and role are required for update.' });
    }

    try {
        const [existingUsers] = await pool.query('SELECT id, email FROM users WHERE id = ?', [userId]);
        if (existingUsers.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if email is being changed and if the new email already exists for another user
        if (email !== existingUsers[0].email) {
            const [emailCheck] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
            if (emailCheck.length > 0) {
                return res.status(400).json({ msg: 'Email already in use by another account.' });
            }
        }
        
        const updatedUserData = {
            fullName,
            email,
            role,
            department: department !== undefined ? department : existingUsers[0].department
        };

        await pool.query('UPDATE users SET ? WHERE id = ?', [updatedUserData, userId]);
        
        const [updatedUser] = await pool.query('SELECT id, fullName, email, role, department, createdAt FROM users WHERE id = ?', [userId]);
        res.json(updatedUser[0]);

    } catch (err) {
        console.error('Admin update user error:', err.message, err.stack);
        res.status(500).send('Server error while updating user by admin.');
    }
});

// @route   DELETE api/admin/users/:userId
// @desc    Admin deletes a user
// @access  Private (Admin only)
router.delete('/users/:userId', [auth, isAdmin], async (req, res) => {
    const { userId } = req.params;

    try {
        const [user] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (user.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Consider implications: what happens to bookings made by this user?
        // The DB schema has ON DELETE CASCADE for bookings related to userId. This means bookings will be deleted.
        // If this is not desired, you might need a different strategy (e.g., anonymize user, disallow delete if active bookings).
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ msg: 'User deleted successfully by admin.' });

    } catch (err) {
        console.error('Admin delete user error:', err.message, err.stack);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ msg: 'Cannot delete user. They are referenced in other records (e.g., bookings). Consider deactivating instead.' });
        }
        res.status(500).send('Server error while deleting user by admin.');
    }
});


// @route   GET api/admin/system-activity
// @desc    Get mock system activity logs
// @access  Private (Admin only)
router.get('/system-activity', [auth, isAdmin], (req, res) => {
    // In a real system, this would fetch from a database table or log files
    const mockLogs = [
        { timestamp: new Date(Date.now() - 3600000).toISOString(), user: 'admin@example.com', action: 'Updated Lab "Physics Lab Alpha" details.' },
        { timestamp: new Date(Date.now() - 7200000).toISOString(), user: 'faculty@example.com', action: 'Booked Computer Lab for "CS101".' },
        { timestamp: new Date(Date.now() - 10800000).toISOString(), user: 'assistant@example.com', action: 'Updated seat status for 5 seats in "Electronics Lab".' },
        { timestamp: new Date().toISOString(), user: 'admin@example.com', action: 'Triggered "run-scheduling" algorithm simulation.' },
    ];
    res.json(mockLogs);
});


module.exports = router;
    
