
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const [courses] = await pool.query('SELECT * FROM courses ORDER BY name ASC');
        res.json(courses);
    } catch (err) {
        console.error('Error fetching courses:', err.message);
        res.status(500).send('Server Error: Could not fetch courses');
    }
});

router.post('/', async (req, res) => {
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

router.put('/:id', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
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
        res.status(500).send('Server Error: Could not delete course');
    }
});

module.exports = router;
    