
    // ... (existing requires: express, pool, auth, isAdmin)
    const { spawn } = require('child_process'); // Make sure this is at the top

    // ... (other routes like /requests/faculty, /users, etc.)

    // @route   POST api/admin/algorithms/:algorithmName
    // @desc    Trigger a specific DAA algorithm
    // @access  Private (Admin only)
    router.post('/algorithms/:algorithmName', [auth, isAdmin], async (req, res) => {
        const { algorithmName } = req.params;
        const { inputPayload } = req.body; // Optional input from frontend if needed

        console.log(`[Backend] Admin triggered algorithm: ${algorithmName}`);
        
        let actualInputForCpp = {};
        let simulatedOutputFromCpp = {}; // Will be replaced by actual output for scheduling
        let dbUpdateSummary = "No database changes made by algorithm (simulation).";
        let successMessage = `Algorithm '${algorithmName}' process initiated.`;

        try {
            if (algorithmName === 'run-scheduling') { // Graph Coloring - ACTUAL INTEGRATION EXAMPLE
                successMessage = `Graph Coloring scheduling process initiated.`;
                console.log("[Backend] Preparing input for C++ Graph Coloring (Scheduling)...");

                // 1. Fetch REAL data from MySQL
                const [labsData] = await pool.query("SELECT id, name, capacity, location, roomNumber FROM labs");
                // Fetch pending booking requests that need scheduling
                // This query needs to be specific about what constitutes a "request" to be scheduled
                // e.g., status = 'pending-schedule', or new course requirements
                const [bookingRequestsData] = await pool.query(
                    `SELECT 
                        b.id as requestId, 
                        b.purpose, 
                        b.requestedByRole, 
                        b.batchIdentifier, 
                        b.userId as facultyId, -- Assuming userId in bookings is the faculty for class labs
                        u.fullName as facultyName,
                        b.labId as preferredLabId, -- If a specific lab was requested
                        l_pref.name as preferredLabName,
                        b.equipmentIds as requestedEquipmentIds -- This might be types initially, not specific IDs
                        -- Add duration, required lab type if not specific labId, etc.
                    FROM bookings b
                    JOIN users u ON b.userId = u.id
                    LEFT JOIN labs l_pref ON b.labId = l_pref.id
                    WHERE b.status IN ('pending', 'pending-admin-approval')` // Adjust status based on your workflow
                );
                // Fetch predefined time slots (could be from DB or constants)
                const timeSlots = MOCK_TIME_SLOTS_FROM_CONSTANTS_OR_DB; // Replace with actual source

                actualInputForCpp = {
                    labs: labsData,
                    requests: bookingRequestsData,
                    timeSlots: timeSlots, // Ensure this matches what C++ expects
                    // Add any other constraints: faculty availability, student batch schedules etc.
                    // facultyAvailability: await pool.query("SELECT ... FROM faculty_availability"),
                };
                console.log("[Backend] Data fetched and prepared for C++:", JSON.stringify(actualInputForCpp, null, 2).substring(0, 500) + "...");


                // 2. Execute C++ Algorithm
                const cppExecutablePath = './cpp_algorithms/scheduler'; // YOU MUST PROVIDE THIS PATH
                console.log(`[Backend] Attempting to spawn C++ process: ${cppExecutablePath}`);
                
                const cppProcess = spawn(cppExecutablePath, []); // Add command line args if any

                let cppOutput = '';
                let cppErrorOutput = '';

                cppProcess.stdin.write(JSON.stringify(actualInputForCpp));
                cppProcess.stdin.end();

                cppProcess.stdout.on('data', (data) => { cppOutput += data.toString(); });
                cppProcess.stderr.on('data', (data) => { cppErrorOutput += data.toString(); console.error(`[C++ Stderr for ${algorithmName}]: ${data}`); });
                
                await new Promise((resolve, reject) => {
                    cppProcess.on('error', (err) => {
                        console.error(`[Backend] Failed to start C++ process for ${algorithmName}: `, err);
                        dbUpdateSummary = `Failed to start C++ process (e.g., path: '${cppExecutablePath}' not found or not executable).`;
                        reject(err);
                    });

                    cppProcess.on('close', async (code) => {
                        console.log(`[Backend] C++ process for ${algorithmName} exited with code ${code}`);
                        if (cppErrorOutput) { console.error(`[Backend] C++ process for ${algorithmName} emitted errors: ${cppErrorOutput}`); }

                        if (code === 0 && cppOutput) {
                            try {
                                const actualScheduleFromCpp = JSON.parse(cppOutput);
                                console.log("[Backend] Parsed output from C++ (Graph Coloring):", JSON.stringify(actualScheduleFromCpp, null, 2));
                                
                                // 3. Update MySQL Database with REAL results from C++
                                console.log("[Backend] Simulating database update with results from C++...");
                                let scheduledCount = 0;
                                let unscheduledCount = 0;

                                // Example DB Update Logic (MUST BE TAILORED TO YOUR C++ OUTPUT)
                                // for (const session of actualScheduleFromCpp.scheduled_sessions) {
                                //   await pool.query(
                                //       'UPDATE bookings SET labId = ?, date = ?, timeSlotId = ?, status = ? WHERE id = ?',
                                //       [session.assignedLabId, session.assignedDate, session.assignedTimeSlotId, 'booked', session.requestId]
                                //   );
                                //   // Or INSERT new bookings if these were just requests
                                //   // await pool.query(
                                //   //   'INSERT INTO bookings (labId, userId, date, timeSlotId, purpose, status, requestedByRole, batchIdentifier) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                                //   //   [session.assignedLabId, session.facultyId, session.assignedDate, session.assignedTimeSlotId, session.purpose, 'booked', 'FacultyScheduled', session.batchIdentifier]
                                //   // );
                                //   scheduledCount++;
                                // }
                                // for (const requestId of actualScheduleFromCpp.unscheduled_requests) {
                                //    await pool.query("UPDATE bookings SET status = 'scheduling_failed' WHERE id = ?", [requestId]);
                                //    unscheduledCount++;
                                // }
                                // This is highly dependent on your C++ output format and DB update strategy

                                dbUpdateSummary = `DB Update Simulation: ${actualScheduleFromCpp.scheduled_sessions?.length || 0} sessions would be booked/updated. ${actualScheduleFromCpp.unscheduled_requests?.length || 0} requests remain unscheduled.`;
                                successMessage = `Graph Coloring algorithm executed: ${dbUpdateSummary}`;
                                simulatedOutputFromCpp = actualScheduleFromCpp; // Store actual output
                                resolve();
                            } catch (parseError) {
                                console.error(`[Backend] Error parsing JSON output from C++ for ${algorithmName}:`, parseError, "Raw C++ output:", cppOutput);
                                dbUpdateSummary = "C++ process ran, but output was not valid JSON.";
                                successMessage = `Graph Coloring algorithm executed with errors parsing output.`;
                                reject(new Error(`Error parsing C++ output: ${parseError.message}. Raw output: ${cppOutput.substring(0, 500)}...`));
                            }
                        } else if (code !== 0) {
                            dbUpdateSummary = `C++ process for ${algorithmName} failed with exit code ${code}. Error: ${cppErrorOutput || 'No stderr output'}`;
                            successMessage = `Graph Coloring algorithm execution failed.`;
                            reject(new Error(`C++ process exited with code ${code}. Error: ${(cppErrorOutput || 'No stderr output').substring(0,500)}...`));
                        } else { // code === 0 but no cppOutput
                             dbUpdateSummary = `C++ process for ${algorithmName} ran but produced no output. Check C++ program.`;
                             successMessage = `Graph Coloring algorithm executed but yielded no results.`;
                             resolve(); 
                        }
                    });
                });
            // ... (rest of the if/else if for other algorithms, retaining their detailed simulations) ...
            } else if (algorithmName === 'run-resource-allocation') { // 0/1 Knapsack - DETAILED SIMULATION
                successMessage = `0/1 Knapsack resource allocation process initiated.`;
                console.log("[Backend] Simulating: Preparing input for 0/1 Knapsack (Resource Allocation)...");
                
                console.log("[Backend] Simulating: Fetching scarce equipment types and their total 'available' counts from `equipment` table.");
                // E.g., const [scarceTypes] = await pool.query("SELECT type, COUNT(*) as availableUnits FROM equipment WHERE status='available' AND type IN ('Advanced Oscilloscope', 'Spectrometer XYZ') GROUP BY type;");
                
                console.log("[Backend] Simulating: Fetching lab sessions from `bookings` (or a requests table) that need these scarce resources, including their priority/value.");
                // E.g., const [sessionsNeedingResources] = await pool.query("SELECT b.id as sessionId, b.purpose as courseSection, b.priorityValue, b.requested_equipment_details FROM bookings b WHERE b.status='pending_resource_allocation';");
                // 'priorityValue' would need to be added to your bookings table or derived.
                // 'requested_equipment_details' might be a JSON field like: { "Advanced Oscilloscope": 2, "Spectrometer XYZ": 1 }

                actualInputForCpp = {
                    scarceResources: [ 
                        {resourceId: "Advanced Oscilloscope", type: "Advanced Oscilloscope", availableUnits: 3}, // This would be derived from COUNT query
                        {resourceId: "Spectrometer XYZ", type: "Spectrometer XYZ", availableUnits: 1} 
                    ],
                    sessionRequests: [ 
                        {sessionId: 201, courseSection: "EE301_LabA", priorityValue: 10, needs: [{resourceId: "Advanced Oscilloscope", units: 2}]},
                        {sessionId: 202, courseSection: "PHY400_Research", priorityValue: 12, needs: [{resourceId: "Spectrometer XYZ", units: 1}, {resourceId: "Advanced Oscilloscope", units: 1}]},
                        {sessionId: 203, courseSection: "EE301_LabB", priorityValue: 8, needs: [{resourceId: "Advanced Oscilloscope", units: 2}]}
                    ]
                };
                console.log("[Backend] Simulated input for C++ (Knapsack):", JSON.stringify(actualInputForCpp, null, 2));
                console.log(`[Backend] Simulating call to C++ executable for 0/1 Knapsack...`);
                
                simulatedOutputFromCpp = {
                    status: "success",
                    summary: "Optimally allocated scarce resources to 2 sessions.",
                    allocatedSessions: [ 
                        { sessionId: 202, allocatedResources: [{resourceId: "Spectrometer XYZ", units: 1}, {resourceId: "Advanced Oscilloscope", units: 1}]},
                        { sessionId: 201, allocatedResources: [{resourceId: "Advanced Oscilloscope", units: 2}]}
                    ],
                    unallocatedSessions: [ 
                        {sessionId: 203, reason: "Insufficient Advanced Oscilloscope units after higher priority allocations."}
                    ]
                };
                console.log("[Backend] Simulated output from C++ (Knapsack):", JSON.stringify(simulatedOutputFromCpp, null, 2));
                
                console.log("[Backend] Simulating DB Update: For each session in `allocatedSessions`, find specific available equipment instances from `equipment` table, update `bookings.equipmentIds` and `bookings.status`, and mark assigned equipment instances as 'in-use'. For `unallocatedSessions`, update their status or notify.");
                dbUpdateSummary = `Simulated: ${simulatedOutputFromCpp.allocatedSessions?.length || 0} sessions allocated scarce resources. ${simulatedOutputFromCpp.unallocatedSessions?.length || 0} sessions could not be fully resourced.`;
                successMessage = `0/1 Knapsack resource allocation simulated: ${dbUpdateSummary}`;

            } else if (algorithmName === 'optimize-lab-usage') { // Greedy Algorithm - DETAILED SIMULATION
                // ... (Detailed simulation as previously, but input/output clearly defined) ...
                 successMessage = `Greedy lab usage optimization process initiated.`;
                console.log("[Backend] Simulating: Preparing input for Greedy Algorithm (Optimize Lab Usage/Fill Gaps)...");
                // Fetch current lab schedule from `bookings` to identify empty slots.
                // Fetch high-priority pending requests from `bookings` or a requests table.
                // Fetch lab details (capacity, type) from `labs` table.
                actualInputForCpp = {
                    emptyTimeSlots: [ 
                        {labId: 1, date: "2024-09-05", timeSlotId: "Thu_09_11", capacity: 30, type: "Computer"}, 
                        {labId: 3, date: "2024-09-05", timeSlotId: "Thu_09_11", capacity: 25, type: "Physics"}
                    ],
                    pendingRequests: [ 
                        {reqId: 301, courseSection: "BIO101_Makeup", priority: 100, durationSlots: 1, requiredLabType: "Any", requiredCapacity: 15, facultyId: "F15", studentBatch: "Batch_B1"},
                        {reqId: 302, courseSection: "CS_Club_Practice", priority: 90, durationSlots: 1, requiredLabType: "Computer", requiredCapacity: 20, facultyId: "F16", studentBatch: "Batch_C1"}
                    ],
                    labs: [ 
                         {id: 1, name: "CS Lab 101", capacity: 30, type: "Computer"},
                         {id: 3, name: "Physics Lab Alpha", capacity: 25, type: "Physics"}
                    ]
                };
                console.log("[Backend] Simulated input for C++ (Greedy Slot Filling):", JSON.stringify(actualInputForCpp, null, 2));
                console.log(`[Backend] Simulating call to C++ executable for Greedy slot filling...`);
                simulatedOutputFromCpp = {
                    status: "success",
                    summary: "Filled 1 empty slot using Greedy approach.",
                    filledSlots: [ 
                        { requestId: 301, labId: 3, date: "2024-09-05", timeSlotId: "Thu_09_11", filledByCourse: "BIO101_Makeup", facultyId: "F15", studentBatch: "Batch_B1" }
                    ],
                    remainingPendingRequests: [302] 
                };
                console.log("[Backend] Simulated output from C++ (Greedy Slot Filling):", JSON.stringify(simulatedOutputFromCpp, null, 2));
                console.log("[Backend] Simulating DB Update: For each entry in `filledSlots`, create a new entry in the `bookings` table with status 'booked'.");
                dbUpdateSummary = `Simulated: ${simulatedOutputFromCpp.filledSlots?.length || 0} empty slots filled.`;
                successMessage = `Greedy lab usage optimization simulated: ${dbUpdateSummary}`;


            } else if (algorithmName === 'assign-nearest-labs') { // Dijkstra's - DETAILED SIMULATION
                // ... (Detailed simulation as previously, but input/output clearly defined) ...
                successMessage = `Dijkstra's nearest lab assignment process initiated.`;
                console.log("[Backend] Simulating: Preparing input for Dijkstra's Algorithm (Assign Nearest Labs)...");
                // Fetch campus graph (nodes=locations, edges=paths with distances/times).
                // Fetch user's department location (source node).
                // Fetch list of currently available labs that meet basic criteria.
                actualInputForCpp = {
                    campusGraph: { 
                        nodes: [ /* ...nodes... */ ], 
                        edges: [ /* ...edges... */ ]
                    },
                    sourceLocationId: "CS_Dept", 
                    targetLabDbIds: [1, 2] 
                };
                console.log("[Backend] Simulated input for C++ (Dijkstra):", JSON.stringify(actualInputForCpp, null, 2).substring(0,500)+"...");
                console.log(`[Backend] Simulating call to C++ executable for Dijkstra's algorithm...`);
                simulatedOutputFromCpp = {
                    status: "success",
                    summary: "Found nearest labs.",
                    assignments: [ 
                        {labDbId: 1, name: "CS Lab 101", distance: 80, path: ["CS_Dept", "J1", "L101"]},
                        {labDbId: 2, name: "CS Lab 102", distance: 120, path: ["CS_Dept", "J1", "L102"]}
                    ],
                    recommendation: {labDbId: 1, name: "CS Lab 101"}
                };
                console.log("[Backend] Simulated output from C++ (Dijkstra):", JSON.stringify(simulatedOutputFromCpp, null, 2));
                console.log("[Backend] Simulating DB Update: This algorithm might not directly update bookings. Its output would be used by the booking system to SUGGEST the nearest lab or by an admin.");
                dbUpdateSummary = `Simulated: Nearest suitable lab is ${simulatedOutputFromCpp.recommendation?.name}.`;
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
            res.status(500).json({ 
                success: false, 
                message: `Server error while triggering ${algorithmName}. Details: ${error.message}`,
                algorithm: algorithmName,
                simulatedInputSentToCpp: actualInputForCpp, 
                simulatedOutputReceivedFromCpp: simulatedOutputFromCpp,
                simulatedDatabaseUpdateSummary: dbUpdateSummary 
            });
        }
    });
    
    // ... (GET /system-activity, and User Management routes: GET /users, POST /users, PUT /users/:userId, DELETE /users/:userId)
    // These user management routes are already implemented and should remain as they are.

    module.exports = router;
        
        