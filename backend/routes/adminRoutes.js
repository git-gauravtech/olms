
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, isAdmin, USER_ROLES } = require('../middleware/authMiddleware');
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
    const validRoles = Object.values(USER_ROLES);
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
// @desc    Admin updates a user's details (excluding password)
// @access  Private (Admin)
router.put('/users/:userId', [auth, isAdmin], async (req, res) => {
    const { fullName, email, role, department } = req.body;
    const { userId } = req.params;

    if (!fullName && !email && !role && department === undefined) {
        return res.status(400).json({ msg: 'At least one field (fullName, email, role, department) must be provided for update.' });
    }
     if (role) {
        const validRoles = Object.values(USER_ROLES);
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

    // Prevent admin from deleting their own account through this specific route for safety
    if (String(req.user.id) === String(userId)) {
        return res.status(400).json({ msg: 'Admins cannot delete their own account through this interface.' });
    }

    try {
        const [userResult] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (userResult.length === 0) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        // ON DELETE CASCADE for bookings related to userId will handle associated bookings
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ msg: 'User deleted successfully by admin.' });

    } catch (err) {
        console.error('Admin delete user error:', err.message, err.stack);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') { // Generic foreign key constraint
            return res.status(400).json({ msg: 'Cannot delete user. They are referenced in other parts of the system that do not allow cascading deletion (e.g., active sessions, specific logs not covered by ON DELETE CASCADE). Please ensure all related records are handled first.' });
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
        const [facultyRequests] = await pool.query(`
            SELECT b.*, u.fullName as userName, u.email as userEmail, l.name as labName
            FROM bookings b
            JOIN users u ON b.userId = u.id
            LEFT JOIN labs l ON b.labId = l.id
            WHERE b.status = 'pending-admin-approval' AND u.role = ? 
            ORDER BY b.submittedDate ASC
        `, [USER_ROLES.FACULTY]); // Make sure USER_ROLES.FACULTY is defined correctly
        res.json(facultyRequests);
    } catch (err) {
        console.error('Error fetching faculty requests for admin:', err.message, err.stack);
        res.status(500).json({ msg: 'Server Error: Could not fetch faculty requests' });
    }
});


// --- System Activity Logs (Mock) ---
// @route   GET api/admin/system-activity
// @desc    Get mock system activity logs
// @access  Private (Admin)
router.get('/system-activity', [auth, isAdmin], async (req, res) => {
    // In a real application, this would fetch from a dedicated logs table or logging service.
    const mockLogs = [
        { timestamp: new Date(Date.now() - 3600000 * 2), user: 'admin@example.com', action: 'Lab "Physics Lab Alpha" updated.', details: 'Capacity changed to 25' },
        { timestamp: new Date(Date.now() - 3600000 * 1.5), user: 'faculty@example.com', action: 'Booked "CS101 Lab"', details: 'Lab: Computer Lab 101, Time: Mon 10-12' },
        { timestamp: new Date(Date.now() - 3600000 * 1), user: 'assistant@example.com', action: 'Seat status updated for "Computer Lab 101"', details: 'Seat 5 marked as not-working' },
        { timestamp: new Date(Date.now() - 600000), user: 'system', action: 'Algorithm "run-scheduling" triggered by Admin.', details: 'Simulated successful completion.' },
        { timestamp: new Date(), user: 'admin@example.com', action: 'Logged in.', details: 'Accessed System Overview.' }
    ];
    res.json(mockLogs.sort((a,b) => b.timestamp - a.timestamp)); // Sort newest first
});


// --- DAA Algorithm Triggers (Simulation & Integration Point) ---
const MOCK_TIME_SLOTS_FROM_CONSTANTS_OR_DB = [ // Example, match your frontend constants.js
  { id: 'ts_0800_0900', startTime: '08:00', endTime: '09:00', display: '08:00 AM - 09:00 AM' },
  { id: 'ts_0900_1000', startTime: '09:00', endTime: '10:00', display: '09:00 AM - 10:00 AM' },
  { id: 'ts_1000_1100', startTime: '10:00', endTime: '11:00', display: '10:00 AM - 11:00 AM' },
  { id: 'ts_1100_1200', startTime: '11:00', endTime: '12:00', display: '11:00 AM - 12:00 PM' },
  { id: 'ts_1300_1400', startTime: '13:00', endTime: '14:00', display: '01:00 PM - 02:00 PM' },
  { id: 'ts_1400_1500', startTime: '14:00', endTime: '15:00', display: '02:00 PM - 03:00 PM' },
];

