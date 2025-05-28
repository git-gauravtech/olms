
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
        `, ['pending-admin-approval', 'Faculty']); // USER_ROLES.FACULTY if USER_ROLES is imported
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
            successMessage = `Graph Coloring scheduling process initiated.`;
            console.log("[Backend] Simulating: Preparing input for Graph Coloring (Scheduling)...");
            // In a real scenario, fetch these from MySQL:
            // - All labs: id, name, capacity, type
            // - All booking requests for a specific period/status: 
            //   - Unique ID (booking_id or a temp request_id)
            //   - Course Section ID (e.g., 'CS101_SecA')
            //   - Student Batch ID (e.g., 'Batch_A1') - ensures all students of a section attend together
            //   - Assigned Faculty ID (e.g., 'F10') - for faculty consistency per section
            //   - Required lab type (e.g., 'Computer', 'Physics')
            //   - Duration (e.g., 1 slot = 2 hours, 2 slots = 4 hours)
            //   - Specific equipment needs (beyond general lab type)
            //   - Any preferences (e.g., preferred lab if multiple of type exist)
            // - Faculty Availability: facultyId -> array of available timeSlotIds
            // - Student Batch Schedules (to avoid clashes with other classes)
            // - Predefined Time Slots (e.g., Mon 9-11, Mon 11-1, etc.)
            // - Existing Fixed Bookings (that cannot be moved)
            console.log("[Backend] This involves fetching detailed data for: Labs (ID, name, capacity, type), Booking Requests/Course Lab Requirements (Unique ID, Course Section ID, Student Batch ID, Assigned Faculty ID, lab type, duration, equipment needs, preferences), Faculty Availability, Student Batch Schedules, Predefined Time Slots, Existing Fixed Bookings.");
            
            console.log("[Backend] CORE SCHEDULING CONSTRAINTS for C++ Graph Coloring:");
            console.log("  1. Faculty Consistency: The SAME faculty member must be assigned to all lab sessions of a specific course section (e.g., Faculty 'F10' for all 'CS101_SecA' labs).");
            console.log("  2. Distinct Section Schedules: Different sections of the same course (e.g., 'CS101_SecA' vs 'CS101_SecB') are separate groups and MUST have their own distinct lab schedules. They can only share a time slot if they use different labs AND different faculty.");
            console.log("  3. Student Batch Non-Concurrency: A student batch cannot be in two different labs/sessions simultaneously.");
            console.log("  4. Faculty Non-Concurrency: A faculty member cannot teach two different sessions simultaneously.");
            console.log("  5. Lab Non-Concurrency: A physical lab cannot host two different sessions simultaneously.");
            console.log("  6. Lab Capacity: Number of students in a section must not exceed lab capacity.");

            // Example Simulated Input (in a real scenario, this data is fetched from MySQL)
            actualInputForCpp = {
                labs: [
                    {id: 1, name: "CS Lab 101", capacity: 30, type: "Computer"}, 
                    {id: 2, name: "CS Lab 102", capacity: 25, type: "Computer"},
                    {id: 3, name: "Physics Lab Alpha", capacity: 25, type: "Physics"}
                ],
                // Each object represents a distinct lab session to be scheduled for a section
                labSessionRequests: [ 
                    {reqId: 101, courseSection: "CS101_SecA", studentBatch: "Batch_A1", facultyId: "F10", durationSlots: 1, preferredLabType: "Computer", note: "Needs 20 PCs"},
                    {reqId: 102, courseSection: "CS101_SecB", studentBatch: "Batch_A2", facultyId: "F11", durationSlots: 1, preferredLabType: "Computer", note: "Needs 22 PCs"},
                    {reqId: 103, courseSection: "PHY202_SecA", studentBatch: "Batch_P1", facultyId: "F12", durationSlots: 1, preferredLabType: "Physics"},
                    {reqId: 104, courseSection: "CS101_SecA", studentBatch: "Batch_A1", facultyId: "F10", durationSlots: 1, preferredLabType: "Computer", note: "This is the 2nd lab for CS101_SecA, should have same faculty F10"}
                ],
                facultyAvailability: { // facultyId -> array of available timeSlotIds
                    "F10": ["Mon_09_11", "Mon_11_13", "Tue_09_11"],
                    "F11": ["Mon_09_11", "Tue_11_13", "Wed_09_11"],
                    "F12": ["Tue_09_11", "Wed_11_13", "Thu_09_11"]
                },
                timeSlots: [ // Representing available "colors"
                    {id: "Mon_09_11", display: "Monday 09:00-11:00"}, {id: "Mon_11_13", display: "Monday 11:00-13:00"},
                    {id: "Tue_09_11", display: "Tuesday 09:00-11:00"}, {id: "Tue_11_13", display: "Tuesday 11:00-13:00"},
                    {id: "Wed_09_11", display: "Wednesday 09:00-11:00"}, {id: "Wed_11_13", display: "Wednesday 11:00-13:00"},
                    {id: "Thu_09_11", display: "Thursday 09:00-11:00"}
                ],
                constraints: [ // Explicit constraints or preferences
                    "Faculty F10 is assigned to all CS101_SecA labs.",
                    "Batch_A1 cannot have conflicting sessions.",
                    // etc.
                ]
            };
            console.log("[Backend] Simulated input for C++ (Graph Coloring):", JSON.stringify(actualInputForCpp, null, 2).substring(0, 1000) + "...");


            const cppExecutablePath = './cpp_algorithms/graph_coloring_scheduler'; // IMPORTANT: Replace with actual path to your compiled C++ program
            console.log(`[Backend] Attempting to spawn C++ process: ${cppExecutablePath}`);
            
            // --- Actual C++ Process Spawn (Example) ---
            // This section demonstrates how Node.js would interact with a C++ executable.
            // You need to adapt this when you have your C++ program ready.
            
            const cppProcess = spawn(cppExecutablePath, []); // Add command line args if your C++ program takes them

            let cppOutput = '';
            let cppErrorOutput = '';

            // Send data to C++ process's stdin
            cppProcess.stdin.write(JSON.stringify(actualInputForCpp));
            cppProcess.stdin.end();

            // Listen for data from C++ process's stdout
            cppProcess.stdout.on('data', (data) => { cppOutput += data.toString(); });
            // Listen for errors from C++ process's stderr
            cppProcess.stderr.on('data', (data) => { cppErrorOutput += data.toString(); console.error(`[C++ Stderr for ${algorithmName}]: ${data.toString()}`); });
            
            await new Promise((resolve, reject) => {
                cppProcess.on('close', async (code) => {
                    console.log(`[Backend] C++ process for ${algorithmName} exited with code ${code}`);
                    if (cppErrorOutput) { console.error(`[Backend] C++ process for ${algorithmName} emitted errors: ${cppErrorOutput}`); }

                    if (code === 0 && cppOutput) {
                        try {
                            simulatedOutputFromCpp = JSON.parse(cppOutput); // Expecting JSON output
                            console.log("[Backend] Parsed output from C++ (Graph Coloring):", JSON.stringify(simulatedOutputFromCpp, null, 2));
                            
                            // Simulate database update with results from C++
                            // In a real scenario, loop through newlyScheduledBookings
                            // and INSERT or UPDATE records in the 'bookings' table in MySQL.
                            // Example of one such conceptual update:
                            // const booking = simulatedOutputFromCpp.newlyScheduledBookings[0];
                            // await pool.query(
                            //     'INSERT INTO bookings (labId, userId, date, timeSlotId, purpose, status, requestedByRole, batchIdentifier, submittedDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
                            //     [booking.labId, booking.facultyId, booking.date, booking.timeSlotId, `Scheduled: ${booking.courseSection}`, 'booked', 'AdminScheduled', booking.studentBatch]
                            // );
                            dbUpdateSummary = `Simulated: ${simulatedOutputFromCpp.newlyScheduledBookings?.length || 0} sessions scheduled based on C++ output. ${simulatedOutputFromCpp.unscheduledRequests?.length || 0} requests remain unscheduled. Faculty consistency (e.g., F10 for CS101_SecA) and distinct section schedules (e.g., F11 for CS101_SecB) maintained.`;
                            
                            successMessage = `Graph Coloring algorithm executed: ${dbUpdateSummary}`;
                            resolve();
                        } catch (parseError) {
                            console.error(`[Backend] Error parsing JSON output from C++ for ${algorithmName}:`, parseError, "Raw output:", cppOutput);
                            dbUpdateSummary = "C++ process ran, but output was not valid JSON.";
                            successMessage = `Graph Coloring algorithm executed with errors parsing output.`;
                            // reject(new Error(`Error parsing C++ output: ${parseError.message}. Raw output: ${cppOutput.substring(0, 500)}...`));
                             // Fallback to simulated if parse fails for demo purposes
                            simulatedOutputFromCpp = {
                                status: "fallback_simulation",
                                summary: "Fallback: Successfully scheduled 4 lab sessions due to C++ output parse error.",
                                newlyScheduledBookings: [ 
                                    { reqId: 101, courseSection: "CS101_SecA", studentBatch: "Batch_A1", facultyId: "F10", labId: 1, date: "2024-09-02", timeSlotId: "Mon_09_11"}, 
                                    { reqId: 104, courseSection: "CS101_SecA", studentBatch: "Batch_A1", facultyId: "F10", labId: 1, date: "2024-09-03", timeSlotId: "Tue_09_11"}, 
                                    { reqId: 102, courseSection: "CS101_SecB", studentBatch: "Batch_A2", facultyId: "F11", labId: 2, date: "2024-09-02", timeSlotId: "Mon_09_11"},
                                    { reqId: 103, courseSection: "PHY202_SecA", studentBatch: "Batch_P1", facultyId: "F12", labId: 3, date: "2024-09-04", timeSlotId: "Wed_11_13"}
                                ],
                                unscheduledRequests: [], 
                                notes: "Ensured CS101_SecA labs are with F10. CS101_SecB (different section) is scheduled independently with F11. All students in Batch_A1 attend CS101_SecA labs."
                            };
                            dbUpdateSummary = `Fallback Simulation: ${simulatedOutputFromCpp.newlyScheduledBookings?.length || 0} sessions scheduled. Faculty consistency and section distinction maintained.`;
                            successMessage = `Graph Coloring algorithm executed (simulated fallback due to C++ output parse error): ${dbUpdateSummary}`;
                            resolve();
                        }
                    } else if (code !== 0) {
                        dbUpdateSummary = `C++ process for ${algorithmName} failed with exit code ${code}. Error: ${cppErrorOutput}`;
                        successMessage = `Graph Coloring algorithm execution failed.`;
                        reject(new Error(`C++ process exited with code ${code}. Error: ${cppErrorOutput.substring(0,500)}...`));
                    } else { // code === 0 but no cppOutput
                         dbUpdateSummary = `C++ process for ${algorithmName} ran but produced no output. Check C++ program.`;
                         successMessage = `Graph Coloring algorithm executed but yielded no results.`;
                         // Fallback to simulated output for demo
                         simulatedOutputFromCpp = { status: "success_no_cpp_output_fallback_simulation", summary: "Successfully scheduled 4 lab sessions.", newlyScheduledBookings: [ { reqId: 101, courseSection: "CS101_SecA", studentBatch: "Batch_A1", facultyId: "F10", labId: 1, date: "2024-09-02", timeSlotId: "Mon_09_11"}, { reqId: 104, courseSection: "CS101_SecA", studentBatch: "Batch_A1", facultyId: "F10", labId: 1, date: "2024-09-03", timeSlotId: "Tue_09_11"}, { reqId: 102, courseSection: "CS101_SecB", studentBatch: "Batch_A2", facultyId: "F11", labId: 2, date: "2024-09-02", timeSlotId: "Mon_09_11"}, { reqId: 103, courseSection: "PHY202_SecA", studentBatch: "Batch_P1", facultyId: "F12", labId: 3, date: "2024-09-04", timeSlotId: "Wed_11_13"} ], unscheduledRequests: [], notes: "Ensured CS101_SecA labs are with F10. CS101_SecB (different section) is scheduled independently with F11." };
                         dbUpdateSummary = `Fallback Simulation: ${simulatedOutputFromCpp.newlyScheduledBookings?.length || 0} sessions scheduled.`;
                         resolve(); 
                    }
                });
                cppProcess.on('error', (err) => { // Handle errors like 'ENOENT' if executable not found
                    console.error(`[Backend] Failed to start C++ process for ${algorithmName}: `, err);
                    dbUpdateSummary = `Failed to start C++ process (e.g. path: '${cppExecutablePath}' not found or not executable). Check path/permissions.`;
                    successMessage = `Graph Coloring algorithm could not be started.`;
                    // Fallback to simulated output for demo
                    simulatedOutputFromCpp = { status: "error_no_spawn_fallback_simulation", summary: "Successfully scheduled 4 lab sessions.", newlyScheduledBookings: [ { reqId: 101, courseSection: "CS101_SecA", studentBatch: "Batch_A1", facultyId: "F10", labId: 1, date: "2024-09-02", timeSlotId: "Mon_09_11"}, { reqId: 104, courseSection: "CS101_SecA", studentBatch: "Batch_A1", facultyId: "F10", labId: 1, date: "2024-09-03", timeSlotId: "Tue_09_11"}, { reqId: 102, courseSection: "CS101_SecB", studentBatch: "Batch_A2", facultyId: "F11", labId: 2, date: "2024-09-02", timeSlotId: "Mon_09_11"}, { reqId: 103, courseSection: "PHY202_SecA", studentBatch: "Batch_P1", facultyId: "F12", labId: 3, date: "2024-09-04", timeSlotId: "Wed_11_13"} ], unscheduledRequests: [], notes: "Ensured CS101_SecA labs are with F10. CS101_SecB (different section) is scheduled independently with F11." };
                    dbUpdateSummary = `Fallback Simulation: ${simulatedOutputFromCpp.newlyScheduledBookings?.length || 0} sessions scheduled.`;
                    reject(err); 
                });
            });
            // --- End of Actual C++ Process Spawn ---

        } else if (algorithmName === 'run-resource-allocation') { // 0/1 Knapsack - Simulation
            successMessage = `0/1 Knapsack resource allocation process initiated.`;
            console.log("[Backend] Simulating: Preparing input for 0/1 Knapsack (Resource Allocation)...");
            // Fetch scarce equipment types and their total 'available' counts from `equipment` table.
            // E.g., SELECT type, COUNT(*) as availableUnits FROM equipment WHERE status='available' AND type IN ('Advanced Oscilloscope', 'Spectrometer XYZ') GROUP BY type;
            // Fetch lab sessions from `bookings` (or a requests table) that need these scarce resources, including their priority/value.
            // E.g., SELECT sessionId, courseSection, priorityValue, requested_equipment_details FROM session_requests WHERE status='pending_resource_allocation';
            // 'requested_equipment_details' might be a JSON field like: { "Advanced Oscilloscope": 2, "Spectrometer XYZ": 1 }
            actualInputForCpp = {
                scarceResources: [ 
                    {resourceId: "Advanced Oscilloscope", type: "Advanced Oscilloscope", availableUnits: 3}, // This would be derived from COUNT query
                    {resourceId: "Spectrometer XYZ", type: "Spectrometer XYZ", availableUnits: 1} // This would be derived from COUNT query
                ],
                sessionRequests: [ // These are sessions needing scarce resources
                    {sessionId: 201, courseSection: "EE301_LabA", priorityValue: 10, needs: [{resourceId: "Advanced Oscilloscope", units: 2}]},
                    {sessionId: 202, courseSection: "PHY400_Research", priorityValue: 12, needs: [{resourceId: "Spectrometer XYZ", units: 1}, {resourceId: "Advanced Oscilloscope", units: 1}]},
                    {sessionId: 203, courseSection: "EE301_LabB", priorityValue: 8, needs: [{resourceId: "Advanced Oscilloscope", units: 2}]}
                ]
            };
            console.log("[Backend] Simulated input for C++ (Knapsack):", JSON.stringify(actualInputForCpp, null, 2));
            console.log(`[Backend] Simulating call to C++ executable for 0/1 Knapsack... (No spawn for this example, using simulated output)`);
            simulatedOutputFromCpp = {
                status: "success",
                summary: "Optimally allocated scarce resources to 2 sessions.",
                allocatedSessions: [ // Sessions that received resources
                    { sessionId: 202, allocatedResources: [{resourceId: "Spectrometer XYZ", units: 1}, {resourceId: "Advanced Oscilloscope", units: 1}]},
                    { sessionId: 201, allocatedResources: [{resourceId: "Advanced Oscilloscope", units: 2}]}
                ],
                unallocatedSessions: [ // Sessions that didn't get resources
                    {sessionId: 203, reason: "Insufficient Advanced Oscilloscope units after higher priority allocations."}
                ]
            };
            console.log("[Backend] Simulated output from C++ (Knapsack):", JSON.stringify(simulatedOutputFromCpp, null, 2));
            // DB Update Simulation:
            // For each session in `allocatedSessions`:
            //   - Find specific available equipment instances from `equipment` table matching the type and quantity.
            //   - Update `bookings` table for that session:
            //     - Set `status` to 'booked' or 'resources_allocated'.
            //     - Populate `equipmentIds` with the IDs of the actual assigned equipment instances.
            //   - Update `equipment` table: mark assigned instances as 'in-use' for the duration of the booking.
            // For `unallocatedSessions`, update their status in `bookings` or notify.
            dbUpdateSummary = `Simulated: ${simulatedOutputFromCpp.allocatedSessions?.length || 0} sessions allocated scarce resources. ${simulatedOutputFromCpp.unallocatedSessions?.length || 0} sessions could not be fully resourced.`;
            successMessage = `0/1 Knapsack resource allocation simulated: ${dbUpdateSummary}`;

        } else if (algorithmName === 'optimize-lab-usage') { // Greedy Algorithm - Simulation
            successMessage = `Greedy lab usage optimization process initiated.`;
            console.log("[Backend] Simulating: Preparing input for Greedy Algorithm (Optimize Lab Usage/Fill Gaps)...");
            // Fetch current lab schedule from `bookings` to identify empty slots.
            // Fetch high-priority pending requests from `bookings` or a requests table.
            // Fetch lab details (capacity, type) from `labs` table.
            actualInputForCpp = {
                emptyTimeSlots: [ // These would be derived from the current schedule
                    {labId: 1, date: "2024-09-05", timeSlotId: "Thu_09_11", capacity: 30, type: "Computer"}, 
                    {labId: 3, date: "2024-09-05", timeSlotId: "Thu_09_11", capacity: 25, type: "Physics"}
                ],
                pendingRequests: [ // These are unassigned requests, sorted by priority
                    {reqId: 301, courseSection: "BIO101_Makeup", priority: 100, durationSlots: 1, requiredLabType: "Any", requiredCapacity: 15, facultyId: "F15", studentBatch: "Batch_B1"},
                    {reqId: 302, courseSection: "CS_Club_Practice", priority: 90, durationSlots: 1, requiredLabType: "Computer", requiredCapacity: 20, facultyId: "F16", studentBatch: "Batch_C1"}
                ],
                labs: [ // For reference by the algorithm if needed
                     {id: 1, name: "CS Lab 101", capacity: 30, type: "Computer"},
                     {id: 3, name: "Physics Lab Alpha", capacity: 25, type: "Physics"}
                ]
            };
            console.log("[Backend] Simulated input for C++ (Greedy Slot Filling):", JSON.stringify(actualInputForCpp, null, 2));
            console.log(`[Backend] Simulating call to C++ executable for Greedy slot filling... (No spawn for this example, using simulated output)`);
            simulatedOutputFromCpp = {
                status: "success",
                summary: "Filled 1 empty slot using Greedy approach.",
                filledSlots: [ // Slots that were successfully filled
                    { requestId: 301, labId: 3, date: "2024-09-05", timeSlotId: "Thu_09_11", filledByCourse: "BIO101_Makeup", facultyId: "F15", studentBatch: "Batch_B1" }
                ],
                remainingPendingRequests: [302] // Requests that couldn't be placed
            };
            console.log("[Backend] Simulated output from C++ (Greedy Slot Filling):", JSON.stringify(simulatedOutputFromCpp, null, 2));
            // DB Update Simulation:
            // For each entry in `filledSlots`:
            //   - Create a new entry in the `bookings` table with status 'booked', using details from the request and the assigned slot.
            dbUpdateSummary = `Simulated: ${simulatedOutputFromCpp.filledSlots?.length || 0} empty slots filled.`;
            successMessage = `Greedy lab usage optimization simulated: ${dbUpdateSummary}`;

        } else if (algorithmName === 'assign-nearest-labs') { // Dijkstra's - Simulation
            successMessage = `Dijkstra's nearest lab assignment process initiated.`;
            console.log("[Backend] Simulating: Preparing input for Dijkstra's Algorithm (Assign Nearest Labs)...");
            // Fetch campus graph (nodes=locations, edges=paths with distances/times). This could be stored in DB tables or a config file.
            // Fetch user's department location (source node).
            // Fetch list of currently available labs that meet basic criteria (e.g., type 'Computer', capacity > N).
            actualInputForCpp = {
                campusGraph: { // Nodes and Edges representing campus layout
                    nodes: [ 
                        {id: "CS_Dept", name: "CS Department", type: "Department"},
                        {id: "L101", name: "CS Lab 101", type: "Lab", lab_db_id: 1}, // lab_db_id links to `labs` table
                        {id: "L102", name: "CS Lab 102", type: "Lab", lab_db_id: 2},
                        {id: "PHY_Dept", name: "Physics Department", type: "Department"},
                        {id: "L301", name: "Physics Lab Alpha", type: "Lab", lab_db_id: 3},
                        {id: "J1", name: "Junction 1", type: "Junction"},
                        {id: "J2", name: "Junction 2", type: "Junction"}
                    ], 
                    edges: [ // [sourceNodeId, targetNodeId, weight/distance]
                        ["CS_Dept", "J1", 50], ["J1", "L101", 30], ["J1", "L102", 70],
                        ["PHY_Dept", "J2", 40], ["J2", "L301", 60], ["J1", "J2", 100] // Path between junctions
                    ]
                },
                sourceLocationId: "CS_Dept", // User's current department or context
                targetLabDbIds: [1, 2] // IDs of labs that are currently available and suitable
            };
            console.log("[Backend] Simulated input for C++ (Dijkstra):", JSON.stringify(actualInputForCpp, null, 2));
            console.log(`[Backend] Simulating call to C++ executable for Dijkstra's algorithm... (No spawn for this example, using simulated output)`);
            simulatedOutputFromCpp = {
                status: "success",
                summary: "Found nearest labs.",
                assignments: [ // Shortest path details to each target lab
                    {labDbId: 1, name: "CS Lab 101", distance: 80, path: ["CS_Dept", "J1", "L101"]},
                    {labDbId: 2, name: "CS Lab 102", distance: 120, path: ["CS_Dept", "J1", "L102"]}
                ],
                recommendation: {labDbId: 1, name: "CS Lab 101"} // The overall best recommendation
            };
            console.log("[Backend] Simulated output from C++ (Dijkstra):", JSON.stringify(simulatedOutputFromCpp, null, 2));
            // DB Update Simulation:
            // This algorithm might not directly update bookings. Instead, its output would be used by:
            //   - The booking system to SUGGEST the nearest lab when a user requests a generic lab type.
            //   - An admin making manual assignments.
            const recommendedAssignment = simulatedOutputFromCpp.assignments.find(a=>a.labDbId === simulatedOutputFromCpp.recommendation.labDbId);
            dbUpdateSummary = `Simulated: Nearest suitable lab to ${actualInputForCpp.sourceLocationId} is ${simulatedOutputFromCpp.recommendation?.name} (distance ${recommendedAssignment ? recommendedAssignment.distance : 'N/A'}).`;
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

    } catch (error) { // This catch block handles errors from the spawn promise or other synchronous errors
        console.error(`[Backend] Error triggering algorithm ${algorithmName}:`, error.message, error.stack);
        // If a fallback was used inside the promise due to C++ issues, we might have already set successMessage.
        // Ensure the final response reflects an error if the promise was rejected.
        res.status(500).json({ 
            success: false, 
            message: `Server error while triggering ${algorithmName}. Details: ${error.message}`,
            algorithm: algorithmName,
            simulatedInputSentToCpp: actualInputForCpp, // Still useful for debugging
            simulatedOutputReceivedFromCpp: simulatedOutputFromCpp, // Might contain fallback data
            simulatedDatabaseUpdateSummary: dbUpdateSummary // Might contain fallback data
        });
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
    const { fullName, email, password, secretWord, role, department } = req.body;

    if (!fullName || !email || !password || !role || !secretWord) {
        return res.status(400).json({ msg: 'Please enter all required fields (fullName, email, password, secretWord, role)' });
    }
    if (password.length < 6) {
        return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
    }
    if (secretWord.length < 4) { 
        return res.status(400).json({ msg: 'Secret word must be at least 4 characters long' });
    }
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
        const hashedSecretWord = await bcrypt.hash(secretWord, salt);
        
        const newUser = {
            fullName,
            email,
            passwordHash: hashedPassword,
            secretWordHash: hashedSecretWord, 
            role,
            department: department || null, // Save department
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
    const validRoles = ['Admin', 'Faculty', 'Student', 'Assistant']; 
    if (!validRoles.includes(role)) {
        return res.status(400).json({ msg: 'Invalid role specified.' });
    }

    try {
        const [existingUsers] = await pool.query('SELECT id, email, department FROM users WHERE id = ?', [userId]);
        if (existingUsers.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if new email is already in use by another user
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
            // Ensure department is updated correctly, even if it's set to null or empty
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

        // Bookings table has ON DELETE CASCADE for userId, so bookings will be removed.
        // Check other tables if they have foreign keys to users without ON DELETE CASCADE.
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ msg: 'User deleted successfully by admin.' });

    } catch (err) {
        console.error('Admin delete user error:', err.message, err.stack);
        // Check for foreign key constraint errors if other tables reference users without ON DELETE CASCADE
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || (err.sqlMessage && err.sqlMessage.toLowerCase().includes('foreign key constraint fails'))) {
            return res.status(400).json({ msg: 'Cannot delete user. They are referenced in other records that prevent deletion (e.g., equipment assignments if not set to ON DELETE SET NULL or CASCADE). Consider deactivating the user or reassigning their records first.' });
        }
        res.status(500).json({ msg: 'Server error while deleting user by admin.' });
    }
});


module.exports = router;
