
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// This basic 'auth' middleware tries to decode the token and attach user to req.
// It doesn't block the request if the token is missing or invalid,
// allowing routes to be public or to specifically check for req.user.
function auth(req, res, next) {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded; // Adds { userId, role, fullName, ... } to request object
        } catch (error) {
            // Invalid token, don't attach user, but don't block request.
            // Routes that require authentication must check for req.user.
            console.warn("Auth middleware: Invalid or expired token.");
        }
    }
    next();
}

// 'authorize' middleware factory to check for specific roles.
// This middleware MUST be used after the 'auth' middleware.
function authorize(roles = []) {
    // Ensure roles is an array
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        // Check if 'auth' middleware successfully attached user and user has a role
        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: 'Authentication required. Please log in.' });
        }

        // Check if user's role is included in the allowed roles
        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: You do not have the required role for this action.' });
        }

        next(); // User has the required role, proceed
    };
}


module.exports = { auth, authorize };
