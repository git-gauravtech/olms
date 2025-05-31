
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { isAdmin, USER_ROLES } = require('../middleware/authMiddleware'); 

router.get('/', async (req, res) => {
    const { course_id, taught_by_me } = req.query;
    const requestingUser = req.user;

    try {
        let query = `
            SELECT s.*, c.name as course_name, u.fullName as faculty_name 
            FROM sections s
            JOIN courses c ON s.course_id = c.id
            LEFT JOIN users u ON s.faculty_user_id = u.id
        `;
        const queryParams = [];
        let conditions = [];

        if (course_id) {
            conditions.push('s.course_id = ?');
            queryParams.push(course_id);
        }
        
        if (taught_by_me === 'true' && requestingUser.role === USER_ROLES.FACULTY) {
            conditions.push('s.faculty_user_id = ?');
            queryParams.push(requestingUser.id);
        } else if (taught_by_me === 'true' && requestingUser.role !== USER_ROLES.ADMIN) {
             return res.status(403).json({ msg: 'Access denied for this filter.' });
        }


        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY c.name ASC, s.section_name ASC';

        const [sections] = await pool.query(query, queryParams);
        res.json(sections);
    } catch (err) {
        console.error('Error fetching sections:', err.message, err.stack);
        res.status(500).send('Server Error: Could not fetch sections');
    }
});

router.post('/', isAdmin, async (req, res) => {
    const { course_id, faculty_user_id, section_name, semester, year } = req.body;
    if (!course_id || !section_name) {
        return res.status(400).json({ msg: 'Course ID and Section Name are required' });
    }
    try {
        const newSection = {
            course_id,
            faculty_user_id: faculty_user_id || null,
            section_name,
            semester: semester || null,
            year: year || null
        };
        const [result] = await pool.query('INSERT INTO sections SET ?', newSection);
        const [createdSection] = await pool.query(`
            SELECT s.*, c.name as course_name, u.fullName as faculty_name 
            FROM sections s
            JOIN courses c ON s.course_id = c.id
            LEFT JOIN users u ON s.faculty_user_id = u.id
            WHERE s.id = ?
        `, [result.insertId]);
        res.status(201).json(createdSection[0]);
    } catch (err) {
        console.error('Error creating section:', err.message);
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ msg: 'Invalid Course ID or Faculty User ID.' });
        }
        if (err.code === 'ER_DUP_ENTRY') {
             return res.status(400).json({ msg: 'A section with this name, course, semester, and year already exists.' });
        }
        res.status(500).send('Server Error: Could not create section');
    }
});

router.put('/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { course_id, faculty_user_id, section_name, semester, year } = req.body;

    try {
        const [existingSection] = await pool.query('SELECT * FROM sections WHERE id = ?', [id]);
        if (existingSection.length === 0) {
            return res.status(404).json({ msg: 'Section not found' });
        }

        const updateFields = {};
        if (course_id) updateFields.course_id = course_id;
        if (faculty_user_id !== undefined) updateFields.faculty_user_id = faculty_user_id; 
        if (section_name) updateFields.section_name = section_name;
        if (semester) updateFields.semester = semester;
        if (year) updateFields.year = year;
        
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ msg: 'No fields to update provided.' });
        }

        await pool.query('UPDATE sections SET ? WHERE id = ?', [updateFields, id]);
        const [updatedSection] = await pool.query(`
            SELECT s.*, c.name as course_name, u.fullName as faculty_name 
            FROM sections s
            JOIN courses c ON s.course_id = c.id
            LEFT JOIN users u ON s.faculty_user_id = u.id
            WHERE s.id = ?
        `, [id]);
        res.json(updatedSection[0]);
    } catch (err) {
        console.error('Error updating section:', err.message);
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ msg: 'Invalid Course ID or Faculty User ID.' });
        }
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ msg: 'This section (name, course, semester, year combination) already exists for another section.' });
        }
        res.status(500).send('Server Error: Could not update section');
    }
});

router.delete('/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [existingSection] = await pool.query('SELECT * FROM sections WHERE id = ?', [id]);
        if (existingSection.length === 0) {
            return res.status(404).json({ msg: 'Section not found' });
        }
        await pool.query('DELETE FROM sections WHERE id = ?', [id]);
        res.json({ msg: 'Section deleted successfully' });
    } catch (err) {
        console.error('Error deleting section:', err.message);
        res.status(500).send('Server Error: Could not delete section');
    }
});

module.exports = router;
    