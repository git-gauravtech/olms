
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, isAdmin, USER_ROLES } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');
const { spawn } = require('child_process'); 

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

router.get('/users', [auth, isAdmin], async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, fullName, email, role, department FROM users ORDER BY fullName ASC');
        res.json(users);
    } catch (err) {
        console.error('Error fetching users (admin):', err.message);
        res.status(500).send('Server Error: Could not fetch users');
    }
});

router.post('/users', [auth, isAdmin], async (req, res) => {
    const { fullName, email, password, secretWord, role, department } = req.body;

    if (!fullName || !email || !password || !secretWord || !role) {
        return res.status(400).json({ msg: 'Please provide fullName, email, password, secretWord, and role.' });
    }
    if (password.length < 6) return res.status(400).json({ msg: 'Password must be at least 6 characters long.' });
    if (secretWord.length < 4) return res.status(400).json({ msg: 'Secret word must be at least 4 characters long.' });
    
    const validRoles = Object.values(USER_ROLES || {}); 
    if (!validRoles.includes(role)) return res.status(400).json({ msg: 'Invalid role specified.' });

    try {
        let [users] = await pool.query('SELECT email FROM users WHERE email = ?', [email]);
        if (users.length > 0) return res.status(400).json({ msg: 'User already exists with this email.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const hashedSecretWord = await bcrypt.hash(secretWord, salt);

        const newUser = { fullName, email, passwordHash: hashedPassword, secretWordHash: hashedSecretWord, role, department: department || null };
        const [result] = await pool.query('INSERT INTO users SET ?', newUser);
        
        const [createdUser] = await pool.query('SELECT id, fullName, email, role, department FROM users WHERE id = ?', [result.insertId]);
        res.status(201).json(createdUser[0]);

    } catch (err) {
        console.error('Admin create user error:', err.message, err.stack);
        res.status(500).json({ msg: 'Server error during user creation by admin.' });
    }
});

router.put('/users/:userId', [auth, isAdmin], async (req, res) => {
    const { fullName, email, role, department } = req.body;
    const { userId } = req.params;

    if (fullName === undefined && email === undefined && role === undefined && department === undefined) {
        return res.status(400).json({ msg: 'At least one field (fullName, email, role, department) must be provided for update.' });
    }
     if (role) {
        const validRoles = Object.values(USER_ROLES || {});
        if (!validRoles.includes(role)) return res.status(400).json({ msg: 'Invalid role specified.' });
    }

    try {
        const [existingUserResult] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (existingUserResult.length === 0) return res.status(404).json({ msg: 'User not found.' });
        const existingUser = existingUserResult[0];

        if (email && email !== existingUser.email) {
            const [emailCheck] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
            if (emailCheck.length > 0) return res.status(400).json({ msg: 'Email is already in use by another account.' });
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

router.delete('/users/:userId', [auth, isAdmin], async (req, res) => {
    const { userId } = req.params;
    if (String(req.user.id) === String(userId)) {
        return res.status(400).json({ msg: 'Admins cannot delete their own account through this interface.' });
    }
    try {
        const [userResult] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (userResult.length === 0) return res.status(404).json({ msg: 'User not found.' });
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ msg: 'User deleted successfully by admin.' });
    } catch (err) {
        console.error('Admin delete user error:', err.message, err.stack);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') { 
            return res.status(400).json({ msg: 'Cannot delete user. They are referenced in other parts of the system (e.g., sections, bookings). Please ensure all related records are handled first.' });
        }
        res.status(500).json({ msg: 'Server error while deleting user by admin.' });
    }
});

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
        `, [USER_ROLES.FACULTY]);
        res.json(facultyRequests);
    } catch (err) {
        console.error('Error fetching faculty requests for admin:', err.message, err.stack);
        res.status(500).json({ msg: 'Server Error: Could not fetch faculty requests' });
    }
});

router.post('/algorithms/:algorithmName', [auth, isAdmin], async (req, res) => {
    const { algorithmName } = req.params;
    
    let actualInputForCpp = {}; 
    let simulatedOutputFromCpp = {}; 
    let dbUpdateSummary = "No database changes simulated by algorithm.";
    let successMessage = `Algorithm '${algorithmName}' process initiated.`;
    let cppExecutablePath = '';

    try {
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
        const [facultyUsers] = await pool.query("SELECT id, fullName FROM users WHERE role = 'Faculty'");

        if (algorithmName === 'run-scheduling') { // Graph Coloring
            cppExecutablePath = './cpp_algorithms/scheduler';
            successMessage = `Graph Coloring scheduling process initiated.`;
            actualInputForCpp = {
                description: "Input for Graph Coloring: Schedule lab sessions for course sections, avoiding time conflicts. Labs are nodes, overlapping sections/faculty are edges.",
                labs: labs.map(l => ({ id: l.id, name: l.name, capacity: l.capacity })),
                sections: sections.map(s => ({ id: s.id, name: s.section_name, course: s.courseName, facultyId: s.faculty_user_id })),
                // Pending bookings that need to be scheduled (these become the primary 'nodes' or 'sessions' for graph coloring)
                bookingRequests: bookings.filter(b => b.status === 'pending-admin-approval' || b.status === 'pending').map(b => ({
                    requestId: b.id, sectionId: b.section_id, sectionName: b.sectionName, courseName: b.courseName,
                    labId: b.labId, date: b.date, timeSlotId: b.timeSlotId, durationSlots: 1, // Assuming 1 slot duration
                    purpose: b.purpose, userId: b.user_id
                })),
                existingBookings: bookings.filter(b => b.status === 'booked').map(b => ({
                    bookingId: b.id, sectionId: b.section_id, labId: b.labId, date: b.date, timeSlotId: b.timeSlotId, startTime: b.start_time, endTime: b.end_time
                })),
                timeSlots: MOCK_TIME_SLOTS_BACKEND_REF.map(ts => ({id: ts.id, display: ts.displayTime, startTime: ts.startTime, endTime: ts.endTime})),
                facultyAvailability: facultyUsers.reduce((acc, fac) => { // Mock faculty availability
                    acc[fac.id] = MOCK_TIME_SLOTS_BACKEND_REF.slice(0, Math.floor(MOCK_TIME_SLOTS_BACKEND_REF.length / 2)).map(ts => ts.id);
                    return acc;
                }, {})
            };
            simulatedOutputFromCpp = { 
                status: "success", 
                summary: "Generated conflict-free schedule for N sections.",
                assignedSchedule: [ /* { sectionId, labId, date, timeSlotId/startTime, endTime, notes } */ ],
                unscheduledSections: [ /* { sectionId, reason } */ ]
            };
            dbUpdateSummary = `DB Update SIMULATED (Graph Coloring): N bookings would be updated to 'booked' status with assigned times/labs. M requests marked as unscheduled.`;
            
        } else if (algorithmName === 'run-resource-allocation') { // 0/1 Knapsack
            cppExecutablePath = './cpp_algorithms/knapsack_allocator';
            successMessage = `0/1 Knapsack resource allocation process initiated.`;
            actualInputForCpp = {
                description: "Input for 0/1 Knapsack: Allocate scarce lab equipment to booking requests, maximizing utility/priority.",
                scarceResources: equipment.filter(e => e.status === 'available' && (e.type.includes('Advanced') || e.type.includes('Specialized'))).map(e => ({
                    resourceId: e.id, resourceType: e.type, availableUnits: 1, // Assuming 1 unit per scarce item for simplicity
                })),
                // Booking requests needing these scarce resources, with a priority/value.
                bookingRequests: bookings.filter(b => b.equipmentIds && JSON.parse(b.equipmentIds).length > 0 && (b.status === 'pending-admin-approval' || b.status === 'pending')).map(b => ({
                    bookingId: b.id, sectionId: b.section_id, sectionName: b.sectionName,
                    priorityValue: (b.purpose.toLowerCase().includes('research') ? 10 : (b.purpose.toLowerCase().includes('final year') ? 8 : 5)), // Example priority
                    needs: JSON.parse(b.equipmentIds).map(eqId => ({ resourceId: eqId, units: 1 })) // Assuming 1 unit needed
                }))
            };
            simulatedOutputFromCpp = {
                status: "success",
                summary: "Optimally allocated scarce resources to X booking requests.",
                resourceAllocations: [ /* { bookingId, allocatedResources: [{resourceId, unitsAllocated, specificInstanceIds (conceptual)}] } */ ],
                unallocatedRequests: [ /* { bookingId, reason } */ ]
            };
            dbUpdateSummary = `DB Update SIMULATED (Knapsack): For X bookings, equipment would be assigned. Y requests could not be fully resourced.`;

        } else if (algorithmName === 'optimize-lab-usage') { // Greedy Algorithm
             cppExecutablePath = './cpp_algorithms/greedy_filler';
             successMessage = `Greedy lab usage optimization process initiated.`;
            actualInputForCpp = {
                description: "Input for Greedy Algorithm: Fill free lab slots efficiently with pending bookings.",
                // Identify free slots by checking labs, dates, and MOCK_TIME_SLOTS against existing 'booked' bookings
                freeTimeSlots: [], // This would be complex to generate dynamically here, assume C++ layer does it or receives full schedule
                allLabs: labs.map(l => ({id: l.id, name: l.name, capacity: l.capacity})),
                allTimeSlots: MOCK_TIME_SLOTS_BACKEND_REF,
                existingBookings: bookings.filter(b => b.status === 'booked').map(b => ({ labId: b.labId, date: b.date, timeSlotId: b.timeSlotId, startTime: b.start_time, endTime: b.end_time })),
                pendingBookingsOrTasks: bookings.filter(b => b.status === 'pending-admin-approval' || b.status === 'pending').map(b => ({
                    bookingId: b.id, sectionId: b.section_id, sectionName: b.sectionName,
                    priority: 5, // Example priority
                    durationSlots: 1, // Assuming 1 slot duration
                    requiredLabType: null, // Assume any lab for now, or needs more lab details
                    requiredCapacity: sections.find(s => s.id === b.section_id)?.capacity || 15 // Mock capacity
                }))
            };
            simulatedOutputFromCpp = {
                status: "success",
                summary: "Filled Z empty slots using Greedy approach.",
                filledSlotsAssignments: [ /* { bookingId, assignedLabId, assignedDate, assignedTimeSlotId/startTime, endTime, notes } */ ],
                remainingPendingBookingsOrTasks: [ /* { bookingId, reason } */ ]
            };
            dbUpdateSummary = `DB Update SIMULATED (Greedy): For Z filled slots, new booking records would be created/updated.`;

        } else if (algorithmName === 'assign-nearest-labs') { // Dijkstra's
            cppExecutablePath = './cpp_algorithms/dijkstra_planner';
            successMessage = `Dijkstra's nearest lab assignment process initiated.`;
            actualInputForCpp = {
                description: "Input for Dijkstra's: Assign labs nearest to a section's faculty or department for convenience.",
                campusLayoutGraph: { /* Simplified: Nodes = department locations, labs; Edges = conceptual distances */ 
                    nodes: [
                        ...facultyUsers.map(f => ({ id: `faculty_${f.id}_loc`, type: 'faculty_location', name: f.fullName })),
                        ...labs.map(l => ({ id: `lab_${l.id}`, type: 'lab', name: l.name, locationBuilding: l.location }))
                    ],
                    edges: [ /* e.g., {from: 'faculty_F1_loc', to: 'lab_L1', distance: 100} - this would need a real map */ ]
                },
                // Booking requests for which a lab needs to be assigned or re-assigned based on proximity.
                requestsToAssignLab: bookings.filter(b => (b.status === 'pending-admin-approval' || b.status === 'pending') && !b.labId).map(b => ({
                    bookingId: b.id, sectionId: b.section_id, sectionName: b.sectionName,
                    facultyUserId: sections.find(s => s.id === b.section_id)?.faculty_user_id,
                    // Assume faculty location is the source, or a general department location for the section's course
                })),
                availableLabs: labs.map(l => ({labDatabaseId: l.id, name: l.name, locationNodeId: `lab_${l.id}`})) 
            };
            simulatedOutputFromCpp = {
                status: "success",
                summary: "Found nearest available labs for K requests.",
                nearestLabSuggestions: [ /* { bookingId, suggestedLabId, distance, path (conceptual) } */ ],
            };
            dbUpdateSummary = `Result SIMULATED (Dijkstra's): For K bookings, a labId would be suggested/assigned. No direct DB update unless suggestions are applied.`;
        } else {
            return res.status(400).json({ success: false, msg: `Algorithm '${algorithmName}' is not recognized.` });
        }
        
        await new Promise((resolve, reject) => {
            const cppProcess = spawn(cppExecutablePath, []); 
            let cppOutput = '';
            let cppErrorOutput = '';

            cppProcess.on('error', (err) => { 
                console.error(`[Backend] Failed to start C++ process for ${algorithmName}. Error: ${err.message}. Path: '${cppExecutablePath}'`);
                simulatedOutputFromCpp.status = "error_spawning_cpp";
                simulatedOutputFromCpp.summary = `Failed to start C++ process for ${algorithmName}. Error: ${err.message}. Path: '${cppExecutablePath}'. This is a simulation; the C++ program was not actually run.`;
                resolve(); 
            });

            if (!cppProcess.pid && !cppProcess.killed) { 
                if (simulatedOutputFromCpp.status !== "error_spawning_cpp") {
                    simulatedOutputFromCpp.status = "error_spawning_cpp_unknown";
                    simulatedOutputFromCpp.summary = `C++ process for ${algorithmName} did not spawn correctly (no PID).`;
                }
                resolve(); return; 
            }
            
            if (cppProcess.stdin) {
                 cppProcess.stdin.write(JSON.stringify(actualInputForCpp));
                 cppProcess.stdin.end();
            } else {
                 if (simulatedOutputFromCpp.status !== "error_spawning_cpp") {
                    simulatedOutputFromCpp.status = "error_spawning_cpp_stdin";
                    simulatedOutputFromCpp.summary = "Failed to get stdin for C++ process.";
                 }
                 resolve(); return; 
            }

            if(cppProcess.stdout) cppProcess.stdout.on('data', (data) => { cppOutput += data.toString(); });
            if(cppProcess.stderr) cppProcess.stderr.on('data', (data) => { cppErrorOutput += data.toString(); console.error(`[C++ Stderr for ${algorithmName}]: ${data}`); });
            
            cppProcess.on('close', (code) => {
                if (simulatedOutputFromCpp.status && simulatedOutputFromCpp.status.startsWith("error_spawning")) {
                    resolve(); return;
                }
                if (cppErrorOutput) console.error(`[Backend] C++ process for ${algorithmName} emitted errors to stderr.`);

                if (code === 0 && cppOutput.trim() !== '') { 
                    simulatedOutputFromCpp.status = "success_cpp_executed_simulated_result";
                } else if (code !== 0) { 
                    simulatedOutputFromCpp.status = "error_cpp_exit_code";
                    simulatedOutputFromCpp.summary = `C++ process for ${algorithmName} failed with exit code ${code}. Stderr: ${cppErrorOutput || 'N/A'}. Stdout: ${cppOutput || 'N/A'}.`;
                } else { 
                    simulatedOutputFromCpp.status = "success_cpp_no_output";
                    simulatedOutputFromCpp.summary = `C++ process for ${algorithmName} ran (exit code 0) but no stdout. Using predefined simulation result.`;
                }
                resolve(); 
            });
        }); 

        if (!res.headersSent) { 
            res.json({
                success: true, message: successMessage, algorithm: algorithmName,
                simulatedInputSentToCpp: actualInputForCpp, 
                simulatedOutputReceivedFromCpp: simulatedOutputFromCpp, 
                simulatedDatabaseUpdateSummary: dbUpdateSummary
            });
        }
    } catch (error) { 
        console.error(`[Backend] General error in algorithm trigger for ${algorithmName}:`, error.message, error.stack);
        if (!res.headersSent) {
            res.status(500).json({ 
                success: false, message: `Server error: ${error.message}`, algorithm: algorithmName,
                simulatedInputSentToCpp: actualInputForCpp, 
                simulatedOutputReceivedFromCpp: { status: "error_server_handler", summary: `Server error: ${error.message}`, ...simulatedOutputFromCpp },
                simulatedDatabaseUpdateSummary: dbUpdateSummary || `Error before DB simulation: ${error.message}` 
            });
        }
    }
});

