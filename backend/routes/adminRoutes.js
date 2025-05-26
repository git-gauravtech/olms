
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, isAdmin } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');
const { spawn } = require('child_process'); // Import spawn for C++ integration

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
            LEFT JOIN ( 
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
        console.error('Error fetching faculty admin requests:', err.message, err.stack);
        res.status(500).json({ msg: 'Server Error: Could not fetch faculty admin requests' });
    }
});

// @route   POST api/admin/algorithms/:algorithmName
// @desc    Trigger a specific DAA algorithm
// @access  Private (Admin only)
router.post('/algorithms/:algorithmName', [auth, isAdmin], async (req, res) => {
    const { algorithmName } = req.params;
    // const { inputPayload } = req.body; // Optional input from frontend

    console.log(`[Backend] Admin triggered algorithm: ${algorithmName}`);
    // console.log(`[Backend] Optional input payload from frontend:`, inputPayload);

    let actualInputForCpp = {};
    let simulatedOutputFromCpp = {}; // Keep this for simulating structure if C++ call fails or is bypassed
    let dbUpdateSummary = "No database changes made by algorithm.";
    let successMessage = `Algorithm '${algorithmName}' processed.`;

    try {
        console.log(`[Backend] Preparing data for ${algorithmName}...`);

        if (algorithmName === 'run-scheduling') { // Graph Coloring
            successMessage = `Graph Coloring scheduling attempted.`;
            console.log("[Backend] Preparing input for Graph Coloring (Scheduling)...");
            // Simulate fetching data from DB for C++ algorithm
            console.log("[Backend] DB Query (Simulated): SELECT id, name, capacity FROM labs;");
            const labsData = [{id: 1, name: "CS Lab 1", capacity: 30}, {id: 2, name: "Physics Lab Alpha", capacity: 20}]; // Simulated
            
            console.log("[Backend] DB Query (Simulated): SELECT id, userId, requestedLabType, duration, batchIdentifier, priority FROM bookings WHERE status='pending' OR status='pending-admin-approval';");
            const pendingRequestsData = [ // Simulated
                {id: 101, userId: 5, requestedLabType: "CS", duration: 2, batchIdentifier: "CS-A", priority: 10, purpose: "CS101 Lab for CS-A"},
                {id: 102, userId: 6, requestedLabType: "Physics", duration: 2, batchIdentifier: "PHY-B", priority: 8, purpose: "PHY101 Lab for PHY-B"}
            ];
            
            console.log("[Backend] DB Query (Simulated): SELECT id, startTime, endTime, displayTime FROM time_slots;"); // Assuming a time_slots table or use constants
            const timeSlotsData = [ // Simulated from constants
                { id: 'ts_0900_1000', startTime: '09:00', endTime: '10:00', displayTime: '09:00 AM - 10:00 AM' },
                { id: 'ts_1000_1100', startTime: '10:00', endTime: '11:00', displayTime: '10:00 AM - 11:00 AM' },
                // ... more time slots
            ];

            actualInputForCpp = {
                labs: labsData,
                requests: pendingRequestsData,
                timeSlots: timeSlotsData,
                constraints: ["InstructorA cannot teach CS-A and PHY-B simultaneously"] // Example constraint
            };
            console.log("[Backend] Actual input for C++ (Graph Coloring):", JSON.stringify(actualInputForCpp, null, 2));

            // --- Actual C++ Process Invocation ---
            const cppExecutablePath = './cpp_algorithms/graph_coloring_scheduler'; // IMPORTANT: Replace with actual path to your compiled C++ exe
            console.log(`[Backend] Attempting to spawn C++ process: ${cppExecutablePath}`);

            const cppProcess = spawn(cppExecutablePath, []); // Add command line args if your C++ program expects them

            let cppOutput = '';
            let cppErrorOutput = '';

            cppProcess.stdin.write(JSON.stringify(actualInputForCpp));
            cppProcess.stdin.end();

            cppProcess.stdout.on('data', (data) => {
                cppOutput += data.toString();
            });

            cppProcess.stderr.on('data', (data) => {
                cppErrorOutput += data.toString();
                console.error(`[C++ Stderr for ${algorithmName}]: ${data.toString()}`);
            });

            // Using a Promise to handle the asynchronous nature of the child process
            await new Promise((resolve, reject) => {
                cppProcess.on('close', async (code) => {
                    console.log(`[Backend] C++ process for ${algorithmName} exited with code ${code}`);
                    if (cppErrorOutput) {
                        console.error(`[Backend] C++ process for ${algorithmName} emitted errors: ${cppErrorOutput}`);
                    }

                    if (code === 0 && cppOutput) {
                        try {
                            simulatedOutputFromCpp = JSON.parse(cppOutput); // Expecting JSON output from C++
                            console.log("[Backend] Parsed output from C++ (Graph Coloring):", JSON.stringify(simulatedOutputFromCpp, null, 2));

                            // Simulate database update with results from C++
                            console.log(`[Backend] Simulating database update with results from Graph Coloring...`);
                            if (simulatedOutputFromCpp.newlyScheduledBookings && simulatedOutputFromCpp.newlyScheduledBookings.length > 0) {
                                for (const booking of simulatedOutputFromCpp.newlyScheduledBookings) {
                                    console.log(`[Backend] DB Update (Simulated): INSERT INTO bookings (labId, userId, date, timeSlotId, purpose, status, ...) VALUES (${booking.labId}, ${booking.userId}, '${booking.date}', '${booking.timeSlotId}', '${booking.purpose}', 'booked', ...);`);
                                    console.log(`[Backend] DB Update (Simulated): UPDATE bookings SET status='scheduled' WHERE id=${booking.requestId};`);
                                }
                                dbUpdateSummary = `${simulatedOutputFromCpp.newlyScheduledBookings.length} sessions scheduled based on C++ output.`;
                            } else {
                                dbUpdateSummary = "C++ algorithm ran, but no new sessions were scheduled based on its output.";
                            }
                            if (simulatedOutputFromCpp.unscheduledRequests && simulatedOutputFromCpp.unscheduledRequests.length > 0) {
                                dbUpdateSummary += ` ${simulatedOutputFromCpp.unscheduledRequests.length} requests remain unscheduled.`;
                            }
                            successMessage = `Graph Coloring algorithm executed: ${dbUpdateSummary}`;
                            resolve();
                        } catch (parseError) {
                            console.error(`[Backend] Error parsing JSON output from C++ for ${algorithmName}:`, parseError);
                            console.error(`[Backend] Raw C++ output for ${algorithmName}:`, cppOutput);
                            dbUpdateSummary = "C++ process ran, but output was not valid JSON.";
                            successMessage = `Graph Coloring algorithm executed with errors parsing output.`;
                            // It's important to resolve or reject to not hang the promise
                            reject(new Error(`Error parsing C++ output: ${parseError.message}. Raw output: ${cppOutput.substring(0, 500)}...`));
                        }
                    } else if (code !== 0) {
                        dbUpdateSummary = `C++ process for ${algorithmName} failed with exit code ${code}.`;
                        successMessage = `Graph Coloring algorithm execution failed.`;
                        reject(new Error(`C++ process exited with code ${code}. Error: ${cppErrorOutput.substring(0,500)}...`));
                    } else {
                         dbUpdateSummary = `C++ process for ${algorithmName} ran but produced no output to parse.`;
                         successMessage = `Graph Coloring algorithm executed but yielded no parsable results.`;
                         resolve(); // Resolve if no output but also no error code, or handle as error
                    }
                });

                cppProcess.on('error', (err) => {
                    console.error(`[Backend] Failed to start C++ process for ${algorithmName}: `, err);
                    dbUpdateSummary = "Failed to start C++ process.";
                    successMessage = `Graph Coloring algorithm could not be started.`;
                    reject(err);
                });
            });
            // End of Promise for child process

        } else if (algorithmName === 'run-resource-allocation') { // 0/1 Knapsack
            // ... (Keep detailed simulation as before, for brevity of this example,
            //      or adapt the spawn pattern from 'run-scheduling' if you have this C++ exe ready)
            console.log("[Backend] Simulating: Fetching scarce equipment, availability, requesting sessions, priorities for 0/1 Knapsack.");
            actualInputForCpp = {
                equipmentCapacities: [{type: "Microscope", available: 5}, {type: "Spectrometer", available: 2}],
                sessions: [
                    {id: 201, priority: 10, needs: {Microscope: 2, Spectrometer: 1}},
                    {id: 202, priority: 8, needs: {Microscope: 3}},
                    {id: 203, priority: 12, needs: {Spectrometer: 1, Microscope: 1}}
                ]
            };
            console.log("[Backend] Simulated input for C++ (Knapsack):", JSON.stringify(actualInputForCpp, null, 2));
            console.log(`[Backend] Simulating call to C++ executable for 0/1 Knapsack...`);
            simulatedOutputFromCpp = {
                status: "success",
                allocatedSessions: [
                    { sessionId: 203, allocatedResources: {Spectrometer: 1, Microscope: 1} },
                    { sessionId: 201, allocatedResources: {Microscope: 2} }
                ],
                unallocatedSessions: [202]
            };
            console.log("[Backend] Simulated output from C++ (Knapsack):", JSON.stringify(simulatedOutputFromCpp, null, 2));
            dbUpdateSummary = `${simulatedOutputFromCpp.allocatedSessions.length} sessions allocated resources. ${simulatedOutputFromCpp.unallocatedSessions.length} sessions could not be fully resourced.`;
            successMessage = `0/1 Knapsack resource allocation simulated: ${dbUpdateSummary}`;

        } else if (algorithmName === 'optimize-lab-usage') { // Greedy Algorithm
            // ... (Keep detailed simulation as before)
            console.log("[Backend] Simulating: Fetching current schedule, empty slots, pending high-priority requests for Greedy Algorithm.");
            actualInputForCpp = {
                emptySlots: [{labId: 1, date: "2024-07-02", timeSlotId: "ts_1400_1500"}, {labId: 3, date: "2024-07-02", timeSlotId: "ts_1000_1100"}],
                pendingRequests: [
                    {id: 301, priority: 100, needs: "Any Lab", duration: 1},
                    {id: 302, priority: 90, needs: "CS Lab", duration: 1}
                ]
            };
             console.log("[Backend] Simulated input for C++ (Greedy):", JSON.stringify(actualInputForCpp, null, 2));
            console.log(`[Backend] Simulating call to C++ executable for Greedy slot filling...`);
            simulatedOutputFromCpp = {
                status: "success",
                filledSlots: [
                    { requestId: 301, labId: 1, date: "2024-07-02", timeSlotId: "ts_1400_1500" }
                ],
                remainingPendingRequests: [302]
            };
            console.log("[Backend] Simulated output from C++ (Greedy):", JSON.stringify(simulatedOutputFromCpp, null, 2));
            dbUpdateSummary = `${simulatedOutputFromCpp.filledSlots.length} empty slots filled.`;
            successMessage = `Greedy lab usage optimization simulated: ${dbUpdateSummary}`;

        } else if (algorithmName === 'assign-nearest-labs') { // Dijkstra's
            // ... (Keep detailed simulation as before)
            console.log("[Backend] Simulating: Fetching lab locations, user department location, available labs for Dijkstra's.");
            actualInputForCpp = {
                campusGraph: { nodes: ["A", "B", "C", "L1", "L2", "L3"], edges: [["A","B",5],["B","L1",3],["A","L2",10]]},
                userLocationNode: "A",
                availableLabNodes: ["L1", "L2", "L3"]
            };
            console.log("[Backend] Simulated input for C++ (Dijkstra):", JSON.stringify(actualInputForCpp, null, 2));
            console.log(`[Backend] Simulating call to C++ executable for Dijkstra's algorithm...`);
            simulatedOutputFromCpp = {
                status: "success",
                nearestLab: {labNode: "L1", distance: 8},
                alternatives: [{labNode: "L2", distance: 10}]
            };
            console.log("[Backend] Simulated output from C++ (Dijkstra):", JSON.stringify(simulatedOutputFromCpp, null, 2));
            dbUpdateSummary = `Nearest available lab is ${simulatedOutputFromCpp.nearestLab.labNode} (distance ${simulatedOutputFromCpp.nearestLab.distance}).`;
            successMessage = `Dijkstra's nearest lab assignment simulated: ${dbUpdateSummary}`;
        } else {
            return res.status(400).json({ msg: `Algorithm '${algorithmName}' is not recognized.` });
        }

        res.json({
            success: true,
            message: successMessage,
            simulatedInputForCpp: actualInputForCpp, // Changed from simulatedInput
            simulatedOutputFromCpp: simulatedOutputFromCpp, // Changed from simulatedOutput
            dbUpdateSummary: dbUpdateSummary
        });

    } catch (error) {
        console.error(`[Backend] Error triggering algorithm ${algorithmName}:`, error.message, error.stack);
        res.status(500).json({ success: false, message: `Server error while triggering ${algorithmName}. Details: ${error.message}` });
    }
});


