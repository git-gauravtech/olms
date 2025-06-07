
const express = require('express');
const pool = require('../config/db');
const { auth } = require('../middleware/authMiddleware'); // Optional: if we want to log who accesses

const router = express.Router();

// GET /api/courses - Get all courses
// Publicly accessible for now to populate dropdowns easily
router.get('/', async (req, res) => {
    try {
        const [courses] = await pool.query('SELECT course_id, name, department FROM Courses ORDER BY name ASC');
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: 'Server error fetching courses.' });
    }
});

// In a more complex app, you might add POST, PUT, DELETE for courses here, protected by authorize(['admin'])

module.exports = router;
