
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
            SELECT b.*, u.fullName as userName, u.email as userEmail, l.name as labName,
                   t.displayTime as timeSlotDisplay
            FROM bookings b
            JOIN users u ON b.userId = u.id
            LEFT JOIN labs l ON b.labId = l.id
            LEFT JOIN ( -- This is a way to join with mock time slots if they are not in DB
                SELECT 'ts_0800_0900' as id, '08:00 AM - 09:00 AM' as displayTime UNION ALL
                SELECT 'ts_0900_1000', '09:00 AM - 10:00 AM' UNION ALL
                SELECT 'ts_1000_1100', '10:00 AM - 11:00 AM' UNION ALL
                SELECT 'ts_1100_1200', '11:00 AM - 12:00 PM' UNION ALL
                SELECT 'ts_1200_1300', '12:00 PM - 01:00 PM' UNION ALL
                SELECT 'ts_1300_1400', '01:00 PM - 02:00 PM' UNION ALL
                SELECT 'ts_1400_1500', '02:00 PM - 03:00 PM' UNION ALL
                SELECT 'ts_1500_1600', '03:00 PM - 04:00 PM' UNION ALL
                SELECT 'ts_1600_1700', '04:00 PM - 05:00 PM' UNION ALL
                SELECT 'ts_1700_1800', '05:00 PM - 06:00 PM'
            ) t ON b.timeSlotId = t.id
            WHERE b.status = ? AND b.requestedByRole = ?
            ORDER BY b.submittedDate ASC
        `, ['pending-admin-approval', 'Faculty']);
        res.json(requests);
    } catch (err) {
        console.error('Error fetching faculty admin requests:', err.message);
        res.status(500).send('Server Error: Could not fetch faculty admin requests');
    }
});


// @route   POST api/admin/algorithms/:algorithmName
// @desc    Trigger a specific DAA algorithm (simulation)
// @access  Private (Admin only)
router.post('/algorithms/:algorithmName', [auth, isAdmin], async (req, res) => {
    const { algorithmName } = req.params;
    const { inputPayload } = req.body; // Optional: frontend might send specific parameters

    console.log(`[Backend] Admin triggered algorithm: ${algorithmName}`);
    console.log(`[Backend] Optional input payload from frontend:`, inputPayload);

    let simulatedInputForCpp = {};
    let simulatedOutputFromCpp = {};
    let dbUpdateSummary = "No database changes simulated.";
    let successMessage = `Algorithm '${algorithmName}' simulated successfully.`;

    try {
        console.log(`[Backend] Preparing data for ${algorithmName}...`);

        if (algorithmName === 'run-scheduling') { // Graph Coloring
            console.log("[Backend] Simulating: Fetching labs, booking requests, constraints, time slots for Graph Coloring.");
            // const [labs] = await pool.query("SELECT id, name, capacity, roomNumber FROM labs");
            // const [pendingRequests] = await pool.query("SELECT id, userId, requestedLabType, duration, batchIdentifier, priority FROM bookings WHERE status='pending'");
            // const [timeSlots] = await pool.query("SELECT id, startTime, endTime FROM time_slots"); // Assuming time_slots table
            
            simulatedInputForCpp = {
                labs: [{id: 1, name: "CS Lab 1", capacity: 30}, {id: 2, name: "Physics Lab Alpha", capacity: 20}],
                requests: [{id: 101, batch: "CS-A", needs: "CS Lab"}, {id: 102, batch: "PHY-B", needs: "Physics Lab"}],
                timeSlots: ["Mon 9-11", "Mon 11-1", "Tue 9-11"],
                constraints: ["InstructorA cannot teach CS-A and PHY-B simultaneously"]
            };
            console.log("[Backend] Simulated input for C++ (Graph Coloring):", JSON.stringify(simulatedInputForCpp, null, 2));

            console.log(`[Backend] Simulating call to C++ executable for Graph Coloring...`);
            // In a real scenario: const cppProcess = spawn('path/to/graph_coloring_algo', [JSON.stringify(simulatedInputForCpp)]);
            
            simulatedOutputFromCpp = {
                status: "success",
                message: "Conflict-free schedule generated.",
                newlyScheduledBookings: [
                    { requestId: 101, labId: 1, date: "2024-07-01", timeSlotId: "ts_0900_1000", userId: 5, purpose: "CS101 Lab for CS-A", status: "booked" },
                    { requestId: 102, labId: 2, date: "2024-07-01", timeSlotId: "ts_1100_1200", userId: 6, purpose: "PHY101 Lab for PHY-B", status: "booked" }
                ],
                unscheduledRequests: []
            };
            console.log("[Backend] Simulated output from C++ (Graph Coloring):", JSON.stringify(simulatedOutputFromCpp, null, 2));
            
            console.log(`[Backend] Simulating database update with results from Graph Coloring...`);
            // For each item in newlyScheduledBookings:
            // await pool.query("INSERT INTO bookings (...) VALUES (...) ON DUPLICATE KEY UPDATE ...");
            // or await pool.query("UPDATE bookings SET labId=?, date=?, timeSlotId=?, status='booked' WHERE id=?");
            dbUpdateSummary = `${simulatedOutputFromCpp.newlyScheduledBookings.length} sessions scheduled. ${simulatedOutputFromCpp.unscheduledRequests.length} requests remain unscheduled.`;
            successMessage = `Graph Coloring scheduling simulated: ${dbUpdateSummary}`;

        } else if (algorithmName === 'run-resource-allocation') { // 0/1 Knapsack
            console.log("[Backend] Simulating: Fetching scarce equipment, availability, requesting sessions, priorities for 0/1 Knapsack.");
            // const [scarceEquipment] = await pool.query("SELECT id, name, totalQuantity FROM equipment WHERE isScarce=true");
            // const [requestingSessions] = await pool.query("SELECT b.id, b.purpose, GROUP_CONCAT(be.equipmentId, ':', be.quantity) as requestedEquipment, b.priority FROM bookings b JOIN booking_equipment be ON b.id = be.bookingId WHERE b.status = 'pending_resource_allocation' GROUP BY b.id");
            
            simulatedInputForCpp = {
                equipmentCapacities: [{type: "Microscope", available: 5}, {type: "Spectrometer", available: 2}],
                sessions: [
                    {id: 201, priority: 10, needs: {Microscope: 2, Spectrometer: 1}},
                    {id: 202, priority: 8, needs: {Microscope: 3}},
                    {id: 203, priority: 12, needs: {Spectrometer: 1, Microscope: 1}}
                ]
            };
            console.log("[Backend] Simulated input for C++ (Knapsack):", JSON.stringify(simulatedInputForCpp, null, 2));

            console.log(`[Backend] Simulating call to C++ executable for 0/1 Knapsack...`);
            simulatedOutputFromCpp = {
                status: "success",
                allocatedSessions: [
                    { sessionId: 203, allocatedResources: {Spectrometer: 1, Microscope: 1} },
                    { sessionId: 201, allocatedResources: {Microscope: 2} } // Assuming Spectrometer ran out for session 201
                ],
                unallocatedSessions: [202]
            };
            console.log("[Backend] Simulated output from C++ (Knapsack):", JSON.stringify(simulatedOutputFromCpp, null, 2));

            console.log(`[Backend] Simulating database update with results from 0/1 Knapsack...`);
            // For each item in allocatedSessions:
            // await pool.query("UPDATE bookings SET equipmentIds = ?, status = 'resources_allocated' WHERE id = ?");
            dbUpdateSummary = `${simulatedOutputFromCpp.allocatedSessions.length} sessions allocated resources. ${simulatedOutputFromCpp.unallocatedSessions.length} sessions could not be fully resourced.`;
            successMessage = `0/1 Knapsack resource allocation simulated: ${dbUpdateSummary}`;

        } else if (algorithmName === 'optimize-lab-usage') { // Greedy Algorithm
            console.log("[Backend] Simulating: Fetching current schedule, empty slots, pending high-priority requests for Greedy Algorithm.");
            // const [currentSchedule] = await pool.query("SELECT labId, date, timeSlotId FROM bookings WHERE status='booked'");
            // const [emptySlots] = await pool.query("SELECT ... derived from labs and currentSchedule ...");
            // const [pendingRequests] = await pool.query("SELECT id, userId, requestedLabType, duration, priority FROM bookings WHERE status='pending' ORDER BY priority DESC");

            simulatedInputForCpp = {
                emptySlots: [{labId: 1, date: "2024-07-02", timeSlotId: "ts_1400_1500"}, {labId: 3, date: "2024-07-02", timeSlotId: "ts_1000_1100"}],
                pendingRequests: [
                    {id: 301, priority: 100, needs: "Any Lab", duration: 1},
                    {id: 302, priority: 90, needs: "CS Lab", duration: 1}
                ]
            };
            console.log("[Backend] Simulated input for C++ (Greedy):", JSON.stringify(simulatedInputForCpp, null, 2));

            console.log(`[Backend] Simulating call to C++ executable for Greedy slot filling...`);
            simulatedOutputFromCpp = {
                status: "success",
                filledSlots: [
                    { requestId: 301, labId: 1, date: "2024-07-02", timeSlotId: "ts_1400_1500" }
                ],
                remainingPendingRequests: [302]
            };
            console.log("[Backend] Simulated output from C++ (Greedy):", JSON.stringify(simulatedOutputFromCpp, null, 2));

            console.log(`[Backend] Simulating database update with results from Greedy algorithm...`);
            // For each item in filledSlots:
            // await pool.query("INSERT INTO bookings (...) VALUES (...) ...");
            dbUpdateSummary = `${simulatedOutputFromCpp.filledSlots.length} empty slots filled.`;
            successMessage = `Greedy lab usage optimization simulated: ${dbUpdateSummary}`;

        } else if (algorithmName === 'assign-nearest-labs') { // Dijkstra's
            console.log("[Backend] Simulating: Fetching lab locations, user department location, available labs for Dijkstra's.");
            // const [labLocations] = await pool.query("SELECT id, name, location_coordinates FROM labs"); // Assuming coordinates or graph node ID
            // const [userDepartmentLocation] = await pool.query("SELECT location_coordinates FROM departments WHERE id = (SELECT departmentId FROM users WHERE id = ?)", [req.user.id]);
            // const [availableLabs] = await pool.query("SELECT l.id FROM labs l LEFT JOIN bookings b ON l.id = b.labId AND b.date = ? AND b.timeSlotId = ? WHERE b.id IS NULL", [targetDate, targetTimeSlot]);

            simulatedInputForCpp = {
                campusGraph: { nodes: ["A", "B", "C", "L1", "L2", "L3"], edges: [["A","B",5],["B","L1",3],["A","L2",10]]}, // node1, node2, weight
                userLocationNode: "A",
                availableLabNodes: ["L1", "L2", "L3"]
            };
            console.log("[Backend] Simulated input for C++ (Dijkstra):", JSON.stringify(simulatedInputForCpp, null, 2));

            console.log(`[Backend] Simulating call to C++ executable for Dijkstra's algorithm...`);
            simulatedOutputFromCpp = {
                status: "success",
                nearestLab: {labNode: "L1", distance: 8},
                alternatives: [{labNode: "L2", distance: 10}]
            };
            console.log("[Backend] Simulated output from C++ (Dijkstra):", JSON.stringify(simulatedOutputFromCpp, null, 2));
            // This output might not directly update the DB but rather inform a booking suggestion.
            dbUpdateSummary = `Nearest available lab is ${simulatedOutputFromCpp.nearestLab.labNode} (distance ${simulatedOutputFromCpp.nearestLab.distance}).`;
            successMessage = `Dijkstra's nearest lab assignment simulated: ${dbUpdateSummary}`;
        } else {
            return res.status(400).json({ msg: `Algorithm '${algorithmName}' is not recognized.` });
        }

        res.json({
            success: true,
            message: successMessage,
            simulatedInput: simulatedInputForCpp,
            simulatedOutput: simulatedOutputFromCpp,
            dbUpdateSummary: dbUpdateSummary
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
        return res.status(400).json({ msg: 'Please enter all required fields (fullName, email, password, role)' });
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
        const [createdUserResult] = await pool.query('SELECT id, fullName, email, role, department, createdAt FROM users WHERE id = ?', [result.insertId]);
        
        if (createdUserResult.length === 0) {
            return res.status(500).json({ msg: 'Failed to retrieve created user details.'})
        }
        res.status(201).json(createdUserResult[0]);
    } catch (err) {
        console.error('Admin create user error:', err.message, err.stack);
        res.status(500).send('Server error during user creation by admin');
    }
});