// @route   GET api/admin/system-activity
// @desc    Get mock system activity logs
// @access  Private (Admin only)
router.get('/system-activity', [auth, isAdmin], async (req, res) => {
    // In a real system, this would fetch from a database table (e.g., activity_logs) or log files
    // For now, returning a mock array. Consider creating an activity_logs table.
    try {
        // Example: Fetching from a hypothetical 'activity_logs' table
        // const [logs] = await pool.query("SELECT action, userEmail, details, loggedAt FROM activity_logs ORDER BY loggedAt DESC LIMIT 50");
        // res.json(logs);

        // Using mock data for now
        const mockLogs = [
            { timestamp: new Date(Date.now() - 3600000).toISOString(), user: 'admin@example.com', action: 'Updated Lab "Physics Lab Alpha" details via API.' },
            { timestamp: new Date(Date.now() - 7200000).toISOString(), user: 'faculty@example.com', action: 'Booked Computer Lab for "CS101" via API.' },
            { timestamp: new Date(Date.now() - 10800000).toISOString(), user: 'assistant@example.com', action: 'Updated seat status for 5 seats in "Electronics Lab" via API.' },
            { timestamp: new Date().toISOString(), user: 'admin@example.com', action: 'Triggered "run-scheduling" algorithm simulation via API.' },
        ];
        res.json(mockLogs);
    } catch (err) {
        console.error('Error fetching system activity:', err.message, err.stack);
        res.status(500).json({ msg: 'Server Error: Could not fetch system activity' });
    }
});


// --- User Management by Admin ---
// @route   GET api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/users', [auth, isAdmin], async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, fullName, email, role, department, createdAt FROM users ORDER BY fullName ASC');
        res.json(users);
    } catch (err) {
        console.error('Error fetching users in /api/admin/users:', err.message, err.stack);
        res.status(500).json({ msg: 'Server Error: Could not fetch users' });
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
        res.status(500).json({ msg: 'Server error during user creation by admin' });
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
        res.status(500).json({ msg: 'Server error while updating user by admin.' });
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
        // Add similar logic or DB constraints for other tables referencing users if necessary.
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ msg: 'User deleted successfully by admin.' });

    } catch (err) {
        console.error('Admin delete user error:', err.message, err.stack);
        // A more specific error code for foreign key constraint violation
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || (err.sqlMessage && err.sqlMessage.toLowerCase().includes('foreign key constraint fails'))) {
            return res.status(400).json({ msg: 'Cannot delete user. They are referenced in other records (e.g., bookings, equipment assignments not covered by cascade). Consider deactivating or reassigning records first.' });
        }
        res.status(500).json({ msg: 'Server error while deleting user by admin.' });
    }
});


module.exports = router;
    
