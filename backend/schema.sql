
-- LabLink Database Schema

-- Users Table: Stores information about all users of the system.
CREATE TABLE IF NOT EXISTS Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'faculty', 'assistant', 'student') NOT NULL,
    contact_number VARCHAR(20) NULL,
    -- Role-specific fields (nullable as they depend on role)
    department VARCHAR(100) NULL,         -- For faculty/assistant
    employee_id VARCHAR(50) NULL UNIQUE,  -- For faculty/assistant
    enrollment_number VARCHAR(50) NULL UNIQUE, -- For student
    course VARCHAR(100) NULL,             -- For student (e.g., B.Tech, M.Sc.)
    section VARCHAR(50) NULL,             -- For student (e.g., A, B1)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
,    email VARCHAR(255) NOT NULL UNIQUE
    INDEX idx_user_role (role),
    INDEX idx_user_email (email)
);

-- Courses Table: Stores information about academic courses.
CREATE TABLE IF NOT EXISTS Courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NULL, -- e.g., Computer Science, Electrical Engineering
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_course_name (name)
);

-- Sections Table: Stores information about specific sections of courses.
CREATE TABLE IF NOT EXISTS Sections (
    section_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    name VARCHAR(100) NOT NULL, -- e.g., "A", "B", "Morning Batch"
    semester VARCHAR(50) NOT NULL, -- e.g., "Fall", "Spring", "Semester 1"
    year INT NOT NULL, -- e.g., 2023
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE, -- If a course is deleted, its sections are also deleted.
    INDEX idx_section_course (course_id),
    UNIQUE KEY uq_section_course_name_sem_year (course_id, name, semester, year) -- Ensures section uniqueness within a course, semester, and year
);

-- Labs Table: Stores information about physical or virtual laboratories.
CREATE TABLE IF NOT EXISTS Labs (
    lab_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    room_number VARCHAR(50) NULL,
    capacity INT NOT NULL,
    type VARCHAR(100) NULL, -- e.g., "Computer Lab", "Physics Lab", "Wet Lab"
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_lab_name (name)
);

-- Equipment Table: Stores information about lab equipment.
CREATE TABLE IF NOT EXISTS Equipment (
    equipment_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    type VARCHAR(100) NOT NULL, -- e.g., "Microscope", "Oscilloscope", "PC"
    quantity INT DEFAULT 1,
    status ENUM('Available', 'In Use', 'Under Maintenance', 'Out of Order') DEFAULT 'Available',
    lab_id INT NULL, -- Optional: If equipment is specific to one lab
    purchase_date DATE NULL,
    last_maintenance_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES Labs(lab_id) ON DELETE SET NULL, -- If lab is deleted, equipment becomes unassigned.
    INDEX idx_equipment_name (name),
    INDEX idx_equipment_lab (lab_id)
);

-- Bookings Table: Stores information about lab bookings/schedules.
CREATE TABLE IF NOT EXISTS Bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    lab_id INT NOT NULL,
    user_id INT NULL, -- Faculty who booked it, or admin if system-generated
    section_id INT NULL, -- Section for which the lab is booked
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    purpose TEXT NULL,
    status ENUM('Scheduled', 'Cancelled', 'Completed', 'Tentative') DEFAULT 'Scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES Labs(lab_id) ON DELETE CASCADE, -- If lab is deleted, bookings for it are deleted.
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL, -- If user is deleted, booking remains but user_id is nulled.
    FOREIGN KEY (section_id) REFERENCES Sections(section_id) ON DELETE SET NULL, -- If section is deleted, booking remains but section_id is nulled.
    INDEX idx_booking_lab_time (lab_id, start_time, end_time),
    INDEX idx_booking_user (user_id),
    INDEX idx_booking_section (section_id)
);

-- LabChangeRequests Table: Stores requests from faculty to change lab bookings.
CREATE TABLE IF NOT EXISTS LabChangeRequests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    faculty_user_id INT NOT NULL, -- User (faculty) who requested the change
    requested_change_details TEXT NOT NULL, -- Details of what change is being requested
    reason TEXT NOT NULL, -- Reason for the change
    status ENUM('Pending', 'Approved', 'Denied') DEFAULT 'Pending',
    admin_remarks TEXT NULL, -- Remarks from the admin processing the request
    processed_by_user_id INT NULL, -- Admin user who processed the request
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME NULL, -- When the request was processed
    FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by_user_id) REFERENCES Users(user_id) ON DELETE SET NULL,
    INDEX idx_lcr_booking (booking_id),
    INDEX idx_lcr_faculty (faculty_user_id),
    INDEX idx_lcr_status (status)
);

-- PasswordResets Table: Stores tokens for password reset functionality.
CREATE TABLE IF NOT EXISTS PasswordResets (
    reset_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE, -- If user is deleted, their reset tokens are also deleted.
    INDEX idx_pr_token (token)
);

-- Optional: ActivityLog Table (Example - can be expanded)
-- CREATE TABLE IF NOT EXISTS ActivityLog (
--     log_id INT AUTO_INCREMENT PRIMARY KEY,
--     user_id INT NULL, -- User who performed the action, if applicable
--     action_type VARCHAR(100) NOT NULL, -- e.g., "LOGIN", "BOOKING_CREATED", "USER_UPDATED"
--     details TEXT NULL, -- JSON or text details about the action
--     ip_address VARCHAR(45) NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL,
--     INDEX idx_al_user (user_id),
--     INDEX idx_al_action_time (action_type, created_at)
-- );


-- Sample Data (Optional, for testing - uncomment and modify as needed)
/*
INSERT INTO Users (full_name, email, password_hash, role) VALUES
('Admin User', 'admin@lablink.com', '$2a$10$yourbcryptgeneratedhash', 'admin'), -- Replace hash with a real one
('Faculty User', 'faculty@lablink.com', '$2a$10$yourbcryptgeneratedhash', 'faculty'),
('Student User', 'student@lablink.com', '$2a$10$yourbcryptgeneratedhash', 'student');

INSERT INTO Courses (name, department) VALUES
('Introduction to Programming', 'Computer Science'),
('Digital Electronics', 'Electrical Engineering');

INSERT INTO Sections (course_id, name, semester, year) VALUES
(1, 'Section A', 'Fall', 2023),
(2, 'Section B', 'Fall', 2023);

INSERT INTO Labs (name, room_number, capacity, type, is_available) VALUES
('Computer Lab 101', 'CL101', 30, 'Computer Lab', TRUE),
('Electronics Lab 202', 'EL202', 20, 'Electronics Lab', TRUE);
*/

-- End of Schema
