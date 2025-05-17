
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../../.env' }); // Adjust if .env is in backend root

module.exports = function(req, res, next) {
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

// Example role-based authorization middleware (can be expanded)
// module.exports.isAdmin = function(req, res, next) {
//     if (req.user && req.user.role === 'Admin') {
//         next();
//     } else {
//         res.status(403).json({ msg: 'Access denied. Admin role required.' });
//     }
// };

    