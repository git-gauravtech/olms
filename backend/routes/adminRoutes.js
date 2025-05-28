
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, isAdmin } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');
const { spawn } = require('child_process'); // For actual C++ integration

// @route   GET api/admin/requests/faculty
// @desc    Get faculty requests needing admin approval
// @access  Private (Admin only)
router.get('/requests/faculty', [auth, isAdmin], async (req, res) => {
    try {
        // Fetches bookings made by Faculty that are in 'pending-admin-approval' status
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
// @desc    Trigger a specific DAA algorithm (Simulated, with one full child_process example)
// @access  Private (Admin only)
router.post('/algorithms/:algorithmName', [auth, isAdmin], async (req, res) => {
    const { algorithmName } = req.params;
    // const { inputPayload } = req.body; // Optional input from frontend

    console.log(`[Backend] Admin triggered algorithm: ${algorithmName}`);
    
    let actualInputForCpp = {};
    let simulatedOutputFromCpp = {};
    let dbUpdateSummary = "No database changes made by algorithm (simulation).";
    let successMessage = `Algorithm '${algorithmName}' process initiated (simulation).`;

    try {
        if (algorithmName === 'run-scheduling') { // Graph Coloring
            successMessage = `Graph Coloring scheduling process initiated (simulation).`;
            console.log("[Backend] Simulating: Preparing input for Graph Coloring (Scheduling)...");
            
            // In a real scenario, you'd fetch detailed data for:
            // - Labs: ID, name, capacity, type (e.g., 'Computer', 'Physics'), available equipment.
            // - Booking Requests/Course Lab Requirements: 
            //   - Unique ID for each request/session.
            //   - Course Section ID (e.g., "CS101_SecA", "CS101_SecB") - CRITICAL for distinct scheduling.
            //   - Student Batch ID associated with the section.
            //   - Assigned Faculty ID for that section's labs - CRITICAL for faculty consistency.
            //   - Required lab type.
            //   - Required duration (e.g., number of time slots).
            //   - Specific equipment needs (beyond general lab type).
            //   - Any pre-assigned specific lab preference.
            // - Faculty Availability: List of time slots when each faculty member is available.
            // - Student Batch Schedules: Existing commitments for student batches (e.g., lectures).
            // - Predefined Time Slots: All available time slots in the week/semester.
            // - Existing Fixed Bookings: Any bookings that are already confirmed and immutable.
            
            console.log("[Backend] CORE SCHEDULING CONSTRAINTS for C++ Graph Coloring:");
            console.log("  1. Faculty Consistency: The SAME faculty member must be assigned to all lab sessions of a specific course section (e.g., Faculty 'F10' for all 'CS101_SecA' labs).");
            console.log("  2. Distinct Section Schedules: Different sections of the same course (e.g., 'CS101_SecA' vs 'CS101_SecB') are separate groups and MUST have their own distinct lab schedules.");
            console.log("     They can only share a time slot if they use different labs AND different faculty.");
            console.log("  3. Student Batch Non-Concurrency: A student batch cannot be in two different labs/sessions simultaneously.");
            console.log("  4. Faculty Non-Concurrency: A faculty member cannot teach two different sessions simultaneously.");
            console.log("  5. Lab Non-Concurrency: A physical lab cannot host two different sessions simultaneously.");
            console.log("  6. Lab Capacity: Number of students in a section must not exceed lab capacity.");


            actualInputForCpp = {
                labs: [
                    {id: 1, name: "CS Lab 101", capacity: 30, type: "Computer"}, 
                    {id: 2, name: "CS Lab 102", capacity: 25, type: "Computer"},
                    {id: 3, name: "Physics Lab Alpha", capacity: 25, type: "Physics"}
                ],
                requests: [ // Each object here represents a distinct lab session to be scheduled for a section
                    {reqId: 101, courseSection: "CS101_SecA", studentBatch: "A1", facultyId: "F10", durationSlots: 1, preferredLabType: "Computer", note: "Needs 20 PCs"},
                    {reqId: 102, courseSection: "CS101_SecB", studentBatch: "A2", facultyId: "F11", durationSlots: 1, preferredLabType: "Computer", note: "Needs 22 PCs"},
                    {reqId: 103, courseSection: "PHY202_SecA", studentBatch: "P1", facultyId: "F12", durationSlots: 1, preferredLabType: "Physics"},
                    {reqId: 104, courseSection: "CS101_SecA", studentBatch: "A1", facultyId: "F10", durationSlots: 1, preferredLabType: "Computer", note: "This is the 2nd lab for CS101_SecA, should have same faculty F10"}
                ],
                facultyAvailability: { // Simplified: facultyId -> array of available timeSlotIds
                    "F10": ["Mon_09_11", "Mon_11_13", "Tue_09_11"],
                    "F11": ["Mon_09_11", "Tue_11_13", "Wed_09_11"],
                    "F12": ["Tue_09_11", "Wed_11_13", "Thu_09_11"]
                },
                timeSlots: [ // Representing available "colors"
                    {id: "Mon_09_11", display: "Monday 09:00-11:00"},
                    {id: "Mon_11_13", display: "Monday 11:00-13:00"},
                    {id: "Tue_09_11", display: "Tuesday 09:00-11:00"},
                    {id: "Tue_11_13", display: "Tuesday 11:00-13:00"},
                    {id: "Wed_09_11", display: "Wednesday 09:00-11:00"},
                    {id: "Wed_11_13", display: "Wednesday 11:00-13:00"},
                    {id: "Thu_09_11", display: "Thursday 09:00-11:00"}
                ],
                constraints: [
                    "Faculty F10 is assigned to CS101_SecA. All labs for CS101_SecA must be scheduled with F10 when F10 is available.",
                    "Faculty F11 is assigned to CS101_SecB.",
                    "Student Batch A1 (CS101_SecA) cannot conflict with itself."
                ]
            };
            console.log("[Backend] Simulated input for C++ (Graph Coloring):", JSON.stringify(actualInputForCpp, null, 2).substring(0, 1000) + "...");


            const cppExecutablePath = './cpp_algorithms/graph_coloring_scheduler'; // IMPORTANT: Replace with actual path
            console.log(`[Backend] Simulating attempt to spawn C++ process: ${cppExecutablePath}`);
            
            // --- Actual C++ Process Spawn (Example, currently commented out for pure simulation) ---
            // This section demonstrates how Node.js would interact with a C++ executable.
            // You need to uncomment and adapt this when you have your C++ program ready.
            /*
            const cppProcess = spawn(cppExecutablePath, []); 

            let cppOutput = '';
            let cppErrorOutput = '';

            // Send data to C++ process's stdin
            cppProcess.stdin.write(JSON.stringify(actualInputForCpp));
            cppProcess.stdin.end();

            // Listen for data from C++ process's stdout
            cppProcess.stdout.on('data', (data) => { cppOutput += data.toString(); });
            // Listen for errors from C++ process's stderr
            cppProcess.stderr.on('data', (data) => { cppErrorOutput += data.toString(); console.error(`[C++ Stderr for ${algorithmName}]: ${data.toString()}`); });
            
            // Wait for the C++ process to close
            await new Promise((resolve, reject) => {
                cppProcess.on('close', async (code) => {
                    console.log(`[Backend] C++ process for ${algorithmName} exited with code ${code}`);
                    if (cppErrorOutput) { console.error(`[Backend] C++ process for ${algorithmName} emitted errors: ${cppErrorOutput}`); }

                    if (code === 0 && cppOutput) {
                        try {
                            simulatedOutputFromCpp = JSON.parse(cppOutput); // Expecting JSON output
                            console.log("[Backend] Parsed output from C++ (Graph Coloring):", JSON.stringify(simulatedOutputFromCpp, null, 2));
                            
                            // Simulate database update with results from C++
                            // Example:
                            // if (simulatedOutputFromCpp.newlyScheduledBookings && simulatedOutputFromCpp.newlyScheduledBookings.length > 0) {
                            //     for (const booking of simulatedOutputFromCpp.newlyScheduledBookings) {
                            //         await pool.query(
                            //             'INSERT INTO bookings (labId, userId, date, timeSlotId, purpose, status, requestedByRole, batchIdentifier, submittedDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
                            //             [booking.labId, booking.facultyId, booking.date, booking.timeSlotId, `Scheduled: ${booking.courseSection}`, 'booked', 'AdminScheduled', booking.studentBatch]
                            //         );
                            //     }
                            //     dbUpdateSummary = `Simulated: ${simulatedOutputFromCpp.newlyScheduledBookings.length} sessions scheduled based on C++ output.`;
                            // } else {
                            //     dbUpdateSummary = "Simulated: C++ algorithm ran but no new sessions were scheduled based on output.";
                            // }
                            // For unscheduled requests, update their status or log them.
                            
                            successMessage = `Graph Coloring algorithm executed: ${dbUpdateSummary}`;
                            resolve();
                        } catch (parseError) {
                            console.error(`[Backend] Error parsing JSON output from C++ for ${algorithmName}:`, parseError, "Raw output:", cppOutput);
                            dbUpdateSummary = "C++ process ran, but output was not valid JSON (simulation).";
                            successMessage = `Graph Coloring algorithm executed with errors parsing output (simulation).`;
                            reject(new Error(`Error parsing C++ output: ${parseError.message}. Raw output: ${cppOutput.substring(0, 500)}...`));
                        }
                    } else if (code !== 0) {
                        dbUpdateSummary = `C++ process for ${algorithmName} failed with exit code ${code}. Error: ${cppErrorOutput} (simulation).`;
                        successMessage = `Graph Coloring algorithm execution failed (simulation).`;
                        reject(new Error(`C++ process exited with code ${code}. Error: ${cppErrorOutput.substring(0,500)}...`));
                    } else {
                         dbUpdateSummary = `C++ process for ${algorithmName} ran but produced no output (simulation).`;
                         successMessage = `Graph Coloring algorithm executed but yielded no results (simulation).`;
                         resolve(); 
                    }
                });
                cppProcess.on('error', (err) => {
                    console.error(`[Backend] Failed to start C++ process for ${algorithmName}: `, err);
                    dbUpdateSummary = "Failed to start C++ process (simulation). Check path/permissions.";
                    successMessage = `Graph Coloring algorithm could not be started (simulation).`;
                    reject(err); 
                });
            });
            */
            // --- End of Actual C++ Process Spawn ---

            // --- Pure Simulation (if spawn is commented out or fails) ---
            // This part runs if the actual C++ spawn is commented out.
            // It demonstrates the expected output structure for the frontend.
             simulatedOutputFromCpp = {
                status: "success",
                summary: "Successfully scheduled 4 lab sessions.",
                newlyScheduledBookings: [ // Each object represents a confirmed booking to be created/updated in DB
                    // CS101_SecA (reqId: 101) with F10
                    { reqId: 101, courseSection: "CS101_SecA", studentBatch: "A1", facultyId: "F10", labId: 1, date: "2024-09-02", timeSlotId: "Mon_09_11"}, 
                    // CS101_SecA (reqId: 104) also with F10 (consistency) but different time/lab
                    { reqId: 104, courseSection: "CS101_SecA", studentBatch: "A1", facultyId: "F10", labId: 1, date: "2024-09-03", timeSlotId: "Tue_09_11"}, 
                    // CS101_SecB (reqId: 102) with F11 (different section, different faculty)
                    { reqId: 102, courseSection: "CS101_SecB", studentBatch: "A2", facultyId: "F11", labId: 2, date: "2024-09-02", timeSlotId: "Mon_09_11"},
                    // PHY202_SecA (reqId: 103) with F12
                    { reqId: 103, courseSection: "PHY202_SecA", studentBatch: "P1", facultyId: "F12", labId: 3, date: "2024-09-04", timeSlotId: "Wed_11_13"}
                ],
                unscheduledRequests: [], // List of reqIds that couldn't be scheduled
                conflictsResolved: 0 // Example metric
            };
            console.log("[Backend] Simulated output from C++ (Graph Coloring):", JSON.stringify(simulatedOutputFromCpp, null, 2));
            dbUpdateSummary = `Simulated: ${simulatedOutputFromCpp.newlyScheduledBookings?.length || 0} sessions scheduled based on C++ output logic. ${simulatedOutputFromCpp.unscheduledRequests?.length || 0} requests remain unscheduled.`;
            successMessage = `Graph Coloring algorithm executed (simulated): ${dbUpdateSummary}`;
            // --- End of Pure Simulation ---


        } else if (algorithmName === 'run-resource-allocation') { // 0/1 Knapsack - Simulation
            console.log("[Backend] Simulating: Fetching scarce equipment, availability, requesting sessions, priorities for 0/1 Knapsack.");
             actualInputForCpp = {
                scarceResources: [ // Total available units of each scarce resource
                    {resourceId: "SCOPE_ADV", type: "Advanced Oscilloscope", availableUnits: 3},
                    {resourceId: "SPEC_XYZ", type: "Spectrometer XYZ", availableUnits: 1}
                ],
                sessionRequests: [ // Sessions that need these scarce resources
                    {sessionId: 201, courseSection: "EE301_LabA", priorityValue: 10, needs: [{resourceId: "SCOPE_ADV", units: 2}]},
                    {sessionId: 202, courseSection: "PHY400_Research", priorityValue: 12, needs: [{resourceId: "SPEC_XYZ", units: 1}, {resourceId: "SCOPE_ADV", units: 1}]},
                    {sessionId: 203, courseSection: "EE301_LabB", priorityValue: 8, needs: [{resourceId: "SCOPE_ADV", units: 2}]}
                ]
            };
            console.log("[Backend] Simulated input for C++ (Knapsack):", JSON.stringify(actualInputForCpp, null, 2));
            console.log(`[Backend] Simulating call to C++ executable for 0/1 Knapsack...`);
            simulatedOutputFromCpp = {
                status: "success",
                summary: "Optimally allocated scarce resources to 2 sessions.",
                allocatedSessions: [ // Sessions that got their requested scarce resources
                    { sessionId: 202, allocatedResources: [{resourceId: "SPEC_XYZ", units: 1}, {resourceId: "SCOPE_ADV", units: 1}]},
                    { sessionId: 201, allocatedResources: [{resourceId: "SCOPE_ADV", units: 2}]}
                ],
                unallocatedSessions: [ // sessionIds that could not be fully resourced
                    {sessionId: 203, reason: "Insufficient SCOPE_ADV units after higher priority allocations."}
                ]
            };
            console.log("[Backend] Simulated output from C++ (Knapsack):", JSON.stringify(simulatedOutputFromCpp, null, 2));
            dbUpdateSummary = `Simulated: ${simulatedOutputFromCpp.allocatedSessions?.length || 0} sessions allocated scarce resources. ${simulatedOutputFromCpp.unallocatedSessions?.length || 0} sessions could not be fully resourced.`;
            successMessage = `0/1 Knapsack resource allocation simulated: ${dbUpdateSummary}`;
        } else if (algorithmName === 'optimize-lab-usage') { // Greedy Algorithm - Simulation
            console.log("[Backend] Simulating: Fetching current schedule, empty slots, pending high-priority requests for Greedy Algorithm to fill gaps.");
             actualInputForCpp = {
                // Current empty slots in the schedule (labId, date, timeSlotId)
                emptyTimeSlots: [
                    {labId: 1, date: "2024-09-05", timeSlotId: "Thu_09_11"}, 
                    {labId: 3, date: "2024-09-05", timeSlotId: "Thu_09_11"}
                ],
                // Pending requests sorted by a greedy heuristic (e.g., urgency, smallest duration first)
                pendingRequests: [
                    {reqId: 301, courseSection: "BIO101_Makeup", priority: 100, durationSlots: 1, requiredLabType: "Any", requiredCapacity: 15},
                    {reqId: 302, courseSection: "CS_Club_Practice", priority: 90, durationSlots: 1, requiredLabType: "Computer", requiredCapacity: 20}
                ],
                labs: [ // To check if pending request fits lab type/capacity
                     {id: 1, name: "CS Lab 101", capacity: 30, type: "Computer"},
                     {id: 3, name: "Physics Lab Alpha", capacity: 25, type: "Physics"} // Assume Bio can use this general lab
                ]
            };
             console.log("[Backend] Simulated input for C++ (Greedy Slot Filling):", JSON.stringify(actualInputForCpp, null, 2));
            console.log(`[Backend] Simulating call to C++ executable for Greedy slot filling...`);
            simulatedOutputFromCpp = {
                status: "success",
                summary: "Filled 1 empty slot using Greedy approach.",
                filledSlots: [ // Slots that were successfully filled
                    { requestId: 301, labId: 3, date: "2024-09-05", timeSlotId: "Thu_09_11", filledByCourse: "BIO101_Makeup" }
                ],
                remainingPendingRequests: [302] // reqIds that couldn't be placed
            };
            console.log("[Backend] Simulated output from C++ (Greedy Slot Filling):", JSON.stringify(simulatedOutputFromCpp, null, 2));
            dbUpdateSummary = `Simulated: ${simulatedOutputFromCpp.filledSlots?.length || 0} empty slots filled.`;
            successMessage = `Greedy lab usage optimization simulated: ${dbUpdateSummary}`;
        } else if (algorithmName === 'assign-nearest-labs') { // Dijkstra's - Simulation
            console.log("[Backend] Simulating: Fetching campus graph (nodes=locations, edges=paths with distances), user department location, available labs for Dijkstra's.");
            actualInputForCpp = {
                campusGraph: { 
                    nodes: [ // id, name, type (e.g., 'Department', 'Lab', 'Junction')
                        {id: "CS_Dept", name: "CS Department", type: "Department"},
                        {id: "L101", name: "CS Lab 101", type: "Lab", lab_db_id: 1},
                        {id: "L102", name: "CS Lab 102", type: "Lab", lab_db_id: 2},
                        {id: "J1", name: "Junction 1", type: "Junction"}
                    ], 
                    edges: [ // from_node_id, to_node_id, distance_meters
                        ["CS_Dept", "J1", 50],
                        ["J1", "L101", 30],
                        ["J1", "L102", 70]
                    ]
                },
                sourceLocationId: "CS_Dept", // e.g., location of the faculty member or student batch
                targetLabDbIds: [1, 2] // DB IDs of currently available labs that match general criteria (e.g., type 'Computer')
            };
            console.log("[Backend] Simulated input for C++ (Dijkstra):", JSON.stringify(actualInputForCpp, null, 2));
            console.log(`[Backend] Simulating call to C++ executable for Dijkstra's algorithm...`);
            simulatedOutputFromCpp = {
                status: "success",
                summary: "Found nearest lab.",
                assignments: [ // Lab DB ID and its distance from source
                    {labDbId: 1, name: "CS Lab 101", distance: 80, path: ["CS_Dept", "J1", "L101"]},
                    {labDbId: 2, name: "CS Lab 102", distance: 120, path: ["CS_Dept", "J1", "L102"]}
                ],
                // Could recommend L101 as the nearest
                recommendation: {labDbId: 1, name: "CS Lab 101"}
            };
            console.log("[Backend] Simulated output from C++ (Dijkstra):", JSON.stringify(simulatedOutputFromCpp, null, 2));
            dbUpdateSummary = `Simulated: Nearest suitable lab to CS_Dept is CS Lab 101 (distance ${simulatedOutputFromCpp.recommendation?.name ? simulatedOutputFromCpp.assignments.find(a=>a.labDbId === simulatedOutputFromCpp.recommendation.labDbId).distance : 'N/A'}).`;
            successMessage = `Dijkstra's nearest lab assignment simulated: ${dbUpdateSummary}`;
        } else {
            return res.status(400).json({ msg: `Algorithm '${algorithmName}' is not recognized.` });
        }

        res.json({
            success: true,
            message: successMessage,
            algorithm: algorithmName,
            simulatedInputSentToCpp: actualInputForCpp, 
            simulatedOutputReceivedFromCpp: simulatedOutputFromCpp, 
            simulatedDatabaseUpdateSummary: dbUpdateSummary
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
    try {
        // In a real system, these logs would come from a database table or logging service.
        const mockLogs = [
            { timestamp: new Date(Date.now() - 120000).toISOString(), user: 'admin@example.com', action: 'Triggered "run-scheduling" algorithm simulation.', details: 'Simulated: 4 sessions scheduled.' },
            { timestamp: new Date(Date.now() - 3600000).toISOString(), user: 'admin@example.com', action: 'Updated Lab "Physics Lab Alpha" details.', details: 'Capacity changed to 25' },
            { timestamp: new Date(Date.now() - 7200000).toISOString(), user: 'faculty@example.com', action: 'Booked Computer Lab for "CS101" successfully.', details: 'Lab ID: 1, Date: 2024-09-02, Time: Mon_09_11' },
            { timestamp: new Date(Date.now() - 10800000).toISOString(), user: 'assistant@example.com', action: 'Updated seat status for 5 seats in "Electronics Lab".', details: 'Lab ID: 4 (example), Seats: S1-S5 marked as not-working' },
            { timestamp: new Date(Date.now() - 86400000).toISOString(), user: 'admin@example.com', action: 'User "newfaculty@example.com" created successfully.' },
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
    // Assuming USER_ROLE_VALUES is available or you hardcode valid roles
    const validRoles = ['Admin', 'Faculty', 'Student', 'Assistant']; // Example, use your constants
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
        
        // For admin creation, secretWordHash needs a default value or should be nullable in schema if not provided
        // Assuming 'secretWordHash' column in your 'users' table allows NULL or has a DB default.
        // If secretWord is required from admin for new users, it should be part of req.body and handled.
        const newUser = {
            fullName,
            email,
            passwordHash: hashedPassword,
            secretWordHash: '', // Placeholder: In a real scenario, admin might set a temporary one, or it's set to a default hashed value, or this field might not be set by admin. Assuming the schema.sql now makes it NOT NULL.
            role,
            department: department || null,
        };
        // If secretWordHash is NOT NULL and has no default, you must provide a value.
        // For instance, if admin is expected to provide a secret word for the new user:
        // const { secretWord } = req.body; 
        // if (!secretWord) return res.status(400).json({msg: 'Secret word is required for new user'});
        // newUser.secretWordHash = await bcrypt.hash(secretWord, salt);

        const [result] = await pool.query('INSERT INTO users SET ?', newUser);
        const [createdUserResult] = await pool.query('SELECT id, fullName, email, role, department, createdAt FROM users WHERE id = ?', [result.insertId]);
        
        if (createdUserResult.length === 0) {
            return res.status(500).json({ msg: 'Failed to retrieve created user details.'})
        }
        res.status(201).json(createdUserResult[0]);
    } catch (err) {
        console.error('Admin create user error:', err.message, err.stack);
        if (err.sqlMessage && err.sqlMessage.includes("Column 'secretWordHash' cannot be null") && (!req.body.secretWord && newUser.secretWordHash === '')) { // More specific check
             return res.status(500).json({ msg: 'Server error: secretWordHash is required by the database schema and was not provided or set. Please ensure the schema allows NULL or has a default value for secretWordHash, or provide a dummy secretWord if necessary during admin creation.' });
        }
        res.status(500).json({ msg: 'Server error during user creation by admin' });
    }
});

// @route   PUT api/admin/users/:userId
// @desc    Admin updates a user's details (excluding password and secret word)
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
    const validRoles = ['Admin', 'Faculty', 'Student', 'Assistant']; // Example
    if (!validRoles.includes(role)) {
        return res.status(400).json({ msg: 'Invalid role specified.' });
    }

    try {
        const [existingUsers] = await pool.query('SELECT id, email, department FROM users WHERE id = ?', [userId]);
        if (existingUsers.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if new email is already taken by another user
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
            // Password and secretWordHash are not updated here by admin
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

        // ON DELETE CASCADE in 'bookings' table for userId FK will handle related bookings.
        // Other related records in other tables might need manual handling or schema adjustments
        // if they don't have ON DELETE CASCADE or ON DELETE SET NULL.
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ msg: 'User deleted successfully by admin.' });

    } catch (err) {
        console.error('Admin delete user error:', err.message, err.stack);
        // Check for foreign key constraint violation error (MySQL specific code ER_ROW_IS_REFERENCED_2)
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || (err.sqlMessage && err.sqlMessage.toLowerCase().includes('foreign key constraint fails'))) {
            return res.status(400).json({ msg: 'Cannot delete user. They are referenced in other records that do not cascade delete (e.g., non-cascading assignments). Consider deactivating the user or reassigning their records first.' });
        }
        res.status(500).json({ msg: 'Server error while deleting user by admin.' });
    }
});


module.exports = router;


