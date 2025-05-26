
-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    passwordHash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(255),
    resetPasswordToken VARCHAR(255) DEFAULT NULL,
    resetPasswordExpires DATETIME DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Labs Table
CREATE TABLE IF NOT EXISTS labs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    roomNumber VARCHAR(50) NOT NULL,
    location VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Equipment Table
CREATE TABLE IF NOT EXISTS equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'available', -- e.g., available, in-use, maintenance, broken
    labId INT, -- Foreign key to labs table, can be NULL if equipment is not assigned
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (labId) REFERENCES labs(id) ON DELETE SET NULL
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    labId INT NOT NULL,
    userId INT NOT NULL,
    date DATE NOT NULL,
    timeSlotId VARCHAR(50) NOT NULL, -- Assuming timeSlotId is a string identifier like 'ts_0900_1000'
    purpose TEXT,
    equipmentIds JSON, -- Store as JSON array of equipment IDs, or use a junction table
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- e.g., pending, booked, rejected, cancelled, pending-admin-approval, approved-by-admin, rejected-by-admin
    requestedByRole VARCHAR(50),
    batchIdentifier VARCHAR(255),
    submittedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (labId) REFERENCES labs(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Lab Seat Statuses Table
CREATE TABLE IF NOT EXISTS lab_seat_statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    labId INT NOT NULL,
    seatIndex VARCHAR(50) NOT NULL, -- e.g., "0", "1", etc. or more descriptive like "A1"
    status VARCHAR(20) NOT NULL DEFAULT 'working', -- 'working' or 'not-working'
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_seat (labId, seatIndex), -- Ensures one status entry per seat per lab
    FOREIGN KEY (labId) REFERENCES labs(id) ON DELETE CASCADE
);

-- Example seed data (optional, for testing)
-- INSERT INTO users (fullName, email, passwordHash, role) VALUES 
-- ('Admin User', 'admin@example.com', '$2a$10$yourbcryptgeneratedhash', 'Admin'),
-- ('Faculty User', 'faculty@example.com', '$2a$10$anotherhash', 'Faculty');

-- INSERT INTO labs (name, capacity, roomNumber, location) VALUES
-- ('Computer Lab Alpha', 30, 'CL-101', 'Block A, Floor 1'),
-- ('Physics Lab Beta', 25, 'PL-205', 'Block B, Floor 2');