// @route   POST api/admin/algorithms/:algorithmName
// @desc    Trigger a specific DAA algorithm
// @access  Private (Admin only)
router.post('/algorithms/:algorithmName', [auth, isAdmin], async (req, res) => {
    const { algorithmName } = req.params;
    const { inputPayload } = req.body; // Optional input from frontend if needed for specific algorithms

    console.log(`[Backend] Admin triggered algorithm: ${algorithmName}`);
    
    let actualInputForCpp = {};
    let simulatedOutputFromCpp = {}; // Will be replaced by actual output for scheduling
    let dbUpdateSummary = "No database changes made by algorithm (simulation).";
    let successMessage = `Algorithm '${algorithmName}' process initiated.`;

    try {
        if (algorithmName === 'run-scheduling') { // Graph Coloring - ACTUAL INTEGRATION EXAMPLE
            successMessage = `Graph Coloring scheduling process initiated.`;
            console.log("[Backend] Preparing input for C++ Graph Coloring (Scheduling)...");
            console.log("[Backend] This involves fetching from MySQL: all labs, all pending booking requests (with course, section, faculty, student batch, duration, equipment needs), faculty availability, student batch constraints, and predefined time slots.");
            console.log("[Backend] CRITICAL FOR C++: Ensure faculty consistency for a course section (e.g., all 'CS101-SecA' labs by same faculty) and distinct timetables for different sections (e.g., 'CS101-SecA' vs 'CS101-SecB').");
            
            // Simulate fetching actual data
            const [labsData] = await pool.query("SELECT id, name, capacity, location, roomNumber FROM labs");
            const [bookingRequestsData] = await pool.query(
                `SELECT 
                    b.id as requestId, b.purpose, b.requestedByRole, b.batchIdentifier, b.userId as facultyId, 
                    u.fullName as facultyName,
                    b.labId as preferredLabId, l_pref.name as preferredLabName,
                    b.equipmentIds as requestedEquipmentIds 
                 FROM bookings b
                 JOIN users u ON b.userId = u.id
                 LEFT JOIN labs l_pref ON b.labId = l_pref.id
                 WHERE b.status IN ('pending', 'pending-admin-approval')` // Adjust as per your workflow
            );
            const timeSlots = MOCK_TIME_SLOTS_FROM_CONSTANTS_OR_DB; // Use the mock definition above or fetch from DB

            actualInputForCpp = {
                labs: labsData, // e.g., [{id:1, name:"CS Lab 101", capacity:30}, ...]
                labSessionRequests: bookingRequestsData.map(req => ({ // Transform for clarity
                    requestId: req.requestId,
                    courseSection: req.batchIdentifier || `Request_${req.requestId}`, // Use batchIdentifier as courseSection
                    facultyId: `F${req.facultyId}`, // Example: map to faculty ID
                    studentBatch: req.batchIdentifier || `Batch_Unknown`,
                    durationSlots: 1, // Example: assume 1 slot duration, C++ needs to know this
                    preferredLabId: req.preferredLabId,
                    requiredLabType: "Computer", // Example
                    requiredEquipment: req.requestedEquipmentIds ? JSON.parse(req.requestedEquipmentIds) : [],
                })),
                // Example structure for labSessionRequests:
                // [
                //   { requestId: 1, courseSection: "CS101_SecA", facultyId: "F10", studentBatch: "Batch_A1", durationSlots: 2, requiredLabType: "Computer", preferredLabId: 1},
                //   { requestId: 2, courseSection: "CS101_SecA", facultyId: "F10", studentBatch: "Batch_A1", durationSlots: 1, requiredLabType: "Computer", preferredLabId: 1},
                //   { requestId: 3, courseSection: "PHY202_SecB", facultyId: "F11", studentBatch: "Batch_B1", durationSlots: 2, requiredLabType: "Physics"},
                // ]
                timeSlots: timeSlots.map(ts => ({id: ts.id, display: ts.display})), // e.g., [{id: "ts_0900_1000", display:"09:00 AM - 10:00 AM"}, ...]
                facultyAvailability: { // This would be fetched from DB
                    "F10": ["ts_0900_1000", "ts_1000_1100", "ts_1100_1200"],
                    "F11": ["ts_1300_1400", "ts_1400_1500"]
                },
                // Add other constraints: student batch schedules etc.
            };
            console.log("[Backend] Data fetched and prepared for C++ (first 500 chars):", JSON.stringify(actualInputForCpp, null, 2).substring(0, 500) + "...");

            // ** ACTUAL C++ INTEGRATION POINT **
            // const cppExecutablePath = './cpp_algorithms/scheduler'; //  <-- YOU MUST PROVIDE THIS PATH
            // For Windows, it might be './cpp_algorithms/scheduler.exe'
            const cppExecutablePath = './cpp_algorithms/scheduler'; // Placeholder
            console.log(`[Backend] Attempting to spawn C++ process: ${cppExecutablePath}. Ensure this executable exists and has execution permissions.`);
            
            const cppProcess = spawn(cppExecutablePath, []); // Add command line args if any

            let cppOutput = '';
            let cppErrorOutput = '';

            // Handle errors from spawning the process itself (e.g., file not found)
            cppProcess.on('error', (err) => {
                console.error(`[Backend] Failed to start C++ process for ${algorithmName}. Error: ${err.message}. Path: '${cppExecutablePath}'`);
                // Note: This error often means the path is wrong or the file isn't executable.
                // No res.json here as the 'close' event will handle the response.
                // We set a flag or let the promise reject.
                dbUpdateSummary = `Failed to start C++ process (e.g., path: '${cppExecutablePath}' not found or not executable). Check backend console.`;
                // To ensure the promise below rejects if 'error' occurs before 'close'
                if (!res.headersSent) { // Check if response has already been sent
                     return res.status(500).json({
                        success: false,
                        message: `Failed to start C++ process for ${algorithmName}. Path: '${cppExecutablePath}'. Details: ${err.message}`,
                        algorithm: algorithmName,
                        simulatedInputSentToCpp: actualInputForCpp,
                        simulatedOutputReceivedFromCpp: {}, // No output yet
                        simulatedDatabaseUpdateSummary: dbUpdateSummary
                    });
                }
            });

            if (!res.headersSent) { // Only proceed if spawn error didn't send response
                cppProcess.stdin.write(JSON.stringify(actualInputForCpp));
                cppProcess.stdin.end();

                cppProcess.stdout.on('data', (data) => { cppOutput += data.toString(); });
                cppProcess.stderr.on('data', (data) => { cppErrorOutput += data.toString(); console.error(`[C++ Stderr for ${algorithmName}]: ${data}`); });
                
                await new Promise((resolve, reject) => {
                    cppProcess.on('close', async (code) => {
                        console.log(`[Backend] C++ process for ${algorithmName} exited with code ${code}`);
                        if (cppErrorOutput) { console.error(`[Backend] C++ process for ${algorithmName} emitted errors to stderr: ${cppErrorOutput}`); }

                        if (code === 0 && cppOutput && cppOutput.trim() !== '') {
                            try {
                                const actualScheduleFromCpp = JSON.parse(cppOutput);
                                console.log("[Backend] Parsed output from C++ (Graph Coloring):", JSON.stringify(actualScheduleFromCpp, null, 2));
                                
                                // 3. Update MySQL Database with REAL results from C++
                                console.log("[Backend] Simulating database update with results from C++...");
                                let scheduledCount = 0;
                                let unscheduledCount = 0;

                                // Example DB Update Logic (MUST BE TAILORED TO YOUR C++ OUTPUT FORMAT)
                                // This assumes actualScheduleFromCpp.newlyScheduledBookings contains objects like:
                                // { requestId: "some_id", courseSection: "CS101_SecA", labId: 1, date: "YYYY-MM-DD", timeSlotId: "ts_xxxx_xxxx", facultyId: "F10", studentBatch: "Batch_A1", purpose: "Scheduled by Algorithm"}
                                if (actualScheduleFromCpp.newlyScheduledBookings && Array.isArray(actualScheduleFromCpp.newlyScheduledBookings)) {
                                    for (const session of actualScheduleFromCpp.newlyScheduledBookings) {
                                    //   await pool.query(
                                    //       'INSERT INTO bookings (labId, userId, date, timeSlotId, status, purpose, requestedByRole, batchIdentifier) VALUES (?, ?, ?, ?, "booked", ?, ?, ?)',
                                    //       [session.assignedLabId, session.facultyId, session.assignedDate, session.assignedTimeSlotId, session.purpose || `Scheduled: ${session.courseSection}`, 'Faculty', session.studentBatch]
                                    //   );
                                    //   // Optionally, update original request status if they were separate records
                                    //   // await pool.query("UPDATE bookings SET status = 'scheduled_by_system' WHERE id = ?", [session.requestId]);
                                      scheduledCount++;
                                    }
                                }
                                // This assumes actualScheduleFromCpp.unscheduledRequests is an array of request IDs
                                if (actualScheduleFromCpp.unscheduledRequests && Array.isArray(actualScheduleFromCpp.unscheduledRequests)) {
                                   for (const requestId of actualScheduleFromCpp.unscheduledRequests) {
                                   //    await pool.query("UPDATE bookings SET status = 'scheduling_failed' WHERE id = ?", [requestId]);
                                      unscheduledCount++;
                                   }
                                }
                                dbUpdateSummary = `DB Update Simulation: ${scheduledCount} sessions would be booked/updated. ${unscheduledCount} requests would remain unscheduled.`;
                                successMessage = `Graph Coloring algorithm executed. ${dbUpdateSummary}`;
                                simulatedOutputFromCpp = actualScheduleFromCpp; // Store actual output
                                resolve();
                            } catch (parseError) {
                                console.error(`[Backend] Error parsing JSON output from C++ for ${algorithmName}:`, parseError, "Raw C++ output:", cppOutput);
                                dbUpdateSummary = "C++ process ran, but output was not valid JSON. Check C++ program's stdout.";
                                successMessage = `Graph Coloring algorithm executed with errors parsing output.`;
                                reject(new Error(`Error parsing C++ output: ${parseError.message}. Raw output: ${cppOutput.substring(0, 500)}...`));
                            }
                        } else if (code !== 0) {
                            dbUpdateSummary = `C++ process for ${algorithmName} failed with exit code ${code}. Stderr: ${cppErrorOutput || 'No stderr output'}. Stdout: ${cppOutput || 'No stdout output'}.`;
                            successMessage = `Graph Coloring algorithm execution failed. Check backend console.`;
                            reject(new Error(`C++ process exited with code ${code}. Error: ${(cppErrorOutput || `No stderr output. Stdout: ${cppOutput}`).substring(0,500)}...`));
                        } else { // code === 0 but no cppOutput or empty output
                             dbUpdateSummary = `C++ process for ${algorithmName} ran successfully but produced no output or empty output. Check C++ program logic.`;
                             successMessage = `Graph Coloring algorithm executed but yielded no results.`;
                             simulatedOutputFromCpp = { message: "C++ process produced no output." };
                             resolve(); 
                        }
                    });
                });
            } // End of if (!res.headersSent) for spawn

        } else if (algorithmName === 'run-resource-allocation') { // 0/1 Knapsack - DETAILED SIMULATION
            successMessage = `0/1 Knapsack resource allocation process initiated.`;
            console.log("[Backend] Simulating: Preparing input for 0/1 Knapsack (Resource Allocation)...");
            
            console.log("[Backend] Simulating: Fetching scarce equipment types (e.g., 'Advanced Oscilloscope') and their total 'available' counts from `equipment` table (e.g., SELECT type, COUNT(*) FROM equipment WHERE status='available' AND type IN (...) GROUP BY type).");
            console.log("[Backend] Simulating: Fetching lab sessions from `bookings` (or a requests table) that need these scarce resources, including their priority/value and quantity of each type needed (e.g., 'Session A needs 2 Advanced Oscilloscopes').");
            
            actualInputForCpp = {
                scarceResources: [ 
                    { resourceType: "AdvancedOscilloscopeType", availableUnits: 3 }, // Derived from COUNT query
                    { resourceType: "SpectrometerXYZType", availableUnits: 1 } 
                ],
                sessionRequests: [ 
                    { sessionId: 201, courseSection: "EE301_LabA", priorityValue: 10, needs: [{ resourceType: "AdvancedOscilloscopeType", units: 2 }] },
                    { sessionId: 202, courseSection: "PHY400_Research", priorityValue: 12, needs: [{ resourceType: "SpectrometerXYZType", units: 1 }, { resourceType: "AdvancedOscilloscopeType", units: 1 }] },
                    { sessionId: 203, courseSection: "EE301_LabB", priorityValue: 8, needs: [{ resourceType: "AdvancedOscilloscopeType", units: 2 }] }
                ]
            };
            console.log("[Backend] Simulated input for C++ (Knapsack):", JSON.stringify(actualInputForCpp, null, 2));
            console.log(`[Backend] Simulating call to C++ executable for 0/1 Knapsack...`);
            
            simulatedOutputFromCpp = {
                status: "success",
                summary: "Optimally allocated scarce resources to 2 sessions.",
                allocatedSessions: [ 
                    { sessionId: 202, allocatedResources: [{ resourceType: "SpectrometerXYZType", units: 1, assignedInstanceIds: ["SPEC_001"] }, { resourceType: "AdvancedOscilloscopeType", units: 1, assignedInstanceIds: ["SCOPE_003"] }] },
                    { sessionId: 201, allocatedResources: [{ resourceType: "AdvancedOscilloscopeType", units: 2, assignedInstanceIds: ["SCOPE_001", "SCOPE_002"] }] }
                ],
                unallocatedSessions: [ 
                    { sessionId: 203, reason: "Insufficient AdvancedOscilloscopeType units after higher priority allocations." }
                ]
            };
            console.log("[Backend] Simulated output from C++ (Knapsack):", JSON.stringify(simulatedOutputFromCpp, null, 2));
            
            console.log("[Backend] Simulating DB Update: For each session in `allocatedSessions`, update `bookings.equipmentIds` with `assignedInstanceIds` and potentially `bookings.status`. For `unallocatedSessions`, update their status or notify.");
            dbUpdateSummary = `Simulated: ${simulatedOutputFromCpp.allocatedSessions?.length || 0} sessions allocated scarce resources. ${simulatedOutputFromCpp.unallocatedSessions?.length || 0} sessions could not be fully resourced.`;
            successMessage = `0/1 Knapsack resource allocation simulated: ${dbUpdateSummary}`;

        } else if (algorithmName === 'optimize-lab-usage') { // Greedy Algorithm - DETAILED SIMULATION
             successMessage = `Greedy lab usage optimization process initiated.`;
            console.log("[Backend] Simulating: Preparing input for Greedy Algorithm (Optimize Lab Usage/Fill Gaps)...");
            console.log("[Backend] Simulating: Fetching current lab schedule from `bookings` to identify empty slots. Fetching high-priority pending requests from `bookings`. Fetching lab details from `labs`.");
            actualInputForCpp = {
                emptyTimeSlots: [ 
                    { labId: 1, date: "2024-09-05", timeSlotId: "ts_0900_1000", capacity: 30, type: "Computer" }, 
                    { labId: 3, date: "2024-09-05", timeSlotId: "ts_0900_1000", capacity: 25, type: "Physics" }
                ],
                pendingRequests: [ 
                    { reqId: 301, courseSection: "BIO101_Makeup", priority: 100, durationSlots: 1, requiredLabType: "Any", requiredCapacity: 15, facultyId: "F15", studentBatch: "Batch_B1" },
                    { reqId: 302, courseSection: "CS_Club_Practice", priority: 90, durationSlots: 1, requiredLabType: "Computer", requiredCapacity: 20, facultyId: "F16", studentBatch: "Batch_C1" }
                ],
                labs: [ 
                     { id: 1, name: "CS Lab 101", capacity: 30, type: "Computer" },
                     { id: 3, name: "Physics Lab Alpha", capacity: 25, type: "Physics" }
                ]
            };
            console.log("[Backend] Simulated input for C++ (Greedy Slot Filling):", JSON.stringify(actualInputForCpp, null, 2));
            console.log(`[Backend] Simulating call to C++ executable for Greedy slot filling...`);
            simulatedOutputFromCpp = {
                status: "success",
                summary: "Filled 1 empty slot using Greedy approach.",
                filledSlots: [ 
                    { requestId: 301, labId: 3, date: "2024-09-05", timeSlotId: "ts_0900_1000", filledByCourse: "BIO101_Makeup", facultyId: "F15", studentBatch: "Batch_B1" }
                ],
                remainingPendingRequests: [302] 
            };
            console.log("[Backend] Simulated output from C++ (Greedy Slot Filling):", JSON.stringify(simulatedOutputFromCpp, null, 2));
            console.log("[Backend] Simulating DB Update: For each entry in `filledSlots`, create a new entry in the `bookings` table with status 'booked'.");
            dbUpdateSummary = `Simulated: ${simulatedOutputFromCpp.filledSlots?.length || 0} empty slots filled.`;
            successMessage = `Greedy lab usage optimization simulated: ${dbUpdateSummary}`;

        } else if (algorithmName === 'assign-nearest-labs') { // Dijkstra's - DETAILED SIMULATION
            successMessage = `Dijkstra's nearest lab assignment process initiated.`;
            console.log("[Backend] Simulating: Preparing input for Dijkstra's Algorithm (Assign Nearest Labs)...");
            console.log("[Backend] Simulating: Fetching campus graph (nodes=locations, edges=paths with distances/times). Fetching user's department location (source node). Fetching list of currently available labs that meet basic criteria.");
            actualInputForCpp = {
                campusGraph: { 
                    nodes: [ {id: "CS_Dept"}, {id: "J1"}, {id: "L101_Loc"}, {id: "L102_Loc"} ], 
                    edges: [ {from: "CS_Dept", to: "J1", weight: 50}, {from: "J1", to: "L101_Loc", weight: 30}, {from: "J1", to: "L102_Loc", weight: 70} ]
                },
                sourceLocationNodeId: "CS_Dept", 
                targetLabLocations: [ // Mapping DB lab IDs to graph node IDs
                    {labDbId: 1, locationNodeId: "L101_Loc", name: "CS Lab 101"},
                    {labDbId: 2, locationNodeId: "L102_Loc", name: "CS Lab 102"}
                ] 
            };
            console.log("[Backend] Simulated input for C++ (Dijkstra):", JSON.stringify(actualInputForCpp, null, 2).substring(0,500)+"...");
            console.log(`[Backend] Simulating call to C++ executable for Dijkstra's algorithm...`);
            simulatedOutputFromCpp = {
                status: "success",
                summary: "Found nearest labs.",
                assignments: [ 
                    { labDbId: 1, name: "CS Lab 101", distance: 80, path: ["CS_Dept", "J1", "L101_Loc"] },
                    { labDbId: 2, name: "CS Lab 102", distance: 120, path: ["CS_Dept", "J1", "L102_Loc"] }
                ],
                recommendation: { labDbId: 1, name: "CS Lab 101" }
            };
            console.log("[Backend] Simulated output from C++ (Dijkstra):", JSON.stringify(simulatedOutputFromCpp, null, 2));
            console.log("[Backend] Simulating DB Update: This algorithm might not directly update bookings. Its output would be used by the booking system to SUGGEST the nearest lab or by an admin.");
            dbUpdateSummary = `Simulated: Nearest suitable lab is ${simulatedOutputFromCpp.recommendation?.name}.`;
            successMessage = `Dijkstra's nearest lab assignment simulated: ${dbUpdateSummary}`;

        } else {
            return res.status(400).json({ success: false, msg: `Algorithm '${algorithmName}' is not recognized.` });
        }

        if (!res.headersSent) { // Ensure response hasn't been sent by cppProcess.on('error')
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
        console.error(`[Backend] Error triggering algorithm ${algorithmName}:`, error.message, error.stack);
        if (!res.headersSent) {
            res.status(500).json({ 
                success: false, 
                message: `Server error while triggering ${algorithmName}. Details: ${error.message}`,
                algorithm: algorithmName,
                simulatedInputSentToCpp: actualInputForCpp, 
                simulatedOutputReceivedFromCpp: simulatedOutputFromCpp,
                simulatedDatabaseUpdateSummary: dbUpdateSummary || error.message 
            });
        }
    }
});


module.exports = router;
