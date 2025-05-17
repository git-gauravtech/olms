
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' }); // Adjust if .env is in backend root

function auth(req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token'); // Or from 'Authorization: Bearer TOKEN'

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // Add user from payload to request object
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        console.log('Access denied. User role:', req.user ? req.user.role : 'undefined');
        res.status(403).json({ msg: 'Access denied. Admin role required.' });
    }
};

module.exports = { auth, isAdmin };
