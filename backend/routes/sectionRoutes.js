
const express = require('express');
const pool = require('../config/db');
const { auth, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/sections - Get all sections (Admin only, with course name)
// GET /api/sections?course_id=:courseId - Get all sections for a specific course (Publicly accessible for now to populate dropdowns)
router.get('/', auth, async (req, res) => {
    const { course_id } = req.query;
    const userRole = req.user ? req.user.role : null;

    if (course_id) {
        // Fetch sections for a specific course (can be public or for any authenticated user)
        try {
            const [sections] = await pool.query(
                `SELECT s.section_id, s.name, s.semester, s.year, s.course_id, c.name as course_name 
                 FROM Sections s
                 JOIN Courses c ON s.course_id = c.course_id
                 WHERE s.course_id = ? 
                 ORDER BY s.year DESC, s.semester DESC, s.name ASC`, 
                [course_id]
            );
            return res.json(sections);
        } catch (error) {
            console.error('Error fetching sections for course:', error);
            return res.status(500).json({ message: 'Server error fetching sections for course.' });
        }
    } else {
        // Fetch all sections (Admin only)
        if (userRole !== 'admin') {
            return res.status(403).json({ message: 'Access forbidden: Admins only for all sections view.' });
        }
        try {
            const [sections] = await pool.query(
                `SELECT s.section_id, s.name, s.semester, s.year, s.course_id, c.name as course_name 
                 FROM Sections s
                 JOIN Courses c ON s.course_id = c.course_id
                 ORDER BY c.name ASC, s.year DESC, s.semester DESC, s.name ASC`
            );
            return res.json(sections);
        } catch (error) {
            console.error('Error fetching all sections:', error);
            return res.status(500).json({ message: 'Server error fetching all sections.' });
        }
    }
});

// POST /api/sections - Create a new section (Admin only)
router.post('/', auth, authorize(['admin']), async (req, res) => {
    const { course_id, name, semester, year } = req.body;

    if (!course_id || !name || !semester || !year) {
        return res.status(400).json({ message: 'Course ID, section name, semester, and year are required.' });
    }
    if (isNaN(parseInt(year)) || String(year).length !== 4) {
        return res.status(400).json({ message: 'Year must be a valid 4-digit number.' });
    }


    try {
        // Optional: Check if section with the same name, course, semester, year already exists
        const [existingSection] = await pool.query(
            'SELECT section_id FROM Sections WHERE course_id = ? AND name = ? AND semester = ? AND year = ?',
            [course_id, name, semester, year]
        );
        if (existingSection.length > 0) {
            return res.status(409).json({ message: 'A section with this name, course, semester, and year already exists.' });
        }

        const [result] = await pool.query(
            'INSERT INTO Sections (course_id, name, semester, year) VALUES (?, ?, ?, ?)',
            [course_id, name, semester, year]
        );
        
        // Fetch the newly created section with course name for consistent response
        const [newSection] = await pool.query(
            `SELECT s.*, c.name as course_name 
             FROM Sections s 
             JOIN Courses c ON s.course_id = c.course_id 
             WHERE s.section_id = ?`,
            [result.insertId]
        );

        res.status(201).json({ 
            message: 'Section created successfully!', 
            section: newSection[0]
        });
    } catch (error) {
        console.error('Error creating section:', error);
        res.status(500).json({ message: 'Server error creating section.' });
    }
});

// PUT /api/sections/:sectionId - Update an existing section (Admin only)
router.put('/:sectionId', auth, authorize(['admin']), async (req, res) => {
    const { sectionId } = req.params;
    const { course_id, name, semester, year } = req.body;

    if (!course_id || !name || !semester || !year) {
        return res.status(400).json({ message: 'Course ID, section name, semester, and year are required.' });
    }
    if (isNaN(parseInt(year)) || String(year).length !== 4) {
        return res.status(400).json({ message: 'Year must be a valid 4-digit number.' });
    }

    try {
        // Optional: Check for conflicts before updating if necessary (e.g. if name needs to be unique within course/sem/year)
        const [existingSection] = await pool.query(
            'SELECT section_id FROM Sections WHERE course_id = ? AND name = ? AND semester = ? AND year = ? AND section_id != ?',
            [course_id, name, semester, year, sectionId]
        );
        if (existingSection.length > 0) {
            return res.status(409).json({ message: 'Another section with this name, course, semester, and year already exists.' });
        }
        
        const [result] = await pool.query(
            'UPDATE Sections SET course_id = ?, name = ?, semester = ?, year = ? WHERE section_id = ?',
            [course_id, name, semester, year, sectionId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Section not found or no changes made.' });
        }

        // Fetch the updated section with course name
        const [updatedSection] = await pool.query(
            `SELECT s.*, c.name as course_name 
             FROM Sections s 
             JOIN Courses c ON s.course_id = c.course_id 
             WHERE s.section_id = ?`,
            [sectionId]
        );

        res.json({ 
            message: 'Section updated successfully!',
            section: updatedSection[0]
        });
    } catch (error) {
        console.error('Error updating section:', error);
        res.status(500).json({ message: 'Server error updating section.' });
    }
});

// DELETE /api/sections/:sectionId - Delete a section (Admin only)
router.delete('/:sectionId', auth, authorize(['admin']), async (req, res) => {
    const { sectionId } = req.params;

    try {
        // Add check for related bookings before deleting if necessary
        const [bookings] = await pool.query('SELECT booking_id FROM Bookings WHERE section_id = ?', [sectionId]);
        if (bookings.length > 0) {
            return res.status(400).json({ message: 'Cannot delete section. It has associated bookings. Please remove related bookings first.' });
        }

        const [result] = await pool.query('DELETE FROM Sections WHERE section_id = ?', [sectionId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Section not found.' });
        }

        res.json({ message: 'Section deleted successfully.' });
    } catch (error) {
        console.error('Error deleting section:', error);
        // Check for other foreign key constraint errors if they exist
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(400).json({ message: 'Cannot delete section. It is referenced by other records. Please remove related records first.' });
        }
        res.status(500).json({ message: 'Server error deleting section.' });
    }
});


module.exports = router;
