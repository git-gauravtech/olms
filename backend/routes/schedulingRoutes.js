
const express = require('express');
const pool = require('../config/db');
const { auth, authorize } = require('../middleware/authMiddleware');
const { spawn } = require('child_process');
const path = require('path');
const { checkOverlappingBookings } = require('../utils/bookingUtils'); // Corrected import path


const router = express.Router();

// POST /api/scheduling/run - Admin triggers the scheduling algorithm
router.post('/run', auth, authorize(['admin']), async (req, res) => {
    console.log(`Scheduling run initiated by admin: ${req.user.userId} - ${req.user.fullName}`);
    const adminUserId = req.user.userId;

    try {
        // 1. Gather all necessary data from the database
        const [labs] = await pool.query('SELECT lab_id, name, capacity, type, is_available FROM Labs WHERE is_available = true');
        const [courses] = await pool.query('SELECT course_id, name FROM Courses');
        // Fetch sections with their course name and an assumed labs_per_week and capacity (customize as needed)
        const [sections] = await pool.query(`
            SELECT s.section_id, s.name, s.semester, s.year, s.course_id, c.name as course_name,
                   COALESCE(s.expected_students, 30) AS capacity, -- Use actual if exists, else default
                   COALESCE(s.labs_per_week, 1) AS labs_per_week   -- Use actual if exists, else default
            FROM Sections s
            JOIN Courses c ON s.course_id = c.course_id
            WHERE s.year >= YEAR(CURDATE()) AND s.semester IN ('Fall', 'Spring', 'Summer', 'Winter', 'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Trimester 1', 'Trimester 2', 'Trimester 3', 'Other') 
        `); // Example: only schedule for current year's relevant semesters, expanded list

        const [faculty_users] = await pool.query('SELECT user_id, full_name FROM Users WHERE role = "faculty"');

        const inputDataForScheduler = {
            labs,
            courses,
            sections,
            faculty_users 
        };

        // 2. Determine path to C++ executable
        const schedulerExecutableName = process.platform === "win32" ? "scheduler.exe" : "scheduler";
        const schedulerPath = path.join(__dirname, '..', schedulerExecutableName); // Assumes executable is in backend/

        // 3. Spawn the C++ scheduler as a child process
        const schedulerProcess = spawn(schedulerPath, [], { stdio: ['pipe', 'pipe', 'pipe'] });

        let stdoutData = '';
        let stderrData = '';

        schedulerProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });

        schedulerProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
            console.error(`Scheduler STDERR: ${data}`);
        });

        // Send data to C++ process via stdin
        schedulerProcess.stdin.write(JSON.stringify(inputDataForScheduler));
        schedulerProcess.stdin.end();

        // Handle child process exit
        schedulerProcess.on('close', async (code) => {
            if (code !== 0) {
                console.error(`Scheduler process exited with code ${code}`);
                console.error(`Scheduler STDERR Output: ${stderrData}`);
                return res.status(500).json({ 
                    message: 'Scheduling algorithm process failed.', 
                    error: `Exited with code ${code}`,
                    details: stderrData || "No specific error details from scheduler."
                });
            }

            try {
                const resultFromScheduler = JSON.parse(stdoutData);
                if (resultFromScheduler.error) {
                    console.error('Error from C++ scheduler:', resultFromScheduler.error, resultFromScheduler.details);
                    return res.status(500).json({
                        message: 'Scheduling algorithm returned an error.',
                        error: resultFromScheduler.error,
                        details: resultFromScheduler.details
                    });
                }
                
                if (resultFromScheduler.message && resultFromScheduler.proposed_bookings && resultFromScheduler.proposed_bookings.length === 0) {
                     // Message from C++ indicating no labs/sections, etc.
                    return res.status(200).json({
                        message: resultFromScheduler.message,
                        successfullyScheduledCount: 0,
                        conflictCount: 0,
                        totalProposed: 0,
                        createdBookingIds: []
                    });
                }


                const proposedBookings = resultFromScheduler.proposed_bookings || [];
                let successfullyScheduledCount = 0;
                let conflictCount = 0;
                const createdBookingIds = [];
                let dbErrors = [];

                if (proposedBookings.length === 0 && !resultFromScheduler.message) { // No message and no bookings
                    return res.status(200).json({
                        message: 'Scheduling algorithm ran, but no new bookings were proposed.',
                        details: 'This might be due to existing schedules, lack of available slots, or no sections needing labs.',
                        successfullyScheduledCount,
                        conflictCount,
                        createdBookingIds
                    });
                }
                
                for (const booking of proposedBookings) {
                    const { lab_id, section_id, user_id, start_time, end_time, purpose, status } = booking;
                    
                    if (!lab_id || !start_time || !end_time) {
                        console.warn('Algorithm proposed an invalid booking (missing lab_id, start_time, or end_time), skipping:', booking);
                        conflictCount++; // Or a new category for invalid proposals
                        continue;
                    }

                    const isOverlappingWithDb = await checkOverlappingBookings(lab_id, start_time, end_time);

                    if (isOverlappingWithDb) {
                        conflictCount++;
                        console.warn(`Algorithm proposed booking for Lab ${lab_id} at ${start_time} overlaps with existing DB booking. Skipping.`);
                        continue;
                    }

                    try {
                        const [dbResult] = await pool.query(
                            'INSERT INTO Bookings (lab_id, section_id, user_id, start_time, end_time, purpose, status, created_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                            [lab_id, section_id || null, user_id === 0 ? null : (user_id || null), start_time, end_time, purpose || null, status || 'Scheduled', adminUserId]
                        );
                        createdBookingIds.push(dbResult.insertId);
                        successfullyScheduledCount++;
                    } catch (dbError) {
                        console.error('Error inserting proposed booking into DB:', dbError, 'Booking Data:', booking);
                        dbErrors.push(`Failed to insert booking for lab ${lab_id} at ${start_time}: ${dbError.message}`);
                        conflictCount++; 
                    }
                }
                
                let finalMessage = 'Scheduling process completed.';
                if (dbErrors.length > 0) {
                    finalMessage += ` Encountered ${dbErrors.length} errors during database insertion.`;
                }


                res.status(200).json({
                    message: finalMessage,
                    successfullyScheduledCount,
                    conflictCount,
                    totalProposed: proposedBookings.length,
                    createdBookingIds,
                    dbInsertionErrors: dbErrors.length > 0 ? dbErrors : undefined
                });

            } catch (parseError) {
                console.error('Error parsing JSON output from scheduler:', parseError);
                console.error('Scheduler STDOUT (raw):', stdoutData);
                res.status(500).json({ message: 'Error parsing output from scheduling algorithm.', error: parseError.message, rawOutput: stdoutData });
            }
        });

        schedulerProcess.on('error', (err) => {
            console.error('Failed to start scheduler process:', err);
            res.status(500).json({ message: 'Failed to start scheduling algorithm process.', error: err.message });
        });

    } catch (error) {
        console.error('Error during scheduling run:', error);
        res.status(500).json({ message: 'Server error during scheduling initiation.', error: error.message });
    }
});

module.exports = router;
