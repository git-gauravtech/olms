
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Database connection (just to ensure it's loaded, actual queries are in routes)
require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes'); // New
const sectionRoutes = require('./routes/sectionRoutes'); // New
const bookingRoutes = require('./routes/bookingRoutes'); // Existing
// Add other routes here as they are created
// const userRoutes = require('./routes/userRoutes');
// const labRoutes = require('./routes/labRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes); // New
app.use('/api/sections', sectionRoutes); // New
app.use('/api/bookings', bookingRoutes); // Existing
// app.use('/api/users', userRoutes);
// app.use('/api/labs', labRoutes);


// Basic error handling middleware (example)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message: 'Something broke!', error: err.message });
});


// Define the port
const PORT = process.env.PORT || 5001;

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
});
