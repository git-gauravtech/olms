
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, isAdmin, USER_ROLES } = require('../middleware/authMiddleware'); // Assuming USER_ROLES is exported or defined here
const bcrypt = require('bcryptjs');
const { spawn } = require('child_process'); // For C++ integration

// --- User Management by Admin ---

// @route   GET api/admin/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/users', [auth, isAdmin], async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, fullName, email, role, department FROM users ORDER BY fullName ASC');
        res.json(users);
    } catch (err) {
        console.error('Error fetching users (admin):', err.message);
        res.status(500).send('Server Error: Could not fetch users');
    }
});

// @route   POST api/admin/users
// @desc    Admin creates a new user
// @access  Private (Admin)
router.post('/users', [auth, isAdmin], async (req, res) => {
    const { fullName, email, password, secretWord, role, department } = req.body;

    if (!fullName || !email || !password || !secretWord || !role) {
        return res.status(400).json({ msg: 'Please provide fullName, email, password, secretWord, and role.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ msg: 'Password must be at least 6 characters long.' });
    }
    if (secretWord.length < 4) {
        return res.status(400).json({ msg: 'Secret word must be at least 4 characters long.' });
    }
    
    const validRoles = Object.values(USER_ROLES || {}); // USER_ROLES from authMiddleware
    if (!validRoles.includes(role)) {
        return res.status(400).json({ msg: 'Invalid role specified.' });
    }

    try {
        let [users] = await pool.query('SELECT email FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(400).json({ msg: 'User already exists with this email.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const hashedSecretWord = await bcrypt.hash(secretWord, salt);

        const newUser = {
            fullName,
            email,
            passwordHash: hashedPassword,
            secretWordHash: hashedSecretWord,
            role,
            department: department || null
        };
        const [result] = await pool.query('INSERT INTO users SET ?', newUser);
        
        const [createdUser] = await pool.query('SELECT id, fullName, email, role, department FROM users WHERE id = ?', [result.insertId]);
        res.status(201).json(createdUser[0]);

    } catch (err) {
        console.error('Admin create user error:', err.message, err.stack);
        res.status(500).json({ msg: 'Server error during user creation by admin.' });
    }
});


// @route   PUT api/admin/users/:userId
// @desc    Admin updates a user's details (excluding password and secret word)
// @access  Private (Admin)
router.put('/users/:userId', [auth, isAdmin], async (req, res) => {
    const { fullName, email, role, department } = req.body;
    const { userId } = req.params;

    if (fullName === undefined && email === undefined && role === undefined && department === undefined) {
        return res.status(400).json({ msg: 'At least one field (fullName, email, role, department) must be provided for update.' });
    }
     if (role) {
        const validRoles = Object.values(USER_ROLES || {});
        if (!validRoles.includes(role)) {
            return res.status(400).json({ msg: 'Invalid role specified.' });
        }
    }

    try {
        const [existingUserResult] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (existingUserResult.length === 0) {
            return res.status(404).json({ msg: 'User not found.' });
        }
        const existingUser = existingUserResult[0];

        // Check if new email is already in use by another user
        if (email && email !== existingUser.email) {
            const [emailCheck] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
            if (emailCheck.length > 0) {
                return res.status(400).json({ msg: 'Email is already in use by another account.' });
            }
        }

        const updatedFields = {
            fullName: fullName !== undefined ? fullName : existingUser.fullName,
            email: email !== undefined ? email : existingUser.email,
            role: role !== undefined ? role : existingUser.role,
            department: department !== undefined ? (department || null) : existingUser.department,
        };

        await pool.query('UPDATE users SET ? WHERE id = ?', [updatedFields, userId]);
        const [updatedUser] = await pool.query('SELECT id, fullName, email, role, department FROM users WHERE id = ?', [userId]);
        res.json(updatedUser[0]);

    } catch (err) {
        console.error('Admin update user error:', err.message, err.stack);
        res.status(500).json({ msg: 'Server error while updating user by admin.' });
    }
});

// @route   DELETE api/admin/users/:userId
// @desc    Admin deletes a user
// @access  Private (Admin)
router.delete('/users/:userId', [auth, isAdmin], async (req, res) => {
    const { userId } = req.params;

    if (String(req.user.id) === String(userId)) {
        return res.status(400).json({ msg: 'Admins cannot delete their own account through this interface.' });
    }

    try {
        const [userResult] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (userResult.length === 0) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        // Consider implications before deleting: e.g., bookings made by this user.
        // The schema has ON DELETE CASCADE for bookings.userId, so related bookings will be deleted.
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ msg: 'User deleted successfully by admin.' });

    } catch (err)
     {
        console.error('Admin delete user error:', err.message, err.stack);
        // Check for foreign key constraint violation if ON DELETE RESTRICT was used (not the case for users -> bookings)
        if (err.code === 'ER_ROW_IS_REFERENCED_2') { 
            // This might happen if other tables reference users without ON DELETE CASCADE, e.g. if a hypothetical 'audit_log' table had a userId
            return res.status(400).json({ msg: 'Cannot delete user. They are referenced in other parts of the system. Please ensure all related records are handled first.' });
        }
        res.status(500).json({ msg: 'Server error while deleting user by admin.' });
    }
});


// --- Requests Management by Admin ---

// @route   GET api/admin/requests/faculty
// @desc    Get faculty requests needing admin approval
// @access  Private (Admin)
router.get('/requests/faculty', [auth, isAdmin], async (req, res) => {
    try {
        // Fetch bookings made by Faculty that are in 'pending-admin-approval' status
        const [facultyRequests] = await pool.query(`
            SELECT b.*, u.fullName as userName, u.email as userEmail, l.name as labName
            FROM bookings b
            JOIN users u ON b.userId = u.id
            LEFT JOIN labs l ON b.labId = l.id
            WHERE b.status = 'pending-admin-approval' AND u.role = ?
            ORDER BY b.submittedDate ASC
        `, [USER_ROLES.FACULTY]); // USER_ROLES.FACULTY should be 'Faculty'
        res.json(facultyRequests);
    } catch (err) {
        console.error('Error fetching faculty requests for admin:', err.message, err.stack);
        res.status(500).json({ msg: 'Server Error: Could not fetch faculty requests' });
    }
});


// --- DAA Algorithm Triggers (Simulation & Integration Point) ---
// MOCK_TIME_SLOTS for backend reference if needed by C++ input simulation
const MOCK_TIME_SLOTS_BACKEND_REF = [ 
  { id: 'ts_0800_0900', startTime: '08:00', endTime: '09:00', displayTime: '08:00 AM - 09:00 AM' },
  { id: 'ts_0900_1000', startTime: '09:00', endTime: '10:00', displayTime: '09:00 AM - 10:00 AM' },
  { id: 'ts_1000_1100', startTime: '10:00', endTime: '11:00', displayTime: '10:00 AM - 11:00 AM' },
  { id: 'ts_1100_1200', startTime: '11:00', endTime: '12:00', displayTime: '11:00 AM - 12:00 PM' },
  { id: 'ts_1200_1300', startTime: '12:00', endTime: '13:00', displayTime: '12:00 PM - 01:00 PM' },
  { id: 'ts_1300_1400', startTime: '13:00', endTime: '14:00', displayTime: '01:00 PM - 02:00 PM' },
  { id: 'ts_1400_1500', startTime: '14:00', endTime: '15:00', displayTime: '02:00 PM - 03:00 PM' },
  { id: 'ts_1500_1600', startTime: '15:00', endTime: '16:00', displayTime: '03:00 PM - 04:00 PM' },
  { id: 'ts_1600_1700', startTime: '16:00', endTime: '17:00', displayTime: '04:00 PM - 05:00 PM' },
  { id: 'ts_1700_1800', startTime: '17:00', endTime: '18:00', displayTime: '05:00 PM - 06:00 PM' },
];

// @route   POST api/admin/algorithms/:algorithmName
// @desc    Trigger a specific DAA algorithm
// @access  Private (Admin only)
router.post('/algorithms/:algorithmName', [auth, isAdmin], async (req, res) => {
    const { algorithmName } = req.params;
    
    let actualInputForCpp = {}; 
    let simulatedOutputFromCpp = {}; 
    let dbUpdateSummary = "No database changes simulated by algorithm.";
    let successMessage = `Algorithm '${algorithmName}' process initiated.`;
    let cppExecutablePath = ''; // Placeholder, MUST BE UPDATED FOR REAL C++ EXECUTION

    try {
        // Simulate fetching data and preparing input common to most algorithms
        // In a real scenario, data fetching would be specific to each algorithm's needs.
        // console.log("[Backend] SIMULATING: Fetching common data like labs, equipment, booking requests, users, timeslots from MySQL...");

        if (algorithmName === 'run-scheduling') { // Graph Coloring
            cppExecutablePath = './cpp_algorithms/scheduler'; // <-- UPDATE THIS PATH
            successMessage = `Graph Coloring scheduling process initiated.`;
            // console.log("[Backend] Preparing input for C++ Graph Coloring (Scheduling)...");
            
            // Input: Graph with nodes = lab sessions, edges = conflicts
            // Here, labSessionRequests *represent* the nodes. The C++ would build the graph.
            actualInputForCpp = {
                description: "Input for Graph Coloring Algorithm to schedule lab sessions, avoiding time conflicts.",
                labs: [ 
                    { id: 1, name: "CS Lab 101", capacity: 30, type: "Computer" },
                    { id: 2, name: "Electronics Lab", capacity: 25, type: "Electronics" }
                ],
                // These requests represent lab sessions to be scheduled. Conflicts arise from overlapping student batches or faculty.
                labSessionRequests: [ 
                    { requestId: "S101A", sessionName: "CS101 Sec A - Lab 1", courseSection: "CS101_SecA", facultyId: "F10", studentBatch: "Batch_A1", durationSlots: 1, requiredLabType: "Computer" },
                    { requestId: "S101B", sessionName: "CS101 Sec A - Lab 2", courseSection: "CS101_SecA", facultyId: "F10", studentBatch: "Batch_A1", durationSlots: 1, requiredLabType: "Computer" },
                    { requestId: "S102", sessionName: "CS101 Sec B - Lab 1", courseSection: "CS101_SecB", facultyId: "F11", studentBatch: "Batch_A2", durationSlots: 1, requiredLabType: "Computer" },
                    { requestId: "S201", sessionName: "EE201 Sec A - Lab 1 (2-slot)", courseSection: "EE201_SecA", facultyId: "F12", studentBatch: "Batch_B1", durationSlots: 2, requiredLabType: "Electronics" }
                ],
                timeSlots: MOCK_TIME_SLOTS_BACKEND_REF.map(ts => ({id: ts.id, display: ts.displayTime, startTime: ts.startTime, endTime: ts.endTime})),
                facultyAvailability: { 
                    "F10": ["ts_0900_1000", "ts_1000_1100", "ts_1400_1500"],
                    "F11": ["ts_1300_1400", "ts_1400_1500"],
                    "F12": ["ts_0900_1000", "ts_1000_1100", "ts_1600_1700", "ts_1700_1800"],
                },
                // Constraints: studentBatchNonConcurrency (implicit), labCapacity (handled by C++ logic if batch sizes known), facultyConsistency (handled by C++ logic)
            };
            
            // Output: Assign time slots (colors) so no conflicts occur
            simulatedOutputFromCpp = { 
                status: "success", 
                summary: "Generated conflict-free schedule for 3 lab sessions.",
                // These represent lab sessions assigned to specific time slots.
                assignedSchedule: [
                    { sessionRequestId: "S101A", assignedLabId: 1, assignedDate: "2024-09-02", assignedTimeSlotId: "ts_0900_1000", facultyId: "F10", studentBatch: "Batch_A1", notes: "CS101 Sec A - Lab 1 scheduled."},
                    { sessionRequestId: "S101B", assignedLabId: 1, assignedDate: "2024-09-03", assignedTimeSlotId: "ts_0900_1000", facultyId: "F10", studentBatch: "Batch_A1", notes: "CS101 Sec A - Lab 2 scheduled."},
                    { sessionRequestId: "S102", assignedLabId: 1, assignedDate: "2024-09-02", assignedTimeSlotId: "ts_1300_1400", facultyId: "F11", studentBatch: "Batch_A2", notes: "CS101 Sec B - Lab 1 scheduled."},
                ],
                unscheduledSessions: [ { sessionRequestId: "S201", reason: "No suitable 2-slot block found for faculty F12 in Electronics Lab respecting availability." } ]
            };
            dbUpdateSummary = `DB Update SIMULATED (Graph Coloring): ${simulatedOutputFromCpp.assignedSchedule?.length || 0} sessions would be booked/updated in 'bookings' table. ${simulatedOutputFromCpp.unscheduledSessions?.length || 0} requests/sessions marked as unscheduled.`;
            
        } else if (algorithmName === 'run-resource-allocation') { // 0/1 Knapsack
            cppExecutablePath = './cpp_algorithms/knapsack_allocator'; // <-- UPDATE THIS PATH
            successMessage = `0/1 Knapsack resource allocation process initiated.`;
            // console.log("[Backend] Preparing input for C++ 0/1 Knapsack (Resource Allocation)...");
            
            // Input: List of booking requests needing equipment + total equipment available
            actualInputForCpp = {
                description: "Input for 0/1 Knapsack Algorithm to allocate scarce lab equipment.",
                scarceResources: [ 
                    { resourceType: "AdvancedOscilloscope", availableUnits: 3, weightPerUnit: 1 }, 
                    { resourceType: "SpectrometerXYZ", availableUnits: 1, weightPerUnit: 1 }  
                ],
                // Booking requests needing these scarce resources, with a priority/value.
                bookingRequests: [ 
                    { bookingId: 201, courseSection: "EE301_LabA", priorityValue: 10, needs: [{ resourceType: "AdvancedOscilloscope", units: 2 }] }, // value/weight = 10/2
                    { bookingId: 202, courseSection: "PHY400_Research", priorityValue: 12, needs: [{ resourceType: "SpectrometerXYZ", units: 1 }, { resourceType: "AdvancedOscilloscope", units: 1 }] }, // value/weight = 12/(1+1)
                    { bookingId: 203, courseSection: "EE301_LabB", priorityValue: 8, needs: [{ resourceType: "AdvancedOscilloscope", units: 2 }] } // value/weight = 8/2
                ]
            };
            
            // Output: Optimal subset of bookings to allocate equipment
            simulatedOutputFromCpp = {
                status: "success",
                summary: "Optimally allocated scarce resources to 2 booking requests.",
                // This shows which bookings received which equipment.
                resourceAllocations: [ 
                    { bookingId: 202, allocatedResources: [{ resourceType: "SpectrometerXYZ", unitsAllocated: 1, specificInstanceIds: ["SPEC_001"] }, { resourceType: "AdvancedOscilloscope", unitsAllocated: 1, specificInstanceIds: ["SCOPE_ADV_003"] }] },
                    { bookingId: 201, allocatedResources: [{ resourceType: "AdvancedOscilloscope", unitsAllocated: 2, specificInstanceIds: ["SCOPE_ADV_001", "SCOPE_ADV_002"] }] }
                ],
                unallocatedRequests: [ 
                    { bookingId: 203, reason: "Insufficient AdvancedOscilloscope units after higher priority/value allocations." }
                ]
            };
            dbUpdateSummary = `DB Update SIMULATED (Knapsack): For ${simulatedOutputFromCpp.resourceAllocations?.length || 0} bookings, specific equipment instances (IDs like 'SPEC_001') would be assigned. ${simulatedOutputFromCpp.unallocatedRequests?.length || 0} bookings could not be fully resourced.`;

        } else if (algorithmName === 'optimize-lab-usage') { // Greedy Algorithm
             cppExecutablePath = './cpp_algorithms/greedy_filler'; // <-- UPDATE THIS PATH
             successMessage = `Greedy lab usage optimization process initiated.`;
            // console.log("[Backend] Preparing input for C++ Greedy Algorithm (Optimize Lab Usage/Fill Gaps)...");

            // Input: Free slots in schedule + list of small bookings or tasks
            actualInputForCpp = {
                description: "Input for Greedy Algorithm to fill free lab slots efficiently.",
                // These are identified empty slots in the schedule.
                freeTimeSlots: [ 
                    { labId: 1, labName: "CS Lab 101", date: "2024-09-05", timeSlotId: "ts_0900_1000", capacity: 30, type: "Computer" }, 
                    { labId: 3, labName: "Physics Lab Alpha", date: "2024-09-05", timeSlotId: "ts_1100_1200", capacity: 25, type: "Physics" }
                ],
                // These are pending bookings/tasks that could fill the gaps, with a priority.
                pendingBookingsOrTasks: [ 
                    { taskId: "T301", taskName: "BIO101 Makeup Lab", priority: 100, durationSlots: 1, requiredLabType: "Any", requiredCapacity: 15, facultyId: "F15" },
                    { taskId: "T302", taskName: "CS Club Practice", priority: 90, durationSlots: 1, requiredLabType: "Computer", requiredCapacity: 20, facultyId: "F16" }
                ]
            };
            
            // Output: Assignments maximizing lab utilization
            simulatedOutputFromCpp = {
                status: "success",
                summary: "Filled 1 empty slot using Greedy approach by prioritizing highest value requests.",
                // Shows which tasks were assigned to which free slots.
                filledSlotsAssignments: [ 
                    { taskId: "T301", assignedLabId: 1, assignedDate: "2024-09-05", assignedTimeSlotId: "ts_0900_1000", notes: "BIO101 Makeup Lab assigned to CS Lab 101." }
                ],
                remainingPendingBookingsOrTasks: [ { taskId: "T302", reason: "No suitable slot or lower priority."} ]
            };
            dbUpdateSummary = `DB Update SIMULATED (Greedy): For ${simulatedOutputFromCpp.filledSlotsAssignments?.length || 0} filled slots, new booking records would be created/updated.`;

        } else if (algorithmName === 'assign-nearest-labs') { // Dijkstra's
            cppExecutablePath = './cpp_algorithms/dijkstra_planner'; // <-- UPDATE THIS PATH
            successMessage = `Dijkstra's nearest lab assignment process initiated.`;
            // console.log("[Backend] Preparing input for C++ Dijkstra's Algorithm (Assign Nearest Labs)...");

            // Input: Graph representing building/floor layout with weighted edges (distances)
            actualInputForCpp = {
                description: "Input for Dijkstra's Algorithm to find nearest available labs.",
                // Nodes are locations, edges are paths with weights (distance/time).
                campusLayoutGraph: { 
                    nodes: [ {id: "CS_Dept_Entrance"}, {id: "Corridor_Junction1"}, {id: "Lab101_Door"}, {id: "Lab102_Door"}, {id: "Physics_Dept_Wing"}, {id: "Lab205_Door"} ], 
                    edges: [ 
                        {from: "CS_Dept_Entrance", to: "Corridor_Junction1", distance: 50}, 
                        {from: "Corridor_Junction1", to: "Lab101_Door", distance: 30}, 
                        {from: "Corridor_Junction1", to: "Lab102_Door", distance: 70}, 
                        {from: "Physics_Dept_Wing", to: "Corridor_Junction1", distance: 60},
                        {from: "Physics_Dept_Wing", to: "Lab205_Door", distance: 20}
                    ]
                },
                // User's current or department location.
                sourceLocationNodeId: "CS_Dept_Entrance", 
                // Available labs (meeting type/capacity needs) mapped to graph nodes.
                targetAvailableLabs: [ 
                    {labDatabaseId: 1, name: "CS Lab 101", locationNodeId: "Lab101_Door"}, 
                    {labDatabaseId: 2, name: "CS Lab 102", locationNodeId: "Lab102_Door"},
                    {labDatabaseId: 5, name: "Physics Lab Beta (Overflow)", locationNodeId: "Lab205_Door"}
                ] 
            };
            
            // Output: Nearest available lab for booking requests
            simulatedOutputFromCpp = {
                status: "success",
                summary: "Found nearest available labs from source 'CS_Dept_Entrance'.",
                // Shortest paths to all target labs, with distances.
                nearestLabSuggestions: [ 
                    { labDatabaseId: 1, name: "CS Lab 101", distance: 80, path: ["CS_Dept_Entrance", "Corridor_Junction1", "Lab101_Door"] },
                    { labDatabaseId: 2, name: "CS Lab 102", distance: 120, path: ["CS_Dept_Entrance", "Corridor_Junction1", "Lab102_Door"] },
                    // Corrected path logic if it has to go through another department wing node conceptually
                    { labDatabaseId: 5, name: "Physics Lab Beta (Overflow)", distance: 130, path: ["CS_Dept_Entrance", "Corridor_Junction1", "Physics_Dept_Wing", "Lab205_Door"] }
                ],
                // The top recommendation.
                primaryRecommendation: { labDatabaseId: 1, name: "CS Lab 101", distance: 80 } 
            };
            dbUpdateSummary = `Result SIMULATED (Dijkstra's): Nearest suitable lab is ${simulatedOutputFromCpp.primaryRecommendation?.name}. This information can be used by the booking system to suggest or prioritize labs. No direct DB update typically, but could influence labId for a new booking.`;
        } else {
            return res.status(400).json({ success: false, msg: `Algorithm '${algorithmName}' is not recognized.` });
        }

        // --- Common C++ Process Execution Logic (Fully Scaffolded for each algorithm) ---
        
        await new Promise((resolve, reject) => {
            const cppProcess = spawn(cppExecutablePath, []); 

            let cppOutput = '';
            let cppErrorOutput = '';

            cppProcess.on('error', (err) => { 
                console.error(`[Backend] Failed to start C++ process for ${algorithmName}. Error: ${err.message}. Path: '${cppExecutablePath}'`);
                dbUpdateSummary = `Failed to start C++ process (path: '${cppExecutablePath}' not found or not executable). Check backend console.`;
                simulatedOutputFromCpp.status = "error_spawning_cpp";
                simulatedOutputFromCpp.summary = `Failed to start C++ process for ${algorithmName}. Error: ${err.message}. Path: '${cppExecutablePath}'. This is a simulation; the C++ program was not actually run.`;
                resolve(); 
            });

            if (!cppProcess.pid && !cppProcess.killed) { 
                // This path might be taken if 'error' event fired and resolved, then code continues.
                // If status is already "error_spawning_cpp", we don't need to do anything more.
                if (simulatedOutputFromCpp.status !== "error_spawning_cpp") {
                     // This state is unusual if 'error' event didn't fire.
                    console.warn(`[Backend] C++ process for ${algorithmName} may not have spawned correctly (no PID) and no 'error' event handled it yet.`);
                    simulatedOutputFromCpp.status = "error_spawning_cpp_unknown";
                    simulatedOutputFromCpp.summary = `C++ process for ${algorithmName} did not spawn correctly (no PID).`;
                    dbUpdateSummary = `C++ process failed to spawn. No DB changes.`;
                    resolve();
                }
                return; 
            }
            
            if (cppProcess.stdin) {
                 cppProcess.stdin.write(JSON.stringify(actualInputForCpp));
                 cppProcess.stdin.end();
            } else {
                 if (simulatedOutputFromCpp.status !== "error_spawning_cpp") {
                    console.warn(`[Backend] C++ process stdin not available for ${algorithmName}.`);
                    simulatedOutputFromCpp.status = "error_spawning_cpp_stdin";
                    simulatedOutputFromCpp.summary = "Failed to get stdin for C++ process. It might have closed prematurely or failed to start properly.";
                    dbUpdateSummary = `C++ process stdin unavailable. No DB changes.`;
                    resolve();
                 }
                 return; 
            }

            if(cppProcess.stdout) {
                cppProcess.stdout.on('data', (data) => { cppOutput += data.toString(); });
            }
            if(cppProcess.stderr) {
                cppProcess.stderr.on('data', (data) => { cppErrorOutput += data.toString(); console.error(`[C++ Stderr for ${algorithmName}]: ${data}`); });
            }
            
            cppProcess.on('close', (code) => {
                if (simulatedOutputFromCpp.status && simulatedOutputFromCpp.status.startsWith("error_spawning")) {
                    // If spawn error already handled, just resolve.
                    resolve();
                    return;
                }

                if (cppErrorOutput) { console.error(`[Backend] C++ process for ${algorithmName} emitted errors to stderr (see above).`); }

                if (code === 0 && cppOutput.trim() !== '') { 
                    // console.log(`[Backend] C++ process for ${algorithmName} ran successfully and produced output. Using predefined simulation for result structure.`);
                    // In a real scenario, you'd parse cppOutput here.
                    // For simulation, we retain the structure of simulatedOutputFromCpp but confirm it conceptually ran.
                    if(simulatedOutputFromCpp.status === "success") simulatedOutputFromCpp.status = "success_cpp_executed_simulated_result";
                } else if (code !== 0) { 
                    simulatedOutputFromCpp.status = "error_cpp_exit_code";
                    simulatedOutputFromCpp.summary = `C++ process for ${algorithmName} failed with exit code ${code}. Stderr: ${cppErrorOutput || 'No stderr output'}. Stdout: ${cppOutput || 'No stdout output'}. This is a simulation; the C++ program was not actually run or it malfunctioned.`;
                    dbUpdateSummary = `C++ process failed. No DB changes.`;
                } else { 
                    simulatedOutputFromCpp.status = "success_cpp_no_output";
                    simulatedOutputFromCpp.summary = `C++ process for ${algorithmName} ran (exit code 0) but produced no stdout output. Using predefined simulation for result structure. This is part of a simulation; the C++ program might be a stub or not designed to output JSON for this interaction.`;
                     if(simulatedOutputFromCpp.status === "success") simulatedOutputFromCpp.status = "success_cpp_executed_simulated_result"; // Assume success if code is 0, even if no output for some stubs
                }
                resolve(); 
            });
        }); 

        if (!res.headersSent) { 
            res.json({
                success: true, 
                message: successMessage, 
                algorithm: algorithmName,
                simulatedInputSentToCpp: actualInputForCpp, 
                simulatedOutputReceivedFromCpp: simulatedOutputFromCpp, 
                simulatedDatabaseUpdateSummary: dbUpdateSummary
            });
        }

    } catch (error) { 
        console.error(`[Backend] General error in algorithm trigger for ${algorithmName}:`, error.message, error.stack);
        if (!res.headersSent) {
            res.status(500).json({ 
                success: false, 
                message: `Server error during ${algorithmName} processing. Details: ${error.message}`,
                algorithm: algorithmName,
                simulatedInputSentToCpp: actualInputForCpp, 
                simulatedOutputReceivedFromCpp: { 
                    status: "error_server_handler",
                    summary: `Server error before C++ execution: ${error.message}`,
                    ...simulatedOutputFromCpp 
                },
                simulatedDatabaseUpdateSummary: dbUpdateSummary || `Error occurred before DB simulation: ${error.message}` 
            });
        }
    }
});

// --- System Activity Log (Mock) ---
// @route   GET api/admin/system-activity
// @desc    Get mock system activity logs
// @access  Private (Admin only)
router.get('/system-activity', [auth, isAdmin], (req, res) => {
    // In a real application, this would query a logs table or log files.
    const mockLogs = [
        { timestamp: new Date(Date.now() - 7200000).toISOString(), user: 'admin@example.com', action: 'User Created', details: 'Created new faculty account for faculty_new@example.com' },
        { timestamp: new Date(Date.now() - 3600000).toISOString(), user: 'admin@example.com', action: 'Logged in', details: 'Successful login from IP 192.168.1.10' },
        { timestamp: new Date(Date.now() - 2400000).toISOString(), user: 'faculty@example.com', action: 'Booking Conflict - Admin Review', details: 'Faculty attempted to book CS Lab 101 for CS101_SecA on 2024-09-10, 10:00 AM; slot was taken. Request pending admin approval.' },
        { timestamp: new Date(Date.now() - 1800000).toISOString(), user: 'admin@example.com', action: 'Lab Updated', details: 'Updated capacity for CS Lab 101 to 35' },
        { timestamp: new Date(Date.now() - 900000).toISOString(), user: 'assistant@example.com', action: 'Seat Status Updated', details: 'Marked seat #5 in Electronics Lab as "not-working".' },
        { timestamp: new Date(Date.now() - 600000).toISOString(), user: 'faculty@example.com', action: 'Booking Created', details: 'Booked CS Lab 101 for CS101_SecA on 2024-09-10, 10:00 AM' },
        { timestamp: new Date(Date.now() - 300000).toISOString(), user: 'admin@example.com', action: 'Algorithm Triggered (Simulated)', details: 'Ran run-scheduling (Graph Coloring) algorithm.' },
        { timestamp: new Date().toISOString(), user: 'admin@example.com', action: 'Viewed System Activity', details: 'Accessed the system activity log.' }
    ];
    res.json(mockLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))); // Sort newest first
});


module.exports = router;
    
    