
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, isAdmin, USER_ROLES } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');
const { spawn } = require('child_process'); // For DAA C++ integration simulation

// Reference time slots for DAA simulation input display.
// Matches the structure of MOCK_TIME_SLOTS in frontend constants.js and MOCK_TIME_SLOTS_BACKEND in bookingRoutes.js
// For DAA, providing displayTime might be useful if algorithms need to interpret user-friendly times.
const MOCK_TIME_SLOTS_BACKEND_REF = [
  { id: 'ts_0800_0950', startTime: '08:00:00', endTime: '09:50:00', displayTime: '08:00 AM - 09:50 AM' },
  { id: 'ts_1010_1205', startTime: '10:10:00', endTime: '12:05:00', displayTime: '10:10 AM - 12:05 PM' },
  { id: 'ts_1205_1350', startTime: '12:05:00', endTime: '13:50:00', displayTime: '12:05 PM - 01:50 PM' },
  { id: 'ts_1410_1605', startTime: '14:10:00', endTime: '16:05:00', displayTime: '02:10 PM - 04:05 PM' },
  { id: 'ts_1605_1750', startTime: '16:05:00', endTime: '17:50:00', displayTime: '04:05 PM - 05:50 PM' },
];


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
// @desc    Create a new user by Admin
// @access  Private (Admin)
router.post('/users', [auth, isAdmin], async (req, res) => {
    const { fullName, email, password, secretWord, role, department } = req.body;

    if (!fullName || !email || !password || !secretWord || !role) {
        return res.status(400).json({ msg: 'Please provide fullName, email, password, secretWord, and role.' });
    }
    if (password.length < 6) return res.status(400).json({ msg: 'Password must be at least 6 characters long.' });
    if (secretWord.length < 4) return res.status(400).json({ msg: 'Secret word must be at least 4 characters long.' });
    
    const validRoles = Object.values(USER_ROLES || {}); // Get valid roles from middleware or constants
    if (!validRoles.includes(role)) return res.status(400).json({ msg: 'Invalid role specified.' });

    try {
        // Check if user already exists
        let [users] = await pool.query('SELECT email FROM users WHERE email = ?', [email]);
        if (users.length > 0) return res.status(400).json({ msg: 'User already exists with this email.' });

        // Hash password and secret word
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const hashedSecretWord = await bcrypt.hash(secretWord, salt);

        const newUser = { fullName, email, passwordHash: hashedPassword, secretWordHash: hashedSecretWord, role, department: department || null };
        const [result] = await pool.query('INSERT INTO users SET ?', newUser);
        
        // Return the created user (excluding sensitive info)
        const [createdUser] = await pool.query('SELECT id, fullName, email, role, department FROM users WHERE id = ?', [result.insertId]);
        res.status(201).json(createdUser[0]);

    } catch (err) {
        console.error('Admin create user error:', err.message, err.stack);
        res.status(500).json({ msg: 'Server error during user creation by admin.' });
    }
});

