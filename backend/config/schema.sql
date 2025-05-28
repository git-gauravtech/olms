
-- Ensure you are using the correct database
-- USE lab_management_db;

-- Drop tables if they exist to start fresh (optional, use with caution in development)
-- SET FOREIGN_KEY_CHECKS = 0;
-- DROP TABLE IF EXISTS lab_seat_statuses;
-- DROP TABLE IF EXISTS bookings;
-- DROP TABLE IF EXISTS equipment;
-- DROP TABLE IF EXISTS labs;
-- DROP TABLE IF EXISTS users;
-- SET FOREIGN_KEY_CHECKS = 1;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    passwordHash VARCHAR(255) NOT NULL,
    secretWordHash VARCHAR(255) NOT NULL COMMENT 'Hashed secret word for password recovery validation',
    role VARCHAR(50) NOT NULL COMMENT 'Admin, Faculty, Student, Assistant',
    department VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resetPasswordToken VARCHAR(255) DEFAULT NULL COMMENT 'Hashed token for password reset process',
    resetPasswordExpires DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Labs Table
CREATE TABLE IF NOT EXISTS labs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    roomNumber VARCHAR(50) NOT NULL,
    location VARCHAR(255), -- For Dijkstra's algorithm or general info
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Equipment Table
CREATE TABLE IF NOT EXISTS equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'available' COMMENT 'available, in-use, maintenance, broken',
    labId INT, -- Foreign key to labs table, can be NULL if equipment is not assigned to a specific lab
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (labId) REFERENCES labs(id) ON DELETE SET NULL ON UPDATE CASCADE -- If lab is deleted, equipment becomes unassigned
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    labId INT NOT NULL,
    userId INT NOT NULL COMMENT 'User who made the booking or for whom it is made (e.g., Faculty ID)',
    date DATE NOT NULL,
    timeSlotId VARCHAR(50) NOT NULL COMMENT 'Identifier for predefined time slots, e.g., ts_0900_1000',
    purpose TEXT,
    equipmentIds JSON COMMENT 'JSON array of equipment IDs requested/assigned, e.g., [1, 5, 12]',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT 'pending, booked, rejected, cancelled, pending-admin-approval, approved-by-admin, rejected-by-admin',
    requestedByRole VARCHAR(50) COMMENT 'Role of the user who initiated the request/booking',
    batchIdentifier VARCHAR(255) COMMENT 'e.g., CS101_SecA, PHY202_Batch1 for class/section bookings',
    submittedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (labId) REFERENCES labs(id) ON DELETE CASCADE ON UPDATE CASCADE, -- If lab is deleted, associated bookings are removed
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE -- If user is deleted, their bookings are removed
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lab Seat Statuses Table
CREATE TABLE IF NOT EXISTS lab_seat_statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    labId INT NOT NULL,
    seatIndex VARCHAR(50) NOT NULL COMMENT 'Identifier for the seat/system, e.g., "0", "1", "S1A"',
    status VARCHAR(20) NOT NULL DEFAULT 'working' COMMENT 'working, not-working',
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (labId) REFERENCES labs(id) ON DELETE CASCADE ON UPDATE CASCADE, -- If lab is deleted, its seat statuses are removed
    UNIQUE KEY `unique_lab_seat` (labId, seatIndex) -- Ensures only one status per seat per lab
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: Time slots are managed as constants in js/constants.js for this project.
-- If you decide to make them database-driven, you would uncomment and use a table like the one below.
-- CREATE TABLE IF NOT EXISTS time_slots (
--     id VARCHAR(50) PRIMARY KEY,
--     startTime TIME NOT NULL,
--     endTime TIME NOT NULL,
--     displayTime VARCHAR(100) NOT NULL -- e.g., '09:00 AM - 11:00 AM'
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -- Example inserts for time_slots (if using the table above)
-- INSERT INTO time_slots (id, startTime, endTime, displayTime) VALUES
-- ('ts_0800_0900', '08:00:00', '09:00:00', '08:00 AM - 09:00 AM'),
-- ('ts_0900_1000', '09:00:00', '10:00:00', '09:00 AM - 10:00 AM'),
-- -- Add other time slots as needed...
-- ('ts_1700_1800', '17:00:00', '18:00:00', '05:00 PM - 06:00 PM');


-- Adding some indexes for performance on frequently queried columns
CREATE INDEX idx_bookings_lab_date_slot ON bookings (labId, date, timeSlotId);
CREATE INDEX idx_bookings_user ON bookings (userId);
CREATE INDEX idx_equipment_lab ON equipment (labId);
CREATE INDEX idx_users_email ON users (email);
