
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
// @desc    Admin updates a user's details (excluding password and secret word)
// @access  Private (Admin)
router.put('/users/:userId', [auth, isAdmin], async (req, res) => {
    const { fullName, email, role, department } = req.body;
    const { userId } = req.params;

    if (fullName === undefined && email === undefined && role === undefined && department === undefined) {
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

    if (String(req.user.id) === String(userId)) {
        return res.status(400).json({ msg: 'Admins cannot delete their own account through this interface.' });
    }

    try {
        const [userResult] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (userResult.length === 0) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ msg: 'User deleted successfully by admin.' });

    } catch (err) {
        console.error('Admin delete user error:', err.message, err.stack);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') { 
            return res.status(400).json({ msg: 'Cannot delete user. They are referenced in other parts of the system (e.g., bookings). Please ensure all related records are handled first or check database cascade settings.' });
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
        `, [USER_ROLES.FACULTY]);
        res.json(facultyRequests);
    } catch (err) {
        console.error('Error fetching faculty requests for admin:', err.message, err.stack);
        res.status(500).json({ msg: 'Server Error: Could not fetch faculty requests' });
    }
});

// System Activity Logs and Assistant Requests routes were removed.


// --- DAA Algorithm Triggers (Simulation & Integration Point) ---
const MOCK_TIME_SLOTS_FROM_CONSTANTS_OR_DB = [ 
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
    const { inputPayload } = req.body; 

    console.log(`[Backend] Admin ${req.user.email} triggered algorithm: ${algorithmName}`);
    
    let actualInputForCpp = {};
    let simulatedOutputFromCpp = {}; 
    let dbUpdateSummary = "No database changes simulated by algorithm.";
    let successMessage = `Algorithm '${algorithmName}' process initiated.`;

    try {
        if (algorithmName === 'run-scheduling') { // Graph Coloring - ACTUAL INTEGRATION EXAMPLE
            successMessage = `Graph Coloring scheduling process initiated.`;
            console.log("[Backend] Preparing input for C++ Graph Coloring (Scheduling)...");
            
            console.log("[Backend] SIMULATING: Fetching labs (id, name, capacity, type), all pending booking requests (courseSection, facultyId, studentBatch, durationSlots, preferredLabId, requiredLabType, requestedEquipment list), faculty availability (facultyId, list of available timeSlotIds), and predefined time slots (id, startTime, endTime).");
            // CRITICAL CONSTRAINTS FOR C++ GRAPH COLORING (to be enforced by C++):
            // 1. Faculty Consistency: All lab sessions for a specific course section (e.g., "CS101_SecA") must be assigned to the same faculty member.
            // 2. Distinct Section Schedules: Different sections of the same course (e.g., "CS101_SecA" vs "CS101_SecB") are separate scheduling entities and must have their own timetables. They can only overlap if using different resources (labs, faculty).
            // 3. Student Batch Non-Concurrency: Students in a specific batch (e.g., "Batch_A1") cannot attend two different labs simultaneously.
            // 4. Lab Capacity: Number of students in a batch must not exceed lab capacity.
            // 5. Resource Availability: Lab must have the type/equipment required by the session.
            // 6. Faculty Availability: Session must align with the assigned faculty's available time slots.

            const [labsData] = await pool.query("SELECT id, name, capacity, location, roomNumber FROM labs"); 
            const [bookingRequestsData] = await pool.query( 
                `SELECT 
                    b.id as requestId, b.purpose, b.requestedByRole, b.batchIdentifier, b.userId as facultyUserId, 
                    u.fullName as facultyName,
                    b.labId as preferredLabId, l_pref.name as preferredLabName,
                    b.equipmentIds as requestedEquipmentIds 
                 FROM bookings b
                 JOIN users u ON b.userId = u.id
                 LEFT JOIN labs l_pref ON b.labId = l_pref.id
                 WHERE b.status IN ('pending', 'pending-admin-approval')` 
            );
            const timeSlots = MOCK_TIME_SLOTS_FROM_CONSTANTS_OR_DB; // Or fetch from DB if dynamic

            actualInputForCpp = {
                labs: labsData.map(lab => ({ id: lab.id, name: lab.name, capacity: lab.capacity, type: "General" /* TODO: Add lab_type to labs table */ })),
                labSessionRequests: bookingRequestsData.map(req => ({
                    requestId: req.requestId,
                    courseSection: req.batchIdentifier || `Req_${req.requestId}_Course`, 
                    facultyId: `F${req.facultyUserId}`, // Example: ensure consistent faculty ID format
                    studentBatch: req.batchIdentifier || `Req_${req.requestId}_Batch`,
                    durationSlots: 1, // Example: C++ needs to handle multi-slot sessions if needed
                    preferredLabId: req.preferredLabId,
                    requiredLabType: "General", // Example: C++ matches this with lab types
                    requiredEquipment: req.requestedEquipmentIds ? JSON.parse(req.requestedEquipmentIds).map(id => `EQ${id}`) : [], // Example equipment ID format
                })),
                timeSlots: timeSlots.map(ts => ({id: ts.id, display: ts.displayTime, startTime: ts.startTime, endTime: ts.endTime})),
                facultyAvailability: { // Example: This would be fetched from DB (faculty_availability table)
                    "F10": ["ts_0900_1000", "ts_1000_1100", "ts_1100_1200", "ts_1400_1500"], // Faculty UserID 10
                    "F11": ["ts_1300_1400", "ts_1400_1500"], // Faculty UserID 11
                    // ... for all relevant faculty
                },
            };
            console.log("[Backend] Data fetched and prepared for C++ (Graph Coloring Scheduling). First 500 chars of input:", JSON.stringify(actualInputForCpp, null, 2).substring(0, 500) + "...");

            const cppExecutablePath = './cpp_algorithms/scheduler'; //  &lt;-- YOU MUST PROVIDE THIS PATH &amp; ENSURE EXECUTABLE
            console.log(`[Backend] Attempting to spawn C++ process: ${cppExecutablePath}. Ensure this executable exists and has execution permissions.`);
            
            const cppProcess = spawn(cppExecutablePath, []); 

            let cppOutput = '';
            let cppErrorOutput = '';

            cppProcess.on('error', (err) => {
                console.error(`[Backend] Failed to start C++ process for ${algorithmName}. Error: ${err.message}. Path: '${cppExecutablePath}'`);
                dbUpdateSummary = `Failed to start C++ process (path: '${cppExecutablePath}' not found or not executable). Check backend console.`;
                if (!res.headersSent) {
                     return res.status(500).json({
                        success: false,
                        message: `Failed to start C++ process for ${algorithmName}. Path: '${cppExecutablePath}'. Details: ${err.message}`,
                        algorithm: algorithmName,
                        simulatedInputSentToCpp: actualInputForCpp, // Keep using 'simulated' for frontend key consistency
                        simulatedOutputReceivedFromCpp: {},
                        simulatedDatabaseUpdateSummary: dbUpdateSummary
                    });
                }
            });

            if (!res.headersSent) { 
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
                                // Example: actualScheduleFromCpp = {
                                //   newlyScheduledBookings: [
                                //     { requestId: 1, courseSection: "CS101_SecA", assignedLabId: 1, assignedDate: "2024-09-02", assignedTimeSlotId: "ts_0900_1000", facultyId: "F10", studentBatch: "Batch_A1", purpose: "Scheduled: CS101_SecA (L1)"},
                                //     // ... more sessions ensuring faculty consistency for CS101_SecA
                                //   ],
                                //   unscheduledRequests: [ { requestId: 2, reason: "No suitable slot with faculty F10" } ]
                                // }
                                console.log("[Backend] Parsed output from C++ (Graph Coloring):", JSON.stringify(actualScheduleFromCpp, null, 2));
                                
                                console.log("[Backend] Updating database with results from C++...");
                                let scheduledCount = 0;
                                let unscheduledCount = 0;
                                const connection = await pool.getConnection(); // For transaction
                                try {
                                    await connection.beginTransaction();
                                    if (actualScheduleFromCpp.newlyScheduledBookings && Array.isArray(actualScheduleFromCpp.newlyScheduledBookings)) {
                                        for (const session of actualScheduleFromCpp.newlyScheduledBookings) {
                                          // Assuming facultyId from C++ is like "F10", need to parse to actual userId
                                          const actualFacultyUserId = parseInt(String(session.facultyId).replace('F',''));
                                          
                                          // Example: Update original request or create new booking
                                          // This logic depends heavily on how your system manages requests vs. confirmed bookings
                                          await connection.query(
                                              'UPDATE bookings SET labId = ?, date = ?, timeSlotId = ?, status = ?, purpose = ?, userId = ? WHERE id = ?',
                                              [session.assignedLabId, session.assignedDate, session.assignedTimeSlotId, 'booked', session.purpose || `Scheduled: ${session.courseSection}`, actualFacultyUserId, session.requestId]
                                          );
                                          // OR, if requests are separate from bookings:
                                          // await connection.query(
                                          //     'INSERT INTO bookings (labId, userId, date, timeSlotId, status, purpose, requestedByRole, batchIdentifier) VALUES (?, ?, ?, ?, "booked", ?, ?, ?)',
                                          //     [session.assignedLabId, actualFacultyUserId, session.assignedDate, session.assignedTimeSlotId, session.purpose || `Scheduled: ${session.courseSection}`, USER_ROLES.FACULTY, session.studentBatch]
                                          // );
                                          // await connection.query("UPDATE original_requests SET status = 'fulfilled' WHERE id = ?", [session.requestId]);
                                          scheduledCount++;
                                        }
                                    }
                                    if (actualScheduleFromCpp.unscheduledRequests && Array.isArray(actualScheduleFromCpp.unscheduledRequests)) {
                                       for (const req of actualScheduleFromCpp.unscheduledRequests) {
                                          await connection.query("UPDATE bookings SET status = 'scheduling_failed', purpose = CONCAT(IFNULL(purpose,''), ' - Algorithm Reason: ', ?) WHERE id = ?", [req.reason, req.requestId]);
                                          unscheduledCount++;
                                       }
                                    }
                                    await connection.commit();
                                    dbUpdateSummary = `DB Update: ${scheduledCount} sessions booked/updated. ${unscheduledCount} requests marked as unscheduled/failed.`;
                                } catch (dbErr) {
                                    await connection.rollback();
                                    console.error("[Backend] DB transaction error during C++ schedule update:", dbErr);
                                    dbUpdateSummary = `DB Update FAILED after C++ execution: ${dbErr.message}`;
                                    throw dbErr; // Propagate error to outer catch
                                } finally {
                                    connection.release();
                                }
                                successMessage = `Graph Coloring algorithm executed. ${dbUpdateSummary}`;
                                simulatedOutputFromCpp = actualScheduleFromCpp; // Store actual output
                                resolve();
                            } catch (parseOrDbError) {
                                console.error(`[Backend] Error processing output or updating DB for ${algorithmName}:`, parseOrDbError, "Raw C++ output:", cppOutput);
                                dbUpdateSummary = `C++ process ran, but output was not valid JSON or DB update failed. Details: ${parseOrDbError.message}. Raw C++ output (first 500 chars): ${cppOutput.substring(0,500)}...`;
                                reject(new Error(dbUpdateSummary));
                            }
                        } else if (code !== 0) {
                            dbUpdateSummary = `C++ process for ${algorithmName} failed with exit code ${code}. Stderr: ${cppErrorOutput || 'No stderr output'}. Stdout: ${cppOutput || 'No stdout output'}.`;
                            reject(new Error(dbUpdateSummary));
                        } else { 
                             dbUpdateSummary = `C++ process for ${algorithmName} ran successfully but produced no output or empty output. Check C++ program logic.`;
                             simulatedOutputFromCpp = { message: "C++ process produced no output." };
                             resolve(); 
                        }
                    });
                });
            } 

        } else if (algorithmName === 'run-resource-allocation') { // 0/1 Knapsack
            successMessage = `0/1 Knapsack resource allocation process SIMULATED.`;
            console.log("[Backend] Simulating: Preparing input for 0/1 Knapsack (Resource Allocation)...");
            
            console.log("[Backend] SIMULATING: Fetching scarce equipment types (e.g., 'AdvancedOscilloscopeType') by querying `equipment` table (e.g., SELECT type, COUNT(*) as availableUnits FROM equipment WHERE status='available' AND type IN ('AdvancedOscilloscopeType', 'SpectrometerXYZType') GROUP BY type).");
            console.log("[Backend] SIMULATING: Fetching booked/pending lab sessions from `bookings` that need these scarce resources, including their priority/value and quantity of each type needed (e.g., 'Session A needs 2 AdvancedOscilloscopeType'). This 'need' might come from course definitions or expanded booking request data.");
            
            actualInputForCpp = {
                scarceResources: [ 
                    { resourceType: "AdvancedOscilloscopeType", availableUnits: 3 }, 
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
            
            console.log("[Backend] SIMULATING DB Update: For each session in `allocatedSessions`, update `bookings.equipmentIds` with actual `assignedInstanceIds` (fetched from `equipment` table based on type and availability). For `unallocatedSessions`, update their status or notify.");
            dbUpdateSummary = `Simulated: ${simulatedOutputFromCpp.allocatedSessions?.length || 0} sessions allocated scarce resources. ${simulatedOutputFromCpp.unallocatedSessions?.length || 0} sessions could not be fully resourced.`;

        } else if (algorithmName === 'optimize-lab-usage') { // Greedy Algorithm
             successMessage = `Greedy lab usage optimization process SIMULATED.`;
            console.log("[Backend] Simulating: Preparing input for Greedy Algorithm (Optimize Lab Usage/Fill Gaps)...");
            console.log("[Backend] SIMULATING: Fetching current lab schedule from `bookings` to identify empty slots. Fetching high-priority pending requests from `bookings`. Fetching lab details from `labs`.");
            actualInputForCpp = {
                emptyTimeSlots: [ 
                    { labId: 1, labName: "CS Lab 101", date: "2024-09-05", timeSlotId: "ts_0900_1000", capacity: 30, type: "Computer" }, 
                    { labId: 3, labName: "Physics Lab Alpha", date: "2024-09-05", timeSlotId: "ts_1100_1200", capacity: 25, type: "Physics" }
                ],
                pendingRequests: [ 
                    { reqId: 301, courseSection: "BIO101_Makeup", priority: 100, durationSlots: 1, requiredLabType: "Any", requiredCapacity: 15, facultyId: "F15", studentBatch: "Batch_G1" },
                    { reqId: 302, courseSection: "CS_Club_Practice", priority: 90, durationSlots: 1, requiredLabType: "Computer", requiredCapacity: 20, facultyId: "F16", studentBatch: "Batch_G2" }
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
                    { requestId: 301, assignedLabId: 1, assignedDate: "2024-09-05", assignedTimeSlotId: "ts_0900_1000", filledByCourse: "BIO101_Makeup", facultyId: "F15", studentBatch: "Batch_G1" }
                ],
                remainingPendingRequests: [302] 
            };
            console.log("[Backend] Simulated output from C++ (Greedy Slot Filling):", JSON.stringify(simulatedOutputFromCpp, null, 2));
            console.log("[Backend] SIMULATING DB Update: For each entry in `filledSlots`, create a new entry in the `bookings` table with status 'booked'.");
            dbUpdateSummary = `Simulated: ${simulatedOutputFromCpp.filledSlots?.length || 0} empty slots filled.`;

        } else if (algorithmName === 'assign-nearest-labs') { // Dijkstra's
            successMessage = `Dijkstra's nearest lab assignment process SIMULATED.`;
            console.log("[Backend] Simulating: Preparing input for Dijkstra's Algorithm (Assign Nearest Labs)...");
            console.log("[Backend] SIMULATING: Fetching campus graph (nodes=locations, edges=paths with distances/times) from DB or config. Fetching user's department location (source node). Fetching list of currently available labs that meet basic criteria (type, capacity) from `labs` and `bookings`.");
            actualInputForCpp = {
                campusGraph: { 
                    nodes: [ {id: "CS_Dept_Loc"}, {id: "Junction1"}, {id: "Lab101_Loc"}, {id: "Lab102_Loc"}, {id: "Physics_Dept_Loc"}, {id: "Lab205_Loc"} ], 
                    edges: [ 
                        {from: "CS_Dept_Loc", to: "Junction1", weight: 50}, {from: "Junction1", to: "Lab101_Loc", weight: 30}, 
                        {from: "Junction1", to: "Lab102_Loc", weight: 70}, {from: "Physics_Dept_Loc", to: "Junction1", weight: 60},
                        {from: "Physics_Dept_Loc", to: "Lab205_Loc", weight: 20}
                    ]
                },
                sourceLocationNodeId: "CS_Dept_Loc", 
                targetLabLocations: [ 
                    {labDbId: 1, name: "CS Lab 101", locationNodeId: "Lab101_Loc"},
                    {labDbId: 2, name: "CS Lab 102", locationNodeId: "Lab102_Loc"},
                    {labDbId: 5, name: "Physics Lab Beta (overflow)", locationNodeId: "Lab205_Loc"}
                ] 
            };
            console.log("[Backend] Simulated input for C++ (Dijkstra):", JSON.stringify(actualInputForCpp, null, 2).substring(0,500)+"...");
            console.log(`[Backend] Simulating call to C++ executable for Dijkstra's algorithm...`);
            simulatedOutputFromCpp = {
                status: "success",
                summary: "Found nearest labs from source 'CS_Dept_Loc'.",
                shortestPaths: [ 
                    { labDbId: 1, name: "CS Lab 101", distance: 80, path: ["CS_Dept_Loc", "Junction1", "Lab101_Loc"] },
                    { labDbId: 2, name: "CS Lab 102", distance: 120, path: ["CS_Dept_Loc", "Junction1", "Lab102_Loc"] },
                    { labDbId: 5, name: "Physics Lab Beta (overflow)", distance: 130, path: ["CS_Dept_Loc", "Junction1", "Physics_Dept_Loc", "Lab205_Loc"] }
                ],
                recommendation: { labDbId: 1, name: "CS Lab 101" } 
            };
            console.log("[Backend] Simulated output from C++ (Dijkstra):", JSON.stringify(simulatedOutputFromCpp, null, 2));
            console.log("[Backend] SIMULATING Usage: This algorithm's output would be used by the booking system to SUGGEST the nearest lab or by an admin for manual assignment.");
            dbUpdateSummary = `Simulated: Nearest suitable lab is ${simulatedOutputFromCpp.recommendation?.name} (Distance: ${simulatedOutputFromCpp.shortestPaths?.find(p => p.labDbId === simulatedOutputFromCpp.recommendation?.labDbId)?.distance}).`;

        } else {
            return res.status(400).json({ success: false, msg: `Algorithm '${algorithmName}' is not recognized.` });
        }

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
        console.error(`[Backend] Error in algorithm trigger for ${algorithmName}:`, error.message, error.stack);
        if (!res.headersSent) {
            res.status(500).json({ 
                success: false, 
                message: `Server error during ${algorithmName} processing. Details: ${error.message}`,
                algorithm: algorithmName,
                simulatedInputSentToCpp: actualInputForCpp, 
                simulatedOutputReceivedFromCpp: simulatedOutputFromCpp, // Send whatever was populated before error
                simulatedDatabaseUpdateSummary: dbUpdateSummary || `Error occurred: ${error.message}` 
            });
        }
    }
});


module.exports = router;
