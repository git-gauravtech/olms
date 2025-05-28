
-- Drop tables if they exist to ensure a clean setup, especially during development.
-- In a production environment, you would use ALTER TABLE for modifications.
DROP TABLE IF EXISTS lab_seat_statuses;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS equipment;
DROP TABLE IF EXISTS labs;
DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    passwordHash VARCHAR(255) NOT NULL,
    secretWordHash VARCHAR(255) NOT NULL, -- Added for secret word
    role VARCHAR(50) NOT NULL,
    department VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resetPasswordToken VARCHAR(255) DEFAULT NULL,
    resetPasswordExpires DATETIME DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS labs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    roomNumber VARCHAR(50) NOT NULL,
    location VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'available', -- e.g., available, in-use, maintenance
    labId INT, -- Foreign key to labs table, can be NULL if equipment is not assigned
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (labId) REFERENCES labs(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    labId INT NOT NULL,
    userId INT NOT NULL,
    date DATE NOT NULL,
    timeSlotId VARCHAR(50) NOT NULL, -- Assuming timeSlotId is a string identifier like 'ts_0900_1000'
    purpose TEXT,
    equipmentIds JSON, -- Store as JSON array of equipment IDs, or use a junction table
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- e.g., pending, booked, rejected, cancelled, pending-admin-approval
    requestedByRole VARCHAR(50),
    batchIdentifier VARCHAR(255),
    submittedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (labId) REFERENCES labs(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lab_seat_statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    labId INT NOT NULL,
    seatIndex VARCHAR(50) NOT NULL, -- Combined identifier like 'labId_seatIndex_row_col' or just an index '0', '1' etc.
    status VARCHAR(20) NOT NULL DEFAULT 'working', -- 'working' or 'not-working'
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (labId) REFERENCES labs(id) ON DELETE CASCADE,
    UNIQUE KEY `unique_seat_in_lab` (labId, seatIndex) -- Ensures a seat index is unique per lab
);

-- Example: Insert initial Admin user (replace with your desired credentials)
-- Make sure to hash the password and secret word appropriately if inserting manually.
-- This is commented out as user creation should ideally happen via the signup form.
/*
INSERT INTO users (fullName, email, passwordHash, secretWordHash, role)
VALUES ('Admin User', 'admin@example.com', '$2a$10$your_bcrypt_hashed_password_here', '$2a$10$your_bcrypt_hashed_secret_word_here', 'Admin');
*/
