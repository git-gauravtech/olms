
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' }); // Adjust if .env is in backend root

function auth(req, res, next) {
    // Get token from header
    const authHeader = req.header('Authorization'); // Expect 'Bearer TOKEN'

    if (!authHeader) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ msg: 'Token error, format is "Bearer token"' });
    }
    const token = parts[1];

    if (!token) {
        return res.status(401).json({ msg: 'No token found after Bearer, authorization denied' });
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
        // console.log('Access denied. User role:', req.user ? req.user.role : 'undefined');
        res.status(403).json({ msg: 'Access denied. Admin role required.' });
    }
};

module.exports = { auth, isAdmin };