// @route   PUT api/admin/users/:userId
// @desc    Update user details by Admin
// @access  Private (Admin)
router.put('/users/:userId', [auth, isAdmin], async (req, res) => {
    const { fullName, email, role, department } = req.body;
    const { userId } = req.params;

    // Ensure at least one field is provided for update
    if (fullName === undefined && email === undefined && role === undefined && department === undefined) {
        return res.status(400).json({ msg: 'At least one field (fullName, email, role, department) must be provided for update.' });
    }
     // Validate role if provided
     if (role) {
        const validRoles = Object.values(USER_ROLES || {});
        if (!validRoles.includes(role)) return res.status(400).json({ msg: 'Invalid role specified.' });
    }

    try {
        // Check if user exists
        const [existingUserResult] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (existingUserResult.length === 0) return res.status(404).json({ msg: 'User not found.' });
        const existingUser = existingUserResult[0];

        // If email is being changed, check if the new email is already in use by another account
        if (email && email !== existingUser.email) {
            const [emailCheck] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
            if (emailCheck.length > 0) return res.status(400).json({ msg: 'Email is already in use by another account.' });
        }

        // Construct update object with only provided fields
        const updatedFields = {
            fullName: fullName !== undefined ? fullName : existingUser.fullName,
            email: email !== undefined ? email : existingUser.email,
            role: role !== undefined ? role : existingUser.role,
            department: department !== undefined ? (department || null) : existingUser.department, // Allow unsetting department
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
// @desc    Delete a user by Admin
// @access  Private (Admin)
router.delete('/users/:userId', [auth, isAdmin], async (req, res) => {
    const { userId } = req.params;

    // Prevent admin from deleting their own account via this route
    if (String(req.user.id) === String(userId)) {
        return res.status(400).json({ msg: 'Admins cannot delete their own account through this interface.' });
    }

    try {
        const [userResult] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (userResult.length === 0) return res.status(404).json({ msg: 'User not found.' });

        // Proceed with deletion
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ msg: 'User deleted successfully by admin.' });
    } catch (err) {
        console.error('Admin delete user error:', err.message, err.stack);
        // Handle foreign key constraint errors (e.g., if user is referenced in bookings or sections)
        if (err.code === 'ER_ROW_IS_REFERENCED_2') { 
            return res.status(400).json({ msg: 'Cannot delete user. They are referenced in other parts of the system (e.g., sections, bookings). Please ensure all related records are handled first.' });
        }
        res.status(500).json({ msg: 'Server error while deleting user by admin.' });
    }
});

// @route   GET api/admin/requests/faculty
// @desc    Get faculty booking requests pending admin approval
// @access  Private (Admin)
router.get('/requests/faculty', [auth, isAdmin], async (req, res) => {
    try {
        const [facultyRequests] = await pool.query(`
            SELECT b.*, u.fullName as userName, u.email as userEmail, l.name as labName,
                   s.section_name as sectionName, crs.name as courseName
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            LEFT JOIN labs l ON b.labId = l.id
            LEFT JOIN sections s ON b.section_id = s.id
            LEFT JOIN courses crs ON s.course_id = crs.id
            WHERE b.status = 'pending-admin-approval' AND u.role = ?
            ORDER BY b.submittedDate ASC
        `, [USER_ROLES.FACULTY]); // Ensure we are only getting requests made by Faculty
        res.json(facultyRequests);
    } catch (err) {
        console.error('Error fetching faculty requests for admin:', err.message, err.stack);
        res.status(500).json({ msg: 'Server Error: Could not fetch faculty requests' });
    }
});

// @route   POST api/admin/algorithms/:algorithmName
// @desc    Trigger DAA algorithm simulation (Admin only)
// @access  Private (Admin)
router.post('/algorithms/:algorithmName', [auth, isAdmin], async (req, res) => {
    const { algorithmName } = req.params;
    
    let actualInputForCpp = {}; // To store the structured input for the C++ sim
    let simulatedOutputFromCpp = {}; // To store the structured output from the C++ sim
    let dbUpdateSummary = "No database changes simulated by algorithm.";
    let successMessage = `Algorithm '${algorithmName}' process initiated.`;
    let cppExecutablePath = ''; // Placeholder for the path to the conceptual C++ executable

    try {
        // Fetch necessary data from DB for algorithm input simulation
        const [labs] = await pool.query('SELECT * FROM labs');
        const [equipment] = await pool.query('SELECT * FROM equipment');
        const [courses] = await pool.query('SELECT * FROM courses');
        const [sections] = await pool.query('SELECT s.*, c.name as courseName FROM sections s JOIN courses c ON s.course_id = c.id');
        const [bookings] = await pool.query(`
            SELECT b.*, u.fullName as userName, u.role as userRole, 
                   sec.section_name as sectionName, crs.name as courseName
            FROM bookings b 
            JOIN users u ON b.user_id = u.id
            LEFT JOIN sections sec ON b.section_id = sec.id
            LEFT JOIN courses crs ON sec.course_id = crs.id
        `);
        const [facultyUsers] = await pool.query("SELECT id, fullName, department FROM users WHERE role = 'Faculty'");

        // Prepare input based on the algorithmName from PRD
        if (algorithmName === 'run-scheduling') { // Graph Coloring
            cppExecutablePath = './cpp_algorithms/scheduler'; // Conceptual path
            successMessage = `Graph Coloring scheduling process initiated.`;
            actualInputForCpp = {
                description: "Input for Graph Coloring: Schedule lab sessions for course sections to avoid time conflicts among labs or for faculty teaching multiple sections.",
                labs: labs.map(l => ({ id: l.id, name: l.name, capacity: l.capacity })),
                sections: sections.map(s => ({ id: s.id, name: s.section_name, course: s.courseName, facultyId: s.faculty_user_id })),
                bookingRequests: bookings.filter(b => b.status === 'pending-admin-approval' || b.status === 'pending').map(b => ({ // Sections needing lab time
                    requestId: b.id, sectionId: b.section_id, sectionName: b.sectionName, courseName: b.courseName,
                    labId: b.labId, date: b.date, timeSlotId: b.timeSlotId, 
                    purpose: b.purpose, userId: b.user_id
                })),
                existingBookings: bookings.filter(b => b.status === 'booked').map(b => ({
                    bookingId: b.id, sectionId: b.section_id, labId: b.labId, date: b.date, timeSlotId: b.timeSlotId, startTime: b.start_time, endTime: b.end_time
                })),
                timeSlots: MOCK_TIME_SLOTS_BACKEND_REF.map(ts => ({id: ts.id, display: ts.displayTime, startTime: ts.startTime, endTime: ts.endTime})),
                // Mock faculty availability for conceptual input (PRD mention)
                facultyAvailability: facultyUsers.reduce((acc, fac) => { 
                    acc[fac.id] = MOCK_TIME_SLOTS_BACKEND_REF.slice(0, Math.floor(MOCK_TIME_SLOTS_BACKEND_REF.length / 2)).map(ts => ts.id);
                    return acc;
                }, {})
            };
            simulatedOutputFromCpp = { 
                status: "success", // This will be updated by spawn logic
                summary: "Generated conflict-free schedule for X sections, assigning time slots and labs (colors).",
                assignedSchedule: [ { sectionId: "S101", labId: "L1", date: "2024-10-01", timeSlotId: "ts_0800_0950", notes: "Scheduled by Graph Coloring" } ],
                unscheduledSections: [ { sectionId: "S102", reason: "No available conflict-free slot with faculty availability." } ]
            };
            dbUpdateSummary = `DB Update SIMULATED (Graph Coloring): X bookings would be updated to 'booked' status with assigned times/labs. Y requests marked as unschedulable.`;
            
        } else if (algorithmName === 'run-resource-allocation') { // 0/1 Knapsack
            cppExecutablePath = './cpp_algorithms/knapsack_allocator';
            successMessage = `0/1 Knapsack resource allocation process initiated.`;
            actualInputForCpp = {
                description: "Input for 0/1 Knapsack: Allocate scarce lab equipment to booking requests (associated with sections/courses), maximizing total priority or utility.",
                scarceResources: equipment.filter(e => e.status === 'available' && (e.type.includes('Advanced') || e.type.includes('Specialized'))).map(e => ({
                    resourceId: e.id, resourceType: e.type, availableUnits: 1, // Conceptual: assuming 1 unit per scarce item
                })),
                bookingRequests: bookings.filter(b => b.equipmentIds && JSON.parse(b.equipmentIds).length > 0 && (b.status === 'pending-admin-approval' || b.status === 'pending')).map(b => ({
                    bookingId: b.id, sectionId: b.section_id, sectionName: b.sectionName,
                    priorityValue: (b.purpose.toLowerCase().includes('research') ? 10 : (b.purpose.toLowerCase().includes('final year') ? 8 : 5)), 
                    needs: JSON.parse(b.equipmentIds).map(eqId => ({ resourceId: eqId, units: 1 })) // Conceptual
                }))
            };
            simulatedOutputFromCpp = {
                status: "success",
                summary: "Optimally allocated scarce resources to X booking requests, maximizing total priority.",
                resourceAllocations: [ { bookingId: "B201", allocatedResources: [{resourceId: "EQ5", unitsAllocated: 1}] } ],
                unallocatedRequests: [ { bookingId: "B202", reason: "Insufficient units of resource EQ6." } ]
            };
            dbUpdateSummary = `DB Update SIMULATED (Knapsack): For X bookings, equipment assignments in booking records would be updated. Y requests could not be fully resourced.`;

        } else if (algorithmName === 'optimize-lab-usage') { // Greedy Algorithm
             cppExecutablePath = './cpp_algorithms/greedy_filler';
             successMessage = `Greedy lab usage optimization process initiated.`;
            actualInputForCpp = {
                description: "Input for Greedy Algorithm: Fill free lab slots or seats efficiently with smaller pending bookings (for sections) or tasks.",
                allLabs: labs.map(l => ({id: l.id, name: l.name, capacity: l.capacity})),
                allTimeSlots: MOCK_TIME_SLOTS_BACKEND_REF,
                existingBookings: bookings.filter(b => b.status === 'booked').map(b => ({ labId: b.labId, date: b.date, timeSlotId: b.timeSlotId, startTime: b.start_time, endTime: b.end_time })),
                pendingBookingsOrTasks: bookings.filter(b => b.status === 'pending-admin-approval' || b.status === 'pending').map(b => ({
                    bookingId: b.id, sectionId: b.section_id, sectionName: b.sectionName,
                    priority: 5, // Example priority
                    durationSlots: 1, // Assuming 1 slot duration
                    requiredLabType: null, 
                    requiredCapacity: sections.find(s => s.id === b.section_id)?.capacity || 15 // Mock capacity
                }))
                // Conceptual: C++ layer would identify free slots based on above data.
            };
            simulatedOutputFromCpp = {
                status: "success",
                summary: "Filled Z empty slots with pending bookings/tasks using a Greedy approach.",
                filledSlotsAssignments: [ { bookingId: "B301", assignedLabId: "L2", assignedDate: "2024-10-02", assignedTimeSlotId: "ts_1010_1205" } ],
                remainingPendingBookingsOrTasks: [ { bookingId: "B302", reason: "No suitable gap found." } ]
            };
            dbUpdateSummary = `DB Update SIMULATED (Greedy): For Z filled slots, new booking records would be created or existing pending ones updated to 'booked'.`;

        } else if (algorithmName === 'assign-nearest-labs') { // Dijkstra's
            cppExecutablePath = './cpp_algorithms/dijkstra_planner';
            successMessage = `Dijkstra's nearest lab assignment process initiated.`;
            actualInputForCpp = {
                description: "Input for Dijkstra's: Assign labs nearest to a faculty's department or a section's primary location for convenience.",
                // Simplified graph: Nodes = department locations, labs; Edges = conceptual distances
                campusLayoutGraph: { 
                    nodes: [
                        ...facultyUsers.map(f => ({ id: `faculty_${f.id}_loc`, type: 'faculty_location', name: f.fullName, department: f.department || 'UnknownDept' })),
                        ...labs.map(l => ({ id: `lab_${l.id}`, type: 'lab', name: l.name, locationBuilding: l.location }))
                    ],
                    // Conceptual: Edges with distances would be part of this graph if it were fully defined.
                    // e.g., {from: 'faculty_F1_loc', to: 'lab_L1', distance: 100}
                    edges: [ 
                        {from: `faculty_${facultyUsers[0]?.id}_loc`, to: `lab_${labs[0]?.id}`, distance: 100}, 
                        {from: `faculty_${facultyUsers[0]?.id}_loc`, to: `lab_${labs[1]?.id}`, distance: 500}
                     ] 
                },
                requestsToAssignLab: bookings.filter(b => (b.status === 'pending-admin-approval' || b.status === 'pending') && !b.labId).map(b => ({
                    bookingId: b.id, sectionId: b.section_id, sectionName: b.sectionName,
                    facultyUserId: sections.find(s => s.id === b.section_id)?.faculty_user_id,
                })),
                availableLabs: labs.filter(l => /* some availability check if needed */ true).map(l => ({labDatabaseId: l.id, name: l.name, locationNodeId: `lab_${l.id}`})) 
            };
            simulatedOutputFromCpp = {
                status: "success",
                summary: "Found nearest available labs for K requests based on Dijkstra's.",
                nearestLabSuggestions: [ { bookingId: "B401", suggestedLabId: "L1", distance: 100, path: ["faculty_F1_loc", "...", "lab_L1"] } ],
            };
            dbUpdateSummary = `Result SIMULATED (Dijkstra's): For K bookings, a labId would be suggested/assigned. No direct DB update unless suggestions are applied.`;
        } else {
            return res.status(400).json({ success: false, msg: `Algorithm '${algorithmName}' is not recognized.` });
        }
        
        // Simulate calling the C++ process
        await new Promise((resolve, reject) => {
            const cppProcess = spawn(cppExecutablePath, []); // Pass arguments if C++ program expects them
            let cppOutput = '';
            let cppErrorOutput = '';

            cppProcess.on('error', (err) => { 
                // This event is emitted if the process could not be spawned, or killed.
                console.error(`[Backend] Failed to start C++ process for ${algorithmName}. Error: ${err.message}. Path: '${cppExecutablePath}'`);
                simulatedOutputFromCpp.status = "error_spawning_cpp";
                simulatedOutputFromCpp.summary = `Failed to start C++ process for ${algorithmName}. Error: ${err.message}. Path: '${cppExecutablePath}'. This is a simulation; the C++ program was not actually run.`;
                resolve(); // Resolve the promise even on error to send response
            });

            // Check if process actually spawned
            if (!cppProcess.pid && !cppProcess.killed) { // .killed is for when process is killed by signal before 'exit'
                if (simulatedOutputFromCpp.status !== "error_spawning_cpp") { // Ensure error from 'on error' isn't overwritten
                    simulatedOutputFromCpp.status = "error_spawning_cpp_unknown";
                    simulatedOutputFromCpp.summary = `C++ process for ${algorithmName} did not spawn correctly (no PID).`;
                }
                resolve(); return; // Don't proceed if spawn failed
            }
            
            // Write input to C++ stdin
            if (cppProcess.stdin) {
                 cppProcess.stdin.write(JSON.stringify(actualInputForCpp));
                 cppProcess.stdin.end();
            } else {
                 // This case should ideally be caught by 'error' if stdin is truly unavailable on a spawned process
                 if (simulatedOutputFromCpp.status !== "error_spawning_cpp") {
                    simulatedOutputFromCpp.status = "error_spawning_cpp_stdin";
                    simulatedOutputFromCpp.summary = "Failed to get stdin for C++ process. This usually indicates a spawn failure.";
                 }
                 resolve(); return; 
            }

            // Listen for output
            if(cppProcess.stdout) cppProcess.stdout.on('data', (data) => { cppOutput += data.toString(); });
            if(cppProcess.stderr) cppProcess.stderr.on('data', (data) => { cppErrorOutput += data.toString(); console.error(`[C++ Stderr for ${algorithmName}]: ${data}`); });
            
            cppProcess.on('close', (code) => {
                // Ensure status from 'error' event isn't overwritten if it already captured a spawn failure
                if (simulatedOutputFromCpp.status && simulatedOutputFromCpp.status.startsWith("error_spawning")) {
                    resolve(); return;
                }

                if (cppErrorOutput) console.error(`[Backend] C++ process for ${algorithmName} emitted errors to stderr (may or may not be fatal).`);

                if (code === 0 && cppOutput.trim() !== '') { // Successful execution with output
                    // In a real scenario, parse cppOutput to populate simulatedOutputFromCpp
                    simulatedOutputFromCpp.status = "success_cpp_executed_simulated_result"; // Keep predefined result for now
                    // For a real integration: try { simulatedOutputFromCpp = JSON.parse(cppOutput); } catch (e) { simulatedOutputFromCpp.summary = "Error parsing C++ output"; simulatedOutputFromCpp.rawOutput = cppOutput; }
                } else if (code !== 0) { // C++ process exited with an error code
                    simulatedOutputFromCpp.status = "error_cpp_exit_code";
                    simulatedOutputFromCpp.summary = `C++ process for ${algorithmName} failed with exit code ${code}. Stderr: ${cppErrorOutput || 'N/A'}. Stdout: ${cppOutput || 'N/A'}.`;
                } else { // C++ process exited successfully but no output (or only whitespace)
                    simulatedOutputFromCpp.status = "success_cpp_no_output";
                    simulatedOutputFromCpp.summary = `C++ process for ${algorithmName} ran (exit code 0) but no stdout. Using predefined simulation result.`;
                }
                resolve(); // Resolve the promise after process closes
            });
        }); 

        // Send response back to client
        if (!res.headersSent) { // Ensure response is only sent once
            res.json({
                success: true, message: successMessage, algorithm: algorithmName,
                simulatedInputSentToCpp: actualInputForCpp, 
                simulatedOutputReceivedFromCpp: simulatedOutputFromCpp, 
                simulatedDatabaseUpdateSummary: dbUpdateSummary
            });
        }
    } catch (error) { // Catch errors from DB queries or other synchronous code in the try block
        console.error(`[Backend] General error in algorithm trigger for ${algorithmName}:`, error.message, error.stack);
        if (!res.headersSent) {
            res.status(500).json({ 
                success: false, message: `Server error: ${error.message}`, algorithm: algorithmName,
                simulatedInputSentToCpp: actualInputForCpp, // May or may not be populated
                simulatedOutputReceivedFromCpp: { status: "error_server_handler", summary: `Server error: ${error.message}`, ...simulatedOutputFromCpp },
                simulatedDatabaseUpdateSummary: dbUpdateSummary || `Error before DB simulation: ${error.message}` 
            });
        }
    }
});

// @route   GET api/admin/system-activity
// @desc    Get mock system activity logs (Admin only)
// @access  Private (Admin)
router.get('/system-activity', [auth, isAdmin], (req, res) => {
    const mockLogs = [
        { timestamp: new Date(Date.now() - 7200000).toISOString(), user: 'admin@example.com', action: 'Course Created', details: 'Created new course "CS101 - Intro to Programming"' },
        { timestamp: new Date(Date.now() - 7000000).toISOString(), user: 'admin@example.com', action: 'Section Created', details: 'Created section "CS101 - Section A" for course CS101, assigned to faculty@example.com' },
        { timestamp: new Date(Date.now() - 3600000).toISOString(), user: 'admin@example.com', action: 'User Logged In', details: 'Successful login for admin@example.com from IP 192.168.1.10' },
        { timestamp: new Date(Date.now() - 2400000).toISOString(), user: 'faculty@example.com', action: 'Booking Conflict - Admin Review', details: 'Faculty requested Lab A for CS101-SecA on 2024-09-10, 10:10 AM; slot was taken. Request pending admin approval.' },
        { timestamp: new Date(Date.now() - 1800000).toISOString(), user: 'admin@example.com', action: 'Lab Updated', details: 'Updated capacity for CS Lab 101 to 35' },
        { timestamp: new Date(Date.now() - 900000).toISOString(), user: 'assistant@example.com', action: 'Seat Status Updated', details: 'Marked seat #5 in Electronics Lab as "not-working".' },
        { timestamp: new Date(Date.now() - 600000).toISOString(), user: 'faculty@example.com', action: 'Booking Created (Auto-Approved)', details: 'Booked Lab B for PHY202-SecB on 2024-09-11, 02:10 PM' },
        { timestamp: new Date(Date.now() - 300000).toISOString(), user: 'admin@example.com', action: 'Algorithm Triggered (Simulated)', details: 'Ran run-scheduling (Graph Coloring) algorithm simulation.' },
        { timestamp: new Date().toISOString(), user: 'admin@example.com', action: 'Viewed System Activity', details: 'Accessed the system activity log.' }
    ];
    // Sort logs by timestamp descending before sending
    res.json(mockLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
});


module.exports = router;
    
