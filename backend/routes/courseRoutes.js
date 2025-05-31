
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, isAdmin } = require('../middleware/authMiddleware'); // Import auth and isAdmin

// @route   GET api/courses
// @desc    Get all courses
// @access  Private (Authenticated Users) - Changed from Admin only
router.get('/', auth, async (req, res) => {
    try {
        const [courses] = await pool.query('SELECT * FROM courses ORDER BY name ASC');
        res.json(courses);
    } catch (err) {
        console.error('Error fetching courses:', err.message);
        res.status(500).send('Server Error: Could not fetch courses');
    }
});

// @route   POST api/courses
// @desc    Create a new course
// @access  Private (Admin only)
router.post('/', [auth, isAdmin], async (req, res) => {
    const { name, department } = req.body;
    if (!name) {
        return res.status(400).json({ msg: 'Course name is required' });
    }
    try {
        const newCourse = { name, department: department || null };
        const [result] = await pool.query('INSERT INTO courses SET ?', newCourse);
        const [createdCourse] = await pool.query('SELECT * FROM courses WHERE id = ?', [result.insertId]);
        res.status(201).json(createdCourse[0]);
    } catch (err) {
        console.error('Error creating course:', err.message);
        res.status(500).send('Server Error: Could not create course');
    }
});

// @route   PUT api/courses/:id
// @desc    Update a course
// @access  Private (Admin only)
router.put('/:id', [auth, isAdmin], async (req, res) => {
    const { name, department } = req.body;
    const { id } = req.params;
    if (!name && department === undefined) {
        return res.status(400).json({ msg: 'At least course name or department must be provided for update' });
    }
    try {
        const [existing] = await pool.query('SELECT * FROM courses WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ msg: 'Course not found' });
        }
        const fieldsToUpdate = {};
        if (name) fieldsToUpdate.name = name;
        if (department !== undefined) fieldsToUpdate.department = department;

        await pool.query('UPDATE courses SET ? WHERE id = ?', [fieldsToUpdate, id]);
        const [updatedCourse] = await pool.query('SELECT * FROM courses WHERE id = ?', [id]);
        res.json(updatedCourse[0]);
    } catch (err) {
        console.error('Error updating course:', err.message);
        res.status(500).send('Server Error: Could not update course');
    }
});

// @route   DELETE api/courses/:id
// @desc    Delete a course
// @access  Private (Admin only)
router.delete('/:id', [auth, isAdmin], async (req, res) => {
    const { id } = req.params;
    try {
        const [existing] = await pool.query('SELECT * FROM courses WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ msg: 'Course not found' });
        }
        await pool.query('DELETE FROM courses WHERE id = ?', [id]);
        res.json({ msg: 'Course and its associated sections deleted successfully' });
    } catch (err) {
        console.error('Error deleting course:', err.message);
        // Handle foreign key constraint error if sections refer to this course
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ msg: 'Cannot delete course. It is referenced by sections. Please delete or reassign associated sections first.' });
        }
        res.status(500).send('Server Error: Could not delete course');
    }
});

module.exports = router;
    