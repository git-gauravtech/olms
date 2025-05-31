
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' }); // Adjust if .env is in backend root

// Define USER_ROLES for backend consistency, mirroring frontend's js/constants.js
const USER_ROLES = {
  ADMIN: 'Admin',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
  ASSISTANT: 'Assistant',
};

/**
 * Authentication middleware.
 * Verifies the JWT token from the Authorization header.
 * If valid, attaches the user payload (id, role) to req.user.
 */
function auth(req, res, next) {
    // Get token from header
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'Token error, format is "Bearer token"' });
    }

    const token = authHeader.substring(7, authHeader.length); // Extract token part

    if (!token) {
        return res.status(401).json({ msg: 'No token found after Bearer, authorization denied' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Add user from payload
        req.user = decoded.user; // req.user should contain id and role
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        console.error("Token verification error:", err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
}

/**
 * Admin authorization middleware.
 * Checks if the authenticated user has the 'Admin' role.
 * Must be used after the `auth` middleware.
 */
function isAdmin(req, res, next) {
    if (req.user && req.user.role === USER_ROLES.ADMIN) {
        next(); // User is Admin, proceed
    } else {
        console.log('Access denied for isAdmin. User role:', req.user ? req.user.role : 'undefined');
        res.status(403).json({ msg: 'Access denied. Admin role required.' });
    }
}

module.exports = { auth, isAdmin, USER_ROLES }; // Export USER_ROLES if needed by other backend modules
    