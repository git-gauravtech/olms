
-- Main Tables
CREATE TABLE IF NOT EXISTS Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'faculty', 'assistant', 'student') NOT NULL,
    contact_number VARCHAR(20),
    department VARCHAR(100), -- For faculty, assistant
    employee_id VARCHAR(50), -- For faculty, assistant
    enrollment_number VARCHAR(50), -- For student
    course VARCHAR(100), -- For student (e.g., B.Tech CSE)
    section VARCHAR(50), -- For student (e.g., Section A)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100), -- e.g., Computer Science, Electrical Engineering
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Sections (
    section_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    name VARCHAR(100) NOT NULL, -- e.g., Section A, Section B, Morning Batch
    semester VARCHAR(50) NOT NULL, -- e.g., Fall, Spring, 1st, 2nd
    year INT NOT NULL, -- e.g., 2023
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE, -- If a course is deleted, its sections are deleted
    UNIQUE KEY (course_id, name, semester, year) -- Ensure section uniqueness within a course for a given term
);

CREATE TABLE IF NOT EXISTS Labs (
    lab_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    room_number VARCHAR(50),
    capacity INT NOT NULL,
    type VARCHAR(100), -- e.g., Computer Lab, Physics Lab, Chemistry Lab
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Equipment (
    equipment_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100) NOT NULL, -- e.g., Microscope, Oscilloscope, PC
    quantity INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'Available', -- e.g., Available, In Use, Under Maintenance, Out of Order
    lab_id INT, -- Optional: If equipment is specific to a lab
    purchase_date DATE,
    last_maintenance_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES Labs(lab_id) ON DELETE SET NULL -- If lab is deleted, equipment becomes unassigned
);

-- Booking/Scheduling Table
CREATE TABLE IF NOT EXISTS Bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    lab_id INT NOT NULL,
    user_id INT, -- User (faculty) who booked or is responsible for the lab session
    section_id INT, -- Section for which the lab is booked
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    purpose TEXT,
    status VARCHAR(50) DEFAULT 'Scheduled', -- e.g., Scheduled, Cancelled, Completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES Labs(lab_id) ON DELETE CASCADE, -- If a lab is deleted, its bookings are deleted
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL, -- If user is deleted, booking remains but user_id becomes NULL
    FOREIGN KEY (section_id) REFERENCES Sections(section_id) ON DELETE SET NULL, -- If section is deleted, booking remains but section_id becomes NULL
    INDEX (lab_id, start_time, end_time) -- For quick check of lab availability
);

-- Table for Faculty Lab Change Requests
CREATE TABLE IF NOT EXISTS LabChangeRequests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    user_id INT NOT NULL, -- Faculty who made the request
    requested_changes TEXT NOT NULL, -- Description of what they want to change (e.g., different time, different lab, notes)
    reason TEXT, -- Reason for the change
    status ENUM('Pending', 'Approved', 'Denied', 'Cancelled') DEFAULT 'Pending',
    admin_remarks TEXT, -- Remarks from admin when processing
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    processed_by_admin_id INT NULL,
    FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id) ON DELETE CASCADE, -- If original booking is deleted, request is irrelevant
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE, -- If user (faculty) is deleted
    FOREIGN KEY (processed_by_admin_id) REFERENCES Users(user_id) ON DELETE SET NULL
);


-- Example Insert Statements (Optional - for testing)

-- Users
-- INSERT INTO Users (full_name, email, password_hash, role) VALUES 
-- ('Admin User', 'admin@example.com', '$2a$10$...', 'admin'), -- Replace ... with a valid bcrypt hash
-- ('Faculty One', 'faculty1@example.com', '$2a$10$...', 'faculty'),
-- ('Student One', 'student1@example.com', '$2a$10$...', 'student');

-- Courses
-- INSERT INTO Courses (name, department) VALUES 
-- ('Introduction to Programming', 'Computer Science'),
-- ('Data Structures', 'Computer Science'),
-- ('Circuit Theory', 'Electrical Engineering');

-- Sections
-- INSERT INTO Sections (course_id, name, semester, year) VALUES
-- (1, 'A', 'Fall', 2023),
-- (1, 'B', 'Fall', 2023),
-- (2, 'A', 'Spring', 2024);

-- Labs
-- INSERT INTO Labs (name, room_number, capacity, type) VALUES
-- ('CS Lab 1', '101', 30, 'Computer Lab'),
-- ('Electronics Lab A', '203', 20, 'Electronics Lab');

-- Bookings (Example - Ensure user_id, section_id, lab_id exist)
-- INSERT INTO Bookings (lab_id, user_id, section_id, start_time, end_time, purpose) VALUES
-- (1, 2, 1, '2023-10-01 09:00:00', '2023-10-01 11:00:00', 'Intro to Python Lab'),
-- (1, 2, 1, '2023-10-03 09:00:00', '2023-10-03 11:00:00', 'Intro to Python Lab');