// @route   PUT api/admin/users/:userId
// @desc    Admin updates a user's details (excluding password)
// @access  Private (Admin only)
router.put('/users/:userId', [auth, isAdmin], async (req, res) => {
    const { fullName, email, role, department } = req.body;
    const { userId } = req.params;

    if (!fullName || !email || !role ) { 
        return res.status(400).json({ msg: 'FullName, email, and role are required for update.' });
    }
    if (isNaN(parseInt(userId))) {
        return res.status(400).json({ msg: 'Invalid User ID format.' });
    }


    try {
        const [existingUsers] = await pool.query('SELECT id, email, department FROM users WHERE id = ?', [userId]);
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
            department: department !== undefined ? department : existingUsers[0].department // Keep old department if not provided
        };

        await pool.query('UPDATE users SET ? WHERE id = ?', [updatedUserData, userId]);
        
        const [updatedUserResult] = await pool.query('SELECT id, fullName, email, role, department, createdAt FROM users WHERE id = ?', [userId]);
        if (updatedUserResult.length === 0) {
            return res.status(500).json({ msg: 'Failed to retrieve updated user details.'})
        }
        res.json(updatedUserResult[0]);

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
    if (isNaN(parseInt(userId))) {
        return res.status(400).json({ msg: 'Invalid User ID format.' });
    }

    try {
        const [user] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (user.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // DB schema has ON DELETE CASCADE for bookings related to userId.
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ msg: 'User deleted successfully by admin.' });

    } catch (err) {
        console.error('Admin delete user error:', err.message, err.stack);
        // A more specific error code for foreign key constraint violation
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || (err.sqlMessage && err.sqlMessage.toLowerCase().includes('foreign key constraint fails'))) {
            return res.status(400).json({ msg: 'Cannot delete user. They are referenced in other records (e.g., bookings, equipment assignments not covered by cascade). Consider deactivating or reassigning records first.' });
        }
        res.status(500).send('Server error while deleting user by admin.');
    }
});


// @route   GET api/admin/system-activity
// @desc    Get mock system activity logs
// @access  Private (Admin only)
router.get('/system-activity', [auth, isAdmin], (req, res) => {
    // In a real system, this would fetch from a database table (e.g., activity_logs) or log files
    const mockLogs = [
        { timestamp: new Date(Date.now() - 3600000).toISOString(), user: 'admin@example.com', action: 'Updated Lab "Physics Lab Alpha" details via API.' },
        { timestamp: new Date(Date.now() - 7200000).toISOString(), user: 'faculty@example.com', action: 'Booked Computer Lab for "CS101" via API.' },
        { timestamp: new Date(Date.now() - 10800000).toISOString(), user: 'assistant@example.com', action: 'Updated seat status for 5 seats in "Electronics Lab" via API.' },
        { timestamp: new Date().toISOString(), user: 'admin@example.com', action: 'Triggered "run-scheduling" algorithm simulation via API.' },
    ];
    res.json(mockLogs);
});


module.exports = router;
    