router.get('/system-activity', [auth, isAdmin], (req, res) => {
    const mockLogs = [
        { timestamp: new Date(Date.now() - 7200000).toISOString(), user: 'admin@example.com', action: 'Course Created', details: 'Created new course "CS101 - Intro to Programming"' },
        { timestamp: new Date(Date.now() - 7000000).toISOString(), user: 'admin@example.com', action: 'Section Created', details: 'Created section "CS101 - Section A" for course CS101' },
        { timestamp: new Date(Date.now() - 3600000).toISOString(), user: 'admin@example.com', action: 'Logged in', details: 'Successful login from IP 192.168.1.10' },
        { timestamp: new Date(Date.now() - 2400000).toISOString(), user: 'faculty@example.com', action: 'Booking Conflict - Admin Review', details: 'Faculty requested Lab A for CS101-SecA on 2024-09-10, 10:00 AM; slot was taken. Request pending admin approval.' },
        { timestamp: new Date(Date.now() - 1800000).toISOString(), user: 'admin@example.com', action: 'Lab Updated', details: 'Updated capacity for CS Lab 101 to 35' },
        { timestamp: new Date(Date.now() - 900000).toISOString(), user: 'assistant@example.com', action: 'Seat Status Updated', details: 'Marked seat #5 in Electronics Lab as "not-working".' },
        { timestamp: new Date(Date.now() - 600000).toISOString(), user: 'faculty@example.com', action: 'Booking Created (Auto-Approved)', details: 'Booked Lab B for PHY202-SecB on 2024-09-11, 02:00 PM' },
        { timestamp: new Date(Date.now() - 300000).toISOString(), user: 'admin@example.com', action: 'Algorithm Triggered (Simulated)', details: 'Ran run-scheduling (Graph Coloring) algorithm.' },
        { timestamp: new Date().toISOString(), user: 'admin@example.com', action: 'Viewed System Activity', details: 'Accessed the system activity log.' }
    ];
    res.json(mockLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
});

module.exports = router;
    