
const express = require('express');
const pool = require('../config/db');
const { auth, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/courses - Get all courses
// Publicly accessible for populating dropdowns (e.g., student schedule page)
// Admin will also use this to list courses.
router.get('/', async (req, res) => {
    try {
        const [courses] = await pool.query('SELECT course_id, name, department FROM Courses ORDER BY name ASC');
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: 'Server error fetching courses.' });
    }
});

// POST /api/courses - Create a new course (Admin only)
router.post('/', auth, authorize(['admin']), async (req, res) => {
    const { name, department } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Course name is required.' });
    }

    try {
        // Check if course with the same name already exists (optional, depends on requirements)
        // const [existingCourse] = await pool.query('SELECT course_id FROM Courses WHERE name = ?', [name]);
        // if (existingCourse.length > 0) {
        //     return res.status(409).json({ message: 'A course with this name already exists.' });
        // }

        const [result] = await pool.query(
            'INSERT INTO Courses (name, department) VALUES (?, ?)',
            [name, department || null] // Store null if department is empty
        );
        res.status(201).json({ 
            message: 'Course created successfully!', 
            courseId: result.insertId,
            name,
            department
        });
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ message: 'Server error creating course.' });
    }
});

// PUT /api/courses/:courseId - Update an existing course (Admin only)
router.put('/:courseId', auth, authorize(['admin']), async (req, res) => {
    const { courseId } = req.params;
    const { name, department } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Course name is required.' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE Courses SET name = ?, department = ? WHERE course_id = ?',
            [name, department || null, courseId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Course not found or no changes made.' });
        }

        res.json({ message: 'Course updated successfully!', courseId, name, department });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ message: 'Server error updating course.' });
    }
});

// DELETE /api/courses/:courseId - Delete a course (Admin only)
router.delete('/:courseId', auth, authorize(['admin']), async (req, res) => {
    const { courseId } = req.params;

    try {
        // Add check for related entities (e.g., sections) before deleting if necessary
        // For example:
        // const [sections] = await pool.query('SELECT section_id FROM Sections WHERE course_id = ?', [courseId]);
        // if (sections.length > 0) {
        //     return res.status(400).json({ message: 'Cannot delete course. It has associated sections. Delete sections first.' });
        // }

        const [result] = await pool.query('DELETE FROM Courses WHERE course_id = ?', [courseId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        res.json({ message: 'Course deleted successfully.' });
    } catch (error) {
        console.error('Error deleting course:', error);
        // Check for foreign key constraint errors if related data exists
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(400).json({ message: 'Cannot delete course. It is referenced by other records (e.g., sections or bookings). Please remove related records first.' });
        }
        res.status(500).json({ message: 'Server error deleting course.' });
    }
});


module.exports = router;
