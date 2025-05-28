
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, isAdmin } = require('../middleware/authMiddleware'); // isAdmin is already imported
const bcrypt = require('bcryptjs');
const { spawn } = require('child_process'); 

// @route   GET api/admin/requests/faculty
// @desc    Get faculty requests needing admin approval
// @access  Private (Admin only)
router.get('/requests/faculty', [auth, isAdmin], async (req, res) => {
    try {
        // This query looks for bookings made by 'Faculty' with status 'pending-admin-approval'
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
        console.error('Error fetching faculty admin requests:', err.message, err.stack);
        res.status(500).json({ msg: 'Server Error: Could not fetch faculty admin requests' });
    }
});

// @route   POST api/admin/algorithms/:algorithmName
// @desc    Trigger a specific DAA algorithm (Simulated with one full child_process example)
// @access  Private (Admin only)
router.post('/algorithms/:algorithmName', [auth, isAdmin], async (req, res) => {
    const { algorithmName } = req.params;
    // const { inputPayload } = req.body; // Optional input from frontend for specific algorithms

    console.log(`[Backend] Admin triggered algorithm: ${algorithmName}`);
    
    let actualInputForCpp = {};
    let simulatedOutputFromCpp = {}; // To store what C++ might output
    let dbUpdateSummary = "No database changes made by algorithm.";
    let successMessage = `Algorithm '${algorithmName}' process initiated.`;

    try {
        if (algorithmName === 'run-scheduling') { // Graph Coloring
            successMessage = `Graph Coloring scheduling process initiated.`;
            console.log("[Backend] Preparing input for Graph Coloring (Scheduling)...");
            
            // Simulate fetching data from DB for C++ algorithm
            const [labsDataFromDB] = await pool.query("SELECT id, name, capacity, location FROM labs");
            const [pendingRequestsFromDB] = await pool.query(
                "SELECT b.id, b.userId, u.fullName as userName, b.labId as requestedLabId, l.name as requestedLabName, b.purpose, b.batchIdentifier, b.timeSlotId as preferredTimeSlotId, b.date as preferredDate FROM bookings b JOIN users u ON b.userId = u.id LEFT JOIN labs l ON b.labId = l.id WHERE b.status IN (?, ?)", 
                ['pending', 'pending-admin-approval'] // Consider which requests to feed
            );
            // Assuming MOCK_TIME_SLOTS are still valid for this simulation
            const timeSlotsData = window.MOCK_TIME_SLOTS || [ 
                { id: 'ts_0900_1000', startTime: '09:00', endTime: '10:00', displayTime: '09:00 AM - 10:00 AM' },
                 // ... more time slots
            ];

            actualInputForCpp = {
                labs: labsDataFromDB,
                requests: pendingRequestsFromDB,
                timeSlots: timeSlotsData, // This should come from DB or config if dynamic
                constraints: ["InstructorA cannot teach CS-A and PHY-B simultaneously"] // Example constraint
            };
            console.log("[Backend] Actual input for C++ (Graph Coloring):", JSON.stringify(actualInputForCpp, null, 2).substring(0, 1000) + "...");


            const cppExecutablePath = './cpp_algorithms/graph_coloring_scheduler'; // IMPORTANT: Replace with actual path
            console.log(`[Backend] Attempting to spawn C++ process: ${cppExecutablePath}`);

            const cppProcess = spawn(cppExecutablePath, []); 

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
                            simulatedOutputFromCpp = JSON.parse(cppOutput); // Expecting JSON output
                            console.log("[Backend] Parsed output from C++ (Graph Coloring):", JSON.stringify(simulatedOutputFromCpp, null, 2));

                            // Simulate database update with results from C++
                            console.log(`[Backend] Simulating database update with results from Graph Coloring...`);
                            if (simulatedOutputFromCpp.newlyScheduledBookings && simulatedOutputFromCpp.newlyScheduledBookings.length > 0) {
                                // Example of DB update:
                                // for (const booking of simulatedOutputFromCpp.newlyScheduledBookings) {
                                //   await pool.query('INSERT INTO bookings (labId, userId, date, timeSlotId, purpose, status, ...) VALUES (?, ?, ?, ?, ?, "booked", ...)', 
                                //     [booking.labId, booking.userId, booking.date, booking.timeSlotId, booking.purpose]);
                                //   await pool.query('UPDATE bookings SET status="scheduled_by_algo" WHERE id=?', [booking.originalRequestId]);
                                // }
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
                            reject(new Error(`Error parsing C++ output: ${parseError.message}. Raw output: ${cppOutput.substring(0, 500)}...`));
                        }
                    } else if (code !== 0) {
                        dbUpdateSummary = `C++ process for ${algorithmName} failed with exit code ${code}. Error: ${cppErrorOutput}`;
                        successMessage = `Graph Coloring algorithm execution failed.`;
                        reject(new Error(`C++ process exited with code ${code}. Error: ${cppErrorOutput.substring(0,500)}...`));
                    } else {
                         dbUpdateSummary = `C++ process for ${algorithmName} ran but produced no output to parse.`;
                         successMessage = `Graph Coloring algorithm executed but yielded no parsable results.`;
                         resolve(); 
                    }
                });

                cppProcess.on('error', (err) => {
                    console.error(`[Backend] Failed to start C++ process for ${algorithmName}: `, err);
                    dbUpdateSummary = "Failed to start C++ process.";
                    successMessage = `Graph Coloring algorithm could not be started. Check executable path and permissions.`;
                    reject(err); 
                });
            });
            // End of Promise for child process

        } else if (algorithmName === 'run-resource-allocation') { // 0/1 Knapsack - Simulation
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
        } else if (algorithmName === 'optimize-lab-usage') { // Greedy Algorithm - Simulation
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
        } else if (algorithmName === 'assign-nearest-labs') { // Dijkstra's - Simulation
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
            simulatedInputForCpp: actualInputForCpp, 
            simulatedOutputFromCpp: simulatedOutputFromCpp, 
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
            { timestamp: new Date(Date.now() - 3600000).toISOString(), user: 'admin@example.com', action: 'Updated Lab "Physics Lab Alpha" details via API.', details: 'Capacity changed to 25' },
            { timestamp: new Date(Date.now() - 7200000).toISOString(), user: 'faculty@example.com', action: 'Booked Computer Lab for "CS101" via API.' },
            { timestamp: new Date(Date.now() - 10800000).toISOString(), user: 'assistant@example.com', action: 'Updated seat status for 5 seats in "Electronics Lab" via API.' },
            { timestamp: new Date().toISOString(), user: 'admin@example.com', action: 'Triggered "run-scheduling" algorithm simulation via API.' },
            { timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), user: 'admin@example.com', action: 'User "newfaculty@example.com" created via API.' },
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
     // Add validation for role
    const validRoles = ['Admin', 'Faculty', 'Student', 'Assistant'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ msg: 'Invalid role specified.' });
    }


    try {
        let [users] = await pool.query('SELECT email FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(400).json({ msg: 'User already exists with this email' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // For admin creation, secretWordHash can be omitted or set to a default/null
        // If your schema requires it NOT NULL, you might need to pass a placeholder or adjust schema
        const newUser = {
            fullName,
            email,
            passwordHash: hashedPassword,
            role,
            department: department || null,
            // secretWordHash: 'ADMIN_CREATED_USER_NO_SECRET' // Or similar if required, ensure schema allows NULL or has default
        };
        const [result] = await pool.query('INSERT INTO users SET ?', newUser);
        const [createdUserResult] = await pool.query('SELECT id, fullName, email, role, department, createdAt FROM users WHERE id = ?', [result.insertId]);
        
        if (createdUserResult.length === 0) {
            return res.status(500).json({ msg: 'Failed to retrieve created user details.'})
        }
        res.status(201).json(createdUserResult[0]);
    } catch (err) {
        console.error('Admin create user error:', err.message, err.stack);
        if (err.code === 'ER_NO_DEFAULT_FOR_FIELD' && err.sqlMessage.includes('secretWordHash')) {
            return res.status(500).json({ msg: 'Database schema error: secretWordHash may be missing a default value or not allowing NULLs when admin creates user. Please check schema.'})
        }
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
    // Add validation for role
    const validRoles = ['Admin', 'Faculty', 'Student', 'Assistant'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ msg: 'Invalid role specified.' });
    }

    try {
        const [existingUsers] = await pool.query('SELECT id, email, department FROM users WHERE id = ?', [userId]);
        if (existingUsers.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

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
            department: department !== undefined ? (department || null) : existingUsers[0].department 
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
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ msg: 'User deleted successfully by admin.' });

    } catch (err) {
        console.error('Admin delete user error:', err.message, err.stack);
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || (err.sqlMessage && err.sqlMessage.toLowerCase().includes('foreign key constraint fails'))) {
            return res.status(400).json({ msg: 'Cannot delete user. They are referenced in other records. Consider deactivating or reassigning records first.' });
        }
        res.status(500).json({ msg: 'Server error while deleting user by admin.' });
    }
});


module.exports = router;
