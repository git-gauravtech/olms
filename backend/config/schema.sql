-- SQL Schema for Optimized Lab Management System

-- Make sure to create your database first, e.g., CREATE DATABASE lab_management_db;
-- Then connect to it, e.g., USE lab_management_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    passwordHash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- Admin, Faculty, Student, Assistant
    department VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resetPasswordToken VARCHAR(255) DEFAULT NULL, -- Store a HASH of the reset token
    resetPasswordExpires DATETIME DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS labs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    roomNumber VARCHAR(50) NOT NULL,
    location VARCHAR(255), -- For Dijkstra's algorithm or general info
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'available', -- e.g., available, in-use, maintenance, broken
    labId INT, -- Foreign key to labs table, can be NULL if equipment is not assigned
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (labId) REFERENCES labs(id) ON DELETE SET NULL -- If lab is deleted, equipment becomes unassigned
);

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    labId INT NOT NULL,
    userId INT NOT NULL,
    date DATE NOT NULL,
    timeSlotId VARCHAR(50) NOT NULL, -- Assuming timeSlotId is a string identifier like 'ts_0900_1000'
    purpose TEXT,
    equipmentIds JSON, -- Store as JSON array of equipment IDs. Requires MySQL 5.7.8+
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- e.g., pending, booked, rejected, cancelled, pending-admin-approval
    requestedByRole VARCHAR(50), -- Role of the user who initiated the request (e.g., Faculty, Assistant)
    batchIdentifier VARCHAR(255), -- For Assistant/CR bookings, e.g., "CSE Year 2 - Section A"
    submittedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (labId) REFERENCES labs(id) ON DELETE CASCADE, -- If a lab is deleted, its bookings are deleted
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE -- If a user is deleted, their bookings are deleted
);

CREATE TABLE IF NOT EXISTS lab_seat_statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    labId INT NOT NULL,
    seatIndex VARCHAR(50) NOT NULL, -- Using VARCHAR for flexibility e.g., "A1", "desk_15" or just "0", "1"
    status VARCHAR(20) NOT NULL DEFAULT 'working', -- 'working' or 'not-working'
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (labId) REFERENCES labs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_seat_in_lab (labId, seatIndex) -- Ensures each seat in a lab has only one status entry
);

-- Example: Add an Admin user (replace with your desired credentials)
-- Make sure to hash the password properly if inserting directly; better to use the /api/auth/signup endpoint.
-- INSERT INTO users (fullName, email, passwordHash, role)
-- VALUES ('Admin User', 'admin@example.com', '$2a$10$somebcryptgeneratedhash', 'Admin');

-- Note on timeSlotId:
-- If your time slots are dynamic and managed by admins, you might want a separate `time_slots` table.
-- For this project, we're assuming timeSlotId refers to predefined constant IDs (like 'ts_0800_0900').

-- Note on equipmentIds in bookings:
-- Storing as JSON is convenient but less relational.
-- An alternative is a junction table like `booking_equipment (bookingId, equipmentId)`.
-- For simplicity, JSON is used here. Ensure your MySQL version supports the JSON data type.
