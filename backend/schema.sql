-- Drop tables in reverse order of dependency to avoid foreign key constraint errors
DROP TABLE IF EXISTS PasswordResets;
DROP TABLE IF EXISTS LabChangeRequests;
DROP TABLE IF EXISTS Bookings;
DROP TABLE IF EXISTS Equipment;
DROP TABLE IF EXISTS Sections;
DROP TABLE IF EXISTS Labs;
DROP TABLE IF EXISTS Courses;
DROP TABLE IF EXISTS Users;

-- Users Table
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'faculty', 'assistant', 'student') NOT NULL,
    contact_number VARCHAR(20) NULL,
    department VARCHAR(100) NULL,         -- For faculty/assistant
    employee_id VARCHAR(50) NULL UNIQUE,   -- For faculty/assistant
    enrollment_number VARCHAR(50) NULL UNIQUE, -- For student
    course VARCHAR(100) NULL,             -- For student (could be normalized further in a real system)
    section VARCHAR(50) NULL,             -- For student (could be normalized further)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Courses Table
CREATE TABLE Courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NULL, -- e.g., Computer Science, Electrical Engineering
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sections Table (represents a specific offering of a course)
CREATE TABLE Sections (
    section_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    name VARCHAR(100) NOT NULL, -- e.g., "Section A", "CS101-001"
    semester VARCHAR(50) NOT NULL, -- e.g., "Fall 2023", "Spring 2024"
    year INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE RESTRICT -- Prevent deleting course if sections exist
);

-- Labs Table
CREATE TABLE Labs (
    lab_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    room_number VARCHAR(50) NULL UNIQUE,
    capacity INT NOT NULL,
    type VARCHAR(100) NULL, -- e.g., "Computer Lab", "Electronics Lab", "Wet Lab"
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Equipment Table
CREATE TABLE Equipment (
    equipment_id INT AUTO_INCREMENT PRIMARY KEY,
    lab_id INT NULL, -- Equipment can be unassigned or assigned to a specific lab
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    type VARCHAR(100) NOT NULL, -- e.g., "Microscope", "Oscilloscope", "PC"
    quantity INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'Available', -- e.g., Available, In Use, Under Maintenance, Out of Order
    purchase_date DATE NULL,
    last_maintenance_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES Labs(lab_id) ON DELETE SET NULL -- If lab is deleted, equipment becomes unassigned
);

-- Bookings Table
CREATE TABLE Bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    lab_id INT NOT NULL,
    user_id INT NULL, -- Faculty/User who booked or is assigned the slot
    section_id INT NULL, -- Section for which the lab is booked
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    purpose VARCHAR(255) NULL,
    status VARCHAR(50) DEFAULT 'Scheduled', -- e.g., Scheduled, Cancelled, Completed
    created_by_user_id INT NULL, -- User who created this booking (e.g. admin via manual booking or scheduler run)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES Labs(lab_id) ON DELETE RESTRICT, -- Don't delete lab if bookings exist
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL, -- If user deleted, booking remains but unassigned
    FOREIGN KEY (section_id) REFERENCES Sections(section_id) ON DELETE SET NULL, -- If section deleted, booking remains but section link removed
    FOREIGN KEY (created_by_user_id) REFERENCES Users(user_id) ON DELETE SET NULL,
    INDEX idx_bookings_start_time (start_time),
    INDEX idx_bookings_lab_id_start_time (lab_id, start_time) -- For overlap checks
);

-- PasswordResets Table
CREATE TABLE PasswordResets (
    reset_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE -- If user is deleted, their reset tokens are also deleted
);

-- LabChangeRequests Table (for faculty requesting changes to existing bookings)
CREATE TABLE LabChangeRequests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    faculty_user_id INT NOT NULL, -- The faculty member requesting the change
    requested_change_details TEXT NOT NULL, -- Description of what they want to change (e.g., new time, different lab)
    reason TEXT NULL, -- Reason for the change
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Denied
    admin_remarks TEXT NULL, -- Remarks from the admin who processed the request
    processed_by_user_id INT NULL, -- Admin user_id who processed it
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME NULL,
    FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id) ON DELETE CASCADE, -- If original booking is deleted, request is also deleted
    FOREIGN KEY (faculty_user_id) REFERENCES Users(user_id) ON DELETE CASCADE, -- If faculty deleted, their requests are also deleted
    FOREIGN KEY (processed_by_user_id) REFERENCES Users(user_id) ON DELETE SET NULL -- If admin deleted, keep record but disassociate processor
);

-- Sample Data (Optional - uncomment and modify as needed for testing)

-- Add a default admin user (password: "password123")
-- You SHOULD change this password immediately if used.
-- Hashed password for "password123": $2a$10$ RANDOM_SALT_HERE_REPLACE_ME
-- INSERT INTO Users (full_name, email, password_hash, role) VALUES
-- ('Admin User', 'admin@lablink.com', '$2a$10$V8qFB397S91iNPh/i20sR.vx0n1G9S2kG/XEHAxbr3zHKGSrBvNua', 'admin');
-- ('Faculty User', 'faculty@lablink.com', '$2a$10$V8qFB397S91iNPh/i20sR.vx0n1G9S2kG/XEHAxbr3zHKGSrBvNua', 'faculty');
-- ('Student User', 'student@lablink.com', '$2a$10$V8qFB397S91iNPh/i20sR.vx0n1G9S2kG/XEHAxbr3zHKGSrBvNua', 'student');

-- INSERT INTO Courses (name, department) VALUES
-- ('Introduction to Programming', 'Computer Science'),
-- ('Digital Electronics', 'Electrical Engineering');

-- INSERT INTO Sections (course_id, name, semester, year) VALUES
-- (1, 'CS101-Fall23-A', 'Fall', 2023),
-- (2, 'EE201-Fall23-A', 'Fall', 2023);

-- INSERT INTO Labs (name, room_number, capacity, type) VALUES
-- ('Computer Lab 1', 'CL101', 30, 'Computer Lab'),
-- ('Electronics Lab A', 'EL-A', 20, 'Electronics Lab');
```
These `ON DELETE` policies provide a good balance between maintaining data integrity and preserving historical records where appropriate. Remember to drop your existing tables (if they exist and you don't need the data) and apply this schema fresh to ensure your database structure is correct.