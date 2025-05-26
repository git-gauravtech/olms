-- SQL Schema for Optimized Lab Management System

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    passwordHash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- e.g., 'Admin', 'Faculty', 'Student', 'Assistant'
    department VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resetPasswordToken VARCHAR(255) DEFAULT NULL,
    resetPasswordExpires DATETIME DEFAULT NULL
);

-- Labs Table
CREATE TABLE IF NOT EXISTS labs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    roomNumber VARCHAR(50) NOT NULL,
    location VARCHAR(255), -- For Dijkstra's algorithm potential use
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Equipment Table
CREATE TABLE IF NOT EXISTS equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'available', -- e.g., 'available', 'in-use', 'maintenance', 'broken'
    labId INT, -- Foreign key to labs table, can be NULL if equipment is not assigned to a specific lab
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (labId) REFERENCES labs(id) ON DELETE SET NULL -- If lab is deleted, equipment becomes unassigned
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    labId INT NOT NULL,
    userId INT NOT NULL, -- User who made the booking or is associated with the class
    date DATE NOT NULL,
    timeSlotId VARCHAR(50) NOT NULL, -- e.g., 'ts_0900_1000', maps to predefined time slots
    purpose TEXT,
    equipmentIds JSON, -- Store as JSON array of equipment IDs, or use a junction table for many-to-many
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- e.g., 'pending', 'booked', 'rejected', 'cancelled', 'pending-admin-approval', 'approved-by-admin', 'rejected-by-admin'
    requestedByRole VARCHAR(50), -- Role of the user who initiated the request/booking (e.g., Faculty, Assistant)
    batchIdentifier VARCHAR(255), -- For class bookings, e.g., 'CSE Year 2 - Section A'
    submittedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (labId) REFERENCES labs(id) ON DELETE CASCADE, -- If a lab is deleted, its bookings are removed
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE -- If a user is deleted, their bookings are removed
);

-- Lab Seat Statuses Table
CREATE TABLE IF NOT EXISTS lab_seat_statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    labId INT NOT NULL,
    seatIndex VARCHAR(50) NOT NULL, -- Using VARCHAR to allow for flexible seat IDs e.g., "0", "A1", etc.
    status VARCHAR(20) NOT NULL DEFAULT 'working', -- e.g., 'working', 'not-working'
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (labId) REFERENCES labs(id) ON DELETE CASCADE,
    UNIQUE KEY `unique_seat_in_lab` (labId, seatIndex) -- Ensures each seat in a lab has only one status entry
);

-- Example: Add a default Admin user (optional, for initial setup)
-- Ensure to change the password after first login if using a default
-- INSERT INTO users (fullName, email, passwordHash, role) VALUES ('Admin User', 'admin@example.com', '$2a$10$YOUR_STRONG_DEFAULT_HASH_HERE', 'Admin')
-- To generate a hash for bcrypt:
-- const bcrypt = require('bcryptjs');
-- const salt = await bcrypt.genSalt(10);
-- const hashedPassword = await bcrypt.hash('adminpassword', salt);
-- console.log(hashedPassword);
-- Replace '$2a$10$YOUR_STRONG_DEFAULT_HASH_HERE' with the generated hash.
