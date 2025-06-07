
const express = require('express');
const pool = require('../config/db');
const { auth } = require('../middleware/authMiddleware'); // Optional

const router = express.Router();

// GET /api/sections?course_id=:courseId - Get all sections for a specific course
// Publicly accessible for now to populate dropdowns
router.get('/', async (req, res) => {
    const { course_id } = req.query;

    if (!course_id) {
        return res.status(400).json({ message: 'Course ID is required.' });
    }

    try {
        const [sections] = await pool.query(
            'SELECT section_id, name, semester, year FROM Sections WHERE course_id = ? ORDER BY year DESC, semester DESC, name ASC', 
            [course_id]
        );
        res.json(sections);
    } catch (error) {
        console.error('Error fetching sections for course:', error);
        res.status(500).json({ message: 'Server error fetching sections.' });
    }
});

// In a more complex app, you might add POST, PUT, DELETE for sections here, protected by authorize(['admin'])

module.exports = router;
